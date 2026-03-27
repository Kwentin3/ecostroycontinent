import { NextResponse } from "next/server";

import { getString } from "../../../../../../../lib/admin/form-data.js";
import { getMediaLibraryCard } from "../../../../../../../lib/admin/media-gallery.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";
import { getEntityEditorState, saveDraft } from "../../../../../../../lib/content-core/service.js";

function buildLifecycleMessage(action) {
  return action === "restore"
    ? "Ассет возвращён из архива."
    : "Ассет переведён в архив.";
}

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для изменения жизненного цикла медиа." }, { status: 403 });
  }

  const { entityId } = await params;
  const state = await getEntityEditorState(entityId);
  const currentRevision = state?.revisions?.[0] ?? state?.activePublishedRevision ?? null;

  if (!state?.entity || state.entity.entityType !== "media_asset" || !currentRevision) {
    return NextResponse.json({ ok: false, error: "Медиафайл не найден." }, { status: 404 });
  }

  const currentItem = await getMediaLibraryCard(entityId);

  if (!currentItem) {
    return NextResponse.json({ ok: false, error: "Медиафайл не найден." }, { status: 404 });
  }

  const formData = await request.formData();
  const action = getString(formData, "action") || "archive";

  if (!["archive", "restore"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Неизвестное lifecycle-действие." }, { status: 400 });
  }

  if (action === "archive" && currentItem.archiveBlocked) {
    return NextResponse.json(
      { ok: false, error: "Архив недоступен, пока у ассета есть активные ссылки." },
      { status: 409 }
    );
  }

  const payload = currentRevision.payload ?? {};
  const nextLifecycleState = action === "restore" ? "active" : "archived";

  await saveDraft({
    entityType: "media_asset",
    entityId,
    userId: user.id,
    changeIntent:
      getString(formData, "changeIntent") ||
      (action === "restore" ? "Ассет возвращён из архива из медиатеки." : "Ассет переведён в архив из медиатеки."),
    payload: {
      title: payload.title || payload.originalFilename || "Медиафайл",
      alt: payload.alt,
      caption: payload.caption,
      sourceNote: payload.sourceNote,
      ownershipNote: payload.ownershipNote,
      storageKey: payload.storageKey,
      mimeType: payload.mimeType,
      originalFilename: payload.originalFilename,
      uploadedBy: payload.uploadedBy,
      uploadedAt: payload.uploadedAt,
      sizeBytes: payload.sizeBytes,
      status: payload.status || "ready",
      lifecycleState: nextLifecycleState
    }
  });

  const item = await getMediaLibraryCard(entityId);

  return NextResponse.json({
    ok: true,
    item,
    message: buildLifecycleMessage(action)
  });
}
