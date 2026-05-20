import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  R2A_SOURCE_SYSTEM,
  normalizeMetricaLandingUrl,
  runMetricaR2b
} from "../scripts/yandex/metrica-import-lib.mjs";

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

const COMPLETE_ENV = Object.freeze({
  YANDEX_METRICA_COUNTER_ID: "109037342",
  YANDEX_METRICA_OAUTH_TOKEN: "AQAAA-token-must-not-leak",
  PUBLIC_SITE_URL: "https://ecostroycontinent.ru"
});

function reportTypeForDimensions(dimensions) {
  if (dimensions.includes("ym:s:startURLPath")) {
    return "landing_url";
  }
  if (dimensions.includes("ym:s:regionArea")) {
    return "region";
  }
  if (dimensions.includes("ym:s:regionCountry")) {
    return "country";
  }
  if (dimensions.includes("ym:s:deviceCategory")) {
    return "device";
  }
  if (dimensions.includes("ym:s:lastsignSourceEngine")) {
    return "source_detail";
  }
  if (dimensions.includes("ym:s:lastsignTrafficSource")) {
    return "traffic_source";
  }

  return "unknown";
}

function dimensionRows(reportType) {
  const date = { id: "2026-05-16", name: "2026-05-16" };
  const rows = {
    traffic_source: [
      [date, { id: "organic", name: "Search engine traffic" }]
    ],
    source_detail: [
      [date, { id: "organic", name: "Search engine traffic" }, { id: "yandex", name: "Yandex" }]
    ],
    device: [
      [date, { id: "mobile", name: "Mobile" }]
    ],
    country: [
      [date, { id: "RU", name: "Russia" }]
    ],
    region: [
      [date, { id: "RU", name: "Russia" }, { id: "krasnodar-krai", name: "Krasnodar Krai" }]
    ],
    landing_url: [
      [date, { id: "https://ecostroycontinent.ru/services/fundament?utm_source=yandex&yclid=1", name: "/services/fundament" }],
      [date, { id: "https://ecostroycontinent.ru/ghost?utm_medium=cpc", name: "/ghost" }]
    ]
  };

  return rows[reportType] ?? [];
}

function statRowsResponse(url, overrides = {}) {
  const metrics = url.searchParams.get("metrics").split(",");
  const dimensions = url.searchParams.get("dimensions").split(",");
  const reportType = reportTypeForDimensions(dimensions);
  const rows = dimensionRows(reportType).map((rowDimensions, rowIndex) => ({
    dimensions: rowDimensions,
    metrics: metrics.map((_metric, metricIndex) => 10 + rowIndex + metricIndex)
  }));
  const totalRows = overrides.totalRows ?? rows.length;
  const limit = Number(url.searchParams.get("limit") || 100);
  const offset = Number(url.searchParams.get("offset") || 1);
  const pageRows = rows.slice(offset - 1, offset - 1 + limit);

  return jsonResponse({
    query: {
      metrics,
      dimensions,
      date1: url.searchParams.get("date1"),
      date2: url.searchParams.get("date2"),
      limit,
      offset
    },
    data: pageRows,
    total_rows: totalRows,
    total_rows_rounded: Boolean(overrides.totalRowsRounded),
    sampled: false,
    contains_sensitive_data: false,
    sample_share: 1,
    sample_size: totalRows,
    sample_space: totalRows,
    data_lag: 0,
    totals: metrics.map((_metric, index) => 20 + index)
  });
}

function makeFetch({ statHandler = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });

    if (String(url).includes("/stat/v1/data")) {
      return statHandler ? statHandler(new URL(String(url))) : statRowsResponse(new URL(String(url)));
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  fetchImpl.calls = calls;
  return fetchImpl;
}

function revisionRow(id, entityId, payload) {
  return {
    id,
    entity_id: entityId,
    revision_number: 1,
    state: "published",
    payload,
    change_class: "class_a",
    change_intent: "",
    owner_review_required: false,
    owner_approval_status: "not_required",
    created_by: "test",
    updated_by: "test",
    published_at: "2026-05-01T00:00:00.000Z",
    published_by: "test",
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z"
  };
}

