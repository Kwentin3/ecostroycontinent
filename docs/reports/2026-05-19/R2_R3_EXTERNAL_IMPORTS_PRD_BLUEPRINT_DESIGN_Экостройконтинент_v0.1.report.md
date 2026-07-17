# R2/R3 External Imports PRD + Blueprint Design Report

Проект: Экостройконтинент.
Домен: SEO Dashboard / Visibility / Analytics Foundation.
Дата: 2026-05-19.
Branch: `feat/r1-public-telemetry-metrica-mirror`.
Base commit at design time: `c24338fe532345432cd9144fc3c938b45e9c6b5f`.

## Executive Verdict

R2 and R3 are now documented as separate external enrichment domains.

Implementation was not started. No code, migrations, runtime config, UI, scheduled imports, secrets or production API flows were changed.

Strategic boundary is explicit:

- internal first-party telemetry remains operational source of truth;
- Yandex Metrica and Yandex Webmaster enrich project storage with external aggregate/search/indexation data;
- read model integration waits for R4 unless a future implementation explicitly scopes a safe source-state-only change.

## Documents Created

- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`

## Documents Updated

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

Updates made:

- added pointers to R2/R3 PRD and Blueprint drafts;
- changed next step to review/order selection before implementation;
- recorded that R2/R3 implementation has not started;
- reinforced that imported Yandex data is external enrichment, not operational truth.

## API Capabilities Checked

Official documentation checked on 2026-05-19:

R2 Metrica:

- Yandex Metrica Reporting API / stat API: `https://yandex.com/dev/metrika/stat/index`
- Dimensions and metrics: `https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all`
- Traffic dimensions: `https://yandex.com/dev/metrika/en/stat/attributes/visits/source`
- Quotas: `https://yandex.ru/dev/metrika/en/intro/quotas`

R3 Webmaster:

- Yandex Webmaster API overview: `https://yandex.com/dev/webmaster/doc/en/`
- Host information: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-id`
- Site summary: `https://yandex.com/dev/webmaster/doc/dg/reference/host-id-summary.html`
- In-search URL samples: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-indexing-insearch-samples`
- Search event samples: `https://yandex.com/dev/webmaster/doc/dg/reference/hosts-search-events-samples.html`
- Important URLs: `https://yandex.com/dev/webmaster/doc/en/reference/host-id-important-urls`
- Popular search queries: `https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular`
- Query history: `https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-history`
- Query analytics: `https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics`

## R2 Import Scope

R2 is designed to import aggregate Metrica data:

- visits;
- users, where supported by selected report;
- pageviews;
- traffic sources;
- search engines;
- devices;
- regions/countries;
- landing/start URLs, where stable dimensions are available;
- configured goal reaches for the 11 project goals;
- conversion metrics if available or later computable.

R2 explicitly excludes:

- raw logs/sessions;
- Webvisor/clickmap/session replay;
- ecommerce;
- direct UI -> Metrica API;
- using Metrica as truth for internal actions or Content Core context.

## R3 Import Scope

R3 is designed to import aggregate/search/indexation Webmaster data:

- host information and verified state;
- site/indexation summary where API supports it;
- indexed or in-search URL samples where API supports them;
- appeared/removed-in-search samples where API supports them;
- important URLs where configured/available;
- popular query and query/URL analytics aggregates where API supports them;
- unmapped URL diagnostics.

R3 explicitly excludes:

- Google Search Console parity;
- direct UI -> Webmaster API;
- user/session/lead attribution from query data;
- replacing Content Core published page truth;
- unsupported field fabrication.

## API Limitations Found

R2:

- exact dimension names and attribution model must be selected during implementation and verified by dry run;
- Metrica data may be delayed, so freshness thresholds must allow processing lag;
- high-cardinality dimensions can create large row sets;
- existing `analytics_page_daily` is likely insufficient for general external Metrica aggregates.

R3:

- some Webmaster URL endpoints return samples, not necessarily a complete page universe;
- query/search data is aggregate and delayed;
- query analytics date ranges have documented limits;
- some desired diagnostics may exist in UI but not in API form;
- host/indexation snapshots do not fit cleanly into `external_search_visibility_daily`.

## Future Migration Need

Likely yes.

R2 probably needs a dedicated external Metrica aggregate table or generalized external traffic aggregate table because `analytics_page_daily` lacks `source_system`, goal identity, region and flexible report dimensions.

R3 can use `external_search_visibility_daily` for genuine query/page/date visibility rows, but likely needs separate future tables for host snapshots, indexation summaries, URL samples, search event samples and important URL monitoring.

No migrations were created in this task.

## Open Questions

R2:

- exact import cadence and freshness threshold;
- first date range after delayed R1 Metrica stats visibility;
- exact dimension set and attribution prefix;
- goal conversion metric import vs R4 computation;
- storage table shape.

R3:

- first implementation target: host/indexation snapshot, query visibility, or both;
- important URL configuration status in the Webmaster account;
- exact URL/query endpoint availability against the verified host;
- freshness threshold;
- storage table shape for non-visibility records.

Shared:

- operator-triggered first vs scheduler-first;
- retention policy for imported aggregates;
- source-state-only read model exposure before R4, if any.

## Recommended Implementation Order

Recommended default:

1. R2 first after optional delayed Metrica stats visibility recheck, because R2 follows directly from R1 public counter/goal mirror and answers traffic/source/device/region/goal aggregate questions.
2. R3 second, or parallel with R2 if ownership and write sets are separated.

Fallback:

- If Metrica Reporting API stats remain delayed or insufficient for a useful first import, R3 can proceed first because Webmaster host is already verified and several host/query/indexation endpoints are documented.

Do not start R4 read model integration until at least one import domain has accepted project-storage rows and truthful source sync state.

## What Was Not Implemented

- No application code changes.
- No migrations.
- No UI changes.
- No runtime/env changes.
- No scheduled imports.
- No production API calls.
- No secrets touched or printed.
- No LLM or lead/intake work.
- No `docs/out` changes.

## Checks

Completed:

- `git diff --check` with new docs included via intent-to-add: passed; Git printed line-ending normalization warnings only.
- Docs-only file change verification including untracked files: passed.
- Changed-doc secret/token scan: passed.

Tests/build were not run because this is documentation-only work and runtime code was not changed.

## Git Status

Working tree intentionally contains documentation-only changes:

- modified `docs/AGENT_START_HERE.md`;
- modified `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`;
- modified `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`;
- new R2/R3 PRD and Blueprint documents;
- new `docs/reports/2026-05-19/R2_R3_EXTERNAL_IMPORTS_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`.
