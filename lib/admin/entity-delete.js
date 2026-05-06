import { withTransaction } from "../db/client.js";
import {
  deleteEntityById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { deleteMediaFile } from "../media/storage.js";
import { collectMediaStorageKeys } from "../internal/test-data-cleanup.js";
import {
  buildGraphReferenceItem,
  isTestGraphEntry,
  listIncomingGraphEntries,
  loadDestructiveReferenceCatalog
} from "./destructive-graph.js";
import { getEntityAdminHref } from "./entity-links.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const DELETE_TOOL_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

const DELETE_TOOL_ENTITY_TYPE_SET = new Set(DELETE_TOOL_ENTITY_TYPES);

const ENTITY_LABELS_GENITIVE = Object.freeze({
  [ENTITY_TYPES.MEDIA_ASSET]: "медиафайла",
  [ENTITY_TYPES.GALLERY]: "коллекции",
  [ENTITY_TYPES.SERVICE]: "услуги",
  [ENTITY_TYPES.EQUIPMENT]: "техники",
  [ENTITY_TYPES.CASE]: "кейса",
  [ENTITY_TYPES.PAGE]: "страницы"
});

const ENTITY_LABELS_PREPOSITIONAL = Object.freeze({
  [ENTITY_TYPES.MEDIA_ASSET]: "медиафайле",
  [ENTITY_TYPES.GALLERY]: "коллекции",
  [ENTITY_TYPES.SERVICE]: "услуге",
  [ENTITY_TYPES.EQUIPMENT]: "технике",
  [ENTITY_TYPES.CASE]: "кейсе",
  [ENTITY_TYPES.PAGE]: "странице"
});

function dedupeReasons(reasons = []) {
  return [...new Set(reasons.filter(Boolean))];
}

function dedupeRefItems(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.entityType}:${item.entityId}:${item.state ?? ""}:${item.reason ?? ""}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function dedupeStateBlockers(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.kind}:${item.reason}:${item.href ?? ""}`;

    if (seen.has(key)) {
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
    || payload?.originalFilename
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function makePublishedReferenceReason(entityType) {
  return `Объект используется в опубликованной ${ENTITY_LABELS_PREPOSITIONAL[entityType] || "сущности"}.`;
}

function makeDraftReferenceReason(entityType) {
  return `Объект используется в рабочем черновике ${ENTITY_LABELS_GENITIVE[entityType] || "сущности"}.`;
}

async function collectReferenceDetails(targetEntityType, targetId, deps, db) {
  const ignoreIncomingEntityIdSet = new Set(
    (deps.ignoreIncomingEntityIds ?? [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  );
  const catalog = await loadDestructiveReferenceCatalog(deps, db);
  const publishedIncomingRefs = listIncomingGraphEntries(targetEntityType, targetId, catalog, {
    excludedSourceId: targetId,
    state: "published",
    filter: (entry) => !ignoreIncomingEntityIdSet.has(entry.sourceEntityId)
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makePublishedReferenceReason(entry.sourceEntityType)
  }));
  const draftIncomingRefs = listIncomingGraphEntries(targetEntityType, targetId, catalog, {
    excludedSourceId: targetId,
    state: "draft",
    filter: (entry) => !ignoreIncomingEntityIdSet.has(entry.sourceEntityId) && !isTestGraphEntry(entry)
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makeDraftReferenceReason(entry.sourceEntityType)
  }));

  const refs = {
    publishedIncomingRefs: dedupeRefItems(publishedIncomingRefs),
    draftIncomingRefs: dedupeRefItems(draftIncomingRefs)
  };

  return {
    ...refs,
    reasons: dedupeReasons([
      ...refs.publishedIncomingRefs.map((item) => item.reason),
      ...refs.draftIncomingRefs.map((item) => item.reason)
    ])
  };
}

function buildUnsupportedDecision(entityType, entityId) {
  return {
    entityId,
    entityType,
    exists: false,
    allowed: false,
    reasons: ["Удаление этого типа сущности пока не поддерживается."],
    publishedIncomingRefs: [],
    draftIncomingRefs: [],
    stateBlockers: [],
    root: null
  };
}

function buildNotFoundDecision(entityType, entityId) {
  return {
    entityId,
    entityType,
    exists: false,
    allowed: false,
    reasons: ["Сущность не найдена."],
    publishedIncomingRefs: [],
    draftIncomingRefs: [],
    stateBlockers: [],
    root: null
  };
}

export function isDeleteToolEntityTypeSupported(entityType) {
  return DELETE_TOOL_ENTITY_TYPE_SET.has(entityType);
}

export function getEntityDeletePreviewHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/delete`;
}

