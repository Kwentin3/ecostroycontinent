# R4 Readiness Audit: SEO Dashboard / Visibility / Analytics Foundation

Date: 2026-05-19
Branch: `feat/r3a-webmaster-import-foundation`
Audit commit at start: `d0e3221`
Runtime target for data checks: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`

## Executive Verdict

Full R4 is not ready as a useful operational read-model integration.

Current R2A/R3A data is enough for an honest source-state/readiness layer, but not enough for a rich SEO Manager evidence layer:

- Yandex Metrica import is technically healthy, but all imported traffic/goal values are external zeros for the accepted period.
- Yandex Webmaster import is technically healthy and useful for host/indexation proof, but query/page visibility rows are still absent.
- The current analytics read model already reads `analytics_source_sync_state`, so source status can be exposed honestly; detailed external metrics/evidence should stay constrained until deeper external imports exist.

Recommended next slice: **Option 4, R4-lite source-state/readiness integration**, if the team wants immediate read-model progress. It must be explicitly scoped as not-full-R4. If the team wants stronger SEO evidence before any read-model work, the next data slice should be **R3B query/page visibility import** before R2B.

## Documents Reviewed

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_DOMAIN_CLOSURE_DETAILED_REPORT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R1_METRICA_PUBLIC_ENABLEMENT_AND_FINAL_SMOKE_Экостройконтинент_v0.1.report.md`

## Code Areas Reviewed Read-Only

- `lib/analytics/read-model.js`
- `app/api/admin/visibility/read-model/route.js`
- `components/admin/SeoVisibilityDashboard.js`
- `lib/analytics/repository.js`
- `lib/analytics/constants.js`
- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `db/migrations/011_external_webmaster_import_foundation.sql`
- `scripts/yandex/import-metrica-aggregates.mjs`
- `scripts/yandex/import-webmaster-data.mjs`
- `scripts/yandex/metrica-import-lib.mjs`
- `scripts/yandex/webmaster-import-lib.mjs`

## Server/Data Checks

Checks were read-only SQL checks executed through `repo-app-1` against canonical SQL. No imports, migrations, UI changes or runtime changes were made.

### R2A Storage State

`external_metrica_daily_aggregate`:

| Check | Value |
| --- | --- |
| Rows | `42` |
| Date range | `2026-05-16..2026-05-18` |
| Imported at | `2026-05-19 11:41:10.633252+00` |
| Non-zero rows | `0` |
| Sum of all metric values | `0.0000` |
| Duplicate upsert groups | `0` |

By report/metric:

| report_type | metric_key | rows | non-zero rows | sum |
| --- | --- | ---: | ---: | ---: |
| `goal_reaches` | `goal_reaches` | `33` | `0` | `0.0000` |
| `traffic_total` | `pageviews` | `3` | `0` | `0.0000` |
| `traffic_total` | `users` | `3` | `0` | `0.0000` |
| `traffic_total` | `visits` | `3` | `0` | `0.0000` |

Goal rows:

- all 11 configured goals are present;
- each goal has 3 daily rows;
- every goal sum is `0.0000`;
- no goal has non-zero external reaches.

Metadata:

- `report_source=yandex_metrica_reporting_api` on all rows;
- zero-fill marker is not currently stored as `metadata.empty_response_zero_fill`; the accepted R2A report explains these are API empty/zero totals.

### Yandex Metrica Source State

`analytics_source_sync_state` for `yandex_metrica`:

| Field | Value |
| --- | --- |
| status | `ok` |
| last_attempted_at | `2026-05-19 11:41:10.633252+00` |
| last_successful_at | `2026-05-19 11:41:10.633252+00` |
| imported_period_start | `2026-05-16` |
| imported_period_end | `2026-05-18` |
| rows_imported | `42` |
| unmapped_url_count | `0` |
| safe_error_message | empty |

Freshness implication: technically fresh and successful for the selected R2A period, but informational usefulness is low because all imported values are zero.

### R3A Storage State

Webmaster external tables:

| Table | Rows |
| --- | ---: |
| `external_webmaster_host_snapshot` | `1` |
| `external_webmaster_indexation_snapshot` | `1` |
| `external_webmaster_url_sample` | `1` |
| `external_webmaster_query_visibility_daily` | `0` |
| `analytics_unmapped_url_diagnostic` for `yandex_webmaster` | `0` |

Host snapshot:

- host_id: `https:ecostroycontinent.ru:443`;
- verified: `true`;
- verification state/type: `VERIFIED` / `HTML_FILE`;
- host data status: `OK`;
- observed date: `2026-05-19`.

Indexation/site summary:

```json
{
  "sqi": 0,
  "searchable_pages_count": 1,
  "excluded_pages_count": 0,
  "site_problems": {
    "RECOMMENDATION": 3
  }
}
```

URL sample:

- endpoint: `in_search_samples`;
- normalized URL: `https://ecostroycontinent.ru/`;
- page_path: `/`;
- resolution status: `resolved`;
- entity type: `page`;
- observed date: `2026-05-19`.

