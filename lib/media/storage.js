import fs from "node:fs/promises";
import path from "node:path";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getAppConfig } from "../config.js";

function createLocalAdapter(config) {
  async function ensureStorageDir() {
    await fs.mkdir(config.mediaStorageDir, { recursive: true });
    return config.mediaStorageDir;
  }

  return {
    async storeMediaFile({ storageKey, bytes }) {
      const dir = await ensureStorageDir();
      const targetPath = path.join(dir, storageKey);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, bytes);
    },
    async readMediaFile(storageKey) {
      const dir = await ensureStorageDir();
      const targetPath = path.join(dir, storageKey);
      return fs.readFile(targetPath);
    },
    async deleteMediaFile(storageKey) {
      const dir = await ensureStorageDir();
      const targetPath = path.join(dir, storageKey);

      try {
        await fs.rm(targetPath, { force: true });
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }
  };
}

function bodyToBuffer(body) {
  if (!body) {
    return Promise.reject(new Error("S3 object body is empty."));
  }

  if (Buffer.isBuffer(body)) {
    return Promise.resolve(body);
  }

  if (body instanceof Uint8Array) {
    return Promise.resolve(Buffer.from(body));
  }

  if (typeof body.transformToByteArray === "function") {
    return body.transformToByteArray().then((bytes) => Buffer.from(bytes));
  }

  return (async () => {
    const chunks = [];

    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  })();
}

function createS3Adapter(config) {
  const client = new S3Client({
    region: config.mediaS3Region,
    endpoint: config.mediaS3EndpointUrl,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.mediaS3AccessKeyId,
      secretAccessKey: config.mediaS3SecretAccessKey
    }
  });

  return {
    async storeMediaFile({ storageKey, bytes, contentType }) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.mediaS3Bucket,
          Key: storageKey,
          Body: bytes,
          ContentType: contentType || "application/octet-stream"
        })
      );
    },
    async readMediaFile(storageKey) {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: config.mediaS3Bucket,
          Key: storageKey
        })
      );

      return bodyToBuffer(response.Body);
    },
    async deleteMediaFile(storageKey) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.mediaS3Bucket,
          Key: storageKey
        })
      );
    }
  };
}

export function createMediaStorageAdapter(config = getAppConfig()) {
  if (config.mediaStorageMode === "s3") {
    return createS3Adapter(config);
  }

  return createLocalAdapter(config);
}

let cachedDefaultAdapter;
let cachedSignature = "";

function getDefaultAdapter() {
  const config = getAppConfig();
  const signature = [
    config.mediaStorageMode,
    config.mediaStorageDir,
    config.mediaS3Bucket,
    config.mediaS3Region,
    config.mediaS3EndpointUrl,
    config.mediaS3AccessKeyId,
    config.mediaS3SecretAccessKey,
    config.mediaPublicBaseUrl
  ].join("|");

  if (!cachedDefaultAdapter || cachedSignature !== signature) {
    cachedDefaultAdapter = createMediaStorageAdapter(config);
    cachedSignature = signature;
  }

  return cachedDefaultAdapter;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function encodeDeliveryPath(pathValue) {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getMediaDeliveryUrl({ entityId, storageKey }, config = getAppConfig()) {
  const deliveryPath = storageKey || entityId;

  if (config.mediaStorageMode === "s3" && config.mediaPublicBaseUrl && deliveryPath) {
    // Public media URLs stay on the configured delivery host so the app can
    // hand off to the CDN/public delivery layer without exposing storage internals.
    return `${normalizeBaseUrl(config.mediaPublicBaseUrl)}/${encodeDeliveryPath(deliveryPath)}`;
  }

  if (entityId) {
    return `/api/media/${entityId}`;
  }

  return null;
}

export async function storeMediaFile({ storageKey, bytes, contentType }) {
  return getDefaultAdapter().storeMediaFile({ storageKey, bytes, contentType });
}

export async function readMediaFile(storageKey) {
  return getDefaultAdapter().readMediaFile(storageKey);
}

export async function deleteMediaFile(storageKey) {
  return getDefaultAdapter().deleteMediaFile(storageKey);
}
