import { createHash, randomUUID } from "node:crypto";

import { resolveRouteEntity } from "../../lib/analytics/route-resolver.js";
import { ENTITY_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import {
  findPublishedBySlug,
  findPublishedPageByPageType
} from "../../lib/content-core/repository.js";
import {
  REQUIRED_METRICA_GOALS,
  diffMetricaGoals,
  isPresent,
  normalizeApiError,
  redactSensitive,
  yandexJsonRequest
} from "./bootstrap-lib.mjs";

export const R2A_SOURCE_SYSTEM = "yandex_metrica";
export const R2A_STAT_API_URL = "https://api-metrika.yandex.net/stat/v1/data";
export const R2A_DEFAULT_DAYS = 3;
export const R2A_TIMEZONE_OFFSET = "+03:00";
export const R2A_TRAFFIC_METRICS = [
  { metricKey: "visits", apiMetric: "ym:s:visits" },
  { metricKey: "pageviews", apiMetric: "ym:s:pageviews" },
  { metricKey: "users", apiMetric: "ym:s:users" }
];
export const R2B_TRAFFIC_METRICS = [
  { metricKey: "visits", apiMetric: "ym:s:visits" },
  { metricKey: "users", apiMetric: "ym:s:users" },
  { metricKey: "pageviews", apiMetric: "ym:s:pageviews" }
];
export const R2B_DEFAULT_LIMIT = 1000;
export const R2B_DEFAULT_MAX_PAGES = 5;
export const R2B_DEFAULT_MAX_ROWS = 5000;
export const R2B_LANDING_MAX_ROWS = 2000;
export const R2B_DEFAULT_ATTRIBUTION = "lastsign";

const EMPTY_DIMENSIONS = Object.freeze({});
const EMPTY_DIMENSIONS_HASH = hashStableJson(EMPTY_DIMENSIONS);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const RECOVERABLE_IMPORT_STATUSES = new Set(["ok", "partial"]);
const TRACKING_PARAM_PATTERN = /^(utm_|yclid$|ymclid$|gclid$|fbclid$|_openstat$|mc_)/i;

export function hashStableJson(value) {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${stableStringify(value[key])}`
  )).join(",")}}`;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toMoscowDateText(date) {
  const value = date instanceof Date ? date : new Date(date);
  const moscowTime = new Date(value.getTime() + (3 * 60 * 60 * 1000));

  return moscowTime.toISOString().slice(0, 10);
}

function assertDateText(value, label) {
  if (!DATE_RE.test(String(value || ""))) {
    throw new Error(`${label} must be in YYYY-MM-DD format.`);
  }
}

export function resolveR2aDateRange({
  now = new Date(),
  date1 = "",
  date2 = "",
  days = R2A_DEFAULT_DAYS
} = {}) {
  if (date1 || date2) {
    assertDateText(date1, "date1");
    assertDateText(date2, "date2");

    if (date1 > date2) {
      throw new Error("date1 must be earlier than or equal to date2.");
    }

    return { date1, date2, days: null, timezone: R2A_TIMEZONE_OFFSET };
  }

  const normalizedDays = Number.isInteger(Number(days)) && Number(days) > 0
    ? Math.min(Number(days), 31)
    : R2A_DEFAULT_DAYS;
  const todayMoscow = toMoscowDateText(now);
  const resolvedDate2 = addDays(todayMoscow, -1);
  const resolvedDate1 = addDays(resolvedDate2, -(normalizedDays - 1));

  return {
    date1: resolvedDate1,
    date2: resolvedDate2,
    days: normalizedDays,
    timezone: R2A_TIMEZONE_OFFSET
  };
}

export function validateR2aEnv(env = process.env) {
  const counterId = String(env.YANDEX_METRICA_COUNTER_ID || "").trim();
  const token = String(env.YANDEX_METRICA_OAUTH_TOKEN || "").trim();
  const missing = [];

  if (!isPresent(counterId)) {
    missing.push("YANDEX_METRICA_COUNTER_ID");
  }

  if (!isPresent(token)) {
    missing.push("YANDEX_METRICA_OAUTH_TOKEN");
  }

  return {
    ok: missing.length === 0,
    counterId,
    token,
    missing
  };
}

function summarizeUnavailableEnv(missing) {
  return {
    unavailable_metrics: [],
    unavailable_goals: [...REQUIRED_METRICA_GOALS],
    errors: missing.map((key) => ({
      error_category: "not_configured",
      safe_error_message: `${key} is missing.`
    }))
  };
}

function buildStatUrl({
  counterId,
  dateRange,
  metrics,
  dimensions = "ym:s:date",
  limit = 100000,
  offset = 1
}) {
  const url = new URL(R2A_STAT_API_URL);

  url.searchParams.set("ids", counterId);
  url.searchParams.set("metrics", metrics.join(","));
  url.searchParams.set("dimensions", Array.isArray(dimensions) ? dimensions.join(",") : dimensions);
  url.searchParams.set("date1", dateRange.date1);
  url.searchParams.set("date2", dateRange.date2);
  url.searchParams.set("timezone", R2A_TIMEZONE_OFFSET);
  url.searchParams.set("accuracy", "full");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  return url.toString();
}

function summarizeCounter(counter) {
  return {
    id: counter?.id ?? null,
    name: counter?.name ?? null,
    site: counter?.site ?? null,
    status: counter?.status ?? null,
    permission: counter?.permission ?? null
  };
}

function mapGoals(goals) {
  const diff = diffMetricaGoals(goals, REQUIRED_METRICA_GOALS);
  const importable = diff.already_existed
    .filter((item) => item.metrica_goal_id !== null && item.metrica_goal_id !== undefined)
    .map((item) => ({
      goalName: item.goal_id,
      goalId: String(item.metrica_goal_id),
      metricaGoalName: item.metrica_goal_name
    }));
  const importableNames = new Set(importable.map((item) => item.goalName));
  const unavailableGoals = [
    ...diff.missing.map((goalName) => ({
      goal_name: goalName,
      reason: "missing"
    })),
    ...diff.needs_review.map((item) => ({
      goal_name: item.goal_id,
      metrica_goal_id: item.metrica_goal_id ?? null,
      reason: "goal_condition_not_confirmed"
    })),
    ...REQUIRED_METRICA_GOALS
      .filter((goalName) => !importableNames.has(goalName)
        && !diff.missing.includes(goalName)
        && !diff.needs_review.some((item) => item.goal_id === goalName))
      .map((goalName) => ({
        goal_name: goalName,
        reason: "goal_id_unavailable"
      }))
  ];

  return {
    importable,
    unavailableGoals,
    diff
  };
}

export async function buildR2aReportPlan({
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  const validation = validateR2aEnv(env);
  if (!validation.ok) {
    return {
      status: "not_configured",
      counter_id: validation.counterId || null,
      missing_env: validation.missing,
      goals: [],
      ...summarizeUnavailableEnv(validation.missing)
    };
  }

  const { counterId, token } = validation;
  const counterData = await yandexJsonRequest(
    `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}`,
    { token, fetchImpl }
  );
  const goalsData = await yandexJsonRequest(
    `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}/goals`,
    { token, fetchImpl }
  );
  const goals = Array.isArray(goalsData.goals) ? goalsData.goals : [];
  const goalMapping = mapGoals(goals);

  return {
    status: goalMapping.unavailableGoals.length > 0 ? "partial" : "ok",
    counter_id: counterId,
    counter: summarizeCounter(counterData.counter),
    existing_goals_count: goals.length,
    goals: goalMapping.importable,
    unavailable_goals: goalMapping.unavailableGoals,
    unavailable_metrics: [],
    reports: [
      {
        report_type: "traffic_total",
        metrics: R2A_TRAFFIC_METRICS
      },
      {
        report_type: "goal_reaches",
        metrics: goalMapping.importable.map((goal) => ({
          metricKey: "goal_reaches",
          apiMetric: `ym:s:goal${goal.goalId}reaches`,
          goalId: goal.goalId,
          goalName: goal.goalName
        }))
      }
    ],
    errors: goalMapping.unavailableGoals.map((goal) => ({
      error_category: "goal_unavailable",
      goal_name: goal.goal_name,
      safe_error_message: `Goal ${goal.goal_name} is unavailable for R2A import: ${goal.reason}.`
    }))
  };
}

function safeApiError(error, errorCategory = "api_error") {
  const normalized = normalizeApiError(error);

  return {
    error_category: errorCategory,
    ...stripSensitiveErrorKeys(normalized),
    safe_error_message: normalized.safe_error_message || "Yandex Metrica API request failed."
  };
}

function stripSensitiveErrorKeys(value) {
  if (value == null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stripSensitiveErrorKeys);
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => ![
        "authorization",
        "access_token",
        "refresh_token",
        "oauth_token",
        "client_secret",
        "password",
        "secret"
      ].includes(key.toLowerCase()))
      .map(([key, nested]) => [key, stripSensitiveErrorKeys(nested)])
  );
}

async function fetchStatReport({
  counterId,
  token,
  dateRange,
  metrics,
  fetchImpl,
  dimensions = "ym:s:date",
  limit = 100000,
  offset = 1
}) {
  const url = buildStatUrl({
    counterId,
    dateRange,
    metrics: metrics.map((metric) => metric.apiMetric),
    dimensions,
    limit,
    offset
  });

  return yandexJsonRequest(url, { token, fetchImpl });
}

async function fetchTrafficReport({
  counterId,
  token,
  dateRange,
  fetchImpl
}) {
  try {
    const response = await fetchStatReport({
      counterId,
      token,
      dateRange,
      metrics: R2A_TRAFFIC_METRICS,
      fetchImpl
    });

    return {
      status: "ok",
      report_type: "traffic_total",
      metrics: R2A_TRAFFIC_METRICS,
      response,
      unavailable_metrics: [],
      errors: []
    };
  } catch (error) {
    const fallbackMetrics = R2A_TRAFFIC_METRICS.filter((metric) => metric.metricKey !== "users");

    try {
      const response = await fetchStatReport({
        counterId,
        token,
        dateRange,
        metrics: fallbackMetrics,
        fetchImpl
      });

      return {
        status: "partial",
        report_type: "traffic_total",
        metrics: fallbackMetrics,
        response,
        unavailable_metrics: ["users"],
        errors: [safeApiError(error, "metric_unavailable")]
      };
    } catch (fallbackError) {
      return {
        status: "failed",
        report_type: "traffic_total",
        metrics: fallbackMetrics,
        response: null,
        unavailable_metrics: R2A_TRAFFIC_METRICS.map((metric) => metric.metricKey),
        errors: [
          safeApiError(error, "traffic_report_failed"),
          safeApiError(fallbackError, "traffic_report_failed")
        ]
      };
    }
  }
}

async function fetchGoalReport({
  counterId,
  token,
  dateRange,
  goalMetrics,
  fetchImpl
}) {
  if (goalMetrics.length === 0) {
    return {
      status: "partial",
      report_type: "goal_reaches",
      successful_reports: [],
      failed_goals: [],
      errors: [{
        error_category: "goal_unavailable",
        safe_error_message: "No confirmed Metrica goals are available for R2A goal import."
      }]
    };
  }

  try {
    const response = await fetchStatReport({
      counterId,
      token,
      dateRange,
      metrics: goalMetrics,
      fetchImpl
    });

    return {
      status: "ok",
      report_type: "goal_reaches",
      successful_reports: [{
        metrics: goalMetrics,
        response
      }],
      failed_goals: [],
      errors: []
    };
  } catch (combinedError) {
    const successfulReports = [];
    const failedGoals = [];
    const errors = [safeApiError(combinedError, "goal_report_failed")];

    for (const goalMetric of goalMetrics) {
      try {
        const response = await fetchStatReport({
          counterId,
          token,
          dateRange,
          metrics: [goalMetric],
          fetchImpl
        });
        successfulReports.push({
          metrics: [goalMetric],
          response
        });
      } catch (error) {
        failedGoals.push({
          goal_name: goalMetric.goalName,
          goal_id: goalMetric.goalId
        });
        errors.push({
          goal_name: goalMetric.goalName,
          goal_id: goalMetric.goalId,
          ...safeApiError(error, "goal_metric_failed")
        });
      }
    }

    return {
      status: successfulReports.length > 0 ? "partial" : "failed",
      report_type: "goal_reaches",
      successful_reports: successfulReports,
      failed_goals: failedGoals,
      errors
    };
  }
}

function extractDate(row) {
  const firstDimension = Array.isArray(row?.dimensions) ? row.dimensions[0] : null;
  const candidates = [
    firstDimension?.id,
    firstDimension?.name
  ].filter((value) => typeof value === "string");

  return candidates.find((value) => DATE_RE.test(value)) ?? null;
}

function numericMetric(value) {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function dateList(dateRange) {
  const dates = [];
  let current = dateRange.date1;

  while (current <= dateRange.date2) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

function aggregateId(record) {
  return `metrica_${hashStableJson({
    source_system: record.source_system,
    date: record.date,
    report_type: record.report_type,
    dimension_hash: record.dimension_hash,
    metric_key: record.metric_key,
    goal_id: record.goal_id
  }).slice(0, 40)}`;
}

function metricMetadata(response, metric, extra = {}) {
  return {
    api_metric: metric.apiMetric,
    report_source: "yandex_metrica_reporting_api",
    sampled: Boolean(response?.sampled),
    sample_share: response?.sample_share ?? null,
    sample_size: response?.sample_size ?? null,
    sample_space: response?.sample_space ?? null,
    total_rows: response?.total_rows ?? null,
    total_rows_rounded: Boolean(response?.total_rows_rounded),
    contains_sensitive_data: Boolean(response?.contains_sensitive_data),
    data_lag: response?.data_lag ?? null,
    ...extra
  };
}

function totalsAreAllZero(response) {
  return Array.isArray(response?.totals)
    && response.totals.length > 0
    && response.totals.every((value) => numericMetric(value) === 0);
}

function buildRecord({ reportType, date, metric, metricValue, metadata }) {
  const record = {
    id: "",
    source_system: R2A_SOURCE_SYSTEM,
    date,
    period_grain: "day",
    report_type: reportType,
    dimension_hash: EMPTY_DIMENSIONS_HASH,
    dimensions: EMPTY_DIMENSIONS,
    metric_key: metric.metricKey,
    metric_value: numericMetric(metricValue),
    goal_id: metric.goalId ?? "",
    goal_name: metric.goalName ?? "",
    import_run_id: "",
    metadata
  };

  record.id = aggregateId(record);
  return record;
}

function recordsFromReport({ reportType, response, metrics, dateRange }) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  const records = [];

  if (rows.length === 0 && totalsAreAllZero(response)) {
    for (const date of dateList(dateRange)) {
      for (const metric of metrics) {
        records.push(buildRecord({
          reportType,
          date,
          metric,
          metricValue: 0,
          metadata: metricMetadata(response, metric, {
            zero_filled_from_empty_api_rows: true,
            zero_fill_reason: "api_totals_zero"
          })
        }));
      }
    }

    return records;
  }

  for (const row of rows) {
    const date = extractDate(row);
    if (!date) {
      continue;
    }

    for (const [index, metric] of metrics.entries()) {
      records.push(buildRecord({
        reportType,
        date,
        metric,
        metricValue: row.metrics?.[index],
        metadata: metricMetadata(response, metric)
      }));
    }
  }

  return records;
}

function summarizeStatResponse(response) {
  return {
    api_rows: Array.isArray(response?.data) ? response.data.length : 0,
    total_rows: response?.total_rows ?? null,
    total_rows_rounded: Boolean(response?.total_rows_rounded),
    sampled: Boolean(response?.sampled),
    sample_share: response?.sample_share ?? null,
    sample_size: response?.sample_size ?? null,
    sample_space: response?.sample_space ?? null,
    contains_sensitive_data: Boolean(response?.contains_sensitive_data),
    data_lag: response?.data_lag ?? null,
    totals: Array.isArray(response?.totals) ? response.totals.map(numericMetric) : []
  };
}

function compactString(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeAttribution(value) {
  return [
    "first",
    "last",
    "lastsign",
    "last_yandex_direct_click",
    "cross_device_first",
    "cross_device_last",
    "cross_device_last_significant",
    "cross_device_last_yandex_direct_click",
    "automatic"
  ].includes(value) ? value : R2B_DEFAULT_ATTRIBUTION;
}

export function buildR2bReportPlan({
  attribution = R2B_DEFAULT_ATTRIBUTION,
  maxRows = R2B_DEFAULT_MAX_ROWS,
  landingMaxRows = R2B_LANDING_MAX_ROWS
} = {}) {
  const model = normalizeAttribution(attribution);

  return [
    {
      report_type: "traffic_source",
      required: true,
      dimensions: ["ym:s:date", `ym:s:${model}TrafficSource`],
      dimension_keys: ["date", "traffic_source"],
      max_rows: maxRows,
      attribution_model: model
    },
    {
      report_type: "source_detail",
      required: false,
      dimensions: ["ym:s:date", `ym:s:${model}TrafficSource`, `ym:s:${model}SourceEngine`],
      dimension_keys: ["date", "traffic_source", "source_engine"],
      max_rows: maxRows,
      attribution_model: model
    },
    {
      report_type: "device",
      required: true,
      dimensions: ["ym:s:date", "ym:s:deviceCategory"],
      dimension_keys: ["date", "device_category"],
      max_rows: maxRows,
      attribution_model: ""
    },
    {
      report_type: "country",
      required: true,
      dimensions: ["ym:s:date", "ym:s:regionCountry"],
      dimension_keys: ["date", "country"],
      max_rows: maxRows,
      attribution_model: ""
    },
    {
      report_type: "region",
      required: false,
      dimensions: ["ym:s:date", "ym:s:regionCountry", "ym:s:regionArea"],
      dimension_keys: ["date", "country", "region_area"],
      max_rows: maxRows,
      attribution_model: ""
    },
    {
      report_type: "landing_url",
      required: true,
      dimensions: ["ym:s:date", "ym:s:startURLPath"],
      dimension_keys: ["date", "landing_path"],
      max_rows: landingMaxRows,
      attribution_model: ""
    }
  ];
}

function dimensionAt(row, index) {
  const dimension = Array.isArray(row?.dimensions) ? row.dimensions[index] : null;
  const id = compactString(dimension?.id, 1000);
  const name = compactString(dimension?.name, 1000);

  return {
    id: id || name,
    name: name || id
  };
}

function r2bDimensionPayload({ plan, row, publicSiteUrl }) {
  const payload = {
    report_type: plan.report_type,
    api_dimensions: plan.dimensions
  };
  const date = extractDate(row);

  if (plan.attribution_model) {
    payload.attribution_model = plan.attribution_model;
  }

  for (let index = 1; index < plan.dimension_keys.length; index += 1) {
    const key = plan.dimension_keys[index];
    const dimension = dimensionAt(row, index);

    payload[key] = dimension.id;
    payload[`${key}_name`] = dimension.name;
  }

  if (plan.report_type === "landing_url") {
    const rawLanding = dimensionAt(row, 1).id || dimensionAt(row, 1).name;
    const normalized = normalizeMetricaLandingUrl(rawLanding, { publicSiteUrl });
    payload.landing_url = normalized.normalized_url;
    payload.landing_path = normalized.page_path;
    payload.normalized_url = normalized.normalized_url;
    payload.page_path = normalized.page_path;
    payload.stripped_tracking_params = normalized.stripped_tracking_params;
  }

  return { date, dimensions: payload };
}

export function normalizeMetricaLandingUrl(rawUrl, { publicSiteUrl = "https://ecostroycontinent.ru" } = {}) {
  const canonical = new URL(publicSiteUrl || "https://ecostroycontinent.ru");
  const parsed = new URL(compactString(rawUrl, 2000) || "/", canonical.origin);
  const strippedParams = [];

  parsed.hash = "";
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
    path = path.replace(/\/+$/u, "");
  }

  return {
    normalized_url: `${canonical.protocol}//${canonical.host}${path}`,
    page_path: path,
    original_host: parsed.host,
    stripped_tracking_params: strippedParams.sort()
  };
}

function buildR2bRecord({ plan, row, metric, metricValue, response, publicSiteUrl }) {
  const { date, dimensions } = r2bDimensionPayload({ plan, row, publicSiteUrl });

  if (!date) {
    return null;
  }

  const normalizedUrl = plan.report_type === "landing_url" ? dimensions.normalized_url : null;
  const pagePath = plan.report_type === "landing_url" ? dimensions.page_path : null;
  const dimensionHash = hashStableJson({
    report_type: plan.report_type,
    dimensions
  });
  const record = {
    id: "",
    source_system: R2A_SOURCE_SYSTEM,
    date,
    period_grain: "day",
    report_type: plan.report_type,
    dimension_hash: dimensionHash,
    dimensions,
    metric_key: metric.metricKey,
    metric_value: numericMetric(metricValue),
    goal_id: "",
    goal_name: "",
    normalized_url: normalizedUrl,
    page_path: pagePath,
    entity_type: null,
    entity_id: null,
    import_run_id: "",
    metadata: metricMetadata(response, metric, {
      api_dimensions: plan.dimensions,
      required_report: plan.required,
      attribution_model: plan.attribution_model || null,
      external_enrichment_only: true
    })
  };

  record.id = aggregateId(record);
  return record;
}

function normalizeR2bReportRecords({ report, importRunId, publicSiteUrl }) {
  if (!["ok", "partial"].includes(report?.status)) {
    return [];
  }

  if (!Array.isArray(report?.response?.data)) {
    return [];
  }

  const records = [];
  for (const row of report.response.data) {
    for (const [index, metric] of report.metrics.entries()) {
      const record = buildR2bRecord({
        plan: report.plan,
        row,
        metric,
        metricValue: row.metrics?.[index],
        response: report.response,
        publicSiteUrl
      });

      if (record) {
        records.push({
          ...record,
          import_run_id: importRunId
        });
      }
    }
  }

  return records;
}

export function normalizeR2bRecords({ reports, importRunId, publicSiteUrl }) {
  return reports.flatMap((report) => normalizeR2bReportRecords({
    report,
    importRunId,
    publicSiteUrl
  }));
}

function r2bReportLimitations(report) {
  const limitations = [];

  if (report.status === "skipped") {
    limitations.push(`${report.report_type}_skipped_${report.skip_reason || "cardinality"}`);
  }

  if (report.unavailable_metrics?.includes("users")) {
    limitations.push(`${report.report_type}_users_metric_unavailable`);
  }

  const response = report.response;
  if (response?.sampled) {
    limitations.push(`${report.report_type}_sampled`);
  }

  if (response?.total_rows_rounded) {
    limitations.push(`${report.report_type}_total_rows_rounded`);
  }

  if (response?.contains_sensitive_data) {
    limitations.push(`${report.report_type}_contains_limited_disclosure_data`);
  }

  if (Array.isArray(response?.data) && response.data.length === 0) {
    limitations.push(`${report.report_type}_zero_rows_for_period`);
  }

  return limitations;
}

function r2bStatus({ reports }) {
  const required = reports.filter((report) => report.plan?.required);
  const usable = required.filter((report) => ["ok", "partial"].includes(report.status));
  const bad = required.filter((report) => ["failed", "skipped"].includes(report.status));

  if (usable.length === 0) {
    return "failed";
  }

  if (bad.length > 0 || required.some((report) => report.status === "partial")) {
    return "partial";
  }

  return "ok";
}

function r2bReportSummary(report) {
  return {
    report_type: report.report_type,
    required: Boolean(report.plan?.required),
    status: report.status,
    skip_reason: report.skip_reason || "",
    dimensions: report.plan?.dimensions ?? [],
    metrics: report.metrics?.map((metric) => metric.metricKey) ?? [],
    api_metrics: report.metrics?.map((metric) => metric.apiMetric) ?? [],
    max_rows: report.plan?.max_rows ?? null,
    unavailable_metrics: report.unavailable_metrics ?? [],
    limitations: r2bReportLimitations(report),
    response: report.response ? summarizeStatResponse(report.response) : null
  };
}

function buildR2bSummary({
  mode,
  status,
  counterId,
  dateRange,
  importRunId,
  reports,
  records,
  errors,
  unmappedUrlCount = 0,
  attribution
}) {
  const summaries = reports.map(r2bReportSummary);
  const limitations = Array.from(new Set(summaries.flatMap((summary) => summary.limitations)));

  return redactSensitive({
    status,
    mode,
    domain_slice: "R2B",
    source_system: R2A_SOURCE_SYSTEM,
    counter_id: counterId || null,
    date_range: dateRange,
    attribution_model: attribution,
    import_run_id: importRunId,
    dry_run: mode === "dry-run",
    selected_reports: Object.fromEntries(summaries.map((summary) => [summary.report_type, summary.metrics])),
    selected_api_dimensions: Object.fromEntries(summaries.map((summary) => [summary.report_type, summary.dimensions])),
    selected_api_metrics: Object.fromEntries(summaries.map((summary) => [summary.report_type, summary.api_metrics])),
    report_summaries: summaries,
    rows_prepared: records.length,
    rows_imported: mode === "write" ? records.length : 0,
    unmapped_url_count: unmappedUrlCount,
    sync_state_written: mode === "write",
    limitations,
    unavailable_metrics: Array.from(new Set(reports.flatMap((report) => report.unavailable_metrics ?? []))),
    safe_error_message: safeErrorMessage(errors),
    errors
  });
}

async function fetchR2bReportPage({
  counterId,
  token,
  dateRange,
  plan,
  metrics,
  fetchImpl,
  limit,
  offset
}) {
  return fetchStatReport({
    counterId,
    token,
    dateRange,
    metrics,
    dimensions: plan.dimensions,
    fetchImpl,
    limit,
    offset
  });
}

async function fetchR2bReportWithMetricFallback({
  counterId,
  token,
  dateRange,
  plan,
  fetchImpl,
  limit,
  offset
}) {
  try {
    const response = await fetchR2bReportPage({
      counterId,
      token,
      dateRange,
      plan,
      metrics: R2B_TRAFFIC_METRICS,
      fetchImpl,
      limit,
      offset
    });

    return {
      status: "ok",
      metrics: R2B_TRAFFIC_METRICS,
      response,
      unavailable_metrics: [],
      errors: []
    };
  } catch (error) {
    const fallbackMetrics = R2B_TRAFFIC_METRICS.filter((metric) => metric.metricKey !== "users");

    try {
      const response = await fetchR2bReportPage({
        counterId,
        token,
        dateRange,
        plan,
        metrics: fallbackMetrics,
        fetchImpl,
        limit,
        offset
      });

      return {
        status: "partial",
        metrics: fallbackMetrics,
        response,
        unavailable_metrics: ["users"],
        errors: [safeApiError(error, "metric_unavailable")]
      };
    } catch (fallbackError) {
      return {
        status: "failed",
        metrics: fallbackMetrics,
        response: null,
        unavailable_metrics: R2B_TRAFFIC_METRICS.map((metric) => metric.metricKey),
        errors: [
          safeApiError(error, `${plan.report_type}_failed`),
          safeApiError(fallbackError, `${plan.report_type}_failed`)
        ]
      };
    }
  }
}

async function fetchR2bReport({
  counterId,
  token,
  dateRange,
  plan,
  fetchImpl,
  limit,
  maxPages
}) {
  const probe = await fetchR2bReportWithMetricFallback({
    counterId,
    token,
    dateRange,
    plan,
    fetchImpl,
    limit: 1,
    offset: 1
  });

  if (probe.status === "failed") {
    return {
      report_type: plan.report_type,
      status: "failed",
      plan,
      metrics: probe.metrics,
      response: null,
      unavailable_metrics: probe.unavailable_metrics,
      errors: probe.errors
    };
  }

  const totalRows = Number(probe.response?.total_rows ?? 0);
  const maxAllowedRows = Math.min(plan.max_rows, limit * maxPages);
  if (totalRows > maxAllowedRows) {
    return {
      report_type: plan.report_type,
      status: "skipped",
      skip_reason: "cardinality_limit_exceeded",
      plan,
      metrics: probe.metrics,
      response: probe.response,
      unavailable_metrics: probe.unavailable_metrics,
      errors: [{
        error_category: "cardinality_limit_exceeded",
        safe_error_message: `${plan.report_type} returned ${totalRows} rows, above the R2B limit ${maxAllowedRows}.`
      }]
    };
  }

  const data = [];
  let lastResponse = probe.response;
  let offset = 1;
  let pages = 0;

  while (pages < maxPages) {
    const page = await fetchR2bReportPage({
      counterId,
      token,
      dateRange,
      plan,
      metrics: probe.metrics,
      fetchImpl,
      limit,
      offset
    });
    const rows = Array.isArray(page?.data) ? page.data : [];
    data.push(...rows);
    lastResponse = page;
    pages += 1;

    if (rows.length < limit || data.length >= totalRows || data.length >= plan.max_rows) {
      break;
    }

    offset += limit;
  }

  return {
    report_type: plan.report_type,
    status: probe.status,
    plan,
    metrics: probe.metrics,
    response: {
      ...lastResponse,
      data,
      total_rows: lastResponse?.total_rows ?? probe.response?.total_rows ?? data.length
    },
    unavailable_metrics: probe.unavailable_metrics,
    errors: probe.errors
  };
}

export async function fetchR2bReports({
  env = process.env,
  fetchImpl = globalThis.fetch,
  dateRange,
  attribution = R2B_DEFAULT_ATTRIBUTION,
  limit = R2B_DEFAULT_LIMIT,
  maxPages = R2B_DEFAULT_MAX_PAGES,
  maxRows = R2B_DEFAULT_MAX_ROWS,
  landingMaxRows = R2B_LANDING_MAX_ROWS
} = {}) {
  const validation = validateR2aEnv(env);
  if (!validation.ok) {
    return {
      status: "not_configured",
      reports: [],
      errors: summarizeUnavailableEnv(validation.missing).errors
    };
  }

  const plan = buildR2bReportPlan({ attribution, maxRows, landingMaxRows });
  const reports = [];
  for (const reportPlan of plan) {
    reports.push(await fetchR2bReport({
      counterId: validation.counterId,
      token: validation.token,
      dateRange,
      plan: reportPlan,
      fetchImpl,
      limit,
      maxPages
    }));
  }

  return {
    status: r2bStatus({ reports }),
    reports,
    errors: reports.flatMap((report) => report.errors ?? [])
  };
}

export function normalizeR2aRecords({
  trafficReport,
  goalReport,
  importRunId,
  dateRange
}) {
  const records = [];

  if (trafficReport.response) {
    records.push(...recordsFromReport({
      reportType: "traffic_total",
      response: trafficReport.response,
      metrics: trafficReport.metrics,
      dateRange
    }));
  }

  for (const goalSlice of goalReport.successful_reports) {
    records.push(...recordsFromReport({
      reportType: "goal_reaches",
      response: goalSlice.response,
      metrics: goalSlice.metrics,
      dateRange
    }));
  }

  return records.map((record) => ({
    ...record,
    import_run_id: importRunId
  }));
}

function combinedStatus(statuses, records) {
  if (statuses.includes("failed") && records.length === 0) {
    return "failed";
  }

  if (statuses.includes("failed") || statuses.includes("partial")) {
    return records.length > 0 ? "partial" : "failed";
  }

  return "ok";
}

function safeErrorMessage(errors) {
  const messages = errors
    .map((error) => error?.safe_error_message)
    .filter(Boolean)
    .map((message) => redactSensitive(message));

  return messages.slice(0, 4).join(" | ").slice(0, 1000);
}

function buildSummary({
  mode,
  status,
  counterId,
  dateRange,
  importRunId,
  plan,
  trafficReport,
  goalReport,
  records,
  errors
}) {
  const unavailableGoals = [
    ...(plan?.unavailable_goals ?? []),
    ...(goalReport?.failed_goals ?? [])
  ];
  const unavailableMetrics = [
    ...(plan?.unavailable_metrics ?? []),
    ...(trafficReport?.unavailable_metrics ?? [])
  ];

  return redactSensitive({
    status,
    mode,
    source_system: R2A_SOURCE_SYSTEM,
    counter_id: counterId || null,
    date_range: dateRange,
    import_run_id: importRunId,
    dry_run: mode === "dry-run",
    selected_reports: {
      traffic_total: trafficReport?.metrics?.map((metric) => metric.metricKey) ?? [],
      goal_reaches: plan?.goals?.map((goal) => goal.goalName) ?? []
    },
    selected_api_metrics: {
      traffic_total: trafficReport?.metrics?.map((metric) => metric.apiMetric) ?? [],
      goal_reaches: plan?.goals?.map((goal) => `ym:s:goal${goal.goalId}reaches`) ?? []
    },
    report_summaries: {
      traffic_total: trafficReport?.response ? summarizeStatResponse(trafficReport.response) : null,
      goal_reaches: goalReport?.successful_reports?.map((slice) => ({
        metrics: slice.metrics.map((metric) => metric.goalName ?? metric.metricKey),
        ...summarizeStatResponse(slice.response)
      })) ?? []
    },
    rows_prepared: records.length,
    rows_imported: mode === "write" ? records.length : 0,
    sync_state_written: mode === "write",
    unavailable_metrics: unavailableMetrics,
    unavailable_goals: unavailableGoals,
    safe_error_message: safeErrorMessage(errors),
    errors
  });
}

export async function fetchR2aReports({
  env = process.env,
  fetchImpl = globalThis.fetch,
  dateRange
} = {}) {
  const plan = await buildR2aReportPlan({ env, fetchImpl });

  if (plan.status === "not_configured") {
    return {
      plan,
      trafficReport: null,
      goalReport: null,
      errors: plan.errors ?? []
    };
  }

  const validation = validateR2aEnv(env);
  const trafficReport = await fetchTrafficReport({
    counterId: validation.counterId,
    token: validation.token,
    dateRange,
    fetchImpl
  });
  const goalMetrics = plan.reports
    .find((report) => report.report_type === "goal_reaches")
    ?.metrics ?? [];
  const goalReport = await fetchGoalReport({
    counterId: validation.counterId,
    token: validation.token,
    dateRange,
    goalMetrics,
    fetchImpl
  });
  const errors = [
    ...(plan.errors ?? []),
    ...trafficReport.errors,
    ...goalReport.errors
  ];

  return {
    plan,
    trafficReport,
    goalReport,
    errors
  };
}

export async function persistR2aImport({
  db,
  records,
  syncState
}) {
  for (const record of records) {
    await db.query(`
      INSERT INTO external_metrica_daily_aggregate (
        id,
        source_system,
        date,
        period_grain,
        report_type,
        dimension_hash,
        dimensions,
        metric_key,
        metric_value,
        goal_id,
        goal_name,
        normalized_url,
        page_path,
        entity_type,
        entity_id,
        imported_at,
        import_run_id,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16, $17::jsonb
      )
      ON CONFLICT (
        source_system,
        date,
        report_type,
        dimension_hash,
        metric_key,
        goal_id
      ) DO UPDATE SET
        metric_value = EXCLUDED.metric_value,
        imported_at = EXCLUDED.imported_at,
        import_run_id = EXCLUDED.import_run_id,
        normalized_url = EXCLUDED.normalized_url,
        page_path = EXCLUDED.page_path,
        entity_type = EXCLUDED.entity_type,
        entity_id = EXCLUDED.entity_id,
        metadata = EXCLUDED.metadata
    `, [
      record.id,
      record.source_system,
      record.date,
      record.period_grain,
      record.report_type,
      record.dimension_hash,
      JSON.stringify(record.dimensions),
      record.metric_key,
      record.metric_value,
      record.goal_id,
      record.goal_name,
      record.normalized_url ?? null,
      record.page_path ?? null,
      record.entity_type ?? null,
      record.entity_id ?? null,
      record.import_run_id,
      JSON.stringify(record.metadata)
    ]);
  }

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
      $8,
      $6,
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
    R2A_SOURCE_SYSTEM,
    syncState.status,
    syncState.imported_period_start,
    syncState.imported_period_end,
    syncState.safe_error_message,
    syncState.rows_imported,
    Array.from(RECOVERABLE_IMPORT_STATUSES),
    syncState.unmapped_url_count ?? 0
  ]);
}

