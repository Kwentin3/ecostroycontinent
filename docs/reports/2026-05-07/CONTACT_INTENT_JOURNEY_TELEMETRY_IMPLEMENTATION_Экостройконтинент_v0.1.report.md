# Contact Intent & Journey Telemetry Implementation Report - Экостройконтинент v0.1

Date: 2026-05-07  
Project: Экостройконтинент  
Phase: pre-launch / launch-core  
Branch: `main`  
Implementation commit: `8508901e80bf8f312a451b87beb7642185f01e76`

## Executive Verdict

Status: **CONTACT_INTENT_JOURNEY_TELEMETRY_DOMAIN_CLOSED_WITH_WARNINGS**

Launch-slice домена Contact Intent & Journey Telemetry реализован, протестирован, опубликован в `origin/main`, собран в GHCR image, задеплоен через `deploy-phase1` и проверен live smoke.

Единственное предупреждение: live admin debug-read проверен как защищённый endpoint (`401` без авторизации), но не проверялся под production admin session, потому что в текущей рабочей среде нет production admin credentials. Default exclusion internal/test traffic покрыт unit/route tests.

## Domain Goal

Домен реализует узкий first-party слой контактной телеметрии:

- собирает anonymous interest / engagement events;
- фиксирует contact intent events;
- создаёт short contact journey snapshot в момент `phone_clicked`, `email_clicked` или `messenger_clicked`;
- не превращает contact intent в lead;
- не смешивает внутреннюю семантику с внешними analytics tools;
- не хранит PII, form input, raw IP/user-agent, session replay или heatmap data.

Главный вопрос домена:

```text
Что человек смотрел перед тем, как решил связаться?
```

## Source Documents

Перед реализацией использовались:

- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/Contact_Intent_and_Journey_Telemetry_Tracking_Plan_Экостройконтинент_v0.1.md`
- `docs/engineering/Contact_Intent_and_Journey_Telemetry_Domain_Boundary_Экостройконтинент_v0.1.md`
- `docs/engineering/Contact_Intent_and_Journey_Telemetry_Blueprint_Экостройконтинент_v0.1.md`

Blueprint дополнен implementation note с фактическими путями, выбранными defaults и открытыми owner/legal decisions.

Delivery buffer `docs/out` синхронизирован для четырёх telemetry-документов.

## Implemented Files

### Domain Code

- `lib/telemetry/events.js`
- `lib/telemetry/metadata-allowlist.js`
- `lib/telemetry/sanitize.js`
- `lib/telemetry/validation.js`
- `lib/telemetry/session.js`
- `lib/telemetry/internal-marker.js`
- `lib/telemetry/repository.js`
- `lib/telemetry/journey.js`
- `lib/telemetry/adapters.js`

### API Routes

- `app/api/telemetry/events/route.js`
- `app/api/admin/telemetry/debug/route.js`

### Migration

- `db/migrations/009_contact_intent_telemetry.sql`

### Public UI Instrumentation

- `components/public/AnalyticsTracker.js`
- `components/public/PublicRenderers.js`
- `app/page.js`

### Auth / Internal Marker

- `lib/auth/session.js`

Admin login теперь ставит безопасный internal traffic marker cookie без user id, email, role, token или admin session id.

### Tests

- `tests/telemetry-validation.test.js`
- `tests/telemetry-event-route.test.js`
- `tests/telemetry-journey.test.js`
- `tests/telemetry-debug-read.test.js`
- `tests/telemetry-no-direct-adapters.test.js`

## Runtime Contract

Public UI отправляет события только в единый telemetry layer:

```text
Public UI
  -> /api/telemetry/events
  -> lib/telemetry validation / normalization
  -> telemetry_events
  -> contact journey extraction if needed
  -> adapter seam after validation
