# SEO Dashboard Analytics Read Model Contract Report

Проект: Экостройконтинент
Дата: 2026-04-30
Статус: documentation-only architecture contract

## 1. Изученные документы

Изучены основные документы:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`.

Изучены related reports по SEO dashboard / Yandex-first / LLM copilot:

- `docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_DISCOVERY_Экостройконтинент_v0.1.report.md`;
- `docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_REFINE_Экостройконтинент_v0.1.report.md`;
- `docs/reports/2026-04-30/SEO_DASHBOARD_YANDEX_FIRST_INFRA_REFINE_Экостройконтинент_v0.1.report.md`;
- `docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_RESEARCH_AND_CONTEXT_CONTRACT_Экостройконтинент_v0.1.report.md`;
- `docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_SAFETY_READINESS_REFINE_Экостройконтинент_v0.1.report.md`;
- `docs/reports/2026-04-30/SEO_DASHBOARD_HTML_MOCKUP_Экостройконтинент_v0.1.report.md`.

## 2. Новый contract document

Создан новый документ:

- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`

Документ фиксирует analytics read model как версионированный read model / view model / DTO слой между нормализованными агрегатами и потребителями.

Ключевая позиция: analytics read model не является source of truth и не заменяет Content Core, raw first-party events, daily aggregates, external search visibility aggregates, Яндекс Метрику, Яндекс Вебмастер, lead/intake domain или recommendation state.

## 3. JSON fixture

Создана статичная фикстура:

- `docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json`

Фикстура содержит mock data для:

- source health / freshness;
- overview;
- top opportunities;
- traffic sources;
- Yandex-first search visibility;
- page list;
- selected page detail;
- semantic click map;
- recommendations backlog;
- unmapped URL warning;
- stale/not_configured examples;
- analytics_history;
- published_change_history;
- tracking_change_history;
- evidence items;
- LLM derivation notes.

Проверка JSON выполнена через `ConvertFrom-Json`; фикстура валидна.

## 4. Обновлённые документы

Обновлён PRD:

- добавлен раздел `Analytics Read Model / Contract`;
- добавлена фаза `Phase C5: Analytics Read Model Contract and Fixture`;
- обновлён MVP implementation path: contract + fixture идут перед HTML/UI mockup и runtime UI;
- добавлены acceptance/operational criteria, что UI и LLM работают через analytics read model;
- зафиксировано, что визуализация не должна сама собирать данные из источников.

Обновлена taxonomy:

- добавлен раздел `Analytics Read Model Linkage`;
- уточнены поля, нужные для evidence items;
- добавлены требования к analytics history;
- добавлены поля для published change history;
- добавлены поля для tracking change history.

Обновлён LLM Context Contract:

- добавлен раздел `Analytics Read Model Derivation`;
- в цепочку LLM добавлен analytics read model перед context builder;
- в common envelope добавлены `analytics_read_model_version` и `analytics_read_model_generated_at`;
- добавлен раздел `Historical Dynamics / Change Context`;
- уточнено, что LLM context builders не ходят напрямую в Яндекс Метрику, Яндекс Вебмастер, Content Core или raw events.

## 5. Новая цепочка данных

Зафиксирована цепочка:

```text
sources
-> adapters
-> normalization
-> aggregates
-> analytics read model / contract
-> UI dashboard / LLM context builders / reports / future exports
```

UI contract может быть шире и содержать данные для карточек, таблиц, фильтров и page detail.

LLM context должен быть уже и task-specific: выбранная страница или рекомендация, evidence items, trend summary, source freshness, limitations и uncertainty flags.

## 6. Что входит в analytics_history

`analytics_history` включает только агрегированную динамику:

- `current_period`;
- `previous_period`;
- `baseline_period` optional;
- `metric_trends` по visibility, traffic, conversion, behavior;
- `published_changes`;
- `recommendation_history`;
- `tracking_changes`;
- `source_sync_history`;
- `known_limitations`.

Raw events, raw sessions и user-level paths туда не входят.

## 7. Что не отдается LLM

LLM не получает:

- raw events;
- raw sessions;
- form values;
- IP;
- tokens;
- secrets;
- direct SQL;
- полный экспорт Яндекс Метрики;
- полный экспорт Яндекс Вебмастера;
- unrestricted user agent history;
- unfiltered admin/bot/QA traffic;
- персональные данные, введённые пользователями.

LLM получает только подготовленный task-specific slice из analytics read model.

## 8. Открытые вопросы

Остались открытыми:

- финальная backend schema/type для read model;
- сохранять ли read model snapshots или генерировать on demand;
- cache duration для dashboard API;
- thresholds для `stale` по каждому источнику;
- sample size gates для confidence;
- место хранения recommendation state;
- безопасные агрегаты lead/intake после готовности lead domain;
- owner-facing reduced DTO;
- retention для read model snapshots, если они будут сохраняться.

## 9. Runtime confirmation

Runtime-код не менялся.

Не менялись:

- `app/*`;
- `components/*`;
- `lib/*`;
- `db/*`;
- `scripts/*`;
- `package.json`;
- env files;
- migrations;
- API routes;
- provider config.

Выполненная работа ограничена разрешёнными путями:

- `docs/product-ux/*`;
- `docs/mockups/fixtures/*`;
- `docs/reports/2026-04-30/*`.

## 10. Git status

Релевантный status по разрешённым и запрещённым путям:

```text
?? docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json
?? docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_ANALYTICS_READ_MODEL_CONTRACT_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_HTML_MOCKUP_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_RESEARCH_AND_CONTEXT_CONTRACT_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_SAFETY_READINESS_REFINE_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_YANDEX_FIRST_INFRA_REFINE_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_DISCOVERY_Экостройконтинент_v0.1.report.md
?? docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_REFINE_Экостройконтинент_v0.1.report.md
```

Запрещённые runtime paths (`app`, `components`, `lib`, `db`, `scripts`, package/env files) не имеют изменений по scoped status.

Полный `git status --short` также показывает уже существовавшие до этой задачи удаления в `docs/out/*`. Они не трогались и не восстанавливались в рамках этой работы. Часть untracked reports в `docs/reports/2026-04-30/*` также существовала до этой задачи; новый report этой задачи указан отдельно выше.
