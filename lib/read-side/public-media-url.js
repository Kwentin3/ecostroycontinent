import { getAppProxyMediaUrl } from "../media/public-delivery.js";

export function getPublicMediaAssetPreviewUrl(entityId) {
  return getAppProxyMediaUrl(entityId);
}
