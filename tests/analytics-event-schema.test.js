import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyTrafficExclusion,
  classifyTrafficSource,
  validateAnalyticsEventPayload
} from "../lib/analytics/event-schema.js";

function requestWithHeaders(headers = {}) {
  return new Request("http://localhost/services/stroitelstvo-domov-pod-klyuch", {
    method: "POST",
    headers
  });
}

function validPayload(overrides = {}) {
  return {
    event_type: "cta_click",
    timestamp: "2026-05-04T10:00:00.000Z",
    anonymous_id: "anon_12345678",
    session_id: "session_12345678",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    element_id: "hero_primary_cta",
    device_type: "mobile",
    viewport_width: 390,
    viewport_height: 844,
    metadata: {
      analytics_id: "hero_primary_cta",
      section_id: "hero",
      target_type: "contact_channel",
      target_id: "telegram"
    },
    ...overrides
  };
}

test("analytics event validation accepts allowed first-party event payload", () => {
  const result = validateAnalyticsEventPayload(validPayload(), {
    request: requestWithHeaders({ referer: "https://yandex.ru/search/?text=test" })
  });

  assert.equal(result.ok, true);
  assert.equal(result.event.event_type, "cta_click");
  assert.equal(result.event.source, "organic_yandex");
  assert.equal(result.event.page_path, "/services/stroitelstvo-domov-pod-klyuch");
  assert.equal(result.event.is_excluded, false);
  assert.equal(typeof result.event.event_fingerprint, "string");
});

test("analytics event validation works without cookies or client anonymous id", () => {
  const result = validateAnalyticsEventPayload({
    event_type: "page_view",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    metadata: {
      analytics_id: "page",
      section_id: "page"
    }
  }, {
    request: requestWithHeaders()
  });

  assert.equal(result.ok, true);
  assert.match(result.event.anonymous_id, /^anon_server_/);
  assert.match(result.event.session_id, /^session_server_/);
  assert.equal(result.event.is_excluded, false);
});

test("analytics event validation rejects unknown event_type", () => {
  const result = validateAnalyticsEventPayload(validPayload({ event_type: "lead_created" }));

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Invalid option|event_type/);
});

test("analytics event validation rejects form values and sensitive metadata", () => {
  const rootResult = validateAnalyticsEventPayload(validPayload({ form_values: { name: "Ivan" } }));
  const metadataResult = validateAnalyticsEventPayload(validPayload({
    metadata: {
      analytics_id: "hero_primary_cta",
      token: "sk-test-secret"
    }
  }));
  const arbitraryDumpResult = validateAnalyticsEventPayload(validPayload({
    metadata: {
      analytics_id: "hero_primary_cta",
      section_id: "hero",
      arbitrary_payload_dump: "anything"
    }
  }));

  assert.equal(rootResult.ok, false);
  assert.match(rootResult.errors.join(" "), /not allowed/);
  assert.equal(metadataResult.ok, false);
  assert.match(metadataResult.errors.join(" "), /not allowed/);
  assert.equal(arbitraryDumpResult.ok, false);
  assert.match(arbitraryDumpResult.errors.join(" "), /not allowed/);
});

test("analytics exclusion marks admin users, bots, preview and QA traffic", () => {
  assert.deepEqual(
    classifyTrafficExclusion({ pagePath: "/services/drainage", user: { id: "user_1", role: "seo_manager" } }),
    { is_excluded: true, exclusion_reason: "admin_user" }
  );
  assert.deepEqual(
    classifyTrafficExclusion({ pagePath: "/preview/service", userAgent: "Googlebot/2.1" }),
    { is_excluded: true, exclusion_reason: "preview_or_draft" }
  );
  assert.deepEqual(
    classifyTrafficExclusion({ pagePath: "/services/drainage", request: requestWithHeaders({ "x-qa-traffic": "true" }) }),
    { is_excluded: true, exclusion_reason: "qa_traffic" }
  );
});

test("source classification stays conservative when evidence is weak", () => {
  assert.deepEqual(
    classifyTrafficSource({ referrer: "" }),
    { source: "direct", medium: "none", campaign: "" }
  );
  assert.deepEqual(
    classifyTrafficSource({ referrer: "not a url", explicitSource: "" }),
    { source: "unknown", medium: "unknown", campaign: "" }
  );
});
