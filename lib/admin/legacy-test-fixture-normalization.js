import { withTransaction } from "../db/client.js";
import { recordAuditEvent } from "../content-ops/audit.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import { getEntityAggregate, listPublishObligations, updateEntityCreationOrigin } from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { isAgentTestCreationOrigin, ENTITY_CREATION_ORIGINS } from "./entity-origin.js";

export const LEGACY_TEST_FIXTURE_NORMALIZATION_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(LEGACY_TEST_FIXTURE_NORMALIZATION_ENTITY_TYPES);
const TARGET_SOURCE_TYPES = Object.freeze({
  [ENTITY_TYPES.PAGE]: [],
  [ENTITY_TYPES.SERVICE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.CASE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.PAGE]
});

function pushId(bucket, value) {
  const normalized = String(value ?? "").trim();

  if (normalized) {
    bucket.add(normalized);
  }
}

function pushArray(bucket, values = []) {
  for (const value of values ?? []) {
    pushId(bucket, value);
  }
}

function collectPageReferences(payload = {}) {
  const serviceIds = new Set();
  const caseIds = new Set();

  pushArray(serviceIds, payload.serviceIds);
  pushArray(serviceIds, payload.serviceCardIds);
  pushArray(caseIds, payload.caseIds);
  pushArray(caseIds, payload.caseCardIds);

  for (const block of payload.blocks ?? []) {
    pushArray(serviceIds, block?.serviceIds);
    pushArray(serviceIds, block?.serviceCardIds);
    pushArray(caseIds, block?.caseIds);
    pushArray(caseIds, block?.caseCardIds);
  }

  return { serviceIds, caseIds };
}

