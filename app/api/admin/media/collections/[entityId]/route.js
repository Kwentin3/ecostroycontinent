import { NextResponse } from "next/server.js";
import { revalidatePath } from "next/cache.js";

import { getString, getStringArray } from "../../../../../../lib/admin/form-data.js";
import { buildCollectionDraftInput } from "../../../../../../lib/admin/media-collections.js";
import { getCollectionLibraryCard, getMediaLibraryCardsByIds } from "../../../../../../lib/admin/media-gallery.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent, userCanPublishEntity } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { getEntityEditorState, saveDraft } from "../../../../../../lib/content-core/service.js";
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

function collectAffectedAssetIds(previousPayload, nextPayload) {
  return [
    ...(previousPayload?.assetIds ?? []),
    ...(nextPayload?.assetIds ?? []),
    previousPayload?.primaryAssetId || "",
    nextPayload?.primaryAssetId || ""
  ].filter(Boolean);
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

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    userCanPublishEntity,
    getEntityEditorState,
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

  const { entityId } = await params;
  const state = await routeDeps.getEntityEditorState(entityId);
  const currentRevision = state?.revisions?.[0] ?? state?.activePublishedRevision ?? null;

  if (!state?.entity || state.entity.entityType !== ENTITY_TYPES.GALLERY || !currentRevision) {
    return NextResponse.json({ ok: false, error: "Коллекция не найдена." }, { status: 404 });
  }

  const formData = await request.formData();
  const publishRequested = wantsPublish(formData);

  if (publishRequested && !routeDeps.userCanPublishEntity(user, ENTITY_TYPES.GALLERY)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав для публикации коллекции." }, { status: 403 });
  }

  const payload = buildCollectionDraftInput({
    fields: buildRequestedFields(formData),
    currentPayload: currentRevision.payload ?? {},
    fallbackTitle: currentRevision.payload?.title || "Коллекция"
  });

  try {
    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.GALLERY,
      entityId,
      userId: user.id,
      changeIntent: getString(formData, "changeIntent") || "Коллекция обновлена в медиатеке.",
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

    const affectedAssetIds = collectAffectedAssetIds(currentRevision.payload ?? {}, payload);
    const [collection, affectedItems] = await Promise.all([
      routeDeps.getCollectionLibraryCard(entityId),
      routeDeps.getMediaLibraryCardsByIds(affectedAssetIds)
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
      error: error?.message || "Не удалось обновить коллекцию."
    }, { status: getErrorStatus(error) });
  }
}
