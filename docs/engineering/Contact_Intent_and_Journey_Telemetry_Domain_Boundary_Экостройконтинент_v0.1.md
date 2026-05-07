# Contact Intent & Journey Telemetry Domain Boundary

Проект: «Экостройконтинент»
Версия: v0.1.1
Статус: engineering design note / boundary contract
Дата: 2026-05-07
Companion docs:

- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_Tracking_Plan_Экостройконтинент_v0.1.md`

## 1. Purpose

Этот документ фиксирует контрактные границы домена **Contact Intent & Journey Telemetry**.

Это не implementation blueprint. Документ не задает финальную БД-схему, endpoint list, миграции, фоновые jobs или adapter implementation. Его задача - не дать телеметрии размазаться по UI-коду и заранее отделить contact intent от lead management.

Ключевая модель:

```text
Кнопка / карточка / страница
        ↓
единый telemetry contract
        ↓
telemetry domain
        ↓
адаптеры:
- internal storage
- Яндекс.Метрика
- future PostHog / Plausible / Matomo
- future admin reports
- future LLM context
- future CRM / ATS integration
```

UI не должен знать конечных получателей события. UI должен знать только локальный контракт: передать событие в telemetry layer.

## 2. Domain Responsibility

Домен отвечает за анонимную контактную телеметрию публичного сайта:

- собрать события интереса;
- зафиксировать contact intent events;
- отметить internal/test traffic;
- подготовить данные для агрегатов;
- создать короткий contact journey snapshot в момент contact intent event;
- защитить privacy boundary;
- дать будущим consumers единый смысл событий.

Главный вопрос:

```text
Что человек смотрел перед тем, как решил связаться?
```

## 3. What The Domain Owns

Telemetry domain owns:

- event vocabulary;
- event validation contract;
- anonymous session context;
- contact intent event semantics;
- contact journey creation rule;
- internal/test traffic marker semantics;
- aggregation-ready storage expectations;
- adapter boundary for external analytics;
- read-contract expectations for future admin / LLM usage.

Домен владеет смыслом событий, но не владеет бизнес-операциями после контакта.

## 4. What The Domain Does Not Own

Telemetry domain does not own:

- Content Core;
- editorial truth;
- public page content;
- contact data truth;
- CRM;
- sales statuses;
- lead qualification;
- ATS;
- external analytics truth;
- AI decisions;
- admin dashboard UI;
- SEO dashboard UI.

Особенно важно: contact intent events не являются lead records. Lead domain остается отдельным соседним операционным доменом.

## 5. Contract-First Event Ingestion

Запрещенная модель:

```text
одна кнопка напрямую вызывает Яндекс.Метрику;
другая кнопка пишет в /api/analytics;
третья кнопка вызывает gtag;
четвертая кнопка пишет что-то свое.
```

Правильная модель:

```text
UI-компонент сообщает: "произошло событие".

Единый telemetry contract принимает событие.

Telemetry domain решает:
- сохранить ли событие внутри;
- отправить ли его во внешний счетчик;
- использовать ли для агрегатов;
- создать ли contact journey;
- отдать ли данные потом админке, SEO-специалисту, владельцу или LLM.
```

События должны проходить через единый validation contract. Минимальный envelope описан в Tracking Plan и включает `event_name`, `event_version`, `occurred_at`, `session_id`, `page_path`, entity context, placement, channel markers, `is_internal`, `is_test` и ограниченный `metadata`.

## 6. Public UI Boundary

Public UI отвечает только за отправку семантического события в telemetry layer.

UI может знать:

- `event_name`;
- `placement`;
- public-safe entity context;
- contact channel для контактных CTA;
- локальный CTA kind/destination kind;
- session context, если он предоставлен telemetry layer.

UI не должен знать:

- включена ли Яндекс.Метрика;
- какой counter id используется;
- есть ли PostHog/Plausible/Matomo;
- как событие хранится внутри;
- создается ли journey;
- какие агрегаты будут построены;
- получит ли событие будущая админка или LLM.

UI не имеет права отправлять system/domain events напрямую. Например, `contact_journey_created` создается только внутри telemetry domain и никогда не emitted directly by Public UI.

Такой boundary защищает код от analytics drift: UI остается источником факта пользовательского действия, но не владельцем аналитических решений.

## 7. Internal Storage Boundary

Internal storage expectations остаются на уровне design note:

- сырые события могут использоваться для агрегатов;
- raw telemetry retention требует owner/legal decision;
- contact journeys могут храниться дольше raw маршрутов, если это нужно для product analysis;
- сессии без contact intent не обязаны хранить подробный маршрут долго;
- internal/test events должны быть помечены так, чтобы default reports их исключали.

Этот документ не задает таблицы, индексы, partitioning, queue model или migration plan.

## 8. External Analytics Adapter Boundary

External analytics tools являются получателями, а не владельцами семантики.

Potential adapters:

- Яндекс.Метрика;
- Google Analytics;
- PostHog;
- Plausible;
- Matomo;
- future admin reports;
- future LLM context;
- future CRM/ATS integration after explicit decision.

Adapter responsibilities:

- получить normalized semantic event после domain validation;
- преобразовать его в формат внешней системы;
- применить adapter-specific filtering, если разрешено;
- не менять внутренний смысл события;
- не заставлять UI знать внешнюю систему.

Adapters receive normalized events after domain validation, not raw UI payloads.

Расхождения между internal telemetry и Яндекс.Метрикой допустимы из-за blockers, cookies, bot filtering, internal traffic markers, delays и different counting rules.

Это не дублирование, а резервирование.

## 9. Contact Journey Extraction

Все сессии можно наблюдать, но не все сессии нужно хранить одинаково подробно.

Правило:

1. Raw events используются для агрегатов.
2. Когда происходит contact intent event, создается snapshot `contact_journey`.
3. `contact_journey` хранит короткий путь до контакта.
4. Если сессия не завершилась contact intent, полный маршрут не обязан храниться долго.
5. Для обычных сессий достаточно агрегатов: просмотры, активное время, scroll depth, открытия карточек.

Contact intent phase 1:

- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`.

