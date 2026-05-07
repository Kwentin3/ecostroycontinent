import crypto from "node:crypto";

import { query } from "../db/client.js";
import { SIGNIFICANT_JOURNEY_EVENT_NAMES } from "./events.js";

function createTelemetryRecordId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function execute(db, text, params = []) {
  if (db?.query) {
    return db.query(text, params);
  }

  if (typeof db === "function") {
    return db(text, params);
  }

  return query(text, params);
}

function jsonb(value) {
  return JSON.stringify(value || {});
}

export async function recordTelemetryEvent(event, { db = query } = {}) {
  const id = event.id || createTelemetryRecordId("telemetry_event");
  const result = await execute(db, `
    INSERT INTO telemetry_events (
      id,
      event_name,
      event_version,
      event_category,
      occurred_at,
      received_at,
      session_id,
      page_path,
      page_title,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      entity_type,
      entity_id,
      entity_slug,
      placement,
      contact_channel,
      active_time_ms,
      max_scroll_depth,
      is_internal,
      is_test,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23::jsonb
    )
    RETURNING *
  `, [
    id,
    event.event_name,
    event.event_version,
    event.event_category,
    event.occurred_at,
    event.received_at,
    event.session_id,
    event.page_path,
    event.page_title || "",
    event.referrer || "",
    event.utm_source || "",
    event.utm_medium || "",
    event.utm_campaign || "",
    event.entity_type || null,
    event.entity_id || null,
    event.entity_slug || null,
    event.placement || null,
    event.contact_channel || null,
    event.active_time_ms ?? null,
    event.max_scroll_depth ?? null,
    Boolean(event.is_internal),
    Boolean(event.is_test),
    jsonb(event.metadata)
  ]);

  return result.rows[0];
}

export async function listPreviousSignificantEventsForSession({
  db = query,
  sessionId,
  excludeEventId,
  limit = 60
}) {
  const result = await execute(db, `
    SELECT
      id,
      event_name,
      event_category,
      occurred_at,
      session_id,
      page_path,
      entity_type,
      entity_id,
      entity_slug,
      placement,
      contact_channel,
      active_time_ms,
      max_scroll_depth,
      metadata
    FROM telemetry_events
    WHERE session_id = $1
      AND id <> $2
      AND event_name = ANY($3::text[])
    ORDER BY occurred_at DESC, created_at DESC
    LIMIT $4
  `, [
    sessionId,
    excludeEventId,
    SIGNIFICANT_JOURNEY_EVENT_NAMES,
    limit
  ]);

  return result.rows.reverse();
}

export async function getSessionEngagementSummary({
  db = query,
  sessionId,
  finalEventId
}) {
  const result = await execute(db, `
    SELECT
      COALESCE(SUM(active_time_ms), 0)::integer AS total_active_time_ms,
      COALESCE(MAX(max_scroll_depth), 0)::integer AS max_scroll_depth
    FROM telemetry_events
    WHERE session_id = $1
      AND id <> $2
  `, [sessionId, finalEventId]);

  return {
    total_active_time_ms: Number(result.rows[0]?.total_active_time_ms || 0),
    max_scroll_depth: Number(result.rows[0]?.max_scroll_depth || 0)
  };
}

export async function recordTelemetryContactJourney(journey, { db = query } = {}) {
  const id = journey.id || createTelemetryRecordId("contact_journey");
  const result = await execute(db, `
    INSERT INTO telemetry_contact_journeys (
      id,
      session_id,
      final_contact_event_id,
      final_contact_event_name,
      contact_channel,
      landing_page_path,
      final_page_path,
      final_entity_type,
      final_entity_id,
      previous_significant_events,
      total_active_time_ms,
      max_scroll_depth,
      is_internal,
      is_test
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10::jsonb, $11, $12, $13, $14
    )
    RETURNING *
  `, [
    id,
    journey.session_id,
    journey.final_contact_event_id,
    journey.final_contact_event_name,
    journey.contact_channel,
    journey.landing_page_path,
    journey.final_page_path,
    journey.final_entity_type || null,
    journey.final_entity_id || null,
    JSON.stringify(journey.previous_significant_events || []),
    journey.total_active_time_ms || 0,
    journey.max_scroll_depth || 0,
    Boolean(journey.is_internal),
    Boolean(journey.is_test)
  ]);

  return result.rows[0];
}

export async function getTelemetryDebugSummary({
  db = query,
  includeInternal = false,
  includeTest = false
} = {}) {
  const filters = [];

  if (!includeInternal) {
    filters.push("is_internal = FALSE");
  }

  if (!includeTest) {
    filters.push("is_test = FALSE");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const events = await execute(db, `
    SELECT event_name, COUNT(*)::integer AS count
    FROM telemetry_events
    ${whereClause}
    GROUP BY event_name
    ORDER BY event_name
  `);
  const journeys = await execute(db, `
    SELECT COUNT(*)::integer AS count
    FROM telemetry_contact_journeys
    ${whereClause}
  `);
  const diagnostic = await execute(db, `
    SELECT
      COUNT(*) FILTER (WHERE is_internal = TRUE)::integer AS internal_events,
      COUNT(*) FILTER (WHERE is_test = TRUE)::integer AS test_events
    FROM telemetry_events
  `);

  return {
    events_by_name: Object.fromEntries(events.rows.map((row) => [row.event_name, row.count])),
    contact_journey_count: Number(journeys.rows[0]?.count || 0),
    internal_events: Number(diagnostic.rows[0]?.internal_events || 0),
    test_events: Number(diagnostic.rows[0]?.test_events || 0),
    default_excludes_internal: !includeInternal,
    default_excludes_test: !includeTest
  };
}
