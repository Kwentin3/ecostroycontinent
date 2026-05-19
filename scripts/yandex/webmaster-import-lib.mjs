import { createHash, randomUUID } from "node:crypto";

import { ENTITY_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import {
  findPublishedBySlug,
  findPublishedPageByPageType
} from "../../lib/content-core/repository.js";
import { resolveRouteEntity } from "../../lib/analytics/route-resolver.js";
import {
  normalizeApiError,
  redactSensitive,
  yandexJsonRequest
} from "./bootstrap-lib.mjs";

export const R3A_SOURCE_SYSTEM = "yandex_webmaster";
export const R3A_DEFAULT_LIMIT = 10;
export const R3A_DEFAULT_QUERY_DAYS = 14;
export const R3A_TIMEZONE_OFFSET = "+03:00";
export const R3A_DEFAULT_PUBLIC_SITE_URL = "https://ecostroycontinent.ru";

const WEBMASTER_API_BASE = "https://api.webmaster.yandex.net/v4";
const TRACKING_PARAM_PATTERN = /^(utm_|yclid$|ymclid$|gclid$|fbclid$|_openstat$|from$)/i;
const RECOVERABLE_IMPORT_STATUSES = new Set(["ok", "partial"]);
const OPTIONAL_ENDPOINTS = new Set([
  "site_summary",
  "indexing_samples",
  "in_search_samples",
  "query_analytics"
]);

function compactString(value, maxLength = 500) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hashValue(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stableId(prefix, parts) {
  return `${prefix}_${hashValue(parts).slice(0, 32)}`;
}

function moscowDateText(date) {
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function addUtcDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function assertDateText(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    throw new Error(`${name} must use YYYY-MM-DD format.`);
  }
}

export function resolveR3aPeriods({
  now = new Date(),
  date1 = "",
  date2 = "",
  observedDate = "",
  days = R3A_DEFAULT_QUERY_DAYS
} = {}) {
  const todayMoscow = moscowDateText(now);
  const resolvedObservedDate = observedDate || todayMoscow;
  assertDateText(resolvedObservedDate, "observedDate");

  if (date1 || date2) {
    assertDateText(date1, "date1");
    assertDateText(date2, "date2");
    if (date1 > date2) {
      throw new Error("date1 must be earlier than or equal to date2.");
    }

    return {
      observedDate: resolvedObservedDate,
      queryDate1: date1,
      queryDate2: date2,
      timezone: R3A_TIMEZONE_OFFSET
    };
  }

  const completedEnd = addUtcDays(todayMoscow, -1);
  const completedStart = addUtcDays(completedEnd, -Math.max(1, Number(days) || R3A_DEFAULT_QUERY_DAYS) + 1);

  return {
    observedDate: resolvedObservedDate,
    queryDate1: completedStart,
    queryDate2: completedEnd,
    timezone: R3A_TIMEZONE_OFFSET
  };
}

function validateR3aEnv(env) {
  const token = String(env.YANDEX_WEBMASTER_OAUTH_TOKEN || "").trim();
  const hostId = String(env.YANDEX_WEBMASTER_HOST_ID || "").trim();
  const missing = [];

  if (!isPresent(token)) {
    missing.push("YANDEX_WEBMASTER_OAUTH_TOKEN");
  }

  if (!isPresent(hostId)) {
    missing.push("YANDEX_WEBMASTER_HOST_ID");
  }

  return {
    ok: missing.length === 0,
    token,
    hostId,
    publicSiteUrl: String(env.PUBLIC_SITE_URL || env.APP_BASE_URL || R3A_DEFAULT_PUBLIC_SITE_URL).trim(),
    missing
  };
}

function safeApiError(error, category) {
  const normalized = normalizeApiError(error);
  return {
    error_category: category,
    http_status: normalized.http_status ?? null,
    safe_error_message: redactSensitive(normalized.safe_error_message || "Yandex Webmaster API request failed."),
    safe_body: redactSensitive(normalized.safe_body ?? null)
  };
}

function endpointSummary(endpoint) {
  return {
    endpoint: endpoint.endpoint,
    required: endpoint.required,
    status: endpoint.status,
    rows: endpoint.rows ?? 0,
    count: endpoint.count ?? null,
    safe_error_message: endpoint.error?.safe_error_message ?? ""
  };
}

async function webmasterRequest(path, { token, fetchImpl, method = "GET", body } = {}) {
  return yandexJsonRequest(`${WEBMASTER_API_BASE}${path}`, {
    method,
    token,
    body,
    fetchImpl
  });
}

async function fetchOptionalEndpoint({ endpoint, required = false, run }) {
  try {
    const data = await run();
    const rows = Array.isArray(data?.samples)
      ? data.samples.length
      : Array.isArray(data?.text_indicator_to_statistics)
        ? data.text_indicator_to_statistics.length
        : data && typeof data === "object"
          ? 1
          : 0;

    return {
      endpoint,
      required,
      status: "ok",
      data,
      rows,
      count: Number.isFinite(Number(data?.count)) ? Number(data.count) : null
    };
  } catch (error) {
    const safe = safeApiError(error, `${endpoint}_failed`);
    return {
      endpoint,
      required,
      status: required ? "failed" : "unavailable",
      data: null,
      rows: 0,
      count: null,
      error: safe
    };
  }
}

function buildQueryAnalyticsBody({ date1, date2, limit }) {
  return {
    offset: 0,
    limit,
    device_type_indicator: "ALL",
    search_location: "WEB_LOCATION",
    text_indicator: "URL",
    statistic_filters: [
      {
        statistic_field: "IMPRESSIONS",
        operation: "GREATER_EQUAL",
        value: "0",
        from: date1,
        to: date2
      }
    ],
    sort_by_date: {
      date: date2,
      statistic_field: "IMPRESSIONS",
      by: "DESC"
    }
  };
}

async function fetchR3aEndpoints({
  env,
  fetchImpl,
  periods,
  limit
}) {
  const validation = validateR3aEnv(env);
  const { token, hostId } = validation;
  const userData = await webmasterRequest("/user", { token, fetchImpl });
  const userId = userData.user_id;

  if (!userId) {
    throw new Error("Yandex Webmaster API did not return user_id.");
  }

  const encodedUser = encodeURIComponent(userId);
  const encodedHost = encodeURIComponent(hostId);
  const hostInfo = await webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}`, { token, fetchImpl });
  const verification = await webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}/verification`, { token, fetchImpl });

  const endpoints = [
    {
      endpoint: "host_info",
      required: true,
      status: "ok",
      data: hostInfo,
      rows: 1,
      count: 1
    },
    {
      endpoint: "verification",
      required: true,
      status: "ok",
      data: verification,
      rows: 1,
      count: 1
    },
    await fetchOptionalEndpoint({
      endpoint: "site_summary",
      run: () => webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}/summary`, { token, fetchImpl })
    }),
    await fetchOptionalEndpoint({
      endpoint: "indexing_samples",
      run: () => webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}/indexing/samples?offset=0&limit=${limit}`, { token, fetchImpl })
    }),
    await fetchOptionalEndpoint({
      endpoint: "in_search_samples",
      run: () => webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}/search-urls/in-search/samples?offset=0&limit=${limit}`, { token, fetchImpl })
    }),
    await fetchOptionalEndpoint({
      endpoint: "query_analytics",
      run: () => webmasterRequest(`/user/${encodedUser}/hosts/${encodedHost}/query-analytics/list`, {
        method: "POST",
        token,
        fetchImpl,
        body: buildQueryAnalyticsBody({
          date1: periods.queryDate1,
          date2: periods.queryDate2,
          limit
        })
      })
    })
  ];

  return {
    validation,
    userId,
    endpoints,
    hostInfo,
    verification
  };
}

function safeMetadata(value) {
  return redactSensitive(value ?? {});
}

function hostIsVerified(hostInfo, verification) {
  return hostInfo?.verified === true && verification?.verification_state === "VERIFIED";
}

function normalizeWebmasterUrl(rawUrl, { publicSiteUrl = R3A_DEFAULT_PUBLIC_SITE_URL } = {}) {
  const canonical = new URL(publicSiteUrl || R3A_DEFAULT_PUBLIC_SITE_URL);
  const parsed = new URL(rawUrl, canonical.origin);
  const strippedParams = [];

  for (const key of Array.from(parsed.searchParams.keys())) {
    if (TRACKING_PARAM_PATTERN.test(key)) {
      strippedParams.push(key);
      parsed.searchParams.delete(key);
    }
  }

  let path = parsed.pathname || "/";
  try {
    path = decodeURI(path);
  } catch {
    path = parsed.pathname || "/";
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }

  return {
    normalized_url: `${canonical.protocol}//${canonical.host}${path}`,
    page_path: path,
    original_host: parsed.host,
    stripped_tracking_params: strippedParams.sort()
  };
}

