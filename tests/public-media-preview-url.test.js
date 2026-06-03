import test from "node:test";
import assert from "node:assert/strict";

import {
  getPublicMediaAssetDelivery,
  getPublicMediaAssetPreviewUrl
} from "../lib/read-side/public-media-url.js";

const s3AutoConfig = {
  mediaStorageMode: "s3",
  mediaPublicBaseUrl: "https://cdn.example.test",
  mediaDeliveryMode: "auto"
};

test("published media previews use direct CDN URLs for CDN-capable public markup", () => {
  const asset = {
    entityId: "media_123",
    storageKey: "media/asset 123.webp"
  };

  assert.equal(
    getPublicMediaAssetPreviewUrl(asset, s3AutoConfig),
    "https://cdn.example.test/media/asset%20123.webp"
  );
  assert.deepEqual(
    getPublicMediaAssetDelivery(asset, s3AutoConfig),
    {
      mode: "cdn",
      url: "https://cdn.example.test/media/asset%20123.webp",
      fallbackUrl: "/api/media-public/media_123"
    }
  );
});

test("published media previews keep app public route in app proxy mode", () => {
  const appProxyConfig = {
    mediaStorageMode: "s3",
    mediaPublicBaseUrl: "https://cdn.example.test",
    mediaDeliveryMode: "app_proxy"
  };

  assert.equal(getPublicMediaAssetPreviewUrl("media_123", appProxyConfig), "/api/media-public/media_123");
  assert.equal(getPublicMediaAssetPreviewUrl(" media asset ", appProxyConfig), "/api/media-public/media%20asset");
  assert.equal(getPublicMediaAssetPreviewUrl("", appProxyConfig), "");
  assert.equal(getPublicMediaAssetPreviewUrl(null, appProxyConfig), "");
});
