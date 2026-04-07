# Landing-First Contract Reality Audit v1

## 1. Audit Scope

This is a strict code reality check of the landing-first workspace contract pack against the current codebase.

I audited:
- route ownership and owner-truth anchoring,
- landing draft/spec shape,
- block registry and render semantics,
- verification/report generation,
- publish boundary behavior,
- Memory Card session semantics,
- prompt packet assembly,
- structured LLM boundary,
- operator-facing workspace UI flow,
- tests that directly cover these seams.

This audit is code-grounded. I did **not** independently re-open the authenticated workspace in browser in this turn, so live rendered UI is `RUNTIME NOT VERIFIED` here.

## 2. Sources Checked

### Product canon and domain context
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/out/for chatGpt/00_Context_Map_Экостройконтинент.md`
- `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
- `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
- `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`

### Landing-first engineering contracts
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`

### Workspace / memory / LLM docs
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`

### Reports used for context only
- `docs/reports/LANDING_WORKSPACE_PRD_DOCS_EXPECTATION_AUDIT_v1.report.md`
- `docs/reports/LANDING_WORKSPACE_UI_SURFACE_AUDIT_v1.report.md`
- `docs/reports/LANDING_FIRST_WORKSPACE_EXECUTION_v1.report.md`
- `docs/reports/LANDING_FIRST_WORKSPACE_REALITY_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_REALITY_AUDIT_v1.report.md`
- `docs/reports/AI_WORKSPACE_POST_REFACTOR_REALITY_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_POST_CHECK_v1.report.md`
- `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`

### Code and tests inspected
- `lib/admin/landing-workspace.js`
- `lib/landing-workspace/session.js`
- `lib/landing-workspace/landing.js`
- `lib/ai-workspace/prompt.js`
- `lib/ai-workspace/memory-card.js`
- `lib/llm/facade.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/api/admin/workspace/landing/[pageId]/route.js`
- `components/admin/AdminShell.js`
- `lib/admin/nav.js`
- `components/admin/LandingWorkspaceMemoryPanel.js`
- `components/admin/LandingWorkspaceVerificationPanel.js`
- `components/admin/PreviewViewport.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/EntityEditorForm.js`
- `app/admin/(console)/review/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js`
- `tests/admin-shell.test.js`
- `tests/landing-workspace.test.js`
- `tests/landing-workspace.route.test.js`
- `tests/ai-workspace.test.js`

## 3. Contract Areas That Are Fully Real in Code

### A. Owner truth / route ownership contract — `FULLY VERIFIED`

What the code really does:
- The workspace route family is keyed by `pageId` in both the chooser and the dedicated screen.
- `app/admin/(console)/workspace/landing/[pageId]/page.js` treats `Page` as the source owner and refuses to render if the entity is not a `Page`.
- `app/api/admin/workspace/landing/[pageId]/route.js` also rejects non-`Page` entities before it does any generation or review handoff work.
- `lib/landing-workspace/session.js` normalizes the active session slice back to `ENTITY_TYPES.PAGE` and the current `pageId`.
- `landingDraftId` is present as an internal workspace handle inside the candidate spec and review handoff, but it does not become route ownership.

Evidence:
- `app/admin/(console)/workspace/landing/[pageId]/page.js:20-198`
- `app/api/admin/workspace/landing/[pageId]/route.js:154-260`
- `lib/admin/landing-workspace.js:41-101`
- `lib/landing-workspace/session.js:27-103`
- `tests/landing-workspace.route.test.js:262-299`

Notes:
- The owner-truth rule is real.
- The one caveat is session uniqueness: the code anchors the active session to `pageId`, but global de-duplication of all possible sessions for the same page is not hard-enforced. That belongs to the Memory Card session contract below, not to owner truth itself.

### E. Verification contract — `FULLY VERIFIED`

What the code really does:
- `buildLandingWorkspaceVerificationReport(...)` exists and produces a machine-readable report.
- The report has the expected contract classes:
  - `structural/schema`
  - `reference/truth`
  - `render/compatibility`
  - `editorial/publish-readiness`
  - `claim/risk`
- It computes `blockingIssues`, `warnings`, `approvalEligible`, `renderCompatible`, and `publishReady`.
- The workspace UI and tests consume that report directly.

Evidence:
- `lib/landing-workspace/landing.js:419-580`
- `components/admin/LandingWorkspaceVerificationPanel.js:27-154`
- `lib/admin/landing-workspace.js:95-141`
- `tests/landing-workspace.test.js:160-203`

Notes:
- The verification machinery is real and usable.
- The drift is not in the report shape itself; it is in the payload and section registry shape feeding that report.

### F. Publish artifact contract — `FULLY VERIFIED`

What the code really does:
- Publish remains explicit and human-controlled.
- The workspace handoff routes to review, not to publish.
- The review queue and publish readiness page are separate surfaces.
- The publish page uses an explicit confirmation action form.
- There is no separate landing-owned published store in the workspace path.

Evidence:
- `app/admin/(console)/workspace/landing/[pageId]/route.js:197-260`
- `app/admin/(console)/review/page.js:18-56`
- `app/admin/(console)/review/[revisionId]/page.js:154-162`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js:68-69`
- `docs/engineering/LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md:17-23,47-70`

