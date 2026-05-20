# PRD: Minimal SEO Admin Panel

Дата: 2026-05-20
Проект: Экостройконтинент
Статус: product design / implementation not started

## 1. Название

English: Minimal SEO Admin Panel

Русское название: Минимальная операционная SEO-панель в админке

## 2. Purpose

Панель нужна, чтобы владелец, разработчик, администратор и SEO-специалист могли быстро понять:

- есть ли трафик;
- сколько было трафика;
- какой это трафик;
- откуда пришли пользователи;
- с каких устройств пришли;
- из каких стран/регионов пришли;
- на какие страницы приземлились;
- какие страницы и события получают действия;
- что люди нажимают;
- какие внешние источники подключены;
- где данные тонкие, нулевые, устаревшие или пока неполные.

Это панель просмотра уже собранных данных. Она не советует, не генерирует задачи и не пытается заменить аналитика.

## 3. Problem Statement

Backend/data layer уже собирает, нормализует и отдаёт данные через analytics read model:

- first-party telemetry;
- Yandex Metrica external aggregates;
- Yandex Webmaster external evidence;
- source readiness;
- external evidence limitations.

Но текущая `/admin/visibility` остаётся технической поверхностью, где смешаны MVP-диагностика, readiness, existing issue output и read model proof. Нужна простая операционная панель, которая показывает данные понятнее, без R5 recommendations и без BI-сложности.

## 4. Product Goal

- Показать базовую картину трафика и поведения.
- Показать external evidence из Метрики и Вебмастера.
- Показать внутренние действия и клики.
- Показать ограничения данных.
- Не делать интерпретации сверх доказательств.
- Не делать recommendation layer.
- Не делать source-of-truth смешение между internal telemetry, external enrichment и Content Core.

## 5. Users / Stakeholders

- Владелец бизнеса: хочет быстро понять, есть ли движение и куда смотрят пользователи.
- Разработчик/администратор: хочет видеть состояние источников, свежесть, пустые/тонкие данные и smoke-level признаки.
- SEO-специалист: хочет видеть источники, устройства, географию, landing pages, search/indexation state и внутренние действия без BI.
- Контент-оператор косвенно: может использовать панель как контекст перед работой в Content Core, но панель не мутирует контент.

## 6. Scope

Входит:

- summary cards;
- traffic overview;
- source/device/geo/landing sections;
- internal actions/clicks/semantic events;
- external evidence section;
- Webmaster/indexation readiness;
- data limitations;
- empty/thin data states;
- period selector if already supported by read model;
- compact tables/cards;
- clear labels for first-party vs external evidence;
- no direct external API calls.

## 7. Non-goals

Не входит:

- R5 recommendations;
- AI/LLM copilot;
- lead attribution;
- CRM;
- scheduled imports;
- new analytics imports;
- BI query builder;
- arbitrary filters/cubes;
- visual heatmap/session replay;
- Webvisor UI;
- complex charts;
- SEO task workflow;
- Content Core mutation;
- direct UI -> Yandex API;
- raw event/session explorer;
- low CTR or query opportunity rules.

## 8. Data Source Position

- UI consumes analytics read model only.
- UI does not query DB directly.
- UI does not query Yandex APIs.
- Internal telemetry remains operational truth for public user actions.
- Yandex Metrica remains external aggregate enrichment.
- Yandex Webmaster remains external search/indexation enrichment.
- Content Core remains truth for pages, routes, ownership and publication lifecycle.
- Contact actions remain intent signals, not leads.
- Existing recommendations, if present in read model, are not expanded by this domain.

## 9. Minimum Screen Sections

### A. Top Summary

Purpose: answer "is anything happening and is data fresh enough?"

Show:

- selected period;
- first-party visits;
- first-party contact/action count;
- source readiness states;
- data freshness;
- limitations count;
- clear empty state when no current first-party rows exist.

Required framing:

- visits/actions shown here are first-party/internal;
- external Metrica evidence must not overwrite these cards.

### B. Traffic Composition

Purpose: answer "what kind of traffic is coming?"

Show:

- Metrica traffic sources;
- source details if available;
- devices;
- countries;
- regions if available;
- visits/users/pageviews as external evidence;
- source limitations such as low sample size or stale source.

Required framing:

- Metrica values are external enrichment;
- no combined BI cross-product;
- no conclusion that Metrica users equal total site users.

### C. Landing Pages

Purpose: answer "where did users land?"

Show:

- landing paths/URLs;
- mapped Content Core route/entity where available;
- visits/users/pageviews;
- mapped count;
- unmapped count;
- diagnostic state for unmapped URLs.

Required framing:

- unmapped URLs are diagnostics only;
- panel must not create pages, redirects or sitemap entries.

### D. Internal User Actions

Purpose: answer "what did users do after landing?"

Show:

- first-party contact actions;
- CTA views/clicks;
- semantic click map;
- click-to-call, Telegram, WhatsApp, form start/submit where present;
- gallery opens;
- FAQ expands;
- case/service clicks where present;
- page-level actions from `page_list` and selected page detail where available.

Required framing:

- actions are intent signals;
- do not present actions as leads;
- do not infer lead conversion without lead/intake domain.

### E. Search / Webmaster

Purpose: answer "is the site visible and indexed enough to inspect?"

Show:

- host verified;
- host data status;
- searchable pages;
- excluded pages;
- site problem counts;
- URL sample count/resolved/unmapped;
- query visibility row count;
- query visibility rows if present;
- zero-row limitation when query rows are absent.

Required framing:

- Webmaster is external search/indexation evidence, not Content Core truth;
- zero query rows do not mean zero demand.

### F. Data Limitations

Purpose: keep interpretation honest.

Show:

- thin data;
- low external sample size;
- zero external values;
- absent query rows;
- source stale/failed/not_configured;
- external data not operational truth;
- first-party/raw data privacy boundaries;
- missing lead domain.

## 10. UX Principles

- Simple cards and compact tables.
- Dense but readable admin surface.
- No marketing-style hero.
- No charts unless the existing data shape makes a tiny chart trivial and non-misleading.
- Labels must separate "internal" and "external".
- Empty states must explain what is missing without inventing conclusions.
- Limitations must stay visible, not hidden in a tooltip-only pattern.
- The first screen should answer whether traffic exists, how much, and whether sources are healthy.

## 11. Acceptance Criteria

The domain is done when:

1. Panel renders from analytics read model only.
2. No direct browser or server UI path calls to Yandex APIs are added.
3. No secrets, raw external responses, raw events, raw sessions, IPs, user agents or form values are exposed.
4. Primary metrics are clearly first-party/internal.
5. External metrics are clearly labelled as external evidence/enrichment.
6. Traffic source/device/geo/landing evidence is visible when present.
7. Webmaster host/indexation/query state is visible.
8. Internal actions/clicks are visible.
9. Empty/thin/stale/not_configured states are visible.
10. Webmaster zero query rows are shown as a limitation, not zero demand.
11. No recommendations are generated or expanded by this domain.
12. No Content Core mutation is possible from the panel.
13. Existing admin auth boundary remains intact.
14. Basic responsive/admin usability passes smoke testing.

## 12. Out-of-Scope Follow-ups

- R5 deterministic recommendation refinement.
- R2C/R3C scheduling or deeper imports.
- UX/UI refinement beyond minimal operational panel.
- LLM copilot.
- Lead/intake.
- Owner reduced DTO.
