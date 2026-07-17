# R4-lite External Source Readiness Conformity Audit

Дата: 2026-05-19

Проект: Экостройконтинент

Домен: SEO Dashboard / Visibility / Analytics Foundation

Slice: R4-lite. External Source State and Readiness Integration

## Executive Verdict

R4-lite conforms to PRD, Blueprint, R4 Readiness Audit, roadmap and handoff.

The implementation stays inside the source-state/readiness scope. It does not become full R4, does not connect live Yandex API calls to the read model request path, does not treat Metrica/Webmaster as operational truth, and does not generate recommendations from thin external data.

R4-lite can be closed.

## Audit Inputs

Reviewed implementation against:

- `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- code commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`

## Scope Compliance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Read model exposes external source readiness | Pass | `external_source_readiness` top-level DTO block exists. |
| Yandex Metrica readiness shown from project storage/source state | Pass | `yandex_metrica` block uses `analytics_source_sync_state` plus compact `external_metrica_daily_aggregate` summary. |
| Yandex Webmaster readiness shown from project storage/source state | Pass | `yandex_webmaster` block uses `analytics_source_sync_state` plus compact `external_webmaster_*` summaries. |
| Imported periods, rows, last success and safe errors exposed | Pass | DTO includes state fields for both sources. |
| Metrica all-zero limitation present | Pass | `external_metrica_all_values_zero` emitted on canonical data. |
| Webmaster query-empty limitation present | Pass | `webmaster_query_visibility_no_rows_for_period` emitted on canonical data. |
| Webmaster host/indexation summary exposed | Pass | Host verified, `host_data_status`, searchable/excluded counts and site problem counts are present. |
| No live Yandex API calls in read model request path | Pass | Tests and deployed code scan found no external Yandex API URLs or `fetch` in `read-model.js`/`repository.js`. |
| UI consumes read model only | Pass | UI renders DTO fields; no Yandex API calls added. |
| No secrets/raw external responses exposed | Pass | DTO key scan passed; repository helpers return compact summaries only. |
| No scheduled imports added | Pass | No scheduler/runtime job changes. |
| No new imports run by R4-lite | Pass | Server acceptance read existing R2A/R3A storage only. |
| No full R4 evidence/recommendation layer added | Pass | No external evidence/recommendation rules added. |
| No LLM or lead/intake work | Pass | No LLM/lead code touched. |

## Non-Goals Not Violated

| Non-goal | Result |
| --- | --- |
| Full R4 | Not implemented. |
| R2B traffic source/device/region/landing imports | Not implemented. |
| R3B query/page visibility deep import | Not implemented. |
| Scheduled jobs | Not added. |
| New Yandex API calls | Not added. |
| Direct UI -> Yandex API | Not added. |
| Broad `/admin/visibility` redesign | Not done. |
| Recommendations from Metrica zeros | Not added. |
| Low CTR/query opportunity recommendations from absent query rows | Not added. |
| Content Core mutation from Webmaster data | Not added. |
| Lead/intake attribution | Not touched. |
| LLM | Not touched. |

## Source-of-Truth Boundaries

Pass.

R4-lite preserves the project strategy:

- internal first-party telemetry remains operational truth for behavior/contact actions;
- Metrica is external readiness/enrichment only;
- Webmaster is external search/indexation readiness/enrichment only;
- Content Core remains truth for published pages and route ownership.

Metrica zeros are reported with limitations and `data_actionability=readiness_only`.

Webmaster URL samples are reported as samples, not full coverage.

Absent Webmaster query rows do not become a demand/CTR conclusion.

## Primary Metrics Safety

Pass.

Canonical read model acceptance:

- primary overview visits: `7`;
- visit explanation: `Визиты из first-party aggregates.`;
- Metrica imported values: all zero;
- Metrica zeros did not overwrite primary overview visits/contact metrics.

## Recommendation Safety

Pass.

Canonical read model acceptance:

- recommendations did not include `external_metrica_all_values_zero`;
- no R4-lite recommendation generation was added;
- absent query rows remained a limitation, not a low CTR/query opportunity recommendation.

## Freshness Semantics

Pass.

Implemented defaults:

- Metrica fresh if `last_successful_at <= 48h` and imported period end is not older than `3` completed days.
- Webmaster fresh if `last_successful_at <= 7 days`.

Canonical result:

- `yandex_metrica.freshness.status=fresh`;
- `yandex_webmaster.freshness.status=fresh`.

These thresholds are implementation defaults and can be refined later.

## Security / Privacy

Pass.

Checks:

- no OAuth tokens in DTO;
- no client secret in DTO;
- no refresh token in DTO;
- no Authorization headers;
- no raw request/response dumps;
- no raw events;
- no form values;
- no IP/user agent fields;
- no external API calls in read model path.

## Tests / Build

Pass.

- `npm test`: passed, `550/550`.
- `npm run build`: passed.
- `git diff --check`: passed.
- Server acceptance passed on canonical runtime.

## Acceptance Criteria Matrix

| Criterion | Status |
| --- | --- |
| `external_source_readiness` exists | Pass |
| Metrica readiness shown | Pass |
| Webmaster readiness shown | Pass |
| Imported periods/rows/last success/errors exposed | Pass |
| Metrica all-zero limitation present | Pass |
| Webmaster query-empty limitation present | Pass |
| Webmaster host/indexation summary exposed | Pass |
| Metrica zeros do not feed primary traffic/contact metrics | Pass |
| Webmaster query absence does not generate CTR/query recommendations | Pass |
| No Yandex API calls in read model request path | Pass |
| UI consumes read model only | Pass |
| No secrets/raw responses exposed | Pass |
| No scheduled imports | Pass |
| No new imports run | Pass |
| No full R4 evidence/recommendation layer | Pass |
| No LLM or lead/intake | Pass |
| Tests/build pass | Pass |
| Server acceptance passes | Pass |
| Reports created | Pass |
| Handoff/roadmap/start-here updated | Pass |

## Deviations

None requiring product approval.

One acceptance smoke attempt used unsupported telemetry metadata and was correctly rejected by validation. The smoke was rerun with a valid minimal test `page_viewed` payload and returned `202`; storage proof confirmed one test row. This did not affect implementation scope.

## Closure Decision

R4-lite is closed.

Next recommended slice:

R3B query/page visibility import, unless the team chooses R2B Metrica source/device/region/landing dimensions first.

Do not start full R4 until external evidence is richer than the current R2A/R3A readiness layer.
