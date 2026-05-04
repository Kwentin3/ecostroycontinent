import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { summarizeAnalyticsEvents } from "../lib/analytics/aggregate.js";
import { buildSeoDashboardLlmContextPacket } from "../lib/analytics/llm-context.js";
import { buildSeoDashboardReadModel } from "../lib/analytics/read-model.js";

const content = [
  {
    entityId: "service_1",
    entityType: "service",
    revision: {
      id: "revision_service_1",
      revisionNumber: 3,
      publishedAt: "2026-04-20T10:00:00.000Z",
      payload: {
        slug: "stroitelstvo-domov-pod-klyuch",
        title: "Строительство домов под ключ",
        h1: "Строительство домов под ключ в Сочи",
        summary: "Проектирование и строительство домов.",
        relatedCaseIds: [],
        galleryIds: ["gallery_1"],
        ctaVariant: "Получить консультацию",
        seo: {
          metaTitle: "Строительство домов под ключ в Сочи",
          metaDescription: "Строим дома в Большом Сочи.",
          canonicalIntent: "/services/stroitelstvo-domov-pod-klyuch",
          indexationFlag: "index"
        }
      }
    }
  },
  {
    entityId: "case_1",
    entityType: "case",
    revision: {
      id: "revision_case_1",
      revisionNumber: 1,
      publishedAt: "2026-04-18T10:00:00.000Z",
      payload: {
        slug: "dom-v-sochi",
        title: "Дом в Сочи",
        serviceIds: ["service_1"],
        galleryIds: ["gallery_2"],
        seo: {}
      }
    }
  }
];

const currentRows = [
  {
    date: "2026-05-04",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    entity_type: "service",
    entity_id: "service_1",
    source: "organic_yandex",
    medium: "organic",
    campaign: "",
    device_type: "mobile",
    event_type: "page_view",
    element_id: "",
    visits: 120,
    users: 90,
    page_views: 130,
    contact_actions: 0,
    cta_views: 0,
    cta_clicks: 0,
    gallery_opens: 0,
    faq_expands: 0
  },
  {
    date: "2026-05-04",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    entity_type: "service",
    entity_id: "service_1",
    source: "organic_yandex",
    medium: "organic",
    campaign: "",
    device_type: "mobile",
    event_type: "cta_view",
    element_id: "hero_primary_call",
    visits: 0,
    users: 70,
    page_views: 0,
    contact_actions: 0,
    cta_views: 80,
    cta_clicks: 0,
    gallery_opens: 0,
    faq_expands: 0
  },
  {
    date: "2026-05-04",
    page_path: "/services/stroitelstvo-domov-pod-klyuch",
    entity_type: "service",
    entity_id: "service_1",
    source: "organic_yandex",
    medium: "organic",
    campaign: "",
    device_type: "mobile",
    event_type: "gallery_open",
    element_id: "proof_gallery_open",
    visits: 0,
    users: 30,
    page_views: 0,
    contact_actions: 0,
    gallery_opens: 48,
    faq_expands: 0
  }
];

test("daily aggregate pure summarizer excludes admin/bot/preview traffic from business metrics", () => {
  const rows = summarizeAnalyticsEvents([
    {
      occurred_at: "2026-05-04T10:00:00.000Z",
      event_type: "page_view",
      anonymous_id: "anon_1",
      session_id: "session_1",
      page_path: "/services/a",
      source: "organic_yandex",
      medium: "organic",
      campaign: "",
      device_type: "mobile",
      is_excluded: false
    },
    {
      occurred_at: "2026-05-04T10:05:00.000Z",
      event_type: "click_to_call",
      anonymous_id: "anon_1",
      session_id: "session_1",
      page_path: "/services/a",
      source: "organic_yandex",
      medium: "organic",
      campaign: "",
      device_type: "mobile",
      is_excluded: false
    },
    {
      occurred_at: "2026-05-04T10:10:00.000Z",
      event_type: "page_view",
      anonymous_id: "anon_admin",
      session_id: "session_admin",
      page_path: "/services/a",
      source: "direct",
      medium: "none",
      campaign: "",
      device_type: "desktop",
      is_excluded: true
    }
  ]);

  assert.equal(rows.reduce((total, row) => total + row.visits, 0), 1);
  assert.equal(rows.reduce((total, row) => total + row.contact_actions, 0), 1);
});

test("read model returns contract sections and treats lead domain as unavailable, not zero", async () => {
  const readModel = await buildSeoDashboardReadModel({
    periodDays: 28,
    now: new Date("2026-05-04T10:00:00.000Z"),
    deps: {
      content,
      currentRows,
      previousRows: [],
      searchRows: [
        {
          date: "2026-05-04",
          source_system: "yandex_webmaster",
          search_engine: "yandex",
          page_path: "/services/stroitelstvo-domov-pod-klyuch",
          impressions: 2100,
          clicks: 64,
          ctr: 0.0304,
          confidence: "medium"
        }
      ],
      previousSearchRows: [],
      sourceStates: [],
      unmappedDiagnostics: [{ id: "unmapped_1", page_path: "/old-url", hit_count: 3, safe_reason: "unmapped" }],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });

  for (const key of ["overview", "traffic_sources", "page_list", "selected_page_detail", "recommendations", "evidence_items", "analytics_history"]) {
    assert.equal(key in readModel, true);
  }
  assert.equal(readModel.sources.google_search_console.status, "not_configured");
  assert.equal(readModel.sources.lead_domain.status, "not_ready");
  assert.equal(readModel.overview.leads.value, null);
  assert.equal(readModel.page_list[0].page_path, "/services/stroitelstvo-domov-pod-klyuch");
  assert.equal(readModel.semantic_click_map.some((item) => item.element_id === "proof_gallery_open"), true);
  assert.equal(readModel.recommendations.some((item) => item.issue_type === "unmapped_analytics_url"), true);
});

test("LLM context packet is task-specific and excludes raw data surfaces", async () => {
  const readModel = await buildSeoDashboardReadModel({
    deps: {
      content,
      currentRows,
      previousRows: [],
      searchRows: [],
      previousSearchRows: [],
      sourceStates: [],
      unmappedDiagnostics: [],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });
  const packet = buildSeoDashboardLlmContextPacket(readModel, {
    task: "explain_page",
    pagePath: "/services/stroitelstvo-domov-pod-klyuch"
  });

  assert.equal(packet.excluded.raw_events, true);
  assert.equal(packet.excluded.tokens, true);
  assert.equal(packet.excluded.direct_sql, true);
  assert.equal(Array.isArray(packet.evidence_items), true);
});

test("sample analytics contract fixture remains valid JSON", () => {
  const fixture = JSON.parse(readFileSync(new URL("../docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json", import.meta.url), "utf8"));

  assert.equal(typeof fixture.version, "string");
  assert.equal(Array.isArray(fixture.classified_content_changes), true);
  assert.equal(fixture.classified_content_changes.some((item) => item.attribution_safety === "mixed_change"), true);
});
