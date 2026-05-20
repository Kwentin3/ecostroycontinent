# SEO Dashboard Backend/Data Foundation Epic Closure

Дата: 2026-05-20
Проект: Экостройконтинент
Тип: executive closure summary
Ветка: `docs/minimal-seo-admin-panel-design`

## Executive Verdict

Backend/data-foundation эпик SEO Dashboard / Visibility / Analytics Foundation закрыт в bounded scope.

Система уже собирает first-party operational telemetry, импортирует принятые внешние агрегаты Яндекс Метрики и Яндекс Вебмастера в project-owned storage, поддерживает truthful `analytics_source_sync_state`, отдаёт analytics read model с `external_source_readiness` и `external_evidence`, и сохраняет границы источников истины.

Следующий домен должен быть не R5 recommendations и не BI, а минимальная операционная SEO-панель в админке: простая UI-поверхность, которая показывает уже собранные данные через read model.

## Closed Domains

- R0 Current State Baseline.
- R1 Public Telemetry Operational Measurement + Optional Metrica Goal Mirror.
- R2A Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals.
- R3A Webmaster Host / Indexation / Query Visibility Dry Run.
- R4-lite External Source State and Readiness Integration.
- R3B Webmaster Query / Page Visibility Import.
- R2B Metrica Traffic Source / Device / Region / Landing Import.
- R4 External Evidence Read Model Integration.

Fresh conformity reports remain the authoritative implementation audits. This document is only the final executive closure summary for future agents.

## Data Now Collected

Internal first-party telemetry:

- public page/action events through `/api/telemetry/events`;
- page views, CTA views/clicks, contact intent events, gallery opens, FAQ expands, case/service clicks where instrumented;
- internal/test/admin/bot/preview exclusion markers;
- contact journeys as intent snapshots, not lead records.

Yandex Metrica external aggregate enrichment:

- minimal daily traffic/goals from R2A;
- R2B traffic source, optional source detail, device, country, optional region and landing/start path aggregates;
- landing URL normalization and read-only Content Core route/entity mapping;
- unmapped landing diagnostics where applicable.

Yandex Webmaster external search/indexation evidence:

- host verification/status snapshots;
- indexation summaries;
- URL samples with read-only mapping;
- query/page visibility storage and source state, with valid zero-row accepted result for the current period.

Analytics read model:

- first-party overview and page-level aggregates;
- `external_source_readiness`;
- `external_evidence`;
- warnings, limitations and source diagnostics.

## Tables And Sources In Use

Core analytics/storage:

- `telemetry_events`;
- `telemetry_contact_journeys`;
- `analytics_event`;
- `analytics_page_daily`;
- `external_search_visibility_daily`;
- `analytics_source_sync_state`;
- `analytics_unmapped_url_diagnostic`;
- `seo_recommendation_state`;
- `analytics_classified_content_change`;
- `analytics_tracking_change_history`.

External import storage:

- `external_metrica_daily_aggregate`;
- `external_webmaster_host_snapshot`;
- `external_webmaster_indexation_snapshot`;
- `external_webmaster_url_sample`;
- `external_webmaster_query_visibility_daily`.

Sources:

- internal first-party telemetry: operational source of truth for public user actions;
- Content Core: source of truth for pages, routes, ownership and publications;
- Yandex Metrica: external aggregate enrichment;
- Yandex Webmaster: external search/indexation enrichment.

## Read Model Contract

The active contract is `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`.

Important available sections:

- `overview`;
- `traffic_sources`;
- `search_visibility`;
- `page_list`;
- `selected_page_detail`;
- `semantic_click_map`;
- `recommendations` as existing system output, not a new R5 layer;
- `evidence_items`;
- `analytics_history`;
- `external_source_readiness`;
- `external_evidence`;
- `source_diagnostics`;
- `warnings`;
- `limitations`.

The next UI domain should consume this read model only. It should not query SQL directly and should not call Yandex APIs.

## External Sources Connected

Yandex Metrica:

- counter `109037342`;
- external aggregate imports accepted;
- R2B accepted period `2026-05-17..2026-05-19`;
- accepted R2B evidence includes source, source detail, device, country, region and landing reports;
- low sample size remains explicit.

Yandex Webmaster:

- host verified;
- host/indexation/URL sample imports accepted;
- R3B query/page visibility import path accepted with zero query rows for `2026-05-04..2026-05-17`;
- zero query rows are not zero demand.

## Remaining Limitations

- No scheduled import cadence exists yet; imports are operator-triggered.
- Metrica R2B accepted data is low-volume external evidence.
- Webmaster query/page visibility currently has a valid zero-row result.
- Lead/intake source of truth does not exist; contact actions are intent signals only.
- Existing `/admin/visibility` is a technical surface, not a final minimal product panel.
- Recommendations exist as earlier deterministic system output, but R5 recommendation refinement is not implemented.
- LLM/copilot is not implemented.
- External sources can be delayed, sampled, thin or temporarily stale.

## Intentionally Not Done

- R5 recommendations.
- LLM/copilot.
- Lead/intake.
- Full BI warehouse or query builder.
- Scheduled imports.
- UX redesign.
- Browser-side Yandex Reporting/Webmaster API calls.
- Content Core mutations from analytics.
- Session/user/lead attribution from Metrica/Webmaster.
- Raw sessions/logs/Webvisor/clickmap/session replay.

## Why Next Domain Is Minimal SEO Admin Panel

The data foundation is now useful enough to show operational facts:

- whether traffic exists;
- how much traffic exists;
- where traffic came from;
- devices and geography;
- landing pages;
- internal actions/clicks;
- external source readiness;
- where data is thin, stale, zero or incomplete.

R5 recommendations would still be premature because current external evidence is low-volume and Webmaster query rows are absent. The safest next value is a minimal UI that explains the collected data without inventing actions or turning weak evidence into recommendations.

## Git Status

At start of this documentation route:

- branch: `docs/minimal-seo-admin-panel-design`;
- working tree was clean;
- runtime/code files were not changed for this closure pass.
