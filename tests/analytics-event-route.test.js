import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/analytics/events/route.js";

function buildRequest(payload, headers = {}) {
  return new Request("http://localhost/api/analytics/events", {
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
    event_type: "click_to_call",
    timestamp: "2026-05-04T10:00:00.000Z",
    anonymous_id: "anon_route_123",
    session_id: "session_route_123",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    element_id: "hero_primary_call",
    metadata: {
      analytics_id: "hero_primary_call",
      section_id: "hero",
      target_type: "contact_channel",
      target_id: "phone"
    },
    ...overrides
  };
}

test("event endpoint stores valid event and returns terminal accepted response", async () => {
  let capturedEvent = null;

  const response = await POST(buildRequest(validPayload()), {}, {
    getCurrentUser: async () => null,
    resolveRouteEntity: async () => ({
      page_path: "/services/stroitelstvo-domov-pod-klyuch",
      entity_type: "service",
      entity_id: "service_1",
      page_kind: "service_detail",
      published_revision_id: "revision_service_1",
      resolution_status: "resolved"
    }),
    recordAnalyticsEvent: async (event) => {
      capturedEvent = event;
      return { stored: true, id: "analytics_event_1" };
    },
    recordUnmappedUrlDiagnostic: async () => {
      throw new Error("unmapped diagnostic should not run for resolved routes");
    }
  });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.ok, true);
  assert.equal(body.stored, true);
  assert.equal(capturedEvent.entity_id, "service_1");
  assert.equal(capturedEvent.published_revision_id, "revision_service_1");
});

test("event endpoint accepts payload without anonymous id and caps oversized bodies", async () => {
  let capturedEvent = null;

  const response = await POST(buildRequest({
    event_type: "page_view",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    metadata: {
      analytics_id: "page",
      section_id: "page"
    }
  }), {}, {
    getCurrentUser: async () => null,
    resolveRouteEntity: async () => ({
      page_path: "/services/stroitelstvo-domov-pod-klyuch",
      entity_type: "service",
      entity_id: "service_1",
      page_kind: "service_detail",
      published_revision_id: "revision_service_1",
      resolution_status: "resolved"
    }),
    recordAnalyticsEvent: async (event) => {
      capturedEvent = event;
      return { stored: true, id: "analytics_event_anonless" };
    },
    recordUnmappedUrlDiagnostic: async () => ({ id: "noop" })
  });
  const tooLarge = await POST(new Request("http://localhost/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(20 * 1024)
    },
    body: "{}"
  }), {}, {
    getCurrentUser: async () => {
      throw new Error("oversized payload should stop before auth lookup");
    }
  });

  assert.equal(response.status, 202);
  assert.match(capturedEvent.anonymous_id, /^anon_server_/);
  assert.match(capturedEvent.session_id, /^session_server_/);
  assert.equal(tooLarge.status, 413);
});

test("event endpoint excludes admin user behavior from business aggregates", async () => {
  let capturedEvent = null;

  const response = await POST(buildRequest(validPayload()), {}, {
    getCurrentUser: async () => ({ id: "user_admin", role: "seo_manager" }),
    resolveRouteEntity: async () => ({
      page_path: "/services/stroitelstvo-domov-pod-klyuch",
      entity_type: "service",
      entity_id: "service_1",
      page_kind: "service_detail",
      published_revision_id: "revision_service_1",
      resolution_status: "resolved"
    }),
    recordAnalyticsEvent: async (event) => {
      capturedEvent = event;
      return { stored: true, id: "analytics_event_2" };
    },
    recordUnmappedUrlDiagnostic: async () => ({ id: "noop" })
  });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.excluded, true);
  assert.equal(capturedEvent.is_excluded, true);
  assert.equal(capturedEvent.exclusion_reason, "admin_user");
});

test("event endpoint rejects sensitive metadata with safe error body", async () => {
  const response = await POST(buildRequest(validPayload({
    metadata: {
      analytics_id: "hero_primary_call",
      password: "secret"
    }
  })), {}, {
    getCurrentUser: async () => null
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.error, "INVALID_EVENT");
});

test("event endpoint records unmapped URL diagnostics", async () => {
  let diagnosticInput = null;

  const response = await POST(buildRequest(validPayload({ page_path: "/old-url" })), {}, {
    getCurrentUser: async () => null,
    resolveRouteEntity: async () => ({
      page_path: "/old-url",
      entity_type: null,
      entity_id: null,
      page_kind: "unknown",
      published_revision_id: null,
      resolution_status: "unmapped"
    }),
    recordAnalyticsEvent: async () => ({ stored: true, id: "analytics_event_3" }),
    recordUnmappedUrlDiagnostic: async (input) => {
      diagnosticInput = input;
      return { id: "unmapped_1" };
    }
  });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.resolution_status, "unmapped");
  assert.equal(diagnosticInput.pagePath, "/old-url");
});