Query visibility:

- rows: `0`;
- impressions: `0`;
- clicks: `0`;
- no min/max query visibility dates.

Duplicates:

- host duplicate groups: `0`;
- indexation duplicate groups: `0`;
- URL duplicate groups: `0`;
- query duplicate groups: `0`.

### Yandex Webmaster Source State

`analytics_source_sync_state` for `yandex_webmaster`:

| Field | Value |
| --- | --- |
| status | `ok` |
| last_attempted_at | `2026-05-19 18:07:40.192036+00` |
| last_successful_at | `2026-05-19 18:07:40.192036+00` |
| imported_period_start | `2026-05-05` |
| imported_period_end | `2026-05-17` |
| rows_imported | `3` |
| unmapped_url_count | `0` |
| safe_error_message | empty |

Freshness implication: technically fresh for host/indexation/sample import. It is not proof of query/page visibility coverage.

### Existing Read Model State

Read-only code review shows:

- `lib/analytics/read-model.js` already consumes `analytics_source_sync_state` via `listSourceSyncStates`;
- it still reads traffic from `analytics_page_daily`;
- it still reads search visibility from `external_search_visibility_daily`;
- it does not read `external_metrica_daily_aggregate`;
- it does not read the new `external_webmaster_*` tables;
- `/admin/visibility` uses the read-model endpoint, not live Yandex APIs.

Additional canonical SQL context:

- `analytics_page_daily`: `3` rows, date `2026-05-04`, `7` visits, `0` contact actions;
- `external_search_visibility_daily`: `0` rows;
- all unmapped diagnostics: none.

## Usefulness Assessment

### R2A: Metrica

Can read model show `yandex_metrica` source health as `ok`?

Yes. The source state is truthful: API access, import, storage and idempotency work.

Can read model show imported period/freshness?

Yes. Period `2026-05-16..2026-05-18`, rows `42`, last success timestamp and empty safe error are useful operational metadata.

Should read model show visits/pageviews/users as normal metrics?

Not as normal dashboard traffic evidence. It may show them only under an external-source diagnostic label such as:

```text
Metrica imported successfully; no external Metrica activity observed for accepted period.
```

Risk: showing `0 visits` in primary traffic cards can mislead the SEO Manager because internal telemetry has separate operational truth and R2A zeros are external Metrica aggregate results, not proof of no site activity.

Should read model show goal reaches?

Only as external Metrica mirror status with a limitation. The values are useful for detecting Metrica/API visibility, not for operational conversion decisions.

Required limitations:

- Metrica is external enrichment, not operational truth;
- all R2A values are zero for the accepted period;
- zero external goals are not zero internal user actions;
- no source/device/region/landing dimensions exist yet;
- no scheduled cadence exists yet.

### R3A: Webmaster

Can read model show `yandex_webmaster` source health as `ok`?

Yes. The source state is truthful for host/indexation/sample import.

Can read model show host verified/indexation summary?

Yes. This is the most useful current R3A output:

- host verified;
- `host_data_status=OK`;
- `searchable_pages_count=1`;
- `excluded_pages_count=0`;
- `site_problems.RECOMMENDATION=3`.

Can read model show in-search URL sample?

Yes, as low-volume external evidence: Yandex has `/` as an in-search sample and the URL mapped to Content Core route `/`. It must be labeled as a sample, not complete coverage.

If query visibility rows are `0`, what should read model show?

It should show a clear empty/unavailable state:

```text
Webmaster query visibility imported successfully but returned no query/page rows for the accepted period.
```

It should not show `0 impressions` as a confident SEO conclusion, and should not generate low-CTR recommendations from absent query rows.

Is R3B needed before full R4?

For a useful SEO visibility dashboard, yes. Full R4 needs actual query/page/date visibility rows, or at least a repeated dry-run across a valid historical window proving whether such rows are available for this site.

## Strategy Verdict

| Option | Verdict |
| --- | --- |
| Option 1. Start full R4 now | Not recommended. Current data is too thin for meaningful traffic/source/search evidence. |
| Option 2. Do R2B first | Reasonable if the priority is traffic/source/device/landing insight, but current Metrica totals are all zero, so R2B may still produce little value until Metrica accumulates data. |
| Option 3. Do R3B first | Strong candidate if the priority is SEO visibility evidence. R3A proves host/indexation, but query/page rows are the largest missing piece. |
| Option 4. Do small R4-lite | Recommended next slice. It can honestly integrate source health, periods, row counts, host/indexation summary and limitations without pretending that full R4 evidence exists. |

## R4 Readiness Matrix

