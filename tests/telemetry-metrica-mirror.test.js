import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_METRICA_INIT_OPTIONS,
  normalizeMetricaPublicConfig,
  resolveMetricaGoalForTelemetryEvent
} from "../lib/telemetry/metrica-goals.js";
import {
  createMetricaDedupeStore,
  mirrorTelemetryEventToMetrica
} from "../components/public/telemetry-metrica-adapter.js";

const ENABLED_CONFIG = Object.freeze({
  enabled: true,
  trackingAllowed: true,
  counterId: "109037342",
  initOptions: DEFAULT_METRICA_INIT_OPTIONS
});

function event(overrides = {}) {
  return {
    event_name: "phone_clicked",
    contact_channel: "phone",
    metadata: {
      destination_kind: "phone"
    },
    ...overrides
  };
}

test("Metrica public config is env-gated and conservative", () => {
  assert.deepEqual(DEFAULT_METRICA_INIT_OPTIONS, {
    clickmap: false,
    webvisor: false,
    ecommerce: false,
    trackLinks: false,
    accurateTrackBounce: false
  });

  assert.equal(normalizeMetricaPublicConfig({
    enabled: false,
    trackingAllowed: true,
    counterId: "109037342"
  }).enabled, false);
  assert.equal(normalizeMetricaPublicConfig({
    enabled: true,
    trackingAllowed: false,
    counterId: "109037342"
  }).enabled, false);
  assert.equal(normalizeMetricaPublicConfig({
    enabled: true,
    trackingAllowed: true,
    counterId: "bad-counter"
  }).enabled, false);
});

test("Metrica mapping covers only approved current telemetry events", () => {
  assert.equal(resolveMetricaGoalForTelemetryEvent(event()), "click_to_call");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({
    event_name: "messenger_clicked",
    contact_channel: "telegram",
    metadata: { destination_kind: "messenger" }
  })), "click_to_telegram");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({
    event_name: "messenger_clicked",
    contact_channel: "whatsapp",
    metadata: { destination_kind: "messenger" }
  })), "click_to_whatsapp");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({
    event_name: "cta_clicked",
    contact_channel: null,
    metadata: { destination_kind: "page" }
  })), "cta_click");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "gallery_opened", contact_channel: null })), "gallery_open");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "case_card_opened", contact_channel: null })), "case_card_click");
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "service_card_opened", contact_channel: null })), "service_link_click");
});

test("Metrica mapping rejects unsupported, contact-ambiguous, internal and test events", () => {
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "page_viewed" })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "page_engagement_recorded" })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "email_clicked", contact_channel: "email" })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ event_name: "contact_journey_created" })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({
    event_name: "cta_clicked",
    contact_channel: null,
    metadata: { destination_kind: "phone" }
  })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ is_internal: true })), null);
  assert.equal(resolveMetricaGoalForTelemetryEvent(event({ is_test: true })), null);
});

test("Metrica mirror waits for telemetry 202 on ordinary events", () => {
  const calls = [];
  const ym = (...args) => calls.push(args);

  const blocked = mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_1",
    config: ENABLED_CONFIG,
    telemetryAccepted: false,
    fallbackAllowed: false,
    ym
  });

  assert.equal(blocked.mirrored, false);
  assert.equal(blocked.reason, "telemetry_not_accepted");
  assert.equal(calls.length, 0);

  const sent = mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_1",
    config: ENABLED_CONFIG,
    telemetryAccepted: true,
    fallbackAllowed: false,
    ym
  });

  assert.equal(sent.mirrored, true);
  assert.deepEqual(calls, [[109037342, "reachGoal", "click_to_call"]]);
});

test("Metrica mirror supports explicit fallback and short-window dedupe", () => {
  let now = 1000;
  const calls = [];
  const ym = (...args) => calls.push(args);
  const dedupeStore = createMetricaDedupeStore({ ttlMs: 5000, now: () => now });

  const first = mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_fallback",
    config: ENABLED_CONFIG,
    fallbackAllowed: true,
    dedupeStore,
    ym
  });
  const duplicate = mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_fallback",
    config: ENABLED_CONFIG,
    fallbackAllowed: true,
    dedupeStore,
    ym
  });
  now += 6000;
  const afterTtl = mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_fallback",
    config: ENABLED_CONFIG,
    fallbackAllowed: true,
    dedupeStore,
    ym
  });

  assert.equal(first.mirrored, true);
  assert.equal(duplicate.mirrored, false);
  assert.equal(duplicate.reason, "duplicate_or_missing_client_event_id");
  assert.equal(afterTtl.mirrored, true);
  assert.equal(calls.length, 2);
});

test("Metrica mirror is no-op when disabled, disallowed or unavailable", () => {
  assert.equal(mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_disabled",
    config: { ...ENABLED_CONFIG, enabled: false },
    telemetryAccepted: true,
    ym: () => {
      throw new Error("should not be called");
    }
  }).mirrored, false);

  assert.equal(mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_disallowed",
    config: { ...ENABLED_CONFIG, trackingAllowed: false },
    telemetryAccepted: true,
    ym: () => {
      throw new Error("should not be called");
    }
  }).mirrored, false);

  assert.equal(mirrorTelemetryEventToMetrica({
    payload: event(),
    clientEventId: "client_no_ym",
    config: ENABLED_CONFIG,
    telemetryAccepted: true
  }).reason, "ym_unavailable");
});