export async function assessEntityDelete(input, deps = {}) {
  const resolvedDeps = {
    getEntityAggregate,
    listPublishObligations,
    listEntityCards,
    listPublishedCards,
    ...deps
  };
  const db = deps.db ?? null;
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();
  const testOnly = Boolean(input.testOnly);

  if (!isDeleteToolEntityTypeSupported(entityType)) {
    return buildUnsupportedDecision(entityType, entityId);
  }

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
    return buildNotFoundDecision(entityType, entityId);
  }

  const latestRevision = aggregate.revisions?.[0] ?? null;
  const reasons = [];
  const stateBlockers = [];
  const openObligations = (await resolvedDeps.listPublishObligations(entityId, db))
    .filter((obligation) => obligation.status === "open");

  if (testOnly && !isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    const reason = "Объект не помечен как тестовый.";
    reasons.push(reason);
    stateBlockers.push({
      kind: "test_marker_missing",
      label: "Нет test marker",
      reason
    });
  }

  if (aggregate.entity.activePublishedRevisionId) {
    const reason = "У объекта есть действующая опубликованная версия.";
    reasons.push(reason);
    stateBlockers.push({
      kind: "published_truth",
      label: "Собственная опубликованная версия",
      reason
    });
  }

  if (entityType === ENTITY_TYPES.PAGE && (aggregate.revisions ?? []).some((revision) => revision.state === "published")) {
    const reason = "У страницы есть опубликованная версия в истории. Для таких страниц доступно снятие с live, а не hard delete.";
    reasons.push(reason);
    stateBlockers.push({
      kind: "published_history",
      label: "Есть опубликованная история",
      reason,
      href: getEntityAdminHref(entityType, entityId)
    });
  }

  for (const revision of aggregate.revisions ?? []) {
    if (revision.state !== "review") {
      continue;
    }

    const reason = "У объекта есть ревизия на проверке.";
    reasons.push(reason);
    stateBlockers.push({
      kind: "review_revision",
      label: `Ревизия №${revision.revisionNumber ?? "?"} на проверке`,
      reason,
      href: revision.id ? `/admin/review/${revision.id}` : null
    });
  }

  for (const obligation of openObligations) {
    const reason = "У объекта есть открытые обязательства по публикации.";
    reasons.push(reason);
    stateBlockers.push({
      kind: "open_obligation",
      label: obligation.obligationType
        ? `Открытое обязательство: ${obligation.obligationType}`
        : "Открытое publish-обязательство",
      reason,
      href: getEntityAdminHref(entityType, entityId)
    });
  }

  const incoming = await collectReferenceDetails(entityType, entityId, {
    ...resolvedDeps,
    ignoreIncomingEntityIds: input.ignoreIncomingEntityIds ?? []
  }, db);
  reasons.push(...incoming.reasons);

  return {
    entityId,
    entityType,
    exists: true,
    allowed: reasons.length === 0,
    reasons: dedupeReasons(reasons),
    publishedIncomingRefs: incoming.publishedIncomingRefs,
    draftIncomingRefs: incoming.draftIncomingRefs,
    stateBlockers: dedupeStateBlockers(stateBlockers),
    root: {
      entityId: aggregate.entity.id,
      entityType: aggregate.entity.entityType,
      creationOrigin: aggregate.entity.creationOrigin ?? null,
      label: labelFromPayload(latestRevision?.payload ?? {}, entityType, entityId),
      href: getEntityAdminHref(entityType, entityId),
      latestRevisionState: latestRevision?.state ?? null,
      activePublishedRevisionId: aggregate.entity.activePublishedRevisionId ?? null,
      openObligationsCount: openObligations.length,
      hasReviewRevision: (aggregate.revisions ?? []).some((revision) => revision.state === "review"),
      published: Boolean(aggregate.entity.activePublishedRevisionId),
      isTestData: isAgentTestCreationOrigin(aggregate.entity.creationOrigin)
    },
    entity: aggregate.entity,
    aggregate
  };
}

