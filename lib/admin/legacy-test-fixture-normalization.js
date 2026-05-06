import { withTransaction } from "../db/client.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import {
  getEntityAggregate,
  listPublishObligations,
  updateEntityCreationOrigin
} from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import {
  createDestructiveCorrelationId,
  recordDestructiveEvent
} from "../content-ops/destructive-forensics.js";
import {
  buildGraphReferenceItem,
  collectOutgoingGraphTargets,
  isTestGraphEntry,
  listIncomingGraphEntries,
  loadDestructiveReferenceCatalog
} from "./destructive-graph.js";
import { getEntityAdminHref } from "./entity-links.js";
import { ENTITY_CREATION_ORIGINS, isAgentTestCreationOrigin } from "./entity-origin.js";

export const LEGACY_TEST_FIXTURE_NORMALIZATION_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(LEGACY_TEST_FIXTURE_NORMALIZATION_ENTITY_TYPES);
const NORMALIZATION_GRAPH_ENTITY_TYPE_SET = new Set([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE
]);

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeItems(items = [], keyBuilder) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyBuilder(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function labelFromPayload(payload = {}, entityType, entityId) {
  return payload?.title
    || payload?.h1
    || payload?.slug
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function getPublishedNoun(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.PAGE:
      return "страница";
    case ENTITY_TYPES.SERVICE:
      return "услуга";
    case ENTITY_TYPES.CASE:
      return "кейс";
    case ENTITY_TYPES.EQUIPMENT:
      return "техника";
    case ENTITY_TYPES.GALLERY:
      return "коллекция";
    default:
      return "сущность";
  }
}

function getGenitiveNoun(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.PAGE:
      return "страницы";
    case ENTITY_TYPES.SERVICE:
      return "услуги";
    case ENTITY_TYPES.CASE:
      return "кейса";
    case ENTITY_TYPES.EQUIPMENT:
      return "техники";
    case ENTITY_TYPES.GALLERY:
      return "коллекции";
    default:
      return "сущности";
  }
}

function makeIncomingReason(sourceEntityType, state) {
  if (state === "published") {
    return `На объект ссылается опубликованная нетестовая ${getPublishedNoun(sourceEntityType)}.`;
  }

  return `На объект ссылается рабочий нетестовый черновик ${getGenitiveNoun(sourceEntityType)}.`;
}

function buildUnsupportedResult(entityType, entityId) {
  return {
    entityType,
    entityId,
    exists: false,
    allowed: false,
    blockers: ["Этот тип сущности не поддерживает нормализацию устаревшего тестового набора."],
    warnings: [],
    publishedIncomingRefs: [],
    draftIncomingRefs: [],
    relatedTargets: [],
    root: null
  };
}

function buildNotFoundResult(entityType, entityId) {
  return {
    entityType,
    entityId,
    exists: false,
    allowed: false,
    blockers: ["Сущность не найдена."],
    warnings: [],
    publishedIncomingRefs: [],
    draftIncomingRefs: [],
    relatedTargets: [],
    root: null
  };
}

async function collectIncomingReferences(targetEntityType, targetEntityId, deps, db) {
  const catalog = await loadDestructiveReferenceCatalog(deps, db);
  const publishedIncomingRefs = listIncomingGraphEntries(targetEntityType, targetEntityId, catalog, {
    excludedSourceId: targetEntityId,
    state: "published",
    filter: (entry) => !isTestGraphEntry(entry)
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makeIncomingReason(entry.sourceEntityType, "published")
  }));
  const draftIncomingRefs = listIncomingGraphEntries(targetEntityType, targetEntityId, catalog, {
    excludedSourceId: targetEntityId,
    state: "draft",
    filter: (entry) => !isTestGraphEntry(entry)
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makeIncomingReason(entry.sourceEntityType, "draft")
  }));

  return {
    publishedIncomingRefs: dedupeItems(
      publishedIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}:${item.reason}`
    ),
    draftIncomingRefs: dedupeItems(
      draftIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}:${item.reason}`
    ),
    blockers: dedupeStrings([
      ...publishedIncomingRefs.map((item) => item.reason),
      ...draftIncomingRefs.map((item) => item.reason)
    ])
  };
}

