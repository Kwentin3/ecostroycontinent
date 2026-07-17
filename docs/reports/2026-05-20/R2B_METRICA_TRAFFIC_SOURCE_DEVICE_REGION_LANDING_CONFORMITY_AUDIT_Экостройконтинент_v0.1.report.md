# R2B Metrica Traffic Source / Device / Region / Landing Conformity Audit

Date: 2026-05-20  
Branch: `feat/r2b-metrica-traffic-dimensions`  
Implementation commit: `1cec46216e996ae27d2393b3a7fcc3e67ef0eae7`
Deployed runtime commit: `d008b4bb5dc3ebf9d075b83194fba422f42181f3`

## Verdict

R2B conforms to PRD R2B, Blueprint R2B, PRD/Blueprint R2, the R2/R3 Storage Addendum, the roadmap, handoff constraints and R4-lite boundaries.

Production closure is accepted on the canonical Selectel runtime. The accepted period `2026-05-17..2026-05-19` produced `30` R2B aggregate rows, source state `ok`, zero unmapped landing diagnostics and a stable same-period idempotent rerun.

## Scope Audit

R2B stayed inside scope:

- Server-side Metrica importer exists.
- Dry-run mode exists and writes nothing.
- Write mode imports selected bounded aggregate reports.
- Required reports are source, device, country and landing.
- Optional reports are source detail and region.
- Report plan avoids cross-product dimensions.
- URL normalization and read-only Content Core mapping are implemented for landing rows.
- Unmapped URLs are diagnostics only.
- Source sync state is updated for `yandex_metrica`.
- Rerun idempotency uses the existing aggregate upsert path.

R2B did not expand into non-goals:

- No scheduled job.
- No full R4 read model integration.
- No `/admin/visibility` change.
- No recommendation rules.
- No LLM.
- No lead/intake scope.
- No raw sessions/logs/Webvisor/clickmap/ecommerce.
- No browser-side Yandex Reporting API calls.
- No imported rows in `analytics_event`.

## BI-Combiner Risk

Avoided.

The importer defines separate bounded reports and does not combine source, device, region and landing dimensions into a single high-cardinality report. Goals remain in R2A by default and are not multiplied across R2B dimensions.

## Report Plan Audit

Conforms.

Required plans:

- `traffic_source`: `ym:s:date`, `ym:s:lastsignTrafficSource`
- `device`: `ym:s:date`, `ym:s:deviceCategory`
- `country`: `ym:s:date`, `ym:s:regionCountry`
- `landing_url`: `ym:s:date`, `ym:s:startURLPath`

Optional plans:

- `source_detail`: adds `ym:s:lastsignSourceEngine`
- `region`: adds `ym:s:regionArea`

No city report is included. No arbitrary dimension explorer is included.

## Storage Audit

Conforms.

The migration extends `external_metrica_daily_aggregate` rather than creating a separate BI warehouse. It preserves R2A report types and existing row semantics, then adds nullable landing mapping columns and useful indexes.

Expected row semantics are preserved:

- `source_system = yandex_metrica`
- `period_grain = day`
- safe `dimensions` and `metadata` JSON
- metric rows for `visits`, `users` where supported and `pageviews`
- `goal_id` and `goal_name` empty for non-goal R2B rows

## Internal Telemetry Boundary

Conforms.

Internal first-party telemetry remains operational source of truth. The R2B importer is external aggregate enrichment only. It does not write to `analytics_event`, does not alter contact intent or lead attribution, and does not mutate Content Core entities or revisions.

## Read Model and UI Boundary

Conforms.

No read model integration and no UI integration were added. R4-lite source readiness remains the only existing read-model/UI external source surface. Full R4 remains future scope.

## Security Audit

Conforms.

- Token use is server-side only.
- Error handling redacts sensitive fields.
- Tests assert no token leakage for mocked invalid/rate-limit/API failure paths.
- No Authorization headers, OAuth tokens, raw sessions, IP addresses, user identifiers, user-agent history or form values are stored.
- Canonical dry-run/write output contained no secrets or Authorization headers.

## Error and Limitation Handling

Conforms.

Implemented handling includes:

- missing token/counter as `not_configured`
- invalid dimensions/metrics as safe API failures
- rate-limit/API errors without secret leakage
- users metric retry fallback
- high-cardinality guard with required/optional status behavior
- valid empty/zero reports without fabricated nonzero rows

## Test Audit

Local checks passed:

- Targeted tests: `34/34`
- Full `npm test`: `569/569`
- `npm run build`: passed

Tests cover missing env, dry-run writes nothing, normalized report rows, optional skip, landing normalization/mapping, unmapped diagnostics, idempotent rerun, cardinality guard, users fallback, partial failure, invalid/rate-limit safe handling and token redaction.

## Acceptance Evidence

Passed on canonical runtime:

- Build workflow `26145890987`: success.
- Deploy workflow `26145991372`: success.
- Pinned image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:a015c93dba5ab59a079f0d69a33c15c41f5d6c23000997de321e2dd87b59a602`.
- Runtime readiness commit: `d008b4bb5dc3ebf9d075b83194fba422f42181f3`.
- R2B dry-run against counter `109037342`: `ok`, rows prepared `30`, writes `0`.
- R2B write import: `ok`, rows imported `30`.
- Same-period write rerun: `ok`, SQL row count remained `30`.
- Required reports completed: `traffic_source`, `device`, `country`, `landing_url`.
- Optional reports completed safely: `source_detail`, `region`.
- Source sync state: `yandex_metrica|ok|2026-05-17|2026-05-19|30|0`.
- Open unmapped Metrica diagnostics: `0`.
- R2B rows in `analytics_event`: `0`.
- Internal telemetry smoke: `POST /api/telemetry/events` returned `202` and stored a test `page_viewed` event.
- R4-lite source readiness still builds and returns Metrica/Webmaster `ok/fresh` without adding full R4 semantics.
- Read-only launch smoke: `28` passed, `0` failed, `1` optional media check skipped.

## Closure Decision

R2B is production-closed as a bounded external aggregate enrichment slice.

Closure does not approve full R4, scheduled R2C imports, recommendations, lead attribution, LLM or UI/read-model expansion. Those remain separate future slices.
