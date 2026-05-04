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
