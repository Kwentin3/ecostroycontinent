# Blueprint R3B. Webmaster Query / Page Visibility Import

Дата: 2026-05-19

Проект: Экостройконтинент

Домен: SEO Dashboard / Visibility / Analytics Foundation

Русское название: R3B. Импорт поисковой видимости Яндекс Вебмастера по запросам и страницам

Статус: draft for review. Implementation not started.

## 1. Current Architecture

R3A already provides a server-side Webmaster import foundation:

- operator-triggered dry-run/write script exists;
- `YANDEX_WEBMASTER_OAUTH_TOKEN` stays server-side;
- `YANDEX_WEBMASTER_HOST_ID=https:ecostroycontinent.ru:443` is used on canonical runtime;
- host verified state is checked through API;
- `analytics_source_sync_state` is updated for `source_system = yandex_webmaster`;
- URL normalization and Content Core route resolution exist for Webmaster URL samples and query rows;
- unmapped URL diagnostics path exists;
- dedicated external tables exist:
  - `external_webmaster_host_snapshot`;
  - `external_webmaster_indexation_snapshot`;
  - `external_webmaster_url_sample`;
  - `external_webmaster_query_visibility_daily`.

R4-lite now reads project storage and exposes `external_source_readiness`, including:

- `yandex_webmaster.status=ok/fresh`;
- host verified and indexation summary;
- one in-search URL sample resolved to `/`;
- `query_visibility_rows=0`;
- limitation `webmaster_query_visibility_no_rows_for_period`.

R3B must deepen only the query/page visibility import. It must not change read model/UI and must not become full R3/R4.

## 2. Official API Capability Check

### 2.1 Synchronous Query Analytics Endpoint

Official endpoint:

```text
POST https://api.webmaster.yandex.net/v4/user/{user-id}/hosts/{host-id}/query-analytics/list
```

Source: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics

Confirmed capabilities:

- returns a list of search queries or URLs for which the site is shown in Yandex search;
- data is available for the last two weeks;
- request body supports:
  - `offset`, `limit` with max page size `500`;
  - `device_type_indicator`, default `ALL`;
  - `search_location`, default `WEB_LOCATION`;
  - `text_indicator = QUERY | URL`;
  - `region_ids`;
  - text filters for query/URL;
  - statistic filters by date range;
  - sorting by date/statistic field;
- response includes:
  - `count`;
  - `text_indicator_to_statistics[]`;
  - `text_indicator.type = QUERY | URL`;
  - `text_indicator.value`;
  - `popular_complementary_indicator.type = QUERY | URL`;
  - `popular_complementary_indicator.value`;
  - `statistics[]` with `date`, `field`, `value`;
- confirmed statistic fields include:
  - `IMPRESSIONS`;
  - `CLICKS`;
  - `CTR`;
  - `POSITION`;
  - `DEMAND`.

Confirmed limitations:

- the API returns the most frequent complementary query for a URL or URL for a query, not a complete query-URL pair matrix;
- position may be absent in valid cases;
- `429 TOO_MANY_REQUESTS_ERROR` applies after more than 10,000 requests per domain per hour;
- errors include invalid body/field, invalid URL, invalid user id, host not verified, host not indexed, host not loaded.

### 2.2 Popular Search Queries Endpoint

Official endpoint:

```text
GET https://api.webmaster.yandex.net/v4/user/{user-id}/hosts/{host-id}/search-queries/popular
```

Source: https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular

Confirmed capabilities:

- returns popular search query rows;
- supports ordering, query indicators, device, date range, offset and limit;
- returns `query_id`, `query_text`, date range and indicators such as `TOTAL_SHOWS`, `TOTAL_CLICKS`, `AVG_SHOW_POSITION`, `AVG_CLICK_POSITION`.

R3B use:

- fallback/query discovery only;
- not enough for page URL mapping by itself.

### 2.3 Advanced Query Analytics by URL Beta

Official beta export:

```text
GET  /v4/user/{user-id}/hosts/{host-id}/pro/regions
GET  /v4/user/{user-id}/hosts/{host-id}/pro/limits
GET  /v4/user/{user-id}/hosts/{host-id}/pro/serp/dates
POST /v4/user/{user-id}/hosts/{host-id}/pro/serp/queries/download/
GET  /v4/user/{user-id}/hosts/{host-id}/pro/serp/queries/download/{task-id}
```

Source: https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export

Confirmed capabilities:

- designed for aggregated query/page rows;
- output columns include date, host, URL, query, region, clicks, impressions and position;
- request is parameterized by URL array, date range and region array;
- data can cover the last 550 days;
- basic access allows up to 100 requests/day and up to 100 URLs per request;
- one URL for one day consumes one request;
- export is offline/asynchronous and usually takes 20 minutes to 2 hours, sometimes up to 24 hours.

Confirmed limitations:

- beta status;
- async workflow requires task initiation and status polling;
- URL list must be supplied;
- quota must be checked before write-mode export;
- response/download shape must be dry-run-verified before storing rows.

## 3. Architecture Decision Summary

Recommended endpoint strategy:

1. Primary candidate for true query/page R3B: advanced query analytics by URL beta, if canonical host has access and dry-run confirms limits, available dates and downloadable result shape.
2. Conservative fallback: `query-analytics/list` in `text_indicator=URL` mode, with clear limitation that it provides URL rows with a popular complementary query, not complete URL-query coverage.
3. `search-queries/popular` remains fallback/query discovery only, not storage source for `external_webmaster_query_visibility_daily` unless a later design adds query-only storage.

Why:

- R3B asks specifically for query/page visibility. The beta export is the official API capability that explicitly promises date, URL, query, region, clicks, impressions and position.
- R3A already proved the synchronous `query-analytics/list` path but got zero rows for the accepted period; it is still useful, but it does not guarantee complete pair coverage.
- Full R4 and recommendations should wait until implementation proves real row volume and limitations.

Rejected for R3B:

- broad Webmaster endpoint sweep;
- search event samples as a substitute for query/page visibility;
- popular queries only as if they were page-level evidence;
- direct read model/UI calls to Webmaster API;
- query/session/lead joins.

## 4. Proposed Architecture

Target R3B flow:

```text
Yandex Webmaster API
-> server-side R3B importer
-> dry-run endpoint/access/date/quota check
-> bounded URL/date/region plan
-> fetch query/page visibility rows
-> normalize query, URL, device/date/region/stat metrics
-> route/entity mapping
-> external_webmaster_query_visibility_daily
-> analytics_unmapped_url_diagnostic where needed
-> analytics_source_sync_state
-> later R4/full read model integration
```

No browser/client API calls.

No live Yandex API calls in read model request path.

No scheduler in R3B.

## 5. Implementation Slices Inside R3B

R3B should be implemented in small operator-triggered steps:

### R3B-0. Access / Capability Dry Run

- check env without printing token;
- get user id;
- check host and verification;
- check beta `/pro/limits`;
- check `/pro/serp/dates`;
- check `/pro/regions` minimally;
- build a bounded URL list from Content Core/sitemap/in-search samples;
- validate selected date window;
- do not write rows.

### R3B-1. Beta Export Pilot

- submit at most a small URL set and a short date range;
- persist only task metadata if implementation needs a run record, or keep task state in operator output if no storage is needed;
- poll status via approved operator command;
- parse result only after ready;
- write query/page rows to `external_webmaster_query_visibility_daily`;
- update source state.

### R3B-2. Synchronous Fallback Pilot

Use only if beta export access/result is unavailable:

- call `query-analytics/list` with `text_indicator=URL`;
- import rows with limitation `webmaster_query_analytics_popular_complement_only`;
- do not claim complete query/page coverage.

R3B should not jump directly to broad URL/date coverage.

## 6. Storage Design

Existing table `external_webmaster_query_visibility_daily` is suitable for R3B rows if the final row shape includes at least:

