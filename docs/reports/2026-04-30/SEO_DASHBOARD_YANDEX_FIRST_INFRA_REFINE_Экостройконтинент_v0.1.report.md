# SEO Dashboard Yandex-First Infrastructure Refine Report

Проект: «Экостройконтинент»
Дата: 2026-04-30
Статус: documentation refine

## 1. Что изменено

Изменены документы:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`.

Создан report:

- `docs/reports/2026-04-30/SEO_DASHBOARD_YANDEX_FIRST_INFRA_REFINE_Экостройконтинент_v0.1.report.md`.

## 2. Что обновлено в PRD

PRD переведен с Google-first на Yandex-first внешнюю metrics strategy для РФ/русскоязычного локального строительного рынка.

Обновлены:

- `Product Position`: добавлен Yandex-first принцип и сохранена обязательность first-party events.
- `Data Sources`: Яндекс Метрика и Яндекс Вебмастер стали MVP/foundation внешними источниками; Google Search Console перенесен во второй поисковый контур.
- `Source Strategy Options`: hybrid strategy теперь строится вокруг own events + Метрика + Вебмастер + GSC later.
- `MVP Screens`: Search Visibility и Traffic Sources теперь показывают Yandex-first sources первыми.
- `Data Model / Event Model`: поисковая видимость обобщена как `external_search_visibility_daily`, а не Google-only table.
- `Infrastructure & External Metrics Layer`: добавлен новый раздел.
- `Integrations`: порядок изменен на Internal Event Tracker -> Яндекс Метрика -> Яндекс Вебмастер -> Google Search Console -> GA4.
- `Required Product / Engineering Changes`: добавлены scheduled imports/status endpoints для Яндекса.
- `Phasing`: добавлены Phase C1/C2/C3 для Метрики, Вебмастера и Google Search Console.
- `MVP Recommendation`: первая внешняя реализация теперь Yandex-first.
- `Acceptance Criteria`: добавлены scheduled/idempotent Yandex imports и запрет real-time UI dependency on Yandex APIs.
- `Open Questions`: обновлены вопросы по Метрике, Вебмастеру, целям, privacy/cookie posture, Measurement Protocol, Logs API и владельцам доступов.

## 3. Что добавлено в Infrastructure & External Metrics Layer

Раздел фиксирует:

- внешние источники: Яндекс Метрика, Яндекс Вебмастер, Google Search Console later, GA4 optional later;
- ожидаемые данные из Яндекс Вебмастера: indexed/non-indexed state, important pages, indexation problems, queries, URL visibility, indicators if available, date/period, host/site status;
- ожидаемые данные из Яндекс Метрики: visits, users, sources, search engines, regions, devices, bounce rate, page depth, duration, goals, goal conversion rate, landing pages, JS goals;
- что пишем в свою БД: raw first-party events, daily aggregates, imported Yandex aggregates, sync status, unmapped URLs, recommendation state;
- URL -> content entity mapping через `page_path`, route owner, `entity_type`, `entity_id`, `published_revision_id`;
- unmapped URL diagnostics;
- stale data and sync status;
- почему dashboard UI не должен ходить во внешние API в реальном времени;
- где живут integration settings и почему tokens/secrets не являются content entities.

## 4. Что обновлено в taxonomy

Обновлены:

- `Data Source Catalog`: добавлены Yandex Webmaster Imports, Yandex Metrica Imports, Google Search Console Imports как second contour.
- `External Import Dimensions`: Яндекс Вебмастер и Яндекс Метрика описаны первыми.
- `Integration Sync Status`: добавлены поля статуса синхронизации.
- `Unmapped URL Diagnostics`: добавлены поля диагностики немаппящихся URL.
- Search query attribution limitation: query data из Яндекс Вебмастера и Google Search Console остается aggregate signal, не user-level attribution.

## 5. Сохраненные ограничения

- First-party internal events остаются обязательными и не заменяются Метрикой.
- Content Core остается источником истины.
- Public Web остается read-side.
- Admin Console остается write-side.
- API tokens/secrets не являются content entities.
- Dashboard UI не должен зависеть от доступности внешних API в real time.
- Фича не превращается в BI/CRM/GA4/Метрика replacement.
- Visual heatmap не входит в MVP.
- Search query data остается агрегатным сигналом.
- Причинность не утверждается без достаточных данных.

## 6. Runtime / Git Confirmation

Runtime-код не менялся.

Не менялись:

- migrations;
- UI components;
- API routes;
- package/dependency files;
- external API integrations.

Git status на момент проверки:

- untracked canonical docs: PRD и taxonomy companion;
- untracked reports: discovery report, previous refine report, this Yandex-first refine report;
- existing tracked deletions under `docs/out`;
- no runtime/code/package/migration files changed.

`docs/out` deletions существовали в рабочем дереве отдельно от этого refine и не исправлялись в рамках задачи.
