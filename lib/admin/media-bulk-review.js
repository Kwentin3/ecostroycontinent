import { submitRevisionForReview } from "../content-ops/workflow.js";
import { getMediaLibraryCardsByIds } from "./media-gallery.js";
import { mediaAssetHasDraftForReview } from "./media-review-actions.js";

export function normalizeMediaBulkReviewIds(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function getSkipReason(item) {
  if (!item) {
    return "Медиафайл не найден.";
  }

  if (!item.currentRevisionId) {
    return "У карточки нет рабочей версии.";
  }

  if (item.statusKey !== "draft") {
    return "На проверку можно отправить только черновик.";
  }

  return "";
}

export async function submitMediaAssetsForReview({
  assetIds,
  actorUserId,
  canRenderPreview = true,
  getMediaLibraryCardsByIdsImpl = getMediaLibraryCardsByIds,
  submitRevisionForReviewImpl = submitRevisionForReview
}) {
  const requestedIds = normalizeMediaBulkReviewIds(assetIds);
  const cards = await getMediaLibraryCardsByIdsImpl(requestedIds);
  const cardById = new Map(cards.map((item) => [item.id, item]));
  const submittedIds = [];
  const skipped = [];
  const failed = [];

  for (const assetId of requestedIds) {
    const item = cardById.get(assetId) ?? null;
    const skipReason = getSkipReason(item);

    if (skipReason) {
      skipped.push({
        id: assetId,
        title: item?.title || assetId,
        reason: skipReason
      });
      continue;
    }

    try {
      await submitRevisionForReviewImpl({
        revisionId: item.currentRevisionId,
        actorUserId,
        canRenderPreview
      });
      submittedIds.push(assetId);
    } catch (error) {
      failed.push({
        id: assetId,
        title: item.title || assetId,
        reason: error?.message || "Не удалось отправить на проверку."
      });
    }
  }

  const submittedItems = submittedIds.length > 0
    ? await getMediaLibraryCardsByIdsImpl(submittedIds)
    : [];

  return {
    requestedIds,
    submittedIds,
    submittedItems,
    skipped,
    failed,
    submittedCount: submittedIds.length,
    skippedCount: skipped.length,
    failedCount: failed.length
  };
}
