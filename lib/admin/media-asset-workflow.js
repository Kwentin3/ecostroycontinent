import { withTransaction } from "../db/client.js";
import { saveDraft } from "../content-core/service.js";
import { getCollectionLibraryCard, getMediaLibraryCard } from "./media-gallery.js";
import { syncAssetCollectionMembership } from "./media-collection-membership.js";

function normalizeIdArray(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export async function saveMediaAssetWithMembership({
  entityId,
  userId,
  changeIntent,
  payload,
  collectionsTouched = false,
  nextCollectionIds = []
}) {
  const desiredCollectionIds = normalizeIdArray(nextCollectionIds);

  const transactionResult = await withTransaction(async (db) => {
    const saved = await saveDraft(
      {
        entityType: "media_asset",
        entityId,
        userId,
        changeIntent,
        payload
      },
      { db }
    );

    const membership = collectionsTouched
      ? await syncAssetCollectionMembership({
          assetId: saved.entity.id,
          nextCollectionIds: desiredCollectionIds,
          userId,
          changeIntent,
          db,
          returnTouchedIdsOnly: true
        })
      : { touchedCollectionIds: [] };

    return {
      saved,
      touchedCollectionIds: membership.touchedCollectionIds ?? []
    };
  });

  const item = await getMediaLibraryCard(transactionResult.saved.entity.id);
  const collectionIds = transactionResult.touchedCollectionIds.length
    ? transactionResult.touchedCollectionIds
    : desiredCollectionIds;
  const collections = await Promise.all(collectionIds.map((collectionId) => getCollectionLibraryCard(collectionId)));

  return {
    item,
    collections: collections.filter(Boolean),
    saved: transactionResult.saved
  };
}
