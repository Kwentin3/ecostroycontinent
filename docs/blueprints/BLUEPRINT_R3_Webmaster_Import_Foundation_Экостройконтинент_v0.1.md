# Blueprint R3. Webmaster Import Foundation

Русское название: Импорт данных Яндекс Вебмастера.
Проект: Экостройконтинент.
Статус: draft for review; implementation not started.
Дата: 2026-05-19.

## 1. Current Architecture

Current state:

- `YANDEX_WEBMASTER_HOST_ID=https:ecostroycontinent.ru:443` is configured in canonical server env.
- Yandex Webmaster host is verified with HTML file verification according to prior acceptance reports.
- `scripts/yandex/check-webmaster` exists for safe server-side checks.
- `external_search_visibility_daily` exists from migration 008, but production imports are not implemented.
- `analytics_source_sync_state` exists for source freshness/status.
- Analytics read model currently does not consume imported Webmaster rows as real external aggregates.

Boundary:

- Webmaster is an external search/indexation signal.
- Content Core remains the source of truth for published pages and active revisions.
- Webmaster query/search data is aggregate and must not be used as session/lead attribution.

## 2. Official API Capability Check

Checked official docs on 2026-05-19:

- Yandex Webmaster API overview: `https://yandex.com/dev/webmaster/doc/en/`
- Host information: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-id`
- Site summary: `https://yandex.com/dev/webmaster/doc/dg/reference/host-id-summary.html`
- In-search URL samples: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-indexing-insearch-samples`
- Search event samples: `https://yandex.com/dev/webmaster/doc/dg/reference/hosts-search-events-samples.html`
- Important URLs: `https://yandex.com/dev/webmaster/doc/en/reference/host-id-important-urls`
- Popular search queries: `https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular`
- Query history: `https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-history`
- Query analytics: `https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics`

Confirmed capabilities:

- API provides host-level information, including host id, URLs, verified flag and host data status.
- Site summary endpoint provides general site indexing/statistics information.
- In-search samples endpoint returns URLs of pages included in search results, with pagination.
- Search event samples endpoint can return pages that appeared in or were removed from search where available.
- Important URLs endpoint exists for pages selected in Webmaster monitoring.
- Popular search queries endpoint exposes aggregate query indicators such as total shows, total clicks and average positions with device type indicators.
- Query analytics endpoint supports aggregate query/URL analysis with indicators such as impressions, clicks and average positions; it supports date filtering, grouping and device dimensions.

Important limitations:

- Some URL endpoints provide samples, not guaranteed full canonical page inventory.
- Query/search data is aggregate and delayed; it cannot prove user-level attribution.
- Some product-desired diagnostics may be present in Webmaster UI but not available via API.
- API field names and endpoint availability must be verified by dry run against the project host before schema/migration work.
- Query analytics date ranges have documented limits; implementation must not request arbitrary historical ranges.

## 3. Proposed Import Architecture

Recommended architecture:

```text
Yandex Webmaster API
-> server-side importer/job
-> endpoint-specific normalizers
-> URL normalization and Content Core route mapping
-> project storage
-> analytics_source_sync_state
-> analytics_unmapped_url_diagnostic
-> R4 read model integration later
```

The importer should start as a safe manual/operator-triggered job or command. Scheduling should be enabled only after dry-run and limited production import acceptance.

No UI/browser code should call Webmaster API.

## 3.1 R3A Minimal First Slice

Recommended first implementation slice:

```text
R3A. Webmaster Host / Indexation / Query Visibility Dry Run
```

R3A goal:

- prove host access, endpoint availability, storage shape, source state, URL diagnostics and safe errors without sweeping all Webmaster endpoints.

R3A flow:

```text
server command/job
-> validate host id and server env without printing token
-> confirm verified host state
-> dry-run selected endpoint capabilities without writes
-> choose one bounded snapshot/period
-> write only rows with accepted storage shape
-> update analytics_source_sync_state
-> write unmapped URL diagnostics where applicable
-> report rows/status/errors safely
```

