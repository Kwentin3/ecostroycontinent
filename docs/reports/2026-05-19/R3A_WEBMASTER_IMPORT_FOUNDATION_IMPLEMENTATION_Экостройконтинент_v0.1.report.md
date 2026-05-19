# R3A Webmaster Import Foundation Implementation Report

Date: 2026-05-19
Branch: `feat/r3a-webmaster-import-foundation`
Implementation commit: `8a8e2e5ea6668375637fc4fdd16ea3b2e77a22c8`
Runtime target: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`, canonical env `/opt/ecostroycontinent/runtime/.env`

## Executive Verdict

R3A is implemented and accepted on canonical runtime.

The domain now has a server-only, operator-triggered Yandex Webmaster import foundation:

- dry-run command validates env, host, verification and selected endpoint capability without DB writes;
- write command imports accepted host/indexation/URL sample rows into project-owned storage;
- `analytics_source_sync_state` is updated for `source_system = yandex_webmaster`;
- same snapshot/period rerun is idempotent;
- Content Core remains the source of truth for published pages and route ownership;
- Webmaster data remains external search/indexation enrichment only.

R3B/R3C/R3D, scheduled imports, read model integration, `/admin/visibility` UI changes, LLM and lead/intake were not implemented.

## Files Changed

- `db/migrations/011_external_webmaster_import_foundation.sql`
- `scripts/yandex/import-webmaster-data.mjs`
- `scripts/yandex/webmaster-import-lib.mjs`
- `tests/yandex-webmaster-import-r3a.test.js`
- `package.json`

Closure docs are updated separately in this delivery pass:

- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

## Storage

Migration added and applied on canonical SQL:

```text
db/migrations/011_external_webmaster_import_foundation.sql
```

New tables:

- `external_webmaster_host_snapshot`
- `external_webmaster_indexation_snapshot`
- `external_webmaster_url_sample`
- `external_webmaster_query_visibility_daily`

R3A deliberately uses dedicated Webmaster tables instead of forcing host/indexation snapshots into `external_search_visibility_daily`. That preserves the storage direction from the R2/R3 addendum and keeps read model integration deferred to R4.

## Commands Added

```bash
npm run yandex:webmaster-import:dry-run
npm run yandex:webmaster-import:r3a
```

Both commands accept bounded dates/snapshot options:

```bash
npm run yandex:webmaster-import:dry-run -- --date1=2026-05-05 --date2=2026-05-17 --observed-date=2026-05-19 --limit=10
npm run yandex:webmaster-import:r3a -- --date1=2026-05-05 --date2=2026-05-17 --observed-date=2026-05-19 --limit=10
```

No scheduler was added.

## API Capability Basis

Official Yandex Webmaster documentation checked:

- host info: https://yandex.com/dev/webmaster/doc/en/reference/hosts-id
- verification info: https://yandex.com/dev/webmaster/doc/en/reference/host-verification-get
- site summary: https://yandex.com/dev/webmaster/doc/en/reference/host-id-summary
- in-search URL samples: https://yandex.com/dev/webmaster/doc/ru/reference/hosts-indexing-insearch-samples
- query analytics list: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics

Important capability findings:

- host info and verification are suitable required endpoints;
- site summary is suitable for indexation/site-health snapshot storage;
- in-search samples are samples, not a complete URL universe;
- query analytics is aggregate query/page evidence and must not be joined to sessions/leads;
- query analytics can reject too-fresh dates. On 2026-05-19 the endpoint rejected `2026-05-18`, so acceptance used `2026-05-05..2026-05-17`.

## Selected Endpoint Plan

Required:

- `GET /v4/user`
- `GET /v4/user/{userId}/hosts/{hostId}`
- `GET /v4/user/{userId}/hosts/{hostId}/verification`

Selected optional R3A endpoints:

- `GET /v4/user/{userId}/hosts/{hostId}/summary`
- `GET /v4/user/{userId}/hosts/{hostId}/indexing/samples`
- `GET /v4/user/{userId}/hosts/{hostId}/search-urls/in-search/samples`
- `POST /v4/user/{userId}/hosts/{hostId}/query-analytics/list`

No broad endpoint sweep was implemented.

## Server Deploy

Build/publish workflow:

- workflow: `build-and-publish.yml`
- run id: `26115569911`
- result: success
- image digest: `sha256:206ba81d10ffc6b508f637a3c9648ba867a1993e5c26cab248b13ba9cf804264`

Deploy workflow:

- workflow: `deploy-phase1.yml`
- run id: `26115723802`
- result: success
- image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:206ba81d10ffc6b508f637a3c9648ba867a1993e5c26cab248b13ba9cf804264`
- runtime commit: `8a8e2e5ea6668375637fc4fdd16ea3b2e77a22c8`
- readiness after deploy: `database.status=ok`

Deploy applied migrations through the existing `npm run db:migrate` path.

## Server Acceptance

Canonical env proof:

- `YANDEX_WEBMASTER_HOST_ID=https:ecostroycontinent.ru:443`
- `YANDEX_WEBMASTER_OAUTH_TOKEN=present`
- token value was not printed

`npm run yandex:check-webmaster` on `repo-app-1`:

