CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'seo_manager', 'business_owner')),
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_entities (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('global_settings', 'media_asset', 'gallery', 'service', 'case', 'page')),
  locale TEXT NOT NULL DEFAULT 'ru',
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  active_published_revision_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_entities_global_settings_singleton_idx
  ON content_entities (entity_type)
  WHERE entity_type = 'global_settings';

CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft', 'review', 'published')),
  payload JSONB NOT NULL,
  change_class TEXT NOT NULL,
  change_intent TEXT NOT NULL,
  owner_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  owner_approval_status TEXT NOT NULL CHECK (owner_approval_status IN ('not_required', 'pending', 'approved', 'rejected')) DEFAULT 'not_required',
  owner_approved_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  owner_approved_at TIMESTAMPTZ,
  review_comment TEXT,
  preview_status TEXT NOT NULL CHECK (preview_status IN ('preview_renderable', 'preview_unavailable')) DEFAULT 'preview_renderable',
  preview_failure_reason TEXT,
  ai_involvement BOOLEAN NOT NULL DEFAULT FALSE,
  ai_source_basis TEXT CHECK (ai_source_basis IN ('from_current_entity_only', 'from_linked_entities', 'from_published_content', 'manual_prompt_only')),
  created_by TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  updated_by TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_id, revision_number)
);

ALTER TABLE content_entities
  ADD CONSTRAINT content_entities_active_revision_fk
  FOREIGN KEY (active_published_revision_id) REFERENCES content_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS content_revisions_entity_idx ON content_revisions (entity_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS content_revisions_state_idx ON content_revisions (state);

CREATE TABLE IF NOT EXISTS publish_obligations (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL REFERENCES content_revisions(id) ON DELETE CASCADE,
  obligation_type TEXT NOT NULL CHECK (obligation_type IN ('redirect_required', 'revalidation_required', 'sitemap_update_required', 'canonical_url_check_required')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  entity_id TEXT REFERENCES content_entities(id) ON DELETE CASCADE,
  revision_id TEXT REFERENCES content_revisions(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  event_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
