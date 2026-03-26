import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanEditContent } from "../../../../../../lib/auth/session";
import { submitRevisionForReview } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { revisionId } = await params;
  try {
    await submitRevisionForReview({
      revisionId,
      actorUserId: user.id,
      canRenderPreview: true
    });

    return redirectWithQuery(request, `/admin/review/${revisionId}`, { message: FEEDBACK_COPY.reviewSubmitted });
  } catch (error) {
    return redirectWithError(request, `/admin/review/${revisionId}`, error);
  }
}