function referencesTarget(sourceEntityType, payload, targetEntityType, targetId) {
  switch (sourceEntityType) {
    case ENTITY_TYPES.GALLERY:
      if (targetEntityType === ENTITY_TYPES.SERVICE || targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedEntityIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.SERVICE:
      if (targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedCaseIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.CASE:
      if (targetEntityType === ENTITY_TYPES.SERVICE) {
        return (payload?.serviceIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.PAGE: {
      const refs = collectPageReferences(payload);

      if (targetEntityType === ENTITY_TYPES.SERVICE) {
        return refs.serviceIds.has(targetId);
      }

      if (targetEntityType === ENTITY_TYPES.CASE) {
        return refs.caseIds.has(targetId);
      }

      return false;
    }
    default:
      return false;
  }
}

function collectOutgoingInScopeRefs(entityType, payload = {}) {
  const refs = [];

  if (entityType === ENTITY_TYPES.PAGE) {
    const pageRefs = collectPageReferences(payload);

    for (const serviceId of pageRefs.serviceIds) {
      refs.push({ entityType: ENTITY_TYPES.SERVICE, entityId: serviceId });
    }

    for (const caseId of pageRefs.caseIds) {
      refs.push({ entityType: ENTITY_TYPES.CASE, entityId: caseId });
    }
  } else if (entityType === ENTITY_TYPES.SERVICE) {
    for (const caseId of payload.relatedCaseIds ?? []) {
      refs.push({ entityType: ENTITY_TYPES.CASE, entityId: String(caseId ?? "").trim() });
    }
  } else if (entityType === ENTITY_TYPES.CASE) {
    for (const serviceId of payload.serviceIds ?? []) {
      refs.push({ entityType: ENTITY_TYPES.SERVICE, entityId: String(serviceId ?? "").trim() });
    }
  }

  return dedupeRefs(refs.filter((ref) => ref.entityId));
}

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeRefs(refs = []) {
  const seen = new Set();
  const result = [];

  for (const ref of refs) {
    const key = `${ref.entityType}:${ref.entityId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(ref);
  }

  return result;
}

function getEntityAdminHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}`;
}

function labelFromPayload(payload = {}, entityType, entityId) {
  return payload?.title
    || payload?.h1
    || payload?.slug
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function buildIncomingRefItem(sourceType, card, state) {
  const payload = card?.latestRevision?.payload ?? card?.revision?.payload ?? {};
  const entityId = card?.entity?.id ?? card?.entityId ?? "";

  return {
    entityType: sourceType,
    entityId,
    label: labelFromPayload(payload, sourceType, entityId),
    href: sourceType === ENTITY_TYPES.GALLERY
      ? `/admin/entities/media_asset?compose=collections&collection=${entityId}`
      : getEntityAdminHref(sourceType, entityId),
    state
  };
}

function makePublishedIncomingReason(sourceType) {
  return `На объект ссылается опубликованная нетестовая ${ENTITY_TYPE_LABELS[sourceType]?.toLowerCase() || "сущность"}.`;
}

function makeDraftIncomingReason(sourceType) {
  return `На объект ссылается рабочий нетестовый черновик ${ENTITY_TYPE_LABELS[sourceType]?.toLowerCase() || "сущности"}.`;
}

async function collectIncomingReferences(targetEntityType, targetEntityId, deps, db) {
  const publishedIncomingRefs = [];
  const draftIncomingRefs = [];
  const blockers = [];
  const sourceTypes = TARGET_SOURCE_TYPES[targetEntityType] ?? [];

  for (const sourceType of sourceTypes) {
    const [latestCards, publishedCards] = await Promise.all([
      deps.listEntityCards(sourceType, { db }),
      deps.listPublishedCards(sourceType, { db })
    ]);

    for (const published of publishedCards) {
      if (published.entityId === targetEntityId) {
        continue;
      }

      if (!referencesTarget(sourceType, published.revision?.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      const item = buildIncomingRefItem(sourceType, published, "published");
      publishedIncomingRefs.push(item);
      blockers.push(makePublishedIncomingReason(sourceType));
    }

    for (const card of latestCards) {
      if (!card?.latestRevision || card.entity.id === targetEntityId) {
        continue;
      }

      if (card.latestRevision.state === "published") {
        continue;
      }

      if (isAgentTestCreationOrigin(card.entity.creationOrigin)) {
        continue;
      }

      if (!referencesTarget(sourceType, card.latestRevision.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      const item = buildIncomingRefItem(sourceType, card, "draft");
      draftIncomingRefs.push(item);
      blockers.push(makeDraftIncomingReason(sourceType));
    }
  }

  return {
    publishedIncomingRefs,
    draftIncomingRefs,
    blockers: dedupeStrings(blockers)
  };
}

async function collectRelatedTargets(entityType, aggregate, deps, db) {
  const latestPayload = aggregate.revisions?.[0]?.payload ?? {};
  const publishedPayload = aggregate.activePublishedRevision?.payload ?? {};
  const refs = dedupeRefs([
    ...collectOutgoingInScopeRefs(entityType, latestPayload),
    ...collectOutgoingInScopeRefs(entityType, publishedPayload)
  ]);

  const targets = [];

  for (const ref of refs) {
    const targetAggregate = await deps.getEntityAggregate(ref.entityId, db);

    if (!targetAggregate?.entity || targetAggregate.entity.entityType !== ref.entityType) {
      continue;
    }

    const latestRevision = targetAggregate.revisions?.[0] ?? null;
    const publishedRevision = targetAggregate.activePublishedRevision ?? null;
    const payload = latestRevision?.payload ?? publishedRevision?.payload ?? {};

    targets.push({
      entityType: ref.entityType,
      entityId: ref.entityId,
      label: labelFromPayload(payload, ref.entityType, ref.entityId),
      href: getEntityAdminHref(ref.entityType, ref.entityId),
      isTestData: isAgentTestCreationOrigin(targetAggregate.entity.creationOrigin),
      published: Boolean(targetAggregate.entity.activePublishedRevisionId),
      hasReviewRevision: (targetAggregate.revisions ?? []).some((revision) => revision.state === "review")
    });
  }

  return targets;
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

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
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

  const latestRevision = aggregate.revisions?.[0] ?? null;
  const openObligations = (await resolvedDeps.listPublishObligations(entityId, db))
    .filter((obligation) => obligation.status === "open");
  const blockers = [];
  const warnings = [];

  if (isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    blockers.push("Сущность уже помечена как тестовая.");
  }

  if (aggregate.entity.creationOrigin && !isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    blockers.push("Сущность уже имеет другую сохранённую метку и не может быть нормализована этим корректирующим срезом.");
  }

  const incoming = await collectIncomingReferences(entityType, entityId, resolvedDeps, db);
  blockers.push(...incoming.blockers);

  if (aggregate.entity.activePublishedRevisionId) {
    warnings.push("После пометки объект перестанет считаться обычной живой сущностью и должен будет разбираться через удаление тестового графа.");
  }

  if ((aggregate.revisions ?? []).some((revision) => revision.state === "review")) {
    warnings.push("Остаток проверки и публикации сохранится: снятие всё ещё будет честно заблокировано, пока объект участвует в потоке проверки и публикации.");
  }

  if (openObligations.length > 0) {
    warnings.push("Открытые publish-обязательства сохранятся: сама нормализация не снимает их автоматически.");
  }

  const relatedTargets = await collectRelatedTargets(entityType, aggregate, resolvedDeps, db);

  if (relatedTargets.some((target) => !target.isTestData)) {
    warnings.push("Связанный граф всё ещё смешанный: связанные Page/Service/Case без test marker нужно будет нормализовать отдельно перед teardown.");
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
    recordAuditEvent,
    ...deps
  };

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateLegacyTestFixtureNormalization(input, { ...deps, db });

    if (!evaluation.allowed) {
      return {
        executed: false,
        evaluation
      };
    }

    const entity = await resolvedDeps.updateEntityCreationOrigin(
      input.entityId,
      ENTITY_CREATION_ORIGINS.AGENT_TEST,
      input.actorUserId,
      db
    );

    await resolvedDeps.recordAuditEvent({
      entityId: input.entityId,
      revisionId: evaluation.root?.activePublishedRevisionId ?? null,
      actorUserId: input.actorUserId,
      eventKey: AUDIT_EVENT_KEYS.LEGACY_TEST_FIXTURE_NORMALIZED,
      summary: "Устаревший тестовый набор помечен как тестовый объект для пути снятия.",
      details: {
        entityType: input.entityType,
        previousCreationOrigin: evaluation.root?.creationOrigin ?? null,
        resultingCreationOrigin: ENTITY_CREATION_ORIGINS.AGENT_TEST,
        hadPublishedTruth: Boolean(evaluation.root?.published),
        hadReviewRevision: Boolean(evaluation.root?.hasReviewRevision),
        openObligationsCount: evaluation.root?.openObligationsCount ?? 0
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      entity
    };
  });
}
