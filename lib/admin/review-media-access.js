import { ENTITY_TYPES } from "../content-core/content-types.js";
import { getEntityEditorState } from "../content-core/service.js";
import { getReviewQueue } from "../content-ops/workflow.js";

const MEDIA_ID_FIELDS = new Set([
  "mediaAssetId",
  "primaryMediaAssetId",
  "primaryAssetId"
]);

const MEDIA_ID_ARRAY_FIELDS = new Set([
  "assetIds",
  "mediaAssetIds"
]);

const GALLERY_ID_FIELDS = new Set([
  "galleryId",
  "primaryGalleryId"
]);

const GALLERY_ID_ARRAY_FIELDS = new Set([
  "galleryIds"
]);

const defaultDeps = {
  getReviewQueue,
  getEntityEditorState
};

function addStringId(target, value) {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();

  if (normalized) {
    target.add(normalized);
  }
}

function addStringIds(target, value) {
  if (!Array.isArray(value)) {
    addStringId(target, value);
    return;
  }

  for (const item of value) {
    addStringId(target, item);
  }
}

export function collectReviewMediaReferences(value, refs = { mediaIds: new Set(), galleryIds: new Set() }) {
  if (!value || typeof value !== "object") {
    return refs;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectReviewMediaReferences(item, refs);
    }

    return refs;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    if (MEDIA_ID_FIELDS.has(key) || MEDIA_ID_ARRAY_FIELDS.has(key)) {
      addStringIds(refs.mediaIds, fieldValue);
    }

    if (GALLERY_ID_FIELDS.has(key) || GALLERY_ID_ARRAY_FIELDS.has(key)) {
      addStringIds(refs.galleryIds, fieldValue);
    }

    if (fieldValue && typeof fieldValue === "object") {
      collectReviewMediaReferences(fieldValue, refs);
    }
  }

  return refs;
}

async function galleryReviewReferenceIncludesMedia(galleryId, targetMediaId, deps) {
  const state = await deps.getEntityEditorState(galleryId);

  if (!state?.entity || state.entity.entityType !== ENTITY_TYPES.GALLERY) {
    return false;
  }

  const revision = state.revisions?.[0] ?? state.activePublishedRevision ?? null;
  const refs = collectReviewMediaReferences(revision?.payload ?? {});

  return refs.mediaIds.has(targetMediaId);
}

export async function mediaAssetIsVisibleInReviewQueue(entityId, deps = defaultDeps) {
  const targetMediaId = typeof entityId === "string" ? entityId.trim() : "";

  if (!targetMediaId) {
    return false;
  }

  const queue = await deps.getReviewQueue();
  const galleryIds = new Set();

  for (const item of queue) {
    if (item.entityType === ENTITY_TYPES.MEDIA_ASSET && item.entityId === targetMediaId) {
      return true;
    }

    const refs = collectReviewMediaReferences(item.revision?.payload ?? {});

    if (refs.mediaIds.has(targetMediaId)) {
      return true;
    }

    for (const galleryId of refs.galleryIds) {
      galleryIds.add(galleryId);
    }
  }

  for (const galleryId of galleryIds) {
    if (await galleryReviewReferenceIncludesMedia(galleryId, targetMediaId, deps)) {
      return true;
    }
  }

  return false;
}
