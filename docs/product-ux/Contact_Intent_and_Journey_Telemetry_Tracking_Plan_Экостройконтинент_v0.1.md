# Contact Intent & Journey Telemetry Tracking Plan

Проект: «Экостройконтинент»
Версия: v0.1.1
Статус: product tracking plan / launch-core documentation
Дата: 2026-05-07
Companion PRD: `Contact_Intent_and_Journey_Telemetry_PRD_Экостройконтинент_v0.1.md`

## 1. Purpose

Этот документ фиксирует продуктовый словарь событий для домена **Contact Intent & Journey Telemetry**.

Это не техническая таблица БД, не миграция и не endpoint contract. Цель документа - заранее договориться, какие события считаются значимыми, какой контекст нужен для интерпретации и какие privacy-границы нельзя нарушать.

Главная логика:

```text
interest events -> contact intent event -> optional contact journey
```

Contact intent phase 1:

- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`.

`cta_clicked` не всегда равен contact intent. Кнопка «Подробнее» - это CTA, но не контактное действие.

Recommended MVP single-counting rule: если CTA ведет напрямую к телефону, email или мессенджеру, Public UI отправляет только финальное семантическое событие `phone_clicked`, `email_clicked` или `messenger_clicked`. CTA-контекст передается полями `cta_kind`, `placement`, `destination_kind` и `contact_channel`. `cta_clicked` остается для неконтактных CTA: «Подробнее», «Смотреть кейс», «Открыть услугу», «Перейти в раздел».

## 2. Event Categories

| Category | Meaning |
| --- | --- |
| `page` | Просмотр публичной страницы или route-level события. |
| `engagement` | Поведение, показывающее интерес без прямого контакта. |
| `cta` | Клик по явному призыву к действию. |
| `contact_intent` | Пользователь открыл контактный канал. |
| `journey` | Системное/domain событие создания короткого пути до контакта. |
| `diagnostic` | Internal/test/debug behavior, если включено будущим решением. |

## 3. Common Event Envelope

Общий словарь полей:

| Field | Required | Meaning |
| --- | --- | --- |
| `event_name` | yes | Имя события из tracking plan. |
| `event_version` | yes | Версия события, например `1.0`. |
| `occurred_at` | yes | Время события; server time предпочтителен при приеме. |
| `session_id` | yes | Анонимная web session. |
| `anonymous_visitor_id` | optional | Persistent visitor id между сессиями, только если owner/legal разрешит. Не default для phase 1. |
| `page_path` | yes | Path без чувствительных query params. |
| `page_title` | optional | Заголовок страницы на момент события, если безопасно. |
| `referrer` | optional | Referrer после очистки от чувствительных query params. |
| `utm_source` | optional | Campaign attribution. |
| `utm_medium` | optional | Campaign attribution. |
| `utm_campaign` | optional | Campaign attribution. |
| `entity_type` | optional | `service`, `case`, `page`, `index`, `unmapped`, later `article`. |
| `entity_id` | optional | Public-safe id route-owning entity, если известен. |
| `entity_slug` | optional | Public slug, если известен. |
| `placement` | event-specific | Где произошло событие: `header`, `hero`, `service_card`, `case_card`, `gallery`, `footer`, etc. |
| `contact_channel` | contact events | `phone`, `email`, `telegram`, `whatsapp`, other approved channel. |
| `active_time_ms` | optional | Ориентировочное активное время до события. |
| `max_scroll_depth` | optional | Максимальная глубина scroll до события. |
| `previous_significant_events` | optional | Короткий список значимых событий до contact intent. |
| `is_internal` | yes | Маркер внутреннего трафика. |
| `is_test` | yes | Маркер test/smoke/debug event. |
| `metadata` | optional | Строго ограниченный allowlisted контекст события. |

Default phase-1 identity = anonymous `session_id` only. Persistent `anonymous_visitor_id` between sessions requires explicit owner/legal decision.

`metadata` не должен становиться мусорным контейнером для всего подряд. Он допускается только для ограниченного, обоснованного контекста, который помогает интерпретировать конкретное событие и не содержит персональных данных.

Каждое событие должно иметь allowlist metadata-полей. Произвольный `metadata` JSON без per-event allowlist запрещен.

Forbidden in any event:

- телефон пользователя;
- email пользователя;
- имя пользователя;
- текст сообщения;
- содержимое формы;
- запись экрана;
- ввод в поля;
- точный fingerprint;
- raw IP/user-agent retention без отдельного решения.

## 4. Internal Traffic Behavior

Если браузер хотя бы раз был авторизован в админке, он получает internal traffic marker.

Default behavior:

- `is_internal = true` для событий с admin-auth marker;
- такие события могут сохраняться для диагностики;
- такие события не попадают в основные product reports по умолчанию;
- internal marker не должен хранить user id, email, роль, токены или другие чувствительные данные;
- IP-only filtering не считается достаточной моделью.

`is_test = true` reserved для smoke/debug events, если owner решит включить отдельный test mode.

## 5. External Adapter Behavior

Внешние analytics tools могут получать события через adapters:

- Яндекс.Метрика;
- Google Analytics;
- PostHog;
- Plausible;
- Matomo;
- future admin reports;
- future LLM context;
- future CRM/ATS integration после отдельного решения.

Внешние tools не владеют внутренней семантикой. UI-компоненты не должны вызывать внешние счетчики напрямую.

Расхождения с Яндекс.Метрикой допустимы из-за blockers, cookies, bot filtering, internal traffic markers, задержек и разных правил подсчета. Это не дублирование, а резервирование.

## 6. Phase-1 Events

### `page_viewed`

```yaml
event_name: page_viewed
event_version: "1.0"
event_category: page
why_it_matters: показывает, какие страницы и маршруты получают внимание
where_it_happens: home, services index, service page, cases index, case page, other published public routes
required_context:
  - page_path
  - session_id
  - occurred_at
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - page_title
  - referrer
  - utm_source
  - utm_medium
  - utm_campaign
  - entity_type
  - entity_id
  - entity_slug
