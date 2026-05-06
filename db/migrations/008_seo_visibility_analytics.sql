CREATE TABLE IF NOT EXISTS analytics_event (
  id TEXT PRIMARY KEY,
  event_fingerprint TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',
    'cta_view',
    'cta_click',
    'click_to_call',
    'click_to_telegram',
    'click_to_whatsapp',
    'contact_link_click',
    'form_start',
    'form_submit',
    'gallery_open',
    'faq_expand',
    'case_card_click',
    'service_link_click',
    'scroll_depth'
  )),
  occurred_at TIMESTAMPTZ NOT NULL,
  anonymous_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  published_revision_id TEXT,
  element_id TEXT,
  event_source TEXT NOT NULL DEFAULT 'first_party_public' CHECK (event_source IN (
    'first_party_public',
    'first_party_server',
    'imported_external',
    'system'
  )),
  source TEXT NOT NULL DEFAULT 'unknown',
  medium TEXT NOT NULL DEFAULT 'unknown',
  campaign TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'unknown' CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  viewport_width INTEGER,
  viewport_height INTEGER,
  viewport_bucket TEXT NOT NULL DEFAULT 'unknown',
  is_excluded BOOLEAN NOT NULL DEFAULT FALSE,
  exclusion_reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_event_occurred_at_idx
  ON analytics_event (occurred_at DESC);

CREATE INDEX IF NOT EXISTS analytics_event_page_idx
  ON analytics_event (page_path, occurred_at DESC);

CREATE INDEX IF NOT EXISTS analytics_event_entity_idx
  ON analytics_event (entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS analytics_event_business_idx
  ON analytics_event (page_path, event_type, occurred_at DESC)
  WHERE is_excluded = FALSE;

CREATE TABLE IF NOT EXISTS analytics_page_daily (
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  source TEXT NOT NULL DEFAULT 'unknown',
  medium TEXT NOT NULL DEFAULT 'unknown',
  campaign TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'unknown',
  event_type TEXT NOT NULL,
  element_id TEXT NOT NULL DEFAULT '',
  visits INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  intent_events INTEGER NOT NULL DEFAULT 0,
  primary_intent_events INTEGER NOT NULL DEFAULT 0,
  contact_actions INTEGER NOT NULL DEFAULT 0,
  cta_views INTEGER NOT NULL DEFAULT 0,
  cta_clicks INTEGER NOT NULL DEFAULT 0,
  phone_clicks INTEGER NOT NULL DEFAULT 0,
  messenger_clicks INTEGER NOT NULL DEFAULT 0,
  form_starts INTEGER NOT NULL DEFAULT 0,
  form_submits INTEGER NOT NULL DEFAULT 0,
  gallery_opens INTEGER NOT NULL DEFAULT 0,
  faq_expands INTEGER NOT NULL DEFAULT 0,
  case_clicks INTEGER NOT NULL DEFAULT 0,
  service_link_clicks INTEGER NOT NULL DEFAULT 0,
  scroll_depth_25 INTEGER NOT NULL DEFAULT 0,
  scroll_depth_50 INTEGER NOT NULL DEFAULT 0,
  scroll_depth_75 INTEGER NOT NULL DEFAULT 0,
  scroll_depth_100 INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, page_path, source, medium, campaign, device_type, event_type, element_id)
);

CREATE INDEX IF NOT EXISTS analytics_page_daily_page_idx
  ON analytics_page_daily (page_path, date DESC);

CREATE INDEX IF NOT EXISTS analytics_page_daily_entity_idx
  ON analytics_page_daily (entity_type, entity_id, date DESC);

CREATE TABLE IF NOT EXISTS external_search_visibility_daily (
  date DATE NOT NULL,
  source_system TEXT NOT NULL,
  search_engine TEXT NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  page_path TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(8, 6) NOT NULL DEFAULT 0,
  position NUMERIC(8, 2),
  device TEXT NOT NULL DEFAULT 'unknown',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  opportunity_type TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'medium',
  limitations TEXT[] NOT NULL DEFAULT '{}'::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, source_system, search_engine, query, page_path, device, country, region)
);

CREATE INDEX IF NOT EXISTS external_search_visibility_daily_page_idx
  ON external_search_visibility_daily (page_path, date DESC);

CREATE INDEX IF NOT EXISTS external_search_visibility_daily_source_idx
  ON external_search_visibility_daily (source_system, search_engine, date DESC);

CREATE TABLE IF NOT EXISTS analytics_source_sync_state (
  source_system TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN (
    'ok',
    'stale',
    'failed',
    'partial',
    'not_configured',
    'not_applicable',
    'not_ready'
  )),
  last_successful_at TIMESTAMPTZ,
  last_attempted_at TIMESTAMPTZ,
  imported_period_start DATE,
  imported_period_end DATE,
  safe_error_message TEXT NOT NULL DEFAULT '',
  unmapped_url_count INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_unmapped_url_diagnostic (
  id TEXT PRIMARY KEY,
  page_path TEXT NOT NULL,
  source_system TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 1,
  sample_referrer TEXT NOT NULL DEFAULT '',
  safe_reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mapped', 'ignored')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS analytics_unmapped_url_diagnostic_unique_open_idx
  ON analytics_unmapped_url_diagnostic (page_path, source_system)
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS seo_recommendation_state (
  recommendation_id TEXT PRIMARY KEY,
  issue_type TEXT NOT NULL,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  page_path TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  owner_role TEXT NOT NULL DEFAULT 'seo_manager',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'in_progress', 'done', 'dismissed')),
  next_check_date DATE,
  implemented_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  monitoring_started_at TIMESTAMPTZ,
  result_summary TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'medium',
  limitations TEXT[] NOT NULL DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_classified_content_change (
  classified_change_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_revision_id TEXT,
  new_revision_id TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  changed_scopes TEXT[] NOT NULL DEFAULT '{}'::text[],
  changed_fields TEXT[] NOT NULL DEFAULT '{}'::text[],
  change_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  change_summary TEXT NOT NULL DEFAULT '',
  related_recommendation_id TEXT,
  is_mixed_change BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_safety TEXT NOT NULL DEFAULT 'unknown',
  attribution_limitations TEXT[] NOT NULL DEFAULT '{}'::text[],
  monitoring_status TEXT NOT NULL DEFAULT 'not_started',
  before_period JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_period JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_sufficiency TEXT NOT NULL DEFAULT 'unknown',
  tracking_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_freshness_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_item_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_classified_content_change_entity_idx
  ON analytics_classified_content_change (entity_type, entity_id, published_at DESC);

CREATE TABLE IF NOT EXISTS analytics_tracking_change_history (
  id TEXT PRIMARY KEY,
  changed_at TIMESTAMPTZ NOT NULL,
  change_type TEXT NOT NULL,
  affected_events TEXT[] NOT NULL DEFAULT '{}'::text[],
  affected_pages TEXT[] NOT NULL DEFAULT '{}'::text[],
  description TEXT NOT NULL DEFAULT '',
  impact_on_metrics TEXT NOT NULL DEFAULT '',
  tracking_recently_changed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_tracking_change_history_changed_at_idx
  ON analytics_tracking_change_history (changed_at DESC);
