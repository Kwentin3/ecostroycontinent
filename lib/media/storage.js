import fs from "node:fs/promises";
import path from "node:path";

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getAppConfig } from "../config.js";

export const MEDIA_S3_OBJECT_CACHE_CONTROL = "public, max-age=86400";

export function buildMediaPutObjectCommandInput({ config, storageKey, bytes, contentType }) {
  return {
    Bucket: config.mediaS3Bucket,
    Key: storageKey,
    Body: bytes,
    ContentType: contentType || "application/octet-stream",
    CacheControl: MEDIA_S3_OBJECT_CACHE_CONTROL
  };
}

function createLocalAdapter(config) {
  function resolveStorageDir() {
    if (path.isAbsolute(config.mediaStorageDir)) {
      return config.mediaStorageDir;
    }

    const normalizedSegments = config.mediaStorageDir
      .split(/[\\/]+/)
      .filter(Boolean);

    return path.join(/* turbopackIgnore: true */ process.cwd(), ...normalizedSegments);
  }

  async function ensureStorageDir() {
    const storageDir = resolveStorageDir();
    await fs.mkdir(storageDir, { recursive: true });
    return storageDir;
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
    },
    async hasMediaFile(storageKey) {
      const dir = await ensureStorageDir();
      const targetPath = path.join(dir, storageKey);

      try {
        await fs.access(targetPath);
        return true;
      } catch (error) {
        if (error?.code === "ENOENT") {
          return false;
        }

        throw error;
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
        new PutObjectCommand(buildMediaPutObjectCommandInput({ config, storageKey, bytes, contentType }))
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
    },
    async hasMediaFile(storageKey) {
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: config.mediaS3Bucket,
            Key: storageKey
          })
        );
        return true;
      } catch (error) {
        const statusCode = error?.$metadata?.httpStatusCode;
        const errorCode = error?.name || error?.Code;

        if (statusCode === 404 || errorCode === "NotFound" || errorCode === "NoSuchKey") {
          return false;
        }

        throw error;
      }
    }
  };
}

function isRecoverablePrimaryStorageError(error) {
  const statusCode = error?.$metadata?.httpStatusCode;
  const errorCode = error?.name || error?.Code;

  return statusCode === 403
    || statusCode === 404
    || errorCode === "AccessDenied"
    || errorCode === "Forbidden"
    || errorCode === "NotFound"
    || errorCode === "NoSuchKey"
    || errorCode === "NoSuchBucket";
}

export function createFallbackMediaStorageAdapter(primaryAdapter, fallbackAdapter) {
  async function withFallback(operation, fallbackOperation) {
    try {
      return await operation();
    } catch (error) {
      if (!isRecoverablePrimaryStorageError(error)) {
        throw error;
      }

      return fallbackOperation(error);
    }
  }

  return {
    async storeMediaFile(input) {
      return withFallback(
        () => primaryAdapter.storeMediaFile(input),
        () => fallbackAdapter.storeMediaFile(input)
      );
    },
    async readMediaFile(storageKey) {
      return withFallback(
        () => primaryAdapter.readMediaFile(storageKey),
        () => fallbackAdapter.readMediaFile(storageKey)
      );
    },
    async deleteMediaFile(storageKey) {
      await withFallback(
        () => primaryAdapter.deleteMediaFile(storageKey),
        async () => undefined
      );

      await fallbackAdapter.deleteMediaFile(storageKey);
    },
    async hasMediaFile(storageKey) {
      return withFallback(
        () => primaryAdapter.hasMediaFile(storageKey).then((exists) => (
          exists ? true : fallbackAdapter.hasMediaFile(storageKey)
        )),
        () => fallbackAdapter.hasMediaFile(storageKey)
      );
    }
  };
}

function normalizeStorageExtension(filename) {
  const extension = path.extname(filename || "").toLowerCase();

  return /^[a-z0-9.]+$/.test(extension) ? extension : "";
}

export function createMediaStorageKey(filename, { id = crypto.randomUUID(), prefix = "media" } = {}) {
  // Production S3/CDN hardening expects app-owned media objects under this
  // bounded prefix; root-level writes can be denied by storage policy.
  const normalizedPrefix = String(prefix || "")
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");

  const keyName = `${id}${normalizeStorageExtension(filename)}`;

  return normalizedPrefix ? `${normalizedPrefix}/${keyName}` : keyName;
}

export function createMediaStorageAdapter(config = getAppConfig()) {
  if (config.mediaStorageMode === "s3") {
    const s3Adapter = createS3Adapter(config);

    if (config.mediaS3LocalFallbackEnabled) {
      return createFallbackMediaStorageAdapter(s3Adapter, createLocalAdapter(config));
    }

    return s3Adapter;
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
    config.mediaS3LocalFallbackEnabled,
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

  if (
    config.mediaStorageMode === "s3"
    && config.mediaDeliveryMode !== "app_proxy"
    && config.mediaPublicBaseUrl
    && deliveryPath
  ) {
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

export async function hasMediaFile(storageKey) {
  return getDefaultAdapter().hasMediaFile(storageKey);
}
