# AI Workspace Test Program v1

## Summary
Implemented a minimum-sufficient automated test program for the AI-assisted service landing workspace and the current refactor seams.

The program now locks down:
- session-scoped Memory Card read/write behavior
- accepted-delta-only mutation semantics at the workflow boundary
- pure prompt packet assembly with safe action-slice extension
- service-only generate-route wiring
- structured-output candidate bundle coherence across the LLM boundary
- verification-blocked no-mutation behavior in the generate route

## Test Tiers Implemented

### Tier 1 - Pure unit tests
- `assemblePromptPacket(...)` keeps one base packet shape.
- Action-specific slices are stripped to a safe `id/title/content` extension only.
- `readMemoryCardSlice(...)` returns only the Memory Card contract shape and strips raw provider/chat payloads.
- `applyAcceptedMemoryDelta(...)` persists accepted state and survives a reread from the same session row.
- `requestServiceLandingCandidate(...)` preserves `baseRevisionId` through the structured-output boundary and returns a coherent candidate bundle.

### Tier 2 - Boundary / route tests
- Service-only route guard still rejects non-service entities before generation.
- Service generate route still carries the published base revision id into candidate/spec generation.
- Verification-blocked generate flow stops before review submission and before Memory Card mutation.

### Tier 3 - Integration-style application tests
- Memory Card persistence happy path now includes a reread after write through the same session-backed row.
- Candidate/spec, verification, and review-facing state remain aligned enough to avoid obvious drift in the current flow.

### Tier 4 - Regression / hygiene
- Existing service landing factory tests remain green.
- Existing LLM infra tests relevant to the workspace seam remain green.
- Full repo `npm test` and `npm run build` passed.

## Files Added / Changed

- `tests/ai-workspace.test.js`
- `tests/service-landing-factory.test.js`
- `tests/service-landing-factory.route.test.js`
- `docs/reports/AI_WORKSPACE_TEST_PROGRAM_V1.report.md`

## Seams Now Covered

- direct LLM -> Memory Card write is not possible through the tested workspace flow
- rejected / blocked workflow paths do not mutate Memory Card
- prompt packet does not include raw chat history or provider payloads
- one base prompt packet shape is stable
- action slices extend the base packet instead of replacing it
- `baseRevisionId` survives the full generate path and the direct service candidate path
- service-only guard remains intact
- workspace memory persistence survives a normal reread after write
- candidate/spec and verification review state remain coherent in the tested path
- publish handoff still does not read raw LLM output as truth

## Remaining Partial Coverage

- Live authenticated browser/operator proof of the admin workspace surface
- Direct visual verification of `ServiceLandingWorkspacePanel` rendering in the admin shell
- Full end-to-end proof of the review page in a real browser session
- Session cleanup / retention behavior for expired workspace rows

## Intentionally Not Tested

- Browser E2E harness was not added.
- No broad UI test stack was introduced because the repo does not already carry a cheap, stable browser harness for this path.
- No snapshot-heavy assertions were added.
- No provider integration lab or performance benchmark was introduced.

## Commands Run

- `node --experimental-specifier-resolution=node --test tests/ai-workspace.test.js tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- `npm test`
- `npm run build`

## Result

All targeted tests passed, the full repo test suite passed, and the production build succeeded.

Code checkpoint commit:
- `81212d9` - `test: harden ai workspace seams`

Push status:
- completed after the test commit and report commit

## Next Smallest Useful Test Addition

- Add a very narrow authenticated browser smoke check for the deployed admin service editor surface once a stable login/session path is available.
