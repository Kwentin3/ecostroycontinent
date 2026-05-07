# Contact Intent & Journey Telemetry PRD

Проект: «Экостройконтинент»
Версия: v0.1.1
Статус: PRD-first / launch-core documentation
Дата: 2026-05-07

## 1. Purpose

Этот документ фиксирует продуктовый смысл домена **Contact Intent & Journey Telemetry**: домена контактных действий и путей до контакта.

Главный вопрос домена:

```text
Что человек смотрел перед тем, как решил связаться?
```

Мы не строим CRM и не строим универсальную аналитику.

Мы строим узкий склад контактной телеметрии: он собирает события интереса, фиксирует контактные действия и сохраняет snapshot пути до контакта в момент звонка, email-клика или клика по мессенджеру.

Остальные сессии используются для агрегатов.

Главная ценность: понять, какие страницы, услуги, кейсы и блоки реально доводят посетителя до желания связаться.

## 2. Context

Изначально эпик назывался `Lead Intake Domain Launch`, но для launch-core scope уточнен до более узкого MVP-домена: `Contact Intent & Journey Telemetry Domain`.

На этом этапе сайту не нужны CRM-lite, сложная форма заявок, sales pipeline или полноценный lead management. Нужно зафиксировать измерительный слой, который показывает путь пользователя к контактному действию без превращения каждого клика в лид.

Текущие канонические границы проекта остаются прежними:

- Content Core остается source of truth для контента.
- Public Web не становится владельцем редакционной истины.
- Telemetry domain не является частью Content Core.
- Contact intent events не являются lead records.
- Lead domain остается соседним операционным доменом.
- AI не принимает автономных решений и не меняет контент.
- `/about` и `/contacts` не меняются в рамках этого эпика.

## 3. Problem

Сейчас команда может видеть факт существования публичных страниц, услуг, кейсов и CTA, но не имеет внутреннего контрактного слоя, который отвечает на продуктовые вопросы:

- какие страницы приводят к контактному действию;
- какие услуги вызывают интерес;
- какие кейсы помогают довести пользователя до звонка;
- какие CTA работают;
- какие контактные каналы выбирают чаще;
- какие страницы смотрят, но не нажимают контакт;
- какой путь был перед контактным действием.

Внешние счетчики могут помочь, но они не владеют внутренней семантикой сайта и не должны быть единственным источником product telemetry.

## 4. Product Goal

Phase 1 должна дать directional telemetry, а не бухгалтерскую точность.

Не важно, было ровно 18 или 22 контактных клика. Важно понять, что страница «Монолитные работы» реально приводит к звонкам, а страница «Фасадные работы» получает просмотры, но не доводит до контакта.

Данные phase 1 используются для продуктовых ориентиров, а не для финансовой отчетности, SLA, оплаты рекламы или автоматических решений.

Ожидаемый результат:

```text
Сайт фиксирует анонимные события интереса и контактные действия.
Когда наступает контактное действие, система сохраняет snapshot короткого пути до этого контакта.
Сессии без контактного действия используются только для агрегатов и не обязаны храниться как подробный маршрут.
```

## 5. Domain Semantics

Базовая семантика домена:

- просмотр страницы, карточки или кейса = интерес;
- клик по телефону, email или мессенджеру = contact intent event;
- форма с оставленными контактными данными = lead;
- подтвержденный целевой клиент после ручной проверки = qualified lead.

На этом этапе `contact intent event` не считается `lead`.

Пример:

```text
Пользователь нажал телефон -> это контактное намерение.
Звонок ушел в АТС -> реальный контакт обрабатывает человек или внешняя телефонная система.
Сайт только фиксирует момент и контекст нажатия.
```

## 6. What Is Contact Intent

Contact intent event - это действие пользователя, которое явно открывает контактный канал.

Contact intent phase 1:

- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`.

`cta_clicked` - общий CTA event, а не contact intent by default. Кнопка «Подробнее», переход в кейс или открытие карточки услуги - это engagement/interest, но не contact intent.

Для `messenger_clicked` phase 1 использует единое событие с полем `contact_channel`, например `telegram`, `whatsapp` или другой разрешенный мессенджер.

Recommended MVP single-counting rule: контактный CTA отправляет только финальное семантическое событие `phone_clicked`, `email_clicked` или `messenger_clicked`. CTA-контекст передается полями вроде `cta_kind`, `placement`, `destination_kind` и `contact_channel`. `cta_clicked` остается для неконтактных CTA: «Подробнее», «Смотреть кейс», «Открыть услугу», «Перейти в раздел».

## 7. What Is Not A Lead

Contact intent event не создает lead record.

Не lead:

- клик по телефону;
- клик по email;
- клик по Telegram или WhatsApp;
- просмотр страницы;
- открытие карточки услуги;
- открытие карточки кейса;
- открытие галереи;
- scroll depth;
- активное время на странице;
- переход на `/contacts`, если пользователь не оставил данные.

Lead появляется только тогда, когда есть отдельный lead/intake contract: пользователь оставил контактные данные, либо менеджер вручную создал lead из внешнего контакта. Qualified lead появляется только после ручной проверки.

## 8. Phase-1 Scope

Phase 1 включает:

- единый продуктовый словарь событий контактной телеметрии;
- фиксацию anonymous session context;
- фиксацию contact intent events;
- короткий contact journey для сессий с контактным действием;
- агрегаты по обычным сессиям без подробного долгого маршрута;
- internal/test traffic marker semantics;
- privacy/data minimization policy;
- adapter boundary для внешних analytics tools;
- read-contract expectations для будущей админки, отчетов и LLM context.

Минимальные события phase 1:

- `page_viewed`;
- `page_engagement_recorded`;
- `service_card_opened`;
- `case_card_opened`;
- `gallery_opened`;
- `cta_clicked`;
- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`;
- `contact_journey_created`.

