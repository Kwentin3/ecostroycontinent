# R3A Webmaster Import Foundation Conformity Audit

Date: 2026-05-19
Branch: `feat/r3a-webmaster-import-foundation`
Audited implementation commit: `8a8e2e5ea6668375637fc4fdd16ea3b2e77a22c8`

## Executive Verdict

R3A conforms to PRD R3, Blueprint R3, the R2/R3 Storage Addendum and the roadmap.

The implemented domain stayed deliberately narrow:

- server-side Webmaster API import only;
- dry-run and explicit operator-triggered write command;
- host/verification/site summary/in-search sample/query capability only;
- dedicated storage tables;
- source sync state;
- URL normalization and diagnostics path;
- idempotency;
- safe errors/redaction;
- no scheduler, UI, read model, LLM, lead/intake or Content Core mutation.

Content Core remains the source of truth for published pages and route ownership. Webmaster rows are external search/indexation enrichment only.

## Scope Compliance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Server-side Webmaster importer exists | Pass | `scripts/yandex/import-webmaster-data.mjs`, `scripts/yandex/webmaster-import-lib.mjs` |
| Dry-run command writes nothing | Pass | `npm run yandex:webmaster-import:dry-run`, server dry-run `rows_imported=0` |
| Import command writes accepted rows | Pass | Server write import upserted `3` rows |
| Migration/table exists | Pass | `db/migrations/011_external_webmaster_import_foundation.sql` |
| Server-side token only | Pass | Uses `YANDEX_WEBMASTER_OAUTH_TOKEN` only in Node CLI/runtime |
| Host verified state checked | Pass | `check-webmaster` and R3A dry-run confirmed `VERIFIED` / `HTML_FILE` |
| Endpoint capabilities proven | Pass | host info, verification, summary, indexing samples, in-search samples, query analytics dry-run |
| Source state updated | Pass | `analytics_source_sync_state` has `source_system=yandex_webmaster`, `status=ok` |
| URL normalization | Pass | In-search URL normalized to `https://ecostroycontinent.ru/` |
| Unmapped diagnostics | Pass | Diagnostics path implemented; accepted run had no unmapped Webmaster URLs |
| Idempotent rerun | Pass | Row counts stayed `host=1 summary=1 url=1 query=0` |
| Safe error states | Pass | Tests and live too-fresh query date handling prove safe partial/failure paths |
| Query data remains aggregate | Pass | Dedicated aggregate table only; no joins to sessions/leads/contact journeys |
| Content Core not mutated | Pass | Import resolves routes only for metadata/diagnostics |
| No read model integration | Pass | Boundary scan found no `external_webmaster_*` references in read model/admin UI |
| No UI changes | Pass | No app/component UI files changed |
| No scheduled job | Pass | Only package scripts added |
| Internal telemetry still works | Pass | Server `/api/telemetry/events` smoke stored test event |

## Non-Goals Audit

| Non-goal | Status |
| --- | --- |
| Full R3B query/page visibility import | Not implemented |
| R3C important URLs/search event samples beyond checked R3A shape | Not implemented |
| R3D scheduled cadence | Not implemented |
| Read model integration | Not implemented |
| `/admin/visibility` UI changes | Not implemented |
| R2B/R2C Metrica imports | Not implemented |
| Google Search Console | Not implemented |
| Lead/intake | Not implemented |
| LLM | Not implemented |
| Visual heatmap | Not implemented |
| Direct UI -> Webmaster API | Not implemented |
| Browser-side Webmaster API | Not implemented |
| Content Core mutation from Webmaster data | Not implemented |
| User/session/lead attribution from query data | Not implemented |
| Fabricating unsupported API fields | Not implemented |
| Broad sweep of all Webmaster endpoints | Not implemented |
| Scheduler-first implementation | Not implemented |

## PRD R3 Conformity

Pass.

R3A gives the project a minimum external Webmaster enrichment foundation:

- host status and verification are imported as host snapshot;
- site/indexation summary is imported as indexation snapshot;
- in-search URL samples are imported with URL normalization and route resolution;
- query analytics capability is dry-run checked and can write rows when API returns suitable query/page/date records;
- source freshness is represented through `analytics_source_sync_state`.

The implementation does not claim user/session/lead attribution from Webmaster queries.

## Blueprint R3 Conformity

Pass.

Chosen architecture:

```text
Yandex Webmaster API
-> server-side operator command
-> endpoint capability check
-> normalized accepted records
-> dedicated external_webmaster_* storage
-> analytics_source_sync_state
-> later R4 read model integration
```

