import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  REQUIRED_METRICA_GOALS
} from "../scripts/yandex/bootstrap-lib.mjs";
import {
  R2A_SOURCE_SYSTEM,
  resolveR2aDateRange,
  runMetricaR2a
} from "../scripts/yandex/metrica-import-lib.mjs";

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function makeGoals() {
  return REQUIRED_METRICA_GOALS.map((goalName, index) => ({
    id: 556869800 + index,
    name: goalName,
    type: "action",
    conditions: [{ type: "exact", url: goalName }]
  }));
}

function makeFetch({
  statHandler = null,
  goals = makeGoals()
} = {}) {
  const calls = [];

  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });

    if (String(url).includes("/management/v1/counter/109037342/goals")) {
      return jsonResponse({ goals });
    }

    if (String(url).includes("/management/v1/counter/109037342")) {
      return jsonResponse({
        counter: {
          id: 109037342,
          name: "ecostroycontinent.ru",
          site: "ecostroycontinent.ru",
          status: "Active",
          permission: "own"
        }
      });
    }

    if (String(url).includes("/stat/v1/data")) {
      if (statHandler) {
        return statHandler(new URL(String(url)));
      }

      return statRowsResponse(new URL(String(url)));
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  fetchImpl.calls = calls;
  return fetchImpl;
}

function statRowsResponse(url) {
  const metrics = url.searchParams.get("metrics").split(",");
  const dates = ["2026-05-16", "2026-05-17"];
  const data = dates.map((date, dateIndex) => ({
    dimensions: [{ id: date, name: date }],
    metrics: metrics.map((_metric, metricIndex) => dateIndex + metricIndex + 1)
  }));

  return jsonResponse({
    query: {
      metrics,
      dimensions: ["ym:s:date"],
      date1: url.searchParams.get("date1"),
      date2: url.searchParams.get("date2")
    },
    data,
    total_rows: data.length,
    sampled: false,
    sample_share: 1,
    data_lag: 0,
    totals: metrics.map((_metric, index) => index + 10)
  });
}

