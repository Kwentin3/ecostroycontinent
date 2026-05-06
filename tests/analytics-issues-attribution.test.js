import test from "node:test";
import assert from "node:assert/strict";

import { classifyContentChange, resolveAttributionSafety } from "../lib/analytics/content-change.js";
import { detectIssuesForPage } from "../lib/analytics/issues.js";

function page(overrides = {}) {
  return {
    page_path: "/services/monolitnye-raboty",
    entity_type: "service",
    entity_id: "service_1",
    page_title: "Монолитные работы",
    metrics: {
      impressions: 1240,
      clicks: 18,
      visits: 120,
      contact_actions: 0,
      mobile_share: 0.8,
      gallery_opens: 0
    },
    proof_path_summary: {
      has_case: false,
      has_gallery: true,
      has_faq: false,
      has_cta: true,
      has_reviews: false
    },
    seo_health: {
      sitemap_state: "present",
      indexation_state: "indexable"
    },
    ...overrides
  };
}

test("issue detector returns low_ctr and traffic_no_intent on sufficient samples", () => {
  const issues = detectIssuesForPage(page());
  const issueTypes = issues.map((item) => item.issue_type);

  assert.equal(issueTypes.includes("low_ctr"), true);
  assert.equal(issueTypes.includes("traffic_no_intent"), true);
  assert.equal(issues.every((item) => item.hypothesis.includes("сигнал")), true);
});

test("issue detector does not invent metric issues on insufficient sample", () => {
  const issues = detectIssuesForPage(page({
    metrics: {
      impressions: 40,
      clicks: 0,
      visits: 12,
      contact_actions: 0,
      mobile_share: 0.8,
      gallery_opens: 0
    },
    proof_path_summary: {
      has_case: true,
      has_gallery: true,
      has_faq: true,
      has_cta: true,
      has_reviews: true
    }
  }));

  assert.equal(issues.some((item) => item.issue_type === "low_ctr"), false);
  assert.equal(issues.some((item) => item.issue_type === "traffic_no_intent"), false);
});

test("issue detector surfaces proof path gaps for published services", () => {
  const issues = detectIssuesForPage(page());

  assert.equal(issues.some((item) => item.issue_type === "published_service_no_case"), true);
  assert.equal(issues.some((item) => item.issue_type === "weak_proof_path"), true);
});

test("attribution safety returns clean_single_change without causal claim", () => {
  const result = resolveAttributionSafety({
    isMixedChange: false,
    publishedAt: "2026-04-01T10:00:00.000Z",
    now: new Date("2026-05-04T10:00:00.000Z"),
    trackingChanges: [],
    sourceFreshnessContext: {},
    leadDomainAvailable: true
  });

  assert.equal(result.attribution_safety, "clean_single_change");
  assert.match(result.attribution_limitations.join(" "), /причинность автоматически не доказана/);
});

test("attribution safety blocks single-cause attribution for mixed changes", () => {
  const change = classifyContentChange({
    entityType: "service",
    entityId: "service_1",
    previousRevision: {
      id: "revision_old",
      payload: {
        slug: "monolitnye-raboty",
        h1: "Монолитные работы",
        ctaVariant: "Позвонить",
        galleryIds: []
      }
    },
    newRevision: {
      id: "revision_new",
      publishedAt: "2026-04-01T10:00:00.000Z",
      payload: {
        slug: "monolitnye-raboty",
        h1: "Монолитные работы в Сочи",
        ctaVariant: "Рассчитать стоимость",
        galleryIds: ["gallery_1"]
      }
    },
    now: new Date("2026-05-04T10:00:00.000Z"),
    leadDomainAvailable: true
  });

  assert.equal(change.is_mixed_change, true);
  assert.equal(change.attribution_safety, "mixed_change");
  assert.match(change.mixed_change_warning, /Нельзя выделять влияние одного элемента/);
});

test("attribution safety flags tracking_changed_nearby and insufficient_after_period", () => {
  const tracking = resolveAttributionSafety({
    isMixedChange: false,
    publishedAt: "2026-04-29T10:00:00.000Z",
    now: new Date("2026-05-04T10:00:00.000Z"),
    trackingChanges: [{ changed_at: "2026-04-30T10:00:00.000Z", change_type: "data_analytics_id_changed" }],
    sourceFreshnessContext: {},
    leadDomainAvailable: true
  });
  const insufficient = resolveAttributionSafety({
    isMixedChange: false,
    publishedAt: "2026-05-03T10:00:00.000Z",
    now: new Date("2026-05-04T10:00:00.000Z"),
    trackingChanges: [],
    sourceFreshnessContext: {},
    leadDomainAvailable: true
  });

  assert.equal(tracking.attribution_safety, "tracking_changed_nearby");
  assert.equal(insufficient.attribution_safety, "insufficient_after_period");
});
