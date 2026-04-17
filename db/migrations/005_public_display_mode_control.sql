CREATE TABLE IF NOT EXISTS site_display_mode_state (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  mode TEXT NOT NULL CHECK (mode IN ('published_only', 'mixed_placeholder', 'under_construction')),
  reason TEXT NOT NULL DEFAULT '',
  changed_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_display_mode_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  previous_mode TEXT NOT NULL CHECK (previous_mode IN ('published_only', 'mixed_placeholder', 'under_construction')),
  next_mode TEXT NOT NULL CHECK (next_mode IN ('published_only', 'mixed_placeholder', 'under_construction')),
  reason TEXT NOT NULL DEFAULT '',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_display_mode_audit_changed_at_idx
  ON site_display_mode_audit (changed_at DESC);

INSERT INTO site_display_mode_state (id, mode, reason)
VALUES (TRUE, 'published_only', 'default bootstrap mode')
ON CONFLICT (id) DO NOTHING;
