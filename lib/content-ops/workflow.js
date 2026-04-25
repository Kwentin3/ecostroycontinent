import {
  findEntityById,
  findEntityByTypeSingleton,
  findRevisionById,
  findActivePublishedRevision,
  findEntityByPublishedSlugCollision,
  findPublishObligationById,
  insertPublishObligation,
  listReviewQueue,
  markPublishObligationCompleted,
  updateEntityTimestamps,
  updateRevision
} from "../content-core/repository.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, PREVIEW_STATUS } from "../content-core/content-types.js";
import { evaluateReadiness } from "./readiness.js";
import { recordAuditEvent } from "./audit.js";
import { buildPublishFollowUp, hasSlugMutation } from "./publish-follow-up.js";

function revisionHasResolvedReviewOutcome(revision = {}) {
  return revision.ownerApprovalStatus === "approved" || revision.ownerApprovalStatus === "not_required";
}

export function filterPendingReviewQueueItems(queue = []) {
  return queue.filter((item) => !revisionHasResolvedReviewOutcome(item?.revision));
}

async function getPublishedGlobalSettingsRevision() {
  const entity = await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS);

  if (!entity?.activePublishedRevisionId) {
    return null;
  }

  return findRevisionById(entity.activePublishedRevisionId);
}

export async function getReviewQueue() {
  const queue = await listReviewQueue();

  // The review queue is only for items that still need review-lane attention.
  // Once a revision is agreed or no owner decision is required, publish happens
  // from the entity workspace instead of the shared review screen.
  return filterPendingReviewQueueItems(queue);
}

export async function submitRevisionForReview({ revisionId, actorUserId, canRenderPreview = true, previewFailureReason = null }) {
  const revision = await findRevisionById(revisionId);

  if (!revision || revision.state !== "draft") {
    throw new Error("Только черновики можно отправлять на проверку.");
  }

  const entity = await findEntityById(revision.entityId);
  const globalSettingsRevision = entity.entityType === ENTITY_TYPES.GLOBAL_SETTINGS
    ? null
    : await getPublishedGlobalSettingsRevision();
  const readiness = await evaluateReadiness({ entity, revision, globalSettingsRevision });

  const hasStructuralReferenceFailure = readiness.results.some((result) => result.code.startsWith("invalid_"));

  if (hasStructuralReferenceFailure) {
    throw new Error("Сломанные связи не позволяют отправить версию на проверку.");
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
    summary: "Черновик отправлен на проверку.",
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
      summary: "Предпросмотр версии оказался недоступен.",
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
      summary: "Версия отправлена на согласование владельцу.",
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
    throw new Error("Только версии на проверке могут получать решения владельца.");
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
      summary: "Владелец согласовал версию.",
      details: {
        comment: comment ?? ""
      }
    });

    return updated;
  }

  const eventKey = action === "reject" ? AUDIT_EVENT_KEYS.OWNER_REJECTED : AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT;
  const summary = action === "reject"
    ? "Владелец отклонил версию."
    : "Версия возвращена с комментарием.";

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
  return hasSlugMutation(entityType, previousPayload, nextPayload);
}

export async function publishRevision({ revisionId, actorUserId }) {
  const revision = await findRevisionById(revisionId);

  if (!revision || revision.state !== "review") {
    throw new Error("Только версии на проверке можно публиковать.");
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
      summary: "Публикация заблокирована проверкой готовности.",
      details: {
        readiness
      }
    });

    throw new Error("Публикация заблокирована проверкой готовности.");
  }

  if (revision.ownerReviewRequired && revision.ownerApprovalStatus !== "approved") {
    throw new Error("Не хватает обязательного согласования владельца.");
  }

  if (revision.previewStatus !== PREVIEW_STATUS.RENDERABLE) {
    throw new Error("Перед публикацией предпросмотр должен быть доступен.");
  }

  if (entity.entityType === ENTITY_TYPES.SERVICE || entity.entityType === ENTITY_TYPES.CASE) {
    const collision = await findEntityByPublishedSlugCollision(entity.entityType, revision.payload.slug, entity.id);

    if (collision) {
      throw new Error("Публикацию блокирует конфликт короткого адреса.");
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

  const createdObligationTypes = [];

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
      createdObligationTypes.push(obligationType);
    }

    await recordAuditEvent({
      entityId: entity.id,
      revisionId,
      actorUserId: null,
      eventKey: AUDIT_EVENT_KEYS.SLUG_CHANGE_OBLIGATION_CREATED,
      summary: "Созданы обязательства после смены адреса.",
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
    summary: "Версия опубликована.",
    details: {
      readiness
    }
  });

  const publishFollowUp = buildPublishFollowUp({
    entityType: entity.entityType,
    previousPayload: previousPublishedRevision?.payload ?? null,
    nextPayload: publishedRevision.payload,
    obligationTypes: createdObligationTypes
  });

  return {
    entity,
    revision: publishedRevision,
    readiness,
    publishFollowUp
  };
}

export async function rollbackPublishedEntity({ entityId, targetRevisionId, actorUserId }) {
  const entity = await findEntityById(entityId);
  const targetRevision = await findRevisionById(targetRevisionId);

  if (!entity || !targetRevision || targetRevision.entityId !== entityId || targetRevision.state !== "published") {
    throw new Error("Для отката нужна опубликованная версия этой же сущности.");
  }

  await updateEntityTimestamps(entity.id, actorUserId, targetRevisionId);

  await recordAuditEvent({
    entityId,
    revisionId: targetRevisionId,
    actorUserId,
    eventKey: AUDIT_EVENT_KEYS.ROLLBACK_EXECUTED,
    summary: "Откат вернул предыдущую опубликованную версию.",
    details: {}
  });

  return {
    entity,
    targetRevision
  };
}

export async function completePublishObligation(obligationId) {
  const obligation = await findPublishObligationById(obligationId);

  if (!obligation) {
    throw new Error("Обязательство публикации не найдено.");
  }

  await markPublishObligationCompleted(obligationId);

  const entity = await findEntityById(obligation.entityId);
  const revision = obligation.revisionId ? await findRevisionById(obligation.revisionId) : null;
  const previousSlug = obligation?.payload?.previousSlug;
  const publishFollowUp = buildPublishFollowUp({
    entityType: entity?.entityType,
    previousPayload: previousSlug ? { slug: previousSlug } : null,
    nextPayload: revision?.payload ?? null,
    obligationTypes: [obligation.obligationType]
  });

  return {
    obligation,
    entity,
    revision,
    publishFollowUp
  };
}
