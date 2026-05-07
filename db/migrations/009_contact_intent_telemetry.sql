CREATE TABLE IF NOT EXISTS telemetry_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'page_viewed',
    'page_engagement_recorded',
    'service_card_opened',
    'case_card_opened',
    'gallery_opened',
    'cta_clicked',
    'phone_clicked',
    'email_clicked',
    'messenger_clicked',
    'contact_journey_created'
  )),
  event_version TEXT NOT NULL DEFAULT '1.0',
  event_category TEXT NOT NULL CHECK (event_category IN (
    'interest',
    'engagement',
    'contact_intent',
    'system'
  )),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  entity_type TEXT,
  entity_id TEXT,
  entity_slug TEXT,
  placement TEXT,
  contact_channel TEXT,
  active_time_ms INTEGER CHECK (active_time_ms IS NULL OR active_time_ms BETWEEN 0 AND 1800000),
  max_scroll_depth INTEGER CHECK (max_scroll_depth IS NULL OR max_scroll_depth BETWEEN 0 AND 100),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  is_test BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telemetry_events_occurred_at_idx
  ON telemetry_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_events_session_occurred_idx
  ON telemetry_events (session_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_events_page_occurred_idx
  ON telemetry_events (page_path, occurred_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_events_entity_occurred_idx
  ON telemetry_events (entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_events_default_reports_idx
  ON telemetry_events (page_path, event_name, occurred_at DESC)
  WHERE is_internal = FALSE AND is_test = FALSE;

CREATE TABLE IF NOT EXISTS telemetry_contact_journeys (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  final_contact_event_id TEXT REFERENCES telemetry_events(id) ON DELETE SET NULL,
  final_contact_event_name TEXT NOT NULL CHECK (final_contact_event_name IN (
    'phone_clicked',
    'email_clicked',
    'messenger_clicked'
  )),
  contact_channel TEXT NOT NULL,
  landing_page_path TEXT NOT NULL,
  final_page_path TEXT NOT NULL,
  final_entity_type TEXT,
  final_entity_id TEXT,
  previous_significant_events JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(previous_significant_events) = 'array'),
  total_active_time_ms INTEGER NOT NULL DEFAULT 0 CHECK (total_active_time_ms >= 0),
  max_scroll_depth INTEGER NOT NULL DEFAULT 0 CHECK (max_scroll_depth BETWEEN 0 AND 100),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  is_test BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telemetry_contact_journeys_created_idx
  ON telemetry_contact_journeys (created_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_contact_journeys_session_idx
  ON telemetry_contact_journeys (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS telemetry_contact_journeys_final_event_idx
  ON telemetry_contact_journeys (final_contact_event_id);

CREATE INDEX IF NOT EXISTS telemetry_contact_journeys_default_reports_idx
  ON telemetry_contact_journeys (final_page_path, contact_channel, created_at DESC)
  WHERE is_internal = FALSE AND is_test = FALSE;
