import { userCanEditContent } from "../auth/roles.js";

export function mediaAssetHasDraftForReview(item) {
  return Boolean(item?.currentRevisionId) && item?.statusKey === "draft";
}

export function mediaAssetCanSubmitForReview(item, user) {
  return mediaAssetHasDraftForReview(item) && userCanEditContent(user);
}

export function getMediaReviewSelection(items = [], selectedIds = [], user = {}) {
  const selectedIdSet = new Set(selectedIds);
  const selectedItems = items.filter((item) => selectedIdSet.has(item.id));
  const submittableItems = selectedItems.filter((item) => mediaAssetCanSubmitForReview(item, user));
  const blockedItems = selectedItems.filter((item) => !mediaAssetCanSubmitForReview(item, user));

  return {
    selectedItems,
    submittableItems,
    blockedItems,
    selectedCount: selectedItems.length,
    submittableCount: submittableItems.length,
    blockedCount: blockedItems.length
  };
}
