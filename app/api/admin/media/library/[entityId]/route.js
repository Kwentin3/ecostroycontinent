import { NextResponse } from "next/server";

import { getString, getStringArray } from "../../../../../../lib/admin/form-data.js";
import { saveMediaAssetWithMembership } from "../../../../../../lib/admin/media-asset-workflow.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { getEntityEditorState } from "../../../../../../lib/content-core/service.js";
import { readMediaFile, storeMediaFile } from "../../../../../../lib/media/storage.js";

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
    return NextResponse.json({ ok: false, error: "Медиафайл не найден." }, { status: 404 });
  }

  const formData = await request.formData();
  const binary = formData.get("binary");
  const collectionsTouched = getString(formData, "collectionsTouched") === "true";
  const requestedCollectionIds = collectionsTouched ? getStringArray(formData, "collectionIds") : [];
  const payload = currentRevision.payload ?? {};
  const wantsBinaryOverwrite = binary instanceof File && binary.size > 0;
  const hasPublishedRevision = Boolean(state.activePublishedRevision);
  let originalBinary = null;

  if (wantsBinaryOverwrite) {
    if (!binary.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Для замены бинарника поддерживаются только изображения." }, { status: 400 });
    }

    if (hasPublishedRevision) {
      return NextResponse.json(
        { ok: false, error: "У опубликованных ассетов binary overwrite запрещён. Для них нужен отдельный variant flow." },
        { status: 409 }
      );
    }

    if (currentRevision.state !== "draft") {
      return NextResponse.json(
        { ok: false, error: "Изображение можно править только у draft asset." },
        { status: 409 }
      );
    }

    if (!payload.storageKey) {
      return NextResponse.json(
        { ok: false, error: "У этого ассета нет storage key, поэтому заменить бинарник сейчас нельзя." },
        { status: 409 }
      );
    }
  }

  try {
    if (wantsBinaryOverwrite) {
      originalBinary = await readMediaFile(payload.storageKey);
      const editedBytes = Buffer.from(await binary.arrayBuffer());

      await storeMediaFile({
        storageKey: payload.storageKey,
        bytes: editedBytes,
        contentType: binary.type
      });
    }

    const saved = await saveMediaAssetWithMembership({
      entityId,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Медиа обновлено из медиатеки.",
      payload: {
        title: getString(formData, "title") || payload.title || payload.originalFilename || "Медиафайл",
        alt: getString(formData, "alt"),
        caption: getString(formData, "caption"),
        sourceNote: getString(formData, "sourceNote"),
        ownershipNote: getString(formData, "ownershipNote"),
        storageKey: payload.storageKey,
        mimeType: wantsBinaryOverwrite ? binary.type : payload.mimeType,
        originalFilename: payload.originalFilename,
        uploadedBy: payload.uploadedBy,
        uploadedAt: payload.uploadedAt,
        sizeBytes: wantsBinaryOverwrite ? binary.size : payload.sizeBytes,
        status: payload.status || "ready",
        lifecycleState: payload.lifecycleState || "active"
      },
      collectionsTouched,
      nextCollectionIds: requestedCollectionIds
    });

    return NextResponse.json({
      ok: true,
      item: saved.item,
      collections: saved.collections,
      warning: "",
      message: wantsBinaryOverwrite ? "Изображение и метаданные сохранены." : "Изменения сохранены."
    });
  } catch (error) {
    if (wantsBinaryOverwrite && originalBinary && payload.storageKey) {
      try {
        await storeMediaFile({
          storageKey: payload.storageKey,
          bytes: originalBinary,
          contentType: payload.mimeType || "application/octet-stream"
        });
      } catch {
        // Best-effort rollback of the binary overwrite path.
      }
    }

    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось обновить медиа."
    }, { status: 500 });
  }
}
