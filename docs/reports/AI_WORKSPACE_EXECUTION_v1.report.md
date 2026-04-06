# AI_WORKSPACE_EXECUTION_v1

## 1. Summary
Implemented the service-only AI-assisted workspace for `/services/[slug]` on top of the accepted layered architecture plan.

The delivered runtime now has:
- a minimal session-scoped Memory Card stored server-side on `app_sessions`
- a narrow `readMemoryCardSlice(...)` boundary
- a pure `assemblePromptPacket(...)` boundary
- a structured-output request path through the existing LLM baseline
- accepted-delta-only mutation semantics for Memory Card
- a service editor workspace surface that shows the current working state
- a single derived artifact slice used by candidate/spec, verification, preview, and review handoff

The feature was built, tested, pushed, deployed through the phase-1 workflow, and health-checked successfully.

## 2. What Was Implemented

- Added `lib/ai-workspace/memory-card.js` with:
  - session-scoped workspace slice normalization
  - `readMemoryCardSlice(...)`
  - `applyAcceptedMemoryDelta(...)`
  - accepted-delta-only persistence into `app_sessions.workspace_memory_card`
- Added `lib/ai-workspace/prompt.js` with a pure `assemblePromptPacket(...)` boundary.
- Updated `lib/landing-factory/service.js` to:
  - build the service candidate request from the assembled prompt packet
  - route the candidate generation path through the existing structured-output LLM facade
  - preserve `baseRevisionId` in the candidate/spec envelope
  - expose the service workspace memory delta adapter
- Updated `app/api/admin/entities/service/landing-factory/generate/route.js` to:
  - read the current workspace Memory Card slice
  - pass the current `baseRevisionId` into candidate/spec generation
  - persist accepted workspace delta after review handoff
  - keep the route service-only
- Updated `lib/admin/entity-ui.js`, `components/admin/EntityEditorForm.js`, and the service editor pages to surface the workspace panel in the admin UI.
- Added `components/admin/ServiceLandingWorkspacePanel.js` to show the operator-facing Memory Card state.
- Added the `app_sessions.workspace_memory_card` persistence columns via `db/migrations/002_workspace_memory_card.sql`.
- Added focused tests for:
  - Memory Card read/write behavior
  - prompt packet assembly shape
  - service landing request/spec wiring
  - service-only route behavior

## 3. Changed Files

- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `lib/ai-workspace/memory-card.js`
- `lib/ai-workspace/prompt.js`
- `lib/landing-factory/service.js`
- `lib/admin/entity-ui.js`
- `lib/auth/session.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/entities/[entityType]/new/page.js`
- `db/migrations/002_workspace_memory_card.sql`
- `tests/ai-workspace.test.js`
- `tests/service-landing-factory.test.js`
- `tests/service-landing-factory.route.test.js`

## 4. Minimal Persistence Mechanism

Chosen mechanism:
- a narrow DB-backed session row in `app_sessions.workspace_memory_card` with `workspace_memory_card_updated_at`

Why this was chosen:
- it is the smallest runtime mechanism that survives refresh and route transitions
- it stays session-scoped
- it avoids introducing a long-term memory platform
- it fits the current repo/runtime reality without new infra

What it is not:
- not a long-term user memory store
- not a vector or retrieval layer
- not a separate memory service
- not a hidden publish state

## 5. Tests and Checks Run

Targeted tests:
- `node --experimental-specifier-resolution=node --test tests/ai-workspace.test.js tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`

Repository test/build checks:
- `npm test`
- `npm run build`

GitHub Actions rollout checks:
- build-and-publish workflow run `24039325894`
- deploy-phase1 workflow run `24039385218`

## 6. Git Commits

- Implementation commit: `749052a0015b58e65c850c3f10df9c35371296ea`

## 7. Push Status

- Implementation commit pushed to `origin/main`: yes
- The deployment image was published to GHCR from the pushed commit: yes

## 8. Rollout Status

Completed successfully.

Evidence:
- build-and-publish run `24039325894` succeeded
- GHCR image published with digest `ghcr.io/kwentin3/ecostroycontinent-app@sha256:269089b42aa356604ffa954dd6c9c0dfc75a22d2152441e07d0cc3875aac9ecf`
- deploy-phase1 run `24039385218` succeeded
- phase-1 deploy health probe through Traefik passed

## 9. Known Remaining Risks

- Live browser verification of the new workspace panel was not run in this session.
- The deploy workflows still emit a Node 20 deprecation warning for GitHub Actions dependencies.
- The Memory Card storage model is intentionally minimal and does not attempt full reopen/resurrect semantics.

## 10. Explicit Deferred Items

- No long-term memory platform
- No vector retrieval or org memory graph
- No route-family expansion
- No page-builder redesign
- No full memory rehydration subsystem
- No public AI chat surface