function makeMemoryDb() {
  const aggregateRows = new Map();
  const diagnostics = new Map();
  const syncStates = [];
  const queries = [];
  const db = {
    async query(sql, params = []) {
      queries.push({ sql, params });

      if (/FROM content_entities e\s+JOIN content_revisions r ON r.id = e.active_published_revision_id\s+WHERE e.entity_type = \$1/i.test(sql)) {
        const [entityType, slug] = params;
        if (entityType === "service" && slug === "fundament") {
          return { rows: [{ entity_id: "service_fundament", ...revisionRow("rev_service_fundament", "service_fundament", { slug }) }] };
        }
        return { rows: [] };
      }

      if (/WHERE e.entity_type = 'page'/i.test(sql)) {
        return { rows: [] };
      }

      if (sql.includes("external_metrica_daily_aggregate")) {
        const key = [
          params[1],
          params[2],
          params[4],
          params[5],
          params[7],
          params[9]
        ].join("|");
        aggregateRows.set(key, params);
        return { rowCount: 1, rows: [] };
      }

      if (sql.includes("analytics_unmapped_url_diagnostic")) {
        diagnostics.set([params[1], params[2]].join("|"), params);
        return { rowCount: 1, rows: [] };
      }

      if (sql.includes("analytics_source_sync_state")) {
        syncStates.push({
          sourceSystem: params[0],
          status: params[1],
          periodStart: params[2],
          periodEnd: params[3],
          safeErrorMessage: params[4],
          rowsImported: params[5],
          unmappedUrlCount: params[7]
        });
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    }
  };

  return {
    aggregateRows,
    diagnostics,
    syncStates,
    queries,
    async withTransactionFn(run) {
      return run(db);
    }
  };
}

test("R2B missing env returns not_configured without fetch or DB writes", async () => {
  const db = makeMemoryDb();
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: {},
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
    withTransactionFn: db.withTransactionFn,
    now: new Date("2026-05-19T09:00:00.000Z")
  });

  assert.equal(result.status, "not_configured");
  assert.equal(result.dry_run, true);
  assert.equal(result.rows_imported, 0);
  assert.equal(db.aggregateRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("R2B dry-run validates bounded reports and writes nothing", async () => {
  const db = makeMemoryDb();
  const fetchImpl = makeFetch();
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl,
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-16"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.dry_run, true);
  assert.equal(result.attribution_model, "lastsign");
  assert.deepEqual(result.selected_reports.traffic_source, ["visits", "users", "pageviews"]);
  assert.deepEqual(result.selected_api_dimensions.landing_url, ["ym:s:date", "ym:s:startURLPath"]);
  assert.equal(result.rows_prepared, 21);
  assert.equal(result.rows_imported, 0);
  assert.equal(db.aggregateRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.equal(fetchImpl.calls.some((call) => call.url.includes("/stat/v1/data")), true);
});

test("R2B write persists rows, source state and unmapped landing diagnostics", async () => {
  const db = makeMemoryDb();
  const result = await runMetricaR2b({
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-16"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.rows_imported, 21);
  assert.equal(db.aggregateRows.size, 21);
  assert.equal(db.diagnostics.size, 1);
  assert.equal(db.syncStates.at(-1).sourceSystem, R2A_SOURCE_SYSTEM);
  assert.equal(db.syncStates.at(-1).status, "ok");
  assert.equal(db.syncStates.at(-1).rowsImported, 21);
  assert.equal(db.syncStates.at(-1).unmappedUrlCount, 1);

  const landingRows = Array.from(db.aggregateRows.values()).filter((params) => params[4] === "landing_url");
  const mapped = landingRows.find((params) => params[12] === "/services/fundament");
  const unmapped = landingRows.find((params) => params[12] === "/ghost");

  assert.equal(mapped[11], "https://ecostroycontinent.ru/services/fundament");
  assert.equal(mapped[13], "service");
  assert.equal(mapped[14], "service_fundament");
  assert.equal(unmapped[11], "https://ecostroycontinent.ru/ghost");
});

test("R2B same period rerun is idempotent by aggregate upsert key", async () => {
  const db = makeMemoryDb();
  const common = {
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-16"
  };

  await runMetricaR2b(common);
  const before = db.aggregateRows.size;
  await runMetricaR2b({ ...common, fetchImpl: makeFetch() });

  assert.equal(before, 21);
  assert.equal(db.aggregateRows.size, 21);
  assert.equal(db.syncStates.at(-1).status, "ok");
});

test("R2B optional source detail cardinality skip remains ok with limitation", async () => {
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const reportType = reportTypeForDimensions(url.searchParams.get("dimensions").split(","));
        if (reportType === "source_detail") {
          return statRowsResponse(url, { totalRows: 6000 });
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-16"
  });
  const sourceDetail = result.report_summaries.find((item) => item.report_type === "source_detail");

  assert.equal(result.status, "ok");
  assert.equal(sourceDetail.status, "skipped");
  assert.equal(result.limitations.includes("source_detail_skipped_cardinality_limit_exceeded"), true);
});

test("R2B required report cardinality guard produces partial and no oversized rows", async () => {
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const reportType = reportTypeForDimensions(url.searchParams.get("dimensions").split(","));
        if (reportType === "landing_url") {
          return statRowsResponse(url, { totalRows: 3000 });
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-16"
  });
  const landing = result.report_summaries.find((item) => item.report_type === "landing_url");

  assert.equal(result.status, "partial");
  assert.equal(landing.status, "skipped");
  assert.equal(result.rows_prepared, 15);
});

test("R2B users metric rejection retries without users and redacts errors", async () => {
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        if (url.searchParams.get("metrics").includes("ym:s:users")) {
          return jsonResponse({
            errors: [{
              error_type: "invalid_parameter",
              message: "Metric ym:s:users is unavailable",
              authorization: "OAuth AQAAA-token-must-not-leak"
            }]
          }, { status: 400 });
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-16"
  });

  assert.equal(result.status, "partial");
  assert.deepEqual(result.selected_reports.device, ["visits", "pageviews"]);
  assert.equal(result.unavailable_metrics.includes("users"), true);
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("R2B required report failure is partial when other reports succeed", async () => {
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const reportType = reportTypeForDimensions(url.searchParams.get("dimensions").split(","));
        if (reportType === "device") {
          return jsonResponse({
            error: "invalid_parameter",
            client_secret: "client-secret-must-not-leak"
          }, { status: 400 });
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-16"
  });

  assert.equal(result.status, "partial");
  assert.equal(result.report_summaries.find((item) => item.report_type === "device").status, "failed");
  assert.doesNotMatch(JSON.stringify(result), /client-secret-must-not-leak/);
});

test("R2B all stat API failures produce failed safe result without token leakage", async () => {
  const result = await runMetricaR2b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async () => jsonResponse({
        error: "quota_requests_by_uid",
        authorization: "OAuth AQAAA-token-must-not-leak"
      }, { status: 429 })
    }),
    date1: "2026-05-16",
    date2: "2026-05-16"
  });

  assert.equal(result.status, "failed");
  assert.equal(result.rows_prepared, 0);
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak|Authorization/i);
});

