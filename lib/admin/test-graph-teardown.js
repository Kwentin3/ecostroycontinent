import { withTransaction } from "../db/client.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import {
  clearEntityActivePublishedRevision,
  deleteEntityById,
  getEntityAggregate,
  listPublishObligations,
  markPublishObligationCompleted
} from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { collectMediaStorageKeys } from "../internal/test-data-cleanup.js";
import { deleteMediaFile } from "../media/storage.js";
import { deleteEntityWithSafetyInDb } from "./entity-delete.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const TEST_GRAPH_TEARDOWN_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.MEDIA_ASSET
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(TEST_GRAPH_TEARDOWN_ENTITY_TYPES);
const TARGET_SOURCE_TYPES = Object.freeze({
  [ENTITY_TYPES.MEDIA_ASSET]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.SERVICE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.CASE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.PAGE]: []
});
const DELETE_FALLBACK_PRIORITY = Object.freeze({
  [ENTITY_TYPES.PAGE]: 0,
  [ENTITY_TYPES.CASE]: 1,
  [ENTITY_TYPES.SERVICE]: 2,
  [ENTITY_TYPES.MEDIA_ASSET]: 3
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

function collectOutgoingReferences(entityType, payload = {}) {
  const refs = [];

  switch (entityType) {
    case ENTITY_TYPES.PAGE: {
      const pageRefs = collectPageReferences(payload);

      for (const mediaId of pageRefs.mediaIds) {
        refs.push({ entityType: ENTITY_TYPES.MEDIA_ASSET, entityId: mediaId });
      }

      for (const serviceId of pageRefs.serviceIds) {
        refs.push({ entityType: ENTITY_TYPES.SERVICE, entityId: serviceId });
      }

      for (const caseId of pageRefs.caseIds) {
        refs.push({ entityType: ENTITY_TYPES.CASE, entityId: caseId });
      }

      break;
    }
    case ENTITY_TYPES.SERVICE:
      pushOutgoingRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId);
      pushOutgoingRefs(refs, ENTITY_TYPES.CASE, payload.relatedCaseIds);
      break;
    case ENTITY_TYPES.CASE:
      pushOutgoingRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId);
      pushOutgoingRefs(refs, ENTITY_TYPES.SERVICE, payload.serviceIds);
      break;
    default:
      break;
  }

  return dedupeRefs(refs);
}

function pushOutgoingRef(refs, entityType, entityId) {
  const normalized = String(entityId ?? "").trim();

  if (normalized) {
    refs.push({ entityType, entityId: normalized });
  }
}

