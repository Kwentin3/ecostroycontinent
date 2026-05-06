import { getAppConfig } from "../../../../lib/config";
import { resolvePublicMediaDelivery } from "../../../../lib/media/public-delivery";
import { readMediaFile } from "../../../../lib/media/storage";
import { getPublishedMediaAsset } from "../../../../lib/read-side/public-content";

export async function GET(_request, { params }) {
  const config = getAppConfig();
  const { entityId } = await params;
  const asset = await getPublishedMediaAsset(entityId);

  if (!asset) {
    return new Response("Не найдено", { status: 404 });
  }

  if (config.mediaStorageMode === "s3") {
    const delivery = await resolvePublicMediaDelivery({
      asset,
      config
    });

    if (delivery.mode === "cdn" && delivery.url) {
      return Response.redirect(delivery.url, 302);
    }
  }

  try {
    const bytes = await readMediaFile(asset.storageKey);

    return new Response(bytes, {
      headers: {
        "content-type": asset.mimeType || "application/octet-stream",
        "cache-control": "public, max-age=3600"
      }
    });
  } catch {
    return new Response("Не найдено", { status: 404 });
  }
}
