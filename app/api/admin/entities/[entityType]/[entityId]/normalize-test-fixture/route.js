import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback.js";
import { getString } from "../../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import {
  executeLegacyTestFixtureNormalization,
  isLegacyTestFixtureNormalizationEntityTypeSupported
} from "../../../../../../../lib/admin/legacy-test-fixture-normalization.js";
import { userCanPublish } from "../../../../../../../lib/auth/session.js";

function makeSuccessMessage() {
  return "Legacy test fixture помечен как test-marked объект. Теперь можно переходить в удаление тестового графа.";
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanPublish,
    executeLegacyTestFixtureNormalization,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanPublish(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType, entityId } = await params;

  if (!isLegacyTestFixtureNormalizationEntityTypeSupported(entityType)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const redirectTo = getString(formData, "redirectTo")
    || `/admin/entities/${entityType}/${entityId}`;
  const failureRedirectTo = getString(formData, "failureRedirectTo")
    || `/admin/entities/${entityType}/${entityId}/normalize-test-fixture`;

  try {
    const result = await routeDeps.executeLegacyTestFixtureNormalization({
      entityType,
      entityId,
      actorUserId: user.id
    });

    if (!result.executed) {
      const reason = result.evaluation?.blockers?.[0] || "Нормализация legacy test fixture отклонена правилами безопасности.";

      return redirectWithQuery(request, failureRedirectTo, {
        error: reason
      });
    }

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage()
    });
  } catch (error) {
    return redirectWithError(request, failureRedirectTo, error);
  }
}
