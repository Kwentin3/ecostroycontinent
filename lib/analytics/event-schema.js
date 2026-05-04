import crypto from "node:crypto";

import { z } from "zod";

import {
  ANALYTICS_EVENT_TYPES,
  DEVICE_TYPES,
  SOURCE_HEALTH_STATUSES,
  TRAFFIC_SOURCE_ORDER
} from "./constants.js";

const EVENT_TYPE_SET = new Set(ANALYTICS_EVENT_TYPES);
const DEVICE_TYPE_SET = new Set(DEVICE_TYPES);
const SAFE_METADATA_KEYS = new Set([
  "analytics_id",
  "section_id",
  "target_type",
  "target_id",
  "target_path",
  "target_href",
  "label",
  "cta_variant",
  "nav_item",
  "gallery_id",
  "case_id",
  "service_id",
  "form_id",
  "scroll_depth",
  "scroll_depth_bucket",
  "source_label"
]);

const DANGEROUS_KEY_PATTERN = /(password|pass|token|secret|api[_-]?key|authorization|cookie|session_cookie|email|phone|name|fio|message|comment|form[_-]?value|field[_-]?value|textarea|passport|card|ip|user[_-]?agent|raw)/i;
const TOKEN_LIKE_VALUE_PATTERN = /(bearer\s+[a-z0-9._-]+|sk-[a-z0-9_-]{12,}|ya29\.[a-z0-9_-]+|xox[baprs]-[a-z0-9-]+)/i;
const BOT_PATTERN = /(bot|crawler|spider|slurp|bingpreview|lighthouse|pagespeed|pingdom|uptimerobot|headlesschrome|curl|wget|python-requests)/i;
const QA_HEADER_NAMES = ["x-qa-traffic", "x-seo-qa", "x-test-traffic"];

const eventPayloadSchema = z.strictObject({
  event_type: z.enum(ANALYTICS_EVENT_TYPES),
  timestamp: z.string().datetime({ offset: true }).optional(),
  anonymous_id: z.string().trim().min(8).max(128),
  session_id: z.string().trim().min(8).max(128),
  page_path: z.string().trim().min(1).max(320),
  entity_type: z.string().trim().max(64).optional(),
  entity_id: z.string().trim().max(128).optional(),
  published_revision_id: z.string().trim().max(128).optional(),
  element_id: z.string().trim().max(160).optional(),
  event_source: z.enum(["first_party_public", "first_party_server", "imported_external", "system"]).optional(),
  source: z.string().trim().max(80).optional(),
  medium: z.string().trim().max(80).optional(),
  campaign: z.string().trim().max(140).optional(),
  referrer: z.string().trim().max(1200).optional(),
  device_type: z.enum(DEVICE_TYPES).optional(),
  viewport_width: z.coerce.number().int().min(0).max(10000).optional(),
  viewport_height: z.coerce.number().int().min(0).max(10000).optional(),
  viewport_bucket: z.string().trim().max(40).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function stableStringify(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = value[key];
        return acc;
      }, {})
  );
}

function asSafeString(value, maxLength = 180) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function assertNoDangerousKey(key) {
  if (DANGEROUS_KEY_PATTERN.test(key)) {
    throw new Error(`metadata field "${key}" is not allowed`);
  }
}

function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.entries(metadata).reduce((acc, [key, value]) => {
    assertNoDangerousKey(key);

    if (!SAFE_METADATA_KEYS.has(key)) {
      throw new Error(`metadata field "${key}" is not allowed`);
    }

    if (typeof value === "object" && value !== null) {
      throw new Error(`metadata field "${key}" must be scalar`);
    }

    const safeValue = asSafeString(value);

    if (TOKEN_LIKE_VALUE_PATTERN.test(safeValue)) {
      throw new Error(`metadata field "${key}" contains unsafe token-like value`);
    }

    acc[key] = safeValue;
    return acc;
  }, {});
}

