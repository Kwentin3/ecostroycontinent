import { revalidatePath } from "next/cache.js";
import { NextResponse } from "next/server.js";

import { redirectToAdmin, redirectWithError, redirectWithQuery, toOperatorMessage } from "../../../../../../../lib/admin/operation-feedback.js";
import { getString } from "../../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import {
  executeLiveDeactivation,
  isLiveDeactivationEntityTypeSupported
} from "../../../../../../../lib/admin/live-deactivation.js";
import { userCanPublish } from "../../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";

function makeSuccessMessage() {
  return "Объект снят с публикации.";
}

function getEntitySourceHref(entityType, entityId) {
  return entityType === ENTITY_TYPES.MEDIA_ASSET
    ? `/admin/entities/media_asset?asset=${entityId}`
    : `/admin/entities/${entityType}/${entityId}`;
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanPublish,
    executeLiveDeactivation,
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

  const { entityType, entityId } = await params;

  if (!isLiveDeactivationEntityTypeSupported(entityType)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const responseMode = getString(formData, "responseMode");
  const redirectTo = getString(formData, "redirectTo")
    || getEntitySourceHref(entityType, entityId);
  const failureRedirectTo = getString(formData, "failureRedirectTo")
    || `/admin/entities/${entityType}/${entityId}/live-deactivation`;

  try {
    const result = await routeDeps.executeLiveDeactivation({
      entityType,
      entityId,
      actorUserId: user.id
    });

    if (!result.executed) {
      const reason = result.evaluation?.blockers?.[0] || "Выведение из живого контура отклонено правилами безопасности.";

      if (responseMode === "json") {
        return NextResponse.json({
          ok: false,
          error: reason,
          evaluation: result.evaluation ?? null
        }, { status: 409 });
      }

      return redirectWithQuery(request, failureRedirectTo, {
        error: reason
      });
    }

    for (const path of result.revalidationPaths ?? []) {
      if (path) {
        routeDeps.revalidatePath(path);
      }
    }

    if (responseMode === "json") {
      return NextResponse.json({
        ok: true,
        message: makeSuccessMessage(),
        evaluation: result.evaluation ?? null,
        revalidationPaths: result.revalidationPaths ?? []
      });
    }

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage()
    });
  } catch (error) {
    if (responseMode === "json") {
      return NextResponse.json({
        ok: false,
        error: toOperatorMessage(error)
      }, { status: 500 });
    }

    return redirectWithError(request, failureRedirectTo, error);
  }
}
