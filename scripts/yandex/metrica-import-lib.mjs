import { createHash, randomUUID } from "node:crypto";

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

const EMPTY_DIMENSIONS = Object.freeze({});
const EMPTY_DIMENSIONS_HASH = hashStableJson(EMPTY_DIMENSIONS);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const RECOVERABLE_IMPORT_STATUSES = new Set(["ok", "partial"]);

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
  dimensions = "ym:s:date"
}) {
  const url = new URL(R2A_STAT_API_URL);

  url.searchParams.set("ids", counterId);
  url.searchParams.set("metrics", metrics.join(","));
  url.searchParams.set("dimensions", dimensions);
  url.searchParams.set("date1", dateRange.date1);
  url.searchParams.set("date2", dateRange.date2);
  url.searchParams.set("timezone", R2A_TIMEZONE_OFFSET);
  url.searchParams.set("accuracy", "full");
  url.searchParams.set("limit", "100000");

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
    ...normalized,
    safe_error_message: normalized.safe_error_message || "Yandex Metrica API request failed."
  };
}

async function fetchStatReport({
  counterId,
  token,
  dateRange,
  metrics,
  fetchImpl
}) {
  const url = buildStatUrl({
    counterId,
    dateRange,
    metrics: metrics.map((metric) => metric.apiMetric)
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
    sampled: Boolean(response?.sampled),
    sample_share: response?.sample_share ?? null,
    data_lag: response?.data_lag ?? null,
    totals: Array.isArray(response?.totals) ? response.totals.map(numericMetric) : []
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
        imported_at,
        import_run_id,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, NOW(), $12, $13::jsonb
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
      0,
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
    Array.from(RECOVERABLE_IMPORT_STATUSES)
  ]);
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

function syncStateFromSummary({ status, dateRange, rowsImported, safeErrorMessage, importRunId }) {
  return {
    status,
    imported_period_start: dateRange.date1,
    imported_period_end: dateRange.date2,
    safe_error_message: safeErrorMessage || "",
    rows_imported: rowsImported,
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
