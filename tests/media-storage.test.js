import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { createMediaStorageAdapter, getMediaDeliveryUrl } from "../lib/media/storage.js";

test("local media storage adapter writes and reads bytes from the configured directory", async () => {
  const mediaStorageDir = await fs.mkdtemp(path.join(os.tmpdir(), "ecostroy-media-"));
  const adapter = createMediaStorageAdapter({
    mediaStorageMode: "local",
    mediaStorageDir
  });
  const storageKey = `asset-${crypto.randomUUID()}.jpg`;
  const bytes = Buffer.from("media-bytes");

  await adapter.storeMediaFile({ storageKey, bytes });
  const stored = await adapter.readMediaFile(storageKey);

  assert.equal(stored.toString("utf8"), "media-bytes");
});

test("media delivery URL resolves to CDN in s3 mode and falls back to the public route in local mode", () => {
  const cdnUrl = getMediaDeliveryUrl(
    {
      entityId: "entity_123",
      storageKey: "media/asset-123.jpg"
    },
    {
      mediaStorageMode: "s3",
      mediaPublicBaseUrl: "https://cdn.example.test"
    }
  );

  const localUrl = getMediaDeliveryUrl(
    {
      entityId: "entity_123",
      storageKey: "asset-123.jpg"
    },
    {
      mediaStorageMode: "local",
      mediaPublicBaseUrl: ""
    }
  );

  assert.equal(cdnUrl, "https://cdn.example.test/media/asset-123.jpg");
  assert.equal(localUrl, "/api/media/entity_123");
});
