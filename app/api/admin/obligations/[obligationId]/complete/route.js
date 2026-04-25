import { revalidatePath } from "next/cache.js";

import { completePublishObligation } from "../../../../../../lib/content-ops/workflow.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { userCanPublish } from "../../../../../../lib/auth/session.js";

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    completePublishObligation,
    getString,
    requireRouteUser,
    userCanPublish,
    revalidatePath,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanPublish(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { obligationId } = await params;
  const formData = await request.formData();
  const redirectTo = routeDeps.getString(formData, "redirectTo") || "/admin";
  try {
    const result = await routeDeps.completePublishObligation(obligationId);
    const revalidationPaths = result?.publishFollowUp?.revalidationPaths ?? [];

    for (const path of revalidationPaths) {
      if (path) {
        routeDeps.revalidatePath(path);
      }
    }

    return redirectWithQuery(request, redirectTo, { message: FEEDBACK_COPY.obligationCompleted });
  } catch (error) {
    return redirectWithError(request, redirectTo, error);
  }
}
