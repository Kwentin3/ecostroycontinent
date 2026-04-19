import { recordAuditEvent } from "../content-ops/audit.js";
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
} from "./repository.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "./content-types.js";
import {
  assertEntityType,
  buildChangeSummary,
  determineChangeClass,
  normalizeEntityInput,
  requiresOwnerReview
} from "./pure.js";
import { assertNoNewRefsToMarkedEntities } from "./removal-references.js";
import { assertPageTypeAllowedForLaunchOwnership } from "../public-launch/ownership.js";

export {
  assertEntityType,
  buildChangeSummary,
  determineChangeClass,
  normalizeEntityInput,
  requiresOwnerReview
} from "./pure.js";

function getWorkingPageType(aggregate) {
  const currentDraft = aggregate?.revisions?.find((revision) => revision.state === "draft");

  return currentDraft?.payload?.pageType || aggregate?.activePublishedRevision?.payload?.pageType || "";
}

function enforcePageOwnershipGuardrails(entityType, nextPayload, aggregate) {
  if (entityType !== ENTITY_TYPES.PAGE) {
    return;
  }

  assertPageTypeAllowedForLaunchOwnership({
    nextPageType: nextPayload?.pageType || "",
    previousPageType: getWorkingPageType(aggregate)
  });
}

export async function ensureEntity(entityType, userId, db = null, options = {}) {
  if (entityType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    const existing = await findEntityByTypeSingleton(entityType, db);

    if (existing) {
      return existing;
    }
  }

  return createEntity(entityType, userId, db, options);
}

export async function saveDraft(input, options = {}) {
  const db = options.db ?? null;
  const entityType = assertEntityType(input.entityType);
  const entity = input.entityId
    ? await findEntityById(input.entityId, db)
    : await ensureEntity(entityType, input.userId, db, {
        creationOrigin: input.creationOrigin ?? null
      });
  const nextPayload = normalizeEntityInput(entityType, input.payload);
  const currentDraft = await findDraftRevision(entity.id, db);
  const aggregate = await getEntityAggregate(entity.id, db);
  const previousPayload = currentDraft?.payload ?? aggregate?.activePublishedRevision?.payload ?? null;
  enforcePageOwnershipGuardrails(entityType, nextPayload, aggregate);
  await assertNoNewRefsToMarkedEntities({
    entityType,
    nextPayload,
    previousPayload
  }, { db });
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
      aiInvolvement: input.aiInvolvement ?? currentDraft.aiInvolvement ?? false,
      aiSourceBasis: input.aiSourceBasis ?? currentDraft.aiSourceBasis ?? null,
      userId: input.userId,
      state: "draft",
      previewStatus: "preview_renderable",
      previewFailureReason: null
    }, db);
  } else {
    const latest = await findLatestRevision(entity.id, db);
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
      aiInvolvement: input.aiInvolvement ?? false,
      aiSourceBasis: input.aiSourceBasis ?? null,
      userId: input.userId,
      previewStatus: "preview_renderable"
    }, db);
    createdRevision = true;
  }

  await updateEntityTimestamps(entity.id, input.userId, null, db);

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
      ownerReviewRequired,
      ...(input.auditDetails ?? {})
    }
  }, { db });

  return {
    entity,
    revision,
    changedFields
  };
}

export async function getEntityEditorState(entityId, options = {}) {
  const db = options.db ?? null;
  if (!entityId) {
    return {
      entity: null,
      revisions: [],
      activePublishedRevision: null
    };
  }

  const aggregate = await getEntityAggregate(entityId, db);

  if (!aggregate) {
    return {
      entity: null,
      revisions: [],
      activePublishedRevision: null
    };
  }

  return aggregate;
}

export async function listEntityCards(entityType, options = {}) {
  return listEntitiesWithLatestRevision(entityType, options.db ?? null);
}

export async function listPublishedCards(entityType, options = {}) {
  return listPublishedEntities(entityType, options.db ?? null);
}
