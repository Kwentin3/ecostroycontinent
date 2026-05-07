import { NextResponse } from "next/server.js";

import { getCurrentUser } from "../../../../lib/auth/session.js";
import { withTransaction } from "../../../../lib/db/client.js";
import { dispatchTelemetryEvent } from "../../../../lib/telemetry/adapters.js";
import { resolveInternalTraffic, resolveTestTraffic } from "../../../../lib/telemetry/internal-marker.js";
import { createContactJourneyIfNeeded } from "../../../../lib/telemetry/journey.js";
import { recordTelemetryEvent } from "../../../../lib/telemetry/repository.js";
import { resolveTelemetrySession, setTelemetrySessionCookie } from "../../../../lib/telemetry/session.js";
import { validateTelemetryEventPayload } from "../../../../lib/telemetry/validation.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};
const MAX_EVENT_BODY_BYTES = 16 * 1024;

// Public boundary: validate and minimize before storage/adapters; never create leads here.
function json(body, status) {
  return NextResponse.json(body, {
    status,
    headers: JSON_HEADERS
  });
}

async function readJsonPayload(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_EVENT_BODY_BYTES) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  }

  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_EVENT_BODY_BYTES) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  }

  try {
    return { ok: true, payload: JSON.parse(raw || "{}") };
  } catch {
    return { ok: false, status: 400, error: "INVALID_JSON" };
  }
}

export async function POST(request, _context, deps = {}) {
  const routeDeps = {
    getCurrentUser,
    resolveTelemetrySession,
    resolveInternalTraffic,
    resolveTestTraffic,
    validateTelemetryEventPayload,
    withTransaction,
    recordTelemetryEvent,
    createContactJourneyIfNeeded,
    dispatchTelemetryEvent,
    ...deps
  };

  const parsed = await readJsonPayload(request);

  if (!parsed.ok) {
    return json({ ok: false, error: parsed.error }, parsed.status);
  }

  const payload = parsed.payload;
  const user = await routeDeps.getCurrentUser();
  const session = routeDeps.resolveTelemetrySession({
    request,
    payloadSessionId: payload?.session_id
  });
  const isInternal = routeDeps.resolveInternalTraffic({ request, user });
  const isTest = routeDeps.resolveTestTraffic({ request, payload });
  const validation = routeDeps.validateTelemetryEventPayload(payload, {
    request,
    sessionId: session.sessionId,
    isInternal,
    isTest
  });

  if (!validation.ok) {
    return json({ ok: false, error: "INVALID_EVENT" }, 400);
  }

  try {
    const writeResult = await routeDeps.withTransaction(async (db) => {
      const event = await routeDeps.recordTelemetryEvent(validation.event, { db });
      const journey = await routeDeps.createContactJourneyIfNeeded(event, {
        db,
        repository: routeDeps
      });

      return { event, journey };
    });

    await routeDeps.dispatchTelemetryEvent(writeResult.event);

    const response = json({
      ok: true,
      stored: true,
      event_name: writeResult.event.event_name,
      journey_created: Boolean(writeResult.journey)
    }, 202);

    return setTelemetrySessionCookie(response, session.sessionId);
  } catch {
    return json({ ok: false, error: "TELEMETRY_WRITE_FAILED" }, 500);
  }
}
