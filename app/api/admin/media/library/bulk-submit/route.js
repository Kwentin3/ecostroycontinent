import { NextResponse } from "next/server.js";

import { submitMediaAssetsForReview } from "../../../../../../lib/admin/media-bulk-review.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";

const defaultDeps = {
  requireRouteUser,
  userCanEditContent,
  submitMediaAssetsForReview
};

function buildMessage(result) {
  const parts = [];

  if (result.submittedCount > 0) {
    parts.push(`Отправлено на проверку: ${result.submittedCount}.`);
  }

  if (result.skippedCount > 0) {
    parts.push(`Пропущено: ${result.skippedCount}.`);
  }

  if (result.failedCount > 0) {
    parts.push(`С ошибкой: ${result.failedCount}.`);
  }

  return parts.join(" ") || "Нет изменений.";
}

export async function POST(request, _context = {}, deps = defaultDeps) {
  const {
    requireRouteUser: requireRouteUserImpl,
    userCanEditContent: userCanEditContentImpl,
    submitMediaAssetsForReview: submitMediaAssetsForReviewImpl
  } = deps;
  const { user, response } = await requireRouteUserImpl(request);

  if (response) {
    return response;
  }

  if (!userCanEditContentImpl(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для отправки медиа на проверку." }, { status: 403 });
  }

  const formData = await request.formData();
  const assetIds = formData.getAll("entityId");

  if (assetIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Сначала выберите медиафайлы." }, { status: 400 });
  }

  const result = await submitMediaAssetsForReviewImpl({
    assetIds,
    actorUserId: user.id,
    canRenderPreview: true
  });
  const ok = result.submittedCount > 0 && result.failedCount === 0;
  const status = result.failedCount > 0
    ? (result.submittedCount > 0 ? 207 : 409)
    : result.submittedCount > 0
      ? 200
      : 409;

  return NextResponse.json({
    ok,
    message: buildMessage(result),
    submittedIds: result.submittedIds,
    items: result.submittedItems,
    skipped: result.skipped,
    failed: result.failed,
    error: ok ? "" : buildMessage(result)
  }, { status });
}