function normalizePath(value) {
  const raw = asSafeString(value, 320) || "/";
  let path = raw;

  try {
    path = new URL(raw, "http://localhost").pathname;
  } catch {
    path = raw.split("?")[0].split("#")[0];
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutTrailing = normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
  return withoutTrailing || "/";
}

export function sanitizeReferrer(value) {
  const raw = asSafeString(value, 1200);

  if (!raw) {
    return "";
  }

  try {
    const referrer = new URL(raw, "http://localhost");
    if (referrer.hostname === "localhost" && !/^https?:\/\//i.test(raw)) {
      return normalizePath(raw);
    }

    return `${referrer.protocol}//${referrer.hostname}${referrer.pathname}`.slice(0, 500);
  } catch {
    return raw.split("?")[0].split("#")[0].slice(0, 300);
  }
}

export function getViewportBucket({ width, explicitBucket }) {
  const bucket = asSafeString(explicitBucket, 40);

  if (bucket) {
    return bucket;
  }

  const numericWidth = Number(width || 0);

  if (!numericWidth) {
    return "unknown";
  }

  if (numericWidth < 640) {
    return "mobile";
  }

  if (numericWidth < 1024) {
    return "tablet";
  }

  return "desktop";
}

export function classifyDeviceType({ userAgent = "", width = 0, explicitDeviceType = "" } = {}) {
  if (DEVICE_TYPE_SET.has(explicitDeviceType)) {
    return explicitDeviceType;
  }

  const ua = asSafeString(userAgent, 600).toLowerCase();

  if (/ipad|tablet/.test(ua)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod/.test(ua)) {
    return "mobile";
  }

  const numericWidth = Number(width || 0);

  if (numericWidth && numericWidth < 640) {
    return "mobile";
  }

  if (numericWidth && numericWidth < 1024) {
    return "tablet";
  }

  return "desktop";
}

function getHeader(request, name) {
  if (!request?.headers?.get) {
    return "";
  }

  return request.headers.get(name) || "";
}

function hasTruthyQaHeader(request) {
  return QA_HEADER_NAMES.some((name) => {
    const value = getHeader(request, name).trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(value);
  });
}

export function classifyTrafficExclusion({ pagePath = "", request = null, user = null, userAgent = "", eventSource = "" } = {}) {
  const path = normalizePath(pagePath);
  const resolvedUserAgent = userAgent || getHeader(request, "user-agent");

  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
    return { is_excluded: true, exclusion_reason: "internal_route" };
  }

  if (path.startsWith("/preview") || path.startsWith("/draft")) {
    return { is_excluded: true, exclusion_reason: "preview_or_draft" };
  }

  if (path === "/health" || path.startsWith("/health/")) {
    return { is_excluded: true, exclusion_reason: "health_check" };
  }

  if (user?.id || user?.role) {
    return { is_excluded: true, exclusion_reason: "admin_user" };
  }

  if (BOT_PATTERN.test(resolvedUserAgent)) {
    return { is_excluded: true, exclusion_reason: "bot_or_crawler" };
  }

  if (hasTruthyQaHeader(request)) {
    return { is_excluded: true, exclusion_reason: "qa_traffic" };
  }

  if (eventSource === "imported_external" || eventSource === "system") {
    return { is_excluded: true, exclusion_reason: "system_or_import" };
  }

  return { is_excluded: false, exclusion_reason: "" };
}

function classifyReferrerHost(hostname) {
  const host = hostname.toLowerCase();

  if (/(^|\.)yandex\./.test(host) || host === "ya.ru") {
    return { source: "organic_yandex", medium: "organic" };
  }

  if (/(^|\.)google\./.test(host)) {
    return { source: "organic_google", medium: "organic" };
  }

  if (host.includes("telegram") || host === "t.me") {
    return { source: "telegram", medium: "messenger" };
  }

  if (host.includes("whatsapp") || host === "wa.me") {
    return { source: "whatsapp", medium: "messenger" };
  }

  if (host.includes("maps.yandex") || host.includes("yandex.ru/maps") || host.includes("2gis") || host.includes("zoon")) {
    return { source: "maps_or_business_directory", medium: "directory" };
  }

  return { source: "referral", medium: "referral" };
}