Notes:
- The canonical published artifact is still the active published page revision.
- The landing workspace does not invent a second publish truth.

### H. Prompt context contract — `FULLY VERIFIED`

What the code really does:
- `assemblePromptPacket(...)` is pure and returns a normalized packet plus a prompt string.
- It accepts only `requestScope`, `memoryContext`, `canonicalContext`, `artifactContract`, and `actionSlices`.
- It does not write state, call providers, or embed transport concerns.
- `buildLandingWorkspaceCandidateRequest(...)` builds one base packet shape and then passes it into the LLM boundary.

Evidence:
- `lib/ai-workspace/prompt.js:57-84`
- `lib/landing-workspace/landing.js:307-368`
- `tests/ai-workspace.test.js:138-170`

Notes:
- This is the cleanest seam in the stack.
- It stays within the contract of one base packet with action-specific slices only.

### I. LLM boundary contract — `FULLY VERIFIED`

What the code really does:
- `requestStructuredArtifact(...)` is the single structured-output boundary.
- It validates request shape before calling a provider.
- It normalizes provider output locally.
- It validates the structured result locally.
- Provider transport details stay in the LLM layer, not in the UI or business workflow.

Evidence:
- `lib/llm/facade.js:77-186`
- `lib/ai-workspace/prompt.js:57-84`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`

Notes:
- No accidental collapse of prompt assembly and provider invocation is present here.
- Memory-affecting outputs are still handled as proposed/accepted deltas rather than direct writes from the model.

## 4. Contract Areas That Are Partially Realized

### B. Landing draft / landing spec contract — `PARTIALLY VERIFIED`

What is real:
- `buildLandingWorkspaceCandidateSpec(...)` exists.
- It carries `specVersion`, `candidateId`, `pageId`, `landingDraftId`, `baseRevisionId`, `routeFamily`, `sourceContextSummary`, `payload`, and `sections`.
- `sourceContextSummary` is real and used by both prompt assembly and verification.

What is still partial:
- The payload shape is still a legacy compatibility bridge built around `pageType` values like `about` / `contacts` and older `blocks`-style projection.
- The newest contract pack wants a narrower landing-specific draft/spec model than the runtime currently exposes.
- Page-scoped connective copy is implicit in `changeIntent`, `editorialGoal`, and `sourceContextSummary`, but it is not yet a first-class contract object.

Evidence:
- `lib/landing-workspace/landing.js:307-418`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md:17-65`

### D. Render contract — `PARTIALLY VERIFIED`

