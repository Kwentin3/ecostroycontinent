import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { createMediaStorageAdapter, getMediaDeliveryUrl } from "../lib/media/storage.js";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

  await adapter.deleteMediaFile(storageKey);
  await assert.rejects(() => adapter.readMediaFile(storageKey));
});

test("local media storage adapter can report whether a storage key exists", async () => {
  const mediaStorageDir = await fs.mkdtemp(path.join(os.tmpdir(), "ecostroy-media-"));
  const adapter = createMediaStorageAdapter({
    mediaStorageMode: "local",
    mediaStorageDir
  });
  const storageKey = `asset-${crypto.randomUUID()}.jpg`;

  assert.equal(await adapter.hasMediaFile(storageKey), false);

  await adapter.storeMediaFile({
    storageKey,
    bytes: Buffer.from("media-bytes")
  });

  assert.equal(await adapter.hasMediaFile(storageKey), true);

  await adapter.deleteMediaFile(storageKey);
  assert.equal(await adapter.hasMediaFile(storageKey), false);
});

test("media delivery URL resolves to the public delivery host from storage key in s3 mode and falls back to the app route in local mode", () => {
  const publicUrl = getMediaDeliveryUrl(
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

  assert.equal(publicUrl, "https://cdn.example.test/media/asset-123.jpg");
  assert.equal(localUrl, "/api/media/entity_123");
});

test("s3 media config does not require MEDIA_STORAGE_DIR to be set", async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      [
        'import { getAppConfig } from "./lib/config.js";',
        "const config = getAppConfig();",
        "console.log(JSON.stringify({",
        "  mediaStorageMode: config.mediaStorageMode,",
        "  mediaStorageDir: config.mediaStorageDir,",
        "  mediaPublicBaseUrl: config.mediaPublicBaseUrl",
        "}));"
      ].join(" ")
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
        MEDIA_STORAGE_MODE: "s3",
        MEDIA_STORAGE_DIR: "",
        MEDIA_S3_BUCKET: "ecostroycontinent-media-ru3-20260324",
        MEDIA_S3_REGION: "ru-3",
        MEDIA_S3_ENDPOINT_URL: "https://s3.ru-3.storage.selcloud.ru",
        MEDIA_S3_ACCESS_KEY_ID: "test-access",
        MEDIA_S3_SECRET_ACCESS_KEY: "test-secret",
        MEDIA_PUBLIC_BASE_URL: "https://cdn.example.test"
      }
    }
  );

  const config = JSON.parse(stdout);

  assert.equal(config.mediaStorageMode, "s3");
  assert.equal(config.mediaPublicBaseUrl, "https://cdn.example.test");
  assert.match(config.mediaStorageDir, /var[\\/]+media$/);
});

test("s3 media config does not fall back to AWS_* env vars", async () => {
  let error;

  try {
    await execFileAsync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        [
          'import { getAppConfig } from "./lib/config.js";',
          "getAppConfig();"
        ].join(" ")
      ],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          NODE_ENV: "test",
          MEDIA_STORAGE_MODE: "s3",
          MEDIA_STORAGE_DIR: "",
          MEDIA_S3_BUCKET: "",
          MEDIA_S3_REGION: "ru-3",
          MEDIA_S3_ENDPOINT_URL: "",
          MEDIA_S3_ACCESS_KEY_ID: "",
          MEDIA_S3_SECRET_ACCESS_KEY: "",
          MEDIA_PUBLIC_BASE_URL: "https://cdn.example.test",
          AWS_ACCESS_KEY_ID: "aws-access",
          AWS_SECRET_ACCESS_KEY: "aws-secret",
          AWS_DEFAULT_REGION: "ru-3",
          AWS_ENDPOINT_URL: "https://s3.ru-3.storage.selcloud.ru"
        }
      }
    );
  } catch (thrown) {
    error = thrown;
  }

  assert.ok(error, "expected getAppConfig() to fail when MEDIA_S3_* runtime values are missing");
  assert.match(error.stderr, /MEDIA_STORAGE_MODE=s3 requires:/);
  assert.match(error.stderr, /MEDIA_S3_(BUCKET|ENDPOINT_URL|ACCESS_KEY_ID|SECRET_ACCESS_KEY)/);
  assert.doesNotMatch(error.stderr, /AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|DEFAULT_REGION|ENDPOINT_URL)/);
});
