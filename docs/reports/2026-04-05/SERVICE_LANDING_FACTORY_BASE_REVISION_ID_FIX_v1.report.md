# Service Landing Factory Base Revision ID Fix v1

## Summary Of The Bug

The live service landing generate route was generating a candidate/spec without preserving `baseRevisionId` in the request path.

The route did resolve the active published service revision, but it only passed the full `baseRevision` object into the source-context summary. The downstream candidate/spec builder defaulted a missing `baseRevisionId` to an empty string, so the generated candidate/spec lost revision identity fidelity.

## Actual Root Cause In Code

- `app/api/admin/entities/service/landing-factory/generate/route.js` resolved `aggregate?.activePublishedRevision`.
- The route called `requestServiceLandingCandidate(...)` without passing `baseRevisionId`.
- `lib/landing-factory/service.js` already supported `baseRevisionId`, but `requestServiceLandingCandidate(...)` fell back to `""` when the route omitted it.

## What Was Changed

- Wired `baseRevisionId` from the live generate route into the service candidate/spec request path.
- Preserved the published base revision id in the candidate/spec audit trail.
- Added route-level integration coverage proving the POST handler passes the right `baseRevisionId` and the resulting candidate/spec keeps it.
- Added a small route dependency seam for the POST handler so the real route can be tested directly without changing feature behavior.
- Adjusted a few Node import specifiers in the route/test dependency chain so the route module can be loaded in `node:test` without altering runtime semantics.

## Files Changed

- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `lib/admin/route-helpers.js`
- `lib/auth/session.js`
- `lib/content-core/repository.js`
- `lib/content-core/service.js`
- `lib/content-ops/audit.js`
- `tests/service-landing-factory.route.test.js`

## Checks Run

- `node --experimental-specifier-resolution=node --test tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- `npm test`
- `npm run build`

## Route Verification

Yes. The route now carries `baseRevisionId` into `requestServiceLandingCandidate(...)`, and the returned candidate/spec preserves it.

The route-level test asserts:

- the service generate POST path remains service-only
- the source revision id is `rev_base`
- `baseRevisionId` passed into generation is `rev_base`
- the candidate/spec audit details keep `baseRevisionId: "rev_base"`

## Docs Adjustment

No contract or PRD wording change was needed.

Only a narrow runtime/testability adjustment was made in the import chain so the real route handler could be exercised in Node tests.

## Commit Hash

- Code fix commit: `c212086`

## Push Status

- Completed after the final push for this delivery.

## Scope Confirmation

The fix stayed service-only.

No preview redesign, publish redesign, route-family expansion, or contract rewrite was introduced.
