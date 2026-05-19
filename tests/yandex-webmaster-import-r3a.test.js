import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  R3A_SOURCE_SYSTEM,
  __r3aTest,
  resolveR3aPeriods,
  runWebmasterR3a
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
    latest_verification_time: "2026-05-04T12:00:00.000+0300",
    applicable_verifiers: ["HTML_FILE"],
    ...overrides
  };
}

function summary() {
  return {
    sqi: 1,
    excluded_pages_count: 2,
    searchable_pages_count: 7,
    site_problems: {
      FATAL: 0,
      CRITICAL: 0,
      POSSIBLE_PROBLEM: 1,
      RECOMMENDATION: 2
    }
  };
}

function indexingSamples() {
  return {
    count: 2,
    samples: [
      {
        status: "HTTP_2XX",
        http_code: 200,
        url: "https://ecostroycontinent.ru/services/fundament?utm_source=yandex&yclid=123",
        access_date: "2026-05-18T12:00:00.000+0300"
      },
      {
        status: "HTTP_2XX",
        http_code: 200,
        url: "https://ecostroycontinent.ru/ghost?utm_campaign=x",
        access_date: "2026-05-18T12:01:00.000+0300"
      }
    ]
  };
}

function inSearchSamples() {
  return {
    count: 1,
    samples: [
      {
        url: "https://ecostroycontinent.ru/about",
        last_access: "2026-05-18T13:00:00.000+0300",
        title: "О компании"
      }
    ]
  };
}

function queryAnalytics() {
  return {
    count: 1,
    text_indicator_to_statistics: [
      {
        text_indicator: {
          type: "URL",
          value: "https://ecostroycontinent.ru/services/fundament?utm_medium=cpc"
        },
        popular_complementary_indicator: {
          type: "QUERY",
          value: "ремонт фундамента"
        },
        statistics: [
          { date: "2026-05-18", field: "IMPRESSIONS", value: 10 },
          { date: "2026-05-18", field: "CLICKS", value: 2 },
          { date: "2026-05-18", field: "POSITION", value: 4.2 },
          { date: "2026-05-18", field: "CTR", value: 20 }
        ]
      }
    ]
  };
}

