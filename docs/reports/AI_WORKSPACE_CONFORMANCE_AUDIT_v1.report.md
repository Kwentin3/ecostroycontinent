# AI_WORKSPACE_CONFORMANCE_AUDIT_v1

## 1. Audit Scope

Post-implementation conformance check for the AI-assisted service landing workspace against:
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- the service landing and LLM infra contracts

Scope remained strictly service-only for `/services/[slug]`.

## 2. Verification Matrix

| Layer / contract | Status | Evidence |
|---|---|---|
| Service-only workspace boundary | FULLY IMPLEMENTED | `app/api/admin/entities/service/landing-factory/generate/route.js`, `components/admin/ServiceLandingWorkspacePanel.js`, service editor pages, service-only guard test |
| Memory Card session-scoped storage | FULLY IMPLEMENTED | `lib/ai-workspace/memory-card.js`, `db/migrations/002_workspace_memory_card.sql` |
| Accepted-delta-only write semantics | FULLY IMPLEMENTED | `applyAcceptedMemoryDelta(...)` and route-level accepted delta path |
| One narrow Memory Card read boundary | FULLY IMPLEMENTED | `readMemoryCardSlice(...)` |
| One pure prompt packet assembler | FULLY IMPLEMENTED | `assemblePromptPacket(...)` in `lib/ai-workspace/prompt.js` |
| One base packet shape with action-specific slices | FULLY IMPLEMENTED | prompt packet tests and service candidate request tests |
| Structured-output LLM boundary usage | FULLY IMPLEMENTED | `lib/landing-factory/service.js` calls the existing `requestStructuredArtifact(...)` facade path |
| Candidate/spec fidelity with `baseRevisionId` | FULLY IMPLEMENTED | route passes `baseRevisionId`; candidate/spec preserves it; route test asserts it |
| Singular derived artifact slice | FULLY IMPLEMENTED | `artifactState.derivedArtifactSlice` plus review/verification/preview visibility |
| UI workspace surface | FULLY IMPLEMENTED | `EntityEditorForm`, `ServiceLandingWorkspacePanel`, admin page loaders |
| Review/publish handoff isolation | FULLY IMPLEMENTED | route still submits through existing review workflow; publish remains separate |
| Full memory reopen/resurrect subsystem | INTENTIONALLY DEFERRED | Only a minimal session store was implemented; no long-term memory platform was added |
| Live browser walkthrough of the new workspace UI in this session | PARTIALLY VERIFIED | Deploy health probe succeeded, but no browser session was run during this turn |

## 3. What Is Fully Implemented

- The service candidate generation path now reads the current Memory Card slice and passes the current `baseRevisionId` into the candidate/spec envelope.
- The candidate/spec path preserves `baseRevisionId` and keeps the service-only route family constraints.
- The workspace UI now has an operator-facing Memory Card panel on the service editor surface.
- The prompt packet assembler is pure and separated from the LLM boundary.
- The existing structured-output LLM baseline remains the provider/transport boundary; no provider leakage reached UI or workflow code.
- Verification, preview, and review/publish handoff all read the same derived artifact slice.

## 4. What Is Partially Implemented

- Live browser verification of the new workspace panel was not executed in this session.
- The Memory Card persistence model is intentionally narrow: a session row in `app_sessions`, not a full rehydration subsystem.

## 5. What Is Intentionally Deferred

- Long-term memory
- Vector retrieval or memory graph design
- Public AI chat
- Route-family expansion
- Page-builder drift
- Full reopen/resume semantics for archived memory sessions

## 6. Drift / Leakage Check

No material drift found in the implemented code path.

Observed boundaries:
- UI calls the admin application surface, not the provider or transport.
- Workspace memory is read and written only through `readMemoryCardSlice(...)` and `applyAcceptedMemoryDelta(...)`.
- Memory-affecting outputs are treated as proposed deltas, not direct LLM writes.
- Public read-side behavior remains published-only.

## 7. Deployment / Runtime Proof

Deployment was not only prepared; it was executed.

Evidence:
- build-and-publish workflow run `24039325894` succeeded
- deploy-phase1 workflow run `24039385218` succeeded
- deployed image digest: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:269089b42aa356604ffa954dd6c9c0dfc75a22d2152441e07d0cc3875aac9ecf`
- phase-1 health probe through Traefik passed

## 8. Overall Verdict

The implementation matches the layered architecture plan in the areas that matter for the first service-only workspace rollout.

Key verdict:
- Memory Card is session-scoped and non-truth
- the prompt packet assembler is pure
- the LLM boundary remains isolated
- accepted memory deltas are the only write path
- the service landing generate route is wired to the published base revision id
- review/publish handoff remains isolated and explicit

## 9. Next Smallest Safe Step

The smallest safe follow-up is a live browser check of the deployed service editor surface to confirm the new Memory Card panel renders correctly in the operator UI and that the service generate action still works end-to-end in the browser.
