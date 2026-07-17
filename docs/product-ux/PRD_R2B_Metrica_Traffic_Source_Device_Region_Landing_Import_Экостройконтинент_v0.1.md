# PRD R2B. Metrica Traffic Source / Device / Region / Landing Import

Русское название: R2B. Импорт источников, устройств, регионов и лендингов из Яндекс Метрики.

Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Статус: draft for review; implementation not started
Дата: 2026-05-19

## 1. Purpose

R2B нужен, чтобы расширить внешний aggregate layer Яндекс Метрики после R2A и получить не только totals/goals, но и состав трафика:

- откуда пришли посетители;
- какие source categories и detailed sources дают визиты;
- какие устройства используют пользователи;
- из каких стран/регионов приходит трафик;
- на какие landing/start URLs пользователи приземляются;
- какие landing URLs не сопоставляются с Content Core.

R2B остается внешним enrichment layer. Он не заменяет internal telemetry, не делает read model/full R4, не добавляет UI и не становится BI-комбайном.

## 2. Problem Statement

R2A доказал базовый server-side импорт Метрики: dry-run/write commands, `external_metrica_daily_aggregate`, `analytics_source_sync_state`, minimal daily traffic/goals and idempotency. Но R2A intentionally импортирует только минимальные totals и goals.

Этого недостаточно для SEO Manager, потому что read model пока не может честно ответить:

- какие каналы дают внешний трафик;
- есть ли органический, referral, social, messenger или direct traffic;
- какие устройства важны для UX/контента;
- какие страны/регионы реально присутствуют в внешних агрегатах;
- какие landing pages видит Метрика;
- какие external landing URLs не принадлежат текущему Content Core.

R4-lite уже показывает readiness/source state, но не должен строить evidence/recommendations на thin data. R2B подготавливает richer external aggregates for later full R4 without changing the operational source-of-truth model.

## 3. Product Goal

R2B должен спроектировать безопасный импорт расширенных агрегатов Метрики:

- traffic source aggregates;
- detailed source/search engine aggregates where available;
- device aggregates;
- country/region aggregates;
- landing/start URL aggregates;
- URL normalization and Content Core route mapping;
- unmapped URL diagnostics;
- source sync state and freshness;
- idempotent bounded imports;
- safe errors without secrets.

Результат R2B implementation later должен дать project-owned storage rows, которые можно использовать в future full R4/evidence layer, но не как primary operational truth.

## 4. Users / Stakeholders

- SEO Manager: видит, какие внешние каналы, устройства, регионы и landing pages требуют внимания.
- Superadmin: контролирует импорт, source state, freshness, safe errors and unmapped URLs.
- Future read model consumers: получают prepared external evidence через read model, not live Yandex API.
- Business Owner: косвенно получает более понятные external acquisition summaries.

## 5. Scope

Входит в R2B:

- server-side import design for Yandex Metrica Reporting API aggregates;
- Reporting API table reports with bounded dimensions;
- source / traffic source / detailed source dimensions;
- search engine dimensions where official API and dry-run confirm shape;
- device category report;
- country-first geography report, with region as optional deepening if cardinality is safe;
- landing/start URL or landing path report where API supports it;
- visits, users if supported, pageviews;
- goal reaches only where relevant and cardinality is proven safe;
- URL normalization for landing reports;
- Content Core route/entity mapping where possible;
- unmapped URL diagnostics;
- `analytics_source_sync_state` update for `yandex_metrica`;
- idempotency and safe error handling;
- aggregate-only storage; no secrets.

## 6. Required Concepts

| Concept | Requirement | Notes |
| --- | --- | --- |
| `date` | Required | Daily aggregates, aligned with R2A storage grain. |
| `report_type` | Required | Expected R2B values: `traffic_source`, `device`, `country`, optional `region`, `landing_url`. |
| `traffic_source` | Required | Source category such as direct, referral, organic, ad, social, messenger where API returns it. |
| `source_detail` / `source_engine` | Optional but desired | Search engine/referral/social/messenger details where available. |
| `device` | Required | Device category dimension. |
| `country` / `region` | Required country-first | Region can be later if dry-run row counts are safe. |
| `landing_url` / `start_url` | Required if stable API dimension works | Normalize before mapping. |
| `normalized_url` | Required for landing report | Canonical URL after stripping fragments/tracking params. |
| `page_path` | Required where mapping succeeds | Content Core remains route truth. |
| `visits` | Required | External visits, not internal user actions. |
| `users` | Required if supported | External unique users, not project user identity. |
| `pageviews` | Required | External pageviews. |
| `goal_reaches` | Optional in R2B | Keep R2A goals as default; avoid multiplying 11 goals across high-cardinality dimensions. |
| `unmapped_url_count` | Required when landing report runs | Diagnostic, not content mutation trigger. |