## 9. Non-Goals

Phase 1 не включает:

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
- автономное изменение контента на основе телеметрии.

Также phase 1 не проектирует финальную БД-схему, API endpoints, миграции, фоновые jobs, UI dashboard или adapter implementation.

## 10. Product Value

Домен нужен, чтобы владелец сайта, SEO-специалист и команда могли принимать практичные решения:

- какие услуги стоит усилить доказательствами;
- какие кейсы реально помогают довести до контакта;
- где CTA видят, но не нажимают;
- какие страницы получают интерес, но не дают контактов;
- какой контактный канал выбирают чаще;
- где путь до контакта короткий и понятный;
- где пользователь долго смотрит материалы, но не доходит до связи.

Это foundation для будущих отчетов, но не самостоятельный BI-продукт.

## 11. Main User Questions This Domain Should Answer

Домен должен помогать ответить:

- Какие страницы приводят к contact intent?
- Какие услуги чаще появляются в пути до контакта?
- Какие кейсы открывают перед звонком или сообщением?
- Какие CTA и placements работают лучше?
- Какие каналы выбирают: phone, email, Telegram, WhatsApp?
- Какие страницы имеют просмотры и engagement, но не дают contact intent?
- Какие значимые события происходили перед контактом?
- Какие сигналы нужно исключить как internal/test traffic?
- Какие данные можно дать будущей админке или LLM без нарушения privacy boundary?

## 12. Contact Journey Logic

Все сессии можно наблюдать, но не все сессии нужно хранить одинаково подробно.

Правило:

1. Сырые события используются для агрегатов.
2. Когда происходит contact intent event, telemetry domain сразу создает snapshot `contact_journey`.
3. `contact_journey` хранит короткий путь до контакта.
4. Если сессия не завершилась контактным действием, полный маршрут не обязан храниться долго.
5. Для обычных сессий достаточно агрегатов: просмотры, активное время, scroll depth, открытия карточек.

Contact journey не должен ждать формального завершения сессии: браузер может не прислать событие закрытия, а пользователь может нажать телефон, вернуться на сайт и продолжить просмотр. Journey создается в момент `phone_clicked`, `email_clicked` или `messenger_clicked` и описывает путь до этого contact intent.

Пример contact journey:

```text
home_page_viewed
-> service_page_viewed: Строительство домов
-> case_card_opened: Дом в Сочи
-> gallery_opened
-> phone_clicked
```

В journey попадают только significant events, например page views, service/case card opens, gallery opens, meaningful CTA clicks и финальный contact intent. Повторные технические события, шумные scroll ticks и мелкие UI interactions не должны раздувать путь.

## 13. Internal Vs External Traffic

Если браузер хотя бы раз был авторизован в админке, он получает internal traffic marker.

События с этим marker:

- могут сохраняться;
- используются для отладки;
- не попадают в основные продуктовые отчеты по умолчанию.

Правила:

- не полагаться только на IP;
- не хранить чувствительные данные в marker cookie;
- не смешивать внутренний трафик с реальными пользовательскими сигналами;
- предусмотреть отдельный `is_test` marker для smoke/debug events, если команда решит его включить.

## 14. Privacy And Data Minimization

Telemetry domain не должен хранить персональные данные пользователя.

Не хранить:

- телефон пользователя;
- email пользователя;
- имя пользователя;
- текст сообщения;
- содержимое формы;
- запись экрана;
- ввод в поля;
- точный fingerprint;
- лишние user-agent/IP данные без отдельного решения.

Допустимо:

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

Default phase-1 identity = anonymous `session_id` only. Persistent `anonymous_visitor_id` между сессиями не является default и требует отдельного owner/legal decision.

Recommended retention posture до точных owner/legal сроков:

- raw telemetry should have limited retention;
- contact journeys may have longer retention, because they are more product-useful;
- aggregates may be retained longest.

