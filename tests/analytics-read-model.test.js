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

const emptyMetricTotals = {
  row_count: 0,
  visits: 0,
  users: 0,
  pageviews: 0,
  period_start: null,
  period_end: null
};

const emptyExternalReadinessDeps = {
  metricaImportSummary: {
    total_rows: 0,
    traffic_rows: 0,
    goal_rows: 0,
    r2b_rows: 0,
    nonzero_rows: 0,
    all_values_zero: false,
    report_types: []
  },
  metricaTrafficSourceEvidence: { rows: [], totals: emptyMetricTotals },
  metricaSourceDetailEvidence: { rows: [], totals: emptyMetricTotals },
  metricaDeviceEvidence: { rows: [], totals: emptyMetricTotals },
  metricaGeographyEvidence: {
    countries: [],
    country_totals: emptyMetricTotals,
    regions: [],
    region_totals: emptyMetricTotals
  },
  metricaLandingEvidence: {
    rows: [],
    totals: emptyMetricTotals,
    mapped_count: 0,
    unmapped_count: 0
  },
  webmasterHostSnapshot: null,
  webmasterIndexationSnapshot: null,
  webmasterUrlSampleSummary: {
    url_sample_count: 0,
    resolved_url_sample_count: 0
  },
  webmasterUrlSampleEvidence: [],
  webmasterQueryVisibilitySummary: {
    query_visibility_rows: 0,
    impressions: 0,
    clicks: 0
  },
  webmasterQueryVisibilityEvidence: []
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
      ...emptyExternalReadinessDeps,
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

test("R4 read model exposes compact external evidence without changing primary metrics or recommendations", async () => {
  const readModel = await buildSeoDashboardReadModel({
    periodDays: 28,
    now: new Date("2026-05-20T12:00:00.000Z"),
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
          last_attempted_at: "2026-05-20T09:00:00.000Z",
          last_successful_at: "2026-05-20T09:01:00.000Z",
          imported_period_start: "2026-05-17",
          imported_period_end: "2026-05-19",
          rows_imported: 30,
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
        total_rows: 30,
        traffic_rows: 0,
        goal_rows: 0,
        r2b_rows: 30,
        nonzero_rows: 30,
        all_values_zero: false,
        report_types: ["country", "device", "landing_url", "region", "source_detail", "traffic_source"]
      },
      metricaTrafficSourceEvidence: {
        totals: { row_count: 1, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        rows: [{ traffic_source: "direct", traffic_source_name: "Direct", visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" }]
      },
      metricaSourceDetailEvidence: {
        totals: { row_count: 1, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        rows: [{ traffic_source: "organic", traffic_source_name: "Search", source_engine: "yandex", source_engine_name: "Yandex", visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" }]
      },
      metricaDeviceEvidence: {
        totals: { row_count: 2, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        rows: [{ device_category: "mobile", device_category_name: "Mobile", visits: 3, users: 2, pageviews: 4, period_start: "2026-05-17", period_end: "2026-05-19" }]
      },
      metricaGeographyEvidence: {
        country_totals: { row_count: 2, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        countries: [{ country: "RU", country_name: "Russia", visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" }],
        region_totals: { row_count: 2, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        regions: [{ country: "RU", country_name: "Russia", region_area: "KDA", region_area_name: "Krasnodar", visits: 2, users: 2, pageviews: 3, period_start: "2026-05-17", period_end: "2026-05-19" }]
      },
      metricaLandingEvidence: {
        totals: { row_count: 2, visits: 4, users: 3, pageviews: 5, period_start: "2026-05-17", period_end: "2026-05-19" },
        mapped_count: 2,
        unmapped_count: 0,
        rows: [
          { page_path: "/", normalized_url: "https://ecostroycontinent.ru/", entity_type: "page", entity_id: "home", visits: 2, users: 2, pageviews: 2, period_start: "2026-05-17", period_end: "2026-05-19" },
          { page_path: "/contacts", normalized_url: "https://ecostroycontinent.ru/contacts", entity_type: "page", entity_id: "contacts", visits: 2, users: 1, pageviews: 3, period_start: "2026-05-17", period_end: "2026-05-19" }
        ]
      },
      webmasterHostSnapshot: {
        verified: true,
        host_data_status: "OK"
      },
      webmasterIndexationSnapshot: {
        metrics: {
          searchable_pages_count: 2,
          excluded_pages_count: 0,
          site_problems: { RECOMMENDATION: 1 }
        }
      },
      webmasterUrlSampleSummary: {
        url_sample_count: 2,
        resolved_url_sample_count: 1
      },
      webmasterUrlSampleEvidence: [
        {
          endpoint: "indexed",
          normalized_url: "https://ecostroycontinent.ru/services/stroitelstvo-domov-pod-klyuch",
          page_path: "/services/stroitelstvo-domov-pod-klyuch",
          entity_type: "service",
          entity_id: "service_1",
          resolution_status: "resolved",
          observed_date: "2026-05-17",
          sample_status: "OK",
          http_code: 200,
          title: "Service"
        }
      ],
      webmasterQueryVisibilitySummary: {
        query_visibility_rows: 0,
        impressions: 0,
        clicks: 0,
        min_date: null,
        max_date: null
      },
      webmasterQueryVisibilityEvidence: [],
      unmappedDiagnostics: [
        {
          id: "metrica_unmapped_1",
          source_system: "yandex_metrica",
          page_path: "/landing-old",
          hit_count: 2,
          safe_reason: "metrica_landing_unmapped"
        }
      ],
      recommendationStates: [],
      trackingChanges: [],
      classifiedContentChanges: [],
      listRevisionsForEntity: async () => []
    }
  });

  assert.equal("external_evidence" in readModel, true);
  assert.equal(readModel.external_source_readiness.yandex_metrica.imported_summary.r2b_rows, 30);
  assert.equal(readModel.external_evidence.yandex_metrica.traffic_sources.rows[0].traffic_source, "direct");
  assert.equal(readModel.external_evidence.yandex_metrica.devices.rows[0].device_category, "mobile");
  assert.equal(readModel.external_evidence.yandex_metrica.geography.countries[0].country, "RU");
  assert.equal(readModel.external_evidence.yandex_metrica.geography.regions[0].region_area, "KDA");
  assert.equal(readModel.external_evidence.yandex_metrica.landings.rows.some((row) => row.page_path === "/contacts" && row.entity_type === "page"), true);
  assert.equal(readModel.external_evidence.yandex_metrica.limitations.includes("metrica_external_enrichment_only"), true);
  assert.equal(readModel.external_evidence.yandex_metrica.limitations.includes("low_external_sample_size"), true);
  assert.equal(readModel.overview.visits.value, 120);
  assert.equal(readModel.external_evidence.yandex_webmaster.host_indexation.host_verified, true);
  assert.equal(readModel.external_evidence.yandex_webmaster.url_samples.rows[0].resolution_status, "resolved");
  assert.equal(readModel.external_evidence.yandex_webmaster.query_visibility.row_count, 0);
  assert.equal(readModel.external_evidence.yandex_webmaster.query_visibility.limitations.includes("no_zero_demand_claim"), true);
  assert.equal(readModel.recommendations.some((item) => item.issue_type === "unmapped_analytics_url"), false);
  assert.equal(readModel.recommendations.some((item) => item.issue_type === "low_ctr"), false);
  assert.equal(JSON.stringify(readModel.recommendations).includes("metrica"), false);
  assert.equal(hasUnsafeReadModelKey(readModel.external_evidence), false);
});

test("R4-lite handles empty external imported tables and stale source freshness", async () => {
  const readModel = await buildSeoDashboardReadModel({
    now: new Date("2026-05-19T12:00:00.000Z"),
    deps: {
      ...emptyExternalReadinessDeps,
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
