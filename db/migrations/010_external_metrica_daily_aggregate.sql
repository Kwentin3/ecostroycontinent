CREATE TABLE IF NOT EXISTS external_metrica_daily_aggregate (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'yandex_metrica' CHECK (source_system = 'yandex_metrica'),
  date DATE NOT NULL,
  period_grain TEXT NOT NULL DEFAULT 'day' CHECK (period_grain = 'day'),
  report_type TEXT NOT NULL CHECK (report_type IN ('traffic_total', 'goal_reaches')),
  dimension_hash TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_key TEXT NOT NULL CHECK (metric_key IN ('visits', 'pageviews', 'users', 'goal_reaches')),
  metric_value NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (metric_value >= 0),
  goal_id TEXT NOT NULL DEFAULT '',
  goal_name TEXT NOT NULL DEFAULT '',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_run_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT external_metrica_daily_aggregate_dedupe UNIQUE (
    source_system,
    date,
    report_type,
    dimension_hash,
    metric_key,
    goal_id
  )
);

CREATE INDEX IF NOT EXISTS external_metrica_daily_aggregate_source_date_idx
  ON external_metrica_daily_aggregate (source_system, date DESC);

CREATE INDEX IF NOT EXISTS external_metrica_daily_aggregate_report_metric_date_idx
  ON external_metrica_daily_aggregate (report_type, metric_key, date DESC);

CREATE INDEX IF NOT EXISTS external_metrica_daily_aggregate_goal_date_idx
  ON external_metrica_daily_aggregate (goal_name, date DESC)
  WHERE goal_name <> '';
