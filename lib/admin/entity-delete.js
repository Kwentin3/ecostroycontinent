import { withTransaction } from "../db/client.js";
import {
  deleteEntityById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { deleteMediaFile } from "../media/storage.js";
import { collectMediaStorageKeys } from "../internal/test-data-cleanup.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const DELETE_TOOL_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

const DELETE_TOOL_ENTITY_TYPE_SET = new Set(DELETE_TOOL_ENTITY_TYPES);

const ENTITY_LABELS_GENITIVE = Object.freeze({
  [ENTITY_TYPES.MEDIA_ASSET]: "медиафайла",
  [ENTITY_TYPES.SERVICE]: "услуги",
  [ENTITY_TYPES.CASE]: "кейса",
  [ENTITY_TYPES.PAGE]: "страницы",
  [ENTITY_TYPES.GALLERY]: "коллекции"
});

const ENTITY_LABELS_PREPOSITIONAL = Object.freeze({
  [ENTITY_TYPES.SERVICE]: "услуге",
  [ENTITY_TYPES.CASE]: "кейсе",
  [ENTITY_TYPES.PAGE]: "странице",
  [ENTITY_TYPES.GALLERY]: "коллекции"
});

const SOURCE_TYPES_BY_TARGET = Object.freeze({
  [ENTITY_TYPES.MEDIA_ASSET]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
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
  const mediaIds = new Set();
  const serviceIds = new Set();
  const caseIds = new Set();

  pushId(mediaIds, payload.primaryMediaAssetId);
  pushId(mediaIds, payload.hero?.mediaAssetId);
  pushArray(mediaIds, payload.mediaAssetIds);

  pushArray(serviceIds, payload.serviceIds);
  pushArray(serviceIds, payload.serviceCardIds);

  pushArray(caseIds, payload.caseIds);
  pushArray(caseIds, payload.caseCardIds);

  for (const block of payload.blocks ?? []) {
    pushId(mediaIds, block?.mediaAssetId);
    pushArray(mediaIds, block?.mediaAssetIds);
    pushArray(serviceIds, block?.serviceIds);
    pushArray(serviceIds, block?.serviceCardIds);
    pushArray(caseIds, block?.caseIds);
    pushArray(caseIds, block?.caseCardIds);
  }

  return { mediaIds, serviceIds, caseIds };
}

function referencesTarget(sourceEntityType, payload, targetEntityType, targetId) {
  switch (sourceEntityType) {
    case ENTITY_TYPES.GALLERY:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryAssetId === targetId || (payload?.assetIds ?? []).includes(targetId);
      }

      if (targetEntityType === ENTITY_TYPES.SERVICE || targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedEntityIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.SERVICE:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryMediaAssetId === targetId;
      }

      if (targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedCaseIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.CASE:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryMediaAssetId === targetId;
      }

      if (targetEntityType === ENTITY_TYPES.SERVICE) {
        return (payload?.serviceIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.PAGE: {
      const refs = collectPageReferences(payload);

      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return refs.mediaIds.has(targetId);
      }

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

function makePublishedReferenceReason(entityType) {
  return `Объект используется в опубликованной ${ENTITY_LABELS_PREPOSITIONAL[entityType] || "сущности"}.`;
}

function makeDraftReferenceReason(entityType) {
  return `Объект используется в рабочем черновике ${ENTITY_LABELS_GENITIVE[entityType] || "сущности"}.`;
}

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
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function getEntityAdminHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.GALLERY) {
    return `/admin/entities/media_asset?compose=collections&collection=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}

function buildIncomingRefItem(sourceEntityType, card, state) {
  const entityId = card?.entity?.id ?? card?.entityId ?? "";
  const payload = card?.latestRevision?.payload ?? card?.revision?.payload ?? {};

  return {
    entityType: sourceEntityType,
    entityId,
    label: labelFromPayload(payload, sourceEntityType, entityId),
    href: getEntityAdminHref(sourceEntityType, entityId),
    state,
    reason: state === "published"
      ? makePublishedReferenceReason(sourceEntityType)
      : makeDraftReferenceReason(sourceEntityType)
  };
}

async function collectReferenceDetails(targetEntityType, targetId, deps, db) {
  const publishedIncomingRefs = [];
  const draftIncomingRefs = [];
  const sourceTypes = SOURCE_TYPES_BY_TARGET[targetEntityType] ?? [];

  for (const sourceType of sourceTypes) {
    const [latestCards, publishedCards] = await Promise.all([
      deps.listEntityCards(sourceType, { db }),
      deps.listPublishedCards(sourceType, { db })
    ]);

    for (const published of publishedCards) {
      if (published.entityId === targetId) {
        continue;
      }

      if (referencesTarget(sourceType, published.revision?.payload ?? {}, targetEntityType, targetId)) {
        publishedIncomingRefs.push(buildIncomingRefItem(sourceType, published, "published"));
      }
    }

    for (const card of latestCards) {
      if (!card?.latestRevision || card.entity.id === targetId) {
        continue;
      }

      if (card.latestRevision.state === "published") {
        continue;
      }

      if (isAgentTestCreationOrigin(card.entity.creationOrigin)) {
        continue;
      }

      if (referencesTarget(sourceType, card.latestRevision.payload ?? {}, targetEntityType, targetId)) {
        draftIncomingRefs.push(buildIncomingRefItem(sourceType, card, "draft"));
      }
    }
  }

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

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
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

  const incoming = await collectReferenceDetails(entityType, entityId, resolvedDeps, db);
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
    ...deps
  };
  const db = deps.db ?? null;
  const decision = await resolvedDeps.assessEntityDelete(input, { ...deps, db });

  if (!decision.allowed) {
    return {
      deleted: false,
      decision,
      storageKeys: []
    };
  }

  const storageKeys = decision.entityType === ENTITY_TYPES.MEDIA_ASSET
    ? collectMediaStorageKeys(decision.aggregate)
    : [];

  await resolvedDeps.deleteEntityById(decision.entityId, db);

  return {
    deleted: true,
    decision,
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