What is real:
- Preview and review use the same derived artifact slice in the landing workspace path.
- `buildLandingWorkspacePreviewPayload(...)` projects the candidate into canonical `Page` truth fields before render.
- `PreviewViewport` renders the same public renderer shell in a deterministic way.

What is still partial:
- The current render path is still fed by the legacy projection bridge, not by the newest closed landing block registry.
- Deterministic render semantics are real, but they are still compatibility-based rather than fully aligned to the latest block model.

Evidence:
- `lib/admin/landing-workspace.js:95-141`
- `lib/landing-workspace/landing.js:140-240`
- `components/admin/PreviewViewport.js:1-61`
- `docs/engineering/LANDING_COMPOSITION_RENDER_CONTRACT_v1.md:17-61`

### G. Memory Card contract — `PARTIALLY VERIFIED`

What is real:
- Memory Card is session-scoped working state.
- It is explicitly non-truth.
- Accepted-delta behavior is real.
- The landing session layer re-anchors the active slice to `pageId`.

What is still partial:
- One active session per `pageId` is not globally enforced across all possible sessions; the current code anchors the current authenticated session, but does not prove a uniqueness lock for every session row.
- The base Memory Card module remains generic (`entityType` / `entityId`), and the landing-first rules are layered on top.

Evidence:
- `lib/ai-workspace/memory-card.js:178-201,446-652`
- `lib/landing-workspace/session.js:27-103`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md:5-18,41-46,71,125,131-158`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md:5-18,54-80`
- `tests/ai-workspace.test.js:171-355`

### J. UI contract surface — `PARTIALLY VERIFIED`

What is real:
- The chooser route exists at `/admin/workspace/landing`.
- The dedicated workspace route exists at `/admin/workspace/landing/[pageId]`.
- The screen is page-anchored.
- The source editor remains the canonical truth-editing surface and has a CTA into the workspace when a `Page` owner exists.
- The workspace layout contains the intended left / center / right flow:
  - source page and session context on the left,
  - preview and change intent in the center,
  - verification and review handoff on the right.

What is still partial:
- The surface is functionally correct, but it still carries legacy/service-first substrate and too much diagnostic density for a clean first-layer operator experience.

