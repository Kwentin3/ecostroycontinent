import test from "node:test";
import assert from "node:assert/strict";

import {
  CONTACT_JOURNEY_MAX_LENGTH,
  buildContactJourneySnapshot,
  createContactJourneyIfNeeded
} from "../lib/telemetry/journey.js";

function event(overrides = {}) {
  return {
    id: `event_${Math.random().toString(16).slice(2)}`,
    event_name: "page_viewed",
    event_category: "interest",
    occurred_at: "2026-05-07T10:00:00.000Z",
    session_id: "ts_11111111-1111-4111-8111-111111111111",
    page_path: "/",
    entity_type: null,
    entity_id: null,
    entity_slug: null,
    placement: "page",
    contact_channel: null,
    active_time_ms: null,
    max_scroll_depth: null,
    metadata: {},
    is_internal: false,
    is_test: false,
    ...overrides
  };
}

test("contact journey snapshot is created at contact intent time", () => {
  const finalEvent = event({
    id: "event_phone",
    event_name: "phone_clicked",
    event_category: "contact_intent",
    occurred_at: "2026-05-07T10:00:08.000Z",
    page_path: "/services/monolit",
    entity_type: "service",
    entity_id: "service_1",
    contact_channel: "phone"
  });
  const snapshot = buildContactJourneySnapshot({
    finalEvent,
    previousEvents: [
      event({ id: "event_home", event_name: "page_viewed", page_path: "/", occurred_at: "2026-05-07T10:00:00.000Z" }),
      event({ id: "event_service", event_name: "page_viewed", page_path: "/services/monolit", occurred_at: "2026-05-07T10:00:04.000Z" })
    ],
    engagementSummary: {
      total_active_time_ms: 12000,
      max_scroll_depth: 75
    }
  });

  assert.equal(snapshot.final_contact_event_id, "event_phone");
  assert.equal(snapshot.final_contact_event_name, "phone_clicked");
  assert.equal(snapshot.landing_page_path, "/");
  assert.equal(snapshot.final_page_path, "/services/monolit");
  assert.equal(snapshot.previous_significant_events.at(-1).event_name, "phone_clicked");
  assert.equal(snapshot.total_active_time_ms, 12000);
  assert.equal(snapshot.max_scroll_depth, 75);
});

test("non-contact CTA does not create contact journey snapshot", () => {
  const snapshot = buildContactJourneySnapshot({
    finalEvent: event({
      event_name: "cta_clicked",
      event_category: "engagement"
    })
  });

  assert.equal(snapshot, null);
});

test("journey caps length and collapses repeated rapid clicks", () => {
  const baseEvents = Array.from({ length: 14 }, (_, index) => event({
    id: `event_${index}`,
    event_name: "page_viewed",
    occurred_at: new Date(Date.UTC(2026, 4, 7, 10, 0, index)).toISOString(),
    page_path: `/services/${index}`
  }));
  const repeatedA = event({
    id: "event_case_a",
    event_name: "case_card_opened",
    occurred_at: "2026-05-07T10:00:20.000Z",
    page_path: "/services/monolit",
    entity_type: "case",
    entity_id: "case_1"
  });
  const repeatedB = event({
    ...repeatedA,
    id: "event_case_b",
    occurred_at: "2026-05-07T10:00:22.000Z"
  });
  const finalEvent = event({
    id: "event_email",
    event_name: "email_clicked",
    event_category: "contact_intent",
    occurred_at: "2026-05-07T10:00:30.000Z",
    page_path: "/services/monolit",
    contact_channel: "email"
  });

  const snapshot = buildContactJourneySnapshot({
    finalEvent,
    previousEvents: [...baseEvents, repeatedA, repeatedB]
  });

  assert.equal(snapshot.previous_significant_events.length, CONTACT_JOURNEY_MAX_LENGTH);
  assert.equal(
    snapshot.previous_significant_events.filter((item) => item.event_name === "case_card_opened").length,
    1
  );
  assert.equal(snapshot.previous_significant_events.at(-1).event_name, "email_clicked");
});

test("createContactJourneyIfNeeded uses repository boundary only for contact intent", async () => {
  let recordedJourney = null;
  const finalEvent = event({
    id: "event_messenger",
    event_name: "messenger_clicked",
    event_category: "contact_intent",
    contact_channel: "telegram"
  });

  const result = await createContactJourneyIfNeeded(finalEvent, {
    db: {},
    repository: {
      listPreviousSignificantEventsForSession: async () => [
        event({ id: "event_home", event_name: "page_viewed", page_path: "/" })
      ],
      getSessionEngagementSummary: async () => ({
        total_active_time_ms: 5000,
        max_scroll_depth: 50
      }),
      recordTelemetryContactJourney: async (journey) => {
        recordedJourney = journey;
        return { id: "journey_1", ...journey };
      }
    }
  });

  assert.equal(result.id, "journey_1");
  assert.equal(recordedJourney.final_contact_event_name, "messenger_clicked");
});
