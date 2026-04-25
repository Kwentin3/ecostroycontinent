import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { submitRevisionForReview } from "../../../../../../lib/content-ops/workflow.js";

const defaultDeps = {
  requireRouteUser,
  normalizeAdminReturnTo,
  FEEDBACK_COPY,
  redirectToAdmin,
  redirectWithError,
  redirectWithQuery,
  submitRevisionForReview,
  userCanEditContent
};

function getString(formData, key) {
  const value = formData?.get?.(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request, { params }, deps = defaultDeps) {
  const {
    requireRouteUser: requireRouteUserImpl,
    normalizeAdminReturnTo: normalizeAdminReturnToImpl,
    FEEDBACK_COPY: feedbackCopy,
    redirectToAdmin: redirectToAdminImpl,
    redirectWithError: redirectWithErrorImpl,
    redirectWithQuery: redirectWithQueryImpl,
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
    const result = await submitRevisionForReviewImpl({
      revisionId,
      actorUserId: user.id,
      canRenderPreview: true
    });

    const needsOwnerDecision = Boolean(result?.revision?.ownerReviewRequired);
    // Review submission and review-screen routing are intentionally separate:
    // if owner action is not needed, the editor should continue from the source card
    // and immediately see that the revision is ready for publish.
    const successPath = !needsOwnerDecision && returnTo ? returnTo : `/admin/review/${revisionId}`;
    const message = needsOwnerDecision ? feedbackCopy.reviewSubmitted : feedbackCopy.readyToPublish;

    return redirectWithQueryImpl(request, successPath, { message });
  } catch (error) {
    return redirectWithErrorImpl(request, returnTo || `/admin/review/${revisionId}`, error);
  }
}