function pushOutgoingRefs(refs, entityType, entityIds = []) {
  for (const entityId of entityIds ?? []) {
    pushOutgoingRef(refs, entityType, entityId);
  }
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

function getEntityKey(entityType, entityId) {
  return `${entityType}:${entityId}`;
}

function isSupportedEntityType(entityType) {
  return SUPPORTED_ENTITY_TYPE_SET.has(entityType);
}

function labelFromPayload(payload = {}, entityType, entityId) {
  return payload?.title
    || payload?.h1
    || payload?.slug
    || payload?.originalFilename
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

export function getEntityAdminHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return `/admin/entities/media_asset?asset=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}

function makePublishedIncomingReason(sourceType) {
  return `На тестовый объект ссылается опубликованная нетестовая ${ENTITY_TYPE_LABELS[sourceType]?.toLowerCase() || "сущность"}.`;
}

function makeDraftIncomingReason(sourceType) {
  return `На тестовый объект ссылается рабочий нетестовый черновик ${ENTITY_TYPE_LABELS[sourceType]?.toLowerCase() || "сущности"}.`;
}

function makeOutgoingMixedReason(targetType) {
  return `Тестовый граф зависит от нетестовой ${ENTITY_TYPE_LABELS[targetType]?.toLowerCase() || "сущности"}.`;
}

function makeGalleryReason() {
  return "В графе есть зависимость через коллекцию, а Gallery не входит в teardown-срез.";
}

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeRefItems(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = [
      item.entityType,
      item.entityId,
      item.reason,
      item.state ?? ""
    ].join(":");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function buildReferenceItem({ entityType, entityId, payload = {}, href, state = null, reason }) {
  return {
    entityType,
    entityId,
    label: labelFromPayload(payload, entityType, entityId),
    href: href || getEntityAdminHref(entityType, entityId),
    state,
    reason
  };
}

function buildMemberSummary(aggregate, openObligations = []) {
  const latestRevision = aggregate.revisions?.[0] ?? null;
  const published = Boolean(aggregate.entity.activePublishedRevisionId);
  const publishedRevision = aggregate.activePublishedRevision ?? null;
  const payload = latestRevision?.payload ?? publishedRevision?.payload ?? {};

  return {
    entityId: aggregate.entity.id,
    entityType: aggregate.entity.entityType,
    label: labelFromPayload(payload, aggregate.entity.entityType, aggregate.entity.id),
    href: getEntityAdminHref(aggregate.entity.entityType, aggregate.entity.id),
    isTestData: isAgentTestCreationOrigin(aggregate.entity.creationOrigin),
    published,
    hasReviewRevision: (aggregate.revisions ?? []).some((revision) => revision.state === "review"),
    openObligationsCount: openObligations.filter((obligation) => obligation.status === "open").length,
    deactivatePublished: published,
    deleteAfterTeardown: true
  };
}

async function loadReferenceCatalog(deps, db) {
  const sourceTypes = [ENTITY_TYPES.PAGE, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE, ENTITY_TYPES.GALLERY];
  const latestByType = {};
  const publishedByType = {};

  for (const entityType of sourceTypes) {
    latestByType[entityType] = await deps.listEntityCards(entityType, { db });
    publishedByType[entityType] = await deps.listPublishedCards(entityType, { db });
  }

  return { latestByType, publishedByType };
}

async function loadAggregateCached(entityType, entityId, deps, db, cache) {
  const key = getEntityKey(entityType, entityId);

  if (!cache.has(key)) {
    cache.set(key, await deps.getEntityAggregate(entityId, db));
  }

  return cache.get(key);
}

async function evaluateIncomingReferences(targetEntityType, targetEntityId, deps, db, catalog) {
  const blockers = [];
  const blockingRefs = [];
  const nextRefs = [];
  const sourceTypes = TARGET_SOURCE_TYPES[targetEntityType] ?? [];

  for (const sourceType of sourceTypes) {
    for (const published of catalog.publishedByType[sourceType] ?? []) {
      if (published.entityId === targetEntityId) {
        continue;
      }

      if (!referencesTarget(sourceType, published.revision?.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      if (sourceType === ENTITY_TYPES.GALLERY) {
        const reason = makeGalleryReason();
        blockers.push(reason);
        blockingRefs.push(buildReferenceItem({
          entityType: sourceType,
          entityId: published.entityId,
          payload: published.revision?.payload ?? {},
          href: `/admin/entities/media_asset?compose=collections&collection=${published.entityId}`,
          state: "published",
          reason
        }));
        continue;
      }

      const sourceAggregate = await loadAggregateCached(sourceType, published.entityId, deps, db, catalog.aggregateCache);

      if (!sourceAggregate?.entity) {
        const reason = makePublishedIncomingReason(sourceType);
        blockers.push(reason);
        blockingRefs.push(buildReferenceItem({
          entityType: sourceType,
          entityId: published.entityId,
          payload: published.revision?.payload ?? {},
          state: "published",
          reason
        }));
        continue;
      }

      if (!isAgentTestCreationOrigin(sourceAggregate.entity.creationOrigin)) {
        const reason = makePublishedIncomingReason(sourceType);
        blockers.push(reason);
        blockingRefs.push(buildReferenceItem({
          entityType: sourceType,
          entityId: sourceAggregate.entity.id,
          payload: sourceAggregate.revisions?.[0]?.payload ?? sourceAggregate.activePublishedRevision?.payload ?? {},
          state: "published",
          reason
        }));
        continue;
      }

      nextRefs.push({
        entityType: sourceType,
        entityId: sourceAggregate.entity.id
      });
    }

    for (const card of catalog.latestByType[sourceType] ?? []) {
      if (!card?.latestRevision || card.entity.id === targetEntityId) {
        continue;
      }

      if (card.latestRevision.state === "published") {
        continue;
      }

      if (!referencesTarget(sourceType, card.latestRevision.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      if (sourceType === ENTITY_TYPES.GALLERY) {
        const reason = makeGalleryReason();
        blockers.push(reason);
        blockingRefs.push(buildReferenceItem({
          entityType: sourceType,
          entityId: card.entity.id,
          payload: card.latestRevision?.payload ?? {},
          href: `/admin/entities/media_asset?compose=collections&collection=${card.entity.id}`,
          state: "draft",
          reason
        }));
        continue;
      }

      if (!isAgentTestCreationOrigin(card.entity.creationOrigin)) {
        const reason = makeDraftIncomingReason(sourceType);
        blockers.push(reason);
        blockingRefs.push(buildReferenceItem({
          entityType: sourceType,
          entityId: card.entity.id,
          payload: card.latestRevision?.payload ?? {},
          state: "draft",
          reason
        }));
        continue;
      }

      nextRefs.push({
        entityType: sourceType,
        entityId: card.entity.id
      });
    }
  }

  return {
    blockers: dedupeStrings(blockers),
    blockingRefs: dedupeRefItems(blockingRefs),
    nextRefs: dedupeRefs(nextRefs)
  };
}

function buildDeletePlan(membersByKey) {
  const keys = [...membersByKey.keys()];
  const indegree = new Map(keys.map((key) => [key, 0]));
  const adjacency = new Map(keys.map((key) => [key, []]));

  for (const [memberKey, member] of membersByKey.entries()) {
    for (const ref of member.outgoingRefs ?? []) {
      const targetKey = getEntityKey(ref.entityType, ref.entityId);

      if (!membersByKey.has(targetKey)) {
        continue;
      }

      adjacency.get(memberKey).push(targetKey);
      indegree.set(targetKey, (indegree.get(targetKey) ?? 0) + 1);
    }
  }

  const ready = keys.filter((key) => (indegree.get(key) ?? 0) === 0);
  const ordered = [];

  while (ready.length > 0) {
    ready.sort((left, right) => compareMemberPriority(membersByKey.get(left), membersByKey.get(right)));
    const current = ready.shift();
    ordered.push(current);

    for (const targetKey of adjacency.get(current) ?? []) {
      indegree.set(targetKey, (indegree.get(targetKey) ?? 0) - 1);

      if ((indegree.get(targetKey) ?? 0) === 0) {
        ready.push(targetKey);
      }
    }
  }

  const remaining = keys
    .filter((key) => !ordered.includes(key))
    .sort((left, right) => compareMemberPriority(membersByKey.get(left), membersByKey.get(right)));

  return [...ordered, ...remaining].map((key) => {
    const member = membersByKey.get(key);

    return {
      entityId: member.entityId,
      entityType: member.entityType,
      label: member.label,
      published: member.published,
      deactivatePublished: member.deactivatePublished,
      deleteAfterTeardown: member.deleteAfterTeardown
    };
  });
}

function compareMemberPriority(left, right) {
  const leftRank = DELETE_FALLBACK_PRIORITY[left?.entityType] ?? 99;
  const rightRank = DELETE_FALLBACK_PRIORITY[right?.entityType] ?? 99;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return String(left?.label ?? "").localeCompare(String(right?.label ?? ""), "ru");
}

export function isTestGraphTeardownEntityTypeSupported(entityType) {
  return isSupportedEntityType(String(entityType ?? "").trim());
}

export function getTestGraphTeardownHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/test-graph-teardown`;
}

export async function evaluateTestGraphTeardown(input, deps = {}) {
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
  const blockers = [];
  const blockingRefs = [];
  const survivingRefs = [];

  if (!isSupportedEntityType(entityType)) {
    return {
      entityType,
      entityId,
      exists: false,
      allowed: false,
      blockers: ["Этот тип сущности не поддерживает удаление тестового графа."],
      members: [],
      deletePlan: []
    };
  }

  const rootAggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!rootAggregate?.entity || rootAggregate.entity.entityType !== entityType) {
    return {
      entityType,
      entityId,
      exists: false,
      allowed: false,
      blockers: ["Сущность не найдена."],
      members: [],
      deletePlan: []
    };
  }

  if (!isAgentTestCreationOrigin(rootAggregate.entity.creationOrigin)) {
    blockers.push("Корневой объект не помечен как тестовый.");
  }

  const catalog = await loadReferenceCatalog(resolvedDeps, db);
  catalog.aggregateCache = new Map([[getEntityKey(entityType, entityId), rootAggregate]]);

  const queue = [{ entityType, entityId }];
  const visited = new Set();
  const membersByKey = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    const memberKey = getEntityKey(current.entityType, current.entityId);

    if (visited.has(memberKey)) {
      continue;
    }

    visited.add(memberKey);

    const aggregate = await loadAggregateCached(current.entityType, current.entityId, resolvedDeps, db, catalog.aggregateCache);

    if (!aggregate?.entity || aggregate.entity.entityType !== current.entityType) {
      blockers.push("В тестовом графе встретилась отсутствующая или несовместимая сущность.");
      continue;
    }

    const obligations = await resolvedDeps.listPublishObligations(current.entityId, db);
    const member = buildMemberSummary(aggregate, obligations);
    const latestRevision = aggregate.revisions?.[0] ?? null;
    const publishedRevision = aggregate.activePublishedRevision ?? null;
    const outgoingRefs = dedupeRefs([
      ...collectOutgoingReferences(current.entityType, latestRevision?.payload ?? {}),
      ...collectOutgoingReferences(current.entityType, publishedRevision?.payload ?? {})
    ]);

    member.outgoingRefs = outgoingRefs;
    member.openObligations = obligations;
    membersByKey.set(memberKey, member);

    if (!member.isTestData) {
      const reason = "В графе есть route-owning сущность без test marker.";
      blockers.push(reason);
      blockingRefs.push({
        entityType: member.entityType,
        entityId: member.entityId,
        label: member.label,
        href: member.href,
        state: member.published ? "published" : (member.hasReviewRevision ? "review" : "draft"),
        reason
      });
      continue;
    }

    if (member.hasReviewRevision) {
      const reason = "Один из объектов графа участвует в review/publish-потоке и не может быть разобран автоматически.";
      blockers.push(reason);
      blockingRefs.push({
        entityType: member.entityType,
        entityId: member.entityId,
        label: member.label,
        href: member.href,
        state: "review",
        reason
      });
    }

    for (const ref of outgoingRefs) {
      const targetAggregate = await loadAggregateCached(ref.entityType, ref.entityId, resolvedDeps, db, catalog.aggregateCache);

      if (!targetAggregate?.entity || targetAggregate.entity.entityType !== ref.entityType) {
        continue;
      }

      if (!isAgentTestCreationOrigin(targetAggregate.entity.creationOrigin)) {
        const item = buildReferenceItem({
          entityType: ref.entityType,
          entityId: ref.entityId,
          payload: targetAggregate.revisions?.[0]?.payload ?? targetAggregate.activePublishedRevision?.payload ?? {},
          state: targetAggregate.entity.activePublishedRevisionId
            ? "published"
            : ((targetAggregate.revisions ?? []).some((revision) => revision.state === "review") ? "review" : "draft"),
          reason: makeOutgoingMixedReason(ref.entityType)
        });

        if (ref.entityType === ENTITY_TYPES.MEDIA_ASSET) {
          survivingRefs.push({
            ...item,
            reason: "Нетестовый медиафайл будет сохранён. Он не мешает teardown и не удаляется вместе с тестовым графом."
          });
          continue;
        }

        blockers.push(item.reason);
        blockingRefs.push(item);
        continue;
      }

      queue.push(ref);
    }

    const incoming = await evaluateIncomingReferences(current.entityType, current.entityId, resolvedDeps, db, catalog);
    blockers.push(...incoming.blockers);
    blockingRefs.push(...incoming.blockingRefs);

    for (const ref of incoming.nextRefs) {
      queue.push(ref);
    }
  }

  const deletePlan = blockers.length === 0 ? buildDeletePlan(membersByKey) : [];

  return {
    entityType,
    entityId,
    exists: true,
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    blockingRefs: dedupeRefItems(blockingRefs),
    survivingRefs: dedupeRefItems(survivingRefs),
    root: membersByKey.get(getEntityKey(entityType, entityId)) ?? null,
    members: [...membersByKey.values()].map((member) => ({
      entityId: member.entityId,
      entityType: member.entityType,
      label: member.label,
      href: member.href,
      isTestData: member.isTestData,
      published: member.published,
      hasReviewRevision: member.hasReviewRevision,
      openObligationsCount: member.openObligationsCount,
      openObligationIds: (member.openObligations ?? [])
        .filter((obligation) => obligation.status === "open")
        .map((obligation) => obligation.id),
      deactivatePublished: member.deactivatePublished,
      deleteAfterTeardown: member.deleteAfterTeardown
    })),
    deletePlan
  };
}

