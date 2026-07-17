import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  R3A_SOURCE_SYSTEM,
  resolveR3bPeriods,
  runWebmasterR3b
} from "../scripts/yandex/webmaster-import-lib.mjs";

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

const COMPLETE_ENV = Object.freeze({
  YANDEX_WEBMASTER_HOST_ID: "https:ecostroycontinent.ru:443",
  YANDEX_WEBMASTER_OAUTH_TOKEN: "AQAAA-token-must-not-leak",
  PUBLIC_SITE_URL: "https://ecostroycontinent.ru"
});

function hostInfo(overrides = {}) {
  return {
    host_id: COMPLETE_ENV.YANDEX_WEBMASTER_HOST_ID,
    verified: true,
    ascii_host_url: "https://ecostroycontinent.ru/",
    unicode_host_url: "https://ecostroycontinent.ru/",
    host_data_status: "OK",
    host_display_name: "ecostroycontinent.ru",
    ...overrides
  };
}

function verification(overrides = {}) {
  return {
    verification_state: "VERIFIED",
    verification_type: "HTML_FILE",
    ...overrides
  };
}

function queryAnalyticsRows() {
  return {
    count: 2,
    text_indicator_to_statistics: [
      {
        text_indicator: {
          type: "URL",
          value: "https://ecostroycontinent.ru/services/fundament?utm_source=yandex&yclid=1"
        },
        popular_complementary_indicator: {
          type: "QUERY",
          value: "ремонт фундамента"
        },
        statistics: [
          { date: "2026-05-15", field: "IMPRESSIONS", value: 17 },
          { date: "2026-05-15", field: "CLICKS", value: 3 },
          { date: "2026-05-15", field: "POSITION", value: 5.42 }
        ]
      },
      {
        text_indicator: {
          type: "URL",
          value: "https://ecostroycontinent.ru/ghost?utm_medium=cpc"
        },
        popular_complementary_indicator: {
          type: "QUERY",
          value: "user@example.com"
        },
        statistics: [
          { date: "2026-05-15", field: "IMPRESSIONS", value: 4 },
          { date: "2026-05-15", field: "CLICKS", value: 0 },
          { date: "2026-05-15", field: "POSITION", value: 18.1 }
        ]
      }
    ]
  };
}

function makeFetch({
  host = hostInfo(),
  verify = verification(),
  queryBody = queryAnalyticsRows(),
  failQuery = false,
  betaAvailable = false
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const textUrl = String(url);
    calls.push({ url: textUrl, options });

    if (textUrl.endsWith("/v4/user")) {
      return jsonResponse({ user_id: 123456 });
    }

    if (textUrl.includes("/verification")) {
      return jsonResponse(verify);
    }

    if (textUrl.includes("/pro/limits")) {
      return betaAvailable
        ? jsonResponse({ basic_daily_limit: 100, remaining_daily_limit: 100 })
        : jsonResponse({ error_code: "NOT_FOUND", error_message: "beta unavailable" }, { status: 404 });
    }

    if (textUrl.includes("/pro/serp/dates")) {
      return betaAvailable
        ? jsonResponse({ dates: ["2026-05-15", "2026-05-16"] })
        : jsonResponse({ error_code: "NOT_FOUND", error_message: "beta unavailable" }, { status: 404 });
    }

    if (textUrl.includes("/pro/regions")) {
      return betaAvailable
        ? jsonResponse({ regions: [{ id: 213, name: "Москва" }] })
        : jsonResponse({ error_code: "NOT_FOUND", error_message: "beta unavailable" }, { status: 404 });
    }

    if (textUrl.includes("/query-analytics/list")) {
      if (failQuery) {
        return jsonResponse({
          error_code: "TOO_MANY_REQUESTS_ERROR",
          error_message: "quota exceeded",
          authorization: "OAuth AQAAA-token-must-not-leak"
        }, { status: 429 });
      }

      return jsonResponse(queryBody);
    }

    if (textUrl.includes("/hosts/")) {
      return jsonResponse(host);
    }

    throw new Error(`Unexpected Webmaster fetch URL: ${textUrl}`);
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
  const queryRows = new Map();
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

      if (sql.includes("external_webmaster_query_visibility_daily")) {
        queryRows.set([params[1], params[2], params[3], params[5], params[6], params[10], params[11], params[12]].join("|"), params);
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
          unmappedUrlCount: params[5],
          rowsImported: params[7]
        });
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    }
  };

  return {
    queryRows,
    diagnostics,
    syncStates,
    queries,
    async withTransactionFn(run) {
      return run(db);
    }
  };
}

test("R3B periods default to a conservative two-day freshness buffer", () => {
  const periods = resolveR3bPeriods({
    now: new Date("2026-05-19T09:00:00.000Z")
  });

  assert.equal(periods.queryDate1, "2026-05-04");
  assert.equal(periods.queryDate2, "2026-05-17");
});