## 7. Non-goals

R2B не включает:

- raw sessions or Metrica Logs API;
- Webvisor, clickmap, session replay, visual heatmap;
- ecommerce;
- BI warehouse or arbitrary ad-hoc analytics;
- scheduler/cadence unless separately approved as R2C;
- read model/full R4 integration;
- `/admin/visibility` UI changes;
- recommendations;
- LLM;
- lead/intake;
- direct UI -> Metrica API;
- browser-side Yandex API calls;
- replacing internal telemetry;
- inferring Content Core entity/revision solely from Metrica;
- treating Metrica traffic/goals as more authoritative than first-party telemetry for user actions.

## 8. Source-of-truth Position

Internal first-party telemetry remains operational source of truth for public user actions:

```text
user action
-> /api/telemetry/events
-> internal telemetry storage
-> future internal aggregates/read model
-> operational SEO dashboard decisions
```

Yandex Metrica R2B data is external aggregate enrichment:

```text
Yandex Metrica Reporting API
-> source/device/region/landing aggregate import
-> project-owned external storage
-> future R4 evidence layer
```

Content Core remains truth for route ownership, published pages and active revisions. Landing URL mapping is best-effort enrichment. Unmapped URLs are diagnostics, not automatic page creation or redirects.

## 9. Acceptance Criteria for Later Implementation

R2B can be accepted after implementation only if:

- selected Metrica dimensions/metrics are verified by dry-run against the real counter;
- source/device/country-or-region/landing report plans are explicit and bounded;
- import writes project-owned aggregate rows server-side;
- `analytics_source_sync_state` is updated truthfully for `yandex_metrica`;
- landing URLs are normalized before mapping;
- mapped URLs resolve to Content Core where possible;
- unmapped URL diagnostics are written when applicable;
- same period/report rerun is idempotent;
- cardinality limits prevent report explosion;
- no raw sessions, raw logs or user-level identifiers are stored;
- no tokens/secrets/raw authorization data reach logs, docs, UI or read model;
- no read model/UI integration is added unless a later R4 scope explicitly permits it;
- implementation report documents report types, exact dimensions, rows, limitations and source state.

## 10. Risks

- High-cardinality landing URLs can create too many rows.
- Combining source + device + region + landing in one report can produce noisy BI-like data and high API cost.
- Yandex attribution semantics may differ from internal source classification.
- API sampling or limited disclosure can make rows partial or misleading.
- Data lag can make fresh periods look empty.
- Landing URLs can include tracking/query noise.
- Region-level data may be too sparse or high-cardinality; country-first is safer.
- External source aggregates may conflict with internal telemetry; conflicts should be labeled, not resolved by making Metrica canonical.

## 11. Open Questions

- Which attribution model should be the product default: `lastsign`, `last` or another documented model?
- Should first R2B implementation import country only, or also region if dry-run row counts are small?
- Should landing report use `ym:s:startURLPath` first, or full `ym:s:startURLPathFull` with query stripping?
- Should R2B store source detail/search engine in the same `traffic_source` report or as a separate `source_detail` report?
- Should any goal reaches be included in R2B dimensioned reports, or should dimensioned goal cuts wait until R2D/reconciliation?
- What exact max rows per report/date range should be used for canonical runtime acceptance?
- Should sampling fields (`sampled`, `sample_share`) become first-class metadata in R2B storage/readiness?

## 12. References

- R2 PRD: `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- R2 Blueprint: `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- Storage Addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- R2A conformity audit: `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- R4-lite reports: `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`, `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- Official Yandex Metrica Reporting API introduction: https://yandex.com/dev/metrika/en/stat/
- Official table endpoint reference: https://yandex.com/dev/metrika/en/stat/openapi/data
- Official dimensions/metrics list: https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all
- Official traffic dimensions: https://yandex.com/dev/metrika/en/stat/attributes/visits/source
- Official parametrization docs: https://yandex.com/dev/metrika/en/stat/param