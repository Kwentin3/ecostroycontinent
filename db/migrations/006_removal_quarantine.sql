ALTER TABLE content_entities
  ADD COLUMN IF NOT EXISTS marked_for_removal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marked_for_removal_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS removal_note TEXT;

CREATE INDEX IF NOT EXISTS content_entities_marked_for_removal_idx
  ON content_entities (marked_for_removal_at)
  WHERE marked_for_removal_at IS NOT NULL;