privacy_notes:
  - не хранить sensitive query params
  - не хранить raw IP/user-agent без отдельного решения
internal_traffic_behavior:
  - сохранять как internal/debug сигнал
  - исключать из основных product reports по умолчанию
external_adapter_behavior:
  - можно отправлять как page view во внешние analytics tools, если adapter включен
  - внешняя аналитика не становится source of truth для page/entity semantics
```

### `page_engagement_recorded`

Phase 1 не требует постоянных heartbeat-событий. Engagement может фиксироваться агрегированно: при смене route, visibility change, уходе со страницы или достижении разумного порога. Это событие не должно превращаться в поток технических пингов каждые несколько секунд.

```yaml
event_name: page_engagement_recorded
event_version: "1.0"
event_category: engagement
why_it_matters: показывает, что страницу не только открыли, но и изучали
where_it_happens: public pages with measurable active time or scroll depth
required_context:
  - page_path
  - session_id
  - occurred_at
  - active_time_ms
  - max_scroll_depth
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - placement
  - previous_significant_events
privacy_notes:
  - не превращать engagement в session replay
  - не хранить pixel-level heatmap или запись экрана
internal_traffic_behavior:
  - исключать из основных engagement aggregates по умолчанию
external_adapter_behavior:
  - можно отправлять агрегированно или как custom event, если adapter поддерживает
  - не требовать совпадения чисел с внешними счетчиками
```

### `service_card_opened`

`service_card_opened` используется только если пользователь взаимодействует с карточкой как с отдельным UI-объектом: раскрывает, открывает preview/modal или явно кликает card surface. Если пользователь просто перешел на route услуги, основное событие - `page_viewed` с `entity_type = service`.

```yaml
event_name: service_card_opened
event_version: "1.0"
event_category: engagement
why_it_matters: показывает интерес к конкретной услуге до контакта
where_it_happens: home service blocks, services index, related service blocks, navigation surfaces
required_context:
  - page_path
  - placement
  - session_id
  - occurred_at
  - entity_type
  - entity_id
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_slug
  - page_title
  - service_hint
  - active_time_ms
  - max_scroll_depth
privacy_notes:
  - entity context должен ссылаться на Content Core identity, но не копировать редакционный контент
internal_traffic_behavior:
  - использовать для QA/debug, не смешивать с user interest reports
external_adapter_behavior:
  - можно отправлять как semantic engagement event
  - adapter не должен менять event_name или смысл внутри telemetry domain
```

### `case_card_opened`

`case_card_opened` используется только если пользователь взаимодействует с карточкой как с отдельным UI-объектом: раскрывает, открывает preview/modal или явно кликает card surface. Если пользователь просто перешел на route кейса, основное событие - `page_viewed` с `entity_type = case`.

```yaml
event_name: case_card_opened
event_version: "1.0"
event_category: engagement
why_it_matters: показывает, какие кейсы помогают пользователю двигаться к контакту
where_it_happens: home proof blocks, service pages, cases index, related cases, case cards
required_context:
  - page_path
  - placement
  - session_id
  - occurred_at
  - entity_type
  - entity_id
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_slug
  - source_entity_type
  - source_entity_id
  - active_time_ms
  - max_scroll_depth
