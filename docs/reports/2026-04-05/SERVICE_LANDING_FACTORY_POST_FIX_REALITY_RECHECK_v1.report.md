# SERVICE_LANDING_FACTORY_POST_FIX_REALITY_RECHECK_v1.report

## 1. Audit Scope

This is a narrow post-fix reality re-check after the `baseRevisionId` fix for the service-first landing factory.

I inspected the current generate route, the service landing factory module, the new route-level test, the touched helper modules, the two fix commits (`c212086` and `374f498`), and PR `#1`.

I only looked at the same service landing generate path and the adjacent testability/import-specifier changes. I did not broaden this into other route families or unrelated product areas.

## 2. Fix Claims Checked

| Claim | Status | Evidence |
|---|---|---|
| The live generate route now resolves `baseRevisionId` from the active published service revision. | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:100-116` |
| The route forwards `baseRevisionId` into candidate/spec generation. | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:111-116`, `lib/landing-factory/service.js:500-534` |
| The candidate/spec now stores a non-empty `baseRevisionId`. | FULLY VERIFIED | `lib/landing-factory/service.js:272-290`, `tests/service-landing-factory.route.test.js:174-181` |
| The route remains service-only. | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:86-93`, `tests/service-landing-factory.route.test.js:186-225` |
| The import-specifier/testability patch is runtime-neutral. | NO MATERIAL ISSUE FOUND | `lib/admin/route-helpers.js`, `lib/auth/session.js`, `lib/content-core/repository.js`, `lib/content-core/service.js`, `lib/content-ops/audit.js`; `npm test`; `npm run build` |

## 3. What Is Fully Verified

- The old mismatch is gone in code.
- `baseRevisionId` is now computed from `aggregate?.activePublishedRevision?.id` and passed to `requestServiceLandingCandidate(...)`.
- `requestServiceLandingCandidate(...)` still writes `input.baseRevisionId ?? ""` into the candidate spec, so the route-provided value reaches the spec unchanged.
- The spec builder already accepted `baseRevisionId`; the fix now feeds it real data instead of an empty string.
- The handler still rejects non-service entities before generation.
- No new route families were introduced.

## 4. What Is Partially Verified

- The new route-level test is a real POST-handler test, but it is boundary-mocked. It proves handler wiring and the service-only guard, not the full DB/LLM/persistence chain.
- The test uses `buildServiceLandingCandidateSpec(...)` inside the stubbed `requestServiceLandingCandidate(...)`. That proves the route passes the right id and that the spec builder preserves it, but it is not an end-to-end execution of the production candidate generation call.
- The import-specifier cleanup was verified by local test/build success, but it touched more modules than the narrow business fix itself.

## 5. Any Remaining Drift Or Fragile Seams

- The POST handler now accepts an `overrides = {}` seam for testability. That is additive and not used by Next runtime, but it is a small extra surface that should stay confined to tests.
- The generate flow still saves the draft before verification. That is pre-existing behavior, but it means a blocked generation can leave a draft artifact behind.
- The same code path still relies on the existing assumption that published revisions are the canonical base for service candidate generation.
- I did not see new contract drift introduced by the fix.

## 6. Whether The Previous `baseRevisionId` Mismatch Is Now Closed

Yes. The mismatch is closed in the current code:

- the source revision id is read from the active published revision
- it is forwarded into `requestServiceLandingCandidate(...)`
- the resulting candidate/spec stores the same value
- the route-level test confirms the runtime path with `rev_base`

## 7. Whether The New Route-Level Test Is Sufficient

For the narrow bug, yes. It is sufficient to prove the route-level wiring and the candidate/spec identity preservation.

For a full end-to-end claim, it is only partially sufficient because the downstream services are stubbed. It does not independently execute the real LLM transport, DB save, readiness, and submit workflow.

## 8. Nearby Observations Worth Noting

- The import-specifier patch was broader than the business change: it touched auth/core helper modules so the route could load under `node:test`.
- That patch appears behavior-neutral: the build succeeded and the full test suite passed.
- PR `#1` is open, draft, and mergeable, and it reflects the two commits `c212086` and `374f498`.
- I did not find any new service/page route-family drift.

## 9. Overall Verdict

| Area | Status |
|---|---|
| BaseRevisionId wiring | FULLY VERIFIED |
| Candidate/spec identity preservation | FULLY VERIFIED |
| Route-level proof quality | PARTIALLY VERIFIED |
| Runtime-neutrality of the import patch | NO MATERIAL ISSUE FOUND |
| Nearby drift introduced by the fix | NO MATERIAL ISSUE FOUND |

Overall verdict: the concrete `baseRevisionId` contract mismatch is fixed and the service-only boundary remains intact. The remaining uncertainty is limited to the test's boundary-mocked nature, not to the correctness of the wiring itself.

## 10. Next Smallest Safe Follow-up Step

No immediate follow-up is required for the fix itself.

If you want one small hardening step, add a direct unit test on `requestServiceLandingCandidate(...)` with a stubbed structured-output transport so the `baseRevisionId` propagation is covered one layer below the route without adding more route test indirection.
