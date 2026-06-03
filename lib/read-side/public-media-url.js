import { getAppConfig } from "../config.js";
import { resolvePublicMediaMarkupDelivery } from "../media/public-delivery.js";

function normalizeAssetInput(assetOrEntityId) {
  if (assetOrEntityId && typeof assetOrEntityId === "object") {
    return assetOrEntityId;
  }

  return { entityId: assetOrEntityId };
}

export function getPublicMediaAssetDelivery(assetOrEntityId, config = getAppConfig()) {
  return resolvePublicMediaMarkupDelivery({
    asset: normalizeAssetInput(assetOrEntityId),
    config
  });
}

export function getPublicMediaAssetPreviewUrl(assetOrEntityId, config = getAppConfig()) {
  return getPublicMediaAssetDelivery(assetOrEntityId, config).url;
}
