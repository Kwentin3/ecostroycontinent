ALTER TABLE external_metrica_daily_aggregate
  DROP CONSTRAINT IF EXISTS external_metrica_daily_aggregate_report_type_check;

ALTER TABLE external_metrica_daily_aggregate
  ADD CONSTRAINT external_metrica_daily_aggregate_report_type_check
  CHECK (report_type IN (
    'traffic_total',
    'goal_reaches',
    'traffic_source',
    'source_detail',
    'device',
    'country',
    'region',
    'landing_url'
  ));

ALTER TABLE external_metrica_daily_aggregate
  ADD COLUMN IF NOT EXISTS normalized_url TEXT,
  ADD COLUMN IF NOT EXISTS page_path TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT;

CREATE INDEX IF NOT EXISTS external_metrica_daily_aggregate_landing_path_idx
  ON external_metrica_daily_aggregate (page_path, date DESC)
  WHERE report_type = 'landing_url' AND page_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS external_metrica_daily_aggregate_r2b_report_date_idx
  ON external_metrica_daily_aggregate (report_type, date DESC)
  WHERE report_type IN ('traffic_source', 'source_detail', 'device', 'country', 'region', 'landing_url');