test("R3B missing env returns not_configured without fetch or DB writes", async () => {
  const db = makeMemoryDb();
  const result = await runWebmasterR3b({
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
  assert.equal(db.queryRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("R3B dry-run checks beta capability and query analytics fallback without DB writes", async () => {
  const db = makeMemoryDb();
  const fetchImpl = makeFetch();
  const result = await runWebmasterR3b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl,
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-04",
    date2: "2026-05-17"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.endpoint_strategy, "query_analytics_sync_fallback");
  assert.equal(result.record_counts.query_visibility_rows, 2);
  assert.equal(result.rows_imported, 0);
  assert.equal(result.limitations.includes("webmaster_query_analytics_complementary_indicator_limited"), true);
  assert.equal(result.limitations.includes("webmaster_advanced_query_export_beta_not_used"), true);
  assert.equal(db.queryRows.size, 0);
  assert.equal(fetchImpl.calls.some((call) => call.url.includes("/pro/limits")), true);
  assert.equal(fetchImpl.calls.some((call) => call.url.includes("/query-analytics/list") && call.options.method === "POST"), true);
});

test("R3B write persists query/page rows, source state and unmapped diagnostics", async () => {
  const db = makeMemoryDb();
  const result = await runWebmasterR3b({
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-04",
    date2: "2026-05-17"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.rows_imported, 2);
  assert.equal(db.queryRows.size, 2);
  assert.equal(db.diagnostics.size, 1);
  assert.equal(db.syncStates.at(-1).sourceSystem, R3A_SOURCE_SYSTEM);
  assert.equal(db.syncStates.at(-1).status, "ok");
  assert.equal(db.syncStates.at(-1).rowsImported, 2);
  assert.equal(db.syncStates.at(-1).unmappedUrlCount, 1);

  const serviceRow = Array.from(db.queryRows.values()).find((params) => params[7] === "/services/fundament");
  assert.equal(serviceRow[5], "ремонт фундамента");
  assert.equal(serviceRow[8], "service");
  assert.equal(serviceRow[9], "service_fundament");
  assert.equal(serviceRow[13], 17);
  assert.equal(serviceRow[14], 3);
  assert.equal(serviceRow[15], Number((3 / 17).toFixed(6)));

  const sensitiveRow = Array.from(db.queryRows.values()).find((params) => params[7] === "/ghost");
  assert.equal(sensitiveRow[5], "[redacted_sensitive_query]");
  assert.doesNotMatch(JSON.stringify(sensitiveRow), /user@example\.com/);
});

test("R3B same period rerun is idempotent by query visibility upsert key", async () => {
  const db = makeMemoryDb();
  const common = {
    mode: "write",
    env: COMPLETE_ENV,
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-04",
    date2: "2026-05-17"
  };

  await runWebmasterR3b({ ...common, fetchImpl: makeFetch() });
  const before = db.queryRows.size;
  await runWebmasterR3b({ ...common, fetchImpl: makeFetch() });
  const after = db.queryRows.size;

  assert.equal(before, 2);
  assert.equal(after, 2);
});

test("R3B zero rows is a valid API result and does not fabricate visibility data", async () => {
  const db = makeMemoryDb();
  const result = await runWebmasterR3b({
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      queryBody: {
        count: 0,
        text_indicator_to_statistics: []
      }
    }),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-04",
    date2: "2026-05-17"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.rows_imported, 0);
  assert.equal(db.queryRows.size, 0);
  assert.equal(result.limitations.includes("webmaster_query_visibility_zero_rows_for_period"), true);
  assert.equal(db.syncStates.at(-1).status, "ok");
});

test("R3B invalid date range and API failures are safe and redacted", async () => {
  const invalidDate = await runWebmasterR3b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    date1: "2026-05-18",
    date2: "2026-05-04"
  });
  assert.equal(invalidDate.status, "failed");
  assert.match(invalidDate.safe_error_message, /date1 must be earlier/);

  const apiFailure = await runWebmasterR3b({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({ failQuery: true }),
    date1: "2026-05-04",
    date2: "2026-05-17"
  });
  assert.equal(apiFailure.status, "failed");
  assert.doesNotMatch(JSON.stringify(apiFailure), /token-must-not-leak|Authorization/i);
});

test("R3B importer stays server-side and does not add attribution/read-model/UI coupling", () => {
  const importer = fs.readFileSync("scripts/yandex/webmaster-import-lib.mjs", "utf8");
  const cli = fs.readFileSync("scripts/yandex/import-webmaster-query-visibility.mjs", "utf8");
  const visibilityPage = fs.readFileSync("components/admin/SeoVisibilityDashboard.js", "utf8");

  assert.doesNotMatch(importer, /JOIN\s+(telemetry_events|contact_journeys|leads|users|sessions)\b/i);
  assert.doesNotMatch(importer, /INSERT\s+INTO\s+(telemetry_events|contact_journeys|leads|users|sessions)\b/i);
  assert.doesNotMatch(importer, /UPDATE\s+content_entities|INSERT\s+INTO\s+content_entities/i);
  assert.doesNotMatch(visibilityPage, /api\.webmaster|webmaster\.yandex|Authorization|fetch\s*\(/i);
  assert.doesNotMatch(cli, /NEXT_PUBLIC|window|document/i);
});
