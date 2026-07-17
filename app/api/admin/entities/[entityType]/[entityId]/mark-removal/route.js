import { getString } from "../../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback.js";
import { markEntityForRemovalWithAudit } from "../../../../../../../lib/admin/removal-marking.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";

function getEntitySourceHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return `/admin/entities/media_asset?asset=${entityId}`;
  }

  if (entityType === ENTITY_TYPES.GALLERY) {
    return `/admin/entities/media_asset?compose=collections&collection=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}

function makeSuccessMessage() {
  return "Объект помечен на удаление.";
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    markEntityForRemovalWithAudit,
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
  const formData = await request.formData();
  const redirectTo = getString(formData, "redirectTo") || getEntitySourceHref(entityType, entityId);
  const failureRedirectTo = getString(formData, "failureRedirectTo") || redirectTo;
  const removalNote = getString(formData, "removalNote") || null;

  try {
    const result = await routeDeps.markEntityForRemovalWithAudit({
      entityType,
      entityId,
      actorUserId: user.id,
      removalNote
    });

    if (result.status === "already_marked") {
      return redirectWithQuery(request, redirectTo, {
        message: "Объект уже помечен на удаление."
      });
    }

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage()
    });
  } catch (error) {
    return redirectWithError(request, failureRedirectTo, error);
  }
}