R3A minimal endpoint set:

- host status / verification state;
- site summary if API returns it for the host;
- in-search URL samples if API returns them;
- query analytics limited dry-run if API returns page/query rows suitable for storage.

R3A required storage/state:

- `analytics_source_sync_state` row for `source_system = yandex_webmaster`;
- imported period or snapshot timestamp;
- rows imported;
- safe error message;
- unmapped URL diagnostics where URL imports run;
- only rows whose storage shape has been accepted.

R3A non-goals:

- no broad endpoint sweep;
- no important URLs unless explicitly included after dry-run proves availability;
- no search event sample import in the first slice;
- no full query/page visibility importer;
- no scheduled cadence;
- no read model wiring;
- no UI changes;
- no fabricated fields.

Migration is likely needed for non-visibility host/indexation/sample records. See `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.

## 3.2 R3 Later Slices

- R3B: deepen query/page visibility import after R3A confirms endpoint and storage shape.
- R3C: add important URLs and search event samples if the API/account supports them.
- R3D: add scheduled cadence, retention and broader URL diagnostics.

Recommended order inside R3:

```text
R3A -> R3B -> R3C -> R3D
```

Do not treat R3 as a one-shot full Webmaster import.

## 4. Storage Design

Existing table fit:

`external_search_visibility_daily` is suitable for aggregate search visibility rows when Webmaster API provides:

- date;
- source system;
- search engine;
- query;
- page URL/path;
- device;
- country/region if available;
- impressions;
- clicks;
- CTR or computable CTR;
- average position.

Recommended row semantics for this table:

- `source_system = yandex_webmaster`;
- `search_engine = yandex`;
- `query` stores aggregate query text or a safe normalized query key where available;
- `page_path` stores normalized path where URL dimension is available;
- `metadata` stores safe API context, such as endpoint/report type, not secrets.

Storage gaps:

Host state, site summary, indexed URL samples, in-search samples, search events and important URL monitoring do not fit cleanly into `external_search_visibility_daily`.

Implementation may require new tables, for example:

- `external_webmaster_host_snapshot`;
- `external_webmaster_indexation_snapshot`;
- `external_webmaster_url_sample`;
- `external_webmaster_search_event_sample`;
- `external_webmaster_important_url`.

This blueprint does not create migrations. It requires implementation to avoid cramming non-visibility records into unsuitable tables.

Detailed shared direction is recorded in `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.

Always use:

- `analytics_source_sync_state` for `source_system = yandex_webmaster`;
- `analytics_unmapped_url_diagnostic` for URL mapping failures.

## 5. URL / Entity Mapping

URL mapping rules:

- normalize scheme/host to canonical production host;
- strip fragment and tracking query parameters;
- preserve meaningful path and safe query only if needed for route identity;
- normalize trailing slash and percent encoding;
- map to known public route/page/entity where possible;
- keep original URL in safe metadata only if it does not contain sensitive parameters;
- write unmapped URLs to diagnostics with source endpoint and reason.

Do not silently drop unmatched URLs. Unmapped rows are a product signal.

Content Core remains the source of truth for published pages. Webmaster can say a URL appears in search; it cannot define canonical Content Core ownership alone.

## 6. Idempotency

Importer must be safe to rerun:

- each endpoint import has a bounded date/period or snapshot timestamp;
- aggregate query visibility rows upsert by `source_system + date + search_engine + query + page_path + device + country/region`;
- snapshot/sample rows upsert by `source_system + endpoint + normalized_url + observed_at/import_period`;
- same period and endpoint rerun must not duplicate rows;
- partial endpoint success should preserve successful rows and mark state honestly.

## 7. Sync State

Use `analytics_source_sync_state` with:

