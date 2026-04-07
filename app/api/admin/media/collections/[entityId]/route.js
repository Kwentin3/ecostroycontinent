import { NextResponse } from "next/server";

import { getString, getStringArray } from "../../../../../../lib/admin/form-data.js";
import { buildCollectionDraftInput } from "../../../../../../lib/admin/media-collections.js";
import { getCollectionLibraryCard, getMediaLibraryCardsByIds } from "../../../../../../lib/admin/media-gallery.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { getEntityEditorState, saveDraft } from "../../../../../../lib/content-core/service.js";

function buildRequestedFields(formData) {
  return {
    title: getString(formData, "title"),
    caption: getString(formData, "caption"),
    primaryAssetId: getString(formData, "primaryAssetId"),
    assetIds: getStringArray(formData, "assetIds"),
    metaTitle: getString(formData, "metaTitle"),
    metaDescription: getString(formData, "metaDescription"),
    canonicalIntent: getString(formData, "canonicalIntent"),
    indexationFlag: getString(formData, "indexationFlag") || "index",
    openGraphTitle: getString(formData, "openGraphTitle"),
    openGraphDescription: getString(formData, "openGraphDescription"),
    openGraphImageAssetId: getString(formData, "openGraphImageAssetId")
  };
}

function collectAffectedAssetIds(previousPayload, nextPayload) {
  return [
    ...(previousPayload?.assetIds ?? []),
    ...(nextPayload?.assetIds ?? []),
    previousPayload?.primaryAssetId || "",
    nextPayload?.primaryAssetId || ""
  ].filter(Boolean);
}

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для работы с коллекциями." }, { status: 403 });
  }

  const { entityId } = await params;
  const state = await getEntityEditorState(entityId);
  const currentRevision = state?.revisions?.[0] ?? state?.activePublishedRevision ?? null;

  if (!state?.entity || state.entity.entityType !== "gallery" || !currentRevision) {
    return NextResponse.json({ ok: false, error: "Коллекция не найдена." }, { status: 404 });
  }

  const formData = await request.formData();
  const payload = buildCollectionDraftInput({
    fields: buildRequestedFields(formData),
    currentPayload: currentRevision.payload ?? {},
    fallbackTitle: currentRevision.payload?.title || "Коллекция"
  });

  try {
    await saveDraft({
      entityType: "gallery",
      entityId,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Коллекция обновлена в медиатеке.",
      payload
    });

    const affectedAssetIds = collectAffectedAssetIds(currentRevision.payload ?? {}, payload);
    const [collection, affectedItems] = await Promise.all([
      getCollectionLibraryCard(entityId),
      getMediaLibraryCardsByIds(affectedAssetIds)
    ]);

    return NextResponse.json({
      ok: true,
      collection,
      affectedItems,
      message: "Коллекция обновлена."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось обновить коллекцию."
    }, { status: 500 });
  }
}
