import { z } from "zod";

import {
  CONTACT_CHANNEL_SET,
  DEFAULT_CONTACT_CHANNEL_BY_EVENT,
  EVENT_CATEGORY_BY_NAME,
  PUBLIC_EVENT_NAME_SET,
  TELEMETRY_EVENT_NAMES,
  TELEMETRY_EVENT_VERSION,
  isContactIntentEvent
} from "./events.js";
import { allowedMetadataKeysForEvent } from "./metadata-allowlist.js";
import {
  DANGEROUS_TELEMETRY_KEY_PATTERN,
  asBoundedInteger,
  asSafeString,
  assertNoDangerousTelemetryKey,
  assertSafeTelemetryValue,
  extractUtmFields,
  sanitizePagePath,
  sanitizeReferrer
} from "./sanitize.js";

const MAX_ACTIVE_TIME_MS = 30 * 60 * 1000;

const telemetryPayloadSchema = z.strictObject({
  event_name: z.enum(TELEMETRY_EVENT_NAMES),
  event_version: z.literal(TELEMETRY_EVENT_VERSION),
  occurred_at: z.string().datetime({ offset: true }).optional(),
  session_id: z.string().trim().min(8).max(128).optional(),
  anonymous_visitor_id: z.string().trim().min(8).max(128).optional(),
  page_path: z.string().trim().min(1).max(900),
  page_title: z.string().trim().max(220).optional(),
  referrer: z.string().trim().max(1200).optional(),
  utm_source: z.string().trim().max(80).optional(),
  utm_medium: z.string().trim().max(80).optional(),
  utm_campaign: z.string().trim().max(140).optional(),
  entity_type: z.string().trim().max(64).optional(),
  entity_id: z.string().trim().max(128).optional(),
  entity_slug: z.string().trim().max(160).optional(),
  placement: z.string().trim().max(120).optional(),
  contact_channel: z.string().trim().max(40).optional(),
  active_time_ms: z.coerce.number().int().min(0).max(MAX_ACTIVE_TIME_MS).optional(),
  max_scroll_depth: z.coerce.number().int().min(0).max(100).optional(),
  is_test: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const CONTACT_DESTINATION_KINDS = new Set([
  "phone",
  "tel",
  "call",
  "email",
  "mailto",
  "messenger",
  "telegram",
  "whatsapp",
  "viber",
  "vk",
  "max"
]);
const ALLOWED_ROOT_KEYS = new Set([
  "event_name",
  "event_version",
  "occurred_at",
  "session_id",
  "anonymous_visitor_id",
  "page_path",
  "page_title",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "entity_type",
  "entity_id",
  "entity_slug",
  "placement",
  "contact_channel",
  "active_time_ms",
  "max_scroll_depth",
  "is_test",
  "metadata"
]);

function rootDangerousKeys(input = {}) {
  return Object.keys(input || {}).filter((key) => (
    !ALLOWED_ROOT_KEYS.has(key)
    && DANGEROUS_TELEMETRY_KEY_PATTERN.test(key)
  ));
}

function normalizeScalarMetadataValue(value, key) {
  if (typeof value === "object" && value !== null) {
    throw new Error(`metadata field "${key}" must be scalar`);
  }

  assertSafeTelemetryValue(value, key);

  return asSafeString(value, 180);
}

function normalizeMetadata(eventName, metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const allowedKeys = allowedMetadataKeysForEvent(eventName);
  const normalized = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!allowedKeys.has(key)) {
      assertNoDangerousTelemetryKey(key, "metadata field");
      throw new Error(`metadata field "${key}" is not allowed for ${eventName}`);
    }

    const safeValue = normalizeScalarMetadataValue(value, key);

    if (safeValue !== "") {
      normalized[key] = safeValue;
    }
  }

  return normalized;
}