- status: `ok`
- configured host: found
- selected host: `https:ecostroycontinent.ru:443`
- verified: `true`
- verification state: `VERIFIED`
- verification type: `HTML_FILE`

Dry-run:

```text
npm run yandex:webmaster-import:dry-run -- --date1=2026-05-05 --date2=2026-05-17 --observed-date=2026-05-19 --limit=10
```

Result:

- status: `ok`
- rows prepared: `3`
- rows imported: `0`
- host info: ok, 1 row
- verification: ok, 1 row
- site summary: ok, 1 row
- indexing samples: ok, 0 rows
- in-search samples: ok, 1 row
- query analytics: ok, 0 rows
- unmapped URL count: `0`

Write import:

```text
npm run yandex:webmaster-import:r3a -- --date1=2026-05-05 --date2=2026-05-17 --observed-date=2026-05-19 --limit=10
```

Result:

- status: `ok`
- rows prepared: `3`
- rows imported/upserted: `3`
- host snapshots: `1`
- indexation snapshots: `1`
- URL samples: `1`
- query visibility rows: `0`

Idempotency:

- before rerun: `host=1 summary=1 url=1 query=0`
- after same-period/snapshot rerun: `host=1 summary=1 url=1 query=0`
- row counts did not grow

DB proof:

- `analytics_source_sync_state.source_system=yandex_webmaster`
- status: `ok`
- imported period: `2026-05-05..2026-05-17`
- rows imported: `3`
- unmapped URL count: `0`
- safe error message: empty

Imported row proof:

- host snapshot: verified `true`, `verification_state=VERIFIED`, `verification_type=HTML_FILE`, `host_data_status=OK`
- indexation/site summary metrics: `sqi=0`, `searchable_pages_count=1`, `excluded_pages_count=0`, `site_problems.RECOMMENDATION=3`
- in-search URL sample: normalized URL `https://ecostroycontinent.ru/`, mapped to `page_path=/`, `resolution_status=resolved`, entity type `page`
- query visibility: `0` rows for the accepted period

Unmapped URL diagnostics:

- no unmapped Webmaster URLs appeared in the accepted import;
- `analytics_unmapped_url_diagnostic` remained at `0` rows for `source_system=yandex_webmaster`, which is correct for this run.

Internal telemetry smoke:

- POST to `/api/telemetry/events` returned `ok=true`, `stored=true`, `event_name=page_viewed`;
- stored event was `is_test=true`, `is_internal=false`, `page_path=/`, metadata `page_kind=r3a_smoke`;
- this smoke was not used as Webmaster evidence.

## Tests And Build

Local shell: Windows PowerShell.

Targeted tests:

```text
node --experimental-specifier-resolution=node --test tests/yandex-webmaster-import-r3a.test.js tests/yandex-bootstrap-tooling.test.js tests/telemetry-no-direct-adapters.test.js
```

Result: `27` pass, `0` fail.

Full tests:

```text
npm test
```

Result: `546` pass, `0` fail.

Build:

```text
npm run build
```

Result: passed.

Diff check:

```text
git diff --check
```

Result: passed, with CRLF warnings only.

## Security Checks

Passed:

- importer uses server-side `YANDEX_WEBMASTER_OAUTH_TOKEN` only;
- no token value, refresh token, client secret or Authorization header printed in server acceptance output;
- no Webmaster API usage added to browser/UI code;
- no direct UI -> Webmaster API path added;
- no read model dependency on `external_webmaster_*` tables added;
- no scheduler/cron/workflow added;
- no Content Core mutation from Webmaster rows;
- query data remains aggregate and is not joined to sessions, contact journeys, leads or user-level records;
- no raw sessions, IP, raw user agent, form values or raw request dumps stored.

Boundary scans:

- server scan of `/app/lib/analytics`, `/app/components`, `/app/app/api/admin/visibility` found no `external_webmaster_*` references;
- server scan of `/app/app`, `/app/components`, `/app/lib` found no `api.webmaster.yandex.net` UI/read-model references.

## Known Limitations

- Query analytics returned `0` rows for `2026-05-05..2026-05-17`.
- A too-fresh `2026-05-18` query analytics period was rejected by the API with a safe date-window error; R3A handles this as an API capability/freshness limitation, not as fabricated data.
- `indexing/samples` returned `0` rows in this snapshot.
- R3A does not prove full Webmaster query/page universe coverage; it proves minimal host/indexation/query-capability import foundation.
- Read model remains unchanged until R4.

## What Was Not Implemented

- R3B/R3C/R3D broad Webmaster imports;
- scheduled Webmaster imports;
- read model integration;
- `/admin/visibility` changes;
- Google Search Console;
- lead/intake;
- LLM;
- Content Core mutations;
- query/session/lead attribution;
- broad endpoint sweep.

## Closure Decision

R3A can be closed as accepted.

Recommended next step:

- decide whether to deepen R2/R3 with next external-import slices or start R4 read model integration now that accepted source sync state exists for both `yandex_metrica` and `yandex_webmaster`.

## Git Status At Report Time

After implementation commit and before closure-doc commit:

```text
## feat/r3a-webmaster-import-foundation...origin/feat/r3a-webmaster-import-foundation
```
