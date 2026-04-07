# LANDING_WORKSPACE_PRD_DOCS_EXPECTATION_AUDIT_v1

Overall verdict: `PARTIALLY VERIFIED`.

The landing-first workspace is real, pageId-anchored, deployed, and largely aligned with the canon. The main reason this audit does not upgrade to full conformance is that the authenticated live-browser experience of the workspace itself was not independently inspected in this turn, and a few secondary operator surfaces still retain technical English / mixed-language carry-over by design.

## 1. Audit Scope

This audit compares the actually implemented landing-first AI workspace against:

- the current product canon and PRD set,
- the landing-first engineering contracts and workspace architecture docs,
- the explicit operator UX expectations that guided the implementation.

This is a conformance audit only. No fixes were made.

Evidence classes used in this audit:

- `code-verified` - confirmed in repository code and tests.
- `runtime-verified` - confirmed on the live deployed runtime.
- `report-asserted only` - stated in prior reports but not independently rechecked here.

## 2. Sources Checked

### Product / canon

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`

### Engineering / workspace / memory / LLM

- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`

### Prior reports used as context only

- `docs/reports/LANDING_FIRST_WORKSPACE_EXECUTION_v1.report.md`
- `docs/reports/LANDING_FIRST_WORKSPACE_REALITY_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_IMPLEMENTATION_PLAN_v1.md`
- `docs/reports/UI_RUSSIFICATION_EXECUTION_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_POST_CHECK_v1.report.md`
- `docs/reports/AI_WORKSPACE_EXECUTION_v1.report.md`
- `docs/reports/AI_WORKSPACE_REALITY_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_POST_REFACTOR_REALITY_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_UI_PRESENCE_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_TEST_PROGRAM_V1.report.md`
- `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`

### Code / runtime surfaces checked

- `components/admin/AdminShell.js`
- `lib/admin/nav.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/LandingWorkspaceMemoryPanel.js`
- `components/admin/LandingWorkspaceVerificationPanel.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `components/admin/RevisionDiffPanel.js`
- `components/admin/PreviewViewport.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/MediaGalleryWorkspace.js`
- `components/admin/MediaCollectionOverlay.js`
- `components/admin/MediaImageEditorPanel.js`
- `components/admin/LlmDiagnosticsPanel.js`
- `app/admin/(console)/review/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js`
- `app/api/admin/workspace/landing/[pageId]/route.js`
- `lib/admin/landing-workspace.js`
- `lib/landing-workspace/session.js`
- `lib/landing-workspace/landing.js`
- `lib/ai-workspace/prompt.js`
- `lib/ai-workspace/memory-card.js`
- `lib/llm/facade.js`

### Runtime / rollout evidence

- `gh run` latest build-and-publish: `24072964964` -> success
- `gh run` latest deploy-phase1: `24075197338` -> success
- live health: `https://ecostroycontinent.ru/api/health` -> `200`
- live admin login gate: `https://ecostroycontinent.ru/admin/login` -> `200`, title `Вход в админку`
- live landing workspace gate: `https://ecostroycontinent.ru/admin/workspace/landing` -> `200`, title `Вход в админку`

## 3. What Is Fully Aligned

| Area | Verdict | Evidence |
|---|---|---|
| Landing-first workspace exists as a dedicated route family | `FULLY VERIFIED` | `app/admin/(console)/workspace/landing/page.js`, `app/admin/(console)/workspace/landing/[pageId]/page.js`, `lib/admin/landing-workspace.js` |
| `pageId` is the owner anchor for the workspace | `FULLY VERIFIED` | `lib/landing-workspace/session.js`, `lib/admin/landing-workspace.js`, `app/api/admin/workspace/landing/[pageId]/route.js` |
| Workspace does not create Page truth | `FULLY VERIFIED` | route/session flow only anchors to an existing `Page`; source-editor creation remains separate |
| One active workspace session per `pageId` is enforced in the implementation | `FULLY VERIFIED` | session anchoring logic in `lib/landing-workspace/session.js` plus route tests |
| Prompt assembler and LLM boundary remain separate | `FULLY VERIFIED` | `lib/ai-workspace/prompt.js` and `lib/llm/facade.js` stay separate; `assemblePromptPacket(...)` remains pure; `requestStructuredArtifact(...)` remains the boundary |
| Memory Card remains session-scoped and non-truth | `FULLY VERIFIED` | `lib/ai-workspace/memory-card.js` and `tests/ai-workspace.test.js` |
| Accepted-delta-only semantics remain intact | `FULLY VERIFIED` | `applyAcceptedMemoryDelta(...)` usage and route tests |
| Preview, verification, audit details, and review visibility share one derived artifact slice | `FULLY VERIFIED` | `lib/admin/landing-workspace.js`, `app/admin/(console)/workspace/landing/[pageId]/page.js`, `components/admin/LandingWorkspaceVerificationPanel.js`, route tests |
| Publish remains explicit and human-controlled | `FULLY VERIFIED` | review and publish pages stay separate; workspace handoff routes to review, not auto-publish |
| Source editor remains the canonical truth-editing surface | `FULLY VERIFIED` | `app/admin/(console)/entities/[entityType]/[entityId]/page.js` shows the CTA only for `ENTITY_TYPES.PAGE` |
| Primary landing workspace UI copy is Russian and operator-friendly | `FULLY VERIFIED` | chooser and workspace pages, memory/verification panels, review/publish surfaces |

## 4. What Is Partially Aligned

