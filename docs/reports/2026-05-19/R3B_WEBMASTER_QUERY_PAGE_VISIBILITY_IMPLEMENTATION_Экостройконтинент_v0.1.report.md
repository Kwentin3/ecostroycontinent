# R3B Webmaster Query / Page Visibility Import Implementation Report Экостройконтинент v0.1

Date: 2026-05-19
Domain: SEO Dashboard / Visibility / Analytics Foundation
Slice: R3B. Webmaster Query / Page Visibility Import
Russian name: Импорт поисковой видимости Яндекс Вебмастера по запросам и страницам

## Executive verdict

R3B is implemented and accepted on the canonical Selectel runtime with a conservative synchronous fallback path.

The implementation proves the server-side query/page visibility import boundary, source state updates, zero-row handling, idempotency, safe errors and no attribution leakage. The accepted live Webmaster API period `2026-05-04..2026-05-17` returned a valid zero-row result from `query-analytics/list`; no rows were fabricated. `analytics_source_sync_state` for `yandex_webmaster` is `ok` for the accepted period with `rows_imported=0` and `unmapped_url_count=0`.

R3B is closed as an implementation slice, with an explicit limitation: it did not produce non-empty query/page evidence. Advanced export beta capability endpoints were available, but beta export itself was deferred because the official API describes it as offline/asynchronous and potentially long-running. The implementation used the Blueprint-approved synchronous fallback and records the fallback limitation.

## Branch, commit and runtime

- Branch: `feat/r3b-webmaster-query-visibility`
- Code commit deployed: `d7d35d7f4df60f57443372e664d37a79b0ceb92f`
- Build workflow: `build-and-publish`, run `26122033196`, success
- Build URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/26122033196`
- Published image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:4087704714d73625c0aa6b87803d54c241c75a3ccb62c4452a9c67d348016bff`
- Deploy workflow: `deploy-phase1`, run `26122179282`, success
- Deploy URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/26122179282`
- Runtime readiness commit: `d7d35d7f4df60f57443372e664d37a79b0ceb92f`
- Runtime readiness status: `ready`, database `ok`

## Files changed

Implementation:

- `scripts/yandex/webmaster-import-lib.mjs`
- `scripts/yandex/import-webmaster-query-visibility.mjs`
- `package.json`

Tests:

- `tests/yandex-webmaster-query-import-r3b.test.js`

Docs updated for closure:

- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- this report
- conformity audit report

## Migration and storage

No new migration was added. Existing migration `011_external_webmaster_import_foundation.sql` already provides the correct target table:

- `external_webmaster_query_visibility_daily`

The existing table supports the R3B row shape:

- `source_system = yandex_webmaster`
- `host_id`
- `date`
- `search_engine = yandex`
- `query`
- `normalized_url`
- `page_path`
- `entity_type`, `entity_id`
- `device`, `country`, `region`
- `impressions`, `clicks`, `ctr`, `average_position`
- `imported_at`, `import_run_id`
- safe `metadata`

The existing unique key is used for idempotency:

```text
source_system + host_id + date + query + normalized_url + device + country + region
```

No host/indexation/sample rows are forced into the query visibility table. R3A tables remain untouched except for shared source state semantics.

## Endpoint strategy selected

Official documentation checked:

- Yandex Webmaster `query-analytics/list`: `https://yandex.ru/dev/webmaster/doc/ru/reference/host-query-analytics`
- Yandex Webmaster advanced query export by URL beta: `https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export`

Implemented strategy:

1. Validate server env and host verification.
2. Check advanced export beta capability endpoints:
   - `/pro/limits`
   - `/pro/serp/dates`
   - `/pro/regions`
3. Use synchronous `query-analytics/list` fallback in URL mode for the accepted R3B import.
4. Store rows only if the API returns row-shaped aggregate data.
5. If the endpoint succeeds with zero rows, record `ok` source state and zero rows without fabrication.

Why beta export was deferred:

- The official beta export is an offline/asynchronous export.
- Official docs state the export normally takes 20 minutes to 2 hours and can take up to 24 hours.
- R3B acceptance required a bounded server acceptance cycle without blocking the runtime indefinitely.
- The beta endpoints were capability-checked and returned `ok`, so a later dedicated beta lifecycle pass is possible.

Fallback limitation emitted:

- `webmaster_query_analytics_complementary_indicator_limited`
- `webmaster_advanced_query_export_beta_async_deferred`
- `webmaster_query_visibility_zero_rows_for_period`

## Commands added

```bash
npm run yandex:webmaster-query-import:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --limit=100 --max-pages=2
npm run yandex:webmaster-query-import:r3b -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --limit=100 --max-pages=2
```

The commands are server-side only and use `YANDEX_WEBMASTER_OAUTH_TOKEN` from server env. They do not expose OAuth tokens, authorization headers or raw request dumps.

## Date window

Accepted server date range:

```text
2026-05-04..2026-05-17
```

Reasoning:

- R3A showed too-fresh dates can be rejected by the API.
- R3B default date strategy excludes a two-day freshness buffer.
- Explicit `--date1` and `--date2` options were used for repeatable acceptance.

## Dry-run result

Canonical runtime command:

```bash
npm run yandex:webmaster-query-import:dry-run -- --date1=2026-05-04 --date2=2026-05-17 --limit=100 --max-pages=2
```

Safe summary:

- status: `ok`
- dry_run: `true`
- endpoint_strategy: `query_analytics_sync_fallback`
- beta_ready: `true`
- selected_endpoint: `query-analytics/list`
- selected_text_indicator: `URL`
- query period: `2026-05-04..2026-05-17`
- beta capability:
  - `advanced_export_limits=ok`
  - `advanced_export_dates=ok`
  - `advanced_export_regions=ok`
- query endpoint status: `ok`
- query endpoint count: `0`
- rows_prepared: `0`
- rows_imported: `0`
- unmapped_url_count: `0`
- errors: `[]`

## Write import result

Canonical runtime command:

```bash
npm run yandex:webmaster-query-import:r3b -- --date1=2026-05-04 --date2=2026-05-17 --limit=100 --max-pages=2
```

Safe summary:

- status: `ok`
- dry_run: `false`
- endpoint_strategy: `query_analytics_sync_fallback`
- beta_ready: `true`
- selected_endpoint: `query-analytics/list`
- selected_text_indicator: `URL`
- query period: `2026-05-04..2026-05-17`
- rows_prepared: `0`
- rows_imported: `0`
- record_counts.query_visibility_rows: `0`
- unmapped_url_count: `0`
- safe_error_message: empty
- errors: `[]`

This is a valid zero-row external API result, not a proof of zero demand and not a signal for recommendations.

## Idempotency proof

The same write command was rerun for the same period and scope.

SQL proof after rerun:

```text
total_rows|min_date|max_date|impressions|clicks
0|||0|0
```

Because the API returned zero rows, idempotency is proven as stable zero persisted rows and a stable source state. No duplicates were created.

## Source sync state proof

Canonical SQL result after write and rerun:

```text
source_system|status|imported_period_start|imported_period_end|rows_imported|unmapped_url_count|safe_error_message
yandex_webmaster|ok|2026-05-04|2026-05-17|0|0|
```

## URL mapping and unmapped diagnostics

No URL rows were returned by the accepted API period, so no URL mapping rows or unmapped diagnostics were produced.

Canonical SQL proof:

```text
open_unmapped
0
```

The implementation still includes URL normalization, Content Core route resolution and unmapped diagnostic writing for non-zero query/page rows, covered by tests.

## Query text safety

Implemented protections:

- trims query text;
- caps query text length;
- redacts email-like substrings;
- redacts phone-like substrings;
- stores `[redacted_sensitive_query]` for obvious sensitive query text;
- does not join query rows to user/session/contact/lead data.

## Internal telemetry smoke

Internal first-party telemetry remains operational truth and is unaffected by R3B.

Canonical runtime telemetry smoke:

```text
POST /api/telemetry/events
status: 202
response: {"ok":true,"stored":true,"event_name":"page_engagement_recorded","journey_created":false}
```

The telemetry event was a test smoke and was not used as Webmaster evidence.

## Tests and build

Targeted tests:

```bash
node --experimental-specifier-resolution=node --test tests/yandex-webmaster-query-import-r3b.test.js tests/yandex-webmaster-import-r3a.test.js
```

Result: passed, `19/19`.

Full test suite:

```bash
npm test
```

Result: passed, `558/558`.

Build:

```bash
npm run build
```

Result: passed.

## Security checks

Confirmed:

- only server-side `YANDEX_WEBMASTER_OAUTH_TOKEN` is used;
- no token, client secret, refresh token or Authorization header is printed;
- error bodies are key-scrubbed for sensitive fields;
- no raw API request dumps are stored;
- no raw sessions, IPs, user agents, form values or lead IDs are stored;
- no UI/browser Webmaster API calls were added;
- no read model live Yandex API calls were added;
- no Content Core mutation was added;
- no scheduler was added.

## What was not implemented

R3B did not implement:

- full Webmaster endpoint sweep;
- scheduled imports;
- R4/full read model integration;
- `/admin/visibility` redesign;
- recommendations;
- low CTR/query opportunity rules;
- LLM;
- lead/intake;
- Content Core mutation;
- query-to-session/contact/lead attribution;
- async beta export task lifecycle.

## Known limitations

- The accepted synchronous API result has zero query/page rows.
- `query-analytics/list` in URL mode exposes a URL with a popular complementary query; it is not a complete URL-query universe.
- Advanced export beta capability exists, but result generation is asynchronous and deferred.
- Full R4 should not be started as a rich evidence/recommendation layer from this zero-row result alone.

## Recommended next steps

1. If query/page evidence is still the priority, run a bounded advanced-export beta lifecycle slice with explicit async task handling and delayed verification.
2. If traffic/source enrichment is more valuable now, implement R2B Metrica sources/devices/regions/landing dimensions.
3. Do not generate recommendations from absent Webmaster query rows.
4. Keep full R4 gated on richer non-empty external evidence or explicitly limit it to source diagnostics.

## Git status

At the time this report was created:

- implementation commit: `d7d35d7f4df60f57443372e664d37a79b0ceb92f`;
- closure docs/reports were in progress and intended for a follow-up docs commit;
- no runtime secrets were committed.