function numericMetric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function integerMetric(value) {
  return Math.max(0, Math.round(numericMetric(value)));
}

function normalizeYandexDateTime(value) {
  const raw = compactString(value, 80);
  if (!raw) {
    return null;
  }

  return raw.replace(",", ".");
}

function safeQueryText(value) {
  const text = compactString(value, 240);
  if (!text) {
    return "";
  }

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) || /(?:\+?\d[\s().-]?){8,}/.test(text)) {
    return "[redacted_sensitive_query]";
  }

  return text;
}

function summarizeSiteProblems(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).map(([key, metric]) => [key, integerMetric(metric)]))
    : {};
}

function makeHostSnapshot({ hostInfo, verification, observedDate, importRunId }) {
  return {
    id: stableId("webmaster_host", [hostInfo.host_id, observedDate]),
    source_system: R3A_SOURCE_SYSTEM,
    host_id: hostInfo.host_id,
    ascii_host_url: compactString(hostInfo.ascii_host_url),
    unicode_host_url: compactString(hostInfo.unicode_host_url),
    verified: hostInfo.verified === true,
    verification_state: compactString(verification?.verification_state),
    verification_type: compactString(verification?.verification_type),
    host_data_status: compactString(hostInfo.host_data_status),
    host_display_name: compactString(hostInfo.host_display_name),
    observed_date: observedDate,
    import_run_id: importRunId,
    metadata: safeMetadata({
      main_mirror_host_id: hostInfo.main_mirror?.host_id ?? "",
      latest_verification_time: verification?.latest_verification_time ?? "",
      applicable_verifiers: verification?.applicable_verifiers ?? []
    })
  };
}

