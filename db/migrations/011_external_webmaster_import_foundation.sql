CREATE TABLE IF NOT EXISTS external_webmaster_host_snapshot (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'yandex_webmaster' CHECK (source_system = 'yandex_webmaster'),
  host_id TEXT NOT NULL,
  ascii_host_url TEXT NOT NULL DEFAULT '',
  unicode_host_url TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_state TEXT NOT NULL DEFAULT '',
  verification_type TEXT NOT NULL DEFAULT '',
  host_data_status TEXT NOT NULL DEFAULT '',
  host_display_name TEXT NOT NULL DEFAULT '',
  observed_date DATE NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_run_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT external_webmaster_host_snapshot_dedupe UNIQUE (
    source_system,
    host_id,
    observed_date
  )
);

CREATE INDEX IF NOT EXISTS external_webmaster_host_snapshot_host_date_idx
  ON external_webmaster_host_snapshot (host_id, observed_date DESC);

CREATE TABLE IF NOT EXISTS external_webmaster_indexation_snapshot (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'yandex_webmaster' CHECK (source_system = 'yandex_webmaster'),
  host_id TEXT NOT NULL,
  observed_date DATE NOT NULL,
  summary_type TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_run_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT external_webmaster_indexation_snapshot_dedupe UNIQUE (
    source_system,
    host_id,
    observed_date,
    summary_type
  )
);

CREATE INDEX IF NOT EXISTS external_webmaster_indexation_snapshot_host_date_idx
  ON external_webmaster_indexation_snapshot (host_id, observed_date DESC);

CREATE TABLE IF NOT EXISTS external_webmaster_url_sample (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'yandex_webmaster' CHECK (source_system = 'yandex_webmaster'),
  host_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'unmapped',
  observed_date DATE NOT NULL,
  sample_status TEXT NOT NULL DEFAULT '',
  http_code INTEGER,
  title TEXT NOT NULL DEFAULT '',
  last_access_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_run_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT external_webmaster_url_sample_dedupe UNIQUE (
    source_system,
    host_id,
    endpoint,
    normalized_url,
    observed_date
  )
);

CREATE INDEX IF NOT EXISTS external_webmaster_url_sample_page_idx
  ON external_webmaster_url_sample (page_path, observed_date DESC);

CREATE INDEX IF NOT EXISTS external_webmaster_url_sample_endpoint_idx
  ON external_webmaster_url_sample (endpoint, observed_date DESC);

CREATE TABLE IF NOT EXISTS external_webmaster_query_visibility_daily (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'yandex_webmaster' CHECK (source_system = 'yandex_webmaster'),
  host_id TEXT NOT NULL,
  date DATE NOT NULL,
  search_engine TEXT NOT NULL DEFAULT 'yandex' CHECK (search_engine = 'yandex'),
  query TEXT NOT NULL DEFAULT '',
  normalized_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  device TEXT NOT NULL DEFAULT 'all',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  ctr NUMERIC(8, 6) NOT NULL DEFAULT 0,
  average_position NUMERIC(8, 2),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_run_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT external_webmaster_query_visibility_daily_dedupe UNIQUE (
    source_system,
    host_id,
    date,
    query,
    normalized_url,
    device,
    country,
    region
  )
);

CREATE INDEX IF NOT EXISTS external_webmaster_query_visibility_daily_page_idx
  ON external_webmaster_query_visibility_daily (page_path, date DESC);

CREATE INDEX IF NOT EXISTS external_webmaster_query_visibility_daily_query_idx
  ON external_webmaster_query_visibility_daily (query, date DESC);
