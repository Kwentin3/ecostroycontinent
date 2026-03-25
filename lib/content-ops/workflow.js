import {
  findEntityById,
  findEntityByTypeSingleton,
  findRevisionById,
  findActivePublishedRevision,
  findEntityByPublishedSlugCollision,
  insertPublishObligation,
  listReviewQueue,
  markPublishObligationCompleted,
  updateEntityTimestamps,
  updateRevision
} from "../content-core/repository";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, PREVIEW_STATUS } from "../content-core/content-types";
import { evaluateReadiness } from "./readiness";
import { recordAuditEvent } from "./audit";

async function getPublishedGlobalSettingsRevision() {
  const entity = await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS);

  if (!entity?.activePublishedRevisionId) {
    return null;
  }

  return findRevisionById(entity.activePublishedRevisionId);
}

export async function getReviewQueue() {
  return listReviewQueue();
}

export async function submitRevisionForReview({ revisionId, actorUserId, canRenderPreview = true, previewFailureReason = null }) {
  const revision = await findRevisionById(revisionId);

  if (!revision || revision.state !== "draft") {
    throw new Error("Only draft revisions may be submitted for review.");
  }

  const entity = await findEntityById(revision.entityId);
  const globalSettingsRevision = entity.entityType === ENTITY_TYPES.GLOBAL_SETTINGS
    ? null
    : await getPublishedGlobalSettingsRevision();
  const readiness = await evaluateReadiness({ entity, revision, globalSettingsRevision });

  const hasStructuralReferenceFailure = readiness.results.some((result) => result.code.startsWith("invalid_"));

  if (hasStructuralReferenceFailure) {
    throw new Error("Broken references block review submission.");
  }

  const nextPreviewStatus = canRenderPreview ? PREVIEW_STATUS.RENDERABLE : PREVIEW_STATUS.UNAVAILABLE;

  const updated = await updateRevision(revisionId, {
    state: "review",
    submittedAt: new Date(),
    ownerApprovalStatus: revision.ownerReviewRequired ? "pending" : "not_required",
    previewStatus: nextPreviewStatus,
    previewFailureReason,
    userId: actorUserId
  });

  await recordAuditEvent({
    entityId: entity.id,
    revisionId: revision.id,
    actorUserId,
    eventKey: AUDIT_EVENT_KEYS.REVIEW_REQUESTED,
    summary: "Revision submitted for review.",
    details: {
      readiness,
      previewStatus: nextPreviewStatus
    }
  });

  if (!canRenderPreview) {
    await recordAuditEvent({
      entityId: entity.id,
      revisionId: revision.id,
      actorUserId: null,
      eventKey: AUDIT_EVENT_KEYS.PREVIEW_RENDER_FAILED,
      summary: "Preview for candidate state was unavailable.",
      details: {
        previewFailureReason
      }
    });
  }

  if (revision.ownerReviewRequired) {
    await recordAuditEvent({
      entityId: entity.id,
      revisionId: revision.id,
      actorUserId,
      eventKey: AUDIT_EVENT_KEYS.OWNER_REVIEW_REQUESTED,
      summary: "Revision entered owner review lane.",
      details: {
        ownerReviewRequired: true
      }
    });
  }

  return {
    entity,
    revision: updated,
    readiness
  };
}

export async function processOwnerAction({ revisionId, actorUserId, action, comment }) {
  const revision = await findRevisionById(revisionId);

  if (!revision || revision.state !== "review") {
    throw new Error("Only review revisions may receive owner actions.");
  }

  const entity = await findEntityById(revision.entityId);

  if (action === "approve") {
    const updated = await updateRevision(revisionId, {
      ownerApprovalStatus: "approved",
      ownerApprovedBy: actorUserId,
      ownerApprovedAt: new Date(),
      reviewComment: comment ?? "",
      userId: actorUserId
    });

    await recordAuditEvent({
      entityId: entity.id,
      revisionId,
      actorUserId,
      eventKey: AUDIT_EVENT_KEYS.OWNER_APPROVED,
      summary: "Business Owner approved the revision.",
      details: {
        comment: comment ?? ""
      }
    });

    return updated;
  }

  const eventKey = action === "reject" ? AUDIT_EVENT_KEYS.OWNER_REJECTED : AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT;
  const summary = action === "reject"
    ? "Business Owner rejected the revision."
    : "Revision was sent back with comment.";

  const updated = await updateRevision(revisionId, {
    state: "draft",
    ownerApprovalStatus: "rejected",
    reviewComment: comment ?? "",
    userId: actorUserId
  });

  await recordAuditEvent({
    entityId: entity.id,
    revisionId,
    actorUserId,
    eventKey,
    summary,
    details: {
      comment: comment ?? ""
    }
  });

  return updated;
}