function makeIndexationSnapshot({ hostId, summary, observedDate, importRunId }) {
  return {
    id: stableId("webmaster_indexation", [hostId, observedDate, "site_summary"]),
    source_system: R3A_SOURCE_SYSTEM,
    host_id: hostId,
    observed_date: observedDate,
    summary_type: "site_summary",
    metrics: safeMetadata({
      sqi: integerMetric(summary?.sqi),
      excluded_pages_count: integerMetric(summary?.excluded_pages_count),
      searchable_pages_count: integerMetric(summary?.searchable_pages_count),
      site_problems: summarizeSiteProblems(summary?.site_problems)
    }),
    import_run_id: importRunId,
    metadata: {
      endpoint: "site_summary"
    }
  };
}

function makeUrlSample({
  hostId,
  endpoint,
  sample,
  observedDate,
  importRunId,
  publicSiteUrl
}) {
  const normalized = normalizeWebmasterUrl(sample?.url || "", { publicSiteUrl });
  return {
    id: stableId("webmaster_url", [hostId, endpoint, normalized.normalized_url, observedDate]),
    source_system: R3A_SOURCE_SYSTEM,
    host_id: hostId,
    endpoint,
    normalized_url: normalized.normalized_url,
    page_path: normalized.page_path,
    entity_type: null,
    entity_id: null,
    resolution_status: "unresolved",
    observed_date: observedDate,
    sample_status: compactString(sample?.status),
    http_code: Number.isFinite(Number(sample?.http_code)) ? Number(sample.http_code) : null,
    title: compactString(sample?.title, 500),
    last_access_at: normalizeYandexDateTime(sample?.last_access || sample?.access_date),
    import_run_id: importRunId,
    metadata: safeMetadata({
      endpoint,
      original_host: normalized.original_host,
      stripped_tracking_params: normalized.stripped_tracking_params
    })
  };
}

function statisticsByDate(statistics = []) {
  const byDate = new Map();
  for (const stat of Array.isArray(statistics) ? statistics : []) {
    const date = compactString(stat?.date, 10);
    const field = compactString(stat?.field, 40).toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !field) {
      continue;
    }

    const bucket = byDate.get(date) ?? {};
    bucket[field] = numericMetric(stat?.value);
    byDate.set(date, bucket);
  }

  return byDate;
}

