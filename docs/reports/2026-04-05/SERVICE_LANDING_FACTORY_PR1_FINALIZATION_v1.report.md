# SERVICE_LANDING_FACTORY_PR1_FINALIZATION_v1.report

## 1. Scope Of Finalization Task

This task finalized PR #1 for the service-first landing factory `baseRevisionId` fix, merged it into `main`, and performed a short post-merge sanity check.

I only rechecked the narrow diff for the `baseRevisionId` mismatch and the adjacent testability/import-specifier changes. I did not reopen a broad audit.

## 2. What Was Checked Before Merge

- `baseRevisionId` is sourced from the active published service revision in `app/api/admin/entities/service/landing-factory/generate/route.js`.
- The route forwards `baseRevisionId` into `requestServiceLandingCandidate(...)`.
- `lib/landing-factory/service.js` preserves `baseRevisionId` in the resulting candidate/spec.
- `tests/service-landing-factory.route.test.js` proves the route-level wiring with `rev_base` and keeps the service-only guard intact.
- The import-specifier/testability patch was checked for scope and appeared runtime-neutral.

## 3. Merge Decision

MERGED.

The PR diff matched the already verified narrow fix, with no material scope drift or regression risk visible in the checked path.

## 4. What Was Merged

- Commit `c212086`: the `baseRevisionId` route wiring and route-level test.
- Commit `374f498`: the report artifacts that accompanied the fix.
- PR #1 merged into `main` with merge commit `01af173dd67b745ec4e8077a8a2173e3378ff0e3`.

## 5. Sanity Checks Run

- `node --experimental-specifier-resolution=node --test tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- `npm test`
- `npm run build`
- `gh pr view 1 --json state,isDraft,mergedAt,mergeCommit,mergeStateStatus,url`

## 6. Result

- `baseRevisionId` fix is now in `main`.
- The merged code still passes the route-level test.
- The broader test suite passed.
- The build passed.
- The service-only route guard remains intact.
- No obvious regression was introduced by the import-specifier patch.

## 7. Any Residual Tiny Risks

- The route handler still uses the existing draft-before-verification flow, so a blocked generation can leave a draft behind. That is pre-existing and not introduced by this PR.
- The route-level test is boundary-mocked, so it proves the wiring and identity preservation but not the full external DB/LLM execution chain.

## 8. Next Smallest Safe Step

No immediate follow-up is required for the merged fix.

If a tiny hardening step is desired later, add a direct unit test around `requestServiceLandingCandidate(...)` with a stubbed structured-output transport to cover one layer below the route.
