# R2A Metrica Import Foundation Conformity Audit

Дата: 2026-05-19
Branch: `feat/r2a-metrica-import-foundation`
Audited implementation commit: `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`

## Executive Verdict

R2A conforms to the PRD, Blueprint, Storage Addendum and roadmap constraints.

R2A is closed with server acceptance on the canonical Selectel runtime. It remains deliberately narrow:

- server-side Metrica aggregate import only;
- dry-run and explicit operator-triggered write command;
- minimal daily traffic/goals only;
- source sync state;
- idempotency;
- safe errors/redaction;
- no scheduler, UI, read model, R3, LLM or lead/intake work.

Internal first-party telemetry remains the operational source of truth. Yandex Metrica imported rows are external aggregate enrichment only.

## Scope Compliance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Server-side Metrica importer exists | Pass | `scripts/yandex/import-metrica-aggregates.mjs`, `scripts/yandex/metrica-import-lib.mjs` |
| Dry-run command writes nothing | Pass | `npm run yandex:metrica-import:dry-run`; server dry-run `sync_state_written=false`, `rows_imported=0` |
| Write command imports minimal aggregate rows | Pass | Server import wrote/upserted `42` rows |
| Storage table/migration exists | Pass | `db/migrations/010_external_metrica_daily_aggregate.sql` |
| Server-only token | Pass | Uses `YANDEX_METRICA_OAUTH_TOKEN` only in Node CLI/runtime; no browser config |
| Goal reaches for 11 goals | Pass | All 11 configured goal metrics selected and stored as daily zero-valued aggregate rows for API zero totals |
| `analytics_source_sync_state` updated | Pass | `yandex_metrica`, `status=ok`, period `2026-05-16..2026-05-18`, `rows_imported=42` |
| Idempotent rerun | Pass | Server proof `rows_before=42`, `rows_after=42` |
| Safe errors | Pass | Tests cover invalid metric/dimension, rate limit and token-like redaction |
| No read model integration | Pass | Boundary scan and tests confirm no `external_metrica_daily_aggregate` use in read model/UI |
| No scheduled job | Pass | Only package scripts added; no cron/workflow/scheduler |
| Internal telemetry still works | Pass | Server `/api/telemetry/events` smoke returned `202` and stored `is_test=true` event |

## Non-Goals Audit

| Non-goal | Status |
| --- | --- |
| Full R2B traffic source/device/region/landing import | Not implemented |
| High-cardinality dimensions | Not implemented |
| Scheduled cadence | Not implemented |
| Read model integration | Not implemented |
| `/admin/visibility` UI changes | Not implemented |
| Webmaster R3 imports | Not implemented |
| Google imports | Not implemented |
| Reconciliation with internal telemetry | Not implemented |
| Lead/intake | Not implemented |
| LLM | Not implemented |
| Raw Metrica Logs API/raw sessions | Not implemented |
| Webvisor/clickmap/session replay import | Not implemented |
| Direct UI -> Metrica API | Not implemented |
| Browser-side Yandex API calls | Not implemented |
| Storing imported rows in `analytics_event` | Not implemented |
| Treating Metrica as operational truth | Not implemented |

## Storage Addendum Conformity

Pass.

R2A uses a dedicated external aggregate table rather than forcing Metrica rows into `analytics_page_daily`.

Chosen table:

```text
external_metrica_daily_aggregate
```

Chosen upsert key:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

Minor implementation detail:

- `goal_id` and `goal_name` are stored as empty strings for non-goal rows instead of nullable values.
- Reason: deterministic unique key behavior for PostgreSQL upserts.
- This does not change product semantics; non-goal rows remain distinguishable by `report_type=traffic_total`.

## API Capability And Runtime Result

R2A uses Yandex Metrica Reporting API table reports with:

- `ym:s:date`;
- `ym:s:visits`;
- `ym:s:pageviews`;
- `ym:s:users`;
- `ym:s:goal<goalId>reaches`.

Server dry-run/import status: `ok`.

For the accepted period `2026-05-16..2026-05-18`, Yandex Reporting API returned:

- traffic `api_rows=0`, `total_rows=0`, totals `0`;
- goal reaches `api_rows=0`, `total_rows=0`, totals `0` for all 11 goals.

Implementation stores explicit zero-valued daily rows only when API rows are empty and all API totals are zero. It does not distribute nonzero totals and does not infer internal telemetry counts from Metrica.

## Security Audit

Pass.

Checks:

- no OAuth token/client secret/refresh token printed;
- no token-bearing raw request/response dumps;
- no secrets in docs/reports;
- no server-only env exposed to browser;
- no UI/read model Yandex API calls;
- no form values, raw user identifiers, IP, user agent, sessions, Webvisor/clickmap/session replay imported;
- `unmapped_url_count=0` because URL dimensions are out of R2A scope.

## Test Coverage

Local checks:

```bash
node --experimental-specifier-resolution=node --test tests/yandex-metrica-import-r2a.test.js
npm test
npm run build
git diff --check
```

Results:

- targeted tests: 11 pass;
- full test suite: 535 pass;
- production build: pass;
- diff check: pass with expected CRLF warnings only.

Important covered scenarios:

- missing env -> `not_configured`, no fetch/DB writes;
- dry-run writes nothing;
- write import persists aggregate rows and source state;
- same-period rerun is idempotent;
- users metric fallback;
- combined goal metrics fallback to per-goal checks;
- rate limit/error redaction;
- empty API rows + zero totals create explicit zero-valued daily rows;
- migration/table contract excludes raw/user-level fields;
- importer does not write to internal analytics/telemetry events or read model.

## Server Acceptance

Canonical runtime:

- Selectel VM;
- `repo-app-1` + `repo-sql-1`;
- canonical env: `/opt/ecostroycontinent/runtime/.env`;
- runtime commit: `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`;
- pinned image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f21d1229d96fbbda9a89a43f4048ee839ae7454accca9a55f1c8b2a26299aec5`;
- readiness: database `ok`.

Acceptance proof:

- dry-run status `ok`;
- write status `ok`;
- aggregate rows: `42`;
- source sync state: `yandex_metrica`, `ok`, rows imported `42`;
- idempotency: `rows_before=42`, `rows_after=42`;
- telemetry smoke: `202`, `stored=true`, `event_name=page_viewed`;
- boundary scans: no read model/UI coupling to imported table, no public tracker call to `/api/analytics/events`.

## Deviations

No scope-expanding deviations.

Implementation clarification:

- Zero-valued daily rows are written when Yandex API explicitly returns empty rows and zero totals. This was necessary because the live counter currently has no external Reporting API rows for the accepted period, while R2A acceptance requires project-owned aggregate rows. The rows are marked through safe metadata and remain external aggregate enrichment only.

## Audit Refresh

Дата refresh: 2026-05-19
Branch: `feat/r2a-metrica-import-foundation`
Head before refresh: `4998b38`

После отдельного запроса на аудит выполнения второго implementation-домена проведена повторная сверка R2A с PRD, Blueprint and Storage Addendum.

Fresh checks:

```text
node --experimental-specifier-resolution=node --test tests/yandex-metrica-import-r2a.test.js tests/telemetry-no-direct-adapters.test.js
result: 15 pass, 0 fail

npm test
result: 535 pass, 0 fail
```

Additional boundary scans confirmed:

- no `external_metrica_daily_aggregate` use in `app`, `components` or `lib` runtime/read-model surfaces;
- no scheduled import wiring beyond explicit package scripts;
- no direct public tracker call to `/api/analytics/events`;
- no browser/UI direct Yandex API calls added by R2A.

Refresh verdict:

```text
No blocker found.
R2A still conforms to PRD/Blueprint/Addendum.
Closure decision remains valid.
```

## Closure Decision

R2A can be closed.

Next safe implementation slice:

```text
R3A. Webmaster Host / Indexation / Query Visibility Dry Run
```

Do not start R4 read model integration until imported rows and source states from at least one external source are intentionally selected for read model consumption.

## Git Status

The original conformity audit was committed in the R2A closure docs commit.

Before this audit refresh, the branch was clean at:

```text
4998b38 docs: add r2a detailed closure report
```

This refresh is docs-only and does not change runtime behavior.