| Item | Status | Evidence | R4 usefulness | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `yandex_metrica` source state | Ready | `status=ok`, period `2026-05-16..18`, rows `42` | Good for source health/freshness | Low | Include in R4-lite |
| Metrica traffic totals | Technically present, weak | visits/pageviews/users rows exist, all sums `0` | Low | Misread as no traffic | Show only as external no-observed-activity diagnostic |
| Metrica goal reaches | Technically present, weak | 11 goals x 3 days, all sums `0` | Low | Misread as no contact intent | Show only as external mirror diagnostic |
| Metrica non-zero data | Not present | non-zero rows `0` | None for trend/recommendations | High if used for decisions | Do not drive recommendations |
| `yandex_webmaster` source state | Ready | `status=ok`, rows `3` | Good for source health/freshness | Low | Include in R4-lite |
| Webmaster host verified | Ready | `VERIFIED` / `HTML_FILE`, `host_data_status=OK` | Useful | Low | Include in R4-lite |
| Webmaster indexation summary | Ready | searchable `1`, excluded `0`, recommendations `3` | Useful as site-level evidence | Medium if overgeneralized | Include with scope label |
| Webmaster in-search URL samples | Partial | one sample `/`, resolved | Useful as sample evidence | Sample mistaken for full coverage | Label as sample only |
| Webmaster query visibility rows | Not present | rows `0` | None for CTR/query opportunity | High if treated as zero demand | Need R3B before full R4 search visibility |
| Unmapped URL diagnostics | Clean for R3A | `0` yandex_webmaster diagnostics | Useful as health signal | Low | Include count only |
| Analytics read model integration risk | Medium | current read model reads source states but not new aggregate tables | Manageable with R4-lite | Full R4 may overstate weak data | Keep R4-lite strict |
| UI usefulness risk | Medium/high for full R4 | external metrics are zero/thin | Source health useful, metrics weak | SEO Manager may see empty dashboard | Avoid full metric cards |
| SEO Manager value | Limited but real | source state + Webmaster host/indexation | Good for readiness, weak for action queue | Overclaiming | R4-lite now; R3B next for evidence |

## Recommended Next Slice

Recommended next implementation slice:

```text
R4-lite: External Source State and Readiness Integration
```

This is not full R4.

Suggested scope:

- expose `yandex_metrica` and `yandex_webmaster` source states from `analytics_source_sync_state`;
- expose imported periods, rows imported, last success, safe errors and unmapped counts;
- expose Metrica limitation: imported successfully, but external traffic/goals are all zero for accepted period;
- expose Webmaster host/indexation summary and one in-search URL sample as site-level/sample evidence;
- show query visibility as `no_rows_for_period` / `not_enough_data`, not as `0 demand`;
- keep external imported data labeled as enrichment, not operational truth;
- do not generate recommendations from zero Metrica values or absent Webmaster query rows.

Acceptance criteria for R4-lite:

1. Read model reports Yandex source state/freshness truthfully.
2. Read model includes clear limitations for zero/empty external data.
3. Read model does not use Metrica zeros as primary traffic/conversion truth.
4. Read model does not generate CTR/query recommendations from absent query rows.
5. UI still does not call Yandex APIs directly.
6. No LLM, lead/intake, scheduler or UI redesign.
7. No secrets or raw external API responses are exposed.

Recommended follow-up after R4-lite:

```text
R3B. Webmaster query/page visibility import
```

Reason: for SEO Manager value, search visibility/query/page evidence is more important than broader Metrica dimensions while Metrica totals remain all zero.

## What Not To Do Now

- Do not start full R4 metric/evidence integration from the current thin data.
- Do not wire Metrica zero rows into primary traffic cards as operational truth.
- Do not infer zero user actions from zero Metrica goals.
- Do not generate low CTR / query opportunity recommendations from empty Webmaster query rows.
- Do not treat the in-search URL sample as full Yandex index coverage.
- Do not schedule imports as part of R4-lite.
- Do not call Yandex APIs from UI/read model request path.
- Do not mutate Content Core based on Webmaster URL samples.
- Do not join Webmaster query data to sessions, contact journeys or leads.

## Roadmap / Handoff Update Recommendation

No immediate roadmap/handoff edit is required for this audit-only task.

If the team accepts the recommendation, add a small optional sub-slice to the roadmap before implementation:

```text
R4A / R4-lite. External Source State and Readiness Integration
```

Then keep full R4 as the later integration of useful external aggregates/evidence after R3B and/or R2B produces stronger data.

## Risks And Gaps

- Current external data can easily be overinterpreted.
- Metrica external zero values conflict with known internal telemetry existence if shown without labels.
- Webmaster query analytics may require wider/older valid periods or different query analytics shapes.
- Current read model has source-state plumbing but not source-specific limitations for imported zero/empty external tables.
- SEO Manager action value remains low until query/page visibility or real traffic source dimensions exist.

## Security / Scope Checks

- Runtime code was not changed.
- Migrations were not created.
- UI/read model were not changed.
- No scheduled jobs were added.
- No imports were run; only read-only SQL checks were executed.
- No tokens, client secrets, refresh tokens or Authorization headers were printed or written.
- Local Windows DB was not used as production evidence.

## Git Status

At the beginning of the audit:

```text
## feat/r3a-webmaster-import-foundation...origin/feat/r3a-webmaster-import-foundation
```

Expected final diff for this task: this report only.
