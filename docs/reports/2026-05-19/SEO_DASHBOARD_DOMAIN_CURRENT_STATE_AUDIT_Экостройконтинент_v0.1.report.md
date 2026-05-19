# SEO Dashboard / Visibility / Analytics Foundation Current State Audit

Дата: 2026-05-19  
Проект: Экостройконтинент  
Branch: `main`  
Local HEAD: `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`  
Runtime target: Selectel VM `ecostroycontinent-phase1-vm`, compose `repo-app-1` + `repo-sql-1`, env `/opt/ecostroycontinent/runtime/.env`  
Runtime marker: commit `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`, build time `2026-05-18T21:12:33Z`

## Executive verdict

Домен готов к следующему безопасному этапу, если следующий этап ограничить включением публичной Метрики и bridge first-party telemetry -> `ym(..., "reachGoal", ...)`.

Закрыто фактически: migration `008`, analytics tables, `/api/analytics/events`, analytics read model, `/admin/visibility` MVP, Yandex Metrica API, 11 goals, Yandex Webmaster verification, `/about`, `/contacts`, sitemap consistency.

Ключевой новый факт: `/about` и `/contacts` больше не blocker. В production есть published `Page(type=about)` и `Page(type=contacts)` с `active_published_revision_id`; оба route отдают `200`; sitemap содержит оба URL.

Главный gap перед следующей фазой: public tracker сейчас отправляет события в `/api/telemetry/events`, а не в старый SEO endpoint `/api/analytics/events`. Поэтому reachGoal bridge нужно вешать на telemetry adapter layer (`lib/telemetry/adapters.js`), а не пытаться оживлять прямые вызовы из UI. Read model пока не потребляет telemetry tables напрямую.

