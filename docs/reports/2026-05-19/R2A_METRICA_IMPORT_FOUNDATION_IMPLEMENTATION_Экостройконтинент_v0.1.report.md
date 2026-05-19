# R2A Metrica Import Foundation Implementation Report

Дата: 2026-05-19
Branch: `feat/r2a-metrica-import-foundation`
Implementation commit: `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`
Runtime target: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`, canonical env `/opt/ecostroycontinent/runtime/.env`

## Executive Verdict

R2A is implemented and accepted on canonical runtime.

The domain now has a server-only, operator-triggered Yandex Metrica aggregate importer:

- dry-run command validates env, counter, goals and Reporting API reports without DB writes;
- write command imports minimal daily traffic/goals into project-owned storage;
- `analytics_source_sync_state` is updated for `source_system = yandex_metrica`;
- same-period rerun is idempotent;
- internal telemetry remains the operational source of truth.

R2B/R2C, scheduled imports, read model integration, `/admin/visibility` UI changes, R3/Webmaster, LLM and lead/intake were not implemented.

## Files Changed

- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `scripts/yandex/import-metrica-aggregates.mjs`
- `scripts/yandex/metrica-import-lib.mjs`
- `tests/yandex-metrica-import-r2a.test.js`
- `package.json`
- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

## Storage

New table: `external_metrica_daily_aggregate`.

Unique upsert key:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

R2A fields include:

- `source_system = yandex_metrica`;
- `date`;
- `period_grain = day`;
- `report_type = traffic_total | goal_reaches`;
- `dimension_hash` and safe `dimensions`;
- `metric_key = visits | pageviews | users | goal_reaches`;
- `metric_value`;
- `goal_id` / `goal_name`;
- `imported_at`;
- `import_run_id`;
- safe `metadata`.

No raw sessions, tokens, authorization headers, form values, IP, user agent, Webvisor/clickmap/session replay data or user-level identifiers are stored.

## Commands Added

```bash
npm run yandex:metrica-import:dry-run
npm run yandex:metrica-import:r2a
```

Both commands accept optional bounded dates:

```bash
npm run yandex:metrica-import:dry-run -- --date1=2026-05-16 --date2=2026-05-18
npm run yandex:metrica-import:r2a -- --date1=2026-05-16 --date2=2026-05-18
```

Default period is the last three completed Europe/Moscow dates.

## API Plan

Official API basis:

- Yandex Metrica Stat API table endpoint: `https://yandex.com/dev/metrika/en/stat/openapi/data`
- Yandex dimensions/metrics reference: `https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all`

R2A selected reports:

- traffic by `ym:s:date` with `ym:s:visits`, `ym:s:pageviews`, `ym:s:users`;
- goal reaches by `ym:s:date` with `ym:s:goal<goalId>reaches` for all 11 configured project goals.

Confirmed goal metrics used in runtime dry-run/import:

- `ym:s:goal556869891reaches` -> `click_to_call`
- `ym:s:goal556869892reaches` -> `click_to_telegram`
- `ym:s:goal556869893reaches` -> `click_to_whatsapp`
- `ym:s:goal556869894reaches` -> `form_start`
- `ym:s:goal556869895reaches` -> `form_submit`
- `ym:s:goal556869896reaches` -> `cta_click`
- `ym:s:goal556869897reaches` -> `contact_link_click`
- `ym:s:goal556869898reaches` -> `gallery_open`
- `ym:s:goal556869899reaches` -> `faq_expand`
- `ym:s:goal556869900reaches` -> `case_card_click`
- `ym:s:goal556869901reaches` -> `service_link_click`

## Zero-Row Handling

The first server acceptance revealed that Reporting API returned `api_rows=0`, `total_rows=0`, and zero totals for the selected completed period. R2A was adjusted conservatively:

- if API rows are empty and all API totals are explicitly zero, importer writes zero-valued daily rows for the selected dates and metrics;
- metadata records `zero_filled_from_empty_api_rows=true` and `zero_fill_reason=api_totals_zero`;
- nonzero totals are never distributed across dates.

This preserves aggregate storage proof without claiming internal telemetry has zero user actions.

## Local Verification

Shell: Windows PowerShell in local repo.

Commands:

```bash
node --experimental-specifier-resolution=node --test tests/yandex-metrica-import-r2a.test.js
npm test
npm run build
git diff --check
```

Results:

- targeted R2A tests: 11 pass;
- full test suite: 535 pass;
- Next production build: pass;
- `git diff --check`: pass, with only expected CRLF warnings from Git on Windows.

## Build And Deploy

Build-and-publish workflow:

- final run: `26094575156`;
- branch: `feat/r2a-metrica-import-foundation`;
- image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f21d1229d96fbbda9a89a43f4048ee839ae7454accca9a55f1c8b2a26299aec5`.

Deploy workflow:

- final run: `26094722406`;
- commit marker in runtime: `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`;
- readiness: `database.status=ok`;
- migration `010_external_metrica_daily_aggregate.sql` applied through existing deploy migration path.

## Server Acceptance

Runtime env proof, without printing tokens:

```json
{
  "YANDEX_METRICA_COUNTER_ID": "109037342",
  "YANDEX_METRICA_OAUTH_TOKEN": "present",
  "YANDEX_WEBMASTER_OAUTH_TOKEN": "present"
}
```

Selected server acceptance period:

```text
2026-05-16..2026-05-18
```

Reason: short completed period after R1 public counter enablement; avoids today-only Reporting API lag.

Dry-run:

- status: `ok`;
- writes: none;
- traffic metrics selected: `visits`, `pageviews`, `users`;
- goal metrics selected: all 11 configured goals;
- API rows: `0`;
- API totals: all zero;
- rows prepared: `42`;
- no unavailable metrics/goals;
- no safe error.

Write import:

- status: `ok`;
- rows prepared: `42`;
- rows imported/upserted: `42`;
- sync state written: yes.

DB proof after import:

```text
external_metrica_daily_aggregate rows for 2026-05-16..2026-05-18: 42
```

Grouped proof:

```text
2026-05-16: visits=1 row, pageviews=1 row, users=1 row, goal_reaches=11 rows
2026-05-17: visits=1 row, pageviews=1 row, users=1 row, goal_reaches=11 rows
2026-05-18: visits=1 row, pageviews=1 row, users=1 row, goal_reaches=11 rows
```

All imported metric values were `0.0000`, matching Yandex Reporting API zero totals for the period.

Source sync state:

```text
source_system=yandex_metrica
status=ok
imported_period_start=2026-05-16
imported_period_end=2026-05-18
rows_imported=42
unmapped_url_count=0
safe_error_message=''
```

Idempotency:

```text
rows_before=42
rows_after=42
```

Same date range rerun did not create duplicate aggregate rows.

## Internal Telemetry Smoke

Canonical runtime POST to `/api/telemetry/events`:

```json
{
  "ok": true,
  "stored": true,
  "event_name": "page_viewed",
  "journey_created": false
}
```

DB proof:

```text
event_name=page_viewed
is_test=true
is_internal=false
page_path=/
```

This smoke proves the internal telemetry path still works. It is not used as Metrica evidence and does not make Metrica the operational source of truth.

## Security Checks

Passed:

- server-only token used; no browser/client Yandex API path added;
- no token/client secret/refresh token printed in local or server command output;
- no secrets added to reports;
- no read model/UI integration added;
- no scheduled job added;
- no writes to `analytics_event` or `telemetry_events` from the Metrica importer;
- no direct public tracker -> `/api/analytics/events`;
- no direct UI -> Yandex API;
- no Webvisor/clickmap/session replay/ecommerce import.

## Known Limitations

- R2A imports only minimal daily traffic/goals.
- Traffic sources, devices, regions, landing URLs, high-cardinality dimensions and reconciliation with internal telemetry remain R2B/R2C or later.
- Yandex Reporting API currently returns zero rows/totals for the selected period; this is accepted as external aggregate state, not internal telemetry truth.
- Read model integration remains R4.

## Closure

R2A can be considered closed.

Recommended next slice:

```text
R3A. Webmaster Host / Indexation / Query Visibility Dry Run
```

## Git Status

At report authoring time, the remaining local changes are the R2A reports and minimal handoff/roadmap/Yandex docs updates. They are intended to be committed as the closure/docs commit after this report is written. No runtime code remains uncommitted.