async function resolveMetricaRouteEntityWithDb(db, pagePath) {
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

async function resolveR2bLandingRecords(db, records) {
  const unmapped = new Map();

  for (const record of records.filter((item) => item.report_type === "landing_url")) {
    // Landing URLs are diagnostics only; resolving must never create Content Core state.
    const resolution = await resolveMetricaRouteEntityWithDb(db, record.page_path || "/");
    record.page_path = resolution.page_path;
    record.entity_type = resolution.entity_type;
    record.entity_id = resolution.entity_id;
    record.metadata = {
      ...record.metadata,
      resolution_status: resolution.resolution_status,
      page_kind: resolution.page_kind ?? null,
      published_revision_id: resolution.published_revision_id ?? null
    };

    if (resolution.resolution_status === "unmapped" && !unmapped.has(resolution.page_path)) {
      unmapped.set(resolution.page_path, {
        page_path: resolution.page_path,
        normalized_url: record.normalized_url || record.dimensions?.normalized_url || "",
        reason: "metrica_landing_url_unmapped"
      });
    }
  }

  return Array.from(unmapped.values());
}

async function persistMetricaUnmappedDiagnostic(db, diagnostic) {
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
    `unmapped_url_${hashStableJson([R2A_SOURCE_SYSTEM, diagnostic.page_path]).slice(0, 40)}`,
    diagnostic.page_path,
    R2A_SOURCE_SYSTEM,
    diagnostic.normalized_url,
    diagnostic.reason,
    JSON.stringify({
      source_report: "landing_url",
      normalized_url: diagnostic.normalized_url
    })
  ]);
}