```

Запрещённая модель не используется:

- no direct `ym(...)`;
- no direct `gtag(...)`;
- no direct PostHog / Plausible / Matomo calls;
- no external analytics calls from UI.

External analytics представлены только adapter seam. На старте включён no-op adapter.

## Canonical Events

Accepted public phase-1 events:

- `page_viewed`
- `page_engagement_recorded`
- `service_card_opened`
- `case_card_opened`
- `gallery_opened`
- `cta_clicked`
- `phone_clicked`
- `email_clicked`
- `messenger_clicked`

System/domain-only event:

- `contact_journey_created`

`contact_journey_created` не принимается от Public UI. Если public endpoint получает это событие, он возвращает generic `400 INVALID_EVENT`.

## Event Validation

Endpoint `POST /api/telemetry/events`:

- rejects unknown `event_name`;
- rejects invalid `event_version`;
- rejects public `contact_journey_created`;
- validates root fields by strict schema;
- validates metadata by per-event allowlist;
- allows scalar-only metadata values;
- sanitizes `page_path`;
- strips sensitive query params from `referrer`;
- extracts bounded UTM fields from page URL/request URL;
- uses server-side `occurred_at` / `received_at`;
- creates or refreshes server-side anonymous `session_id`;
- sets `is_internal` and `is_test`;
- returns generic safe success/error responses;
- does not expose stack traces, SQL details, adapter details or raw payload.

Sensitive query params stripped at minimum:

- `token`
- `secret`
- `password`
- `email`
- `phone`
- `name`
- `message`

## Storage

Migration `009_contact_intent_telemetry.sql` adds:

### `telemetry_events`

Purpose: normalized first-party telemetry events.

Key fields:

- `id`
- `event_name`
- `event_version`
- `event_category`
- `occurred_at`
- `received_at`
- `session_id`
- `page_path`
- `page_title`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `entity_type`
- `entity_id`
- `entity_slug`
- `placement`
- `contact_channel`
- `active_time_ms`
- `max_scroll_depth`
- `is_internal`
- `is_test`
- `metadata`
- `created_at`

Indexes:

- `occurred_at`
- `session_id + occurred_at`
- `page_path + occurred_at`
- `entity_type + entity_id + occurred_at`
- partial index for default reports where `is_internal = FALSE AND is_test = FALSE`

### `telemetry_contact_journeys`

Purpose: short snapshot of path to contact intent.

Key fields:

- `id`
- `session_id`
- `final_contact_event_id`
- `final_contact_event_name`
- `contact_channel`
- `landing_page_path`
- `final_page_path`
- `final_entity_type`
- `final_entity_id`
- `previous_significant_events`
- `total_active_time_ms`
- `max_scroll_depth`
- `is_internal`
- `is_test`
- `created_at`

## Session Model

Default phase 1 identity is `session_id` only.

Implemented behavior:

- session cookie: `esc_telemetry_session`;
- generated value is random, opaque and non-personal;
- cookie is `httpOnly`, `sameSite=lax`, `secure` in production;
- no user data, admin identity, IP, user-agent, page path or contact channel in the ID;
- if cookie is missing, server creates a new session id;
- persistent `anonymous_visitor_id` is not enabled by default.

Persistent visitor identity remains owner/legal decision.

## Internal / Test Traffic

Internal marker:

- cookie: `esc_internal_traffic`;
- set after successful admin login;
- value is non-sensitive marker only;
- telemetry events with marker get `is_internal = true`;
- internal events can be stored for diagnostics;
- default read/debug excludes internal traffic.

Test marker:

- accepted via `is_test: true` payload or `x-telemetry-test` header;
- test events can be stored for smoke/debug;
- default read/debug excludes test traffic.

No admin user id/email/role/token/session id is stored in telemetry events or marker cookie.

## Contact Journey Extraction

Mandatory rule implemented:

```text
contact_journey is created at contact intent event time.
```

The domain does not wait for formal session end.

Contact intent events:

- `phone_clicked`
- `email_clicked`
- `messenger_clicked`

Significant journey events:

- `page_viewed`
- `service_card_opened`
- `case_card_opened`
- `gallery_opened`
- `cta_clicked`
- final `phone_clicked` / `email_clicked` / `messenger_clicked`

Journey controls:

- max journey length: 12 significant events;
- repeated rapid clicks collapsed when same event/context occurs within 3 seconds;
- active time is bounded;
- scroll depth is bounded `0..100`;
- no heartbeat stream, hover events, form input, screen recording, heatmap/pixel data or session replay.

## CTA Single-Counting

Implemented rule:

```text
One user click creates one internal product event.
```

For contact CTA:

- phone CTA -> `phone_clicked`;
- email CTA -> `email_clicked`;
- Telegram/WhatsApp/messenger CTA -> `messenger_clicked` with `contact_channel`.

`cta_clicked` is used for non-contact CTA only:

- navigation;
- open service;
- open case;
- contact page route `/contacts` if it is a page navigation, not a direct phone/email/messenger action.

The endpoint also rejects `cta_clicked` with contact-like `destination_kind` such as `phone`, `email`, `telegram` or `whatsapp`, preventing accidental double-counting.

## Page Engagement

`page_engagement_recorded` is implemented without heartbeat-by-default.

Public tracker records engagement aggregated on:

- `visibilitychange`;
- `pagehide`;
- unmount/route lifecycle where applicable;
- meaningful active time / scroll threshold.

No scroll tick stream is persisted as a separate analytics event.

## Public UI Instrumentation

Instrumentation was added only to existing public surfaces:

- phone/email/messenger contact actions;
- non-contact CTAs;
- service card opens;
- case card opens;
- gallery opens;
- page views;
- aggregated page engagement.

No large UI redesign was done. No new big CTA surfaces were introduced.

`/about` and `/contacts` were not modified.

Content Core was not changed.

## Minimal Debug Read

Implemented:

```text
GET /api/admin/telemetry/debug
```

Behavior:

- admin-only;
- unauthenticated access returns `401`;
- default read excludes `is_internal` and `is_test`;
- optional query flags can include internal/test traffic;
- returns aggregate-safe summary, not raw event dump.

It does not expose:

- IP/user-agent;
- form values;
- admin identity;
- secrets;
- tokens;
- stack traces.

## Privacy / Security

The implementation avoids storing:

- user phone;
- user email;
- user name;
- message text;
- form contents;
- screen recordings;
- field input;
- exact fingerprint;
- raw IP/user-agent;
- admin identity;
- secrets;
- tokens.

Implemented safeguards:

- payload size limit: 16KB;
- strict event allowlist;
- strict root schema;
- per-event metadata allowlist;
- scalar-only metadata values;
- sensitive root-field rejection;
- sensitive referrer query sanitization;
- generic client errors;
- no stack traces to client;
- adapter invocation only after validation and persistence.

## Local Verification

### Git Diff Check

Command:

```powershell
git diff --check
```

Result: passed.

Only Git line-ending warnings were shown:

```text
LF will be replaced by CRLF the next time Git touches it
```

No whitespace errors.

### Full Test Suite

Command:

```powershell
npm test
```

Result:

```text
486 tests passed
0 failed
```

### Targeted Telemetry Tests

Command:

```powershell
node --experimental-specifier-resolution=node --test tests/telemetry-*.test.js
```

Result:

```text
22 tests passed
0 failed
```

Covered behavior:

- valid `page_viewed` stores;
- unknown `event_name` rejects;
- invalid `event_version` rejects;
- `contact_journey_created` from UI rejects;
- metadata allowlist works;
- scalar-only metadata enforced;
- forbidden root fields rejected;
- sensitive referrer query params stripped;
- `phone_clicked`, `email_clicked`, `messenger_clicked` create journeys;
- `cta_clicked` does not create journey;
- contact CTA cannot be `cta_clicked`;
- internal marker sets `is_internal`;
- test marker sets `is_test`;
- debug read defaults exclude internal/test;
- adapter receives normalized event only;
- UI has no direct external analytics calls.

### Production Build

Command:

```powershell
npm run build
```

Result: passed.

Build includes routes:

- `/api/telemetry/events`
- `/api/admin/telemetry/debug`

### Audit

Command:

```powershell
npm audit --audit-level=high
```

Result: passed for high severity.

Remaining advisories are moderate and pre-existing:

- `fast-xml-parser`
- `ip-address`
- `postcss` via Next.js advisory path

No dependencies were added in this task.

## Local Migration Attempt

Command:

```powershell
npm run db:migrate
```

using local ignored `.env` `DATABASE_URL`.

Result:

```text
ECONNREFUSED localhost:5433
```

Meaning: local PostgreSQL was not running on the Windows operator workstation. This did not block production deployment, because server deploy workflow applies migrations inside the canonical runtime stack.

## Build / Publish Evidence

Workflow:

```text
build-and-publish.yml
```

Run:

```text
25494815778
```

Result:

```text
completed / success
```

Published image:

```text
ghcr.io/kwentin3/ecostroycontinent-app@sha256:b1001a13d8247493bcb74cbc66c26891115aee0a11f37504709a4e3f5542e81d
```

Image tags included:

- `main`
- `latest`
- `sha-8508901`

Build log confirmed image packaging included DB migrations.

## Deploy Evidence

Workflow:

```text
deploy-phase1.yml
```

Run:

```text
25495023722
```

Result:

```text
completed / success
```

Pinned runtime image:

```text
APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:b1001a13d8247493bcb74cbc66c26891115aee0a11f37504709a4e3f5542e81d
```

Server migration evidence:

```text
Applied migration 009_contact_intent_telemetry.sql
```

Server readiness evidence:

```json
{
  "status": "ready",
  "database": {
    "status": "ok"
  },
  "runtime": {
    "node": "v22.22.2",
    "version": "0.1.0",
    "commit": "8508901e80bf8f312a451b87beb7642185f01e76",
    "buildTime": "2026-05-07T12:08:29Z"
  }
}
```

## Launch Smoke Evidence

Command:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT = 'true'
$env:EXPECT_MEDIA_URL = 'https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
Remove-Item Env:EXPECT_MEDIA_URL
```

