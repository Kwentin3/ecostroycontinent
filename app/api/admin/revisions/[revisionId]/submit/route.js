import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { buildEntityPayload } from "../../../../../../lib/admin/entity-form-data.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";
import { submitRevisionForReview } from "../../../../../../lib/content-ops/workflow.js";

const defaultDeps = {
  requireRouteUser,
  normalizeAdminReturnTo,
  FEEDBACK_COPY,
  buildEntityPayload,
  redirectToAdmin,
  redirectWithError,
  redirectWithQuery,
  findEntityById,
  findRevisionById,
  saveDraft,
  submitRevisionForReview,
  userCanEditContent
};

function getString(formData, key) {
  const value = formData?.get?.(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getReviewSubmissionFeedback(feedbackCopy, result = {}) {
  if (result.submissionStatus === "duplicate") {
    return feedbackCopy.reviewAlreadySubmitted;
  }

  if (result.submissionStatus === "updated") {
    return feedbackCopy.reviewUpdated;
  }

  return feedbackCopy.reviewSubmitted;
}

function shouldSaveBeforeSubmit(formData) {
  return getString(formData, "intent") === "save_and_submit";
}

async function resolveRevisionIdForSubmission({ revisionId, formData, user, deps }) {
  if (!shouldSaveBeforeSubmit(formData)) {
    return revisionId;
  }

  const currentRevision = await deps.findRevisionById(revisionId);

  if (!currentRevision || currentRevision.state !== "draft") {
    throw new Error("Только черновики можно отправлять на проверку.");
  }

  const entity = await deps.findEntityById(currentRevision.entityId);

  if (!entity) {
    throw new Error("Материал для отправки на проверку не найден.");
  }

  const payload = deps.buildEntityPayload(entity.entityType, formData);
  const changeIntent = getString(formData, "changeIntent")
    || currentRevision.changeIntent
    || "Черновик сохранён перед отправкой на проверку.";
  const saved = await deps.saveDraft({
    entityType: entity.entityType,
    entityId: entity.id,
    userId: user.id,
    changeIntent,
    payload
  });

  return saved.revision.id;
}

export async function POST(request, { params }, deps = defaultDeps) {
  const {
    requireRouteUser: requireRouteUserImpl,
    normalizeAdminReturnTo: normalizeAdminReturnToImpl,
    FEEDBACK_COPY: feedbackCopy,
    buildEntityPayload: buildEntityPayloadImpl,
    redirectToAdmin: redirectToAdminImpl,
    redirectWithError: redirectWithErrorImpl,
    redirectWithQuery: redirectWithQueryImpl,
    findEntityById: findEntityByIdImpl,
    findRevisionById: findRevisionByIdImpl,
    saveDraft: saveDraftImpl,
    submitRevisionForReview: submitRevisionForReviewImpl,
    userCanEditContent: userCanEditContentImpl
  } = deps;
  const { user, response } = await requireRouteUserImpl(request);

  if (response) {
    return response;
  }

  if (!userCanEditContentImpl(user)) {
    return redirectToAdminImpl("/admin/no-access");
  }

  const formData = await request.formData();
  const returnTo = normalizeAdminReturnToImpl(getString(formData, "returnTo"));
  const { revisionId } = await params;
  try {
    const targetRevisionId = await resolveRevisionIdForSubmission({
      revisionId,
      formData,
      user,
      deps: {
        buildEntityPayload: buildEntityPayloadImpl,
        findEntityById: findEntityByIdImpl,
        findRevisionById: findRevisionByIdImpl,
        saveDraft: saveDraftImpl
      }
    });
    const result = await submitRevisionForReviewImpl({
      revisionId: targetRevisionId,
      actorUserId: user.id,
      canRenderPreview: true
    });

    return redirectWithQueryImpl(request, `/admin/review/${result.revision.id || targetRevisionId}`, {
      message: getReviewSubmissionFeedback(feedbackCopy, result)
    });
  } catch (error) {
    return redirectWithErrorImpl(request, returnTo || `/admin/review/${revisionId}`, error);
  }
}
