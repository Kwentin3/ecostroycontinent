# PRD R4-lite. External Source State and Readiness Integration

Русское название: Интеграция состояния внешних источников и готовности данных.

Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Версия: v0.1
Дата: 2026-05-19

## 1. Purpose

R4-lite нужен, чтобы SEO Dashboard и будущие потребители analytics read model видели честное состояние внешних источников после R2A/R3A:

- подключен ли источник;
- когда был последний успешный импорт;
- какой период импортирован;
- сколько строк импортировано;
- есть ли безопасная ошибка;
- есть ли ограничения данных;
- можно ли использовать данные для выводов или пока только как readiness/source-health.

R4-lite является промежуточным этапом. Это **не full R4** и не полноценный слой SEO evidence/recommendations.

## 2. Problem Statement

После R2A/R3A внешние источники уже импортируются в project storage:

- R2A создал минимальный импорт Яндекс Метрики в `external_metrica_daily_aggregate`;
- R3A создал минимальный импорт Яндекс Вебмастера в dedicated `external_webmaster_*` tables;
- оба источника обновляют `analytics_source_sync_state`.

Но full R4 сейчас делать рано:

- Метрика дала только нулевые external aggregates за accepted period;
- Webmaster query visibility rows отсутствуют;
- текущих данных недостаточно для сильных SEO-рекомендаций;
- есть риск показать нули Метрики как "нет трафика/нет действий", хотя internal telemetry остается operational source of truth.

R4-lite закрывает только readiness layer: внешний источник подключен, импорт работает, данные имеют такие ограничения.

## 3. Product Goal

Цель R4-lite:

- подключить source health/readiness внешних источников в analytics read model;
- показать импортированные периоды, rows, status и safe errors;
- показать ограничения данных;
- показать Metrica external zeros только как external diagnostic, не как operational truth;
- показать Webmaster host/indexation summary и URL sample как limited external evidence;
- не генерировать рекомендации на слабых/нулевых внешних данных.

## 4. Users / Stakeholders

- SEO Manager: видит, какие источники подключены и где данных еще недостаточно.
- Superadmin: понимает operational readiness импортов и source failures.
- Future read model consumers: получают единый source readiness contract.
- Business Owner: косвенно, через будущие отчеты; R4-lite не является owner-facing analytics layer.

## 5. Source-of-Truth Position

R4-lite сохраняет стратегическую позицию домена:

- internal first-party telemetry remains operational source of truth;
- Yandex Metrica is external enrichment/readiness, not primary traffic/contact truth;
- Yandex Webmaster is external search/indexation enrichment, not Content Core truth;
- Content Core remains the source of truth for published pages, route ownership and revisions;
- Webmaster query data is aggregate only and never user/session/lead attribution;
- Metrica zero values are external zero values only, not proof of zero internal actions.

## 6. Current Factual Baseline

R4 readiness audit зафиксировал:

| Source | Current data |
| --- | --- |
| `yandex_metrica` | `analytics_source_sync_state.status=ok`, period `2026-05-16..2026-05-18`, rows `42`, all external metric values `0` |
| `yandex_webmaster` | `analytics_source_sync_state.status=ok`, period `2026-05-05..2026-05-17`, rows `3`, host verified, one indexation summary, one in-search URL sample, zero query visibility rows |

This is enough for readiness/source state. It is not enough for full external evidence integration.

## 7. Scope

In scope:

- read model external source readiness;
- source states for `yandex_metrica` and `yandex_webmaster`;
- imported periods;
- `last_successful_at` / `last_attempted_at`;
- `rows_imported`;
- `safe_error_message`;
- freshness/limitations;
- Metrica zero external aggregates as limited diagnostic;
- Webmaster host/indexation summary;
- Webmaster URL sample count/resolved/unmapped counts;
- query visibility empty state;
- contract-aligned source-state warnings.

## 8. Non-Goals

Out of scope:

- full R4 external metric/evidence integration;
- traffic source/device/region/landing dimensions;
- full query/page visibility;
- recommendations from external zeros;
- low CTR or query-opportunity recommendations from absent query rows;
- UI redesign;
- scheduled imports;
- new Yandex imports;
- LLM;
- lead/intake;
- external API calls from read model request path;
- direct UI -> Yandex API;
- changing Content Core from external source data;
- storing or exposing raw external API responses.

## 9. Product Behavior

### 9.1 Metrica Readiness

R4-lite should show:

- `status`;
- last attempted/successful import timestamps;
- imported period;
- rows imported;
- compact imported summary:
  - traffic rows;
  - goal rows;
  - non-zero rows;
  - whether all values are zero;
  - report types present.

If Metrica rows are all zero, read model should say:

```text
Metrica import is healthy, but no external Metrica activity was observed for the imported period.
```

It must not say or imply:

```text
Site had zero traffic or zero user actions.
```

### 9.2 Webmaster Readiness

R4-lite should show:

- `status`;
- last attempted/successful import timestamps;
- imported period;
- rows imported;
- unmapped URL count;
- host verification summary;
- indexation/site summary;
- URL sample counts;
- query visibility row count.

If query visibility rows are absent, read model should say:

```text
Webmaster query visibility returned no rows for the accepted period.
```

It must not say or imply:

```text
There is zero search demand or zero Yandex visibility.
```

## 10. User-Facing Interpretation Rules

The dashboard/read model must distinguish:

- `source_is_working`: import path is healthy;
- `data_is_useful_for_decisions`: imported data has enough volume/detail for recommendations;
- `data_is_empty_or_thin`: import succeeded but evidence is not actionable yet.

`ok` source state does not automatically mean "actionable data exists".

## 11. Acceptance Criteria

R4-lite is done when:

1. Read model exposes `yandex_metrica` source state truthfully.
2. Read model exposes `yandex_webmaster` source state truthfully.
3. Read model exposes imported period, rows, last success and safe errors.
4. Read model exposes limitations for zero/empty external data.
5. Metrica zero rows do not feed primary traffic/contact metrics.
6. Webmaster absent query rows do not generate query/CTR recommendations.
7. UI still consumes read model only.
8. No Yandex API call happens in read model request path.
9. No secrets, tokens, raw Authorization headers or raw external responses are exposed.
10. No scheduled imports are added.
11. No LLM or lead/intake work is added.
12. Tests prove empty/zero external data is handled without misleading recommendations.

## 12. Risks

- SEO Manager may misread Metrica zeros as no traffic.
- Webmaster URL sample may be misread as full index coverage.
- Source `ok` may be mistaken for "data is useful".
- Full R4 might be started prematurely.
- UI could become noisy if limitations are overexposed.
- Freshness thresholds may be too strict or too loose without enough operational history.

## 13. Open Questions

1. Should R4-lite update UI rendering, or only read model contract/API?
2. How much of Webmaster indexation summary should appear in current `/admin/visibility` MVP?
3. Should the read model add a new `external_source_readiness` block, or extend `source_diagnostics`?
4. Should Metrica zeros appear in Overview or only Source Diagnostics?
5. Should R4-lite be server-only/read-model-only, with UI minimal rendering only if already supported?
6. What exact thresholds define `stale` for Metrica/Webmaster?
7. Should source `ok` be split from `data_actionability` in UI labels?

## 14. References

- `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- Yandex Metrica Reporting API table endpoint: https://yandex.com/dev/metrika/en/stat/openapi/data
- Yandex Webmaster API documentation: https://yandex.com/dev/webmaster/doc/en/