function makeMemoryDb() {
  const aggregateRows = new Map();
  const syncStates = [];
  const queries = [];
  const db = {
    async query(sql, params = []) {
      queries.push({ sql, params });

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

      if (sql.includes("analytics_source_sync_state")) {
        syncStates.push({
          sourceSystem: params[0],
          status: params[1],
          periodStart: params[2],
          periodEnd: params[3],
          safeErrorMessage: params[4],
          rowsImported: params[5]
        });
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    }
  };

  return {
    aggregateRows,
    syncStates,
    queries,
    async withTransactionFn(run) {
      return run(db);
    }
  };
}

const COMPLETE_ENV = Object.freeze({
  YANDEX_METRICA_COUNTER_ID: "109037342",
  YANDEX_METRICA_OAUTH_TOKEN: "AQAAA-token-must-not-leak"
});

test("R2A date range defaults to the last three completed Moscow dates", () => {
  const range = resolveR2aDateRange({
    now: new Date("2026-05-19T09:00:00.000Z")
  });

  assert.equal(range.date1, "2026-05-16");
  assert.equal(range.date2, "2026-05-18");
  assert.equal(range.timezone, "+03:00");
});

test("missing Metrica env returns not_configured without fetch or DB writes", async () => {
  const fetchImpl = async () => {
    throw new Error("fetch should not be called without required env");
  };
  const db = makeMemoryDb();
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: {},
    fetchImpl,
    withTransactionFn: db.withTransactionFn,
    now: new Date("2026-05-19T09:00:00.000Z")
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "not_configured");
  assert.equal(result.dry_run, true);
  assert.equal(result.rows_imported, 0);
  assert.equal(db.aggregateRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.doesNotMatch(serialized, /token-must-not-leak/);
});

test("dry-run validates API and prepares traffic and 11 goal rows without DB writes", async () => {
  const db = makeMemoryDb();
  const fetchImpl = makeFetch();
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl,
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-17"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.dry_run, true);
  assert.deepEqual(result.selected_reports.traffic_total, ["visits", "pageviews", "users"]);
  assert.equal(result.selected_reports.goal_reaches.length, REQUIRED_METRICA_GOALS.length);
  assert.equal(result.rows_prepared, 28);
  assert.equal(result.rows_imported, 0);
  assert.equal(db.aggregateRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.equal(fetchImpl.calls.some((call) => call.url.includes("/stat/v1/data")), true);
});

test("empty API rows with zero totals produce explicit zero-valued daily aggregate rows", async () => {
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const metrics = url.searchParams.get("metrics").split(",");

        return jsonResponse({
          data: [],
          total_rows: 0,
          sampled: false,
          sample_share: 1,
          data_lag: 0,
          totals: metrics.map(() => 0)
        });
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-18"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.report_summaries.traffic_total.api_rows, 0);
  assert.equal(result.rows_prepared, 42);
  assert.equal(result.rows_imported, 0);
});

test("write import persists minimal aggregate rows and ok source sync state", async () => {
  const db = makeMemoryDb();
  const result = await runMetricaR2a({
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-17"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.rows_imported, 28);
  assert.equal(db.aggregateRows.size, 28);
  assert.equal(db.syncStates.length, 1);
  assert.deepEqual(db.syncStates[0], {
    sourceSystem: R2A_SOURCE_SYSTEM,
    status: "ok",
    periodStart: "2026-05-16",
    periodEnd: "2026-05-17",
    safeErrorMessage: "",
    rowsImported: 28
  });
});

test("same date range rerun is idempotent by aggregate upsert key", async () => {
  const db = makeMemoryDb();
  const options = {
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-16",
    date2: "2026-05-17"
  };

  await runMetricaR2a(options);
  const firstSize = db.aggregateRows.size;
  await runMetricaR2a({
    ...options,
    fetchImpl: makeFetch()
  });

  assert.equal(firstSize, 28);
  assert.equal(db.aggregateRows.size, 28);
  assert.equal(db.syncStates.at(-1).status, "ok");
});

test("traffic users metric rejection retries without users and marks partial safely", async () => {
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const metrics = url.searchParams.get("metrics");
        if (metrics.includes("ym:s:users")) {
          return jsonResponse({
            errors: [{
              error_type: "invalid_parameter",
              message: "Metric ym:s:users is unavailable for this report",
              access_token: "AQAAA-token-must-not-leak"
            }]
          }, { status: 400 });
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-17"
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "partial");
  assert.deepEqual(result.unavailable_metrics, ["users"]);
  assert.deepEqual(result.selected_reports.traffic_total, ["visits", "pageviews"]);
  assert.doesNotMatch(serialized, /token-must-not-leak/);
});

test("failed combined goal report retries per goal and records partial failures safely", async () => {
  let goalStatCalls = 0;
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async (url) => {
        const metrics = url.searchParams.get("metrics");
        if (metrics.includes("ym:s:goal") && metrics.split(",").length > 1) {
          return jsonResponse({
            error: "invalid_parameter",
            access_token: "AQAAA-token-must-not-leak"
          }, { status: 400 });
        }

        if (metrics.includes("ym:s:goal")) {
          goalStatCalls += 1;
          if (goalStatCalls === 1) {
            return jsonResponse({
              error: "rate_limit",
              authorization: "OAuth AQAAA-token-must-not-leak"
            }, { status: 429 });
          }
        }

        return statRowsResponse(url);
      }
    }),
    date1: "2026-05-16",
    date2: "2026-05-17"
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "partial");
  assert.equal(result.unavailable_goals.length, 1);
  assert.equal(result.rows_prepared, 26);
  assert.doesNotMatch(serialized, /token-must-not-leak/);
});

test("all stat API failures produce failed safe result without token leaks", async () => {
  const result = await runMetricaR2a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      statHandler: async () => jsonResponse({
        error: "quota",
        authorization: "OAuth AQAAA-token-must-not-leak",
        client_secret: "client-secret-must-not-leak"
      }, { status: 429 })
    }),
    date1: "2026-05-16",
    date2: "2026-05-17"
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "failed");
  assert.equal(result.rows_prepared, 0);
  assert.doesNotMatch(serialized, /token-must-not-leak/);
  assert.doesNotMatch(serialized, /client-secret-must-not-leak/);
});

test("R2A migration defines aggregate table and excludes raw/user-level fields", () => {
  const migration = fs.readFileSync("db/migrations/010_external_metrica_daily_aggregate.sql", "utf8");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS external_metrica_daily_aggregate/);
  assert.match(migration, /external_metrica_daily_aggregate_dedupe/);
  assert.match(migration, /source_system,\s*\n\s*date,\s*\n\s*report_type,\s*\n\s*dimension_hash,\s*\n\s*metric_key,\s*\n\s*goal_id/s);
  assert.doesNotMatch(migration, /\b(session_id|anonymous_visitor_id|ip_address|user_agent|form_values|authorization|access_token)\b/i);
});

test("R2A importer does not write Metrica aggregates into internal analytics events and R4-lite keeps them diagnostic", () => {
  const importer = fs.readFileSync("scripts/yandex/metrica-import-lib.mjs", "utf8");
  const readModel = fs.readFileSync("lib/analytics/read-model.js", "utf8");

  assert.doesNotMatch(importer, /analytics_event\b/);
  assert.doesNotMatch(importer, /telemetry_events\b/);
  assert.match(readModel, /external_source_readiness/);
  assert.match(readModel, /external_metrica_not_operational_truth/);
  assert.doesNotMatch(readModel, /Metrica.*source of truth/i);
});
