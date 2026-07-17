# R2/R3 External Imports Refinement Report

Проект: Экостройконтинент.
Домен: SEO Dashboard / Visibility / Analytics Foundation.
Дата: 2026-05-19.
Branch: `feat/r1-public-telemetry-metrica-mirror`.
Base commit at refinement time: `c24338fe532345432cd9144fc3c938b45e9c6b5f`.

## Executive Verdict

R2/R3 docs are refined for implementation planning.

The main change: R2 and R3 remain next external import domains, but the first implementation must not attempt the whole external import universe.

Recommended path:

```text
R2A -> R3A -> decide: deepen R2/R3 or move to R4
```

Internal first-party telemetry remains operational source of truth. Metrica and Webmaster remain external enrichment layers.

No code, migrations, runtime, UI, env/secrets, scheduled imports, read model wiring, LLM or lead/intake work was performed.

## Documents Reviewed

- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2_R3_EXTERNAL_IMPORTS_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R1_METRICA_PUBLIC_ENABLEMENT_AND_FINAL_SMOKE_Экостройконтинент_v0.1.report.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`

## Documents Changed

- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- this report.

## R2A Definition

R2A: `Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals`.

R2A should:

- check API access against the real counter;
- run dry-run without writes first;
- choose a minimal safe report plan;
- import a short bounded period after dry-run succeeds;
- write `analytics_source_sync_state` for `yandex_metrica`;
- import minimal aggregate rows;
- prove idempotency;
- prove safe errors;
- avoid scheduler-first implementation;
- avoid read model/UI changes.

Minimal R2A import set:

- visits total by date;
- pageviews total by date;
- users by date if reliably supported by the selected report;
- goal reaches for 11 configured goals by date;
- safe error message, row count and imported period in source state.

Later R2 slices:

- R2B: traffic sources, search engines, devices, regions, landing/start URLs.
- R2C: scheduled cadence, retention, freshness thresholds.
- R2D: reconciliation with internal telemetry if needed.

## R3A Definition

R3A: `Webmaster Host / Indexation / Query Visibility Dry Run`.

R3A should:

- check `host_id`;
- confirm verified state;
- dry-run endpoint capabilities before writes;
- choose a minimal endpoint set;
- import only a bounded snapshot/period after dry-run succeeds;
- write `analytics_source_sync_state` for `yandex_webmaster`;
- write only rows whose storage shape is understood;
- write unmapped URL diagnostics where URL data is imported;
- avoid scheduler-first implementation;
- avoid read model/UI changes.

Minimal R3A import set:

- host status / verification state snapshot;
- site summary if API returns it;
- in-search URL samples if API returns them;
- query analytics limited dry-run if API returns page/query rows;
- source state, safe errors, row count and imported period/snapshot timestamp.

Later R3 slices:

- R3B: query/page visibility import.
- R3C: important URLs and search event samples.
- R3D: scheduled cadence, retention and broader URL diagnostics.

## Storage Addendum Summary

Created `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.

Key decisions:

- `analytics_page_daily` is not enough for general Metrica external aggregates.
- `external_search_visibility_daily` fits genuine query/page/date visibility rows only.
- Webmaster host snapshots, indexation summaries, URL samples and important URLs need separate future storage if imported.
- R2A/R3A likely require future migrations, but no migration was created in this refinement.
- Existing `analytics_source_sync_state` and `analytics_unmapped_url_diagnostic` remain shared state/diagnostic primitives.

Suggested future keys:

- R2 aggregate: `source_system + date + report_type + dimension_hash + metric_key + goal_id`.
- R3 query visibility: `source_system + date + query + page_path/normalized_url + device + region/country`.
- R3 snapshot/sample: `source_system + endpoint + normalized_url + observed_at/import_period`.

## Recommended Implementation Order

Default:

1. R2A first.
2. R3A second.
3. After R2A/R3A acceptance, decide whether to deepen R2/R3 or start R4 read model integration.

Allowed alternative:

- R3A may go first if Metrica Reporting API stats remain delayed and the team wants to use verified Webmaster endpoints immediately.

R4 should start only after accepted imported rows and `analytics_source_sync_state` exist from at least one source.

## Why Not Implement All R2/R3 At Once

Reasons:

- Metrica dimensions can create high-cardinality BI-style row sets.
- Webmaster endpoints are heterogeneous: some are snapshots, some are samples, some are aggregate query reports.
- Current tables are not sufficient for all external shapes.
- API dry-run should gate schema decisions.
- Scheduler-first implementation would make failures harder to inspect.
- Read model/UX should not be shaped around unverified external data.

## Open Questions

- Exact R2A date range after Metrica processing delay.
- Exact R2A metric names and goal metric plan after API dry-run.
- Exact R2A table/migration shape.
- Exact R3A mandatory endpoint set after host dry-run.
- Whether R3A should persist query visibility in `external_search_visibility_daily` or create a dedicated table.
- Freshness thresholds for `yandex_metrica` and `yandex_webmaster`.
- Retention policy for imported external aggregates.

## What Was Not Implemented

- No application code.
- No migrations.
- No runtime/env changes.
- No UI changes.
- No real imports or API calls.
- No scheduled jobs.
- No read model changes.
- No LLM work.
- No lead/intake work.
- No `docs/out` deletions.

## Checks

Completed:

- `git diff --check` with untracked docs included via intent-to-add: passed; Git printed line-ending normalization warnings only.
- Docs-only file change verification including untracked files: passed.
- Changed-doc secret/token scan: passed.

Tests/build are not needed because this is documentation-only work and runtime code was not changed.

## Git Status

Working tree contains documentation changes only, including R2/R3 drafts from the previous design step plus this refinement.
