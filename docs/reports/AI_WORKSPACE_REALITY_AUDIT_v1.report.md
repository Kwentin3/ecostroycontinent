# AI_WORKSPACE_REALITY_AUDIT_v1

## 1. Audit scope
Reality check for the current AI-assisted service landing workspace implementation against the accepted product canon, landing-factory contracts, Memory Card docs, LLM infra docs, layered architecture plan, and the implementation/conformance reports.

This audit is intentionally narrow:
- code reality, not plan prose;
- runtime-facing seams where they can be verified;
- no fixes, no redesign, no scope expansion.

I separate evidence into:
- `code-verified`
- `runtime-verified`
- `report-asserted only`

## 2. Sources checked

### Code-verified
- `app/api/admin/entities/service/landing-factory/generate/route.js:73-202`
- `lib/ai-workspace/memory-card.js:217-652`
- `lib/ai-workspace/prompt.js:57-83`
- `lib/landing-factory/service.js:231-608`
- `lib/llm/facade.js:92-175`
- `lib/admin/entity-ui.js:29-88`
- `components/admin/EntityEditorForm.js:110-572`
- `components/admin/ServiceLandingWorkspacePanel.js:14-105`
- `components/admin/ServiceLandingFactoryPanel.js:27-125`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js:63-95`
- `app/admin/(console)/entities/[entityType]/new/page.js:61-88`
- `app/admin/(console)/review/[revisionId]/page.js:22-180`
- `app/services/[slug]/page.js:1-18`
- `lib/read-side/public-content.js:84-110`
- `lib/content-ops/workflow.js:31-206`
- `lib/content-core/service.js:44-118`
- `db/migrations/002_workspace_memory_card.sql:2-5`
- `tests/ai-workspace.test.js:99-216`
- `tests/service-landing-factory.route.test.js:270-329`
- `tests/service-landing-factory.test.js:55-203`

### Runtime-verified
- `node --experimental-specifier-resolution=node --test tests/ai-workspace.test.js tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- `npm run build`
- GitHub Actions `build-and-publish` run `24039325894`
- GitHub Actions `deploy-phase1` run `24039385218`

### Report-asserted only
- `docs/reports/AI_WORKSPACE_EXECUTION_v1.report.md`
- `docs/reports/AI_WORKSPACE_CONFORMANCE_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_V1.report.md`
- `docs/reports/MEMORY_CARD_DOMAIN_ANAMNESIS_V1.report.md`
- `docs/reports/MEMORY_CARD_STRUCTURED_OUTPUT_STITCHING_V1.report.md`
- `docs/reports/2026-04-05/LLM.INFRA.BASELINE.PREVIEW_CUTOVER_AND_RUNTIME_CANON_ALIGNMENT_Р­РєРѕСЃС‚СЂРѕР№РєРѕРЅС‚РёРЅРµРЅС‚_v0.1.report.md`

## 3. What is fully verified in implementation

