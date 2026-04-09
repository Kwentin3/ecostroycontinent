import { withTransaction } from "../db/client.js";
import {
  deleteEntityById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { ENTITY_TYPES } from "../content-core/content-types.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { deleteMediaFile } from "../media/storage.js";
import { collectMediaStorageKeys } from "../internal/test-data-cleanup.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const DELETE_TOOL_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE
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

async function collectReferenceReasons(targetEntityType, targetId, deps, db) {
  const reasons = [];
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
        reasons.push(makePublishedReferenceReason(sourceType));
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
        reasons.push(makeDraftReferenceReason(sourceType));
      }
    }
  }

  return dedupeReasons(reasons);
}

export function isDeleteToolEntityTypeSupported(entityType) {
  return DELETE_TOOL_ENTITY_TYPE_SET.has(entityType);
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
      reasons: ["Удаление этого типа сущности пока не поддерживается."]
    };
  }

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
    return {
      entityId,
      entityType,
      exists: false,
      allowed: false,
      reasons: ["Сущность не найдена."]
    };
  }

  const reasons = [];
  const openObligations = (await resolvedDeps.listPublishObligations(entityId, db))
    .filter((obligation) => obligation.status === "open");

  if (testOnly && !isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    reasons.push("Объект не помечен как тестовый.");
  }

  if (aggregate.entity.activePublishedRevisionId) {
    reasons.push("Сущность опубликована и участвует в живом контуре.");
  }

  if ((aggregate.revisions ?? []).some((revision) => revision.state === "review")) {
    reasons.push("Объект участвует в review/publish-потоке.");
  }

  if (openObligations.length > 0) {
    reasons.push("Объект участвует в review/publish-потоке.");
  }

  reasons.push(...(await collectReferenceReasons(entityType, entityId, resolvedDeps, db)));

  return {
    entityId,
    entityType,
    exists: true,
    allowed: reasons.length === 0,
    reasons: dedupeReasons(reasons),
    entity: aggregate.entity,
    aggregate
  };
}

export async function deleteEntityWithSafety(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    deleteEntityById,
    deleteMediaFile,
    assessEntityDelete,
    ...deps
  };

  let storageKeys = [];
  let decision = null;

  const transactionResult = await resolvedDeps.withTransaction(async (db) => {
    decision = await resolvedDeps.assessEntityDelete(input, { ...deps, db });

    if (!decision.allowed) {
      return {
        deleted: false,
        decision
      };
    }

    if (decision.entityType === ENTITY_TYPES.MEDIA_ASSET) {
      storageKeys = collectMediaStorageKeys(decision.aggregate);
    }

    await resolvedDeps.deleteEntityById(decision.entityId, db);

    return {
      deleted: true,
      decision
    };
  });

  if (transactionResult.deleted && storageKeys.length > 0) {
    for (const storageKey of storageKeys) {
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
