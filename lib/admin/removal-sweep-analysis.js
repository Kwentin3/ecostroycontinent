import { withTransaction } from "../db/client.js";
import { recordAuditEvent } from "../content-ops/audit.js";
import { createDestructiveCorrelationId, recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { deleteMediaFile } from "../media/storage.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import {
  deleteEntityById,
  findEntityById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../content-core/content-types.js";
import { collectEntityReferenceRecords, referencesTarget } from "../content-core/entity-references.js";
import { deleteEntityWithSafetyInDb } from "./entity-delete.js";
import { REMOVAL_QUARANTINE_ENTITY_TYPES, isEntityMarkedForRemoval, isRemovalQuarantineEntityTypeSupported } from "./removal-quarantine.js";

const SOURCE_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

const COMPONENT_ROOT_PRIORITY = Object.freeze({
  [ENTITY_TYPES.PAGE]: 0,
  [ENTITY_TYPES.SERVICE]: 1,
  [ENTITY_TYPES.EQUIPMENT]: 2,
  [ENTITY_TYPES.CASE]: 3,
  [ENTITY_TYPES.GALLERY]: 4,
  [ENTITY_TYPES.MEDIA_ASSET]: 5
});

const PURGE_ORDER_PRIORITY = Object.freeze({
  [ENTITY_TYPES.PAGE]: 0,
  [ENTITY_TYPES.SERVICE]: 1,
  [ENTITY_TYPES.EQUIPMENT]: 2,
  [ENTITY_TYPES.CASE]: 3,
  [ENTITY_TYPES.GALLERY]: 4,
  [ENTITY_TYPES.MEDIA_ASSET]: 5
});

function getEntityAdminHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.GALLERY) {
    return `/admin/entities/media_asset?compose=collections&collection=${entityId}`;
  }

  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return `/admin/entities/media_asset?asset=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}

function getCardLabel(cardLike) {
  const payload = cardLike?.latestRevision?.payload
    ?? cardLike?.revision?.payload
    ?? cardLike?.activePublishedRevision?.payload
    ?? {};
  const entityId = cardLike?.entity?.id ?? cardLike?.entityId ?? "";

  return payload.title || payload.h1 || payload.slug || payload.originalFilename || entityId;
}

function makeIncomingRefItem(sourceType, source, state, reason) {
  const entityId = source?.entity?.id ?? source?.entityId ?? "";

  return {
    entityType: sourceType,
    entityId,
    label: getCardLabel(source),
    href: getEntityAdminHref(sourceType, entityId),
    state,
    reason
  };
}

function makeOutgoingRefItem(entity, label) {
  return {
    entityType: entity.entityType,
    entityId: entity.id,
    label,
    href: getEntityAdminHref(entity.entityType, entity.id)
  };
}

function dedupeBy(items = [], keyBuilder) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyBuilder(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function getLatestWorkingRevision(aggregate) {
  return aggregate?.revisions?.[0] ?? aggregate?.activePublishedRevision ?? null;
}

function getLatestWorkingPayload(aggregate) {
  return getLatestWorkingRevision(aggregate)?.payload ?? {};
}

function getRootPriority(entityType) {
  return COMPONENT_ROOT_PRIORITY[entityType] ?? 100;
}

function getPurgePriority(entityType) {
  return PURGE_ORDER_PRIORITY[entityType] ?? 100;
}

async function loadCardsByType(entityTypes, deps, db) {
  const latestByType = {};
  const publishedByType = {};

  for (const entityType of entityTypes) {
    latestByType[entityType] = await deps.listEntityCards(entityType, { db });
    publishedByType[entityType] = await deps.listPublishedCards(entityType, { db });
  }

  return { latestByType, publishedByType };
}

function buildMarkedNode(card) {
  return {
    entityType: card.entity.entityType,
    entityId: card.entity.id,
    entity: card.entity,
    latestCard: card
  };
}

async function buildMarkedNodeMap(deps, db) {
  const markedNodeMap = new Map();

  for (const entityType of REMOVAL_QUARANTINE_ENTITY_TYPES) {
    const cards = await deps.listEntityCards(entityType, { db });

    for (const card of cards) {
      if (!isEntityMarkedForRemoval(card.entity)) {
        continue;
      }

      markedNodeMap.set(card.entity.id, buildMarkedNode(card));
    }
  }

  return markedNodeMap;
}

async function enrichMarkedNodes(markedNodeMap, deps, db) {
  for (const node of markedNodeMap.values()) {
    node.aggregate = await deps.getEntityAggregate(node.entityId, db);
    node.latestRevision = getLatestWorkingRevision(node.aggregate);
    node.payload = getLatestWorkingPayload(node.aggregate);
    node.label = getCardLabel({
      entity: node.aggregate?.entity ?? node.entity,
      latestRevision: node.latestRevision
    });
    node.href = getEntityAdminHref(node.entityType, node.entityId);
    node.outgoingRefs = collectEntityReferenceRecords(node.entityType, node.payload);
  }
}

function buildMarkedAdjacency(markedNodeMap) {
  const adjacency = new Map();

  for (const node of markedNodeMap.values()) {
    adjacency.set(node.entityId, new Set());
  }

  for (const node of markedNodeMap.values()) {
    for (const ref of node.outgoingRefs) {
      if (!markedNodeMap.has(ref.targetId)) {
        continue;
      }

      adjacency.get(node.entityId)?.add(ref.targetId);
      adjacency.get(ref.targetId)?.add(node.entityId);
    }
  }

  return adjacency;
}

function buildMarkedComponents(markedNodeMap, adjacency) {
  const visited = new Set();
  const components = [];

  for (const entityId of markedNodeMap.keys()) {
    if (visited.has(entityId)) {
      continue;
    }

    const queue = [entityId];
    const memberIds = [];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (!currentId || visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      memberIds.push(currentId);

      for (const neighborId of adjacency.get(currentId) ?? []) {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }

    const members = memberIds
      .map((id) => markedNodeMap.get(id))
      .filter(Boolean)
      .sort((left, right) => {
        const priorityDelta = getRootPriority(left.entityType) - getRootPriority(right.entityType);

        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return String(left.label).localeCompare(String(right.label), "ru");
      });

    if (members.length > 0) {
      components.push(members);
    }
  }

  return components;
}

async function collectExternalIncomingRefs(componentMembers, latestByType, publishedByType, markedNodeMap) {
  const publishedIncomingRefs = [];
  const draftIncomingRefs = [];
  const componentIds = new Set(componentMembers.map((member) => member.entityId));

  for (const sourceType of SOURCE_ENTITY_TYPES) {
    for (const publishedCard of publishedByType[sourceType] ?? []) {
      if (componentIds.has(publishedCard.entityId)) {
        continue;
      }

      const payload = publishedCard.revision?.payload ?? {};

      for (const member of componentMembers) {
        if (!referencesTarget(sourceType, payload, member.entityType, member.entityId)) {
          continue;
        }

        publishedIncomingRefs.push(
          makeIncomingRefItem(
            sourceType,
            publishedCard,
            "published",
            `РћРїСѓР±Р»РёРєРѕРІР°РЅРЅР°СЏ ${ENTITY_TYPE_LABELS[sourceType] || "СЃСѓС‰РЅРѕСЃС‚СЊ"} РІСЃС‘ РµС‰С‘ РёСЃРїРѕР»СЊР·СѓРµС‚ СЌС‚РѕС‚ РіСЂР°С„.`
          )
        );
      }
    }

    for (const latestCard of latestByType[sourceType] ?? []) {
      if (!latestCard?.latestRevision || latestCard.latestRevision.state === "published") {
        continue;
      }

      if (componentIds.has(latestCard.entity.id)) {
        continue;
      }

      if (isEntityMarkedForRemoval(latestCard.entity) && markedNodeMap.has(latestCard.entity.id)) {
        continue;
      }

      const payload = latestCard.latestRevision.payload ?? {};

      for (const member of componentMembers) {
        if (!referencesTarget(sourceType, payload, member.entityType, member.entityId)) {
          continue;
        }

        draftIncomingRefs.push(
          makeIncomingRefItem(
            sourceType,
            latestCard,
            "draft",
            `Р Р°Р±РѕС‡РёР№ С‡РµСЂРЅРѕРІРёРє ${ENTITY_TYPE_LABELS[sourceType] || "СЃСѓС‰РЅРѕСЃС‚Рё"} РІСЃС‘ РµС‰С‘ СЃСЃС‹Р»Р°РµС‚СЃСЏ РЅР° СЌС‚РѕС‚ РіСЂР°С„.`
          )
        );
      }
    }
  }

  return {
    publishedIncomingRefs: dedupeBy(
      publishedIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}`
    ),
    draftIncomingRefs: dedupeBy(
      draftIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}`
    )
  };
}

async function collectOutgoingSurvivingRefs(componentMembers, markedNodeMap, deps, db) {
  const refs = [];
  const componentIds = new Set(componentMembers.map((member) => member.entityId));

  for (const member of componentMembers) {
    for (const ref of member.outgoingRefs) {
      if (componentIds.has(ref.targetId) || markedNodeMap.has(ref.targetId)) {
        continue;
      }

      const targetEntity = await deps.findEntityById(ref.targetId, db);

      if (!targetEntity) {
        continue;
      }

      refs.push(
        makeOutgoingRefItem(
          targetEntity,
          `${ENTITY_TYPE_LABELS[targetEntity.entityType] || "РЎСѓС‰РЅРѕСЃС‚СЊ"} ${targetEntity.id}`
        )
      );
    }
  }

  return dedupeBy(refs, (item) => `${item.entityType}:${item.entityId}`);
}

async function collectStateBlockers(componentMembers, deps, db) {
  const stateBlockers = [];

  for (const member of componentMembers) {
    const aggregate = member.aggregate ?? await deps.getEntityAggregate(member.entityId, db);
    const openObligations = (await deps.listPublishObligations(member.entityId, db)).filter((obligation) => obligation.status === "open");

    if (aggregate?.entity?.activePublishedRevisionId) {
      stateBlockers.push({
        kind: "published_truth",
        entityType: member.entityType,
        entityId: member.entityId,
        label: member.label,
        href: member.href,
        reason: `${member.label} РІСЃС‘ РµС‰С‘ СѓРґРµСЂР¶РёРІР°РµС‚СЃСЏ Р¶РёРІС‹Рј РєРѕРЅС‚СѓСЂРѕРј. Р’ v0.1 РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹ РЅРµ purged Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.`
      });
    }

    for (const revision of aggregate?.revisions ?? []) {
      if (revision.state !== "review") {
        continue;
      }

      stateBlockers.push({
        kind: "review_revision",
        entityType: member.entityType,
        entityId: member.entityId,
        label: member.label,
        href: revision.id ? `/admin/review/${revision.id}` : member.href,
        reason: `${member.label} РёРјРµРµС‚ СЂРµРІРёР·РёСЋ РЅР° РїСЂРѕРІРµСЂРєРµ.`
      });
    }

    for (const obligation of openObligations) {
      stateBlockers.push({
        kind: "open_obligation",
        entityType: member.entityType,
        entityId: member.entityId,
        label: member.label,
        href: member.href,
        reason: `${member.label} РёРјРµРµС‚ РѕС‚РєСЂС‹С‚РѕРµ publish-РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ: ${obligation.obligationType}.`
      });
    }
  }

  return dedupeBy(
    stateBlockers,
    (item) => `${item.kind}:${item.entityType}:${item.entityId}:${item.reason}`
  );
}

function buildComponentSummary(componentMembers, verdict, publishedIncomingRefs, draftIncomingRefs, stateBlockers) {
  if (verdict === "ready") {
    return "Компонент готов к очистке: внешних входящих ссылок и state-blockers не найдено.";
  }

  if (publishedIncomingRefs.length > 0) {
    return "Компонент заблокирован: на него всё ещё ссылается живой непомеченный контур.";
  }

  if (draftIncomingRefs.length > 0) {
    return "Компонент заблокирован: его ещё удерживают непомеченные рабочие черновики.";
  }

  if (stateBlockers.length > 0) {
    return "Компонент заблокирован внутренними lifecycle state-blockers.";
  }

  return `Компонент из ${componentMembers.length} объектов ещё не готов к очистке.`;
}

function buildComponentMembers(componentMembers) {
  return componentMembers.map((member) => ({
    entityType: member.entityType,
    entityId: member.entityId,
    label: member.label,
    href: member.href,
    markedAt: member.entity?.markedForRemovalAt ?? null,
    published: Boolean(member.aggregate?.entity?.activePublishedRevisionId)
  }));
}

function sortComponents(components = []) {
  return [...components].sort((left, right) => {
    const verdictScore = left.verdict === "ready" ? -1 : 1;
    const rightScore = right.verdict === "ready" ? -1 : 1;

    if (verdictScore !== rightScore) {
      return verdictScore - rightScore;
    }

    return String(left.root.label).localeCompare(String(right.root.label), "ru");
  });
}

function getRootForComponent(componentMembers) {
  return componentMembers[0];
}

function buildPurgePlan(componentMembers) {
  return [...componentMembers]
    .sort((left, right) => {
      const priorityDelta = getPurgePriority(left.entityType) - getPurgePriority(right.entityType);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return String(left.label).localeCompare(String(right.label), "ru");
    })
    .map((member) => ({
      entityType: member.entityType,
      entityId: member.entityId,
      label: member.label
    }));
}

async function buildComponentModel(componentMembers, latestByType, publishedByType, markedNodeMap, deps, db) {
  const root = getRootForComponent(componentMembers);
  const { publishedIncomingRefs, draftIncomingRefs } = await collectExternalIncomingRefs(
    componentMembers,
    latestByType,
    publishedByType,
    markedNodeMap
  );
  const stateBlockers = await collectStateBlockers(componentMembers, deps, db);
  const survivingRefs = await collectOutgoingSurvivingRefs(componentMembers, markedNodeMap, deps, db);
  const verdict = publishedIncomingRefs.length === 0 && draftIncomingRefs.length === 0 && stateBlockers.length === 0
    ? "ready"
    : "blocked";

  return {
    root: {
      entityType: root.entityType,
      entityId: root.entityId,
      label: root.label,
      href: root.href
    },
    members: buildComponentMembers(componentMembers),
    memberCount: componentMembers.length,
    verdict,
    summary: buildComponentSummary(componentMembers, verdict, publishedIncomingRefs, draftIncomingRefs, stateBlockers),
    publishedIncomingRefs,
    draftIncomingRefs,
    stateBlockers,
    survivingRefs,
    purgePlan: buildPurgePlan(componentMembers)
  };
}

async function buildAnalysisState(deps = {}, db = null) {
  const resolvedDeps = {
    listEntityCards,
    listPublishedCards,
    getEntityAggregate,
    listPublishObligations,
    findEntityById,
    ...deps
  };
  const markedNodeMap = await buildMarkedNodeMap(resolvedDeps, db);
  await enrichMarkedNodes(markedNodeMap, resolvedDeps, db);
  const adjacency = buildMarkedAdjacency(markedNodeMap);
  const rawComponents = buildMarkedComponents(markedNodeMap, adjacency);
  const { latestByType, publishedByType } = await loadCardsByType(SOURCE_ENTITY_TYPES, resolvedDeps, db);
  const components = [];

  for (const componentMembers of rawComponents) {
    components.push(
      await buildComponentModel(componentMembers, latestByType, publishedByType, markedNodeMap, resolvedDeps, db)
    );
  }

  return {
    components: sortComponents(components),
    markedNodeMap,
    deps: resolvedDeps
  };
}

export async function listRemovalSweepComponents(deps = {}) {
  const analysis = await buildAnalysisState(deps, deps.db ?? null);

  return analysis.components;
}

export async function evaluateRemovalSweepComponent(input, deps = {}) {
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();

  if (!isRemovalQuarantineEntityTypeSupported(entityType)) {
    return {
      exists: false,
      verdict: "blocked",
      summary: "Р­С‚РѕС‚ С‚РёРї РїРѕРєР° РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ РЅРѕРІС‹Рј cleanup-РєРѕРЅС‚СѓСЂРѕРј."
    };
  }

  const analysis = await buildAnalysisState(deps, deps.db ?? null);
  const component = analysis.components.find((item) => item.members.some((member) => member.entityId === entityId));

  if (!component) {
    return {
      exists: false,
      verdict: "blocked",
      summary: "РџРѕРјРµС‡РµРЅРЅС‹Р№ РєРѕРјРїРѕРЅРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ."
    };
  }

  return {
    exists: true,
    ...component
  };
}

export async function executeRemovalSweep(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    deleteEntityById,
    deleteMediaFile,
    recordAuditEvent,
    recordDestructiveEvent,
    deleteEntityWithSafetyInDb,
    ...deps
  };
  const rootEntityType = String(input.entityType ?? "").trim();
  const rootEntityId = String(input.entityId ?? "").trim();
  const actorUserId = String(input.actorUserId ?? "").trim() || null;
  const correlationId = input.correlationId ?? createDestructiveCorrelationId();
  const evaluation = await evaluateRemovalSweepComponent(
    { entityType: rootEntityType, entityId: rootEntityId },
    { ...resolvedDeps, db: deps.db ?? null }
  );

  if (!evaluation.exists) {
    throw new Error("Помеченный removal-компонент не найден.");
  }

  const rootSnapshot = {
    entityId: evaluation.root?.entityId ?? rootEntityId,
    entityType: evaluation.root?.entityType ?? rootEntityType,
    label: evaluation.root?.label ?? rootEntityId
  };

  await resolvedDeps.recordAuditEvent({
    entityId: rootEntityId,
    actorUserId,
    eventKey: AUDIT_EVENT_KEYS.REMOVAL_SWEEP_ANALYZED,
    summary: "Выполнен анализ purge-ready компонента.",
    details: {
      rootEntityType,
      rootEntityId,
      verdict: evaluation.verdict,
      memberIds: evaluation.members.map((member) => member.entityId)
    }
  }, { db: deps.db ?? null });

  if (evaluation.verdict !== "ready") {
    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.REMOVAL_SWEEP_BLOCKED,
      correlationId,
      operationKind: "removal_sweep",
      outcome: "blocked",
      actorUserId,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Очистка помеченного компонента заблокирована.",
      details: {
        rootEntityType,
        rootEntityId,
        summary: evaluation.summary,
        members: evaluation.members ?? [],
        purgePlan: evaluation.purgePlan ?? [],
        publishedIncomingRefs: evaluation.publishedIncomingRefs ?? [],
        draftIncomingRefs: evaluation.draftIncomingRefs ?? [],
        stateBlockers: evaluation.stateBlockers ?? [],
        survivingRefs: evaluation.survivingRefs ?? []
      }
    }, { db: deps.db ?? null });

    throw new Error(evaluation.summary);
  }

  const purgePlan = evaluation.purgePlan;
  const componentMemberIds = evaluation.members.map((member) => member.entityId);
  const deleted = [];

  const transactionResult = await resolvedDeps.withTransaction(async (db) => {
    const storageKeys = [];

    for (const item of purgePlan) {
      if (item.entityType === ENTITY_TYPES.PAGE) {
        await resolvedDeps.deleteEntityById(item.entityId, db);
        deleted.push(item);
        continue;
      }

      const deleteResult = await resolvedDeps.deleteEntityWithSafetyInDb({
        entityType: item.entityType,
        entityId: item.entityId,
        actorUserId,
        correlationId,
        ignoreIncomingEntityIds: componentMemberIds
      }, { ...deps, db });

      if (!deleteResult.deleted) {
        const reason = deleteResult.reasons?.[0] || "Очистка помеченного компонента отклонена правилами безопасности.";
        throw new Error(reason);
      }

      if (deleteResult.storageKeys?.length > 0) {
        storageKeys.push(...deleteResult.storageKeys);
      }

      deleted.push(item);
    }

    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.REMOVAL_SWEEP_EXECUTED,
      correlationId,
      operationKind: "removal_sweep",
      outcome: "executed",
      actorUserId,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Очистка помеченного компонента выполнена.",
      affectedEntities: deleted.map((item) => ({
        entityId: item.entityId,
        entityType: item.entityType
      })),
      details: {
        rootEntityType,
        rootEntityId,
        summary: evaluation.summary,
        purgePlan,
        deleted,
        survivingRefs: evaluation.survivingRefs ?? []
      }
    }, { db });

    return {
      storageKeys: [...new Set(storageKeys)]
    };
  });

  for (const storageKey of transactionResult.storageKeys ?? []) {
    try {
      await resolvedDeps.deleteMediaFile(storageKey);
    } catch {
      // Best-effort storage cleanup after DB deletion.
    }
  }

  return {
    deleted,
    evaluation
  };
}
