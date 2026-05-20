# R2B Metrica Traffic Source / Device / Region / Landing Conformity Audit

Date: 2026-05-20  
Branch: `feat/r2b-metrica-traffic-dimensions`  
Implementation commit: `1cec46216e996ae27d2393b3a7fcc3e67ef0eae7`

## Verdict

The local R2B implementation conforms to PRD R2B, Blueprint R2B, PRD/Blueprint R2, the R2/R3 Storage Addendum, the roadmap, handoff constraints and R4-lite boundaries for the code paths that could be verified locally.

Production closure is not final at report creation time because canonical server dry-run/write acceptance has not yet been executed. The correct closure state is: implementation ready, local tests/build passed, server acceptance pending.

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

Conforms locally.

- Token use is server-side only.
- Error handling redacts sensitive fields.
- Tests assert no token leakage for mocked invalid/rate-limit/API failure paths.
- No Authorization headers, OAuth tokens, raw sessions, IP addresses, user identifiers, user-agent history or form values are stored.

Canonical server logs still need acceptance review after dry-run/write.

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

## Acceptance Gap

The following items remain pending because they require canonical server runtime access with the production Metrica token:

- real R2B dry-run against counter `109037342`
- real R2B write import
- SQL proof for rows by `report_type`
- SQL proof for `analytics_source_sync_state`
- SQL proof for unmapped diagnostics where applicable
- canonical idempotent rerun
- canonical no-secret-output review
- internal telemetry and R4-lite smoke after deploy

## Closure Decision

R2B can be considered locally implementation-complete and conformant. It should be marked production-closed only after canonical server dry-run/write/import/idempotency proof passes and this audit is updated with the actual server evidence.
