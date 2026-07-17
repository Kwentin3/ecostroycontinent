ALTER TABLE content_revisions
  ADD COLUMN IF NOT EXISTS content_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS superseded_by_revision_id TEXT REFERENCES content_revisions(id) ON DELETE SET NULL;

ALTER TABLE content_revisions
  DROP CONSTRAINT IF EXISTS content_revisions_state_check;

ALTER TABLE content_revisions
  ADD CONSTRAINT content_revisions_state_check
  CHECK (state IN ('draft', 'review', 'published', 'superseded'));

CREATE INDEX IF NOT EXISTS content_revisions_active_review_fingerprint_idx
  ON content_revisions (entity_id, state, content_fingerprint)
  WHERE state = 'review' AND superseded_by_revision_id IS NULL;

CREATE INDEX IF NOT EXISTS content_revisions_superseded_by_idx
  ON content_revisions (superseded_by_revision_id)
  WHERE superseded_by_revision_id IS NOT NULL;
