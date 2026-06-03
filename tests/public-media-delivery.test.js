import test from "node:test";
import assert from "node:assert/strict";

import {
  PUBLIC_MEDIA_CDN_REDIRECT_CACHE_CONTROL,
  clearPublicMediaDeliveryProbeCache,
  createPublicMediaRedirectResponse,
  getAppProxyMediaUrl,
  getCdnMediaUrl,
  resolvePublicMediaDelivery,
  resolvePublicMediaMarkupDelivery
} from "../lib/media/public-delivery.js";

const asset = {
  entityId: "media_123",
  storageKey: "media/asset 123.webp"
};

const s3Config = {
  mediaStorageMode: "s3",
  mediaPublicBaseUrl: "https://cdn.example.test",
  mediaDeliveryMode: "auto"
};

test("public media delivery keeps stable app and CDN boundary URLs", () => {
  assert.equal(getAppProxyMediaUrl(" media asset "), "/api/media-public/media%20asset");
  assert.equal(getAppProxyMediaUrl(""), "");
  assert.equal(getCdnMediaUrl({ storageKey: asset.storageKey }, s3Config), "https://cdn.example.test/media/asset%20123.webp");
});

test("public media markup uses direct CDN URLs in CDN-capable modes", () => {
  assert.deepEqual(
    resolvePublicMediaMarkupDelivery({
      asset,
      config: s3Config
    }),
    {
      mode: "cdn",
      url: "https://cdn.example.test/media/asset%20123.webp",
      fallbackUrl: "/api/media-public/media_123"
    }
  );

  assert.deepEqual(
    resolvePublicMediaMarkupDelivery({
      asset,
      config: { ...s3Config, mediaDeliveryMode: "cdn" }
    }),
    {
      mode: "cdn",
      url: "https://cdn.example.test/media/asset%20123.webp",
      fallbackUrl: "/api/media-public/media_123"
    }
  );
});

test("public media markup keeps app proxy URLs when app proxy mode is selected", () => {
  assert.deepEqual(
    resolvePublicMediaMarkupDelivery({
      asset,
      config: { ...s3Config, mediaDeliveryMode: "app_proxy" }
    }),
    {
      mode: "app_proxy",
      url: "/api/media-public/media_123",
      fallbackUrl: "https://cdn.example.test/media/asset%20123.webp"
    }
  );
});

test("public media delivery streams through the app in app_proxy mode", async () => {
  const delivery = await resolvePublicMediaDelivery({
    asset,
    config: { ...s3Config, mediaDeliveryMode: "app_proxy" },
    fetchImpl: async () => {
      throw new Error("cdn should not be probed in app_proxy mode");
    }
  });

  assert.deepEqual(delivery, {
    mode: "app_proxy",
    url: "/api/media-public/media_123",
    fallbackUrl: "https://cdn.example.test/media/asset%20123.webp"
  });
});

test("public media delivery redirects to CDN only when auto probe succeeds", async () => {
  clearPublicMediaDeliveryProbeCache();
  const delivery = await resolvePublicMediaDelivery({
    asset,
    config: s3Config,
    now: 1000,
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://cdn.example.test/media/asset%20123.webp");
      assert.equal(options.method, "HEAD");
      return { ok: true };
    }
  });

  assert.deepEqual(delivery, {
    mode: "cdn",
    url: "https://cdn.example.test/media/asset%20123.webp",
    fallbackUrl: "/api/media-public/media_123"
  });
});

test("public media delivery falls back to app proxy when CDN probe fails", async () => {
  clearPublicMediaDeliveryProbeCache();
  const delivery = await resolvePublicMediaDelivery({
    asset,
    config: s3Config,
    now: 2000,
    fetchImpl: async () => ({ ok: false })
  });

  assert.deepEqual(delivery, {
    mode: "app_proxy",
    url: "/api/media-public/media_123",
    fallbackUrl: "https://cdn.example.test/media/asset%20123.webp"
  });
});

test("public media CDN redirect response is short-cacheable at the app boundary", () => {
  const response = createPublicMediaRedirectResponse("https://cdn.example.test/media/asset.webp");

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://cdn.example.test/media/asset.webp");
  assert.equal(response.headers.get("cache-control"), PUBLIC_MEDIA_CDN_REDIRECT_CACHE_CONTROL);
});