function makeFetch({
  host = hostInfo(),
  verify = verification(),
  failEndpoint = ""
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const textUrl = String(url);
    calls.push({ url: textUrl, options });

    if (failEndpoint && textUrl.includes(failEndpoint)) {
      return jsonResponse({
        error_code: "HOST_NOT_LOADED",
        error_message: "data unavailable",
        authorization: "OAuth AQAAA-token-must-not-leak"
      }, { status: 404 });
    }

    if (textUrl.endsWith("/v4/user")) {
      return jsonResponse({ user_id: 123456 });
    }

    if (textUrl.includes("/verification")) {
      return jsonResponse(verify);
    }

    if (textUrl.includes("/summary")) {
      return jsonResponse(summary());
    }

    if (textUrl.includes("/indexing/samples")) {
      return jsonResponse(indexingSamples());
    }

    if (textUrl.includes("/search-urls/in-search/samples")) {
      return jsonResponse(inSearchSamples());
    }

    if (textUrl.includes("/query-analytics/list")) {
      return jsonResponse(queryAnalytics());
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
  const hostRows = new Map();
  const summaryRows = new Map();
  const urlRows = new Map();
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
        const [pageType] = params;
        if (pageType === "about") {
          return { rows: [{ entity_id: "page_about", ...revisionRow("rev_page_about", "page_about", { pageType }) }] };
        }
        return { rows: [] };
      }

      if (sql.includes("external_webmaster_host_snapshot")) {
        hostRows.set([params[1], params[2], params[10]].join("|"), params);
        return { rowCount: 1, rows: [] };
      }

      if (sql.includes("external_webmaster_indexation_snapshot")) {
        summaryRows.set([params[1], params[2], params[3], params[4]].join("|"), params);
        return { rowCount: 1, rows: [] };
      }

      if (sql.includes("external_webmaster_url_sample")) {
        urlRows.set([params[1], params[2], params[3], params[4], params[9]].join("|"), params);
        return { rowCount: 1, rows: [] };
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
    hostRows,
    summaryRows,
    urlRows,
    queryRows,
    diagnostics,
    syncStates,
    queries,
    async withTransactionFn(run) {
      return run(db);
    }
  };
}

test("R3A periods default to last 14 completed Moscow dates and today's snapshot", () => {
  const periods = resolveR3aPeriods({
    now: new Date("2026-05-19T09:00:00.000Z")
  });

  assert.equal(periods.observedDate, "2026-05-19");
  assert.equal(periods.queryDate1, "2026-05-05");
  assert.equal(periods.queryDate2, "2026-05-18");
});

test("missing Webmaster env returns not_configured without fetch or DB writes", async () => {
  const db = makeMemoryDb();
  const result = await runWebmasterR3a({
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
  assert.equal(db.hostRows.size, 0);
  assert.equal(db.syncStates.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("dry-run checks selected endpoints and prepares rows without DB writes", async () => {
  const db = makeMemoryDb();
  const fetchImpl = makeFetch();
  const result = await runWebmasterR3a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl,
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-05",
    date2: "2026-05-18",
    observedDate: "2026-05-19"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.dry_run, true);
  assert.equal(result.record_counts.host_snapshots, 1);
  assert.equal(result.record_counts.indexation_snapshots, 1);
  assert.equal(result.record_counts.url_samples, 3);
  assert.equal(result.record_counts.query_visibility_rows, 1);
  assert.equal(result.rows_prepared, 6);
  assert.equal(result.rows_imported, 0);
  assert.equal(db.hostRows.size, 0);
  assert.equal(fetchImpl.calls.some((call) => call.url.includes("/query-analytics/list") && call.options.method === "POST"), true);
});

test("write import persists accepted rows, source state and unmapped diagnostics", async () => {
  const db = makeMemoryDb();
  const result = await runWebmasterR3a({
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-05",
    date2: "2026-05-18",
    observedDate: "2026-05-19"
  });

  assert.equal(result.status, "ok");
  assert.equal(result.rows_imported, 6);
  assert.equal(db.hostRows.size, 1);
  assert.equal(db.summaryRows.size, 1);
  assert.equal(db.urlRows.size, 3);
  assert.equal(db.queryRows.size, 1);
  assert.equal(db.diagnostics.size, 1);
  assert.equal(db.syncStates.at(-1).sourceSystem, R3A_SOURCE_SYSTEM);
  assert.equal(db.syncStates.at(-1).status, "ok");
  assert.equal(db.syncStates.at(-1).unmappedUrlCount, 1);

  const serviceUrlRow = Array.from(db.urlRows.values()).find((params) => params[5] === "/services/fundament");
  assert.equal(serviceUrlRow[6], "service");
  assert.equal(serviceUrlRow[7], "service_fundament");
  assert.equal(serviceUrlRow[8], "resolved");

  const queryRow = Array.from(db.queryRows.values())[0];
  assert.equal(queryRow[5], "ремонт фундамента");
  assert.equal(queryRow[7], "/services/fundament");
  assert.equal(queryRow[13], 10);
  assert.equal(queryRow[14], 2);
  assert.equal(queryRow[15], 0.2);
});

test("same snapshot rerun is idempotent by upsert keys", async () => {
  const db = makeMemoryDb();
  const common = {
    mode: "write",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch(),
    withTransactionFn: db.withTransactionFn,
    date1: "2026-05-05",
    date2: "2026-05-18",
    observedDate: "2026-05-19"
  };

  await runWebmasterR3a(common);
  const before = db.hostRows.size + db.summaryRows.size + db.urlRows.size + db.queryRows.size;
  await runWebmasterR3a({ ...common, fetchImpl: makeFetch() });
  const after = db.hostRows.size + db.summaryRows.size + db.urlRows.size + db.queryRows.size;

  assert.equal(before, 6);
  assert.equal(after, 6);
});

test("host not verified maps to safe failure", async () => {
  const result = await runWebmasterR3a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({
      host: hostInfo({ verified: false }),
      verify: verification({ verification_state: "NONE" })
    }),
    date1: "2026-05-05",
    date2: "2026-05-18",
    observedDate: "2026-05-19"
  });

  assert.equal(result.status, "failed");
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("optional endpoint unavailable marks partial without token leak", async () => {
  const result = await runWebmasterR3a({
    mode: "dry-run",
    env: COMPLETE_ENV,
    fetchImpl: makeFetch({ failEndpoint: "/summary" }),
    date1: "2026-05-05",
    date2: "2026-05-18",
    observedDate: "2026-05-19"
  });

  assert.equal(result.status, "partial");
  assert.equal(result.endpoint_availability.site_summary, "unavailable");
  assert.doesNotMatch(JSON.stringify(result), /token-must-not-leak/);
});

test("URL normalization strips tracking and keeps Content Core mutation out of scope", () => {
  const normalized = __r3aTest.normalizeWebmasterUrl("https://example.com/about/?utm_source=x&yclid=123#frag", {
    publicSiteUrl: "https://ecostroycontinent.ru"
  });

  assert.equal(normalized.normalized_url, "https://ecostroycontinent.ru/about");
  assert.equal(normalized.page_path, "/about");
  assert.deepEqual(normalized.stripped_tracking_params, ["utm_source", "yclid"]);
});

test("sensitive query text is redacted before storage", () => {
  assert.equal(__r3aTest.safeQueryText("call me +7 999 111 22 33"), "[redacted_sensitive_query]");
  assert.equal(__r3aTest.safeQueryText("user@example.com"), "[redacted_sensitive_query]");
});

test("R3A migration defines dedicated Webmaster tables and excludes raw/user-level fields", () => {
  const migration = fs.readFileSync("db/migrations/011_external_webmaster_import_foundation.sql", "utf8");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS external_webmaster_host_snapshot/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS external_webmaster_indexation_snapshot/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS external_webmaster_url_sample/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS external_webmaster_query_visibility_daily/);
  assert.match(migration, /external_webmaster_url_sample_dedupe/);
  assert.doesNotMatch(migration, /\b(session_id|lead_id|contact_journey_id|ip_address|user_agent|form_values|authorization|access_token|refresh_token)\b/i);
});

test("R3A importer does not wire Webmaster data into read model, UI, sessions or leads", () => {
  const importer = fs.readFileSync("scripts/yandex/webmaster-import-lib.mjs", "utf8");
  const readModel = fs.readFileSync("lib/analytics/read-model.js", "utf8");
  const visibilityPage = fs.readFileSync("components/admin/SeoVisibilityDashboard.js", "utf8");

  assert.doesNotMatch(readModel, /external_webmaster_(host_snapshot|indexation_snapshot|url_sample|query_visibility_daily)/);
  assert.doesNotMatch(visibilityPage, /external_webmaster_/);
  assert.doesNotMatch(importer, /\b(session_id|lead_id|contact_journey|qualified_lead)\b/);
  assert.doesNotMatch(importer, /UPDATE\s+content_entities|INSERT\s+INTO\s+content_entities/i);
});