function makeQueryRows({
  hostId,
  queryAnalytics,
  importRunId,
  publicSiteUrl
}) {
  const rows = [];
  for (const item of Array.isArray(queryAnalytics?.text_indicator_to_statistics) ? queryAnalytics.text_indicator_to_statistics : []) {
    const textIndicator = item?.text_indicator ?? {};
    const complementary = item?.popular_complementary_indicator ?? {};
    const urlValue = textIndicator.type === "URL"
      ? textIndicator.value
      : complementary.type === "URL"
        ? complementary.value
        : "";

    if (!urlValue) {
      continue;
    }

    const normalized = normalizeWebmasterUrl(urlValue, { publicSiteUrl });
    const query = safeQueryText(
      textIndicator.type === "QUERY"
        ? textIndicator.value
        : complementary.type === "QUERY"
          ? complementary.value
          : ""
    );

    for (const [date, metrics] of statisticsByDate(item.statistics)) {
      const impressions = integerMetric(metrics.IMPRESSIONS);
      const clicks = integerMetric(metrics.CLICKS);
      const ctr = impressions > 0 ? Number((clicks / impressions).toFixed(6)) : 0;
      const position = Number.isFinite(metrics.POSITION) ? Number(metrics.POSITION.toFixed(2)) : null;
      const key = [hostId, date, query, normalized.normalized_url, "all", "", ""];

      rows.push({
        id: stableId("webmaster_query", key),
        source_system: R3A_SOURCE_SYSTEM,
        host_id: hostId,
        date,
        search_engine: "yandex",
        query,
        normalized_url: normalized.normalized_url,
        page_path: normalized.page_path,
        entity_type: null,
        entity_id: null,
        device: "all",
        country: "",
        region: "",
        impressions,
        clicks,
        ctr,
        average_position: position,
        import_run_id: importRunId,
        metadata: safeMetadata({
          endpoint: "query_analytics",
          original_host: normalized.original_host,
          stripped_tracking_params: normalized.stripped_tracking_params,
          text_indicator_type: textIndicator.type ?? "",
          complementary_indicator_type: complementary.type ?? ""
        })
      });
    }
  }

  return rows;
}

function normalizeR3aRecords({
  fetched,
  periods,
  importRunId
}) {
  const publicSiteUrl = fetched.validation.publicSiteUrl;
  const hostId = fetched.validation.hostId;
  const summaryEndpoint = fetched.endpoints.find((endpoint) => endpoint.endpoint === "site_summary");
  const indexingEndpoint = fetched.endpoints.find((endpoint) => endpoint.endpoint === "indexing_samples");
  const inSearchEndpoint = fetched.endpoints.find((endpoint) => endpoint.endpoint === "in_search_samples");
  const queryEndpoint = fetched.endpoints.find((endpoint) => endpoint.endpoint === "query_analytics");
  const records = {
    hostSnapshots: [],
    indexationSnapshots: [],
    urlSamples: [],
    queryRows: []
  };

  records.hostSnapshots.push(makeHostSnapshot({
    hostInfo: fetched.hostInfo,
    verification: fetched.verification,
    observedDate: periods.observedDate,
    importRunId
  }));

  if (summaryEndpoint?.status === "ok") {
    records.indexationSnapshots.push(makeIndexationSnapshot({
      hostId,
      summary: summaryEndpoint.data,
      observedDate: periods.observedDate,
      importRunId
    }));
  }

  if (indexingEndpoint?.status === "ok") {
    for (const sample of Array.isArray(indexingEndpoint.data?.samples) ? indexingEndpoint.data.samples : []) {
      records.urlSamples.push(makeUrlSample({
        hostId,
        endpoint: "indexing_samples",
        sample,
        observedDate: periods.observedDate,
        importRunId,
        publicSiteUrl
      }));
    }
  }

  if (inSearchEndpoint?.status === "ok") {
    for (const sample of Array.isArray(inSearchEndpoint.data?.samples) ? inSearchEndpoint.data.samples : []) {
      records.urlSamples.push(makeUrlSample({
        hostId,
        endpoint: "in_search_samples",
        sample,
        observedDate: periods.observedDate,
        importRunId,
        publicSiteUrl
      }));
    }
  }

  if (queryEndpoint?.status === "ok") {
    records.queryRows.push(...makeQueryRows({
      hostId,
      queryAnalytics: queryEndpoint.data,
      importRunId,
      publicSiteUrl
    }));
  }

  return records;
}

