import { NextResponse } from "next/server.js";

import { markMediaAssetsForRemoval } from "../../../../../../lib/admin/removal-marking.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";

const defaultDeps = {
  requireRouteUser,
  userCanEditContent,
  markMediaAssetsForRemoval
};

function buildMessage(result) {
  const parts = [];

  if (result.markedCount > 0) {
    parts.push(`Помечено на удаление: ${result.markedCount}.`);
  }

  if (result.alreadyMarkedCount > 0) {
    parts.push(`Уже были помечены: ${result.alreadyMarkedCount}.`);
  }

  if (result.failedCount > 0) {
    parts.push(`Не обработано: ${result.failedCount}.`);
  }

  return parts.join(" ") || "Нет изменений.";
}

export async function POST(request, _context = {}, deps = defaultDeps) {
  const {
    requireRouteUser: requireRouteUserImpl,
    userCanEditContent: userCanEditContentImpl,
    markMediaAssetsForRemoval: markMediaAssetsForRemovalImpl
  } = deps;
  const { user, response } = await requireRouteUserImpl(request);

  if (response) {
    return response;
  }

  if (!userCanEditContentImpl(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для пометки медиа на удаление." }, { status: 403 });
  }

  const formData = await request.formData();
  const assetIds = formData.getAll("entityId");

  if (assetIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Сначала выберите медиафайлы." }, { status: 400 });
  }

  const result = await markMediaAssetsForRemovalImpl({
    assetIds,
    actorUserId: user.id
  });
  const processedCount = result.markedCount + result.alreadyMarkedCount;
  const ok = result.failedCount === 0;
  const status = result.failedCount > 0
    ? (processedCount > 0 ? 207 : 409)
    : 200;
  const message = buildMessage(result);

  return NextResponse.json({
    ok,
    message,
    markedIds: result.markedIds,
    alreadyMarkedIds: result.alreadyMarkedIds,
    marks: result.marks,
    failed: result.failed,
    error: ok ? "" : message
  }, { status });
}