function needsSlugObligations(entityType, previousPayload, nextPayload) {
  if ((entityType !== ENTITY_TYPES.SERVICE && entityType !== ENTITY_TYPES.CASE) || !previousPayload) {
    return false;
  }

  return previousPayload.slug !== nextPayload.slug;
}

export async function publishRevision({ revisionId, actorUserId }) {
  const revision = await findRevisionById(revisionId);

  if (!revision || revision.state !== "review") {
    throw new Error("Only review revisions may be published.");
  }

  const entity = await findEntityById(revision.entityId);
  const globalSettingsRevision = entity.entityType === ENTITY_TYPES.GLOBAL_SETTINGS
    ? null
    : await getPublishedGlobalSettingsRevision();
  const readiness = await evaluateReadiness({ entity, revision, globalSettingsRevision });

  if (readiness.hasBlocking) {
    await recordAuditEvent({
      entityId: entity.id,
      revisionId,
      actorUserId,
      eventKey: AUDIT_EVENT_KEYS.PUBLISH_BLOCKED,
      summary: "Publish was blocked by readiness checks.",
      details: {
        readiness
      }
    });

    throw new Error("Publish blocked by readiness checks.");
  }

  if (revision.ownerReviewRequired && revision.ownerApprovalStatus !== "approved") {
    throw new Error("Required owner approval is missing.");
  }

  if (revision.previewStatus !== PREVIEW_STATUS.RENDERABLE) {
    throw new Error("Preview must be renderable before publish.");
  }

  if (entity.entityType === ENTITY_TYPES.SERVICE || entity.entityType === ENTITY_TYPES.CASE) {
    const collision = await findEntityByPublishedSlugCollision(entity.entityType, revision.payload.slug, entity.id);

    if (collision) {
      throw new Error("Slug collision blocks publish.");
    }
  }

  const previousPublishedRevision = await findActivePublishedRevision(entity.id);

  const publishedRevision = await updateRevision(revisionId, {
    state: "published",
    publishedAt: new Date(),
    publishedBy: actorUserId,
    userId: actorUserId
  });

  await updateEntityTimestamps(entity.id, actorUserId, revisionId);

  if (needsSlugObligations(entity.entityType, previousPublishedRevision?.payload, publishedRevision.payload)) {
    for (const obligationType of [
      "redirect_required",
      "revalidation_required",
      "sitemap_update_required",
      "canonical_url_check_required"
    ]) {
      await insertPublishObligation({
        entityId: entity.id,
        revisionId,
        obligationType,
        payload: {
          previousSlug: previousPublishedRevision.payload.slug,
          nextSlug: publishedRevision.payload.slug
        }
      });
    }

    await recordAuditEvent({
      entityId: entity.id,
      revisionId,
      actorUserId: null,
      eventKey: AUDIT_EVENT_KEYS.SLUG_CHANGE_OBLIGATION_CREATED,
      summary: "Slug change obligations were recorded.",
      details: {
        previousSlug: previousPublishedRevision.payload.slug,
        nextSlug: publishedRevision.payload.slug
      }
    });
  }

  await recordAuditEvent({
    entityId: entity.id,
    revisionId,
    actorUserId,
    eventKey: AUDIT_EVENT_KEYS.PUBLISHED,
    summary: "Revision was published.",
    details: {
      readiness
    }
  });

  return {
    entity,
    revision: publishedRevision,
    readiness
  };
}

export async function rollbackPublishedEntity({ entityId, targetRevisionId, actorUserId }) {
  const entity = await findEntityById(entityId);
  const targetRevision = await findRevisionById(targetRevisionId);

  if (!entity || !targetRevision || targetRevision.entityId !== entityId || targetRevision.state !== "published") {
    throw new Error("Rollback target must be a published revision of the same entity.");
  }

  await updateEntityTimestamps(entity.id, actorUserId, targetRevisionId);

  await recordAuditEvent({
    entityId,
    revisionId: targetRevisionId,
    actorUserId,
    eventKey: AUDIT_EVENT_KEYS.ROLLBACK_EXECUTED,
    summary: "Rollback restored a previous published revision.",
    details: {}
  });

  return {
    entity,
    targetRevision
  };
}

export async function completePublishObligation(obligationId) {
  await markPublishObligationCompleted(obligationId);
}
