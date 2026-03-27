function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeIdArray(values = []) {
  return [...new Set(values.map((value) => normalizeString(value)).filter(Boolean))];
}

export function buildCollectionDraftInput({ fields, currentPayload = {}, fallbackTitle = "" }) {
  const currentSeo = currentPayload.seo ?? {};
  const assetIds = normalizeIdArray(fields.assetIds ?? currentPayload.assetIds ?? []);
  const requestedPrimaryAssetId = normalizeString(fields.primaryAssetId);
  const primaryAssetId = requestedPrimaryAssetId && assetIds.includes(requestedPrimaryAssetId) ? requestedPrimaryAssetId : "";

  return {
    title: normalizeString(fields.title) || normalizeString(fallbackTitle) || normalizeString(currentPayload.title) || "Новая коллекция",
    caption: normalizeString(fields.caption ?? currentPayload.caption),
    assetIds,
    primaryAssetId,
    relatedEntityIds: Array.isArray(currentPayload.relatedEntityIds) ? [...currentPayload.relatedEntityIds] : [],
    metaTitle: normalizeString(fields.metaTitle ?? currentSeo.metaTitle),
    metaDescription: normalizeString(fields.metaDescription ?? currentSeo.metaDescription),
    canonicalIntent: normalizeString(fields.canonicalIntent ?? currentSeo.canonicalIntent),
    indexationFlag: normalizeString(fields.indexationFlag ?? currentSeo.indexationFlag) || "index",
    openGraphTitle: normalizeString(fields.openGraphTitle ?? currentSeo.openGraphTitle),
    openGraphDescription: normalizeString(fields.openGraphDescription ?? currentSeo.openGraphDescription),
    openGraphImageAssetId: normalizeString(fields.openGraphImageAssetId ?? currentSeo.openGraphImageAssetId)
  };
}
