import { NextResponse } from "next/server.js";

import {
  assessEntityDelete,
  buildDeleteBatchSummary,
  deleteEntityWithSafety,
  isDeleteToolEntityTypeSupported
} from "../../../../../../lib/admin/entity-delete.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";

function getEntityIds(formData) {
  return [...new Set(formData.getAll("entityId").map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function makeSuccessMessage(deletedCount) {
  return deletedCount === 1 ? "Сущность удалена." : `Удалено: ${deletedCount}.`;
}

function makeRefusalMessage(summary) {
  if (summary.refusedCount <= 0) {
    return "";
  }

  const reasonText = summary.reasons.join(" ");

  if (summary.deletedCount > 0) {
    return `Отказано: ${summary.refusedCount}. ${reasonText}`.trim();
  }

  return reasonText || "Удаление отклонено правилами безопасности.";
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    deleteEntityWithSafety,
    assessEntityDelete,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType } = await params;

  if (!isDeleteToolEntityTypeSupported(entityType)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const entityIds = getEntityIds(formData);
  const testOnly = getString(formData, "testOnly") === "true";
  const responseMode = getString(formData, "responseMode");
  const redirectTo = getString(formData, "redirectTo") || `/admin/entities/${entityType}`;
  const failureRedirectTo = getString(formData, "failureRedirectTo") || redirectTo;

  if (entityIds.length === 0) {
    if (responseMode === "json") {
      return NextResponse.json({ ok: false, error: "Сначала выберите объекты для удаления." }, { status: 400 });
    }

    return redirectWithQuery(request, failureRedirectTo, {
      error: "Сначала выберите объекты для удаления."
    });
  }

  try {
    const results = [];

    for (const entityId of entityIds) {
      results.push(await routeDeps.deleteEntityWithSafety({
        entityType,
        entityId,
        testOnly
      }));
    }

    const summary = buildDeleteBatchSummary(results);
    const deletedIds = results
      .filter((item) => item.deleted)
      .map((item) => item.decision?.entityId ?? item.entityId)
      .filter(Boolean);
    const refused = results
      .filter((item) => !item.deleted)
      .map((item) => ({
        entityId: item.decision?.entityId ?? item.entityId,
        reason: (item.reasons ?? [])[0] || "Удаление отклонено правилами безопасности."
      }));

    if (responseMode === "json") {
      if (summary.refusedCount > 0) {
        return NextResponse.json({
          ok: false,
          deletedCount: summary.deletedCount,
          deletedIds,
          refusedCount: summary.refusedCount,
          refused,
          message: summary.deletedCount > 0 ? makeSuccessMessage(summary.deletedCount) : "",
          error: makeRefusalMessage(summary)
        }, { status: summary.deletedCount > 0 ? 207 : 409 });
      }

      return NextResponse.json({
        ok: true,
        deletedCount: summary.deletedCount,
        deletedIds,
        refusedCount: 0,
        refused: [],
        message: makeSuccessMessage(summary.deletedCount)
      });
    }

    if (summary.refusedCount > 0) {
      return redirectWithQuery(request, summary.deletedCount > 0 ? redirectTo : failureRedirectTo, {
        message: summary.deletedCount > 0 ? makeSuccessMessage(summary.deletedCount) : "",
        error: makeRefusalMessage(summary)
      });
    }

    return redirectWithQuery(request, redirectTo, {
      message: makeSuccessMessage(summary.deletedCount)
    });
  } catch (error) {
    if (responseMode === "json") {
      return NextResponse.json({
        ok: false,
        error: error?.message || "Не удалось удалить выбранные объекты."
      }, { status: 500 });
    }

    return redirectWithError(request, failureRedirectTo, error);
  }
}