function countRecords(records) {
  return records.hostSnapshots.length
    + records.indexationSnapshots.length
    + records.urlSamples.length
    + records.queryRows.length;
}

function endpointFailures(endpoints) {
  return endpoints.filter((endpoint) => ["failed", "unavailable"].includes(endpoint.status));
}

function combinedStatus({ fetched, records }) {
  if (!hostIsVerified(fetched.hostInfo, fetched.verification)) {
    return "failed";
  }

  const failures = endpointFailures(fetched.endpoints);
  const requiredFailure = failures.some((endpoint) => endpoint.required);
  if (requiredFailure) {
    return "failed";
  }

  if (countRecords(records) === 0) {
    return "failed";
  }

  if (failures.length > 0) {
    return "partial";
  }

  return "ok";
}

function errorsFromEndpoints(endpoints) {
  return endpoints
    .filter((endpoint) => endpoint.error)
    .map((endpoint) => ({
      endpoint: endpoint.endpoint,
      ...endpoint.error
    }));
}

function buildSummary({
  mode,
  status,
  hostId,
  periods,
  importRunId,
  endpoints = [],
  records = null,
  errors = [],
  unmappedUrlCount = 0
}) {
  const safeErrors = errors.map((error) => redactSensitive(error));
  const safeErrorMessage = safeErrors
    .map((error) => error.safe_error_message || error.error_category || "")
    .filter(Boolean)
    .join("; ");

  return redactSensitive({
    status,
    dry_run: mode !== "write",
    source_system: R3A_SOURCE_SYSTEM,
    host_id: hostId || "",
    observed_date: periods.observedDate,
    query_period_start: periods.queryDate1,
    query_period_end: periods.queryDate2,
    import_run_id: importRunId,
    selected_endpoints: endpoints.map(endpointSummary),
    endpoint_availability: Object.fromEntries(endpoints.map((endpoint) => [endpoint.endpoint, endpoint.status])),
    rows_prepared: records ? countRecords(records) : 0,
    rows_imported: mode === "write" && records ? countRecords(records) : 0,
    record_counts: records ? {
      host_snapshots: records.hostSnapshots.length,
      indexation_snapshots: records.indexationSnapshots.length,
      url_samples: records.urlSamples.length,
      query_visibility_rows: records.queryRows.length
    } : {
      host_snapshots: 0,
      indexation_snapshots: 0,
      url_samples: 0,
      query_visibility_rows: 0
    },
    unmapped_url_count: unmappedUrlCount,
    safe_error_message: safeErrorMessage,
    errors: safeErrors
  });
}

function syncStateFromSummary({ status, periods, rowsImported, safeErrorMessage, unmappedUrlCount }) {
  return {
    status,
    imported_period_start: periods.queryDate1,
    imported_period_end: periods.queryDate2,
    safe_error_message: safeErrorMessage || "",
    rows_imported: rowsImported,
    unmapped_url_count: unmappedUrlCount
  };
}

async function resolveRouteEntityWithDb(db, pagePath) {
  return resolveRouteEntity(pagePath, {
    getPublishedServiceBySlug: async (slug) => {
      const record = await findPublishedBySlug(ENTITY_TYPES.SERVICE, slug, db);
      return record ? { entityId: record.entityId, revisionId: record.revision?.id || null } : null;
    },
    getPublishedCaseBySlug: async (slug) => {
      const record = await findPublishedBySlug(ENTITY_TYPES.CASE, slug, db);
      return record ? { entityId: record.entityId, revisionId: record.revision?.id || null } : null;
    },
    getPublishedHomePage: async () => {
      const record = await findPublishedPageByPageType(PAGE_TYPES.HOME, db);
      return record ? { entityId: record.entityId, revisionId: record.revision?.id || null } : null;
    },
    getPublishedAboutPage: async () => {
      const record = await findPublishedPageByPageType(PAGE_TYPES.ABOUT, db);
      return record ? { entityId: record.entityId, revisionId: record.revision?.id || null } : null;
    },
    getPublishedContactsPage: async () => {
      const record = await findPublishedPageByPageType(PAGE_TYPES.CONTACTS, db);
      return record ? { entityId: record.entityId, revisionId: record.revision?.id || null } : null;
    }
  });
}

