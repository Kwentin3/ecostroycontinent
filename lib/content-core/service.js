import { recordAuditEvent } from "../content-ops/audit";
import {
  createEntity,
  createRevision,
  findDraftRevision,
  findEntityById,
  findEntityByTypeSingleton,
  findLatestRevision,
  getEntityAggregate,
  listEntitiesWithLatestRevision,
  listPublishedEntities,
  updateEntityTimestamps,
  updateRevision
} from "./repository";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "./content-types";
import {
  assertEntityType,
  buildChangeSummary,
  determineChangeClass,
  normalizeEntityInput,
  requiresOwnerReview
} from "./pure";

export {
  assertEntityType,
  buildChangeSummary,
  determineChangeClass,
  normalizeEntityInput,
  requiresOwnerReview
} from "./pure";

export async function ensureEntity(entityType, userId) {
  if (entityType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    const existing = await findEntityByTypeSingleton(entityType);

    if (existing) {
      return existing;
    }
  }

  return createEntity(entityType, userId);
}

export async function saveDraft(input) {
  const entityType = assertEntityType(input.entityType);
  const entity = input.entityId ? await findEntityById(input.entityId) : await ensureEntity(entityType, input.userId);
  const nextPayload = normalizeEntityInput(entityType, input.payload);
  const currentDraft = await findDraftRevision(entity.id);
  const aggregate = await getEntityAggregate(entity.id);
  const publishedRevision = aggregate?.activePublishedRevision ?? null;
  const changeClass = determineChangeClass(entityType, publishedRevision?.payload, nextPayload);
  const ownerReviewRequired = requiresOwnerReview(entityType, publishedRevision?.payload, nextPayload);
  const changedFields = buildChangeSummary(entityType, publishedRevision?.payload, nextPayload);

  let revision;
  let createdRevision = false;

  if (currentDraft) {
    revision = await updateRevision(currentDraft.id, {
      payload: nextPayload,
      changeClass,
      changeIntent: input.changeIntent,
      ownerReviewRequired,
      ownerApprovalStatus: ownerReviewRequired ? "pending" : "not_required",
      userId: input.userId,
      state: "draft",
      previewStatus: "preview_renderable",
      previewFailureReason: null
    });
  } else {
    const latest = await findLatestRevision(entity.id);
    const revisionNumber = latest ? latest.revisionNumber + 1 : 1;

    revision = await createRevision({
      entityId: entity.id,
      revisionNumber,
      state: "draft",
      payload: nextPayload,
      changeClass,
      changeIntent: input.changeIntent,
      ownerReviewRequired,
      ownerApprovalStatus: ownerReviewRequired ? "pending" : "not_required",
      userId: input.userId,
      previewStatus: "preview_renderable"
    });
    createdRevision = true;
  }

  await updateEntityTimestamps(entity.id, input.userId);

  await recordAuditEvent({
    entityId: entity.id,
    revisionId: revision.id,
    actorUserId: input.userId,
    eventKey: createdRevision ? AUDIT_EVENT_KEYS.REVISION_CREATED : AUDIT_EVENT_KEYS.REVISION_UPDATED,
    summary: createdRevision ? "Черновик создан." : "Черновик обновлён.",
    details: {
      changedFields,
      changeClass,
      changeIntent: input.changeIntent,
      ownerReviewRequired
    }
  });

  return {
    entity,
    revision,
    changedFields
  };
}

export async function getEntityEditorState(entityId) {
  if (!entityId) {
    return {
      entity: null,
      revisions: [],
      activePublishedRevision: null
    };
  }

  const aggregate = await getEntityAggregate(entityId);

  if (!aggregate) {
    return {
      entity: null,
      revisions: [],
      activePublishedRevision: null
    };
  }

  return aggregate;
}

export async function listEntityCards(entityType) {
  return listEntitiesWithLatestRevision(entityType);
}

export async function listPublishedCards(entityType) {
  return listPublishedEntities(entityType);
}