async function collectRelatedTargets(entityType, aggregate, deps, db) {
  const outgoingTargets = collectOutgoingGraphTargets(entityType, aggregate)
    .filter((ref) => NORMALIZATION_GRAPH_ENTITY_TYPE_SET.has(ref.entityType));
  const relatedTargets = [];

  for (const ref of outgoingTargets) {
    const targetAggregate = await deps.getEntityAggregate(ref.entityId, db);

    if (!targetAggregate?.entity || targetAggregate.entity.entityType !== ref.entityType) {
      continue;
    }

    const latestRevision = targetAggregate.revisions?.[0] ?? null;
    const publishedRevision = targetAggregate.activePublishedRevision ?? null;
    const payload = latestRevision?.payload ?? publishedRevision?.payload ?? {};

    relatedTargets.push({
      entityType: ref.entityType,
      entityId: ref.entityId,
      label: labelFromPayload(payload, ref.entityType, ref.entityId),
      href: getEntityAdminHref(ref.entityType, ref.entityId),
      isTestData: isAgentTestCreationOrigin(targetAggregate.entity.creationOrigin),
      published: Boolean(targetAggregate.entity.activePublishedRevisionId),
      hasReviewRevision: (targetAggregate.revisions ?? []).some((revision) => revision.state === "review")
    });
  }

  return dedupeItems(
    relatedTargets,
    (item) => `${item.entityType}:${item.entityId}`
  );
}

export function isLegacyTestFixtureNormalizationEntityTypeSupported(entityType) {
  return SUPPORTED_ENTITY_TYPE_SET.has(String(entityType ?? "").trim());
}

export function getLegacyTestFixtureNormalizationHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/normalize-test-fixture`;
}

export async function evaluateLegacyTestFixtureNormalization(input, deps = {}) {
  const resolvedDeps = {
    getEntityAggregate,
    listEntityCards,
    listPublishedCards,
    listPublishObligations,
    ...deps
  };
  const db = deps.db ?? null;
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();

  if (!isLegacyTestFixtureNormalizationEntityTypeSupported(entityType)) {
    return buildUnsupportedResult(entityType, entityId);
  }

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
    return buildNotFoundResult(entityType, entityId);
  }

  const latestRevision = aggregate.revisions?.[0] ?? null;
  const openObligations = (await resolvedDeps.listPublishObligations(entityId, db))
    .filter((obligation) => obligation.status === "open");
  const blockers = [];
  const warnings = [];

  if (isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    blockers.push("Сущность уже помечена как тестовая.");
  }

  if (aggregate.entity.creationOrigin && !isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    blockers.push("У сущности уже есть другая сохраненная метка происхождения. Ее нельзя переписывать через этот экран нормализации.");
  }

  const incoming = await collectIncomingReferences(entityType, entityId, resolvedDeps, db);
  blockers.push(...incoming.blockers);

  if (aggregate.entity.activePublishedRevisionId) {
    warnings.push("После нормализации объект будет считаться тестовым, но опубликованная версия останется активной, пока вы не разберете граф через безопасный контур удаления.");
  }

  if ((aggregate.revisions ?? []).some((revision) => revision.state === "review")) {
    warnings.push("Ревизии на проверке останутся на месте. Нормализация не обходит дисциплину проверки и публикации и не снимает остатки процесса автоматически.");
  }

  if (openObligations.length > 0) {
    warnings.push("Открытые publish-обязательства останутся на месте. Их нужно будет закрыть отдельно перед удалением, если они продолжают блокировать граф.");
  }

  const relatedTargets = await collectRelatedTargets(entityType, aggregate, resolvedDeps, db);

  if (relatedTargets.some((target) => !target.isTestData)) {
    warnings.push("Связанный граф сущностей с собственным маршрутом все еще смешанный: связанные Page/Service/Case без тестовой метки нужно нормализовать отдельно перед удалением.");
  }

  return {
    entityType,
    entityId,
    exists: true,
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    warnings: dedupeStrings(warnings),
    publishedIncomingRefs: incoming.publishedIncomingRefs,
    draftIncomingRefs: incoming.draftIncomingRefs,
    relatedTargets,
    root: {
      entityId: aggregate.entity.id,
      entityType: aggregate.entity.entityType,
      creationOrigin: aggregate.entity.creationOrigin ?? null,
      label: labelFromPayload(aggregate.activePublishedRevision?.payload ?? latestRevision?.payload ?? {}, entityType, entityId),
      href: getEntityAdminHref(entityType, entityId),
      latestRevisionState: latestRevision?.state ?? null,
      activePublishedRevisionId: aggregate.entity.activePublishedRevisionId ?? null,
      openObligationsCount: openObligations.length,
      hasReviewRevision: (aggregate.revisions ?? []).some((revision) => revision.state === "review"),
      published: Boolean(aggregate.entity.activePublishedRevisionId),
      resultingCreationOrigin: ENTITY_CREATION_ORIGINS.AGENT_TEST
    }
  };
}

export async function executeLegacyTestFixtureNormalization(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    evaluateLegacyTestFixtureNormalization,
    updateEntityCreationOrigin,
    recordDestructiveEvent,
    ...deps
  };
  const correlationId = input.correlationId || createDestructiveCorrelationId();

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateLegacyTestFixtureNormalization(input, { ...deps, db });
    const rootSnapshot = {
      entityId: evaluation.root?.entityId ?? input.entityId,
      entityType: evaluation.root?.entityType ?? input.entityType,
      label: evaluation.root?.label ?? input.entityId
    };

    if (!evaluation.allowed) {
      await resolvedDeps.recordDestructiveEvent({
        correlationId,
        operationKind: "legacy_test_fixture_normalization",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Нормализация устаревшего тестового набора отклонена правилами безопасности.",
        details: {
          entityType: evaluation.entityType,
          entityId: evaluation.entityId,
          blockers: evaluation.blockers ?? [],
          warnings: evaluation.warnings ?? [],
          publishedIncomingRefs: evaluation.publishedIncomingRefs ?? [],
          draftIncomingRefs: evaluation.draftIncomingRefs ?? [],
          relatedTargets: evaluation.relatedTargets ?? [],
          previousCreationOrigin: evaluation.root?.creationOrigin ?? null,
          resultingCreationOrigin: evaluation.root?.resultingCreationOrigin ?? ENTITY_CREATION_ORIGINS.AGENT_TEST
        }
      }, { db });

      return {
        executed: false,
        evaluation,
        correlationId
      };
    }

    const entity = await resolvedDeps.updateEntityCreationOrigin(
      input.entityId,
      ENTITY_CREATION_ORIGINS.AGENT_TEST,
      input.actorUserId,
      db
    );

    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.LEGACY_TEST_FIXTURE_NORMALIZED,
      correlationId,
      operationKind: "legacy_test_fixture_normalization",
      outcome: "executed",
      actorUserId: input.actorUserId ?? null,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Сущность помечена как устаревший тестовый набор для безопасного контура удаления.",
      affectedEntities: [
        {
          entityId: input.entityId,
          entityType: input.entityType
        }
      ],
      details: {
        entityType: input.entityType,
        previousCreationOrigin: evaluation.root?.creationOrigin ?? null,
        resultingCreationOrigin: ENTITY_CREATION_ORIGINS.AGENT_TEST,
        hadPublishedTruth: Boolean(evaluation.root?.published),
        hadReviewRevision: Boolean(evaluation.root?.hasReviewRevision),
        openObligationsCount: evaluation.root?.openObligationsCount ?? 0,
        warnings: evaluation.warnings ?? [],
        relatedTargets: evaluation.relatedTargets ?? []
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      entity,
      correlationId
    };
  });
}
