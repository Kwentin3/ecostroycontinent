# Contact Intent & Journey Telemetry Implementation Blueprint

Проект: «Экостройконтинент»
Версия: v0.1
Статус: implementation blueprint / launch-core slice
Дата: 2026-05-07

Companion docs:

- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_Tracking_Plan_Экостройконтинент_v0.1.md`
- `docs/engineering/Contact_Intent_and_Journey_Telemetry_Domain_Boundary_Экостройконтинент_v0.1.md`

## 1. Purpose

Этот Blueprint задает инженерную рамку реализации launch-slice для домена **Contact Intent & Journey Telemetry**.

Цель: реализовать узкий контрактный слой, который фиксирует анонимные события интереса, contact intent events и snapshot пути до контакта, не превращая домен в CRM, dashboard или универсальную analytics-платформу.

Главный вопрос домена:

```text
Что человек смотрел перед тем, как решил связаться?
```

Ключевой принцип:

```text
Public UI сообщает событие в единый telemetry layer.
Telemetry domain валидирует, хранит, строит journey и вызывает adapters.
UI не знает Яндекс.Метрику, gtag, PostHog, Plausible, Matomo или будущую админку.
```

## 2. Implementation Scope

В первый реализационный slice входит:

- telemetry runtime contract;
- event vocabulary и validation по Tracking Plan;
- `session_id` creation and storage;
- internal/test markers;
- event ingestion API;
- internal storage for normalized events;
- contact intent events: `phone_clicked`, `email_clicked`, `messenger_clicked`;
- `contact_journey` snapshot в момент contact intent;
- privacy/data minimization;
- optional external adapter seam, без обязательного подключения внешних tools;
- minimal read/debug path для проверки реализации;
- tests;
- deploy, migration и smoke checks.

Не входит:

- CRM-lite;
- lead records;
- form submit / lead intake;
- sales pipeline;
- lead scoring;
- qualified lead workflow;
- ATS/call-tracking integration;
- dashboard;
- heatmaps;
- session replay;
- AI analysis;
- personalization;
- SEO dashboard;
- external CRM;
- изменение `/about` и `/contacts`;
- изменение Content Core;
- direct external analytics calls from UI.

Данные phase 1 используются для продуктовых ориентиров, а не для финансовой отчетности, SLA, оплаты рекламы или автоматических решений.

## 3. Suggested Code Boundary

Проект сейчас использует Next.js App Router, ESM JavaScript, `app/api/.../route.js`, доменные модули в `lib/*`, SQL migrations в `db/migrations`, tests в `tests/*.test.js`.

Рекомендуемая граница для нового домена:

```text
lib/telemetry/
  events.js                  # canonical event vocabulary and categories
  metadata-allowlist.js      # per-event metadata allowlists
  validation.js              # payload validation and normalization
  session.js                 # anonymous session_id helpers
  internal-marker.js         # internal/test marker helpers
  repository.js              # telemetry_events and telemetry_contact_journeys persistence
  journey.js                 # contact journey snapshot extraction
  adapters.js                # adapter interface and no-op/default adapters
  read-debug.js              # minimal internal/debug reads

app/api/telemetry/events/route.js
  # public ingestion boundary

app/api/admin/telemetry/debug/route.js or script
  # optional minimal admin-only/debug read path

tests/telemetry-*.test.js
  # validation, route, repository, journey, adapter, smoke helpers
```

Why `lib/telemetry` instead of extending `lib/analytics` by default:

- existing `lib/analytics/*` is tied to SEO dashboard/read-model work and older event names like `page_view`, `click_to_call`, `click_to_telegram`, `form_submit`;
- the new domain has canonical phase-1 names: `page_viewed`, `phone_clicked`, `email_clicked`, `messenger_clicked`, `contact_journey_created`;
- `form_submit` and lead-like events are explicitly out of scope for this launch-slice;
- mixing the new domain into the existing SEO analytics endpoint risks reviving old semantic drift.

Allowed reuse:

- reuse or extract route/entity resolution logic from `lib/analytics/route-resolver.js` if needed;
- reuse DB client/transaction helpers from `lib/db/client.js`;
- reuse test style from existing `analytics-*` tests;
- do not reuse old event names as internal truth unless a deliberate compatibility adapter maps them.

Roles:

| Component | Role |
| --- | --- |
| Public telemetry client | Small client helper used by UI to emit canonical events. |
| Event contract/types | Canonical names, categories, versions and allowed fields. |
| Validation layer | Strict allowlist, sensitive-field rejection, metadata per-event allowlist. |
| Ingestion handler | `POST /api/telemetry/events`, safe response, route/entity enrichment. |
| Persistence layer | Insert normalized events and journey snapshots. |
| Journey extraction service | Build short snapshot at contact intent time. |
| Adapter interface | Fan-out normalized events after validation only. |
| Read/debug helpers | Minimal verification without building dashboard. |
| Tests | Validate domain behavior and guard against analytics drift. |

## 4. Runtime Telemetry Contract

Public UI emits only canonical domain events.

UI may provide:

- `event_name`;
- `event_version`, default `1.0`;
- `placement`;
- `page_path`;
- `entity_type`, `entity_id`, `entity_slug`, if already known and public-safe;
- `contact_channel` for contact events;
- `cta_kind` and `destination_kind` for CTA context;
- `active_time_ms` and `max_scroll_depth`, if safely measured;
- per-event allowlisted `metadata`.

Telemetry layer must:

- accept event;
- check `event_name` allowlist;
- check `event_version`;
- normalize payload;
- reject or strip forbidden fields by a consistent rule;
- reject arbitrary metadata outside per-event allowlist;
- sanitize `page_path` and `referrer`;
- prefer server-side `occurred_at`;
- treat client timestamp only as advisory if kept at all;
- create or verify `session_id`;
- attach `is_internal` and `is_test`;
- persist normalized event;
- create `contact_journey` snapshot when event is `phone_clicked`, `email_clicked` or `messenger_clicked`;
- send normalized event to adapters after validation if adapters are enabled.

Canonical phase-1 events:

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

`contact_journey_created` is system/domain-only. Public UI must never emit it directly.

## 5. Event Ingestion API

Recommended endpoint:

```text
POST /api/telemetry/events
```

Accepted:

- only canonical events from Tracking Plan;
- JSON body within payload size limit;
- no arrays/batches in MVP unless explicitly added later;
- only allowlisted root fields;
- only per-event allowlisted metadata.

Suggested request shape:

```text
{
  event_name,
  event_version,
  page_path,
  placement,
  entity_type?,
  entity_id?,
  entity_slug?,
  contact_channel?,
  cta_kind?,
  destination_kind?,
  active_time_ms?,
  max_scroll_depth?,
  metadata?
}
```

Server-controlled or server-enriched:

- `occurred_at`;
- `received_at`;
- `session_id` if missing;
- `is_internal`;
- `is_test`;
- route/entity resolution, if client context is missing or stale;
- event category.

Response:

- success: generic `202 Accepted` or `200 OK`;
- validation error: generic `400 INVALID_TELEMETRY_EVENT`;
- payload too large: `413 PAYLOAD_TOO_LARGE`;
- method not allowed: `405`;
- write failure: generic `500 TELEMETRY_WRITE_FAILED`.

Do not return:

- stack traces;
- SQL errors;
- adapter errors;
- raw event payload;
- resolved internal DB details;
- admin identity;
- secrets or config.

Rules:

- unknown `event_name` is rejected;
- invalid `event_version` is rejected unless implementation deliberately normalizes compatible minor versions;
- forbidden root fields are rejected;
- forbidden metadata fields are rejected;
- sensitive query params are removed from `page_path` and `referrer`;
- `page_path` is path-only, no full URL with query retained;
- `referrer` may keep origin + path only;
- payload size should start at a small limit such as 8-16 KB;
- no PII in application logs;
- adapter failure must not expose details to client.

## 6. Event Storage Model

MVP storage should be explicit and narrow.

Recommended migration:

```text
db/migrations/009_contact_intent_telemetry.sql
```

Recommended tables:

- `telemetry_events`;
- `telemetry_contact_journeys`.

Do not reuse `analytics_event` as the only truth by default. Existing `analytics_event` belongs to the older SEO/analytics foundation and currently has older event names and lead-like future events. A future adapter may bridge contact telemetry into analytics aggregates, but the contact-intent domain should keep its own canonical event vocabulary.

### `telemetry_events`

Purpose: normalized first-party telemetry events.

Suggested fields:

| Field | Notes |
| --- | --- |
| `id` | Internal id. |
| `event_name` | Canonical Tracking Plan name. |
| `event_version` | `1.0` for phase 1. |
| `event_category` | `page`, `engagement`, `cta`, `contact_intent`, `journey`. |
| `occurred_at` | Server-preferred event time. |
| `received_at` | Server receive time. |
| `session_id` | Anonymous session id. |
| `page_path` | Sanitized path. |
| `entity_type` | Public-safe entity context. |
| `entity_id` | Public-safe entity id. |
| `entity_slug` | Public-safe slug. |
| `placement` | Header/hero/card/footer/etc. |
| `contact_channel` | `phone`, `email`, `telegram`, `whatsapp`, etc. |
| `active_time_ms` | Optional bounded number. |
| `max_scroll_depth` | Optional bounded number. |
| `is_internal` | Admin-auth marker traffic. |
| `is_test` | Smoke/debug event. |
| `metadata` | JSONB, per-event allowlist only. |
| `created_at` | Insert time. |

Recommended indexes:

- `(occurred_at DESC)`;
- `(session_id, occurred_at ASC)`;
- `(page_path, occurred_at DESC)`;
- `(entity_type, entity_id, occurred_at DESC)`;
- partial index for default reports: `WHERE is_internal = false AND is_test = false`.

### `telemetry_contact_journeys`

Purpose: short snapshot created at contact intent time.

Suggested fields:

| Field | Notes |
| --- | --- |
| `id` | Internal id. |
| `session_id` | Anonymous session id. |
| `final_contact_event_id` | FK/reference to final telemetry event. |
| `final_contact_event_name` | `phone_clicked`, `email_clicked`, `messenger_clicked`. |
| `contact_channel` | Contact channel. |
| `landing_page_path` | First meaningful page in session if available. |
| `final_page_path` | Page where contact intent happened. |
| `final_entity_type` | Final entity type. |
| `final_entity_id` | Final entity id. |
| `previous_significant_events` | Short JSON array of significant events. |
| `total_active_time_ms` | Bounded sum/estimate. |
| `max_scroll_depth` | Max observed depth before contact. |
| `is_internal` | Copied from final event/session marker. |
| `is_test` | Copied from final event/session marker. |
| `created_at` | Insert time. |

Storage rules:

- `metadata` must be per-event allowlisted;
- arbitrary metadata JSON is forbidden;
- do not store personal data;
- do not store raw IP/user-agent without owner/legal decision;
- do not store form input;
- do not store screen recording;
- do not store heatmap/pixel-level data;
- do not store admin user id/email/role/token in public telemetry.

Recommended retention posture until owner/legal sets exact days:

- raw telemetry has limited retention;
- contact journeys may retain longer;
- aggregates may retain longest.

## 7. Session Model

Default phase 1 identity:

```text
anonymous session_id only
```

Persistent `anonymous_visitor_id` between sessions is not enabled by default and requires explicit owner/legal decision.

Session behavior:

- create `session_id` on first telemetry event or first public page load where telemetry client initializes;
- store it in a first-party cookie or local storage only after privacy/cookie decision allows it;
- cookie value must be random, opaque and non-personal;
- suggested lifetime: practical session window, for example 30 minutes of inactivity or browser-session style; exact TTL is owner/legal decision;
- refresh/update session when user is active, without turning it into persistent identity;
- if cookies/storage are unavailable, server may accept event and generate server-side session id for that request, but cross-request journey quality will be limited;
- `session_id` must not encode user data, admin identity, IP, user-agent, page path or contact channel;
- session id is an analytics key, not a person identity.

Implementation should document cookie name and TTL in `.env.example` or config only if a configurable value is added. Do not place production values or secrets in `.env.example`.

## 8. Internal/Test Traffic

Internal marker rule:

```text
Если браузер хотя бы раз был авторизован в админке,
он получает internal traffic marker.
```

Events with marker:

- `is_internal = true`;
- may be stored for diagnostics;
- excluded from default product reads/reports.

Implementation requirements:

- set marker during/after successful admin auth, or infer from active admin session server-side and set a separate safe marker;
- marker cookie must contain no user id, email, role, token or session id;
- public telemetry event must not store admin identity;
- IP-only filtering is not enough;
- provide a way to reset internal marker;
- decide whether “view site as external user” clears marker temporarily or opens isolated mode;
- support `is_test = true` for smoke/debug events;
- default read/debug queries must exclude `is_internal = true` and `is_test = true`;
- debug-only reads may include them when explicitly requested by admin/debug tooling.

Open implementation choices:

- marker cookie name;
- marker TTL;
- reset mechanism;
- test mode trigger: header, query param, env-guarded smoke token or script-only flag.

## 9. Contact Journey Extraction

Mandatory rule:

```text
contact_journey is created at contact intent event time
```

Do not wait for formal session end. Browser close/visibility events are unreliable, and the user may continue browsing after clicking phone, email or messenger.

Contact intent phase 1:

- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`.

When one of these events is stored:

1. Query prior significant events for same `session_id`.
2. Filter out internal technical noise.
3. Collapse repeated rapid events.
4. Limit journey length.
5. Include final contact event.
6. Store `telemetry_contact_journeys`.
7. Emit system/domain event semantics internally as `contact_journey_created`, but do not accept it from UI.

Significant events:

- `page_viewed`;
- `service_card_opened`;
- `case_card_opened`;
- `gallery_opened`;
- meaningful `cta_clicked`;
- final contact intent event.

Do not include:

- every scroll tick;
- heartbeat;
- hover;
- repeated rapid clicks;
- technical pings;
- form input;
- screen recording;
- heatmap/pixel data.

Recommended constraints:

- `previous_significant_events`: max 10-15 items;
- repeated rapid clicks: collapse same `event_name + page_path + placement + entity/contact_channel` within 2-5 seconds;
- active time: use bounded `active_time_ms` from engagement events or final event, never raw heartbeat stream;
- scroll depth: store max value per page/session, not every milestone;
- if no prior events exist, journey still stores final contact event and final page context;
- internal/test journeys may be created for debug but excluded from default reports.

Journey is evidence trail, not session replay.

## 10. CTA Single-Counting Rule

MVP rule:

```text
One user click creates one internal product event.
```

For contact CTA, internal event is:

- `phone_clicked`;
- `email_clicked`;
- `messenger_clicked`.

CTA context travels as fields:

- `placement`;
- `cta_kind`;
- `destination_kind`;
- `contact_channel`;
- optional allowlisted metadata.

Use `cta_clicked` only for non-contact CTA:

- «Подробнее»;
- «Смотреть кейс»;
- «Открыть услугу»;
- «Перейти в раздел»;
- «Открыть галерею», if not represented as `gallery_opened`.

Forbidden:

```text
One click on phone must not create both cta_clicked and phone_clicked
inside internal telemetry truth.
```

If an external adapter wants a CTA/goal representation, it may map the validated `phone_clicked` event to external goal semantics. That mapping must not create a second internal product event.

## 11. Page Engagement

`page_engagement_recorded` captures aggregate engagement context:

- active time;
- max scroll depth;
- page/entity context;
- optional significant engagement summary.

No heartbeat-by-default:

- do not send event every N seconds as normal MVP behavior;
- do not build session replay;
- do not build heatmap;
- do not collect pixel coordinates;
- do not store field input.

Allowed flush points:

- route change;
- `visibilitychange`;
- page unload/sendBeacon when safe;
- reasonable threshold crossing;
- final contact event enrichment;
- explicit route-level flush in telemetry client.

Implementation should cap numeric values:

- `active_time_ms` bounded to a reasonable max per page/session;
- `max_scroll_depth` integer 0-100;
- malformed values rejected or normalized to null.

## 12. External Analytics Adapter Seam

Potential recipients:

- Яндекс.Метрика;
- Google Analytics;
- PostHog;
- Plausible;
- Matomo;
- future admin reports;
- future LLM context;
- future CRM/ATS after separate decision.

Rules:

- UI never calls external counters directly;
- adapters receive only normalized events after domain validation;
- adapters do not change internal event semantics;
- adapter failure must not break user navigation or expose stack trace;
- adapter config must not expose secrets to client;
- internal telemetry truth does not need to match Яндекс.Метрика 1:1.

Differences are expected because of:

- blockers;
- cookies;
- filtering;
- internal traffic;
- delays;
- different counting rules.

This is not duplication. It is redundancy.

MVP default:

- implement adapter interface and no-op adapter;
- connect Яндекс.Метрика only after owner/privacy decision;
- do not add `ym`, `gtag`, PostHog, Plausible or Matomo calls in UI components.

## 13. Minimal Read / Debug Path

Full dashboard is out of phase 1.

Blueprint-approved minimal options:

- admin-only JSON endpoint, for example `GET /api/admin/telemetry/debug`;
- CLI/script that queries DB and prints sanitized counts;
- SQL snippets in implementation notes;
- temporary admin debug surface only if aligned with existing admin architecture.

The read/debug path must verify:

- events are stored;
- `contact_journey` is created on contact intent;
- internal/test events are marked;
- default reads exclude internal/test;
- forbidden fields are not stored;
- metadata allowlist works;
- adapter seam is not called from UI directly.

Default debug read should expose only aggregates:

- counts by `event_name`;
- last safe events without metadata dump;
- journeys count;
- internal/test counts;
- rejected event count if tracked later.

Do not expose:

- raw event dump to LLM;
- form values;
- IP/user-agent;
- admin identity;
- stack traces;
- secrets/tokens.

## 14. Privacy / Security Rules

Forbidden storage:

- телефон пользователя;
- email пользователя;
- имя пользователя;
- текст сообщения;
- содержимое формы;
- запись экрана;
- ввод в поля;
- точный fingerprint;
- raw IP/user-agent без отдельного owner/legal decision;
- sensitive query params;
- admin identity in public telemetry;
- secrets;
- tokens.

Implementation safeguards:

- payload size limit;
- allowlist events;
- allowlist root fields;
- allowlist metadata per event;
- scalar-only metadata values unless a field explicitly allows structured value;
- safe logging;
- generic client errors;
- no stack traces to client;
- no PII in application logs;
- no raw event dump to LLM;
- server-side time preferred;
- route path/referrer sanitization;
- adapter invocation after validation only.

Sensitive query params to strip at minimum:

- `token`;
- `secret`;
- `password`;
- `email`;
- `phone`;
- `name`;
- `message`;
- `utm_*` can be stored only in dedicated bounded attribution fields.

## 15. Tests

Minimum test matrix:

| Scenario | Expected |
| --- | --- |
| Valid `page_viewed` | Stored with normalized path and session. |
| Unknown `event_name` | Rejected. |
| Invalid `event_version` | Rejected or normalized by explicit compatibility rule. |
| Forbidden root fields | Not stored. |
| Metadata outside per-event allowlist | Rejected or stripped by one documented rule. |
| Sensitive query params | Removed from `page_path`/`referrer`. |
| `phone_clicked` | Stored and creates contact journey. |
| `email_clicked` | Stored and creates contact journey. |
| `messenger_clicked` | Stored and creates contact journey. |
| `cta_clicked` | Stored but does not create contact journey. |
| Contact CTA click | Creates only contact event, not both `cta_clicked` and contact event. |
| `contact_journey_created` from UI | Rejected. |
| Internal marker | Sets `is_internal = true`. |
| `is_internal` default read | Excluded from default report/debug read. |
| `is_test` default read | Excluded from default report/debug read. |
| `page_engagement_recorded` | Works without heartbeat requirement. |
| Adapter | Receives normalized event after validation only. |
| UI scan | No direct `ym`, `gtag`, PostHog, Plausible, Matomo calls. |
| PII payload | Does not reach storage or logs. |
| Oversized payload | `413 PAYLOAD_TOO_LARGE`. |
| Write failure | Generic safe error, no stack trace. |

Suggested test files:

- `tests/telemetry-validation.test.js`;
- `tests/telemetry-event-route.test.js`;
- `tests/telemetry-journey.test.js`;
- `tests/telemetry-debug-read.test.js`;
- `tests/telemetry-no-direct-adapters.test.js`.

Existing analytics tests are useful style references, but new tests should assert canonical event names from this domain.

## 16. Deploy / Migration / Smoke

Future delivery plan:

1. Add migration `009_contact_intent_telemetry.sql`.
2. Add `lib/telemetry/*` modules.
3. Add `POST /api/telemetry/events`.
4. Add minimal read/debug path.
5. Add tests.
6. Run local checks.
7. Deploy.
8. Run post-deploy smoke.

Local checks before PR:

- `git status --short --branch`;
- `git diff --check`;
- `npm test`;
- `npm run build` because API routes and public/client behavior will change;
- `npm audit --audit-level=high` if dependencies changed.

Migration/deploy:

- apply migrations with `npm run db:migrate`;
- ensure migration is idempotent and ordered after existing `008_seo_visibility_analytics.sql`;
- do not modify Content Core tables;
- do not modify `/about` or `/contacts`;
- do not change existing public route behavior.

Smoke plan:

- send `page_viewed` with `is_test=true`;
- send `phone_clicked` with `is_test=true`;
- verify event stored;
- verify contact journey created;
- verify default read excludes `is_test=true`;
- verify internal marker event becomes `is_internal=true`;
- verify forbidden metadata is rejected;
- verify no direct external analytics calls from UI;
- run existing launch smoke:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT = 'true'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
```

If media smoke is part of the deployment acceptance, include `EXPECT_MEDIA_URL` from the current runbook/handoff.

Post-deploy checks:

- `/api/readiness` remains `200` with DB status ok;
- `/`, `/services`, `/cases` still return 200;
- `/about` and `/contacts` remain known owner/content blockers unless separately published through Content Core;
- sitemap honesty remains unchanged;
- admin routes remain protected;
- telemetry endpoint returns generic safe responses;
- no external analytics adapter is called directly by UI.

## Implementation Note 2026-05-07

Фактический launch-slice реализован по этому Blueprint со следующими выбранными defaults:

- domain modules: `lib/telemetry/*`;
- public ingestion endpoint: `POST /api/telemetry/events`;
- migration: `db/migrations/009_contact_intent_telemetry.sql`;
- storage: `telemetry_events` and `telemetry_contact_journeys`;
- minimal debug/read path: admin-only `GET /api/admin/telemetry/debug`;
- identity default: `session_id` only, without persistent `anonymous_visitor_id`;
- external adapters default: no-op adapter seam only;
- journey extraction: at `phone_clicked`, `email_clicked`, or `messenger_clicked` time;
- journey max length: 12 significant events;
- repeated-click collapse: same event/context within 3 seconds;
- metadata rule: per-event allowlist, scalar values only;
- public UI rule: contact CTA emits one internal product event, not `cta_clicked` plus contact event.

Owner/legal decisions that remain open after implementation: cookie/privacy notice, exact retention days, production external analytics adapters, internal marker reset UI, and exact long-term aggregate retention.

## 17. Open Questions

Owner / implementation decisions before code:

1. Какие contact channels включаем в phase 1?
2. Telegram и WhatsApp идут как `contact_channel` внутри `messenger_clicked`?
3. Какой контактный номер ведет в АТС?
4. Подключаем ли Яндекс.Метрику adapter на старте?
5. Нужны ли Google Analytics / PostHog / Plausible / Matomo?
6. Нужен ли cookie/privacy notice?
7. Сколько хранить raw telemetry?
8. Сколько хранить contact journeys?
9. Сколько хранить aggregates?
10. Остаемся ли на `session_id` only?
11. Какие events считаются significant для journey?
12. Какой лимит длины journey?
13. Как схлопывать repeated rapid clicks?
14. Как сбрасывать internal marker?
15. Нужен ли test mode для smoke?
16. Нужен ли debug read endpoint или достаточно CLI/SQL?
17. Как именно будет устроен minimal read/debug path с учетом текущей admin architecture?

Recommended defaults if owner does not decide before implementation:

- identity: `session_id` only;
- messenger event: one `messenger_clicked` with `contact_channel`;
- external adapters: no-op only;
- journey max length: 12 significant events;
- repeated click collapse: same event/context within 3 seconds;
- retention: raw short, journeys longer, aggregates longest, exact days still owner/legal.

## 18. Acceptance Criteria For This Blueprint

After this Blueprint, next implementation agent should know:

- где живет telemetry contract;
- как UI отправляет события;
- какие события разрешены;
- какие события запрещены;
- как не допустить прямых вызовов внешней аналитики из UI;
- какой endpoint принимает события;
- как валидируется payload;
- где хранятся события;
- когда создается contact journey;
- почему journey создается в момент contact intent;
- как работает CTA single-counting;
- как работает `session_id`;
- как работает internal/test marker;
- какие данные нельзя хранить;
- как подключаются adapters;
- как проверить реализацию;
- как прогнать smoke на сервере;
- что не входит в phase 1.

## Blueprint Readiness Verdict

Status: **READY_WITH_OWNER_DECISIONS**

Blueprint достаточно конкретен для реализации launch-slice: заданы code boundary, endpoint, storage model, session model, journey extraction, CTA single-counting, privacy rules, tests and smoke plan.

Перед кодом нужно закрыть owner/legal decisions по cookie/privacy notice, retention, exact contact channels, Яндекс.Метрика adapter на старте и reset/test-mode behavior для internal marker. Без этих решений можно реализовать безопасный default: `session_id` only, no-op external adapters, limited raw retention placeholder and explicit debug/test exclusion.
