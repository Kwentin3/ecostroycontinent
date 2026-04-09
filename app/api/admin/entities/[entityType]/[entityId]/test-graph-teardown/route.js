import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback.js";
import { getString } from "../../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { executeTestGraphTeardown, isTestGraphTeardownEntityTypeSupported } from "../../../../../../../lib/admin/test-graph-teardown.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";

function makeSuccessMessage(deletedCount) {
  if (deletedCount <= 0) {
    return "Тестовый граф очищен.";
  }

  return deletedCount === 1
    ? "Тестовый объект удалён."
    : `Тестовый граф удалён: ${deletedCount}.`;
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    executeTestGraphTeardown,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType, entityId } = await params;

  if (!isTestGraphTeardownEntityTypeSupported(entityType)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const redirectTo = getString(formData, "redirectTo")
    || (entityType === "media_asset" ? "/admin/entities/media_asset" : `/admin/entities/${entityType}`);
  const failureRedirectTo = getString(formData, "failureRedirectTo")
    || `/admin/entities/${entityType}/${entityId}/test-graph-teardown`;

  try {
    const result = await routeDeps.executeTestGraphTeardown({
      entityType,
      entityId,
      actorUserId: user.id
    });

    if (!result.executed) {
      const reason = result.evaluation?.blockers?.[0] || "Удаление тестового графа отклонено правилами безопасности.";
      return redirectWithQuery(request, failureRedirectTo, {
        error: reason
      });
    }

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage(result.deletedCount)
    });
  } catch (error) {
    return redirectWithError(request, failureRedirectTo, error);
  }
}