## Docs reviewed

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/*SEO_DASHBOARD*` and `docs/reports/2026-05-04/*YANDEX*`
- Contact telemetry handoff/boundary docs under `docs/engineering/Contact_Intent_and_Journey_Telemetry_*`

## Code areas reviewed

- `app/admin/(console)/visibility/page.js`
- `app/api/admin/visibility/read-model/route.js`
- `app/api/analytics/events/route.js`
- `app/api/telemetry/events/route.js`
- `components/admin/SeoVisibilityDashboard.js`
- `components/public/AnalyticsTracker.js`
- `components/public/PublicRenderers.js`
- `lib/analytics/*`
- `lib/telemetry/*`
- `scripts/yandex/*`
- `db/migrations/008_seo_visibility_analytics.sql`
- `db/migrations/009_contact_intent_telemetry.sql`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/sitemap.js`
- `app/robots.js`
- `app/yandex_26aab3d248d69ec2.html/route.js`
- `lib/read-side/public-content.js`

## Backend / foundation state

Migration `008_seo_visibility_analytics.sql` is applied on canonical SQL target:

```text
schema_migrations: 008_seo_visibility_analytics.sql -> 2026-05-04 14:01:14.283937+00
```

Required tables exist:

```text
analytics_event: present
analytics_page_daily: present
external_search_visibility_daily: present
analytics_source_sync_state: present
analytics_unmapped_url_diagnostic: present
seo_recommendation_state: present
analytics_classified_content_change: present
analytics_tracking_change_history: present
```

Current counts:

```text
analytics_event=14
analytics_page_daily=3
external_search_visibility_daily=0
analytics_source_sync_state=0
```

Migration `009_contact_intent_telemetry.sql` is also applied and the newer public telemetry domain is live:

```text
telemetry_events=882
telemetry_contact_journeys=21
```

## Analytics event endpoint

`POST /api/analytics/events` works on production.

Live checks:

```text
valid event without anonymous_id/session_id -> 202, stored=true, excluded=false
admin session event -> 202, excluded=true, reason=admin_user
Googlebot UA event -> 202, excluded=true, reason=bot_or_crawler
QA header event -> 202, excluded=true, reason=qa_traffic
preview path event -> 202, excluded=true, reason=preview_or_draft
unknown event_type -> 400 INVALID_EVENT
form_values root field -> 400 INVALID_EVENT
dangerous metadata key -> 400 INVALID_EVENT
token-like metadata value -> 400 INVALID_EVENT
```

Server-generated IDs were verified in DB:

```text
anonymous_id LIKE anon_server_% = true
session_id LIKE session_server_% = true
```

Synthetic audit rows and temporary admin session were cleaned up:

```text
cleanup_events=0
cleanup_unmapped=0
cleanup_sessions=0
```

Business aggregate exclusion is implemented in both paths:

- pure summarizer skips `event.is_excluded` in `lib/analytics/aggregate.js`;
- daily aggregate SQL filters `WHERE is_excluded = FALSE`;
- local tests cover admin/bot/preview exclusion.

## Public analytics layer

Important current-state split:

- SEO endpoint `/api/analytics/events` exists and works.
- Public UI tracker currently emits to `/api/telemetry/events`.
- `components/public/AnalyticsTracker.js` has `ENDPOINT = "/api/telemetry/events"`.
- `tests/telemetry-no-direct-adapters.test.js` explicitly enforces no direct `/api/analytics/events` usage from public tracker.
- `lib/telemetry/adapters.js` currently defaults to `noopTelemetryAdapter`; external analytics should attach there after validation.

This means the next Yandex reachGoal bridge should be implemented as a telemetry adapter, not as direct `ym()` calls from UI and not as a dependency on the old SEO ingestion endpoint.

## Read model state

Authorized `GET /api/admin/visibility/read-model?period=28` returns `200` and contract version `seo_dashboard_analytics_read_model.v0.1`.

Current source states from live read model:

```text
first_party_events: ok
yandex_metrica: not_configured
yandex_webmaster: not_configured
google_search_console: not_configured
lead_domain: not_ready
content_core: ok
```

Current page list:

```text
/services/kapitalnyy-remont-zdaniy
/services/arenda-tehniki
/cases/kapitalnyy-remont-zdaniy
/
/contacts
/about
```

Other read model facts:

```text
page_list=6
semantic_click_map=9
recommendations=5
unmapped_urls=0
overview.leads.status=unavailable
overview.leads.value=null
forbidden_key_hits=0
```

Read model did not expose keys for secrets, tokens, raw events, raw sessions, IP, raw user agent, anonymous/session ids, form values or direct SQL.

## /admin/visibility

Access:

```text
GET /admin/visibility without auth -> 307 /admin/login
GET /api/admin/visibility/read-model without auth -> 303 /admin/login
GET /admin/visibility with temporary admin session -> 200
```

UI evidence:

```text
Russian title/copy present: true
Yandex source copy present: true
Google Search Console copy present: true
lead not_ready/unavailable copy present: true
page list present: true
semantic click map present: true
recommendations present: true
```

UI integrity summary:

- Status: pass for technical MVP.
- States: error state exists in route page; empty states exist for pages/recommendations/detail; success state renders dashboard; loading is not a client state because the page is server-rendered.
- Interaction clarity: period/page links are semantic links; disabled integration/recommendation controls use `aria-disabled`.
- Accessibility: focus-visible styles exist for links/buttons.
- UI boundary: page and API both consume `buildSeoDashboardReadModel`; component renders DTO and does not call Yandex/raw DB directly.
- Limitation: this is not a full UX/UI refine.

## Public pages state

Production DB:

```text
display_mode=published_only
content_page_entities_total=3
published_about_count=1
published_contacts_count=1
```

Published pages:

```text
home: active_published_revision_id present, state=published
about: active_published_revision_id present, state=published, placeholder_marker=null
contacts: active_published_revision_id present, state=published, placeholder_marker=null
```

Live routes:

```text
/about -> 200 text/html
/contacts -> 200 text/html
```

No placeholder/under-construction marker was found in `/about` or `/contacts` HTML.

Content source:

- `/about` uses `getPublishedAboutPage()` from `lib/read-side/public-content.js`.
- `/contacts` uses `getPublishedContactsPage()` from `lib/read-side/public-content.js`.
- Both pages still call `notFound()` if published Content Core page is absent.
- No fake hardcoded fallback content was added.

## Sitemap / robots / verification

Read-only launch smoke with `EXPECT_ABOUT=published EXPECT_CONTACTS=published` passed:

```text
passed=28
failed=0
known_content_blocker=0
skipped=1 (media URL optional, not configured)
```

Sitemap:

```text
/sitemap.xml -> 200 application/xml
sitemap_url_count=8
sitemap_about=True
sitemap_contacts=True
all listed URLs returned 200
```

Robots:

```text
/robots.txt -> 200
Allow: /
Disallow: /admin
Disallow: /api/admin
Sitemap: https://ecostroycontinent.ru/sitemap.xml
```

Yandex verification:

```text
/yandex_26aab3d248d69ec2.html -> 200
Verification UIN: 26aab3d248d69ec2
```

## Yandex state

Server env, values safe for report:

```text
YANDEX_METRICA_COUNTER_ID=109037342
YANDEX_METRICA_OAUTH_TOKEN=present
YANDEX_WEBMASTER_OAUTH_TOKEN=present
YANDEX_WEBMASTER_HOST_ID=https:ecostroycontinent.ru:443
NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false
NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID=109037342
PUBLIC_SITE_URL=https://ecostroycontinent.ru/
APP_BASE_URL=https://ecostroycontinent.ru
```

`npm run yandex:check-metrica` on `repo-app-1`:

```text
status=ok
counter_id=109037342
counter.name=Экостройконтинент
counter.site=ecostroycontinent.ru
counter.status=Active
existing_goals_count=11
missing=[]
needs_review=[]
```

Required goals present:

```text
click_to_call
click_to_telegram
click_to_whatsapp
form_start
form_submit
cta_click
contact_link_click
gallery_open
faq_expand
case_card_click
service_link_click
```

`npm run yandex:check-webmaster` on `repo-app-1`:

```text
status=ok
configured_host_id_status=found
host_id=https:ecostroycontinent.ru:443
verification_state=VERIFIED
verification_type=HTML_FILE
```

## Not implemented / partial list

| Item | Status | Blocker | Recommended next action |
| --- | --- | --- | --- |
| Public Yandex Metrica counter script | not implemented | `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false`; live HTML has no `mc.yandex`, `ym(` or `watch/109037342` | Add guarded public counter injection after privacy/cookie decision |
| first-party event -> `ym reachGoal` bridge | not implemented | telemetry adapter is noop | Implement bridge in `lib/telemetry/adapters.js` and map public telemetry event names to Metrica goal names |
| scheduled Metrica imports | not implemented | no scheduler/import job; read model source state default `not_configured` | Separate import worker/scheduled slice |
| scheduled Webmaster imports | not implemented | no scheduler/import job; `external_search_visibility_daily=0` | Separate Webmaster import slice |
| imported aggregates in read model | not implemented | external table empty; source sync state table empty | Populate imports first, then wire source freshness |
| Lead/intake domain | not implemented | contact telemetry exists, but no lead records/qualification domain | Keep separate epic; do not count contact actions as leads |
| LLM provider integration for SEO Dashboard | partial | generic LLM infra exists, SEO dashboard only has context packet builder | Do not enable until safety gate/evals and provider posture are decided |
| LLM UI for SEO Dashboard | not implemented | no SEO dashboard copilot UI | Later, after source imports and safety gate |
| visual pixel heatmap | not implemented | intentionally out of MVP | Keep semantic click map; decide external heatmap later if needed |
| owner reduced DTO | not implemented | no owner-safe reduced DTO contract implemented | Later contract slice if owner-facing dashboard is needed |
| full UX/UI refine `/admin/visibility` | partial | technical MVP only | Do after live telemetry/Metrica signals exist |

## State matrix

| Domain slice | Status | Evidence | Next action |
| --- | --- | --- | --- |
| SEO Dashboard backend/foundation | ready | migration 008 applied; runtime health/readiness ok | Proceed to next slice |
| analytics_event endpoint | ready with caveat | live POSTs pass; rejects unsafe payloads | Keep; note public tracker now uses telemetry endpoint |
| analytics DB tables | ready | all required 008 tables present | No migration needed now |
| analytics read model | ready foundation / import gaps | `200`, 6 pages, no forbidden keys, Yandex sources `not_configured` | Add imports later |
| `/admin/visibility` | MVP ready | auth protected; authorized route 200; Russian UI and sections present | UX refine later |
| public `/about` | ready | published page count 1; route 200; sitemap present | Monitor only |
| public `/contacts` | ready | published page count 1; route 200; sitemap present | Monitor only |
| sitemap consistency | ready | 8 URLs; `/about` and `/contacts` listed; all listed URLs 200 | Keep smoke expectation published |
| Yandex Metrica API | ready | check-metrica `status=ok`, counter active | Use for next public counter slice |
| Metrica goals | ready | 11/11 goals present | Map telemetry events to goals |
| Yandex Webmaster | ready | host found, verified HTML_FILE | Scheduled imports later |
| Metrica public counter | not implemented | env disabled; no script in HTML | Enable behind env flag |
| reachGoal bridge | not implemented | telemetry adapter noop | Implement telemetry adapter bridge |
| scheduled Metrica imports | not implemented | no job/table data | Later worker slice |
| scheduled Webmaster imports | not implemented | no job/table data | Later worker slice |
| lead/intake | not implemented | read model lead unavailable; contact telemetry is not lead domain | Separate epic |
| LLM copilot | not implemented for SEO UI | context builder exists, no SEO LLM UI/provider flow | Later safety gate |
| UX/UI refine | partial | MVP passes integrity, not polished final | Defer until live metrics exist |

## Risks / gaps

1. Public telemetry and SEO analytics have diverged: public UI uses `/api/telemetry/events`, while SEO read model consumes `analytics_page_daily`. Without a bridge/import, live public telemetry will not automatically improve SEO read model aggregates.
2. Yandex API is ready, but read model still shows Yandex sources as `not_configured` because scheduled imports/source sync are intentionally absent.
3. Enabling Metrica counter requires privacy/cookie decision and a clear env-gated implementation.
4. The existing SEO endpoint accepts first-party events, but future bridge work should not bypass the telemetry boundary now enforced by tests.
5. LLM-related repo code exists for other/admin diagnostics, but SEO Dashboard LLM copilot is not ready.

## Updated docs

Updated because production facts contradicted old `/about` and `/contacts` blocker text:

- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`

No `docs/out` deletions were touched.

## Tests / commands run

Local:

```text
node --experimental-specifier-resolution=node --test tests/analytics-event-schema.test.js tests/analytics-event-route.test.js tests/analytics-read-model.test.js tests/admin-visibility-ui.test.js tests/yandex-bootstrap-tooling.test.js tests/telemetry-no-direct-adapters.test.js
Result: 32/32 pass
```

Read-only public smoke:

```text
APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch
Result: passed=28, failed=0, known_content_blocker=0, skipped=1
```

Server checks on Selectel VM:

```text
docker ps
curl /api/health
curl /api/readiness
SQL read-only checks via repo-sql-1 psql
curl /about /contacts /robots.txt /sitemap.xml /yandex_26aab3d248d69ec2.html
temporary session + synthetic /api/analytics/events smoke, then cleanup
docker exec repo-app-1 npm run yandex:check-env
docker exec repo-app-1 npm run yandex:check-metrica
docker exec repo-app-1 npm run yandex:check-webmaster
```

Not run:

- no scheduled imports;
- no public Metrica counter enablement;
- no migration execution;
- no LLM calls.

## Security checks

- Tokens/client secret were not written to this report.
- Env token fields are reported only as `present`.
- Read model forbidden-key scan returned `0`.
- Event endpoint rejected dangerous root fields, dangerous metadata keys and token-like metadata values.
- Public HTML for `/about` and `/contacts` does not include Metrica counter script yet.
- Temporary audit session and synthetic analytics rows were cleaned up.

## Agent verdict

Closed:

- backend/foundation migration and tables;
- `/api/analytics/events` validation/storage boundary;
- business aggregate exclusion logic;
- read model contract surface;
- `/admin/visibility` MVP;
- Yandex Metrica/Webmaster bootstrap;
- `/about` and `/contacts` publication and sitemap consistency.

Partially ready:

- public analytics foundation, because telemetry exists and has real data, but SEO read model does not yet consume telemetry tables;
- `/admin/visibility` UI, because it is a working MVP, not a refined product UI;
- SEO LLM context, because context builder exists but no SEO copilot UI/provider flow is enabled.

Nearest blocking next step:

- Implement and verify public Metrica counter + telemetry-to-`reachGoal` bridge. The bridge should attach at telemetry adapter level and map existing telemetry events to the 11 Metrica goals.

Do not do now:

- scheduled imports before public counter/goal smoke;
- lead/intake;
- LLM copilot;
- visual pixel heatmap;
- broad `/admin/visibility` UX polish.

Recommended next implementation slice:

1. Add env-gated Yandex Metrica public counter injection.
2. Add telemetry adapter bridge: `/api/telemetry/events` validated event -> `ym(109037342, "reachGoal", goalName)`.
3. Live smoke one public event and confirm both first-party telemetry storage and Metrica goal visibility.
4. Only after that, schedule Metrica/Webmaster imports and wire imported aggregates into the read model.

## Git status at report time

```text
## main...origin/main
 M docs/AGENT_START_HERE.md
 M docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md
?? docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md
```