privacy_notes:
  - не хранить пользовательские комментарии или форму обратной связи
internal_traffic_behavior:
  - исключать из business proof engagement reports по умолчанию
external_adapter_behavior:
  - можно отправлять как semantic engagement event
  - внешние counts могут отличаться от внутренних из-за filtering
```

### `gallery_opened`

```yaml
event_name: gallery_opened
event_version: "1.0"
event_category: engagement
why_it_matters: показывает интерес к visual proof перед контактным действием
where_it_happens: service pages, case pages, media/gallery blocks, proof sections
required_context:
  - page_path
  - placement
  - session_id
  - occurred_at
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - gallery_id
  - active_time_ms
  - max_scroll_depth
privacy_notes:
  - не хранить pixel-level coordinates
  - не хранить пользовательский ввод или visual session replay
internal_traffic_behavior:
  - сохранять для проверки gallery UX, но исключать из default reports
external_adapter_behavior:
  - можно отправлять как custom event или goal, если adapter включен
```

### `cta_clicked`

```yaml
event_name: cta_clicked
event_version: "1.0"
event_category: cta
why_it_matters: показывает, какие CTA вызывают действие, даже если это не контакт
where_it_happens: non-contact CTA placements such as cards, related blocks, inline content blocks, navigation sections
required_context:
  - page_path
  - placement
  - session_id
  - occurred_at
  - cta_kind
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - destination_kind
  - active_time_ms
  - max_scroll_depth
privacy_notes:
  - не хранить пользовательский текст или форму
  - не считать автоматически lead
internal_traffic_behavior:
  - исключать из CTA performance reports по умолчанию
external_adapter_behavior:
  - можно отправлять как custom event
  - contact CTA adapters должны получать mapped goal из финального contact event, а не из отдельного `cta_clicked`
```

Важно: `cta_clicked` сам по себе не равен contact intent. В MVP contact CTA не должен отправлять одновременно `cta_clicked` и `phone_clicked` / `email_clicked` / `messenger_clicked`. Если будущая версия выберет двойную отправку, reports обязаны применять anti-double-counting rule.

### `phone_clicked`

```yaml
event_name: phone_clicked
event_version: "1.0"
event_category: contact_intent
why_it_matters: показывает, что пользователь решил связаться по телефону
where_it_happens: header, hero CTA, service page CTA, case page CTA, sticky contact block, footer
required_context:
  - page_path
  - placement
  - contact_channel
  - session_id
  - occurred_at
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - service_hint
  - active_time_ms
  - max_scroll_depth
  - previous_significant_events
privacy_notes:
  - не хранить номер телефона пользователя
  - не хранить персональные данные
  - контактный номер компании должен приходить из contact truth, а не из event payload
internal_traffic_behavior:
  - сохранять для debug, но исключать из основного contact intent reporting
external_adapter_behavior:
  - можно отправлять как goal/counter event во внешние tools
  - внешний call-tracking/АТС matching не входит в phase 1
```

### `email_clicked`

```yaml
event_name: email_clicked
event_version: "1.0"
event_category: contact_intent
why_it_matters: показывает, что пользователь решил связаться по email
where_it_happens: header, contact blocks, service page CTA, case page CTA, footer
required_context:
  - page_path
  - placement
  - contact_channel
  - session_id
  - occurred_at
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - active_time_ms
  - max_scroll_depth
  - previous_significant_events
privacy_notes:
  - не хранить email пользователя
  - не хранить текст письма
  - company email value не должен быть sole analytics identity
internal_traffic_behavior:
  - исключать из business contact reports по умолчанию
external_adapter_behavior:
  - можно отправлять как contact goal/custom event
  - внешние counts могут отличаться из-за mail client behavior и blockers
```

### `messenger_clicked`

```yaml
event_name: messenger_clicked
event_version: "1.0"
event_category: contact_intent
why_it_matters: показывает, что пользователь решил связаться через мессенджер
where_it_happens: header, hero CTA, service page CTA, case page CTA, sticky contact block, footer
required_context:
  - page_path
  - placement
  - contact_channel
  - session_id
  - occurred_at
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - entity_type
  - entity_id
  - entity_slug
  - active_time_ms
  - max_scroll_depth
  - previous_significant_events
privacy_notes:
  - не хранить аккаунт пользователя
  - не хранить текст сообщения
  - не хранить phone/email пользователя, если мессенджер передает их внешней системе
