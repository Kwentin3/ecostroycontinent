CREATE INDEX IF NOT EXISTS audit_events_review_journal_recent_idx
  ON audit_events (created_at DESC)
  WHERE event_key IN (
    'review_requested',
    'owner_approved',
    'sent_back_with_comment',
    'owner_rejected',
    'review_superseded',
    'review_duplicate_requested'
  );
