import { NextResponse } from "next/server.js";

import { getCurrentUser } from "../../../../lib/auth/session.js";
import { validateAnalyticsEventPayload } from "../../../../lib/analytics/event-schema.js";
import { recordAnalyticsEvent, recordUnmappedUrlDiagnostic } from "../../../../lib/analytics/repository.js";
import { resolveRouteEntity } from "../../../../lib/analytics/route-resolver.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};
const MAX_EVENT_BODY_BYTES = 16 * 1024;

function json(body, status) {
  return NextResponse.json(body, {
    status,
    headers: JSON_HEADERS
  });
}

export async function POST(request, _context, deps = {}) {
  const routeDeps = {
    getCurrentUser,
    validateAnalyticsEventPayload,
    resolveRouteEntity,
    recordAnalyticsEvent,
    recordUnmappedUrlDiagnostic,
    ...deps
  };
  // Public ingestion boundary: reject sensitive metadata and keep admin/bot/QA
  // exclusion intact. Intent events are not leads; lead/intake is separate.
  // Do not store form values. See SEO event taxonomy + handoff.
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_EVENT_BODY_BYTES) {
    return json({ ok: false, error: "PAYLOAD_TOO_LARGE", message: "Событие слишком большое." }, 413);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON", message: "Некорректный JSON payload." }, 400);
  }

  const user = await routeDeps.getCurrentUser();
  const validation = routeDeps.validateAnalyticsEventPayload(payload, { request, user });

  if (!validation.ok) {
    return json({ ok: false, error: "INVALID_EVENT", message: "Событие не принято.", details: validation.errors }, 400);
  }

  const resolved = await routeDeps.resolveRouteEntity(validation.event.page_path);
  const event = {
    ...validation.event,
    page_path: resolved.page_path,
    entity_type: validation.event.entity_type || resolved.entity_type,
    entity_id: validation.event.entity_id || resolved.entity_id,
    published_revision_id: validation.event.published_revision_id || resolved.published_revision_id
  };

  try {
    const result = await routeDeps.recordAnalyticsEvent(event);

    if (resolved.resolution_status === "unmapped" || resolved.resolution_status === "future_not_supported") {
      await routeDeps.recordUnmappedUrlDiagnostic({
        pagePath: event.page_path,
        sourceSystem: "first_party_events",
        referrer: event.referrer,
        reason: resolved.resolution_status
      });
    }

    return json({
      ok: true,
      stored: result.stored,
      excluded: event.is_excluded,
      exclusion_reason: event.exclusion_reason,
      resolution_status: resolved.resolution_status
    }, result.stored ? 202 : 200);
  } catch {
    return json({ ok: false, error: "ANALYTICS_WRITE_FAILED", message: "Событие не удалось сохранить." }, 500);
  }
}
