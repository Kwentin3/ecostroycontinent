import path from "node:path";

import { NextResponse } from "next/server";

import { getString } from "../../../../../../lib/admin/form-data.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";
import { deleteMediaFile, storeMediaFile } from "../../../../../../lib/media/storage.js";
import { getMediaLibraryCard } from "../../../../../../lib/admin/media-gallery.js";

function buildTitleFromFilename(filename) {
  const base = (filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base || "Медиафайл";
}

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для загрузки медиа." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Сначала выберите изображение." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "V1 принимает только изображения." }, { status: 400 });
  }

  const storageKey = `${crypto.randomUUID()}${path.extname(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const title = getString(formData, "title") || buildTitleFromFilename(file.name);

  try {
    await storeMediaFile({
      storageKey,
      bytes,
      contentType: file.type
    });

    const saved = await saveDraft({
      entityType: "media_asset",
      entityId: null,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Новый media asset собран из медиатеки.",
      payload: {
        title,
        alt: getString(formData, "alt"),
        caption: getString(formData, "caption"),
        sourceNote: getString(formData, "sourceNote"),
        ownershipNote: getString(formData, "ownershipNote"),
        storageKey,
        mimeType: file.type,
        originalFilename: file.name,
        uploadedBy: user.username,
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
        status: "ready",
        lifecycleState: "active"
      }
    });

    const item = await getMediaLibraryCard(saved.entity.id);

    return NextResponse.json({
      ok: true,
      item,
      message: "Медиафайл загружен и появился в медиатеке."
    });
  } catch (error) {
    try {
      await deleteMediaFile(storageKey);
    } catch {
      // Best-effort cleanup for a failed create path.
    }

    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось создать media asset."
    }, { status: 500 });
  }
}
