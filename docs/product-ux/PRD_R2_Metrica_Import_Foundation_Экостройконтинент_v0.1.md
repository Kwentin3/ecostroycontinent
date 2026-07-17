# PRD R2. Metrica Import Foundation

Русское название: Импорт агрегатов Яндекс Метрики.

Проект: Экостройконтинент.
Домен: SEO Dashboard / Visibility / Analytics Foundation.
Статус: draft for review; implementation not started.
Дата: 2026-05-19.

## 1. Purpose

R2 задает продуктовые границы импорта агрегированных данных Яндекс Метрики в project-owned storage.

Документ нужен, чтобы следующий implementation slice не смешал импорт Метрики с read model R4, UX/UI, scheduled Webmaster imports, lead/intake или LLM.

## 2. Problem Statement

R1 закрыл публичную операционную telemetry path: действия пользователей идут через `/api/telemetry/events`, сохраняются внутри проекта и остаются operational source of truth. Публичный счетчик Метрики включен как optional external mirror with conservative options.

Текущий разрыв после R1:

- Метрика уже собирает внешний слой визитов и goals, но проект пока не импортирует агрегаты Метрики в собственное хранилище.
- `/admin/visibility` и analytics read model не должны ходить напрямую в API Метрики.
- Без import foundation невозможно надежно показывать freshness, stale/failed/partial states и сравнивать external goal aggregates с internal telemetry.
- Scheduled/periodic imports нельзя строить "по памяти": нужно заранее определить aggregate-only scope, storage direction, idempotency and safe error semantics.

## 3. Product Goal

R2 должен подготовить проект к тому, чтобы получать агрегированные данные Яндекс Метрики в project storage как external enrichment layer.

Цель фазы:

- импортировать агрегаты визитов, пользователей, просмотров, источников, устройств, регионов, landing URLs и целей, если эти показатели доступны через Reporting API;
- хранить sync state для `yandex_metrica`: `ok`, `stale`, `failed`, `partial`, `not_configured`;
- не зависеть от live-запросов UI к Метрике;
- не превращать Метрику в source of truth для внутренних действий пользователя;
- подготовить данные для будущего R4 read model integration.

## 4. Users / Stakeholders

- SEO Manager: видит внешние источники трафика, устройства, регионы и goal aggregates.
- Superadmin: видит состояние источника, ошибки импорта и freshness.
- Future analytics/read model consumers: получают внешние агрегаты только через проектный read model.
- Business Owner: косвенно использует внешние сводки в будущих отчетах.

## 5. Scope

Входит в продуктовый scope R2:

- server-side importer for Yandex Metrica Reporting API aggregates;
- aggregate-only data model;
- date-range import with idempotent reruns;
- source state updates in `analytics_source_sync_state`;
- safe handling for `ok`, `stale`, `failed`, `partial`, `not_configured`;
- traffic source aggregates;
- search engine aggregates, if supported by selected dimensions;
- device aggregates;
- region/country aggregates;
- landing page/start URL aggregates, if supported by selected dimensions;
- goal reach aggregates for configured goals;
- comparison-ready external goal counts for later reconciliation with internal telemetry;
- URL normalization and unmapped URL diagnostics where landing URLs are imported;
- safe reporting of API errors without tokens or secrets.

## 5.1 Implementation Sub-slices

R2 must be implemented in small sub-slices, not as one broad BI/import build.

Recommended first slice:

### R2A. Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals

R2A should prove the import foundation with the smallest useful aggregate set:

- check API access against the real counter;
- run dry-run without writes first;
- choose a minimal safe report plan;
- import a short bounded period only after dry-run succeeds;
- write `analytics_source_sync_state` for `yandex_metrica`;
- import minimal aggregate rows;
- prove idempotency on rerun;
- prove safe error handling;
- avoid read model wiring;
- avoid UI changes;
- avoid scheduler-first implementation.

Minimal R2A concepts:

- visits total by date;
- pageviews total by date;
- users by date, only if the selected report reliably supports it;
- goal reaches for the 11 configured goals by date;
- `safe_error_message`;
- `rows_imported`;
- `imported_period_start` / `imported_period_end`.

Later R2 sub-slices:

- R2B: traffic sources, search engines, devices, regions and landing/start URLs after the minimal import is accepted.
- R2C: scheduled cadence, retention and stale threshold tuning.
- R2D: reconciliation with internal telemetry, if needed, after both internal and external aggregates are stable.

Full source/device/region/landing imports are still part of the broader R2 domain, but they should not be pulled into R2A.

## 6. Non-goals

R2 не включает:

- raw Metrica Logs API import;
- raw sessions, visits, client IDs or user-level identifiers;
- Webvisor import;
- clickmap/session replay/visual heatmap;
- ecommerce import;
- scheduled Webmaster imports;
- R4 read model integration except, at most, safe source state if explicitly scoped in implementation;
- `/admin/visibility` UX redesign;
- direct UI -> Metrica API;
- browser-side Yandex API calls;
- replacing internal telemetry as operational truth;
- treating Metrica goal counts as more authoritative than internal telemetry for public actions;
- inferring Content Core entity/revision context from Metrica alone;
- lead/intake attribution;
- LLM provider/UI.

## 7. Source-of-truth Position

