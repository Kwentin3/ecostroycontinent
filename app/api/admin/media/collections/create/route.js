import { NextResponse } from "next/server";

import { getString, getStringArray } from "../../../../../../lib/admin/form-data.js";
import { buildCollectionDraftInput } from "../../../../../../lib/admin/media-collections.js";
import { getCollectionLibraryCard, getMediaLibraryCardsByIds } from "../../../../../../lib/admin/media-gallery.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";

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

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для работы с коллекциями." }, { status: 403 });
  }

  const formData = await request.formData();
  const payload = buildCollectionDraftInput({
    fields: buildRequestedFields(formData),
    fallbackTitle: "Новая коллекция"
  });

  try {
    const saved = await saveDraft({
      entityType: "gallery",
      entityId: null,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Коллекция собрана из media workspace.",
      payload
    });

    const [collection, affectedItems] = await Promise.all([
      getCollectionLibraryCard(saved.entity.id),
      getMediaLibraryCardsByIds(payload.assetIds)
    ]);

    return NextResponse.json({
      ok: true,
      collection,
      affectedItems,
      message: "Коллекция сохранена внутри media workspace."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось создать коллекцию."
    }, { status: 500 });
  }
}
