import { getAppProxyMediaUrl } from "../media/public-delivery.js";

export function getPublicMediaAssetPreviewUrl(entityId) {
  // Sticky canon: public markup points at the entity route, not a raw CDN URL,
  // so delivery mode can change without changing editorial media truth.
  return getAppProxyMediaUrl(entityId);
}
