import test from "node:test";
import assert from "node:assert/strict";

import { getAdminMediaPreviewUrls } from "../../lib/admin/media-gallery.js";

const s3AutoConfig = {
  mediaStorageMode: "s3",
  mediaPublicBaseUrl: "https://cdn.example.test",
  mediaDeliveryMode: "auto"
};

test("admin media thumbnails use CDN only for the currently published revision", () => {
  const urls = getAdminMediaPreviewUrls({
    entityId: "media_123",
    storageKey: "media/asset 123.webp",
    latestRevision: { id: "rev_published", state: "published" },
    publishedRevision: { id: "rev_published" },
    config: s3AutoConfig
  });

  assert.equal(urls.previewUrl, "/api/admin/media/media_123/preview?v=rev_published");
  assert.equal(urls.deliveryUrl, "https://cdn.example.test/media/asset%20123.webp");
  assert.equal(urls.thumbnailUrl, "https://cdn.example.test/media/asset%20123.webp");
});

test("admin media thumbnails keep draft and returned work behind the authenticated preview route", () => {
  const urls = getAdminMediaPreviewUrls({
    entityId: "media_123",
    storageKey: "media/draft asset.webp",
    latestRevision: { id: "rev_draft", state: "draft" },
    publishedRevision: { id: "rev_published" },
    config: s3AutoConfig
  });

  assert.equal(urls.previewUrl, "/api/admin/media/media_123/preview?v=rev_draft");
  assert.equal(urls.deliveryUrl, "https://cdn.example.test/media/draft%20asset.webp");
  assert.equal(urls.thumbnailUrl, "/api/admin/media/media_123/preview?v=rev_draft");
});

test("admin media preview URL contract stays empty when no storage object exists", () => {
  assert.deepEqual(
    getAdminMediaPreviewUrls({
      entityId: "media_123",
      storageKey: "",
      latestRevision: { id: "rev_empty", state: "draft" },
      publishedRevision: null,
      config: s3AutoConfig
    }),
    {
      previewUrl: "",
      deliveryUrl: "",
      thumbnailUrl: ""
    }
  );
});
