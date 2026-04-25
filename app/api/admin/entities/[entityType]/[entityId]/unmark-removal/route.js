import { getString } from "../../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";
import { recordAuditEvent } from "../../../../../../../lib/content-ops/audit.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";
import { clearEntityRemovalMark, findEntityById } from "../../../../../../../lib/content-core/repository.js";
import { isRemovalQuarantineEntityTypeSupported } from "../../../../../../../lib/admin/removal-quarantine.js";

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
  return "Пометка удаления снята.";
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    findEntityById,
    clearEntityRemovalMark,
    recordAuditEvent,
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

  try {
    if (!isRemovalQuarantineEntityTypeSupported(entityType)) {
      throw new Error("Этот тип сущности пока не поддерживает пометку удаления.");
    }

    const entity = await routeDeps.findEntityById(entityId);

    if (!entity || entity.entityType !== entityType) {
      throw new Error("Сущность не найдена.");
    }

    if (!entity.markedForRemovalAt) {
      return redirectWithQuery(request, redirectTo, {
        message: "Пометка удаления уже снята."
      });
    }

    await routeDeps.clearEntityRemovalMark(entityId, user.id);
    await routeDeps.recordAuditEvent({
      entityId,
      actorUserId: user.id,
      eventKey: AUDIT_EVENT_KEYS.REMOVAL_UNMARKED,
      summary: makeSuccessMessage(),
      details: {
        entityType,
        entityId
      }
    });

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage()
    });
  } catch (error) {
    return redirectWithError(request, failureRedirectTo, error);
  }
}
