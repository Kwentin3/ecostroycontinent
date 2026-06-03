import { getAppConfig } from "../../../../lib/config";
import {
  PUBLIC_MEDIA_APP_PROXY_CACHE_CONTROL,
  createPublicMediaRedirectResponse,
  resolvePublicMediaDelivery
} from "../../../../lib/media/public-delivery";
import { readMediaFile } from "../../../../lib/media/storage";
import { getPublishedMediaAsset } from "../../../../lib/read-side/public-content";

export async function GET(_request, { params }) {
  // Sticky canon: public markup may already point directly at CDN. This route
  // is the fallback/handoff boundary for published media and never owns media
  // truth. Metadata stays in SQL and binary truth stays in S3/storage.
  const { entityId } = await params;
  const asset = await getPublishedMediaAsset(entityId);

  if (!asset) {
    return new Response("Не найдено", { status: 404 });
  }

  const delivery = await resolvePublicMediaDelivery({
    asset,
    config: getAppConfig()
  });

  if (delivery.mode === "cdn" && delivery.url) {
    return createPublicMediaRedirectResponse(delivery.url);
  }

  try {
    const bytes = await readMediaFile(asset.storageKey);

    return new Response(bytes, {
      headers: {
        "content-type": asset.mimeType || "application/octet-stream",
        "cache-control": PUBLIC_MEDIA_APP_PROXY_CACHE_CONTROL
      }
    });
  } catch {
    return new Response("Не найдено", { status: 404 });
  }
}
