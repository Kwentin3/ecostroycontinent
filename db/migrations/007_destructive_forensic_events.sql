CREATE TABLE IF NOT EXISTS destructive_forensic_events (
  id TEXT PRIMARY KEY,
  correlation_id TEXT NOT NULL,
  operation_kind TEXT NOT NULL,
  outcome TEXT NOT NULL,
  actor_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  root_entity_id TEXT,
  root_entity_type TEXT,
  root_entity_label TEXT,
  target_entity_id TEXT,
  target_entity_type TEXT,
  target_entity_label TEXT,
  affected_entity_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS destructive_forensic_events_created_at_idx
  ON destructive_forensic_events (created_at DESC);

CREATE INDEX IF NOT EXISTS destructive_forensic_events_correlation_idx
  ON destructive_forensic_events (correlation_id);

CREATE INDEX IF NOT EXISTS destructive_forensic_events_root_entity_idx
  ON destructive_forensic_events (root_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS destructive_forensic_events_target_entity_idx
  ON destructive_forensic_events (target_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS destructive_forensic_events_affected_entity_ids_gin
  ON destructive_forensic_events
  USING GIN (affected_entity_ids);