test("R2B landing URL normalization strips tracking and preserves canonical path", () => {
  const normalized = normalizeMetricaLandingUrl("https://other.example/services/fundament/?utm_source=yandex&yclid=1#frag", {
    publicSiteUrl: "https://ecostroycontinent.ru"
  });

  assert.equal(normalized.normalized_url, "https://ecostroycontinent.ru/services/fundament");
  assert.equal(normalized.page_path, "/services/fundament");
  assert.deepEqual(normalized.stripped_tracking_params, ["utm_source", "yclid"]);
});

test("R2B migration and importer keep external rows out of internal telemetry surfaces", () => {
  const migration = fs.readFileSync("db/migrations/012_external_metrica_r2b_dimensions.sql", "utf8");
  const importer = fs.readFileSync("scripts/yandex/metrica-import-lib.mjs", "utf8");
  const readModel = fs.readFileSync("lib/analytics/read-model.js", "utf8");
  const visibilityUi = fs.readFileSync("components/admin/SeoVisibilityDashboard.js", "utf8");

  for (const reportType of ["traffic_source", "source_detail", "device", "country", "region", "landing_url"]) {
    assert.match(migration, new RegExp(`'${reportType}'`));
  }
  assert.match(migration, /normalized_url/);
  assert.match(migration, /page_path/);
  assert.doesNotMatch(migration, /\b(session_id|anonymous_visitor_id|ip_address|user_agent|form_values|authorization|access_token)\b/i);
  assert.doesNotMatch(importer, /INSERT\s+INTO\s+analytics_event/i);
  assert.doesNotMatch(importer, /UPDATE\s+content_entities|INSERT\s+INTO\s+content_entities/i);
  assert.doesNotMatch(readModel, /api-metrika|Authorization|fetch\s*\(/i);
  assert.doesNotMatch(visibilityUi, /api-metrika|Authorization|fetch\s*\(/i);
});