async function persistR2bImport({
  db,
  records,
  syncState
}) {
  // R2B imports Metrica aggregates as external enrichment only.
  // Do not route these rows into first-party telemetry or make Metrica operational truth.
  const unmapped = await resolveR2bLandingRecords(db, records);

  for (const diagnostic of unmapped) {
    await persistMetricaUnmappedDiagnostic(db, diagnostic);
  }

  await persistR2aImport({
    db,
    records,
    syncState: {
      ...syncState,
      unmapped_url_count: unmapped.length
    }
  });

  return { unmappedUrlCount: unmapped.length };
}

async function persistSyncStateOnly({
  withTransactionFn,
  syncState
}) {
  if (typeof withTransactionFn !== "function") {
    throw new Error("withTransactionFn is required for write mode.");
  }

  await withTransactionFn(async (db) => {
    await persistR2aImport({
      db,
      records: [],
      syncState
    });
  });
}

function syncStateFromSummary({ status, dateRange, rowsImported, safeErrorMessage, importRunId, unmappedUrlCount = 0 }) {
  return {
    status,
    imported_period_start: dateRange.date1,
    imported_period_end: dateRange.date2,
    safe_error_message: safeErrorMessage || "",
    rows_imported: rowsImported,
    unmapped_url_count: unmappedUrlCount,
    import_run_id: importRunId,
    metadata: {}
  };
}

