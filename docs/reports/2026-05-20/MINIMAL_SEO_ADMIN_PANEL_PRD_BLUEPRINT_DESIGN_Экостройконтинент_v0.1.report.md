# Minimal SEO Admin Panel PRD / Blueprint Design Report

Дата: 2026-05-20
Проект: Экостройконтинент
Тип: documentation / product design / architecture planning
Ветка: `docs/minimal-seo-admin-panel-design`

## Executive Verdict

Backend/data-foundation epic is closed, and the next domain is designed as `Minimal SEO Admin Panel / Минимальная операционная SEO-панель в админке`.

The next implementation should not start with R5 recommendations, LLM, lead/intake, scheduler or BI. It should make `/admin/visibility` useful as a simple operational panel that shows already collected analytics read model data: traffic, sources, devices, geography, landings, internal actions, Webmaster state and data limitations.

## Documents Studied

Core:

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`

Fresh closure reports:

- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-20/R2B_METRICA_TRAFFIC_SOURCE_DEVICE_REGION_LANDING_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-20/R2B_METRICA_TRAFFIC_SOURCE_DEVICE_REGION_LANDING_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-20/R4_EXTERNAL_EVIDENCE_READ_MODEL_INTEGRATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-20/R4_EXTERNAL_EVIDENCE_READ_MODEL_INTEGRATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`

Read-only code zones checked:

- `lib/analytics/read-model.js`
- `lib/analytics/repository.js`
- `app/api/admin/visibility/read-model/route.js`
- `components/admin/SeoVisibilityDashboard.js`
- `components/public/AnalyticsTracker.js`
- `lib/telemetry/*`
- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `db/migrations/011_external_webmaster_import_foundation.sql`
- `db/migrations/012_external_metrica_r2b_dimensions.sql`

## Documents Created

- `docs/reports/2026-05-20/SEO_DASHBOARD_BACKEND_DATA_FOUNDATION_EPIC_CLOSURE_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/PRD_Minimal_SEO_Admin_Panel_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_Minimal_SEO_Admin_Panel_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-20/MINIMAL_SEO_ADMIN_PANEL_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`

## Documents Updated

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

## Why R5 Is Deferred

R5 is deferred because:

- Metrica R2B accepted evidence is low-volume;
- Webmaster R3B accepted period returned zero query visibility rows;
- current need is understanding collected facts, not generating work;
- recommendation rules need sample-size guards and stronger evidence;
- zero query rows must not become zero demand, low CTR or opportunity claims;
- lead/intake does not exist and contact actions are not leads.

## Why Minimal GUI Is Next

The system now has enough backend/data foundation to answer basic operational questions:

- how much first-party traffic exists;
- which internal actions were captured;
- what external Metrica says about source/device/geo/landing;
- what Webmaster says about host/indexation/URL/query state;
- whether sources are fresh, stale, failed, thin, zero or incomplete.

The missing piece is a simple admin-facing presentation of these facts. This is lower risk and higher immediate utility than R5, BI, LLM or scheduler work.

## Proposed Panel Sections

1. Top summary:
   - period;
   - first-party visits/actions;
   - source states/freshness;
   - limitation count.

2. Traffic composition:
   - Metrica traffic sources;
   - source details;
   - devices;
   - countries/regions.

3. Landing pages:
   - landing paths/URLs;
   - mapped Content Core route/entity;
   - visits/users/pageviews;
   - mapped/unmapped count.

4. Internal user actions:
   - contact actions;
   - CTA views/clicks;
   - semantic click map;
   - gallery/FAQ/case/service interactions where available.

5. Search / Webmaster:
   - host verified/status;
   - searchable/excluded pages;
   - site problem counts;
   - URL samples;
   - query visibility state and zero-row limitation.

6. Data limitations:
   - low sample size;
   - zero external values;
   - absent query rows;
   - stale/failed/not_configured sources;
   - missing lead domain;
   - external-not-operational-truth warnings.

## What Was Not Implemented

This task was documentation-only. It did not:

- change runtime files;
- change UI;
- change read model code;
- add migrations;
- run imports;
- add scheduler;
- add LLM;
- add lead/intake;
- add R5 recommendations;
- touch `docs/out` deletions.

## Git Status

Documentation route branch: `docs/minimal-seo-admin-panel-design`.

Expected changed files are docs only:

- closure report;
- Minimal SEO Admin Panel PRD;
- Minimal SEO Admin Panel Blueprint;
- roadmap update;
- handoff update;
- `AGENT_START_HERE` update;
- this design report.

Verification required for closure:

- `git diff --check`;
- confirm no runtime files changed.
