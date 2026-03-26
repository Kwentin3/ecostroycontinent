import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanOwnerApprove } from "../../../../../../lib/auth/session";
import { processOwnerAction } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanOwnerApprove(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { revisionId } = await params;
  const formData = await request.formData();
  const action = getString(formData, "action");
  const comment = getString(formData, "comment");

  try {
    await processOwnerAction({
      revisionId,
      actorUserId: user.id,
      action,
      comment
    });

    return redirectWithQuery(request, `/admin/review/${revisionId}`, { message: FEEDBACK_COPY.ownerActionSaved });
  } catch (error) {
    return redirectWithError(request, `/admin/review/${revisionId}`, error);
  }
}