- `source_system = yandex_webmaster`;
- `status`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count`.

Status rules:

- `not_configured`: missing host id, token or disabled importer.
- `ok`: required endpoint set imported successfully and data is fresh enough.
- `partial`: at least one required endpoint succeeded and at least one required endpoint failed or was unavailable.
- `failed`: no usable endpoint data was imported in latest attempt.
- `stale`: last success exists, but latest data is older than freshness threshold.

## 8. Error Handling

Map errors to safe categories:

| Error | Required behavior |
| --- | --- |
| Host not verified | `failed`, safe message; do not import stale-looking data as ok. |
| Token expired/invalid | `failed`, no token output. |
| Permission denied / invalid user id | `failed`, safe message; include available user id only if not sensitive and needed. |
| Host not found | `failed` or `not_configured`. |
| Endpoint unavailable/unsupported | `partial` if optional or `failed` if required. |
| Rate limit | bounded retry if safe; otherwise `partial`/`failed`. |
| Query date range invalid | implementation bug; fail safely and report field limitation. |
| Network failure | `partial`/`failed`; no infinite retry. |

Do not dump raw Authorization headers, env, tokens or full request objects.

## 9. Search Query Attribution Limitation

Mandatory rule:

Webmaster query/search data is aggregate. It cannot be used to claim that a specific session, contact action or lead came from query X.

Allowed:

- page-level evidence that a URL/query pair has impressions/clicks/average positions;
- aggregate opportunity detection for SEO work;
- comparison with internal page engagement at page level.

Forbidden:

- user/session-level query attribution;
- lead attribution from Webmaster query data;
- replacing internal telemetry or Content Core route ownership.

## 10. Tests

Required tests for implementation:

- API client mocked.
- Missing host/token -> `not_configured`.
- Host verified response updates host/source state.
- Unsupported optional endpoint yields `partial` without crashing.
- Host not verified maps to safe failure.
- Query analytics rows normalize and upsert idempotently.
- In-search URL samples normalize and write unmapped diagnostics.
- Same import period rerun does not duplicate rows.
- Secrets absent from logs/reports/DTOs.
- No UI/browser direct Webmaster API usage.
- Query data is not joined to user/session/lead records.

## 11. Server Acceptance Plan

Later implementation should prove:

1. Canonical env has host id and server token present without printing token values.
2. Host info check returns verified host.
3. Dry-run lists planned endpoints and selected periods.
4. Limited import runs against one recent available period or snapshot endpoint.
5. DB contains expected rows in appropriate tables.
6. `analytics_source_sync_state` row for `yandex_webmaster` is truthful.
7. Unmapped URL diagnostics are populated where mapping fails.
8. Read model integration is not changed unless R4 is explicitly in scope.
9. No secrets appear in output.

## 12. Rollback

Rollback:

- disable scheduled/operator trigger;
- leave internal telemetry untouched;
- imported rows can be recomputed or deleted by bounded source/date/endpoint partition if implementation provides cleanup;
- no Content Core changes should need rollback because R3 must not mutate Content Core;
- no secret rotation unless a secret was exposed.

## 13. Open Questions / Decisions

- First implementation target: host/indexation snapshot first, query visibility first, or both in one importer?
- Freshness threshold for Webmaster data.
- Whether important URLs are configured in the Webmaster account.
- Whether query analytics URL dimension gives enough page-level rows for `external_search_visibility_daily`.
- Whether new tables are required before meaningful host/indexation import.
- How to retain raw query text safely if queries contain unexpected personal data.
- Which endpoint set is mandatory vs optional for `ok`.
- Exact R3A table shape/migration after dry-run confirms endpoint payloads.

## 14. Architecture Decision Summary

Recommended design:

- server-side importer only;
- endpoint-specific storage instead of forcing all Webmaster data into one table;
- use `external_search_visibility_daily` for genuine query/page visibility aggregates;
- use new future tables for host/indexation/samples if implementation needs them;
- update `analytics_source_sync_state` and unmapped diagnostics;
- defer read model integration to R4.

Rejected designs:

- UI calling Webmaster API directly;
- treating Webmaster as Content Core truth;
- claiming user-level query attribution;
- fabricating fields that the API does not expose;
- mixing R3 with Metrica R2 or lead/intake.
