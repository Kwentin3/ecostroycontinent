# Landing-First Runtime Contract Alignment Execution v1

Date: 2026-04-08
Scope: runtime contract alignment only for the landing-first workspace

## Grounding Summary

- The primary seam was in `lib/landing-workspace/landing.js`: the runtime still centered a legacy Page-shaped section/payload model even though the current contract pack defines a landing-first composition model.
- The compatibility bridge was real and necessary for the current Page save/render path, but it was visually too close to the semantic owner path.
- The session flow in `lib/landing-workspace/session.js` anchored the current session to `pageId`, but it did not guard strongly against another active session already being anchored to the same page.
- The landing workspace UI, route, and review surface still exposed legacy/service-first naming strongly enough to mislead a future agent.
- Coverage existed in `tests/landing-workspace.test.js` and `tests/landing-workspace.route.test.js`, but it still asserted the older flat payload and weaker session behavior.

## Contract Seams Aligned

### 1. Runtime Registry / Model Alignment

- Added `LANDING_WORKSPACE_COMPOSITION_FAMILY = "landing"` as the explicit canonical family.
- Added a closed canonical runtime registry:
  - `LANDING_WORKSPACE_BLOCK_REGISTRY`
  - `LANDING_WORKSPACE_SHELL_REGION_REGISTRY`
- Added canonical landing draft schema and JSON schema:
  - `landingWorkspaceDraftSchema`
  - `landingWorkspaceDraftResponseJsonSchema`
- Kept the old Page-shaped registry/schema only as explicit legacy compatibility projection with sticky comments marking it secondary.
- Updated runtime projection helpers so the main path now normalizes to the landing draft first, and only then projects to Page compatibility when needed.

### 2. Payload / Spec Shape Alignment

- `projectLandingWorkspaceCandidatePayload(...)` now treats the landing draft shape as the primary runtime payload.
- `buildLandingWorkspaceCandidateSpec(...)` now exposes:
  - `draft` as the canonical landing-first runtime shape
  - `payload` as explicit compatibility projection for current Page save/render
  - `blocks` as the canonical block list
  - `sections` as a temporary compatibility alias
  - `shellRegions` as distinct fixed shell data
- `buildLandingWorkspaceDerivedArtifactSlice(...)` now carries:
  - `compositionFamily`
  - `draft`
  - `pagePayload`
  - `blocks`
  - `sections`
  - `shellRegions`
- `pageId` remains the owner anchor in the spec/run path.
- `landingDraftId` remains an internal revision handle, not owner truth.

### 3. Session Uniqueness Guard

- Added `findConflictingLandingWorkspaceSession(...)` in `lib/landing-workspace/session.js`.
- Added `LANDING_WORKSPACE_SESSION_GUARD_CONFLICT = "blocked_by_active_page_session"`.
- `readLandingWorkspaceSession(...)` now:
  - keeps an already-anchored current session stable
  - checks for another active session already anchored to the same `pageId`
  - returns a conflict guard instead of silently re-anchoring when a conflict exists
- The landing workspace route now stops generation early on that conflict.
- The landing workspace screen now disables editing and shows an operator-facing conflict message when the guard trips.

### 4. Legacy Substrate Fencing

- The review route now aliases `ServiceLandingFactoryPanel` as a legacy compatibility surface instead of presenting it as the canonical landing-first panel.
- `components/admin/ServiceLandingFactoryPanel.js` now carries a sticky comment clarifying it is legacy review compatibility only.
- Landing verification now prefers `blocks` plus `shellRegions`, reducing the visual weight of legacy `sections`.

## Compatibility Layer That Remains

- The Page save/render/publish path still requires compatibility projection to the current Page-shaped payload.
- `payload` in landing workspace spec/derived slices remains that compatibility Page shape.
- `sections` remains as a compatibility alias for the current UI/review path, but it now points at canonical `blocks`.
- Legacy field names such as `serviceIds`, `caseIds`, `galleryIds`, and `primaryMediaAssetId` still survive only inside the projection layer that feeds the existing Page runtime.

## Session Uniqueness Improvement

- Before this change, the flow could casually create another active session anchored to the same `pageId`.
- After this change, the runtime checks active sessions before re-anchoring and blocks generation when another active session already owns that page.
- This is a practical guard, not a hard distributed lock. The remaining limitation is a race window between the conflict read and the anchor write.

## Tests Added / Updated

- Updated landing workspace runtime tests to assert:
  - canonical landing draft request shape
  - canonical `compositionFamily`
  - compatibility payload only at the Page edge
  - `blocks` and `shellRegions` behavior
  - stronger session anchor behavior
  - explicit active-session conflict handling
- Updated landing workspace route tests to assert:
  - canonical `sourcePayload`
  - `pageId` ownership anchoring
  - `landingDraftId` as revision handle only
  - shell/media proof selection behavior
  - route abort on active-session conflict

## Validation

- `npm test` passed.
- `npm run build` passed.
- Build warning observed:
  - existing Next.js NFT warning rooted at `next.config.mjs` / `lib/config.js` / `app/api/media/[entityId]/route.js`
  - unrelated to this landing-first alignment change

## Git / Push / Rollout

- Git commit(s): recorded in terminal closeout for this alignment run.
- Push status: completed in terminal closeout.
- Rollout status:
  - no DB migration required
  - no new publish workflow introduced
  - build/test validation completed locally
  - deploy execution was not performed from this workspace; rollout is ready under the existing application deploy process

## Known Remaining Risks

- Session uniqueness is stronger in reality, but not globally serialized under concurrent race conditions.
- Compatibility projection to the Page-shaped payload still exists because Page remains the owner truth for publishable landing results.
- Legacy naming still exists in some compatibility surfaces by design, but it is now fenced more explicitly.
