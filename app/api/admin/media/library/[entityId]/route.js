import { NextResponse } from "next/server";

import { getString } from "../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { getMediaLibraryCard } from "../../../../../../lib/admin/media-gallery.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { getEntityEditorState, saveDraft } from "../../../../../../lib/content-core/service.js";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для редактирования медиа." }, { status: 403 });
  }

  const { entityId } = await params;
  const state = await getEntityEditorState(entityId);
  const currentRevision = state?.revisions?.[0] ?? state?.activePublishedRevision ?? null;

  if (!state?.entity || state.entity.entityType !== "media_asset" || !currentRevision) {
    return NextResponse.json({ ok: false, error: "Media asset не найден." }, { status: 404 });
  }

  const formData = await request.formData();
  const payload = currentRevision.payload ?? {};

  try {
    await saveDraft({
      entityType: "media_asset",
      entityId,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Медиа обновлено из галереи.",
      payload: {
        title: getString(formData, "title") || payload.title || payload.originalFilename || "Медиафайл",
        alt: getString(formData, "alt"),
        caption: getString(formData, "caption"),
        sourceNote: getString(formData, "sourceNote"),
        ownershipNote: getString(formData, "ownershipNote"),
        storageKey: payload.storageKey,
        mimeType: payload.mimeType,
        originalFilename: payload.originalFilename,
        uploadedBy: payload.uploadedBy,
        uploadedAt: payload.uploadedAt,
        sizeBytes: payload.sizeBytes,
        status: payload.status || "ready"
      }
    });

    const item = await getMediaLibraryCard(entityId);

    return NextResponse.json({
      ok: true,
      item,
      message: "Изменения сохранены."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось обновить media asset."
    }, { status: 500 });
  }
}