async function resolveUrlRecords(db, records) {
  const unmapped = [];
  const all = [...records.urlSamples, ...records.queryRows];
  for (const record of all) {
    const resolution = await resolveRouteEntityWithDb(db, record.page_path);
    record.page_path = resolution.page_path;
    record.entity_type = resolution.entity_type;
    record.entity_id = resolution.entity_id;
    record.resolution_status = resolution.resolution_status;

    if (resolution.resolution_status === "unmapped") {
      unmapped.push({
        page_path: resolution.page_path,
        normalized_url: record.normalized_url,
        endpoint: record.endpoint || record.metadata?.endpoint || "query_analytics",
        reason: `webmaster_${record.endpoint || record.metadata?.endpoint || "query_analytics"}_unmapped`
      });
    }
  }

  return unmapped;
}

async function persistHostSnapshot(db, record) {
  await db.query(`
    INSERT INTO external_webmaster_host_snapshot (
      id,
      source_system,
      host_id,
      ascii_host_url,
      unicode_host_url,
      verified,
      verification_state,
      verification_type,
      host_data_status,
      host_display_name,
      observed_date,
      import_run_id,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
    )
    ON CONFLICT (source_system, host_id, observed_date) DO UPDATE SET
      ascii_host_url = EXCLUDED.ascii_host_url,
      unicode_host_url = EXCLUDED.unicode_host_url,
      verified = EXCLUDED.verified,
      verification_state = EXCLUDED.verification_state,
      verification_type = EXCLUDED.verification_type,
      host_data_status = EXCLUDED.host_data_status,
      host_display_name = EXCLUDED.host_display_name,
      imported_at = NOW(),
      import_run_id = EXCLUDED.import_run_id,
      metadata = EXCLUDED.metadata
  `, [
    record.id,
    record.source_system,
    record.host_id,
    record.ascii_host_url,
    record.unicode_host_url,
    record.verified,
    record.verification_state,
    record.verification_type,
    record.host_data_status,
    record.host_display_name,
    record.observed_date,
    record.import_run_id,
    JSON.stringify(record.metadata)
  ]);
}

async function persistIndexationSnapshot(db, record) {
  await db.query(`
    INSERT INTO external_webmaster_indexation_snapshot (
      id,
      source_system,
      host_id,
      observed_date,
      summary_type,
      metrics,
      import_run_id,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb
    )
    ON CONFLICT (source_system, host_id, observed_date, summary_type) DO UPDATE SET
      metrics = EXCLUDED.metrics,
      imported_at = NOW(),
      import_run_id = EXCLUDED.import_run_id,
      metadata = EXCLUDED.metadata
  `, [
    record.id,
    record.source_system,
    record.host_id,
    record.observed_date,
    record.summary_type,
    JSON.stringify(record.metrics),
    record.import_run_id,
    JSON.stringify(record.metadata)
  ]);
}

async function persistUrlSample(db, record) {
  await db.query(`
    INSERT INTO external_webmaster_url_sample (
      id,
      source_system,
      host_id,
      endpoint,
      normalized_url,
      page_path,
      entity_type,
      entity_id,
      resolution_status,
      observed_date,
      sample_status,
      http_code,
      title,
      last_access_at,
      import_run_id,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::timestamptz, $15, $16::jsonb
    )
    ON CONFLICT (source_system, host_id, endpoint, normalized_url, observed_date) DO UPDATE SET
      page_path = EXCLUDED.page_path,
      entity_type = EXCLUDED.entity_type,
      entity_id = EXCLUDED.entity_id,
      resolution_status = EXCLUDED.resolution_status,
      sample_status = EXCLUDED.sample_status,
      http_code = EXCLUDED.http_code,
      title = EXCLUDED.title,
      last_access_at = EXCLUDED.last_access_at,
      imported_at = NOW(),
      import_run_id = EXCLUDED.import_run_id,
      metadata = EXCLUDED.metadata
  `, [
    record.id,
    record.source_system,
    record.host_id,
    record.endpoint,
    record.normalized_url,
    record.page_path,
    record.entity_type,
    record.entity_id,
    record.resolution_status,
    record.observed_date,
    record.sample_status,
    record.http_code,
    record.title,
    record.last_access_at,
    record.import_run_id,
    JSON.stringify(record.metadata)
  ]);
}

