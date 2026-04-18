import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getAppConfig } from "../config.js";

const HEALTH_CACHE_TTL_MS = 30_000;
const CDN_PROBE_TIMEOUT_MS = 4_000;

let cachedSnapshot = null;
let cachedAt = 0;
let inflightSnapshot = null;

function makeItem({ key, label, status, tone, lines, note = "" }) {
  return {
    key,
    label,
    status,
    tone,
    lines,
    note
  };
}

function parseHost(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

function encodeDeliveryPath(pathValue) {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function createS3Client(config) {
  return new S3Client({
    region: config.mediaS3Region,
    endpoint: config.mediaS3EndpointUrl,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.mediaS3AccessKeyId,
      secretAccessKey: config.mediaS3SecretAccessKey
    }
  });
}

async function probeS3(config) {
  if (config.mediaStorageMode !== "s3") {
    return {
      item: makeItem({
        key: "s3",
        label: "S3",
        status: "локально",
        tone: "unknown",
        lines: ["хранилище: локально", "режим разработки"]
      }),
      probeKey: null
    };
  }

  const client = createS3Client(config);
  const probeKey = `__health/sidebar/${randomUUID()}.txt`;
  let listResponse = null;
  let putError = "";
  let deleteError = "";

  try {
    await client.send(new HeadBucketCommand({ Bucket: config.mediaS3Bucket }));
  } catch (error) {
    return {
      item: makeItem({
        key: "s3",
        label: "S3",
        status: "down",
        tone: "down",
        lines: [`bucket: ${config.mediaS3Bucket}`, `region: ${config.mediaS3Region}`],
      note: `проверка S3: ${error.name}`
      }),
      probeKey: null
    };
  }

  try {
    listResponse = await client.send(new ListObjectsV2Command({ Bucket: config.mediaS3Bucket, MaxKeys: 10 }));
  } catch (error) {
    return {
      item: makeItem({
        key: "s3",
        label: "S3",
        status: "degraded",
        tone: "degraded",
        lines: [`bucket: ${config.mediaS3Bucket}`, `region: ${config.mediaS3Region}`],
      note: `список S3: ${error.name}`
      }),
      probeKey: null
    };
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.mediaS3Bucket,
        Key: probeKey,
        Body: "sidebar-health",
        ContentType: "text/plain; charset=utf-8"
      })
    );
  } catch (error) {
    putError = error.name || "PutFailed";
  }

  if (!putError) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: config.mediaS3Bucket, Key: probeKey }));
    } catch (error) {
      deleteError = error.name || "DeleteFailed";
    }
  }

  const firstObjectKey =
    listResponse?.Contents?.find((entry) => entry?.Key && !entry.Key.startsWith("__health/sidebar/"))?.Key ?? null;

  if (putError || deleteError) {
    return {
      item: makeItem({
        key: "s3",
        label: "S3",
        status: "warn",
        tone: "degraded",
        lines: [`bucket: ${config.mediaS3Bucket}`, `region: ${config.mediaS3Region}`],
        note: putError ? `запись: ${putError}` : `удаление: ${deleteError}`
      }),
      probeKey: firstObjectKey
    };
  }

  return {
    item: makeItem({
      key: "s3",
      label: "S3",
      status: "ok",
      tone: "healthy",
      lines: [`bucket: ${config.mediaS3Bucket}`, `region: ${config.mediaS3Region}`]
    }),
    probeKey: firstObjectKey
  };
}

async function probeCdn(config, storageResult) {
  const publicHost = parseHost(config.mediaPublicBaseUrl);

  if (!config.mediaPublicBaseUrl) {
    return makeItem({
      key: "cdn",
      label: "CDN",
      status: "off",
      tone: "unknown",
      lines: ["хост: не настроен", "хост доставки не указан"]
    });
  }

  if (storageResult.item.tone === "down") {
    return makeItem({
      key: "cdn",
      label: "CDN",
      status: "warn",
      tone: "degraded",
      lines: [`host: ${publicHost}`],
      note: "источник недоступен"
    });
  }

  if (!storageResult.probeKey) {
    return makeItem({
      key: "cdn",
      label: "CDN",
      status: "wait",
      tone: "unknown",
      lines: [`host: ${publicHost}`],
      note: "нет объекта для проверки"
    });
  }

  const probeUrl = `${config.mediaPublicBaseUrl}/${encodeDeliveryPath(storageResult.probeKey)}`;

  try {
    const response = await fetch(probeUrl, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(CDN_PROBE_TIMEOUT_MS)
    });

    if (response.ok) {
      return makeItem({
        key: "cdn",
        label: "CDN",
        status: "ok",
        tone: "healthy",
        lines: [`host: ${publicHost}`]
      });
    }

    return makeItem({
      key: "cdn",
      label: "CDN",
      status: "warn",
      tone: "degraded",
      lines: [`host: ${publicHost}`],
      note: `проверка: ${response.status}`
    });
  } catch (error) {
    return makeItem({
      key: "cdn",
      label: "CDN",
      status: "down",
      tone: "down",
      lines: [`host: ${publicHost}`],
      note: `проверка: ${error.name || "FetchFailed"}`
    });
  }
}

async function loadInfraHealthSnapshot() {
  const config = getAppConfig();
  const storage = await probeS3(config);
  const cdn = await probeCdn(config, storage);

  return {
    items: [storage.item, cdn]
  };
}

export async function getInfraHealthSnapshot() {
  if (cachedSnapshot && Date.now() - cachedAt < HEALTH_CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  if (inflightSnapshot) {
    return inflightSnapshot;
  }

  inflightSnapshot = loadInfraHealthSnapshot()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedAt = Date.now();
      return snapshot;
    })
    .catch(() => {
      const fallback = {
        items: [
          makeItem({
            key: "s3",
            label: "S3",
            status: "warn",
            tone: "degraded",
            lines: ["bucket: недоступно"],
            note: "проверка состояния не удалась"
          }),
          makeItem({
            key: "cdn",
            label: "CDN",
            status: "warn",
            tone: "degraded",
            lines: ["host: недоступно"],
            note: "проверка состояния не удалась"
          })
        ]
      };

      cachedSnapshot = fallback;
      cachedAt = Date.now();
      return fallback;
    })
    .finally(() => {
      inflightSnapshot = null;
    });

  return inflightSnapshot;
}
