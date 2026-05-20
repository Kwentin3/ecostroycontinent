import { createId } from "../utils/id.js";
import { query } from "../db/client.js";

function queryWithDb(db, sql, params = []) {
  return db?.query ? db.query(sql, params) : query(sql, params);
}

function isMissingAnalyticsRelation(error) {
  return error?.code === "42P01" || /relation .* does not exist/i.test(error?.message || "");
}

async function optionalRows(db, sql, params = []) {
  try {
    const result = await queryWithDb(db, sql, params);
    return result.rows || [];
  } catch (error) {
    if (isMissingAnalyticsRelation(error)) {
      return [];
    }

    throw error;
  }
}

export async function recordAnalyticsEvent(event, db) {
  const id = event.id || createId("analytics_event");
  const result = await queryWithDb(
    db,
    `
      INSERT INTO analytics_event (
        id,
        event_fingerprint,
        event_type,
        occurred_at,
        anonymous_id,
        session_id,
        page_path,
        entity_type,
        entity_id,
        published_revision_id,
        element_id,
        event_source,
        source,
        medium,
        campaign,
        referrer,
        device_type,
        viewport_width,
        viewport_height,
        viewport_bucket,
        is_excluded,
        exclusion_reason,
        metadata
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23
      )
      ON CONFLICT (event_fingerprint) DO NOTHING
      RETURNING id
    `,
    [
      id,
      event.event_fingerprint,
      event.event_type,
      event.occurred_at,
      event.anonymous_id,
      event.session_id,
      event.page_path,
      event.entity_type,
      event.entity_id,
      event.published_revision_id,
      event.element_id,
      event.event_source,
      event.source,
      event.medium,
      event.campaign,
      event.referrer,
      event.device_type,
      event.viewport_width,
      event.viewport_height,
      event.viewport_bucket,
      event.is_excluded,
      event.exclusion_reason,
      JSON.stringify(event.metadata || {})
    ]
  );

  return {
    stored: (result.rows || []).length > 0,
    id: result.rows?.[0]?.id || id
  };
}

export async function recordUnmappedUrlDiagnostic({ pagePath, sourceSystem = "first_party_events", referrer = "", reason = "" }, db) {
  const id = createId("unmapped_url");

  await queryWithDb(
    db,
    `
      INSERT INTO analytics_unmapped_url_diagnostic (
        id,
        page_path,
        source_system,
        sample_referrer,
        safe_reason
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (page_path, source_system)
      WHERE status = 'open'
      DO UPDATE SET
        last_seen_at = NOW(),
        hit_count = analytics_unmapped_url_diagnostic.hit_count + 1,
        sample_referrer = EXCLUDED.sample_referrer,
        safe_reason = EXCLUDED.safe_reason
    `,
    [id, pagePath, sourceSystem, referrer, reason]
  );

  return { id };
}

export async function listAnalyticsPageDaily({ startDate, endDate }, db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM analytics_page_daily
      WHERE date >= $1::date
        AND date <= $2::date
      ORDER BY date DESC, page_path ASC
    `,
    [startDate, endDate]
  );
}

export async function listExternalSearchVisibility({ startDate, endDate }, db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM external_search_visibility_daily
      WHERE date >= $1::date
        AND date <= $2::date
      ORDER BY date DESC, source_system ASC, page_path ASC
    `,
    [startDate, endDate]
  );
}

export async function listSourceSyncStates(db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM analytics_source_sync_state
      ORDER BY source_system ASC
    `
  );
}

export async function listUnmappedUrlDiagnostics({ limit = 20 } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM analytics_unmapped_url_diagnostic
      WHERE status = 'open'
      ORDER BY last_seen_at DESC
      LIMIT $1
    `,
    [limit]
  );
}

export async function listRecommendationStates(db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM seo_recommendation_state
      ORDER BY updated_at DESC
    `
  );
}

export async function listPersistedClassifiedContentChanges({ limit = 30 } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM analytics_classified_content_change
      ORDER BY published_at DESC
      LIMIT $1
    `,
    [limit]
  );
}