async function persistQueryRow(db, record) {
  await db.query(`
    INSERT INTO external_webmaster_query_visibility_daily (
      id,
      source_system,
      host_id,
      date,
      search_engine,
      query,
      normalized_url,
      page_path,
      entity_type,
      entity_id,
      device,
      country,
      region,
      impressions,
      clicks,
      ctr,
      average_position,
      import_run_id,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb
    )
    ON CONFLICT (source_system, host_id, date, query, normalized_url, device, country, region) DO UPDATE SET
      page_path = EXCLUDED.page_path,
      entity_type = EXCLUDED.entity_type,
      entity_id = EXCLUDED.entity_id,
      impressions = EXCLUDED.impressions,
      clicks = EXCLUDED.clicks,
      ctr = EXCLUDED.ctr,
      average_position = EXCLUDED.average_position,
      imported_at = NOW(),
      import_run_id = EXCLUDED.import_run_id,
      metadata = EXCLUDED.metadata
  `, [
    record.id,
    record.source_system,
    record.host_id,
    record.date,
    record.search_engine,
    record.query,
    record.normalized_url,
    record.page_path,
    record.entity_type,
    record.entity_id,
    record.device,
    record.country,
    record.region,
    record.impressions,
    record.clicks,
    record.ctr,
    record.average_position,
    record.import_run_id,
    JSON.stringify(record.metadata)
  ]);
}

async function persistUnmappedDiagnostic(db, diagnostic) {
  await db.query(`
    INSERT INTO analytics_unmapped_url_diagnostic (
      id,
      page_path,
      source_system,
      sample_referrer,
      safe_reason,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6::jsonb
    )
    ON CONFLICT (page_path, source_system)
    WHERE status = 'open'
    DO UPDATE SET
      last_seen_at = NOW(),
      hit_count = analytics_unmapped_url_diagnostic.hit_count + 1,
      sample_referrer = EXCLUDED.sample_referrer,
      safe_reason = EXCLUDED.safe_reason,
      metadata = analytics_unmapped_url_diagnostic.metadata || EXCLUDED.metadata
  `, [
    stableId("unmapped_url", [R3A_SOURCE_SYSTEM, diagnostic.page_path]),
    diagnostic.page_path,
    R3A_SOURCE_SYSTEM,
    diagnostic.normalized_url,
    diagnostic.reason,
    JSON.stringify(safeMetadata({
      endpoint: diagnostic.endpoint,
      normalized_url: diagnostic.normalized_url
    }))
  ]);
}

async function persistSyncState(db, syncState) {
  await db.query(`
    INSERT INTO analytics_source_sync_state (
      source_system,
      status,
      last_successful_at,
      last_attempted_at,
      imported_period_start,
      imported_period_end,
      safe_error_message,
      unmapped_url_count,
      rows_imported,
      updated_at
    ) VALUES (
      $1,
      $2,
      CASE WHEN $2 = ANY($7::text[]) THEN NOW() ELSE NULL END,
      NOW(),
      $3,
      $4,
      $5,
      $6,
      $8,
      NOW()
    )
    ON CONFLICT (source_system) DO UPDATE SET
      status = EXCLUDED.status,
      last_attempted_at = EXCLUDED.last_attempted_at,
      last_successful_at = CASE
        WHEN EXCLUDED.status = ANY($7::text[]) THEN EXCLUDED.last_successful_at
        ELSE analytics_source_sync_state.last_successful_at
      END,
      imported_period_start = EXCLUDED.imported_period_start,
      imported_period_end = EXCLUDED.imported_period_end,
      safe_error_message = EXCLUDED.safe_error_message,
      unmapped_url_count = EXCLUDED.unmapped_url_count,
      rows_imported = EXCLUDED.rows_imported,
      updated_at = EXCLUDED.updated_at
  `, [
    R3A_SOURCE_SYSTEM,
    syncState.status,
    syncState.imported_period_start,
    syncState.imported_period_end,
    syncState.safe_error_message,
    syncState.unmapped_url_count,
    Array.from(RECOVERABLE_IMPORT_STATUSES),
    syncState.rows_imported
  ]);
}