The importer is not a UI client and is not scheduled.

## Storage Addendum Conformity

Pass.

The addendum warned that `external_search_visibility_daily` is suitable only for genuine query/page/date visibility rows and not for host snapshots, indexation summaries or URL samples. R3A follows that boundary by adding dedicated tables:

- `external_webmaster_host_snapshot`
- `external_webmaster_indexation_snapshot`
- `external_webmaster_url_sample`
- `external_webmaster_query_visibility_daily`

`external_search_visibility_daily` was not reused or overloaded.

## API Capability Audit

Official docs supported the selected endpoints:

- host info returns host id, URLs, verified flag and host data status;
- verification info returns verification state/type;
- site summary returns SQI, searchable/excluded page counts and site problems;
- in-search samples returns URL samples, not a complete URL universe;
- query analytics is aggregate query/page reporting with date-window and rate-limit constraints.

Live API findings:

- host/verification/summary/in-search sample worked on canonical runtime;
- indexing samples endpoint returned no rows for this snapshot;
- query analytics returned no rows for the accepted period;
- query analytics rejected `2026-05-18` as too fresh on 2026-05-19, so acceptance used `2026-05-05..2026-05-17`.

No unsupported fields were fabricated.

## Security And Privacy Audit

Pass.

- OAuth token is server-only and was not printed.
- No Authorization headers or token-bearing request configs were logged.
- No browser/public config exposes Webmaster credentials.
- Raw responses are reduced to safe normalized records/metrics.
- No user/session identifiers, IP, raw user agent, form values, lead IDs or raw request dumps are stored.
- Query text is redacted for email/phone-like sensitive substrings before storage.

## Query Attribution Limitation

Pass.

R3A preserves the rule:

```text
Webmaster query/search data is aggregate page-level evidence only.
```

Forbidden joins were not added:

- no query -> session attribution;
- no query -> contact journey attribution;
- no query -> lead attribution;
- no query -> user-level identity.

## Content Core Boundary

Pass.

Imported URLs can resolve to route/entity metadata. Unmatched URLs become diagnostics. They do not create, publish, delete, redirect or mutate Content Core records.

The accepted in-search URL sample resolved to `/`, so no unmapped diagnostic row was required.

## Test Coverage Audit

Pass.

Targeted tests cover:

- missing host/token -> `not_configured`;
- dry-run writes nothing;
- verified host response;
- host-not-verified safe failure;
- selected endpoint unavailable -> partial/skipped;
- successful import writes accepted rows and source state;
- URL normalization;
- unmapped URL diagnostics;
- query analytics row normalization/upsert;
- idempotent rerun;
- safe redaction;
- no read model/UI/session/lead/content mutation wiring;
- migration dedicated table shape.

Full `npm test` passed with `546` tests.

## Acceptance Criteria

| Criterion | Status |
| --- | --- |
| Server-side Webmaster importer exists | Pass |
| Dry-run command exists and writes nothing | Pass |
| Import command writes accepted rows | Pass |
| Migration/table exists | Pass |
| Server-side token only | Pass |
| Host verified state checked | Pass |
| Endpoint capabilities proven | Pass |
| Source state updated for `yandex_webmaster` | Pass |
| URL data normalized | Pass |
| Unmapped diagnostics written when applicable | Pass |
| Same snapshot rerun idempotent | Pass |
| Safe error states implemented | Pass |
| Query data remains aggregate | Pass |
| Content Core not mutated | Pass |
| No read model integration | Pass |
| No UI changes | Pass |
| No scheduled job | Pass |
| Internal telemetry still works | Pass |
| Tests pass | Pass |
| Build passes | Pass |
| Migration applied on canonical SQL | Pass |
| Server dry-run/import acceptance passes | Pass |
| Implementation report created | Pass |
| Conformity audit created | Pass |
| Handoff/roadmap/start-here updated | In this closure commit |
| R3A closure decision documented | Pass |

## Deviations

No scope deviations.

Operational nuance:

- query analytics for `2026-05-18` was unavailable on 2026-05-19 because Yandex limited the accepted date window to `2026-05-04..2026-05-17`;
- the accepted import period was adjusted to `2026-05-05..2026-05-17`.

This is an API freshness limitation, not a product or implementation failure.

## Closure Decision

R3A can be closed.

Recommended next decision:

- start R4 read model integration if the team accepts source-state + minimal external rows as enough; or
- deepen R2/R3 with explicit follow-up slices before R4.