Evidence:
- `app/admin/(console)/workspace/landing/page.js:13-97`
- `app/admin/(console)/workspace/landing/[pageId]/page.js:20-198`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js:83-84`
- `tests/admin-shell.test.js:10-19`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:60-107,134-214`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md:52-121,152-228`

## 5. Contract Areas That Are Mostly Doc-Level Only

### C. Block registry contract — `DOC-LEVEL ONLY` for the newest closed registry

What the docs say:
- The newest contract pack defines a closed landing block set:
  - `landing_hero`
  - `media_strip`
  - `service_cards`
  - `case_cards`
  - `content_band`
  - `cta_band`
- It also says shell regions are fixed and not part of block ordering.

What the code actually does:
- The code still enforces a different legacy section registry:
  - `landing_hero`
  - `landing_intro`
  - `primary_media`
  - `landing_body`
  - `related_services`
  - `related_cases`
  - `gallery`
  - `cta_band`
- That registry is a compatibility bridge, not the new closed registry from the latest contract pack.

Conclusion:
- The exact new closed block registry is still doc-level only.
- The old section registry is the real runtime shape.

Evidence:
- `lib/landing-workspace/landing.js:28-38,202-240`
- `docs/engineering/LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md:17-46`

### Shell-region and page-scoped connective-copy modeling — `DOC-LEVEL ONLY`

What the docs describe:
- Shell regions are fixed and separated from composition blocks.
- Page-scoped connective copy is a distinct page-level layer, not reusable entity content.

What the code currently does:
- The shell is present as outer admin chrome and page framing, but it is not modeled as a first-class landing composition contract object.
- Connective copy lives implicitly in `changeIntent`, `editorialGoal`, `sourceContextSummary`, and the resulting candidate payload, but not in a dedicated page-copy model.

Conclusion:
- These concepts are real product intent, but not yet explicit code contracts.

## 6. Legacy / Service-First Drift That Still Remains

### Legacy landing section registry in `lib/landing-workspace/landing.js` — `LEGACY DRIFT`

The current runtime still uses a legacy landing section registry and a compatibility projection path.

Why this matters:
- It is not the same semantic model as the new closed block registry contract.
- It can mislead future agents into thinking the old section names are the new canon.

Evidence:
- `lib/landing-workspace/landing.js:28-38,140-240`

### Transitional service-prefixed surface in review — `LEGACY DRIFT`

The review detail page still includes a legacy `ServiceLandingFactoryPanel`, with an explicit code comment saying it remains only for older service revisions.

This is acceptable as transitional substrate, but it is still visible drift.

Evidence:
- `app/admin/(console)/review/[revisionId]/page.js:120-162`

### Service-first or engineering-heavy UI nouns in admin chrome — `LEGACY DRIFT`

Examples:
- `AI-верстка` in the sidebar,
- `LLM диагностика` in the sidebar,
- always-visible infra health in the admin shell footer (`S3`, `CDN`, and host/probe metadata).

These are not fatal contract breaks, but they still read as engineering substrate rather than purely operator-facing product language.

Evidence:
- `components/admin/AdminShell.js:10-58`
- `lib/admin/nav.js:4-23`

### Generic Memory Card substrate names — `LEGACY DRIFT`

The base Memory Card module still uses generic `entityType` / `entityId` semantics. The landing-first layer narrows it correctly, but the base shape is broader than the landing contract now needs.

Evidence:
- `lib/ai-workspace/memory-card.js:546-652`
- `lib/landing-workspace/session.js:27-103`

## 7. Fragile Seams That Could Cause Future Drift

- The biggest fragile seam is the compatibility bridge in `projectLandingWorkspaceCandidatePayload(...)`. It keeps the system working, but it also lets legacy section names stay alive inside the new path.
- The landing verification report is real, but it depends on whatever structure the candidate payload currently produces. If upstream payload shapes drift, the report can stay machine-readable while the semantic model changes underneath it.
- One active session per `pageId` is not globally proven. The current implementation anchors the current session to `pageId`, but does not prove a unique per-page session lock across all session rows.
- The review page still carries a transitional service-prefixed panel. The code comment helps, but future agents can still misread it as the semantic primary if they do not read carefully.
- Live authenticated browser verification of the workspace was not independently completed in this audit, so runtime rendering is still `RUNTIME NOT VERIFIED` here.

## 8. Overall Verdict

**Overall verdict: `PARTIALLY VERIFIED`**

What is solid:
- The landing-first route ownership is real.
- The workspace is page-anchored.
- The workspace does not invent Page truth.
- Memory Card remains session-scoped and non-truth in the landing path.
- Prompt assembly is pure.
- The LLM boundary is separate and structured.
- Verification, review, and publish remain explicit and human-controlled.

What is still not fully aligned:
- The newest closed block registry is still not the runtime registry.
- The render/spec path still leans on a legacy compatibility bridge.
- One active session per `pageId` is not yet globally enforced.
- The operator UI still carries visible service-first and diagnostic substrate.

Bottom line:
- The system is **safe enough to continue product/UI work**.
- It is **not yet fully conformant** to the latest landing contract pack because the block-registry / payload-shape layer still carries legacy semantics.

## 9. Next Smallest Safe Step

The smallest safe step is to make the compatibility bridge explicit and contract-locked:

- keep the current landing path working,
- freeze one canonical landing registry for the new path,
- add tests that fail if legacy section ids leak into the new landing contract path,
- and add a stronger guard for one active session per `pageId`.

That is the narrowest step that reduces drift without turning this into a new architecture cycle.
