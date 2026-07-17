# R4-lite PRD/Blueprint Design Report

Date: 2026-05-19
Branch: `docs/r4-lite-prd-blueprint`
Task type: documentation / architecture / planning only

## Executive Verdict

R4-lite design is complete.

Created PRD and Blueprint for `R4-lite. External Source State and Readiness Integration`. The design explicitly keeps this slice narrower than full R4:

- source-state/readiness only;
- compact external import summaries;
- explicit limitations for weak/zero/empty external data;
- no recommendations from Metrica zeros;
- no low CTR/query recommendations from absent Webmaster query rows;
- no Yandex API calls in read model request path.

Full R4 remains deferred until stronger external evidence exists, likely after R3B query/page visibility and/or R2B source/device/landing imports.

## Documents Reviewed

- `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`

Code areas reviewed read-only:

- `lib/analytics/read-model.js`
- `app/api/admin/visibility/read-model/route.js`
- `components/admin/SeoVisibilityDashboard.js`
- `lib/analytics/repository.js`
- `lib/analytics/constants.js`
- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `db/migrations/011_external_webmaster_import_foundation.sql`
- `scripts/yandex/metrica-import-lib.mjs`
- `scripts/yandex/webmaster-import-lib.mjs`

## External References Checked

Used official Yandex docs only for narrow design context:

- Yandex Metrica Reporting API table endpoint: https://yandex.com/dev/metrika/en/stat/openapi/data
- Yandex Webmaster API documentation: https://yandex.com/dev/webmaster/doc/en/

Relevant design implication:

- external analytics APIs have their own availability, delay, sampling and response-shape constraints;
- R4-lite should surface source readiness and limitations instead of treating imported external rows as operational truth.

## Documents Created

- `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`

## Documents Updated

- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`

## Why Full R4 Was Not Chosen

The readiness audit shows current external data is technically healthy but analytically thin:

- R2A Metrica imported 42 rows for `2026-05-16..2026-05-18`, all metric values zero;
- R3A Webmaster imported host/indexation/URL sample rows, but query visibility rows are zero;
- full R4 would risk showing weak external data as meaningful traffic/search evidence;
- SEO Manager value from full recommendations would be low and potentially misleading.

## What R4-lite Is

R4-lite is a small read-model readiness slice:

- expose `yandex_metrica` source state;
- expose `yandex_webmaster` source state;
- expose imported periods, rows, last success and safe errors;
- expose Metrica all-zero limitation;
- expose Webmaster host/indexation summary and URL sample counts;
- expose Webmaster query visibility empty state;
- keep external source data labeled as enrichment/readiness.

## What R4-lite Is Not

R4-lite is not:

- full external metrics/evidence integration;
- traffic/source/device/region/landing import;
- query/page visibility import;
- recommendation engine update;
- UI redesign;
- scheduled imports;
- LLM;
- lead/intake;
- direct UI/read model path to Yandex APIs.

## Proposed Contract

Blueprint proposes a compact read model block:

```text
external_source_readiness
  yandex_metrica
    status / timestamps / imported period / rows / freshness
    limitations
    imported_summary
  yandex_webmaster
    status / timestamps / imported period / rows / freshness
    limitations
    imported_summary
```

Implementation may place this under `source_diagnostics.external_readiness` instead if that creates less DTO churn. The semantics must stay the same.

## Open Questions

1. Should implementation add a top-level `external_source_readiness` block or nest under `source_diagnostics`?
2. Should current `/admin/visibility` render the new readiness block, or should R4-lite stop at DTO/API first?
3. What exact freshness thresholds should be final after more operational history?
4. Should `source ok` and `data actionability` be visually separated in a later UI refinement?
5. Should R3B be prioritized immediately after R4-lite for real query/page evidence?

## Recommended Next Step

Recommended next implementation slice:

```text
R4-lite. External Source State and Readiness Integration
```

Implementation should follow the PRD/Blueprint and remain strict:

- source-state/readiness only;
- no primary metrics from Metrica zeros;
- no query/CTR recommendations from absent Webmaster query rows;
- no new imports;
- no scheduled jobs;
- no live Yandex API calls in request path.

Recommended next data slice after R4-lite:

```text
R3B. Webmaster query/page visibility import
```

Reason: SEO Manager value depends more on real query/page visibility than on showing additional Metrica dimensions while Metrica totals remain zero.

## What Was Not Implemented

- No code changes.
- No migrations.
- No runtime changes.
- No UI changes.
- No read model connection to new tables.
- No imports.
- No scheduled jobs.
- No LLM or lead/intake work.
- No `docs/out` changes.

## Checks

Planned verification for this documentation-only task:

- `git diff --check`;
- secret/token scan over created/updated docs;
- confirm changed files are docs only;
- tests/build not required because runtime code is not changed.

## Git Status

At report creation, working tree contains only intended docs changes on `docs/r4-lite-prd-blueprint`.