export async function runMetricaR2a({
  mode = "dry-run",
  env = process.env,
  fetchImpl = globalThis.fetch,
  withTransactionFn = null,
  now = new Date(),
  date1 = "",
  date2 = "",
  days = R2A_DEFAULT_DAYS
} = {}) {
  const normalizedMode = mode === "write" ? "write" : "dry-run";
  const dateRange = resolveR2aDateRange({ now, date1, date2, days });
  const importRunId = `r2a_${new Date(now).toISOString().replace(/[:.]/g, "-")}_${randomUUID()}`;
  const validation = validateR2aEnv(env);

  if (!validation.ok) {
    const errors = summarizeUnavailableEnv(validation.missing).errors;
    const summary = buildSummary({
      mode: normalizedMode,
      status: "not_configured",
      counterId: validation.counterId,
      dateRange,
      importRunId,
      plan: {
        goals: [],
        unavailable_goals: REQUIRED_METRICA_GOALS.map((goalName) => ({
          goal_name: goalName,
          reason: "not_configured"
        }))
      },
      trafficReport: null,
      goalReport: null,
      records: [],
      errors
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "not_configured",
          dateRange,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          importRunId
        })
      });
    }

    return summary;
  }

  try {
    const fetched = await fetchR2aReports({
      env,
      fetchImpl,
      dateRange
    });

    const records = normalizeR2aRecords({
      trafficReport: fetched.trafficReport,
      goalReport: fetched.goalReport,
      importRunId,
      dateRange
    });
    const status = combinedStatus([
      fetched.plan.status,
      fetched.trafficReport.status,
      fetched.goalReport.status
    ], records);
    const summary = buildSummary({
      mode: normalizedMode,
      status,
      counterId: validation.counterId,
      dateRange,
      importRunId,
      plan: fetched.plan,
      trafficReport: fetched.trafficReport,
      goalReport: fetched.goalReport,
      records,
      errors: fetched.errors
    });

    if (normalizedMode === "write") {
      if (typeof withTransactionFn !== "function") {
        throw new Error("withTransactionFn is required for write mode.");
      }

      await withTransactionFn(async (db) => {
        await persistR2aImport({
          db,
          records,
          syncState: syncStateFromSummary({
            status,
            dateRange,
            rowsImported: records.length,
            safeErrorMessage: summary.safe_error_message,
            importRunId
          })
        });
      });
    }

    return summary;
  } catch (error) {
    const safeError = safeApiError(error, "import_failed");
    const summary = buildSummary({
      mode: normalizedMode,
      status: "failed",
      counterId: validation.counterId,
      dateRange,
      importRunId,
      plan: { goals: [], unavailable_goals: [] },
      trafficReport: null,
      goalReport: null,
      records: [],
      errors: [safeError]
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "failed",
          dateRange,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          importRunId
        })
      });
    }

    return summary;
  }
}