Кандидаты significant events для journey:

- `page_viewed`;
- `service_card_opened`;
- `case_card_opened`;
- `gallery_opened`;
- meaningful `cta_clicked`;
- final contact intent event.

Journey должен быть коротким и объяснимым. Он не должен становиться session replay.

Journey extraction happens at contact intent event time. It must not wait for a formal session end event, because the browser may not send one and the user may continue browsing after clicking phone, email or messenger.

## 10. Internal Traffic Marker

Если браузер хотя бы раз был авторизован в админке, он получает internal traffic marker.

События с этим marker:

- могут сохраняться;
- используются для отладки;
- не попадают в основные продуктовые отчеты по умолчанию.

Boundary requirements:

- не полагаться только на IP;
- не хранить чувствительные данные в marker cookie;
- не хранить admin identity в public telemetry event;
- не смешивать internal traffic с реальными пользовательскими signals;
- предусмотреть `is_test` для smoke/debug events, если включит owner.

## 11. Privacy Boundary

Telemetry domain не должен хранить персональные данные пользователя.

Forbidden:

- телефон пользователя;
- email пользователя;
- имя пользователя;
- текст сообщения;
- содержимое формы;
- запись экрана;
- ввод в поля;
- точный fingerprint;
- лишние user-agent/IP данные без отдельного решения.

Allowed with minimization:

- anonymous session id;
- anonymous visitor id, если нужен и разрешен;
- page path;
- event type;
- entity context;
- placement;
- contact channel;
- active time;
- scroll depth;
- previous significant events.

`metadata` допускается только как строго ограниченный allowlisted context. Он не должен становиться способом обойти privacy boundary. Произвольный metadata blob без per-event allowlist запрещен.

## 12. Read Model Expectations

Будущая админка, SEO dashboard, reports и LLM должны читать подготовленные агрегаты или bounded read-contracts, а не собирать свою правду из UI, raw events или external analytics directly.

Expected future read use:

- page-level contact intent aggregates;
- service-level interest and contact aggregates;
- case engagement before contact;
- CTA/placement performance;
- contact channel distribution;
- pages with engagement but no contact;
- contact journeys as short evidence trails;
- source freshness and limitations;
- internal/test exclusion flags.

LLM context должен получать только подготовленный, privacy-filtered slice. LLM не получает direct SQL, raw event dump, form values, secrets, personal data или unfiltered internal traffic.

## 13. Future Integration Seams

Future seams that this boundary intentionally leaves open:

- Lead domain receives journey context after a real lead exists;
- ATS/call-tracking can match calls after separate owner/legal decision;
- CRM can consume qualified lead context after Lead domain exists;
- SEO dashboard can consume aggregates, not raw telemetry;
- Яндекс.Метрика adapter can mirror contact goals;
- LLM can receive aggregate and journey context for advisory analysis;
- admin/debug mode can expose internal/test events separately.

These integrations must connect through telemetry contracts or read-contracts, not direct UI button instrumentation.

## 14. Non-Goals

This domain boundary does not include:

- CRM-lite;
- сложную форму заявки;
- sales pipeline;
- lead scoring;
- qualified lead workflow;
- manager assignment;
- SLA;
- AI-рекомендации;
- автоматическую оптимизацию сайта;
- персонализацию сайта под пользователя;
- session replay;
- heatmaps;
- запись экрана;
- запись ввода в формы;
- внешний CRM integration;
- ATS/call-tracking integration;
- SEO dashboard;
- большой BI dashboard;
- изменение `/about` и `/contacts`;
- изменение Content Core;
- автономное изменение контента на основе телеметрии;
- final DB schema;
- migration plan;
- concrete endpoint design;
- adapter implementation.

## 15. Questions For Future Blueprint

Future implementation blueprint должен решить:

1. Где живет runtime telemetry contract и как его импортирует Public UI?
2. Какой minimal event validation layer нужен?
3. Где создается и обновляется anonymous `session_id`?
4. Нужен ли `anonymous_visitor_id` между сессиями?
5. Какой exact retention для raw events, journeys и aggregates?
6. Какие events считаются significant для journey extraction?
7. Как схлопывать repeated rapid clicks?
8. Как marking internal/test traffic работает на public pages после admin auth?
9. Как пользователь или разработчик может сбросить internal marker в браузере?
10. Как включить test mode для smoke/debug events?
11. Как проверить, что internal/test events реально исключаются из default reports?
12. Нужен ли debug surface для internal/test events?
13. Какие external adapters включаются на старте?
14. Как обеспечить privacy/cookie notice requirements?
15. Как future read model отделяет aggregates от raw events?
16. Как future LLM context получает bounded evidence без raw data?
17. Как future Lead domain получает journey context без превращения intent events в leads?

До ответа на эти вопросы реализация не должна начинаться с таблиц, endpoint-ов или прямых вызовов Яндекс.Метрики из UI.