Result:

```json
{
  "summary": {
    "passed": 23,
    "failed": 0,
    "known_content_blocker": 2,
    "skipped": 0
  },
  "runtimeMarker": {
    "version": "0.1.0",
    "commit": "8508901e80bf8f312a451b87beb7642185f01e76",
    "node": "v22.22.2",
    "buildTime": "2026-05-07T12:08:29Z"
  }
}
```

Confirmed:

- `/api/health`: 200;
- `/api/readiness`: 200, database ok, runtime commit present;
- `/`: 200;
- `/services`: 200;
- `/cases`: 200;
- `/about`: known content blocker 404;
- `/contacts`: known content blocker 404;
- `/robots.txt`: 200;
- `/sitemap.xml`: 200;
- sitemap does not list `/about` or `/contacts`;
- admin routes protected;
- media CDN URL returns 200.

## Telemetry Live Smoke Evidence

Live telemetry smoke against:

```text
https://ecostroycontinent.ru/api/telemetry/events
```

Results:

```json
{
  "page": {
    "status": 202,
    "body": {
      "ok": true,
      "stored": true,
      "event_name": "page_viewed",
      "journey_created": false
    }
  },
  "phone": {
    "status": 202,
    "body": {
      "ok": true,
      "stored": true,
      "event_name": "phone_clicked",
      "journey_created": true
    }
  },
  "invalidMetadata": {
    "status": 400,
    "body": {
      "ok": false,
      "error": "INVALID_EVENT"
    }
  },
  "systemEvent": {
    "status": 400,
    "body": {
      "ok": false,
      "error": "INVALID_EVENT"
    }
  },
  "internalSmoke": {
    "status": 202,
    "body": {
      "ok": true,
      "stored": true,
      "event_name": "page_viewed",
      "journey_created": false
    }
  },
  "debugUnauth": {
    "status": 401
  },
  "sessionCookieReceived": true
}
```