export async function runMetricaR2b({
  mode = "dry-run",
  env = process.env,
  fetchImpl = globalThis.fetch,
  withTransactionFn = null,
  now = new Date(),
  date1 = "",
  date2 = "",
  days = R2A_DEFAULT_DAYS,
  attribution = R2B_DEFAULT_ATTRIBUTION,
  limit = R2B_DEFAULT_LIMIT,
  maxPages = R2B_DEFAULT_MAX_PAGES,
  maxRows = R2B_DEFAULT_MAX_ROWS,
  landingMaxRows = R2B_LANDING_MAX_ROWS
} = {}) {
  const normalizedMode = mode === "write" ? "write" : "dry-run";
  const dateRange = resolveR2aDateRange({ now, date1, date2, days });
  const normalizedAttribution = normalizeAttribution(attribution);
  const normalizedLimit = Math.min(100000, Math.max(1, Number(limit) || R2B_DEFAULT_LIMIT));
  const normalizedMaxPages = Math.min(20, Math.max(1, Number(maxPages) || R2B_DEFAULT_MAX_PAGES));
  const normalizedMaxRows = Math.min(20000, Math.max(1, Number(maxRows) || R2B_DEFAULT_MAX_ROWS));
  const normalizedLandingMaxRows = Math.min(normalizedMaxRows, Math.max(1, Number(landingMaxRows) || R2B_LANDING_MAX_ROWS));
  const importRunId = `r2b_${new Date(now).toISOString().replace(/[:.]/g, "-")}_${randomUUID()}`;
  const validation = validateR2aEnv(env);
  const publicSiteUrl = env.PUBLIC_SITE_URL || "https://ecostroycontinent.ru";

  if (!validation.ok) {
    const errors = summarizeUnavailableEnv(validation.missing).errors;
    const summary = buildR2bSummary({
      mode: normalizedMode,
      status: "not_configured",
      counterId: validation.counterId,
      dateRange,
      importRunId,
      reports: [],
      records: [],
      errors,
      attribution: normalizedAttribution
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "not_configured",
          dateRange,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          importRunId,
          unmappedUrlCount: 0
        })
      });
    }

    return summary;
  }

  try {
    const fetched = await fetchR2bReports({
      env,
      fetchImpl,
      dateRange,
      attribution: normalizedAttribution,
      limit: normalizedLimit,
      maxPages: normalizedMaxPages,
      maxRows: normalizedMaxRows,
      landingMaxRows: normalizedLandingMaxRows
    });
    const records = normalizeR2bRecords({
      reports: fetched.reports,
      importRunId,
      publicSiteUrl
    });
    const status = fetched.status;
    const summaryBeforeWrite = buildR2bSummary({
      mode: normalizedMode,
      status,
      counterId: validation.counterId,
      dateRange,
      importRunId,
      reports: fetched.reports,
      records,
      errors: fetched.errors,
      attribution: normalizedAttribution
    });

    if (normalizedMode === "write") {
      if (typeof withTransactionFn !== "function") {
        throw new Error("withTransactionFn is required for write mode.");
      }

      let unmappedUrlCount = 0;
      await withTransactionFn(async (db) => {
        const persisted = await persistR2bImport({
          db,
          records,
          syncState: syncStateFromSummary({
            status,
            dateRange,
            rowsImported: records.length,
            safeErrorMessage: summaryBeforeWrite.safe_error_message,
            importRunId,
            unmappedUrlCount
          })
        });
        unmappedUrlCount = persisted.unmappedUrlCount;
      });

      return buildR2bSummary({
        mode: normalizedMode,
        status,
        counterId: validation.counterId,
        dateRange,
        importRunId,
        reports: fetched.reports,
        records,
        errors: fetched.errors,
        unmappedUrlCount,
        attribution: normalizedAttribution
      });
    }

    return summaryBeforeWrite;
  } catch (error) {
    const safeError = safeApiError(error, "r2b_import_failed");
    const summary = buildR2bSummary({
      mode: normalizedMode,
      status: "failed",
      counterId: validation.counterId,
      dateRange,
      importRunId,
      reports: [],
      records: [],
      errors: [safeError],
      attribution: normalizedAttribution
    });

    if (normalizedMode === "write") {
      await persistSyncStateOnly({
        withTransactionFn,
        syncState: syncStateFromSummary({
          status: "failed",
          dateRange,
          rowsImported: 0,
          safeErrorMessage: summary.safe_error_message,
          importRunId,
          unmappedUrlCount: 0
        })
      });
    }

    return summary;
  }
}