async function persistR3aImport({ db, records, syncState }) {
  // Server-side only: Webmaster data is external search/indexation enrichment.
  // It must not mutate Content Core and must not be used for user/session attribution.
  const unmapped = await resolveUrlRecords(db, records);

  for (const record of records.hostSnapshots) {
    await persistHostSnapshot(db, record);
  }
  for (const record of records.indexationSnapshots) {
    await persistIndexationSnapshot(db, record);
  }
  for (const record of records.urlSamples) {
    await persistUrlSample(db, record);
  }
  for (const record of records.queryRows) {
    await persistQueryRow(db, record);
  }
  for (const diagnostic of unmapped) {
    await persistUnmappedDiagnostic(db, diagnostic);
  }

  syncState.unmapped_url_count = unmapped.length;
  await persistSyncState(db, syncState);

  return { unmappedUrlCount: unmapped.length };
}

async function persistSyncStateOnly({ withTransactionFn, syncState }) {
  if (typeof withTransactionFn !== "function") {
    throw new Error("withTransactionFn is required for write mode.");
  }

  await withTransactionFn(async (db) => persistSyncState(db, syncState));
}

export async function runWebmasterR3a({
  mode = "dry-run",
  env = process.env,
  fetchImpl = globalThis.fetch,
  withTransactionFn = null,
  now = new Date(),
  date1 = "",
  date2 = "",
  observedDate = "",
  days = R3A_DEFAULT_QUERY_DAYS,
  limit = R3A_DEFAULT_LIMIT
} = {}) {
  const normalizedMode = mode === "write" ? "write" : "dry-run";
  const periods = resolveR3aPeriods({ now, date1, date2, observedDate, days });
  const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || R3A_DEFAULT_LIMIT));
  const importRunId = `r3a_${new Date(now).toISOString().replace(/[:.]/g, "-")}_${randomUUID()}`;
  const validation = validateR3aEnv(env);

  if (!validation.ok) {
    const safeErrorMessage = `Missing required Webmaster env: ${validation.missing.join(", ")}.`;
    const summary = buildSummary({
      mode: normalizedMode,
      status: "not_configured",
      hostId: validation.hostId,
      periods,
      importRunId,
      errors: [{ error_category: "not_configured", safe_error_message: safeErrorMessage }]
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "not_configured",
          periods,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          unmappedUrlCount: 0
        })
      });
    }

    return summary;
  }

  try {
    const fetched = await fetchR3aEndpoints({
      env,
      fetchImpl,
      periods,
      limit: normalizedLimit
    });
    const records = normalizeR3aRecords({
      fetched,
      periods,
      importRunId
    });
    const status = combinedStatus({ fetched, records });
    const endpointErrors = errorsFromEndpoints(fetched.endpoints);
    let unmappedUrlCount = 0;
    const summaryBeforeWrite = buildSummary({
      mode: normalizedMode,
      status,
      hostId: validation.hostId,
      periods,
      importRunId,
      endpoints: fetched.endpoints,
      records,
      errors: endpointErrors,
      unmappedUrlCount
    });

    if (normalizedMode === "write") {
      if (typeof withTransactionFn !== "function") {
        throw new Error("withTransactionFn is required for write mode.");
      }

      await withTransactionFn(async (db) => {
        const persisted = await persistR3aImport({
          db,
          records,
          syncState: syncStateFromSummary({
            status,
            periods,
            rowsImported: countRecords(records),
            safeErrorMessage: summaryBeforeWrite.safe_error_message,
            unmappedUrlCount
          })
        });
        unmappedUrlCount = persisted.unmappedUrlCount;
      });
    }

    return buildSummary({
      mode: normalizedMode,
      status,
      hostId: validation.hostId,
      periods,
      importRunId,
      endpoints: fetched.endpoints,
      records,
      errors: endpointErrors,
      unmappedUrlCount
    });
  } catch (error) {
    const safeError = safeApiError(error, "import_failed");
    const summary = buildSummary({
      mode: normalizedMode,
      status: "failed",
      hostId: validation.hostId,
      periods,
      importRunId,
      errors: [safeError]
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "failed",
          periods,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          unmappedUrlCount: 0
        })
      });
    }

    return summary;
  }
}

export const __r3aTest = {
  normalizeWebmasterUrl,
  safeQueryText,
  buildQueryAnalyticsBody
};
