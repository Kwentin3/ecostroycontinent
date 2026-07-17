# R2B Metrica Traffic Source / Device / Region / Landing PRD/Blueprint Design Report

Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Дата: 2026-05-19
Тип: documentation / architecture / planning only

## Executive Verdict

R2B design foundation is prepared. The new PRD and Blueprint define R2B as a bounded external Metrica aggregate import slice for traffic source, device, country/region and landing/start URL reports.

R2B remains external aggregate enrichment. It does not replace internal first-party telemetry, does not change read model/UI, does not add scheduler, does not import raw sessions/logs and does not make Metrica a source of truth for user actions, Content Core, leads or recommendations.

Recommended next step: review the R2B PRD/Blueprint, then implement R2B only if approved. Full R4 should still wait for richer accepted external aggregates.

## Documents Reviewed

- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2_R3_EXTERNAL_IMPORTS_REFINEMENT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_DOMAIN_CLOSURE_DETAILED_REPORT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

Code/migration files were inspected read-only for architecture fit:

- `scripts/yandex/import-metrica-aggregates.mjs`
- `scripts/yandex/metrica-import-lib.mjs`
- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `lib/analytics/read-model.js`
- `lib/analytics/repository.js`
- `package.json`

## Documents Created

- `docs/product-ux/PRD_R2B_Metrica_Traffic_Source_Device_Region_Landing_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2B_Metrica_Traffic_Source_Device_Region_Landing_Import_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2B_METRICA_TRAFFIC_SOURCE_DEVICE_REGION_LANDING_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`

## Documents Updated

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

Updates state that R2B PRD/Blueprint drafts are created, implementation has not started, R3B is closed with valid zero-row result, R4-lite is closed, and the next step is review/approval before implementation.

## Official API Capabilities Checked

Official Yandex Metrica sources checked:

- Reporting API introduction: https://yandex.com/dev/metrika/en/stat/
- Table endpoint `/stat/v1/data`: https://yandex.com/dev/metrika/en/stat/openapi/data
- Dimensions/metrics list: https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all
- Traffic source dimensions: https://yandex.com/dev/metrika/en/stat/attributes/visits/source
- Geography preset: https://yandex.com/dev/metrika/en/stat/presets/visitors/preset_geo
- Parametrization/attribution: https://yandex.com/dev/metrika/en/stat/param
- Object IDs examples: https://yandex.com/dev/metrika/en/stat/get-id

Confirmed for design:

- endpoint: `GET /stat/v1/data`;
- request shape: `ids`, `metrics`, `dimensions`, `date1`, `date2`, `filters`, `sort`, `limit`, `offset`, `accuracy`, `lang`, `timezone`;
- response metadata: `total_rows`, `sampled`, `sample_share`, `sample_size`, `sample_space`, `contains_sensitive_data`, `data_lag`, `totals`;
- dimensions: `ym:s:date`, `ym:s:<attribution>TrafficSource`, `ym:s:<attribution>SourceEngine`, `ym:s:deviceCategory`, `ym:s:regionCountry`, `ym:s:regionArea`, `ym:s:startURLPath`, `ym:s:startURLPathFull`;
- metrics: `ym:s:visits`, `ym:s:users`, `ym:s:pageviews`, and existing goal pattern `ym:s:goal<goalId>reaches`.

Implementation must still run real-counter dry-run because official compatibility can still fail by report combination, counter settings, sampling, cardinality or data availability.

## Proposed Report Plan

R2B should use separate bounded reports, not one cross-product report.

1. Traffic source report:
   - dimensions: `ym:s:date`, `ym:s:<attribution>TrafficSource`;
   - optional detail: add `ym:s:<attribution>SourceEngine` only after dry-run confirms safe row count;
   - metrics: visits/users/pageviews.

2. Device report:
   - dimensions: `ym:s:date`, `ym:s:deviceCategory`;
   - metrics: visits/users/pageviews.

3. Geography report:
   - first implementation: `ym:s:date`, `ym:s:regionCountry`;
   - optional region deepening: add `ym:s:regionArea` if row count is safe;
   - city is not recommended for first R2B.

4. Landing report:
   - preferred dimensions: `ym:s:date`, `ym:s:startURLPath`;
   - alternative: `ym:s:startURLPathFull` only if needed and normalized;
   - metrics: visits/users/pageviews.

Goal reaches should stay in R2A daily goal reports by default. R2B should not multiply 11 goals across source/device/region/landing dimensions unless dry-run proves low cardinality and product explicitly approves.

## Storage Direction

Current `external_metrica_daily_aggregate` is the right conceptual target, but current migration `010` is R2A-constrained:

- `report_type` only allows `traffic_total` and `goal_reaches`;
- no first-class `normalized_url`, `page_path`, `entity_type`, `entity_id`;
- `dimensions jsonb` is flexible and should remain the main normalized dimension tuple.

R2B implementation will likely need a migration to:

- widen `report_type` for `traffic_source`, `source_detail`, `device`, `country`, `region`, `landing_url`;
- optionally add first-class landing mapping fields for future R4 queries;
- preserve R2A rows and dedupe key behavior.

Recommended idempotency key remains:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

## Cardinality Strategy

R2B must require:

- dry-run before write;
- bounded completed date range;
- row-count estimate per report;
- max rows per report and max pages;
- pagination with `limit`/`offset`;
- partial/skipped state for oversized reports;
- country before region;
- landing path before full landing URL;
- no combined source+device+region+landing report in the first implementation.

## Key Limitations

- Metrica remains delayed/external and can disagree with internal telemetry.
- Source attribution model must be explicit; Blueprint recommends `lastsign` as initial default, but product can choose otherwise.
- `users` metric may be incompatible in some report shape; implementation should retry without it and mark limitation.
- Sampling/limited disclosure can affect usefulness.
- Landing URL mapping is best-effort; unmapped URLs are diagnostics only.
- R2B should not create recommendations or full read model evidence by itself.

## Open Questions

- Confirm product attribution model: `lastsign` vs `last` vs another official model.
- Confirm first canonical date range for R2B acceptance.
- Decide whether region is in first implementation or country-only first.
- Decide whether landing report should use path-only or full path with query stripping.
- Decide exact max-row thresholds.
- Decide whether sampling metadata should become first-class in storage/readiness.

## What Was Not Implemented

- No code changes.
- No migration.
- No runtime/env changes.
- No UI/read model changes.
- No production import/dry-run command was executed.
- No scheduler was added.
- No LLM or lead/intake work.
- No `docs/out` changes.

## Checks

Completed checks for this documentation-only task:

- `git diff --check` passed. Git reported line-ending warnings for existing markdown files, but no whitespace errors.
- Changed-file verification showed only `docs/*` paths.
- Secret/token scan across created/updated docs found no OAuth token, refresh token, client secret, Authorization bearer value or `YANDEX_*` secret assignment.
- Runtime code, migrations, UI, read model, env and scheduler files were not changed.
- Tests/build were not run because this task changed documentation only.

## Git Status

Pre-commit working tree contains documentation-only changes:

- new R2B PRD;
- new R2B Blueprint;
- new R2B design report;
- roadmap/handoff/start-here updates.

Final clean status is verified after commit in the assistant response.