import { NextResponse } from "next/server.js";
import { revalidatePath } from "next/cache.js";

import { getString, getStringArray } from "../../../../../../lib/admin/form-data.js";
import { buildCollectionDraftInput } from "../../../../../../lib/admin/media-collections.js";
import { getCollectionLibraryCard, getMediaLibraryCardsByIds } from "../../../../../../lib/admin/media-gallery.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent, userCanPublishEntity } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";
import { publishGalleryCollectionRevision } from "../../../../../../lib/content-ops/workflow.js";

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

function wantsPublish(formData) {
  return getString(formData, "publicationIntent") === "publish";
}

function getErrorStatus(error) {
  return error?.code === "COLLECTION_PUBLISH_BLOCKED" ? 400 : 500;
}

function revalidateFollowUpPaths(paths = [], revalidatePathImpl = revalidatePath) {
  for (const path of paths) {
    revalidatePathImpl(path);
  }
}

export async function POST(request, _context, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    userCanPublishEntity,
    saveDraft,
    publishGalleryCollectionRevision,
    getCollectionLibraryCard,
    getMediaLibraryCardsByIds,
    revalidatePath,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для работы с коллекциями." }, { status: 403 });
  }

  const formData = await request.formData();
  const publishRequested = wantsPublish(formData);

  if (publishRequested && !routeDeps.userCanPublishEntity(user, ENTITY_TYPES.GALLERY)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для публикации коллекции." }, { status: 403 });
  }

  const payload = buildCollectionDraftInput({
    fields: buildRequestedFields(formData),
    fallbackTitle: "Новая коллекция"
  });

  try {
    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.GALLERY,
      entityId: null,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Коллекция собрана в медиатеке.",
      payload
    });

    let publishResult = null;

    if (publishRequested) {
      publishResult = await routeDeps.publishGalleryCollectionRevision({
        revisionId: saved.revision.id,
        actorUserId: user.id
      });
      revalidateFollowUpPaths(publishResult.publishFollowUp?.revalidationPaths, routeDeps.revalidatePath);
    }

    const [collection, affectedItems] = await Promise.all([
      routeDeps.getCollectionLibraryCard(saved.entity.id),
      routeDeps.getMediaLibraryCardsByIds(payload.assetIds)
    ]);

    return NextResponse.json({
      ok: true,
      collection,
      affectedItems,
      published: Boolean(publishResult),
      message: publishResult
        ? "Коллекция опубликована и доступна в связях кейсов."
        : "Коллекция сохранена как черновик."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Не удалось создать коллекцию."
    }, { status: getErrorStatus(error) });
  }
}
