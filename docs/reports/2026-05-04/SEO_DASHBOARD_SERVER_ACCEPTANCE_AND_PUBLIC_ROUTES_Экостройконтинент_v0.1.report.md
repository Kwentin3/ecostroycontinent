# SEO Dashboard MVP — server acceptance and public routes

Дата: 2026-05-04  
Проект: Экостройконтинент  
Ветка: `feat/seo-visibility-dashboard`  
Локальный HEAD перед отчётом: `596202173026ba9c52e9e07af1b0f9a4904b1b8d`  
Canonical runtime: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`  
Runtime image revision: `6b248d0f62b134b4bc0eb927dbc82653a31f15e4`  
Deploy method: существующий GHCR / compose runtime; новый deploy в рамках этой приёмки не требовался, потому что runtime уже содержит актуальный backend/foundation code image. Более свежие локальные commits после `6b248d0` были документационными.

## Executive Verdict

Server acceptance backend/foundation: pass.

Миграция `008_seo_visibility_analytics.sql` уже применена на canonical SQL target. Приложение работает, `/admin/visibility` защищён авторизацией и открывается после login, read model endpoint работает только под авторизованной сессией, `/api/analytics/events` принимает валидные события, генерирует server-side `anonymous_id/session_id`, отклоняет опасные payloads и реально пишет в `analytics_event`.

`/about` и `/contacts`: не route-code bug. Это content-state blocker. Route files есть, но в `published_only` режиме маршруты intentionally возвращают `notFound()`, если нет опубликованных Page(type=about/contacts). На сервере опубликованных ревизий для `about` и `contacts` нет. Sitemap корректно не публикует эти 404 URL.

## Commands / Evidence

Основные команды выполнялись на canonical server через SSH:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
docker inspect repo-app-1 --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}'
curl -ksSf https://127.0.0.1/api/health -H 'Host: ecostroycontinent.ru'
docker exec repo-app-1 npm run db:migrate
docker exec -i repo-sql-1 sh -lc 'psql ...'
curl -ksS https://127.0.0.1/admin/visibility -H 'Host: ecostroycontinent.ru'
curl -ksS https://127.0.0.1/api/admin/visibility/read-model -H 'Host: ecostroycontinent.ru'
curl -ksS https://127.0.0.1/api/analytics/events -H 'Host: ecostroycontinent.ru'
```

Secrets, OAuth tokens, authorization codes and client secrets were not printed.

## Runtime / Health

Containers:

- `repo-app-1`: `ghcr.io/kwentin3/ecostroycontinent-app`, running.
- `repo-sql-1`: `postgres:16-alpine`, healthy.
- `ecostroycontinent-traefik`: running.

Health endpoint:

```json
{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}
```

## Migration 008

`schema_migrations` contains:

```text
008_seo_visibility_analytics.sql | 2026-05-04 14:01:14.283937+00
```

Required analytics tables exist:

- `analytics_event`
- `analytics_page_daily`
- `external_search_visibility_daily`
- `analytics_source_sync_state`
- `analytics_unmapped_url_diagnostic`
- `seo_recommendation_state`
- `analytics_classified_content_change`
- `analytics_tracking_change_history`

`npm run db:migrate` on `repo-app-1` completed without applying a new migration, which confirms `008` was already applied by the migration tool.

## Admin Visibility

Temporary superadmin was created for live smoke and removed afterwards.

Results:

- `GET /admin/visibility` without auth: `307` redirect.
- `GET /api/admin/visibility/read-model` without auth: `303` redirect.
- `POST /api/admin/login`: `303`, session cookie present.
- `GET /admin/visibility` with auth: `200`.

UI smoke:

- Russian title `Видимость`: present.
- Lead domain not ready copy: present.
- Google Search Console copy: present.
- Yandex copy: present.

## Read Model Endpoint

Authorized request:

- `GET /api/admin/visibility/read-model?period=28`: `200`.

Required sections:

```text
read_model_required_missing=none
```

Source states:

```text
first_party_events: ok
yandex_metrica: not_configured
yandex_webmaster: not_configured
google_search_console: not_configured
lead_domain: not_ready
```

This is expected for the SEO Dashboard read model at this stage: Yandex API credentials/tooling exist, but scheduled/imported source sync into the read model is not implemented in this acceptance wave.

Counts from live read model:

```text
pages=1
recommendations=3
evidence_items=1
semantic_click_map=9
classified_content_changes=1
```

Lead domain proof:

```text
page_list lead status: unavailable, value: null
selected_page_detail lead status: unavailable
```

So lead domain is not represented as `0` leads.

Privacy key scan:

```text
read_model_forbidden_key_hits=none
```

Checked for forbidden key classes such as OAuth/client secret/access token/refresh token/raw session/raw event/form values/raw user agent/IP/direct SQL.

## Event Endpoint

Live POST checks against `/api/analytics/events`:

```text
valid public event without anonymous_id/session_id -> 202
admin-authenticated public browsing event -> 202, excluded=true, reason=admin_user
bot user agent event -> 202, excluded=true, reason=bot_or_crawler
QA header event -> 202, excluded=true, reason=qa_traffic
unknown event_type -> 400 INVALID_EVENT
sensitive metadata key -> 400 INVALID_EVENT
form_values root field -> 400 INVALID_EVENT
token-like metadata value -> 400 INVALID_EVENT
```

DB insert proof before cleanup:

```text
page_view | /__acceptance_unmapped_* | server_anon=true | server_session=true | excluded=false
page_view | / | server_anon=true | server_session=true | excluded=true | reason=admin_user
page_view | / | server_anon=true | server_session=true | excluded=true | reason=bot_or_crawler
page_view | / | server_anon=true | server_session=true | excluded=true | reason=qa_traffic
```

Stored test events did not contain accepted `form_value` or `token` metadata keys.

Unmapped URL diagnostic was created for the synthetic unmapped acceptance URL:

```text
unmapped_diag=/__acceptance_unmapped_* | hits=1 | source=first_party_events
```

## Aggregate / Exclusion Proof

After running `aggregateDailyAnalyticsEvents` for the current date, only the non-excluded public event appeared in `analytics_page_daily`:

```text
page_view | /__acceptance_unmapped_* | users=1 | page_views=1
aggregate_rows_for_acceptance=1
```

The admin, bot and QA events were stored as excluded events but did not enter business aggregates.

Temporary acceptance user, sessions, events, unmapped diagnostics and aggregate rows were cleaned up. Cleanup verification:

```text
temp_users=0
temp_events=0
temp_unmapped_diagnostics=0
temp_aggregates=0
```

## Public Routes Smoke

Live route smoke:

```text
/ -> 200
/services -> 200
/cases -> 200
/services/arenda-tehniki -> 200
/cases/[published slug] -> not checked; no published case slug exists
/about -> 404
/contacts -> 404
/yandex_26aab3d248d69ec2.html -> 200
/robots.txt -> 200
/sitemap.xml -> 200
```

## /about and /contacts Root Cause

Code path evidence:

- `app/about/page.js` loads `getPublishedAboutPage()` and calls `notFound()` when neither published content nor placeholder mode is available.
- `app/contacts/page.js` loads `getPublishedContactsPage()` and calls `notFound()` under the same condition.
- `lib/read-side/public-content.js` resolves those via `findPublishedPageByPageType(pageType)`.
- `app/sitemap.js` only includes `aboutPage` and `contactsPage` when published projections exist.

Server content state:

```text
display_mode=published_only
entity_count=page:1
published_about_count=0
published_contacts_count=0
global_settings_contact_truth_confirmed=true
```

There is one `page` entity, but it has no `active_published_revision_id`. No published Page(type=about) or Page(type=contacts) exists.

Decision:

- Classified as content-state blocker, not route-code bug.
- No fake business content was created.
- No safe fallback was implemented in this task, because canonical public pages should come from Content Core.

Next action:

- Create/review/publish approved Content Core pages for `pageType=about` and `pageType=contacts`.
- Since global settings contact truth is confirmed, `/contacts` likely has enough source basis for an approved editorial draft, but publication should still go through Admin Console / Content Core workflow.

## Sitemap / Robots / Canonical Notes

Sitemap consistency:

```text
sitemap_about=absent
sitemap_contacts=absent
```

This is correct while those routes return 404. The site is not publishing `/about` or `/contacts` in sitemap while content is missing.

Robots smoke:

```text
/robots.txt -> 200
```

Yandex verification route:

```text
/yandex_26aab3d248d69ec2.html -> 200
```

## Yandex Webmaster Sanity

`npm run yandex:check-webmaster` on `repo-app-1`:

```text
status: ok
configured_host_id_status: found
host_id: https:ecostroycontinent.ru:443
verification_state: VERIFIED
verification_type: HTML_FILE
```

## Security / Privacy Checks

Passed:

- Event endpoint rejects unknown event types.
- Event endpoint rejects dangerous metadata keys.
- Event endpoint rejects `form_values`.
- Event endpoint rejects token-like metadata values.
- Event endpoint works without client `anonymous_id/session_id` and generates safe server IDs.
- Admin/bot/QA traffic is explicitly marked excluded.
- Excluded traffic does not enter business aggregates.
- Read model does not expose forbidden secret/raw-data key classes.
- OAuth tokens/client secret/authorization code were not printed or written to the report.
- UI/read model does not represent missing leads as zero.

## Tests / Build

No code was changed in this acceptance task, so `npm test` and `npm run build` were not rerun here.

Relevant prior implementation/audit state remains:

- `npm test`: 442/442 pass.
- `npm run build`: pass.

This acceptance added live server proof against canonical runtime and canonical SQL.

## Known Limitations

- Yandex Metrica/Webmaster API bootstrap exists and Metrica goals are prepared, but scheduled/imported source sync into `analytics_source_sync_state`, `external_search_visibility_daily` and dashboard aggregates is intentionally not implemented in this wave.
- `yandex_metrica` and `yandex_webmaster` therefore appear as `not_configured` in the read model until import/sync foundation is connected.
- Lead/intake domain remains `not_ready`; contact actions are the MVP conversion basis.
- No published case slug exists on the server, so `/cases/[slug]` live smoke could not be performed.
- `/about` and `/contacts` are blocked by missing published Content Core pages.

## Next Steps

1. Publish approved Content Core pages for `about` and `contacts`.
2. Re-run public route smoke and confirm both routes return `200`.
3. In a separate implementation wave, connect Yandex import/sync state into the analytics read model.
4. Keep lead metrics unavailable until the lead/intake domain is designed and implemented.

## Git Status

Before this report, local git status contained only pre-existing `docs/out` deletions. They were not touched.

Expected status after adding this report:

```text
new report: docs/reports/2026-05-04/SEO_DASHBOARD_SERVER_ACCEPTANCE_AND_PUBLIC_ROUTES_Экостройконтинент_v0.1.report.md
pre-existing deletions: docs/out/*
```