Internal first-party telemetry remains operational source of truth for public user actions:

```text
user action
-> /api/telemetry/events
-> internal telemetry storage
-> future internal aggregates / read model
-> operational SEO dashboard decisions
```

Yandex Metrica import is external aggregate enrichment:

```text
Yandex Metrica Reporting API
-> aggregate import
-> project storage
-> source freshness / reconciliation / future read model enrichment
```

Metrica data must not override:

- internal event capture;
- Content Core page/entity/revision ownership;
- recommendation lifecycle;
- lead/contact distinction;
- attribution safety decisions that depend on richer first-party context.

## 8. Required Imported Concepts

R2 should import these concepts when the official Reporting API supports the selected dimensions/metrics:

| Concept | Requirement | Notes |
| --- | --- | --- |
| Visits | Required | Core traffic aggregate. |
| Users | Required if API metric available for selected report | External user count, not project identity. |
| Pageviews | Required | External pageview aggregate. |
| Traffic sources | Required | Source categories such as direct/referral/organic/ad/social/messenger where available. |
| Search engines | Required if dimension available | Needed for SEO source visibility. |
| Devices | Required | Desktop/mobile/tablet category where available. |
| Regions/countries | Required | Country/region aggregates where available. |
| Landing pages/start URLs | Required if stable dimension available | Must be normalized before mapping to Content Core routes. |
| Goals | Required | Existing 11 goals should be imported as aggregate reaches where API supports goal metrics. |
| Conversion metrics | Optional | May be imported or computed later; exact API support must be confirmed in implementation. |

Existing configured goals:

- `click_to_call`
- `click_to_telegram`
- `click_to_whatsapp`
- `form_start`
- `form_submit`
- `cta_click`
- `contact_link_click`
- `gallery_open`
- `faq_expand`
- `case_card_click`
- `service_link_click`

If a goal has zero external reaches, that is an external aggregate result, not proof that internal telemetry has zero actions.

## 9. Sync State Requirements

R2 must use the shared source state vocabulary:

- `ok`: latest import completed and freshness threshold is satisfied.
- `stale`: last success exists, but imported period is older than the approved freshness threshold.
- `failed`: latest attempt failed without usable new rows.
- `partial`: some reports/dimensions imported, but at least one required slice failed.
- `not_configured`: counter id/token/cadence is absent or disabled.

Minimum sync state fields:

- `source_system = yandex_metrica`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `status`;
- `rows_imported`;
- `safe_error_message`;
- error category if implementation adds one.

## 10. Privacy / Security

R2 must be aggregate-only.

Rules:

- OAuth token stays server-side only.
- No token, refresh token or client secret in UI, browser bundle, read model or report.
- No raw sessions.
- No raw form values.
- No raw user agent/IP.
- No user-level Metrica identifiers.
- No Webvisor/clickmap/session replay data.
- Error messages must be safe for docs/UI/log summaries.

## 11. Acceptance Criteria

R2 can be considered complete only when a later implementation proves:

- Metrica importer runs server-side only.
- Selected API dimensions/metrics are backed by official docs or by a verified API dry run.
- Imports are idempotent for the same date range.
- Aggregate rows are stored in project storage without raw sessions.
- `analytics_source_sync_state` records status and freshness for `yandex_metrica`.
- API errors map to safe `failed` or `partial` states without leaking secrets.
- Landing URLs are normalized and unmapped URLs are diagnosed instead of silently dropped.
- Internal telemetry remains operational truth and continues working without Metrica import.
- UI does not call Metrica API directly.
- Read model integration is deferred to R4 unless explicitly limited to safe source state.
- Implementation report documents imported dimensions, metrics, date range, row counts and limitations.

## 12. Risks

- Official API dimensions may not align exactly with desired dashboard slices.
- Metrica stats can be delayed; import freshness thresholds must account for processing lag.
- Goal names and goal IDs can drift if goals are edited in Yandex UI.
- Landing URLs may include query strings, mirrors, trailing slashes or UTM noise.
- Existing `analytics_page_daily` may be too narrow for external source/region/goal aggregates.
- Rate limits can cause partial imports.
- Metrica goal counts can differ from internal telemetry because of blockers, adblock, delayed processing or external attribution rules.

## 13. Open Questions

- Exact import cadence: hourly, daily or manual/operator-triggered first?
- Freshness threshold for `stale`: 24h, 48h or another value?
- Retention policy for imported Metrica aggregates.
- Exact attribution model/dimension prefix for source reports.
- Exact goal metric strategy: per-goal metrics, `sumGoalReachesAny`, or both.
- Whether implementation should create new external aggregate tables or reuse/extend existing tables.
- Whether delayed R1 goal visibility should be rechecked before first R2 dry run.

## 14. References

- Roadmap: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- R1 final smoke: `docs/reports/2026-05-19/R1_METRICA_PUBLIC_ENABLEMENT_AND_FINAL_SMOKE_Экостройконтинент_v0.1.report.md`
- Taxonomy: `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- Read model contract: `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- Storage direction addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- Yandex Metrica Reporting API: `https://yandex.com/dev/metrika/stat/index`
- Yandex Metrica dimensions and metrics: `https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all`
- Yandex Metrica quotas: `https://yandex.ru/dev/metrika/en/intro/quotas`