Owner/legal decisions:

- нужен ли cookie/privacy notice для такой телеметрии;
- какие внешние аналитические инструменты разрешены;
- нужно ли явно упоминать внутреннюю telemetry cookie;
- сколько хранить raw events;
- сколько хранить contact journeys;
- сколько хранить агрегаты.

## 15. Relationship With External Analytics

Яндекс.Метрика, Google Analytics, PostHog, Plausible, Matomo или другие инструменты могут быть внешними получателями событий.

Но они не являются владельцами внутренней семантики домена.

Внутренняя телеметрия - операционный слой сайта. Внешняя аналитика - дополнительный измерительный слой.

Расхождения допустимы. Внутренние события и Яндекс.Метрика могут показывать разные числа из-за блокировщиков, cookies, фильтрации, ботов, внутреннего трафика, задержек и разных правил подсчета.

Это не дублирование, а резервирование.

## 16. Relationship With Content Core

Content Core остается source of truth для контента, опубликованных ревизий, сущностей, названий услуг, кейсов и редакционной истины.

Telemetry domain может ссылаться на public-safe entity context:

- `entity_type`;
- `entity_id`;
- `entity_slug`;
- `page_path`;
- `page_title`.

Telemetry domain не владеет:

- текстами страниц;
- редакционными статусами;
- published revisions;
- контактной истиной;
- маршрутизацией public pages;
- решением, какие страницы публиковать.

## 17. Relationship With Lead Domain

Lead domain остается отдельным соседним операционным доменом.

Contact intent telemetry может в будущем дать lead domain контекст: что пользователь смотрел перед контактом. Но phase 1 не создает lead records и не квалифицирует клиентов.

Граница:

- contact intent = пользователь открыл канал связи;
- lead = пользователь оставил контактные данные или менеджер вручную создал запись;
- qualified lead = человек после проверки признан целевым клиентом.

## 18. Relationship With AI / LLM Context

LLM может в будущем использовать агрегаты и contact journeys как контекст для анализа сайта.

LLM может получить:

- агрегаты по страницам;
- агрегаты по услугам;
- contact journeys;
- страницы с интересом, но без контактов;
- страницы с контактами.

LLM может предложить:

- какие страницы усилить;
- какие кейсы поднять выше;
- где CTA слабый;
- где нужен дополнительный proof content.

Но:

- LLM не принимает автономных решений;
- LLM не меняет контент;
- LLM не публикует страницы;
- LLM не квалифицирует лиды;
- LLM не делает персонализацию сайта;
- LLM не получает raw events dump, персональные данные, форму ввода, secrets или direct SQL.

Все решения принимает человек.

## 19. Success Criteria

Документационный проход считается успешным, если команда может ответить:

- Что такое contact intent event?
- Чем contact intent отличается от lead?
- Какие события собираем в phase 1?
- Какие события не собираем?
- Какие данные запрещено хранить?
- Какой путь до контакта сохраняем?
- Что происходит с сессиями без контакта?
- Как UI-компоненты передают события?
- Почему нельзя размазывать аналитику по кнопкам?
- Как подключаются внешние analytics tools?
- Почему расхождения с Яндекс.Метрикой допустимы?
- Как отделяется внутренний трафик?
- Что сможет использовать будущая админка?
- Что сможет использовать будущая LLM?
- Что точно не входит в phase 1?

## 20. Owner Decisions

Открытые решения перед implementation blueprint:

1. Какие contact channels включаем в phase 1?
2. Считаем ли WhatsApp и Telegram одним типом `messenger_clicked` или разными каналами?
3. Какой контактный номер ведет в АТС?
4. Нужно ли подключать Яндекс.Метрику как adapter на старте?
5. Нужны ли Google Analytics / PostHog / Plausible / Matomo?
6. Нужен ли cookie/privacy notice?
7. Сколько хранить raw telemetry?
8. Сколько хранить contact journeys?
9. Нужно ли хранить anonymous visitor id между сессиями или достаточно session id?
10. Какие события считать significant для contact journey?
11. Нужно ли схлопывать повторные клики в отчетах?
12. Какие внутренние пользователи должны исключаться через admin-auth marker?
13. Нужен ли отдельный test mode для smoke events?
14. Нужно ли показывать внутренние события в отладочном режиме?

## 21. Future Extensions

Будущие расширения после phase 1:

- lead/intake domain;
- manual lead creation;
- ATS/call-tracking matching;
- CRM integration;
- admin reports;
- SEO dashboard consumption;
- analytics read model;
- LLM context packets;
- adapter fan-out to external analytics tools;
- retention/admin settings;
- aggregate exports;
- reconciliation with Яндекс.Метрика goals.

Эти расширения должны строиться поверх единого telemetry contract, а не через прямые вызовы внешних счетчиков из отдельных UI-кнопок.
