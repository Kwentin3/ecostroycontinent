# AI_WORKSPACE_REFACTOR_EXECUTION_v1

## Summary
I refactored the AI-assisted service landing workspace to reduce architectural drift and fragile seams without expanding scope.

The refactor kept the existing v1 behavior intact and made the run-artifact flow clearer:
- one canonical run-slice helper now represents the current service landing attempt,
- audit details and Memory Card projections derive from that slice,
- the duplicate prompt helper path was removed,
- the service-only route and accepted-delta-only memory write path stayed intact.

## What was refactored

- Added `buildServiceLandingDerivedArtifactSlice(...)` in `lib/landing-factory/service.js`.
- Removed the dead-code-adjacent `buildServiceLandingCandidatePrompt(...)` helper.
- Updated the service generate route to build a draft derived artifact slice once, then extend it after verification for Memory Card writes.
- Updated `components/admin/ServiceLandingFactoryPanel.js` to read the derived run slice instead of a separate `candidateSpec` projection, with a legacy fallback for older audit records.
- Updated route-level and unit tests to assert the new slice shape and accepted-delta behavior.

## Changed files

- `lib/landing-factory/service.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `tests/service-landing-factory.route.test.js`
- `tests/service-landing-factory.test.js`
- `docs/reports/AI_WORKSPACE_REALITY_AUDIT_v1.report.md` (historical audit artifact kept with the refactor wave)

## What duplication was removed

- The separate `buildServiceLandingCandidatePrompt(...)` helper is gone.
- The route no longer serializes a top-level `candidateSpec` snapshot into audit details.
- The audit/report panel now reads one `derivedArtifactSlice` projection instead of a parallel candidate snapshot.

## How artifact flow was tightened

- The generate route now creates a draft run slice from `candidateResult.spec` and reuses that shape for audit details.
- After verification and review handoff, the same run-slice shape is extended with verification metadata and written to Memory Card as the accepted delta.
- The service report panel reads the derived run slice directly, which reduces the chance of a second competing artifact shape emerging later.
- The prompt assembler remained pure, and the existing LLM facade remained the only workspace-facing LLM boundary.

## Tests and checks run

- `node --experimental-specifier-resolution=node --test tests/ai-workspace.test.js tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- `npm test`
- `npm run build`

## Git and rollout

- Code commit: `297f9a4` - `refactor: tighten ai workspace run slice`
- Push status: pushed to `origin/main`
- Build workflow: `build-and-publish` run `24040978533` succeeded
- Deploy workflow: `deploy-phase1` run `24041037184` succeeded with pinned image ref `ghcr.io/kwentin3/ecostroycontinent-app@sha256:15a9fcfe585a08e359cd893e2d97b5d77c2f9871dd525e7533abdbe61014d36f`

## Remaining known risks

- I did not run an authenticated browser walkthrough of the deployed admin service workspace in this session.
- The review page still renders preview from the revision payload, which is a clear canonical projection but not the same literal object as the run slice.
- Session-row Memory Card cleanup for expired sessions was not separately verified.
- The service panel keeps a fallback to the legacy `candidateSpec` shape so older records remain readable.