| Area | Verdict | Evidence | Notes |
|---|---|---|---|
| Service-only workspace route boundary | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:73-202`, `components/admin/ServiceLandingWorkspacePanel.js:14-105`, `components/admin/EntityEditorForm.js:560-572` | The AI workspace generate path is service-only and is rendered only on the service editor surface. No route-family expansion was introduced by the workspace. |
| Memory Card exists as real runtime state | FULLY VERIFIED | `db/migrations/002_workspace_memory_card.sql:2-5`, `lib/ai-workspace/memory-card.js:546-652`, `lib/auth/session.js:72-91` | The workspace state is session-row backed on `app_sessions.workspace_memory_card`, with an update timestamp and session-based lookup. |
| Memory Card is non-truth / non-publish state | FULLY VERIFIED | `components/admin/ServiceLandingWorkspacePanel.js:14-105`, `lib/ai-workspace/memory-card.js:546-652` | The workspace panel explicitly labels the state as session-scoped working state, and the write path is limited to accepted deltas. |
| Accepted-delta-only mutation path | FULLY VERIFIED | `lib/ai-workspace/memory-card.js:612-652`, `app/api/admin/entities/service/landing-factory/generate/route.js:191-202` | `workspace_memory_card` is only written via `applyAcceptedMemoryDelta(...)`; the route writes memory only after save/readiness/submit steps. |
| One pure prompt packet assembler | FULLY VERIFIED | `lib/ai-workspace/prompt.js:57-83`, `tests/ai-workspace.test.js:99-138` | `assemblePromptPacket(...)` is a pure builder that takes inputs and emits one base packet shape with optional action slices. |
| Structured output LLM boundary stays in infra | FULLY VERIFIED | `lib/llm/facade.js:92-175`, `lib/landing-factory/service.js:590-608` | Workspace code calls the existing LLM facade, which normalizes provider output and then validates it locally. Provider/transport details do not leak into UI code. |
| Service editor workspace panel is wired into the admin surface | FULLY VERIFIED | `lib/admin/entity-ui.js:29-88`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js:63-95`, `app/admin/(console)/entities/[entityType]/new/page.js:61-88`, `components/admin/EntityEditorForm.js:560-572` | The service editor loader reads the workspace slice, and the right rail renders the service workspace panel. |
| Public read-side stays published-only | FULLY VERIFIED | `app/services/[slug]/page.js:1-18`, `lib/read-side/public-content.js:84-110` | The public service page reads published service content and published lookups only. Workspace state is not read on the public route. |
| Service candidate base revision id is preserved | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:108-134`, `lib/landing-factory/service.js:277-340,590-608`, `tests/service-landing-factory.route.test.js:270-304` | The live generate route reads the active published revision id and forwards it into candidate/spec generation. The route-level test asserts that path. |
| Build/deploy evidence exists for the runtime code | FULLY VERIFIED | GitHub Actions runs `24039325894`, `24039385218` | Build and deploy workflows succeeded for the code commit that introduced the workspace runtime. |

## 4. What is partially verified

| Area | Verdict | Evidence | Why partial |
|---|---|---|---|
| Live browser/operator proof of the admin workspace | PARTIALLY VERIFIED | `components/admin/ServiceLandingWorkspacePanel.js:14-105`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js:63-95`, `gh run view 24039385218` | The wiring is real and the deploy workflow passed, but I did not run an authenticated browser walkthrough of the deployed admin service workspace in this audit session. |
| Refresh / route-transition survival of Memory Card | PARTIALLY VERIFIED | `db/migrations/002_workspace_memory_card.sql:2-5`, `lib/ai-workspace/memory-card.js:546-652` | The persistence mechanism is a session row, so survival is plausible by design, but I did not independently verify refresh/reopen behavior in a live browser session. |
| Candidate/spec, verification, preview, audit-details as one derived slice | PARTIALLY VERIFIED / DRIFT | `lib/landing-factory/service.js:340-608`, `components/admin/ServiceLandingFactoryPanel.js:27-125`, `app/admin/(console)/review/[revisionId]/page.js:22-180`, `app/api/admin/entities/service/landing-factory/generate/route.js:147-202` | The implementation has a coherent candidate/spec flow, but it uses several projections: revision payload, `auditDetails.landingFactory.candidateSpec`, and `workspace_memory_card.artifactState.derivedArtifactSlice`. That is not yet a single shared runtime object. |
| Transactionality of save -> submit -> memory update | PARTIALLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:147-202` | The workflow is correct in order, but the revision save/submit and memory write are separate steps. A later memory write failure would leave workflow state advanced and Memory Card stale. |
| Session cleanup / row accumulation risk | PARTIALLY VERIFIED | `lib/auth/session.js:72-91`, `lib/ai-workspace/memory-card.js:546-652` | Logout deletes the session row, and reads are session-scoped, but I did not find a dedicated cleanup job for expired rows in the inspected code. |

## 5. What is only claimed in reports and not independently verified

### Not independently verified in this audit
- A live authenticated browser walkthrough of the new workspace panel.
- Any claim that the workspace operator path was manually exercised end-to-end in-browser during the previous execution report.
- Any claim that the runtime rollout was proven beyond the successful workflow runs and the health probe embedded in the deploy job.

### Independently verified instead
- Build success on the runtime code.
- Deploy workflow success.
- Current route map from `npm run build`.
- Route-level and workspace tests.

## 6. Drift against PRD / contracts / architecture plan

| Finding | Verdict | Why it matters |
|---|---|---|
| Single canonical derived artifact slice is not fully realized | DRIFT / MISMATCH | The layered plan wanted one canonical derived artifact slice shared by candidate/spec, verification, preview, audit details, and review visibility. The code uses multiple serialized projections instead: revision payload, auditDetails candidateSpec, and Memory Card summary slice. |
| Unused prompt helper duplicates the packet assembly shape | PARTIALLY VERIFIED | `buildServiceLandingCandidatePrompt(...)` in `lib/landing-factory/service.js:231-275` is not part of the runtime path, but it is a duplicate helper next to the real request builder. It is not a functional bug, but it is a drift seam. |
| Preview and verification are aligned, but not via one literal shared object | PARTIALLY VERIFIED | The review page preview renders `revision.payload`, while the factory panel reconstructs verification from `auditDetails.landingFactory.candidateSpec`. They are aligned through the same draft payload, but not via one canonical object reused everywhere. |
| No route-family or public-read-side drift | NO MATERIAL ISSUE FOUND | The AI workspace stays service-only. Public service pages still read published content only. |

## 7. Fragile seams and operational risks

- The workspace route writes draft, submits for review, then persists the accepted memory delta. That is the right order for the current workflow, but it is not atomic across revision state and session memory.
- The session-backed Memory Card is minimal and correct, but expired session-row cleanup is not explicitly visible in the inspected code.
- The candidate/spec snapshot is stored in revision audit details, while the review page also renders from the revision payload and the Memory Card stores only a summary slice. That is a manageable projection pattern, but it is the most likely place for future truth drift.
- `buildServiceLandingCandidatePrompt(...)` exists as a duplicate prompt-string helper, even though the runtime path uses `buildServiceLandingCandidateRequest(...)`. It is dead-code-adjacent and could confuse future refactors.
- I did not run an authenticated browser walkthrough of the deployed admin workspace, so operator UX and real refresh behavior remain a runtime gap.
- The Next build still emits the standing unrelated NFT-list trace warning from `next.config.mjs` / `app/api/media/[entityId]/route.js`. It is not workspace-specific, but it is still a runtime warning.

## 8. Overall verdict

**PARTIALLY VERIFIED**

The core AI-assisted service landing workspace is real, service-only, and backed by passing tests plus successful build/deploy workflow evidence. The major implementation goals are present:
- session-scoped Memory Card,
- pure prompt packet assembly,
- existing LLM facade and structured-output validation,
- service editor workspace surface,
- explicit review/publish workflow reuse,
- published-only public read-side.

The main gaps are not route scope or provider leakage. They are:
- no live authenticated browser proof in this audit,
- the Memory Card refresh/reopen lifecycle is not independently verified,
- the вЂњone canonical derived artifact sliceвЂќ ideal is only partially realized because the code uses multiple projections.

## 9. Next smallest safe follow-up step

Run an authenticated browser walkthrough of the deployed admin service workspace and review flow, then verify:
- the service workspace panel renders on the live editor surface,
- the generate action works with a real session,
- the review page shows the expected candidate report,
- refresh / route transition does not lose the Memory Card slice.

If that passes, the next smallest code-level cleanup would be to collapse the unused `buildServiceLandingCandidatePrompt(...)` helper or formally document the projection model as intentional.