function normalizeContactChannel(eventName, payload, metadata) {
  const rawChannel = asSafeString(payload.contact_channel, 40).toLowerCase();
  const defaultChannel = DEFAULT_CONTACT_CHANNEL_BY_EVENT[eventName] || "";
  const channel = rawChannel || defaultChannel;

  if (!isContactIntentEvent(eventName)) {
    if (channel) {
      throw new Error("contact_channel is allowed only for contact intent events");
    }

    const destinationKind = asSafeString(metadata.destination_kind, 40).toLowerCase();

    if (eventName === "cta_clicked" && CONTACT_DESTINATION_KINDS.has(destinationKind)) {
      throw new Error("contact CTA must emit final contact intent event, not cta_clicked");
    }

    return null;
  }

  if (!channel) {
    throw new Error("contact_channel is required for contact intent events");
  }

  if (!CONTACT_CHANNEL_SET.has(channel)) {
    throw new Error(`contact_channel "${channel}" is not allowed`);
  }

  if (eventName === "phone_clicked" && channel !== "phone") {
    throw new Error("phone_clicked must use contact_channel=phone");
  }

  if (eventName === "email_clicked" && channel !== "email") {
    throw new Error("email_clicked must use contact_channel=email");
  }

  if (eventName === "messenger_clicked" && ["phone", "email"].includes(channel)) {
    throw new Error("messenger_clicked must use a messenger contact_channel");
  }

  return channel;
}

function normalizeOptionalString(value, maxLength = 160) {
  const safe = asSafeString(value, maxLength);
  return safe || null;
}

function collectUtmFields(payload, request) {
  const fromPayloadPath = extractUtmFields(payload.page_path);
  const fromRequestUrl = extractUtmFields(request?.url || "");

  return {
    utm_source: asSafeString(payload.utm_source || fromPayloadPath.utm_source || fromRequestUrl.utm_source, 80),
    utm_medium: asSafeString(payload.utm_medium || fromPayloadPath.utm_medium || fromRequestUrl.utm_medium, 80),
    utm_campaign: asSafeString(payload.utm_campaign || fromPayloadPath.utm_campaign || fromRequestUrl.utm_campaign, 140)
  };
}

export function validateTelemetryEventPayload(input, {
  request = null,
  now = new Date(),
  sessionId = "",
  isInternal = false,
  isTest = false,
  allowSystemEvents = false
} = {}) {
  const dangerousRootKeys = rootDangerousKeys(input);

  if (dangerousRootKeys.length > 0) {
    return {
      ok: false,
      errors: dangerousRootKeys.map((key) => `root field "${key}" is not allowed`)
    };
  }

  const parsed = telemetryPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message)
    };
  }

  try {
    const payload = parsed.data;

    if (!allowSystemEvents && !PUBLIC_EVENT_NAME_SET.has(payload.event_name)) {
      return {
        ok: false,
        errors: ["contact_journey_created is a system event and cannot be emitted by Public UI"]
      };
    }

    const metadata = normalizeMetadata(payload.event_name, payload.metadata || {});
    const contactChannel = normalizeContactChannel(payload.event_name, payload, metadata);
    const pagePath = sanitizePagePath(payload.page_path);
    const utm = collectUtmFields(payload, request);
    const occurredAt = now.toISOString();
    const resolvedSessionId = asSafeString(sessionId || payload.session_id, 128);

    if (!resolvedSessionId) {
      return {
        ok: false,
        errors: ["session_id is required"]
      };
    }

    const event = {
      event_name: payload.event_name,
      event_version: payload.event_version,
      event_category: EVENT_CATEGORY_BY_NAME[payload.event_name],
      occurred_at: occurredAt,
      received_at: occurredAt,
      session_id: resolvedSessionId,
      page_path: pagePath,
      page_title: asSafeString(payload.page_title, 220),
      referrer: sanitizeReferrer(payload.referrer || request?.headers?.get?.("referer") || ""),
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      entity_type: normalizeOptionalString(payload.entity_type, 64),
      entity_id: normalizeOptionalString(payload.entity_id, 128),
      entity_slug: normalizeOptionalString(payload.entity_slug, 160),
      placement: normalizeOptionalString(payload.placement, 120),
      contact_channel: contactChannel,
      active_time_ms: asBoundedInteger(payload.active_time_ms, { min: 0, max: MAX_ACTIVE_TIME_MS, fallback: null }),
      max_scroll_depth: asBoundedInteger(payload.max_scroll_depth, { min: 0, max: 100, fallback: null }),
      is_internal: Boolean(isInternal),
      is_test: Boolean(isTest || payload.is_test),
      metadata
    };

    return { ok: true, event };
  } catch (error) {
    return {
      ok: false,
      errors: [error.message || "Invalid telemetry payload"]
    };
  }
}