export async function listTrackingChangeHistory({ limit = 30 } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT *
      FROM analytics_tracking_change_history
      ORDER BY changed_at DESC
      LIMIT $1
    `,
    [limit]
  );
}

export async function getMetricaImportSummary({ startDate = null, endDate = null } = {}, db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        COUNT(*)::int AS total_rows,
        COUNT(*) FILTER (WHERE report_type = 'traffic_total')::int AS traffic_rows,
        COUNT(*) FILTER (WHERE report_type = 'goal_reaches')::int AS goal_rows,
        COUNT(*) FILTER (WHERE report_type IN ('traffic_source', 'source_detail', 'device', 'country', 'region', 'landing_url'))::int AS r2b_rows,
        COUNT(*) FILTER (WHERE metric_value <> 0)::int AS nonzero_rows,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT report_type ORDER BY report_type), NULL) AS report_types,
        MIN(date)::text AS min_date,
        MAX(date)::text AS max_date
      FROM external_metrica_daily_aggregate
      WHERE ($1::date IS NULL OR date >= $1::date)
        AND ($2::date IS NULL OR date <= $2::date)
    `,
    [startDate, endDate]
  );
  const row = rows[0] || {};
  const totalRows = Number(row.total_rows || 0);
  const nonzeroRows = Number(row.nonzero_rows || 0);

  return {
    total_rows: totalRows,
    traffic_rows: Number(row.traffic_rows || 0),
    goal_rows: Number(row.goal_rows || 0),
    r2b_rows: Number(row.r2b_rows || 0),
    nonzero_rows: nonzeroRows,
    all_values_zero: totalRows > 0 && nonzeroRows === 0,
    report_types: Array.isArray(row.report_types) ? row.report_types : [],
    min_date: row.min_date || null,
    max_date: row.max_date || null
  };
}

function metricPivotSql() {
  return `
    COALESCE(SUM(metric_value) FILTER (WHERE metric_key = 'visits'), 0)::float8 AS visits,
    COALESCE(SUM(metric_value) FILTER (WHERE metric_key = 'users'), 0)::float8 AS users,
    COALESCE(SUM(metric_value) FILTER (WHERE metric_key = 'pageviews'), 0)::float8 AS pageviews
  `;
}

// R4 external evidence helpers read compact project-owned storage only:
// no live Yandex API calls, raw external responses or secrets in this layer.
async function getMetricaReportTotals({ reportType, startDate = null, endDate = null } = {}, db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        COUNT(DISTINCT dimension_hash)::int AS row_count,
        MIN(date)::text AS period_start,
        MAX(date)::text AS period_end,
        ${metricPivotSql()}
      FROM external_metrica_daily_aggregate
      WHERE source_system = 'yandex_metrica'
        AND report_type = $1
        AND ($2::date IS NULL OR date >= $2::date)
        AND ($3::date IS NULL OR date <= $3::date)
    `,
    [reportType, startDate, endDate]
  );
  const row = rows[0] || {};

  return {
    row_count: Number(row.row_count || 0),
    period_start: row.period_start || null,
    period_end: row.period_end || null,
    visits: Number(row.visits || 0),
    users: Number(row.users || 0),
    pageviews: Number(row.pageviews || 0)
  };
}

async function listMetricaDimensionEvidence({ reportType, startDate = null, endDate = null, limit = 10, selectSql, groupSql, orderSql = "visits DESC, pageviews DESC" } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT
        ${selectSql},
        MIN(date)::text AS period_start,
        MAX(date)::text AS period_end,
        ${metricPivotSql()}
      FROM external_metrica_daily_aggregate
      WHERE source_system = 'yandex_metrica'
        AND report_type = $1
        AND ($2::date IS NULL OR date >= $2::date)
        AND ($3::date IS NULL OR date <= $3::date)
      GROUP BY ${groupSql}
      ORDER BY ${orderSql}
      LIMIT $4
    `,
    [reportType, startDate, endDate, limit]
  );
}

export async function getMetricaTrafficSourceEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  const [rows, totals] = await Promise.all([
    listMetricaDimensionEvidence({
      reportType: "traffic_source",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(NULLIF(dimensions->>'traffic_source', ''), 'unknown') AS traffic_source,
        COALESCE(NULLIF(dimensions->>'traffic_source_name', ''), NULLIF(dimensions->>'traffic_source', ''), 'unknown') AS traffic_source_name
      `,
      groupSql: "1, 2"
    }, db),
    getMetricaReportTotals({ reportType: "traffic_source", startDate, endDate }, db)
  ]);

  return { rows, totals };
}

export async function getMetricaSourceDetailEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  const [rows, totals] = await Promise.all([
    listMetricaDimensionEvidence({
      reportType: "source_detail",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(NULLIF(dimensions->>'traffic_source', ''), 'unknown') AS traffic_source,
        COALESCE(NULLIF(dimensions->>'traffic_source_name', ''), NULLIF(dimensions->>'traffic_source', ''), 'unknown') AS traffic_source_name,
        COALESCE(NULLIF(dimensions->>'source_engine', ''), 'unknown') AS source_engine,
        COALESCE(NULLIF(dimensions->>'source_engine_name', ''), NULLIF(dimensions->>'source_engine', ''), 'unknown') AS source_engine_name
      `,
      groupSql: "1, 2, 3, 4"
    }, db),
    getMetricaReportTotals({ reportType: "source_detail", startDate, endDate }, db)
  ]);

  return { rows, totals };
}

