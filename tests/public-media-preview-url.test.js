import test from "node:test";
import assert from "node:assert/strict";

import { getPublicMediaAssetPreviewUrl } from "../lib/read-side/public-media-url.js";

test("published media previews use the app public media route instead of a CDN delivery URL", () => {
  assert.equal(getPublicMediaAssetPreviewUrl("media_123"), "/api/media-public/media_123");
  assert.equal(getPublicMediaAssetPreviewUrl(" media asset "), "/api/media-public/media%20asset");
  assert.equal(getPublicMediaAssetPreviewUrl(""), "");
  assert.equal(getPublicMediaAssetPreviewUrl(null), "");
});
