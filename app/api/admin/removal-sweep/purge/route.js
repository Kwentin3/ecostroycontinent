import { revalidatePath } from "next/cache.js";
import { NextResponse } from "next/server.js";

import { getString } from "../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery, toOperatorMessage } from "../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers.js";
import { executeRemovalSweep } from "../../../../../lib/admin/removal-sweep-analysis.js";
import { getRemovalSweepHref, isRemovalQuarantineEntityTypeSupported } from "../../../../../lib/admin/removal-quarantine.js";
import { userIsSuperadmin } from "../../../../../lib/auth/roles.js";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types.js";

function collectRevalidationPaths(result = {}) {
  const paths = new Set([getRemovalSweepHref(), "/admin"]);

  for (const item of result.deleted ?? []) {
    if (item.entityType === ENTITY_TYPES.MEDIA_ASSET || item.entityType === ENTITY_TYPES.GALLERY) {
      paths.add("/admin/entities/media_asset");
      continue;
    }

    paths.add(`/admin/entities/${item.entityType}`);
  }

  return [...paths];
}

function makeSuccessMessage() {
  return "Помеченный граф очищен.";
}

export async function POST(request, _context, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userIsSuperadmin,
    executeRemovalSweep,
    revalidatePath,
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
  const entityType = getString(formData, "entityType");
  const entityId = getString(formData, "entityId");
  const redirectTo = getString(formData, "redirectTo") || getRemovalSweepHref();
  const failureRedirectTo = getString(formData, "failureRedirectTo") || getRemovalSweepHref();
  const responseMode = getString(formData, "responseMode");

  try {
    if (!entityId || !entityType) {
      throw new Error("Нужно указать корневой объект для очистки.");
    }

    if (!isRemovalQuarantineEntityTypeSupported(entityType)) {
      throw new Error("Этот тип сущности пока не поддерживает новый cleanup-контур.");
    }

    const result = await routeDeps.executeRemovalSweep({
      entityType,
      entityId,
      actorUserId: user.id
    });
    const revalidationPaths = collectRevalidationPaths(result);

    for (const path of revalidationPaths) {
      routeDeps.revalidatePath(path);
    }

    if (responseMode === "json") {
      return NextResponse.json({
        ok: true,
        message: makeSuccessMessage(),
        deleted: result.deleted ?? [],
        revalidationPaths
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
      }, { status: 409 });
    }

    return redirectWithError(request, failureRedirectTo, error);
  }
}
