import test from "node:test";
import assert from "node:assert/strict";

import { validateTelemetryEventPayload } from "../lib/telemetry/validation.js";

const SESSION_ID = "ts_11111111-1111-4111-8111-111111111111";

function validate(payload, options = {}) {
  return validateTelemetryEventPayload({
    event_name: "page_viewed",
    event_version: "1.0",
    page_path: "/services?token=secret&utm_source=yandex",
    ...payload
  }, {
    sessionId: SESSION_ID,
    now: new Date("2026-05-07T10:00:00.000Z"),
    ...options
  });
}

test("valid page_viewed is normalized with server session and sanitized page path", () => {
  const result = validate({
    metadata: {
      analytics_id: "page",
      section_id: "page"
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.event.event_name, "page_viewed");
  assert.equal(result.event.event_category, "interest");
  assert.equal(result.event.session_id, SESSION_ID);
  assert.equal(result.event.page_path, "/services");
  assert.equal(result.event.utm_source, "yandex");
  assert.equal(result.event.occurred_at, "2026-05-07T10:00:00.000Z");
});

test("unknown event_name and invalid event_version are rejected", () => {
  const unknown = validate({ event_name: "lead_created" });
  const invalidVersion = validate({ event_version: "2.0" });

  assert.equal(unknown.ok, false);
  assert.equal(invalidVersion.ok, false);
});

test("contact_journey_created cannot be emitted by public UI", () => {
  const result = validate({
    event_name: "contact_journey_created",
    metadata: {
      final_contact_event_name: "phone_clicked"
    }
  });

  assert.equal(result.ok, false);
});

test("metadata is per-event allowlisted and scalar-only", () => {
  const unknownMetadata = validate({
    metadata: {
      analytics_id: "page",
      freeform: "nope"
    }
  });
  const objectMetadata = validate({
    metadata: {
      analytics_id: { nested: true }
    }
  });

  assert.equal(unknownMetadata.ok, false);
  assert.equal(objectMetadata.ok, false);
});

test("forbidden root fields and sensitive referrer query params are protected", () => {
  const forbidden = validate({ email: "client@example.com" });
  const safeReferrer = validate({
    referrer: "https://example.com/path?email=client@example.com&utm_campaign=launch",
    metadata: {
      analytics_id: "page"
    }
  });

  assert.equal(forbidden.ok, false);
  assert.equal(safeReferrer.ok, true);
  assert.equal(safeReferrer.event.referrer, "https://example.com/path?utm_campaign=launch");
});

test("contact intent events require final semantic event and channel", () => {
  const phone = validate({
    event_name: "phone_clicked",
    contact_channel: "phone",
    metadata: {
      analytics_id: "hero_phone",
      section_id: "hero",
      cta_kind: "contact",
      destination_kind: "phone"
    }
  });
  const messenger = validate({
    event_name: "messenger_clicked",
    contact_channel: "telegram",
    metadata: {
      analytics_id: "hero_telegram",
      section_id: "hero",
      cta_kind: "contact",
      destination_kind: "telegram"
    }
  });

  assert.equal(phone.ok, true);
  assert.equal(phone.event.contact_channel, "phone");
  assert.equal(messenger.ok, true);
  assert.equal(messenger.event.contact_channel, "telegram");
});

test("contact CTA cannot be recorded as cta_clicked", () => {
  const result = validate({
    event_name: "cta_clicked",
    metadata: {
      analytics_id: "hero_phone",
      section_id: "hero",
      cta_kind: "contact",
      destination_kind: "phone"
    }
  });

  assert.equal(result.ok, false);
});