export async function getMetricaDeviceEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  const [rows, totals] = await Promise.all([
    listMetricaDimensionEvidence({
      reportType: "device",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(NULLIF(dimensions->>'device_category', ''), 'unknown') AS device_category,
        COALESCE(NULLIF(dimensions->>'device_category_name', ''), NULLIF(dimensions->>'device_category', ''), 'unknown') AS device_category_name
      `,
      groupSql: "1, 2"
    }, db),
    getMetricaReportTotals({ reportType: "device", startDate, endDate }, db)
  ]);

  return { rows, totals };
}

export async function getMetricaGeographyEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  const [countries, countryTotals, regions, regionTotals] = await Promise.all([
    listMetricaDimensionEvidence({
      reportType: "country",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(NULLIF(dimensions->>'country', ''), 'unknown') AS country,
        COALESCE(NULLIF(dimensions->>'country_name', ''), NULLIF(dimensions->>'country', ''), 'unknown') AS country_name
      `,
      groupSql: "1, 2"
    }, db),
    getMetricaReportTotals({ reportType: "country", startDate, endDate }, db),
    listMetricaDimensionEvidence({
      reportType: "region",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(NULLIF(dimensions->>'country', ''), 'unknown') AS country,
        COALESCE(NULLIF(dimensions->>'country_name', ''), NULLIF(dimensions->>'country', ''), 'unknown') AS country_name,
        COALESCE(NULLIF(dimensions->>'region_area', ''), 'unknown') AS region_area,
        COALESCE(NULLIF(dimensions->>'region_area_name', ''), NULLIF(dimensions->>'region_area', ''), 'unknown') AS region_area_name
      `,
      groupSql: "1, 2, 3, 4"
    }, db),
    getMetricaReportTotals({ reportType: "region", startDate, endDate }, db)
  ]);

  return {
    countries,
    country_totals: countryTotals,
    regions,
    region_totals: regionTotals
  };
}

export async function getMetricaLandingEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  const [rows, totals, counts] = await Promise.all([
    listMetricaDimensionEvidence({
      reportType: "landing_url",
      startDate,
      endDate,
      limit,
      selectSql: `
        COALESCE(page_path, dimensions->>'page_path', '/') AS page_path,
        COALESCE(normalized_url, dimensions->>'normalized_url', '') AS normalized_url,
        entity_type,
        entity_id
      `,
      groupSql: "1, 2, 3, 4"
    }, db),
    getMetricaReportTotals({ reportType: "landing_url", startDate, endDate }, db),
    optionalRows(
      db,
      `
        SELECT
          (COUNT(DISTINCT COALESCE(page_path, dimensions->>'page_path')) FILTER (WHERE entity_id IS NOT NULL AND entity_id <> ''))::int AS mapped_count,
          (COUNT(DISTINCT COALESCE(page_path, dimensions->>'page_path')) FILTER (WHERE entity_id IS NULL OR entity_id = ''))::int AS unmapped_count
        FROM external_metrica_daily_aggregate
        WHERE source_system = 'yandex_metrica'
          AND report_type = 'landing_url'
          AND ($1::date IS NULL OR date >= $1::date)
          AND ($2::date IS NULL OR date <= $2::date)
      `,
      [startDate, endDate]
    )
  ]);
  const countRow = counts[0] || {};

  return {
    rows,
    totals,
    mapped_count: Number(countRow.mapped_count || 0),
    unmapped_count: Number(countRow.unmapped_count || 0)
  };
}

export async function getLatestWebmasterHostSnapshot(db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        verified,
        verification_state,
        verification_type,
        host_data_status,
        observed_date::text AS observed_date,
        imported_at
      FROM external_webmaster_host_snapshot
      ORDER BY observed_date DESC, imported_at DESC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

export async function getLatestWebmasterIndexationSnapshot(db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        summary_type,
        metrics,
        observed_date::text AS observed_date,
        imported_at
      FROM external_webmaster_indexation_snapshot
      ORDER BY observed_date DESC, imported_at DESC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

export async function getWebmasterUrlSampleSummary(db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        COUNT(*)::int AS url_sample_count,
        COUNT(*) FILTER (WHERE resolution_status = 'resolved')::int AS resolved_url_sample_count
      FROM external_webmaster_url_sample
    `
  );
  const row = rows[0] || {};

  return {
    url_sample_count: Number(row.url_sample_count || 0),
    resolved_url_sample_count: Number(row.resolved_url_sample_count || 0)
  };
}

export async function getWebmasterQueryVisibilitySummary({ startDate = null, endDate = null } = {}, db) {
  const rows = await optionalRows(
    db,
    `
      SELECT
        COUNT(*)::int AS query_visibility_rows,
        COALESCE(SUM(impressions), 0)::bigint AS impressions,
        COALESCE(SUM(clicks), 0)::bigint AS clicks,
        MIN(date)::text AS min_date,
        MAX(date)::text AS max_date
      FROM external_webmaster_query_visibility_daily
      WHERE ($1::date IS NULL OR date >= $1::date)
        AND ($2::date IS NULL OR date <= $2::date)
    `,
    [startDate, endDate]
  );
  const row = rows[0] || {};

  return {
    query_visibility_rows: Number(row.query_visibility_rows || 0),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    min_date: row.min_date || null,
    max_date: row.max_date || null
  };
}

export async function getWebmasterUrlSampleEvidence({ limit = 10 } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT
        endpoint,
        normalized_url,
        page_path,
        entity_type,
        entity_id,
        resolution_status,
        observed_date::text AS observed_date,
        sample_status,
        http_code,
        title
      FROM external_webmaster_url_sample
      ORDER BY observed_date DESC, imported_at DESC, page_path ASC
      LIMIT $1
    `,
    [limit]
  );
}

export async function getWebmasterQueryVisibilityEvidence({ startDate = null, endDate = null, limit = 10 } = {}, db) {
  return optionalRows(
    db,
    `
      SELECT
        date::text AS date,
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
        ctr::float8 AS ctr,
        average_position::float8 AS average_position
      FROM external_webmaster_query_visibility_daily
      WHERE ($1::date IS NULL OR date >= $1::date)
        AND ($2::date IS NULL OR date <= $2::date)
      ORDER BY impressions DESC, clicks DESC, date DESC, page_path ASC
      LIMIT $3
    `,
    [startDate, endDate, limit]
  );
}
