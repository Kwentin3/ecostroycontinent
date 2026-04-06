ALTER TABLE app_sessions
  ADD COLUMN IF NOT EXISTS workspace_memory_card JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE app_sessions
  ADD COLUMN IF NOT EXISTS workspace_memory_card_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