- `source_system = yandex_webmaster`;
- `host_id`;
- `date`;
- `search_engine = yandex`;
- `query`;
- `normalized_url`;
- `page_path`;
- `entity_type` / `entity_id` nullable;
- `device`;
- `country` / `region` nullable or empty;
- `impressions`;
- `clicks`;
- `ctr`;
- `average_position`;
- `imported_at`;
- `import_run_id`;
- `metadata` safe only.

Current unique key:

```text
source_system + host_id + date + query + normalized_url + device + country + region
```

This is acceptable for R3B if:

- region is normalized into `country`/`region`;
- device is explicit (`all`, `desktop`, `mobile_and_tablet`, etc.);
- query is redacted/normalized before storage;
- URL is canonicalized before upsert.

Potential migration direction if dry-run proves mismatch:

- add `query_hash` if raw query text needs stronger privacy controls;
- add `source_endpoint` or `report_shape` if beta export and synchronous fallback rows need separate provenance;
- add `rank_position_source` only if API distinguishes ranking/position semantics in a way that cannot fit `average_position`.

Do not create migration during PRD/Blueprint design.

## 7. Sensitive Query Handling

Before storing query text:

- trim and compact whitespace;
- cap length;
- redact email-like and phone-like substrings;
- consider replacing fully sensitive queries with `[redacted_sensitive_query]`;
- keep a stable hash only if later implementation needs dedupe without raw text.

Metadata must not include:

- raw request bodies with Authorization context;
- full raw API responses;
- tokens;
- user/session/lead/contact ids;
- IP/user-agent;
- form values;
- sensitive URL query params.

## 8. Date Window Strategy

R3A proved that too-fresh dates can be rejected. R3B must not default to today/yesterday blindly.

Recommended strategy:

- For beta export:
  - first call `/pro/serp/dates`;
  - choose an available completed date window from API-provided dates;
  - start with a small accepted range, for example 3-7 available days;
  - record final selected range in dry-run and report.
- For `query-analytics/list` fallback:
  - respect the official "last two weeks" window;
  - choose a range that excludes too-fresh dates, for example ending at least 2 days before current Moscow date;
  - if API returns date validation error, shrink or shift to older dates and mark the adjustment.

No fabricated rows if selected range returns zero rows.

## 9. Idempotency

Recommended upsert key for query visibility rows:

```text
source_system + host_id + date + query + normalized_url + device + country + region
```

Rules:

- same URL/date/region/device/query rerun updates metrics and `imported_at`, not duplicate rows;
- zero-row valid result updates source state and limitations, not fake rows;
- different endpoint shapes must include safe metadata provenance;
- if beta export returns same row multiple times, importer should collapse before upsert or rely on DB upsert.

## 10. Source Sync State

R3B continues using `analytics_source_sync_state` for `source_system = yandex_webmaster`.

Status rules:

- `not_configured`: missing token/host id or beta access required but unavailable before endpoint choice.
- `ok`: selected R3B endpoint completed successfully; rows may be greater than zero or zero if API validly returned no rows.
- `partial`: one selected endpoint/path succeeded and another failed or was unavailable unexpectedly.
- `failed`: no usable API result and no truthful source state can be accepted.
- `stale`: previous success exists, but data is older than agreed freshness threshold.

Fields:

- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count`.

If rows are zero after a successful endpoint call, source state may remain `ok`, but report/readiness should expose limitation such as:

```text
webmaster_query_visibility_no_rows_for_period
```

## 11. URL Normalization / Mapping

Use existing route/content helpers where possible.

Rules:

- canonical production host;
- strip fragments;
- strip tracking query params;
- normalize scheme/host/trailing slash;
- decode path safely;
- map to Content Core route/entity where possible;
- write unmatched rows to `analytics_unmapped_url_diagnostic`;
- do not silently drop unmapped URLs;
- do not create pages;
- do not mutate Content Core;
- do not redirect automatically.

If the beta export requires a URL list, source it conservatively from:

- published public routes;
- sitemap URLs;
- R3A in-search URL samples;
- bounded owner-approved additions if needed.

Do not include admin/internal/test URLs.

## 12. Query Attribution Limitation

Technical guardrail:

- importer stores aggregate rows only;
- no joins to `telemetry_events`;
- no joins to contact journey/contact action tables;
- no joins to users/sessions/leads;
- no statement that a session/contact/lead came from query X.

Allowed later:

- page-level SEO evidence;
- query/page aggregate opportunity;
- comparing page-level query impressions with page-level internal engagement after full R4/R5 designs define safe thresholds.

## 13. Error Handling

Safe mapping:

- missing env -> `not_configured`;
- host not verified -> `failed`;
- host not loaded/indexed -> `partial` or `failed` depending endpoint plan;
- invalid date range -> safe `partial`/`failed`, with selected date adjustment if possible;
- beta quota exhausted -> `partial`/`failed`, no retry storm;
- beta task pending -> `partial`/`ok_pending_external_processing` in report, not fake failure;
- endpoint unsupported -> `partial`/`unavailable`;
- rate limit -> bounded retry if simple, otherwise `partial`/`failed`;
- network failure -> `partial`/`failed`;
- token expired/invalid -> `failed`, no token output.

Do not dump raw Authorization headers, request configs, task payloads containing tokens, or full raw responses.

## 14. Tests Required For Implementation

R3B implementation should add tests for:

- missing host/token -> `not_configured` safe result;
- API client mocked;
- dry-run writes nothing;
- beta limits/dates checks handled;
- beta export pending state handled without fake rows;
- successful beta import writes query/page rows;
- fallback `query-analytics/list` rows carry limitation/provenance;
- zero rows are valid and update source state truthfully;
- invalid date range safe handling;
- idempotent rerun;
- URL normalization;
- unmapped diagnostics;
- query redaction;
- no joins to user/session/lead/contact tables;
- no UI/browser Webmaster API calls;
- no read model integration unless a separate R4 task scopes it.

Existing guard tests should continue to prove:

- no direct UI -> Webmaster API;
- no live Yandex API calls in read model path;
- no secrets/raw responses in DTOs/reports.

## 15. Server Acceptance Plan

Later implementation acceptance should run on canonical runtime:

1. deploy through existing workflow;
2. run dry-run capability check;
3. if beta export is selected, prove limits/dates and submit a bounded pilot only after dry-run;
4. if async export is pending, record task status and do not claim full acceptance until result is fetched or delayed status is explicitly accepted;
5. import bounded date/URL set;
6. prove rows exist or valid zero-row result is captured;
7. prove `analytics_source_sync_state` is truthful;
8. prove idempotency by rerun;
9. prove unmapped diagnostics where applicable;
10. prove no secrets in output;
11. prove no read model/UI integration;
12. prove internal telemetry unaffected.

## 16. Rollback

R3B must be operator-triggered and unscheduled.

Rollback path:

- stop running the operator command;
- if bad rows are imported, delete by bounded `source_system + import_run_id` or date/URL partition;
- keep R3A host/indexation/source readiness rows intact unless the rollback specifically targets R3B rows;
- no Content Core rollback because R3B must not mutate Content Core;
- no read model rollback because R3B does not wire full R4.

## 17. Non-goals Reminder

R3B must not implement:

- full Webmaster endpoint sweep;
- scheduled imports;
- `/admin/visibility` redesign;
- full R4;
- recommendations;
- LLM;
- lead/intake;
- Content Core mutation;
- user/session/lead attribution;
- broad BI warehouse behavior.

## 18. Implementation Readiness Checklist

Before implementation starts:

- PRD and Blueprint reviewed;
- endpoint strategy approved: beta primary + sync fallback, or sync-only first;
- beta access/quota posture decided;
- URL seed source decided;
- date window default approved;
- query text privacy posture approved;
- storage compatibility confirmed against `external_webmaster_query_visibility_daily`;
- acceptance criteria include zero-row and delayed async states.

## 19. References

- PRD R3B: `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- R3 Blueprint: `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- Storage addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- R3A implementation report: `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- R4-lite implementation report: `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- Official Webmaster query analytics: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics
- Official Webmaster popular search queries: https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular
- Official Webmaster advanced query analytics by URL beta: https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export