export async function executeTestGraphTeardown(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    clearEntityActivePublishedRevision,
    markPublishObligationCompleted,
    deleteEntityById,
    deleteMediaFile,
    evaluateTestGraphTeardown,
    deleteEntityWithSafetyInDb,
    ...deps
  };
  const storageKeys = [];

  const transactionResult = await resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateTestGraphTeardown(input, { ...deps, db });

    if (!evaluation.allowed) {
      return {
        executed: false,
        evaluation,
        deletedCount: 0
      };
    }

    for (const member of evaluation.members) {
      for (const obligationId of member.openObligationIds ?? []) {
        if (obligationId) {
          await resolvedDeps.markPublishObligationCompleted(obligationId, db);
        }
      }

      if (member.deactivatePublished) {
        await resolvedDeps.clearEntityActivePublishedRevision(member.entityId, input.actorUserId, db);
      }
    }

    for (const step of evaluation.deletePlan) {
      if (step.entityType === ENTITY_TYPES.PAGE) {
        await resolvedDeps.deleteEntityById(step.entityId, db);
        continue;
      }

      const deleteResult = await resolvedDeps.deleteEntityWithSafetyInDb({
        entityType: step.entityType,
        entityId: step.entityId,
        testOnly: true
      }, { ...deps, db });

      if (!deleteResult.deleted) {
        const message = deleteResult.reasons?.[0] || "Удаление тестового графа отклонено правилами безопасности.";
        throw new Error(message);
      }

      if (deleteResult.storageKeys?.length > 0) {
        storageKeys.push(...deleteResult.storageKeys);
      }
    }

    return {
      executed: true,
      evaluation,
      deletedCount: evaluation.deletePlan.length
    };
  });

  if (transactionResult.executed && storageKeys.length > 0) {
    for (const storageKey of storageKeys) {
      try {
        await resolvedDeps.deleteMediaFile(storageKey);
      } catch {
        // Best-effort storage cleanup after DB teardown.
      }
    }
  }

  return transactionResult;
}
