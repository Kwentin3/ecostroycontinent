const CDN_PROBE_TIMEOUT_MS = 1200;
const CDN_PROBE_OK_TTL_MS = 60_000;
const CDN_PROBE_FAIL_TTL_MS = 15_000;

// Sticky canon: SQL owns media metadata, S3 owns binaries, CDN is delivery.
// In auto mode use CDN when probing succeeds and app proxy as fallback only.
// Do not turn raw CDN URLs into editorial/source-of-truth content.

const probeCache = new Map();

function normalizeBaseUrl(baseUrl) {
  return typeof baseUrl === "string" ? baseUrl.replace(/\/+$/, "") : "";
}

function encodeDeliveryPath(pathValue) {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getAppProxyMediaUrl(entityId) {
  const normalizedId = typeof entityId === "string" ? entityId.trim() : "";

  return normalizedId ? `/api/media-public/${encodeURIComponent(normalizedId)}` : "";
}

export function getCdnMediaUrl({ storageKey }, config) {
  const publicBaseUrl = normalizeBaseUrl(config?.mediaPublicBaseUrl);
  const normalizedStorageKey = typeof storageKey === "string" ? storageKey.trim() : "";

  if (config?.mediaStorageMode !== "s3" || !publicBaseUrl || !normalizedStorageKey) {
    return "";
  }

  return `${publicBaseUrl}/${encodeDeliveryPath(normalizedStorageKey)}`;
}

function readCachedProbe(url, now) {
  const cached = probeCache.get(url);

  if (!cached || cached.expiresAt <= now) {
    return null;
  }

  return cached.ok;
}

function writeCachedProbe(url, ok, now) {
  probeCache.set(url, {
    ok,
    expiresAt: now + (ok ? CDN_PROBE_OK_TTL_MS : CDN_PROBE_FAIL_TTL_MS)
  });
}

async function probeCdnUrl(url, fetchImpl, now) {
  const cached = readCachedProbe(url, now);

  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetchImpl(url, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(CDN_PROBE_TIMEOUT_MS)
    });
    const ok = response.ok;

    writeCachedProbe(url, ok, now);
    return ok;
  } catch {
    writeCachedProbe(url, false, now);
    return false;
  }
}

export async function resolvePublicMediaDelivery({ asset, config, fetchImpl = fetch, now = Date.now() } = {}) {
  const appProxyUrl = getAppProxyMediaUrl(asset?.entityId);
  const cdnUrl = getCdnMediaUrl({ storageKey: asset?.storageKey }, config);
  const mode = config?.mediaDeliveryMode || "app_proxy";

  if (mode === "cdn" && cdnUrl) {
    return { mode: "cdn", url: cdnUrl, fallbackUrl: appProxyUrl };
  }

  if (mode === "auto" && cdnUrl && await probeCdnUrl(cdnUrl, fetchImpl, now)) {
    return { mode: "cdn", url: cdnUrl, fallbackUrl: appProxyUrl };
  }

  return { mode: "app_proxy", url: appProxyUrl, fallbackUrl: cdnUrl };
}

export function clearPublicMediaDeliveryProbeCache() {
  probeCache.clear();
}
