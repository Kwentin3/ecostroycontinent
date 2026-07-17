import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/telemetry/events/route.js";

const SESSION_ID = "ts_11111111-1111-4111-8111-111111111111";

function request(payload, headers = {}) {
  return new Request("http://localhost/api/telemetry/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });
}

function validPayload(overrides = {}) {
  return {
    event_name: "page_viewed",
    event_version: "1.0",
    page_path: "/services/monolit?token=secret&utm_source=yandex",
    metadata: {
      analytics_id: "page",
      section_id: "page"
    },
    ...overrides
  };
}

function deps(overrides = {}) {
  return {
    getCurrentUser: async () => null,
    resolveTelemetrySession: () => ({ sessionId: SESSION_ID, created: false }),
    withTransaction: async (run) => run({ query: async () => ({ rows: [] }) }),
    recordTelemetryEvent: async (event) => ({ id: "event_1", ...event }),
    createContactJourneyIfNeeded: async () => null,
    dispatchTelemetryEvent: async () => [{ ok: true }],
    ...overrides
  };
}

test("telemetry endpoint stores valid page_viewed and dispatches normalized event", async () => {
  let capturedEvent = null;
  let adapterEvent = null;
  const response = await POST(request(validPayload()), {}, deps({
    recordTelemetryEvent: async (event) => {
      capturedEvent = event;
      return { id: "event_page", ...event };
    },
    dispatchTelemetryEvent: async (event) => {
      adapterEvent = event;
      return [{ ok: true }];
    }
  }));
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.ok, true);
  assert.equal(body.stored, true);
  assert.equal(body.journey_created, false);
  assert.equal(capturedEvent.page_path, "/services/monolit");
  assert.equal(capturedEvent.utm_source, "yandex");
  assert.equal(adapterEvent.id, "event_page");
});

test("telemetry endpoint rejects unknown events and system events from UI", async () => {
  let writeCalled = false;
  const unknown = await POST(request(validPayload({ event_name: "lead_created" })), {}, deps({
    recordTelemetryEvent: async () => {
      writeCalled = true;
      return {};
    }
  }));
  const system = await POST(request(validPayload({
    event_name: "contact_journey_created",
    metadata: {
      final_contact_event_name: "phone_clicked"
    }
  })), {}, deps());

  assert.equal(unknown.status, 400);
  assert.equal(system.status, 400);
  assert.equal(writeCalled, false);
});

test("telemetry endpoint rejects oversized payload before auth lookup", async () => {
  let authCalled = false;
  const response = await POST(new Request("http://localhost/api/telemetry/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(20 * 1024)
    },
    body: "{}"
  }), {}, deps({
    getCurrentUser: async () => {
      authCalled = true;
      return null;
    }
  }));

  assert.equal(response.status, 413);
  assert.equal(authCalled, false);
});

test("contact intent events create contact journeys and cta_clicked does not", async () => {
  const createdJourneys = [];
  const routeDeps = deps({
    recordTelemetryEvent: async (event) => ({ id: `event_${event.event_name}_${event.contact_channel || "none"}`, ...event }),
    createContactJourneyIfNeeded: async (event) => {
      if (["phone_clicked", "email_clicked", "messenger_clicked"].includes(event.event_name)) {
        const journey = { id: `journey_${event.event_name}`, final_contact_event_id: event.id };
        createdJourneys.push(journey);
        return journey;
      }

      return null;
    }
  });
  const contactCases = [
    ["phone_clicked", "phone"],
    ["email_clicked", "email"],
    ["messenger_clicked", "telegram"]
  ];

  for (const [eventName, contactChannel] of contactCases) {
    const response = await POST(request(validPayload({
      event_name: eventName,
      contact_channel: contactChannel,
      metadata: {
        analytics_id: `hero_${contactChannel}`,
        section_id: "hero",
        cta_kind: "contact",
        destination_kind: contactChannel
      }
    })), {}, routeDeps);
    const body = await response.json();

    assert.equal(response.status, 202);
    assert.equal(body.journey_created, true);
  }

  const cta = await POST(request(validPayload({
    event_name: "cta_clicked",
    metadata: {
      analytics_id: "open_service",
      section_id: "hero",
      cta_kind: "section_navigation",
      destination_kind: "page"
    }
  })), {}, routeDeps);

  assert.equal(cta.status, 202);
  assert.equal((await cta.json()).journey_created, false);
  assert.equal(createdJourneys.length, 3);
});

test("internal and test markers are added by domain layer", async () => {
  const capturedEvents = [];
  const internal = await POST(request(validPayload(), {
    Cookie: "esc_internal_traffic=1"
  }), {}, deps({
    recordTelemetryEvent: async (event) => {
      capturedEvents.push(event);
      return { id: `event_${capturedEvents.length}`, ...event };
    }
  }));
  const testEvent = await POST(request(validPayload({ is_test: true })), {}, deps({
    recordTelemetryEvent: async (event) => {
      capturedEvents.push(event);
      return { id: `event_${capturedEvents.length}`, ...event };
    }
  }));

  assert.equal(internal.status, 202);
  assert.equal(testEvent.status, 202);
  assert.equal(capturedEvents[0].is_internal, true);
  assert.equal(capturedEvents[1].is_test, true);
});

test("telemetry endpoint stores events independently from public Metrica env", async () => {
  const previousEnabled = process.env.NEXT_PUBLIC_YANDEX_METRICA_ENABLED;
  const previousCounterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID;
  const storedEvents = [];

  try {
    process.env.NEXT_PUBLIC_YANDEX_METRICA_ENABLED = "false";
    process.env.NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID = "";

    const disabledResponse = await POST(request(validPayload({
      event_name: "phone_clicked",
      contact_channel: "phone",
      metadata: {
        analytics_id: "contact_phone",
        section_id: "hero",
        cta_kind: "contact",
        destination_kind: "phone"
      }
    })), {}, deps({
      recordTelemetryEvent: async (event) => {
        storedEvents.push(event);
        return { id: `event_${storedEvents.length}`, ...event };
      }
    }));

    process.env.NEXT_PUBLIC_YANDEX_METRICA_ENABLED = "true";
    process.env.NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID = "109037342";

    const enabledResponse = await POST(request(validPayload({
      event_name: "messenger_clicked",
      contact_channel: "telegram",
      metadata: {
        analytics_id: "contact_telegram",
        section_id: "hero",
        cta_kind: "contact",
        destination_kind: "messenger"
      }
    })), {}, deps({
      recordTelemetryEvent: async (event) => {
        storedEvents.push(event);
        return { id: `event_${storedEvents.length}`, ...event };
      }
    }));

    assert.equal(disabledResponse.status, 202);
    assert.equal(enabledResponse.status, 202);
    assert.deepEqual(storedEvents.map((event) => event.event_name), ["phone_clicked", "messenger_clicked"]);
  } finally {
    if (previousEnabled === undefined) {
      delete process.env.NEXT_PUBLIC_YANDEX_METRICA_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_YANDEX_METRICA_ENABLED = previousEnabled;
    }

    if (previousCounterId === undefined) {
      delete process.env.NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID;
    } else {
      process.env.NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID = previousCounterId;
    }
  }
});

test("write failure returns generic safe error", async () => {
  const response = await POST(request(validPayload()), {}, deps({
    recordTelemetryEvent: async () => {
      throw new Error("SQL secret details");
    }
  }));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.ok, false);
  assert.equal(body.error, "TELEMETRY_WRITE_FAILED");
  assert.equal(JSON.stringify(body).includes("SQL secret details"), false);
});