export function classifyTrafficSource({ url = "", referrer = "", explicitSource = "", explicitMedium = "", explicitCampaign = "" } = {}) {
  const explicit = asSafeString(explicitSource, 80);
  const medium = asSafeString(explicitMedium, 80);
  const campaign = asSafeString(explicitCampaign, 140);

  try {
    const pageUrl = new URL(url || "http://localhost/");
    const utmSource = pageUrl.searchParams.get("utm_source") || explicit;
    const utmMedium = pageUrl.searchParams.get("utm_medium") || medium;
    const utmCampaign = pageUrl.searchParams.get("utm_campaign") || campaign;

    if (utmSource) {
      const normalized = utmSource.toLowerCase();

      if (normalized.includes("telegram") || normalized === "tg") {
        return { source: "telegram", medium: utmMedium || "messenger", campaign: utmCampaign || "" };
      }

      if (normalized.includes("whatsapp") || normalized === "wa") {
        return { source: "whatsapp", medium: utmMedium || "messenger", campaign: utmCampaign || "" };
      }

      if (utmMedium === "cpc" || utmMedium === "paid" || normalized.includes("direct.yandex")) {
        return { source: "paid", medium: utmMedium || "paid", campaign: utmCampaign || "" };
      }

      return { source: "campaign_utm", medium: utmMedium || "campaign", campaign: utmCampaign || "" };
    }
  } catch {
    // URL parsing falls through to referrer classification.
  }

  const cleanReferrer = sanitizeReferrer(referrer);

  if (!cleanReferrer) {
    return { source: explicit || "direct", medium: medium || "none", campaign };
  }

  if (cleanReferrer.startsWith("/")) {
    return { source: explicit || "unknown", medium: medium || "unknown", campaign };
  }

  try {
    const referrerUrl = new URL(cleanReferrer, "http://localhost");

    if (referrerUrl.hostname === "localhost") {
      return { source: explicit || "direct", medium: medium || "none", campaign };
    }

    return { ...classifyReferrerHost(referrerUrl.hostname), campaign };
  } catch {
    return { source: explicit || "unknown", medium: medium || "unknown", campaign };
  }
}

export function createEventFingerprint(event) {
  const basis = [
    event.event_type,
    event.occurred_at,
    event.anonymous_id,
    event.session_id,
    event.page_path,
    event.element_id || "",
    stableStringify(event.metadata || {})
  ].join("|");

  return crypto.createHash("sha256").update(basis).digest("hex");
}

export function validateAnalyticsEventPayload(input, { request = null, user = null, now = new Date() } = {}) {
  const dangerousRootKeys = Object.keys(input || {}).filter((key) => DANGEROUS_KEY_PATTERN.test(key));

  if (dangerousRootKeys.length > 0) {
    return {
      ok: false,
      errors: dangerousRootKeys.map((key) => `root field "${key}" is not allowed`)
    };
  }

  const parsed = eventPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message)
    };
  }

  try {
    const payload = parsed.data;
    const metadata = sanitizeMetadata(payload.metadata || {});
    const pagePath = normalizePath(payload.page_path);
    const referrer = sanitizeReferrer(payload.referrer || getHeader(request, "referer"));
    const sourceInput = classifyTrafficSource({
      url: request?.url || `http://localhost${pagePath}`,
      referrer,
      explicitSource: payload.source,
      explicitMedium: payload.medium,
      explicitCampaign: payload.campaign
    });
    const deviceType = classifyDeviceType({
      userAgent: getHeader(request, "user-agent"),
      width: payload.viewport_width,
      explicitDeviceType: payload.device_type
    });
    const eventSource = payload.event_source || "first_party_public";
    const exclusion = classifyTrafficExclusion({
      pagePath,
      request,
      user,
      eventSource
    });
    const occurredAt = payload.timestamp ? new Date(payload.timestamp) : now;

    if (!EVENT_TYPE_SET.has(payload.event_type)) {
      return { ok: false, errors: [`event_type "${payload.event_type}" is not allowed`] };
    }

    const event = {
      event_type: payload.event_type,
      occurred_at: occurredAt.toISOString(),
      anonymous_id: payload.anonymous_id,
      session_id: payload.session_id,
      page_path: pagePath,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      published_revision_id: payload.published_revision_id || null,
      element_id: payload.element_id || metadata.analytics_id || "",
      event_source: eventSource,
      source: sourceInput.source,
      medium: sourceInput.medium,
      campaign: sourceInput.campaign,
      referrer,
      device_type: deviceType,
      viewport_width: payload.viewport_width ?? null,
      viewport_height: payload.viewport_height ?? null,
      viewport_bucket: getViewportBucket({
        width: payload.viewport_width,
        explicitBucket: payload.viewport_bucket
      }),
      is_excluded: exclusion.is_excluded,
      exclusion_reason: exclusion.exclusion_reason,
      metadata
    };

    return {
      ok: true,
      event: {
        ...event,
        event_fingerprint: createEventFingerprint(event)
      }
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error.message || "Invalid analytics payload"]
    };
  }
}

export function validateSourceHealthStatus(value) {
  return SOURCE_HEALTH_STATUSES.includes(value) ? value : "unknown";
}

export function isKnownTrafficSource(value) {
  return TRAFFIC_SOURCE_ORDER.includes(value);
}