export async function deleteEntityWithSafety(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    deleteMediaFile,
    deleteEntityWithSafetyInDb,
    ...deps
  };

  const transactionResult = await resolvedDeps.withTransaction(async (db) => {
    return resolvedDeps.deleteEntityWithSafetyInDb(input, { ...deps, db });
  });

  if (transactionResult.deleted && transactionResult.storageKeys?.length > 0) {
    for (const storageKey of transactionResult.storageKeys) {
      try {
        await resolvedDeps.deleteMediaFile(storageKey);
      } catch {
        // Best-effort storage cleanup after DB delete.
      }
    }
  }

  return {
    ...transactionResult,
    reasons: transactionResult.decision?.reasons ?? []
  };
}

export async function deleteEntityWithSafetyInDb(input, deps = {}) {
  const resolvedDeps = {
    deleteEntityById,
    assessEntityDelete,
    recordDestructiveEvent,
    ...deps
  };
  const db = deps.db ?? null;
  const decision = await resolvedDeps.assessEntityDelete(input, { ...deps, db });
  const targetSnapshot = decision.root ?? {
    entityId: decision.entityId,
    entityType: decision.entityType,
    label: decision.entityId
  };

  if (!decision.allowed) {
    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.SAFE_DELETE_BLOCKED,
      correlationId: input.correlationId ?? null,
      operationKind: "safe_delete",
      outcome: "blocked",
      actorUserId: input.actorUserId ?? null,
      root: targetSnapshot,
      target: targetSnapshot,
      summary: "Безопасное удаление отклонено правилами безопасности.",
      details: {
        entityType: decision.entityType,
        entityId: decision.entityId,
        reasons: decision.reasons ?? [],
        stateBlockers: decision.stateBlockers ?? [],
        publishedIncomingRefs: decision.publishedIncomingRefs ?? [],
        draftIncomingRefs: decision.draftIncomingRefs ?? [],
        testOnly: Boolean(input.testOnly)
      }
    }, { db });

    return {
      deleted: false,
      decision,
      reasons: decision.reasons ?? [],
      storageKeys: []
    };
  }

  const storageKeys = decision.entityType === ENTITY_TYPES.MEDIA_ASSET
    ? collectMediaStorageKeys(decision.aggregate)
    : [];

  await resolvedDeps.deleteEntityById(decision.entityId, db);
  await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.SAFE_DELETE_EXECUTED,
      auditEntityId: null,
      correlationId: input.correlationId ?? null,
      operationKind: "safe_delete",
    outcome: "executed",
    actorUserId: input.actorUserId ?? null,
    root: targetSnapshot,
    target: targetSnapshot,
    summary: "Сущность удалена через безопасный destructive contour.",
    affectedEntities: [
      {
        entityId: decision.entityId,
        entityType: decision.entityType
      }
    ],
    details: {
      entityType: decision.entityType,
      entityId: decision.entityId,
      storageKeysPlanned: storageKeys,
      testOnly: Boolean(input.testOnly)
    }
  }, { db });

  return {
    deleted: true,
    decision,
    reasons: [],
    storageKeys
  };
}

export function buildDeleteBatchSummary(results = []) {
  const deleted = results.filter((item) => item.deleted);
  const refused = results.filter((item) => !item.deleted);
  const reasons = dedupeReasons(refused.flatMap((item) => item.reasons ?? []));

  return {
    deletedCount: deleted.length,
    refusedCount: refused.length,
    reasons
  };
}
