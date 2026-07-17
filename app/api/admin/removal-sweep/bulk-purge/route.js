import { revalidatePath } from "next/cache.js";
import { NextResponse } from "next/server.js";

import { getString } from "../../../../../lib/admin/form-data.js";
import {
  executeRemovalSweepBatch,
  previewRemovalSweepBatch
} from "../../../../../lib/admin/removal-sweep-batch.js";
import {
  getRemovalSweepHref,
  parseRemovalSweepRootKey
} from "../../../../../lib/admin/removal-quarantine.js";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers.js";
import { userCanRunMaintenancePurge } from "../../../../../lib/auth/roles.js";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types.js";

const defaultDeps = {
  requireRouteUser,
  userCanRunMaintenancePurge,
  previewRemovalSweepBatch,
  executeRemovalSweepBatch,
  revalidatePath
};

function collectRoots(formData) {
  const rawKeys = formData.getAll("componentKey");
  const roots = rawKeys
    .map(parseRemovalSweepRootKey)
    .filter(Boolean);

  return {
    roots,
    invalidCount: rawKeys.length - roots.length
  };
}

function collectRevalidationPaths(result = {}) {
  const paths = new Set([getRemovalSweepHref(), "/admin"]);

  for (const component of result.deletedComponents ?? []) {
    for (const item of component.deleted ?? []) {
      if (item.entityType === ENTITY_TYPES.MEDIA_ASSET || item.entityType === ENTITY_TYPES.GALLERY) {
        paths.add("/admin/entities/media_asset");
      } else {
        paths.add(`/admin/entities/${item.entityType}`);
      }
    }
  }

  return [...paths];
}

function buildExecutionMessage(result) {
  const deleted = result.deletedComponentCount;
  const objects = result.deletedObjectCount;
  const failed = result.failedComponentCount;

  if (deleted === 0) {
    return "Ни одна выбранная группа не была удалена.";
  }

  if (failed > 0) {
    return `Удалено групп: ${deleted}, объектов: ${objects}. Пропущено групп: ${failed}.`;
  }

  return `Удалено групп: ${deleted}, объектов: ${objects}.`;
}

export async function POST(request, _context = {}, deps = defaultDeps) {
  const routeDeps = { ...defaultDeps, ...deps };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanRunMaintenancePurge(user)) {
    return NextResponse.json({
      ok: false,
      error: "Групповая очистка доступна только superadmin."
    }, { status: 403 });
  }

  const formData = await request.formData();
  const intent = getString(formData, "intent");
  const { roots, invalidCount } = collectRoots(formData);

  if (roots.length === 0 || invalidCount > 0) {
    return NextResponse.json({
      ok: false,
      error: invalidCount > 0
        ? "В выборе есть неподдерживаемая карточка. Обновите страницу и повторите выбор."
        : "Выберите хотя бы одну готовую к удалению карточку."
    }, { status: 400 });
  }

  if (intent !== "preview" && intent !== "execute") {
    return NextResponse.json({
      ok: false,
      error: "Неизвестное действие групповой очистки."
    }, { status: 400 });
  }

  try {
    if (intent === "preview") {
      const preview = await routeDeps.previewRemovalSweepBatch({ roots });

      return NextResponse.json({
        ok: true,
        intent,
        ...preview
      });
    }

    const result = await routeDeps.executeRemovalSweepBatch({
      roots,
      actorUserId: user.id
    });
    const revalidationPaths = collectRevalidationPaths(result);

    for (const path of revalidationPaths) {
      routeDeps.revalidatePath(path);
    }

    const status = result.deletedComponentCount > 0
      ? (result.failedComponentCount > 0 ? 207 : 200)
      : 409;
    const message = buildExecutionMessage(result);

    return NextResponse.json({
      ok: result.failedComponentCount === 0,
      intent,
      message,
      error: result.failedComponentCount > 0 ? message : "",
      revalidationPaths,
      ...result
    }, { status });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      intent,
      error: error?.message || "Не удалось выполнить групповую очистку."
    }, { status: 409 });
  }
}
