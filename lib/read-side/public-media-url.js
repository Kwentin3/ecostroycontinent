export function getPublicMediaAssetPreviewUrl(entityId) {
  const normalizedId = typeof entityId === "string" ? entityId.trim() : "";

  return normalizedId ? `/api/media-public/${encodeURIComponent(normalizedId)}` : "";
}
