import { ENTITY_TYPES } from "../content-core/content-types.js";
import { getEntityEditorState, listEntityCards, saveDraft } from "../content-core/service.js";
import { getCollectionLibraryCard, getMediaLibraryCard } from "./media-gallery.js";
import { buildCollectionDraftInputWithAssetMembership } from "./media-collections.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeIdArray(values = []) {
  return [...new Set(values.map((value) => normalizeString(value)).filter(Boolean))];
}

function hasMembershipDelta(currentPayload = {}, nextPayload = {}) {
  const currentAssetIds = normalizeIdArray(currentPayload.assetIds ?? []);
  const nextAssetIds = normalizeIdArray(nextPayload.assetIds ?? []);

  if (currentAssetIds.length !== nextAssetIds.length) {
    return true;
  }

  if (currentAssetIds.some((value, index) => value !== nextAssetIds[index])) {
    return true;
  }

  return normalizeString(currentPayload.primaryAssetId) !== normalizeString(nextPayload.primaryAssetId);
}

export async function syncAssetCollectionMembership({
  assetId,
  nextCollectionIds = [],
  userId,
  changeIntent = "",
  db = null,
  returnTouchedIdsOnly = false
}) {
  const normalizedAssetId = normalizeString(assetId);
  const desiredCollectionIds = normalizeIdArray(nextCollectionIds);
  const collectionCards = await listEntityCards(ENTITY_TYPES.GALLERY, { db });
  const touchedCollectionIds = collectionCards
    .filter((card) => {
      const payload = card.latestRevision?.payload ?? {};
      const currentAssetIds = normalizeIdArray(payload.assetIds ?? []);
      return currentAssetIds.includes(normalizedAssetId) || desiredCollectionIds.includes(card.entity.id);
    })
    .map((card) => card.entity.id);

  const updatedCollections = [];

  for (const collectionId of touchedCollectionIds) {
    const state = await getEntityEditorState(collectionId, { db });
    const currentRevision = state?.revisions?.[0] ?? state?.activePublishedRevision ?? null;

    if (!state?.entity || state.entity.entityType !== ENTITY_TYPES.GALLERY || !currentRevision) {
      continue;
    }

    const currentPayload = currentRevision.payload ?? {};
    const nextPayload = buildCollectionDraftInputWithAssetMembership({
      currentPayload,
      assetId: normalizedAssetId,
      includeAsset: desiredCollectionIds.includes(collectionId)
    });

    if (hasMembershipDelta(currentPayload, nextPayload)) {
      await saveDraft(
        {
          entityType: ENTITY_TYPES.GALLERY,
          entityId: collectionId,
          userId,
          changeIntent: changeIntent || "Состав коллекций обновлён из редактора ассета.",
          payload: nextPayload
        },
        { db }
      );
    }

    if (!returnTouchedIdsOnly) {
      const collection = await getCollectionLibraryCard(collectionId);

      if (collection) {
        updatedCollections.push(collection);
      }
    }
  }

  const item = returnTouchedIdsOnly ? null : await getMediaLibraryCard(normalizedAssetId);

  return {
    item,
    collections: updatedCollections,
    touchedCollectionIds
  };
}
