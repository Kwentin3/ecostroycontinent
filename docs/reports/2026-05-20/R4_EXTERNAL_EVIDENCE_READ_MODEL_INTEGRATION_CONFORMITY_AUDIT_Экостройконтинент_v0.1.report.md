# R4 External Evidence Read Model Integration Conformity Audit

Дата: 2026-05-20
Проект: Экостройконтинент
Ветка: `feat/r4-external-evidence-read-model`
Runtime / implementation commit: `e3f9749f409258f8ebbfdd7b8de2101e07ede9d3`

## Executive Verdict

R4 conforms and can be closed in the bounded evidence/read model scope.

The implementation connects accepted external aggregate storage to analytics read model as `external_evidence`. It preserves R4-lite readiness, keeps first-party telemetry as operational truth, keeps Content Core as page truth, avoids recommendations, avoids live Yandex API calls, and avoids UI redesign.

## Scope Audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Expose external evidence block | Pass | Root `external_evidence` exists in server read model. |
| Preserve R4-lite readiness | Pass | `external_source_readiness` remains present and server accepted. |
| Metrica R2B evidence | Pass | traffic/source detail/device/country/region/landing rows represented compactly. |
| Webmaster R3A/R3B evidence | Pass | host/indexation, URL sample and query zero-row state represented. |
| Content Core mapping read-only | Pass | landing rows expose stored route/entity mapping only; no mutations. |
| Compact DTO | Pass | top-N rows and totals only; no raw metadata dumps. |
| Source-specific limitations | Pass | Metrica external truth/sample limitations; Webmaster zero-query limitations. |
| Minimal UI rendering | Pass | compact `/admin/visibility` block only. |
| Tests/build/deploy | Pass | targeted tests, `npm test`, build, GHCR deploy and server acceptance passed. |

## Roadmap Conformity

R4 stayed inside the roadmap phase "Read Model With Real External Aggregates":

- consumed project-owned R2B/R3A/R3B storage;
- exposed truthful source freshness and limitations;
- did not introduce R5 recommendation refinement;
- did not introduce scheduler work;
- did not introduce LLM or lead/intake.

R4 should now be marked implemented/closed. Follow-up candidates remain R5, R2C/R3C and UX refinement.

## Read Model Contract Conformity

Pass.

- Contract was updated additively with `external_evidence`.
- Existing root fields were not removed.
- Primary `overview` metrics remain first-party/internal.
- Read model remains generated from normalized storage, not from live external API calls.
- Forbidden-key scan on server response returned zero unsafe keys.

## R4-lite Conformity

Pass.

- `external_source_readiness` remains intact.
- Metrica and Webmaster readiness still expose freshness/actionability/limitations.
- R4 adds evidence beside readiness; it does not replace readiness semantics.

## R2B Conformity

Pass.

- R4 reads accepted `external_metrica_daily_aggregate` rows.
- R4 keeps Metrica visits/users/pageviews as external enrichment only.
- R4 does not feed Metrica values into primary overview.
- R4 does not create combined BI reports or high-cardinality exploration.
- Landing unmapped state remains diagnostic-only.

## R3A/R3B Conformity

Pass.

- R4 reads accepted Webmaster host/indexation/URL sample/query visibility storage.
- R3B zero query rows are represented as limitation, not zero demand.
- R4 does not generate low CTR or query opportunity rules from absent query rows.
- R4 does not treat Webmaster as Content Core truth.

## Recommendation Guardrails

Pass.

- No recommendation logic was added for Metrica source/device/region/landing values.
- Existing recommendation generation no longer uses external `yandex_metrica` unmapped diagnostics as recommendation source.
- Server response had no external limitation terms in recommendation payload.
- Existing deterministic Content Core/readiness recommendations remain in place.

## UI Boundary

Pass.

- UI consumes read model only.
- No browser-side Yandex API calls were added.
- No full redesign, BI filters, charts or cubes were added.
- Source limitations remain visible.

## Security And Privacy

Pass.

- No secrets/tokens/Authorization headers exposed.
- No raw Yandex responses exposed.
- No raw sessions/logs/IP/user-agent/form values exposed in `external_evidence`.
- No external imports are stored in `analytics_event`.
- Server grep of deployed read-model/repository files found no live Yandex API call patterns.

## Server Acceptance Summary

Pass.

- Runtime commit: `e3f9749f409258f8ebbfdd7b8de2101e07ede9d3`.
- Runtime DB readiness: `ok`.
- `/api/admin/visibility/read-model?period=28`: `ok: true`.
- `/admin/visibility?period=28`: HTTP `200`.
- Telemetry smoke: `/api/telemetry/events` HTTP `202`.
- Metrica evidence: source/device/country/region/landing present; `/` and `/contacts` landing paths present.
- Webmaster evidence: host/indexation and URL sample present; query zero-row limitation present.

## Residual Risks

- Metrica sample size is low; actionability remains limited.
- Webmaster query visibility rows are still absent for accepted R3B period.
- Future R5 rules must require sample-size and source-quality guards.

## Closure Decision

R4 is closed as external evidence/read model integration.

R4 is not R5, not scheduler work, not a BI warehouse, and not a new source of operational truth.