Confirmed:

- `page_viewed is_test=true` stores;
- `phone_clicked is_test=true` stores and creates journey;
- forbidden metadata rejects safely;
- public `contact_journey_created` rejects safely;
- internal marker smoke event stores safely;
- debug endpoint is protected without auth;
- telemetry session cookie is issued.

## Git / Worktree State

Before implementation:

- branch: `main`;
- upstream: `origin/main`;
- existing untracked docs were the PRD/tracking/boundary/blueprint package from the documentation phase.

Final implementation commit:

```text
8508901e80bf8f312a451b87beb7642185f01e76
```

Commit message:

```text
Implement contact intent telemetry domain
```

Push:

```text
main -> origin/main
```

Final status after deploy and smoke:

```text
## main...origin/main
```

No uncommitted files remained before this report was created.

## Scope Boundaries Preserved

Confirmed not changed:

- Content Core tables and source-of-truth semantics;
- `/about`;
- `/contacts`;
- lead records;
- CRM-lite;
- forms / lead intake;
- sales pipeline;
- ATS/call-tracking integration;
- SEO dashboard;
- BI dashboard;
- AI autonomous analysis;
- personalization;
- session replay;
- heatmaps.

The old SEO analytics model remains separate. The new telemetry domain uses dedicated canonical tables and taxonomy.

## Known Warnings / Residual Risk

1. Live admin debug-read was not checked with authenticated admin credentials.
2. Local PostgreSQL was unavailable on the Windows workstation, so local migration could not be applied there.
3. Exact retention periods are still owner/legal decisions.
4. Cookie/privacy notice decision remains open.
5. External analytics adapters are intentionally no-op until owner chooses Yandex/GA/PostHog/Plausible/Matomo policy.
6. Internal marker reset UI is not implemented; reset remains a technical cookie-clearing operation for now.

## Owner Decisions Still Open

1. Need cookie/privacy notice for first-party telemetry?
2. Exact retention for raw telemetry.
3. Exact retention for contact journeys.
4. Exact retention for aggregates.
5. Whether to keep `session_id only` long-term.
6. Whether to enable persistent `anonymous_visitor_id`.
7. Whether to enable Yandex Metrica adapter.
8. Whether to enable Google Analytics / PostHog / Plausible / Matomo.
9. Exact production contact channels beyond phone/email/Telegram/WhatsApp.
10. Internal marker reset UX.
11. Whether admin debug read should become a small UI surface later.

## Recommended Next Steps

1. Owner/legal decision: cookie/privacy notice and telemetry retention.
2. Add a tiny admin report/read model only after enough real traffic exists.
3. Implement optional Yandex Metrica adapter if approved, mapped after domain validation.
4. Design Lead Intake domain separately; do not reuse contact intent events as lead records.
5. Add authenticated live debug-read smoke when safe admin test credentials/process are available.

## Final Verdict

The Contact Intent & Journey Telemetry launch-slice is closed for implementation:

- separate telemetry contract layer exists;
- public UI does not call external analytics directly;
- canonical events validate;
- PII is rejected/minimized;
- `POST /api/telemetry/events` is live;
- contact journeys are created at contact intent time;
- `contact_journey_created` cannot be emitted by public UI;
- contact CTA single-counting is enforced;
- internal/test markers are supported;
- migration is applied on production runtime;
- build/test/audit/deploy/smoke passed;
- git `main` is clean and pushed.
