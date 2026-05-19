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

const emptyExternalReadinessDeps = {
  metricaImportSummary: {
    total_rows: 0,
    traffic_rows: 0,
    goal_rows: 0,
    nonzero_rows: 0,
    all_values_zero: false,
    report_types: []
  },
  webmasterHostSnapshot: null,
  webmasterIndexationSnapshot: null,
  webmasterUrlSampleSummary: {
    url_sample_count: 0,
    resolved_url_sample_count: 0
  },
  webmasterQueryVisibilitySummary: {
    query_visibility_rows: 0,
    impressions: 0,
    clicks: 0
  }
};

function hasUnsafeReadModelKey(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(([key, nested]) => {
    if ([
      "anonymous_id",
      "session_id",
      "user_agent",
      "ip_address",
      "form_values",
      "raw_events",
      "raw_response",
      "authorization",
      "access_token",
      "refresh_token",
      "client_secret"
    ].includes(key)) {
      return true;
    }

    return hasUnsafeReadModelKey(nested);
  });
}

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
      ...emptyExternalReadinessDeps,
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
  assert.equal(hasUnsafeReadModelKey(readModel), false);
});

test("R4-lite read model exposes external source readiness without using Metrica zeros as primary truth", async () => {
  const readModel = await buildSeoDashboardReadModel({
    periodDays: 28,
    now: new Date("2026-05-19T12:00:00.000Z"),
    deps: {
      ...emptyExternalReadinessDeps,
      content,
      currentRows,
      previousRows: [],
      searchRows: [],
      previousSearchRows: [],
      sourceStates: [
        {
          source_system: "yandex_metrica",
          status: "ok",
          last_attempted_at: "2026-05-19T09:00:00.000Z",
          last_successful_at: "2026-05-19T09:01:00.000Z",
          imported_period_start: "2026-05-16",
          imported_period_end: "2026-05-18",
          rows_imported: 42,
          safe_error_message: "",
          unmapped_url_count: 0
        },
        {
          source_system: "yandex_webmaster",
          status: "ok",
          last_attempted_at: "2026-05-19T09:02:00.000Z",
          last_successful_at: "2026-05-19T09:03:00.000Z",
          imported_period_start: "2026-05-05",
          imported_period_end: "2026-05-17",
          rows_imported: 3,
          safe_error_message: "",
          unmapped_url_count: 0
        }
      ],
      metricaImportSummary: {
        total_rows: 42,
        traffic_rows: 9,
        goal_rows: 33,
        nonzero_rows: 0,
        all_values_zero: true,
        report_types: ["goal_reaches", "traffic_total"]
      },
      webmasterHostSnapshot: {
        verified: true,
        host_data_status: "OK"
      },
      webmasterIndexationSnapshot: {
        metrics: {
          searchable_pages_count: 1,
          excluded_pages_count: 0,
          site_problems: { RECOMMENDATION: 3 }
        }
      },
      webmasterUrlSampleSummary: {
        url_sample_count: 1,
        resolved_url_sample_count: 1
      },
      webmasterQueryVisibilitySummary: {
        query_visibility_rows: 0,
        impressions: 0,
        clicks: 0
      },
      unmappedDiagnostics: [],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });

  assert.equal(readModel.external_source_readiness.yandex_metrica.status, "ok");
  assert.equal(readModel.external_source_readiness.yandex_metrica.freshness.status, "fresh");
  assert.equal(readModel.external_source_readiness.yandex_metrica.imported_summary.all_values_zero, true);
  assert.equal(readModel.external_source_readiness.yandex_metrica.limitations.includes("external_metrica_all_values_zero"), true);
  assert.equal(readModel.external_source_readiness.yandex_metrica.data_actionability, "readiness_only");
  assert.equal(readModel.overview.visits.value, 120);
  assert.equal(readModel.overview.visits.explanation.includes("first-party aggregates"), true);
  assert.equal(JSON.stringify(readModel.recommendations).includes("external_metrica_all_values_zero"), false);
  assert.equal(hasUnsafeReadModelKey(readModel), false);
});

test("R4-lite read model exposes Webmaster indexation readiness and query-empty limitation", async () => {
  const readModel = await buildSeoDashboardReadModel({
    now: new Date("2026-05-19T12:00:00.000Z"),
    deps: {
      content,
      currentRows: [],
      previousRows: [],
      searchRows: [],
      previousSearchRows: [],
      sourceStates: [
        {
          source_system: "yandex_webmaster",
          status: "ok",
          last_attempted_at: "2026-05-19T09:02:00.000Z",
          last_successful_at: "2026-05-19T09:03:00.000Z",
          imported_period_start: "2026-05-05",
          imported_period_end: "2026-05-17",
          rows_imported: 3,
          safe_error_message: "",
          unmapped_url_count: 0
        }
      ],
      metricaImportSummary: {
        total_rows: 0,
        traffic_rows: 0,
        goal_rows: 0,
        nonzero_rows: 0,
        all_values_zero: false,
        report_types: []
      },
      webmasterHostSnapshot: {
        verified: true,
        host_data_status: "OK"
      },
      webmasterIndexationSnapshot: {
        metrics: {
          searchable_pages_count: 1,
          excluded_pages_count: 0,
          site_problems: { RECOMMENDATION: 3 }
        }
      },
      webmasterUrlSampleSummary: {
        url_sample_count: 1,
        resolved_url_sample_count: 1
      },
      webmasterQueryVisibilitySummary: {
        query_visibility_rows: 0,
        impressions: 0,
        clicks: 0
      },
      unmappedDiagnostics: [],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });

  const webmaster = readModel.external_source_readiness.yandex_webmaster;

  assert.equal(webmaster.status, "ok");
  assert.equal(webmaster.imported_summary.host_verified, true);
  assert.equal(webmaster.imported_summary.searchable_pages_count, 1);
  assert.equal(webmaster.imported_summary.url_sample_count, 1);
  assert.equal(webmaster.imported_summary.query_visibility_rows, 0);
  assert.equal(webmaster.limitations.includes("webmaster_query_visibility_no_rows_for_period"), true);
  assert.equal(readModel.recommendations.some((item) => item.issue_type === "low_ctr"), false);
});

test("R4-lite handles empty external imported tables and stale source freshness", async () => {
  const readModel = await buildSeoDashboardReadModel({
    now: new Date("2026-05-19T12:00:00.000Z"),
    deps: {
      content,
      currentRows: [],
      previousRows: [],
      searchRows: [],
      previousSearchRows: [],
      sourceStates: [
        {
          source_system: "yandex_metrica",
          status: "ok",
          last_attempted_at: "2026-05-10T09:00:00.000Z",
          last_successful_at: "2026-05-10T09:01:00.000Z",
          imported_period_start: "2026-05-07",
          imported_period_end: "2026-05-09",
          rows_imported: 0,
          safe_error_message: "",
          unmapped_url_count: 0
        }
      ],
      metricaImportSummary: {
        total_rows: 0,
        traffic_rows: 0,
        goal_rows: 0,
        nonzero_rows: 0,
        all_values_zero: false,
        report_types: []
      },
      webmasterHostSnapshot: null,
      webmasterIndexationSnapshot: null,
      webmasterUrlSampleSummary: { url_sample_count: 0, resolved_url_sample_count: 0 },
      webmasterQueryVisibilitySummary: { query_visibility_rows: 0, impressions: 0, clicks: 0 },
      unmappedDiagnostics: [],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });

  assert.equal(readModel.external_source_readiness.yandex_metrica.freshness.status, "stale");
  assert.equal(readModel.external_source_readiness.yandex_metrica.limitations.includes("external_metrica_no_imported_rows"), true);
  assert.equal(readModel.external_source_readiness.yandex_webmaster.status, "not_configured");
});

test("R4-lite read model path has no live Yandex API calls", () => {
  const readModelSource = readFileSync(new URL("../lib/analytics/read-model.js", import.meta.url), "utf8");
  const repositorySource = readFileSync(new URL("../lib/analytics/repository.js", import.meta.url), "utf8");
  const combined = `${readModelSource}\n${repositorySource}`;

  assert.doesNotMatch(combined, /api-metrika|api\.webmaster|webmaster\.yandex|mc\.yandex|Authorization|fetch\s*\(/i);
});

test("LLM context packet is task-specific and excludes raw data surfaces", async () => {
  const readModel = await buildSeoDashboardReadModel({
    deps: {
      ...emptyExternalReadinessDeps,
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
