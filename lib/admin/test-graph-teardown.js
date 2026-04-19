import { withTransaction } from "../db/client.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../content-core/content-types.js";
import {
  clearEntityActivePublishedRevision,
  deleteEntityById,
  getEntityAggregate,
  listPublishObligations,
  markPublishObligationCompleted
} from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { createDestructiveCorrelationId, recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { collectMediaStorageKeys } from "../internal/test-data-cleanup.js";
import { deleteMediaFile } from "../media/storage.js";
import {
  collectOutgoingGraphTargets,
  isTestGraphEntry,
  listIncomingGraphEntries,
  loadDestructiveReferenceCatalog
} from "./destructive-graph.js";
import { deleteEntityWithSafetyInDb } from "./entity-delete.js";
import { getEntityAdminHref } from "./entity-links.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const TEST_GRAPH_TEARDOWN_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.MEDIA_ASSET
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(TEST_GRAPH_TEARDOWN_ENTITY_TYPES);
const DELETE_FALLBACK_PRIORITY = Object.freeze({
  [ENTITY_TYPES.PAGE]: 0,
  [ENTITY_TYPES.SERVICE]: 1,
  [ENTITY_TYPES.EQUIPMENT]: 2,
  [ENTITY_TYPES.CASE]: 3,
  [ENTITY_TYPES.GALLERY]: 4,
  [ENTITY_TYPES.MEDIA_ASSET]: 5
});
const SURVIVING_SHARED_TYPES = new Set([
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY
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

function getLowerLabel(entityType) {
  return (ENTITY_TYPE_LABELS[entityType] || entityType).toLowerCase();
}

function makePublishedIncomingReason(sourceType) {
  return `На тестовый объект ссылается опубликованная нетестовая ${getLowerLabel(sourceType)}.`;
}

function makeDraftIncomingReason(sourceType) {
  return `На тестовый объект ссылается рабочий нетестовый черновик ${getLowerLabel(sourceType)}.`;
}

function makeOutgoingMixedReason(targetType) {
  return `Тестовый граф зависит от нетестовой ${getLowerLabel(targetType)}.`;
}

function makeOutgoingSharedReason(targetType) {
  return `Нетестовая ${getLowerLabel(targetType)} будет сохранена как shared node и не удаляется вместе с тестовым графом.`;
}

function buildReferenceItem({ entityType, entityId, payload = {}, state = null, reason }) {
  return {
    entityType,
    entityId,
    label: labelFromPayload(payload, entityType, entityId),
    href: getEntityAdminHref(entityType, entityId),
    state,
    reason
  };
}

function buildMemberSummary(aggregate, openObligations = []) {
  const latestRevision = aggregate.revisions?.[0] ?? null;
  const publishedRevision = aggregate.activePublishedRevision ?? null;
  const payload = latestRevision?.payload ?? publishedRevision?.payload ?? {};

  return {
    entityId: aggregate.entity.id,
    entityType: aggregate.entity.entityType,
    label: labelFromPayload(payload, aggregate.entity.entityType, aggregate.entity.id),
    href: getEntityAdminHref(aggregate.entity.entityType, aggregate.entity.id),
    isTestData: isAgentTestCreationOrigin(aggregate.entity.creationOrigin),
    published: Boolean(aggregate.entity.activePublishedRevisionId),
    hasReviewRevision: (aggregate.revisions ?? []).some((revision) => revision.state === "review"),
    openObligationsCount: openObligations.filter((obligation) => obligation.status === "open").length,
    deactivatePublished: Boolean(aggregate.entity.activePublishedRevisionId),
    deleteAfterTeardown: true
  };
}

function compareMemberPriority(left, right) {
  const leftRank = DELETE_FALLBACK_PRIORITY[left?.entityType] ?? 99;
  const rightRank = DELETE_FALLBACK_PRIORITY[right?.entityType] ?? 99;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return String(left?.label ?? "").localeCompare(String(right?.label ?? ""), "ru");
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

  const catalog = await loadDestructiveReferenceCatalog(resolvedDeps, db);
  const aggregateCache = new Map([[getEntityKey(entityType, entityId), rootAggregate]]);
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

    let aggregate = aggregateCache.get(memberKey) ?? null;

    if (!aggregate) {
      aggregate = await resolvedDeps.getEntityAggregate(current.entityId, db);
      aggregateCache.set(memberKey, aggregate);
    }

    if (!aggregate?.entity || aggregate.entity.entityType !== current.entityType) {
      blockers.push("В тестовом графе встретилась отсутствующая или несовместимая сущность.");
      continue;
    }

    const obligations = await resolvedDeps.listPublishObligations(current.entityId, db);
    const member = buildMemberSummary(aggregate, obligations);
    const outgoingRefs = collectOutgoingGraphTargets(current.entityType, aggregate);

    member.outgoingRefs = outgoingRefs;
    member.openObligations = obligations;
    membersByKey.set(memberKey, member);

    if (!member.isTestData) {
      const reason = "В графе есть сущность без test marker.";
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
      const targetKey = getEntityKey(ref.entityType, ref.entityId);
      let targetAggregate = aggregateCache.get(targetKey) ?? null;

      if (!targetAggregate) {
        targetAggregate = await resolvedDeps.getEntityAggregate(ref.entityId, db);
        aggregateCache.set(targetKey, targetAggregate);
      }

      if (!targetAggregate?.entity || targetAggregate.entity.entityType !== ref.entityType) {
        continue;
      }

      const targetPayload = targetAggregate.revisions?.[0]?.payload ?? targetAggregate.activePublishedRevision?.payload ?? {};

      if (!isAgentTestCreationOrigin(targetAggregate.entity.creationOrigin)) {
        const item = buildReferenceItem({
          entityType: ref.entityType,
          entityId: ref.entityId,
          payload: targetPayload,
          state: targetAggregate.entity.activePublishedRevisionId
            ? "published"
            : ((targetAggregate.revisions ?? []).some((revision) => revision.state === "review") ? "review" : "draft"),
          reason: SURVIVING_SHARED_TYPES.has(ref.entityType)
            ? makeOutgoingSharedReason(ref.entityType)
            : makeOutgoingMixedReason(ref.entityType)
        });

        if (SURVIVING_SHARED_TYPES.has(ref.entityType)) {
          survivingRefs.push(item);
          continue;
        }

        blockers.push(item.reason);
        blockingRefs.push(item);
        continue;
      }

      queue.push(ref);
    }

    const publishedIncoming = listIncomingGraphEntries(current.entityType, current.entityId, catalog, {
      excludedSourceId: current.entityId,
      state: "published"
    });
    const draftIncoming = listIncomingGraphEntries(current.entityType, current.entityId, catalog, {
      excludedSourceId: current.entityId,
      state: "draft"
    });

    for (const entry of publishedIncoming) {
      if (isTestGraphEntry(entry)) {
        queue.push({ entityType: entry.sourceEntityType, entityId: entry.sourceEntityId });
        continue;
      }

      const item = buildReferenceItem({
        entityType: entry.sourceEntityType,
        entityId: entry.sourceEntityId,
        payload: { title: entry.sourceLabel },
        state: "published",
        reason: makePublishedIncomingReason(entry.sourceEntityType)
      });
      blockers.push(item.reason);
      blockingRefs.push(item);
    }

    for (const entry of draftIncoming) {
      if (isTestGraphEntry(entry)) {
        queue.push({ entityType: entry.sourceEntityType, entityId: entry.sourceEntityId });
        continue;
      }

      const item = buildReferenceItem({
        entityType: entry.sourceEntityType,
        entityId: entry.sourceEntityId,
        payload: { title: entry.sourceLabel },
        state: "draft",
        reason: makeDraftIncomingReason(entry.sourceEntityType)
      });
      blockers.push(item.reason);
      blockingRefs.push(item);
    }
  }

  const deletePlan = blockers.length === 0 ? buildDeletePlan(membersByKey) : [];

  return {
    entityType,
    entityId,
    exists: true,
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    blockingRefs: dedupeItems(blockingRefs, (item) => `${item.entityType}:${item.entityId}:${item.state}:${item.reason}`),
    survivingRefs: dedupeItems(survivingRefs, (item) => `${item.entityType}:${item.entityId}:${item.reason}`),
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
    recordDestructiveEvent,
    ...deps
  };
  const storageKeys = [];
  const correlationId = input.correlationId ?? createDestructiveCorrelationId();

  const transactionResult = await resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateTestGraphTeardown(input, { ...deps, db });
    const rootSnapshot = {
      entityId: evaluation.root?.entityId ?? input.entityId,
      entityType: evaluation.root?.entityType ?? input.entityType,
      label: evaluation.root?.label ?? input.entityId
    };

    if (!evaluation.allowed) {
      await resolvedDeps.recordDestructiveEvent({
        auditEventKey: AUDIT_EVENT_KEYS.TEST_GRAPH_TEARDOWN_BLOCKED,
        correlationId,
        operationKind: "test_graph_teardown",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Удаление тестового графа отклонено правилами безопасности.",
        details: {
          entityType: evaluation.entityType,
          entityId: evaluation.entityId,
          blockers: evaluation.blockers ?? [],
          blockingRefs: evaluation.blockingRefs ?? [],
          survivingRefs: evaluation.survivingRefs ?? [],
          members: evaluation.members ?? [],
          deletePlan: evaluation.deletePlan ?? []
        }
      }, { db });

      return {
        executed: false,
        evaluation,
        deletedCount: 0
      };
    }

    const deactivatedPublishedIds = [];
    const completedObligationIds = [];

    for (const member of evaluation.members) {
      for (const obligationId of member.openObligationIds ?? []) {
        if (!obligationId) {
          continue;
        }

        await resolvedDeps.markPublishObligationCompleted(obligationId, db);
        completedObligationIds.push(obligationId);
      }

      if (member.deactivatePublished) {
        await resolvedDeps.clearEntityActivePublishedRevision(member.entityId, input.actorUserId, db);
        deactivatedPublishedIds.push(member.entityId);
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
        testOnly: true,
        actorUserId: input.actorUserId ?? null,
        correlationId
      }, { ...deps, db });

      if (!deleteResult.deleted) {
        const message = deleteResult.reasons?.[0] || "Удаление тестового графа отклонено правилами безопасности.";
        throw new Error(message);
      }

      if (deleteResult.storageKeys?.length > 0) {
        storageKeys.push(...deleteResult.storageKeys);
      }
    }

    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.TEST_GRAPH_TEARDOWN_EXECUTED,
      correlationId,
      operationKind: "test_graph_teardown",
      outcome: "executed",
      actorUserId: input.actorUserId ?? null,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Тестовый граф удалён через unified destructive contour.",
      affectedEntities: evaluation.members.map((member) => ({
        entityId: member.entityId,
        entityType: member.entityType
      })),
      details: {
        deletePlan: evaluation.deletePlan,
        members: evaluation.members,
        completedObligationIds: dedupeStrings(completedObligationIds),
        deactivatedPublishedIds: dedupeStrings(deactivatedPublishedIds),
        storageKeysPlanned: [...new Set(storageKeys)]
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      deletedCount: evaluation.deletePlan.length
    };
  });

  if (transactionResult.executed && storageKeys.length > 0) {
    for (const storageKey of [...new Set(storageKeys)]) {
      try {
        await resolvedDeps.deleteMediaFile(storageKey);
      } catch {
        // Best-effort storage cleanup after DB teardown.
      }
    }
  }

  return transactionResult;
}
