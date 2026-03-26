import { completePublishObligation } from "../../../../../../lib/content-ops/workflow";
import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanPublish } from "../../../../../../lib/auth/session";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanPublish(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { obligationId } = await params;
  const formData = await request.formData();
  const redirectTo = getString(formData, "redirectTo") || "/admin";
  try {
    await completePublishObligation(obligationId);

    return redirectWithQuery(request, redirectTo, { message: FEEDBACK_COPY.obligationCompleted });
  } catch (error) {
    return redirectWithError(request, redirectTo, error);
  }
}