| Area | Verdict | Evidence | Why partial |
|---|---|---|---|
| Live authenticated screen shape | `PARTIALLY VERIFIED` | code shows the intended top bar / left context / center preview + interaction shell / right verification layout | I did not independently inspect the authenticated live workspace in-browser in this turn |
| Whole-admin Russification | `PARTIALLY VERIFIED` | primary landing workspace is Russian; secondary diagnostics/media screens still contain technical English / mixed-language carry-over such as `lifecycle`, `providerId`, `requestId`, `candidateSpec`, and LLM trace fields | The main operator surface is good, but the entire admin UI is not yet uniformly plain Russian |
| Transitional service-prefixed substrate | `PARTIALLY VERIFIED` | `ServiceLandingWorkspacePanel`, `ServiceLandingFactoryPanel`, service-oriented helper names still exist | They are legacy/transitional, but future readers can still misread them as semantic owners |
| Prior report claims about live UX | `PARTIALLY VERIFIED` | prior reports say the workspace and Russification are live; this audit independently confirms deploy + login gate + health, but not the authenticated workspace render | Report claims are directionally consistent but not fully re-smoked here |

## 5. What Is Only Claimed in Reports and Not Independently Verified

These items were asserted in earlier reports, but this audit did not independently verify them in an authenticated browser session:

- the exact visual rendering of `/admin/workspace/landing/[pageId]` in the live admin UI,
- the exact operator feel of the intended three-column workspace layout on the deployed runtime,
- the full click-through behavior from chooser -> workspace -> source editor -> review on the live authenticated server,
- the claim that the whole admin UI is now uniformly Russian end-to-end.

What *was* independently verified at runtime:

- deploy succeeded,
- the production health endpoint is green,
- the admin login gate is live and Russian,
- the unauthenticated workspace route correctly gates to login.

## 6. Drift Against PRD

Verdict: `NO MATERIAL ISSUE FOUND`

Observed conformance:

- landing-first composition is the primary AI-assisted surface,
- service pages remain adjacent SEO truth rather than the primary workspace target,
- canonical `Page` truth stays outside the workspace write path,
- workspace does not invent a second publish truth,
- publish remains explicit and human-controlled,
- no public AI chat and no broad page-builder drift appear in the implementation.

Minor residual mismatch:

- secondary technical screens still expose some English / mixed-language operator copy, which is a UX polish issue rather than a PRD violation.

## 7. Drift Against Engineering Docs

Verdict: `NO MATERIAL ISSUE FOUND` for the primary workspace contracts, with one fragile seam left.

Observed conformance:

- the route family matches the approved `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]` shape,
- `pageId` is the workspace anchor,
- `readMemoryCardSlice(...)` / `applyAcceptedMemoryDelta(...)` semantics remain intact,
- `assemblePromptPacket(...)` stays pure,
- `requestStructuredArtifact(...)` remains the only LLM boundary crossing,
- preview / verification / review continue to read one shared derived artifact slice,
- publish handoff stays inside the existing review/publish workflow.

Fragile seam:

- service-prefixed helper/component names still exist as transitional substrate. The engineering docs allow this only if future agents do not misread them as the semantic model. That condition is currently satisfied in the landing workspace UI, but the names are still visible in code.

## 8. Drift Against Expected UX / Operator Model

Verdict: `PARTIALLY VERIFIED`

What matches the operator model:

- the shell is bounded,
- the workspace is anchored to a `Page` owner,
- the interaction model is constrained to intent composition, bounded actions, and turn history / working state,
- the source editor remains the authoritative editing surface,
- the workspace is AI-assisted composition / preview / review rather than a prompt lab or public chat product,
- the primary landing workspace copy is now Russian and readable.

What still does not fully satisfy the expectation:

- authenticated browser inspection of the live workspace is still missing here,
- some secondary operator screens remain technical rather than fully plain-language Russian,
- the legacy service-prefixed naming can still confuse future maintainers even though it is not currently leaking into the main workspace UI.

## 9. Remaining Fragile Seams

- Authenticated live-browser proof of the workspace remains outstanding.
- Transitional service-prefixed helper names still exist in the codebase.
- Secondary diagnostics/media surfaces still have technical English carry-over.
- Internal payload/property names such as `candidateSpec`, `workspace_memory_card`, `providerId`, `requestId`, and `traceId` remain part of the runtime contract, even though they are no longer prominent user-facing labels.
- Prior reports should continue to be treated as supporting context, not proof, for any claim that depends on live authenticated UI inspection.

## 10. Overall Verdict

`PARTIALLY VERIFIED`

Why:

- the architecture and code are materially aligned with the landing-first canon,
- the server is deployed and healthy,
- the workspace is pageId-anchored and does not create Page truth,
- Memory Card / prompt / LLM / derived-slice boundaries are preserved,
- the primary landing workspace surfaces are Russian.

Why not full:

- authenticated live-browser verification of the workspace itself was not independently completed in this audit,
- the broader admin UI still contains some technical English carry-over outside the primary landing workspace.

## 11. Next Smallest Safe Step

Do one authenticated browser smoke on the deployed admin UI:

1. log in on the live server,
2. open `/admin/workspace/landing`,
3. open a real `/admin/workspace/landing/[pageId]`,
4. confirm the three-column workspace shape and the Russian copy in the live render,
5. click through the source-editor CTA and review handoff once.

If credentials are not available, the smallest safe next step is to create a narrow verification account or a short-lived bootstrap path for the audit only, so the live authenticated workspace can be independently confirmed.