internal_traffic_behavior:
  - исключать из default contact channel reports
external_adapter_behavior:
  - можно отправлять как contact goal/custom event
  - `telegram`, `whatsapp` и другие каналы различаются через `contact_channel`
```

### `contact_journey_created`

`contact_journey_created` is a system/domain event. It must never be emitted directly by Public UI.

`contact_journey_created` создается только внутри telemetry domain. Публичный UI не имеет права отправлять это событие напрямую.

```yaml
event_name: contact_journey_created
event_version: "1.0"
event_category: journey
why_it_matters: фиксирует короткий путь до контакта для сессий с contact intent
where_it_happens: telemetry domain after phone_clicked, email_clicked, or messenger_clicked
required_context:
  - session_id
  - occurred_at
  - contact_channel
  - final_contact_event_name
  - previous_significant_events
  - is_internal
  - is_test
optional_context:
  - anonymous_visitor_id
  - landing_page_path
  - final_page_path
  - final_entity_type
  - final_entity_id
  - total_active_time_ms
  - max_scroll_depth
privacy_notes:
  - journey должен быть коротким и privacy-bounded
  - не хранить полный session replay
  - не хранить form input или personal data
internal_traffic_behavior:
  - internal journeys можно хранить для debug отдельно
  - default product reports exclude internal/test journeys
external_adapter_behavior:
  - обычно не отправлять во внешние счетчики как raw journey
  - можно использовать агрегаты или mapped goals в будущих reports
```

## 7. Future Events, Not Phase-1 Requirements

Эти события допустимы как future vocabulary, но не являются requirement для phase 1:

| Event | Category | Future Meaning |
| --- | --- | --- |
| `form_started` | engagement/contact_pre_intent | Пользователь начал форму. Не хранить ввод. |
| `form_submitted` | lead_intake | Форма успешно отправлена; это уже граница lead/intake. |
| `lead_created` | lead | Lead record создан отдельным Lead domain. |
| `manual_lead_created` | lead | Менеджер вручную создал lead после внешнего контакта. |
| `ats_call_matched` | integration | Внешняя АТС/call-tracking matched call к сайту или journey. |

Future lead events должны жить в Lead domain или integration boundary, а не превращать contact intent telemetry в CRM.

## 8. Significant Events For Contact Journey

Кандидаты significant events:

- `page_viewed`;
- `service_card_opened`;
- `case_card_opened`;
- `gallery_opened`;
- meaningful `cta_clicked`;
- final `phone_clicked`, `email_clicked`, `messenger_clicked`.

Не стоит включать в journey по умолчанию:

- каждый scroll milestone;
- hover;
- repeated rapid clicks;
- технические visibility pings;
- raw page activity ticks;
- form input events.

Owner decision: какие события считать significant и нужно ли схлопывать повторные клики в отчетах.

## 9. Contact Channels

Recommended phase-1 model:

- `phone_clicked` with `contact_channel = phone`;
- `email_clicked` with `contact_channel = email`;
- `messenger_clicked` with `contact_channel = telegram`, `whatsapp` or another approved channel.

Такой подход сохраняет единый event vocabulary и позволяет сравнивать каналы без раздувания списка событий.

Owner decisions:

- какие contact channels включить на старте;
- считать ли Telegram и WhatsApp отдельными `contact_channel` внутри `messenger_clicked`;
- какой телефон ведет в АТС;
- какие каналы разрешено отправлять во внешние analytics adapters.

## 10. Reporting Interpretation

Phase 1 reports должны быть directional:

- page views;
- engagement by page/entity;
- service/card opens;
- gallery opens;
- CTA clicks;
- contact intent events by channel;
- journeys for sessions ending in contact intent;
- pages with views/engagement but no contact intent.

Do not report:

- contact intent as lead;
- external analytics counts as internal truth;
- exact user identity;
- session replay;
- heatmaps;
- form input behavior.

## 11. Owner Decisions

Открытые решения:

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

## 12. Acceptance Checklist

Tracking plan считается достаточным, если по нему можно понять:

- какие события собираем в phase 1;
- какие события не собираем;
- чем `cta_clicked` отличается от contact intent;
- почему `phone_clicked`, `email_clicked`, `messenger_clicked` не являются leads;
- какой общий envelope нужен для событий;
- какие поля запрещено хранить;
- как работает internal/test marker;
- как внешние adapters получают события без размазывания analytics по UI-коду;
- как строится короткий contact journey;
- какие решения owner/legal должны принять до implementation blueprint.
