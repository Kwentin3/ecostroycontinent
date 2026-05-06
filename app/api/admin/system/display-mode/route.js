import { getBoolean, getString } from "../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers.js";
import { userIsSuperadmin } from "../../../../../lib/auth/roles.js";
import {
  PUBLIC_DISPLAY_MODES,
  getPublicDisplayModeMeta,
  parsePublicDisplayMode
} from "../../../../../lib/public-launch/display-mode.js";
import { setDisplayModeState } from "../../../../../lib/public-launch/display-mode-store.js";

const MIN_REASON_LENGTH = 4;

function ensureReason(reason) {
  if (reason.length < MIN_REASON_LENGTH) {
    throw new Error("Для переключения режима требуется причина.");
  }
}

function ensurePublishedOnlyConfirmation({ nextMode, confirmed }) {
  if (nextMode !== PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY) {
    return;
  }

  if (!confirmed) {
    throw new Error("Переключение в режим только опубликованного контента требует явного подтверждения.");
  }
}

export async function POST(request, _context, deps = {}) {
  const routeDeps = {
    getString,
    getBoolean,
    parsePublicDisplayMode,
    getPublicDisplayModeMeta,
    setDisplayModeState,
    requireRouteUser,
    userIsSuperadmin,
    ...deps
  };

  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userIsSuperadmin(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const redirectTo = routeDeps.getString(formData, "redirectTo") || "/admin";

  try {
    const rawMode = routeDeps.getString(formData, "mode");
    const reason = routeDeps.getString(formData, "reason");
    const confirmPublishedOnly = routeDeps.getBoolean(formData, "confirmPublishedOnly");
    const nextMode = routeDeps.parsePublicDisplayMode(rawMode);

    if (!nextMode) {
      throw new Error("Неподдерживаемый режим отображения.");
    }

    ensureReason(reason);
    ensurePublishedOnlyConfirmation({ nextMode, confirmed: confirmPublishedOnly });

    const result = await routeDeps.setDisplayModeState({
      mode: nextMode,
      actorUserId: user.id,
      reason
    });
    const nextMeta = routeDeps.getPublicDisplayModeMeta(nextMode);

    return redirectWithQuery(request, redirectTo, {
      message: result.changed
        ? `Режим отображения переключен на ${nextMeta.label}.`
        : `Режим отображения уже установлен: ${nextMeta.label}.`
    });
  } catch (error) {
    return redirectWithError(request, redirectTo, error);
  }
}
