# MEMORY_CARD_DOMAIN_ANAMNESIS_V1

## 1. Audit Scope

This is a narrow domain audit for a session-scoped Memory Card in the AI-assisted service landing workflow for `Экостройконтинент`.

It only looks at the service-first admin workspace and the code/doc seams that already exist around generation, review, verification, publish handoff, and prompt assembly.

It does not design a long-term memory platform, a public AI memory layer, or an org-wide memory graph.

The core question is simple: what already behaves like memory, what must stay canonical, what session memory is actually needed, and what minimum doc domain should exist next.

## 2. Sources Checked

### Canonical product and landing docs

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`
- `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md`
- `docs/engineering/SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/SERVICE_RENDER_CONTRACT_v1.md`
- `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md`

### LLM infra docs

- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_TRANSPORT_AND_SOCKS5_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_IMPLEMENTATION_PLAN_v1.md`

### Existing reports

- `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_EXECUTION_v1.report.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_CONFORMANCE_AUDIT_v1.report.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_REALITY_AUDIT_v1.report.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_POST_FIX_REALITY_RECHECK_v1.report.md`
- `docs/reports/2026-04-05/LLM.INFRA.BASELINE.PREVIEW_CUTOVER_AND_RUNTIME_CANON_ALIGNMENT_Экостройконтинент_v0.1.report.md`

### Actual code inspected

- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `lib/landing-factory/service.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `components/admin/PreviewViewport.js`
- `app/services/[slug]/page.js`
- `app/services/page.js`
- `lib/read-side/public-content.js`
- `lib/content-core/service.js`
- `lib/content-core/repository.js`
- `lib/content-ops/workflow.js`
- `lib/content-ops/readiness.js`
- `lib/llm/facade.js`
- `lib/llm/result.js`

### Important note

The exact context-pack filenames from the prompt (`00_Context_Map_...` through `04_Decisions_...`) were not present in the workspace under those exact names. I used the closest existing truth/boundary docs and current code paths instead.

## 3. What State Already Exists Today

| State | Verdict | Where it lives | What it means |
|---|---|---|---|
| Selected service entity, current draft, and active published revision | FULLY PRESENT | `components/admin/EntityEditorForm.js:125`, `:137`, `:566`, `:572`; `lib/content-core/repository.js:287`, `:294` | The editor and aggregate layer already know the live entity, draft, and published baseline. |
| Service landing candidate/spec | FULLY PRESENT | `lib/landing-factory/service.js:246`, `:272`, `:500`; `components/admin/ServiceLandingFactoryPanel.js:31`, `:70`, `:84` | A structured candidate/spec object already exists and is surfaced in the admin workspace. |
| Verification report with structural/reference/render/editorial/claim classes | FULLY PRESENT | `lib/landing-factory/service.js:360`, `:392`, `:412`, `:430`; `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md:7`, `:24`, `:43` | The machine-verifiable report already separates decision classes instead of collapsing everything into one blob. |
| Review and preview state | FULLY PRESENT | `app/admin/(console)/review/[revisionId]/page.js:84`, `:92`, `:94`, `:178`; `components/admin/PreviewViewport.js:11`, `:20`, `:26`, `:47` | Review has its own baseline, preview mode, and viewport toggles. |
| Public read-side projection | FULLY PRESENT | `app/services/page.js:7`, `:14`; `app/services/[slug]/page.js:11`, `:16`; `lib/read-side/public-content.js:22`, `:27`, `:84`, `:140` | Public service pages only consume published state, not drafts or editor memory. |
| LLM request/result envelope | FULLY PRESENT | `lib/llm/facade.js:92`, `:142`, `:167`; `lib/llm/result.js:1`, `:24`, `:35`, `:46`; `docs/engineering/LLM_FACTORY_CONTRACT_v1.md:20`, `:46` | LLM usage is already wrapped in a stable diagnostic/result envelope. |
| Audit trail, readiness, and evidence register | FULLY PRESENT | `lib/content-core/service.js:84`, `:94`; `components/admin/EntityEditorForm.js:549`, `:558`, `:585` | The workspace already records evidence and readiness around the current revision. |

Verdict: the operational ingredients for session memory already exist, but they are distributed across workflow state, derived summaries, and audit snapshots rather than a formal memory domain.

## 4. What Memory-Like State Is Currently Implicit

| Implicit state | Verdict | Why it matters |
|---|---|---|
| `sourceContextSummary` and `proofBasis` | IMPLICIT / UNMODELED | `lib/landing-factory/service.js:248`, `:263`, `:267`, `:519`; `app/api/admin/entities/service/landing-factory/generate/route.js:104`, `:111`, `:115`, `:120` | This already behaves like compact session memory: it preserves the brief, base revision, draft revision, variant intent, and proof basis. |
| `candidateSpec.auditDetails.landingFactory` | IMPLICIT / UNMODELED | `app/api/admin/entities/service/landing-factory/generate/route.js:29`, `:33`, `:34`, `:111`, `:125` | The revision audit trail carries a snapshot of the generation run, but it is not a separate memory layer. |
| Verification summary and blockers | IMPLICIT / UNMODELED | `lib/landing-factory/service.js:392`, `:430`; `components/admin/ServiceLandingFactoryPanel.js:36`, `:42`, `:43`, `:85` | The report is effectively decision memory, but it is derived from candidate/spec plus readiness. |
| Review page baseline and preview mode | IMPLICIT / UNMODELED | `app/admin/(console)/review/[revisionId]/page.js:84`, `:92`, `:94`, `:178` | The route keeps workspace context in the URL and route-local variables, not in a memory card. |
| Editor-side selections and current intent | IMPLICIT / UNMODELED | `components/admin/EntityEditorForm.js:195`, `:509`, `:521` | Change intent and action choices exist, but they are not modeled as a session-memory object. |
| LLM trace and transport diagnostics | IMPLICIT / UNMODELED | `lib/llm/facade.js:95`, `:167`, `:172`; `lib/llm/result.js:24`, `:35`, `:46` | These are run diagnostics, not business memory, but they do preserve execution history. |
| `variantKey` / current direction marker | IMPLICIT / UNMODELED | `lib/landing-factory/service.js:274`, `:286`; `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md:31` | This is a thin placeholder for a “which version are we iterating on?” concept, but it is not a formal memory shelf. |

Verdict: the project already has memory-shaped data, but it is implicit and scattered.

## 5. What Must Stay Outside Memory

| Boundary | Verdict | Evidence | Why |
|---|---|---|---|
| Canonical entity and revision truth | SHOULD STAY OUTSIDE MEMORY | `lib/content-core/repository.js:23`, `:84`, `:287`, `:294`; `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:68` | The `content_entities` / `content_revisions` model remains the source of truth. Memory must not replace revision truth. |
| Published revision pointer and publish state | SHOULD STAY OUTSIDE MEMORY | `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:257`, `:258`; `docs/engineering/SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md:19`, `:24`, `:41` | Publish is explicit and human-controlled; memory cannot become a hidden publish state. |
| SEO fields and service payload truth | SHOULD STAY OUTSIDE MEMORY | `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md:31`, `:34`; `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md:194`, `:198` | The spec is a view over canonical service truth, not a second truth store. |
| Public read-side projections | SHOULD STAY OUTSIDE MEMORY | `app/services/page.js:7`, `:14`; `app/services/[slug]/page.js:11`, `:16`; `lib/read-side/public-content.js:22`, `:84` | Public pages must stay read-only and published-only. |
| Auth/session infrastructure | SHOULD STAY OUTSIDE MEMORY | `lib/auth/session.js` | Login/session identity is security infrastructure, not workspace memory. |
| Raw provider/transport internals | SHOULD STAY OUTSIDE MEMORY | `docs/engineering/LLM_FACTORY_CONTRACT_v1.md:20`, `:46`; `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md:23`, `:31`, `:43` | Memory must not leak provider details or transport mechanics into business state. |
| Audit logs and generated reports | SHOULD STAY OUTSIDE MEMORY | `lib/content-core/service.js:84`, `:94`; `components/admin/ServiceLandingFactoryPanel.js:31`, `:85` | These are evidence and trace, not the source of truth. |

Verdict: the memory card must remain downstream of canonical truth and upstream of prompt assembly only.

## 6. What Session Memory Is Actually Needed

| Needed shelf | Verdict | What should live there |
|---|---|---|
| Session identity / workspace anchor | SHOULD BECOME MEMORY-CARD STATE | Authenticated actor, session id, entity id, route family, locale, and the active workspace surface. |
| Working brief | SHOULD BECOME MEMORY-CARD STATE | Current `changeIntent`, editorial goal, variant intent, and any operator-provided framing for the run. |
| Selected proof basis | SHOULD BECOME MEMORY-CARD STATE | The chosen related cases, galleries, primary media, and other proof refs that the current run is using. |
| Revision pointers | SHOULD BECOME MEMORY-CARD STATE | Current draft revision id and active published/base revision id, plus the current candidate id if one exists. |
| Artifact state | SHOULD BECOME MEMORY-CARD STATE | Candidate/spec snapshot, spec version, route family, preview mode, and current review/verification status. |
| Decision state | SHOULD BECOME MEMORY-CARD STATE | Accepted editorial decisions, unresolved blockers, warnings, and the last rejected direction. |
| Trace state | SHOULD BECOME MEMORY-CARD STATE | LLM trace id, request id, and the last generation timestamp for reproducibility. |
| Archive pointer | SHOULD BECOME MEMORY-CARD STATE | A pointer to the audit trail or previous candidate runs, not the full history itself. |

Verdict: the minimum useful memory is session/workflow-scoped and pointer-heavy, not content-heavy.

## 7. Ownership / Update Model Observations

| Area | Owner | Update rule | Verdict |
|---|---|---|---|
| Canonical content truth | System/runtime plus explicit human save/review/publish actions | Mutable only through the existing content workflow | SHOULD STAY OUTSIDE MEMORY |
| Source context summary | System-derived from canonical truth plus selected refs and intent | Derived-only, regenerated per run, optionally archived in audit details | IMPLICIT / UNMODELED |
| Selected refs and proof basis | Human operator/editor | Mutable inside the active session; may influence prompt assembly | SHOULD BECOME MEMORY-CARD STATE |
| Verification report | System-derived | Append-only per candidate run; versioned by revision/audit record | IMPLICIT / UNMODELED |
| Candidate/spec snapshot | System-derived but reviewable by humans | Versioned / archival; should not become the truth store | IMPLICIT / UNMODELED |
| LLM diagnostics | System/infra | Derived-only, append-only, and never editable as business truth | SHOULD STAY OUTSIDE MEMORY |

Two important ownership rules are already visible in the code:

1. The route archives candidate/spec data into the revision audit trail instead of inventing a second store (`app/api/admin/entities/service/landing-factory/generate/route.js:29`, `:111`, `:125`; `lib/content-core/service.js:84`, `:94`).
2. Verification is derived from candidate/spec plus readiness and revision state, not from hidden human memory (`lib/landing-factory/service.js:392`, `:430`; `components/admin/ServiceLandingFactoryPanel.js:31`, `:36`).

## 8. Prompt-Assembly Implications

The prompt/context assembler will likely need a small, explicit stack of fields rather than raw chat history.

### Always in context

- Session identity and actor role
- Current `entityId` / `entityType`
- Current draft revision id
- Active published/base revision id
- `changeIntent`
- Selected proof basis
- Route family, which is fixed to `service`

### Recent-turn fields

- Last accepted editorial decision
- Last rejected direction and why it was rejected
- Current `variantKey`, if any
- The current human frame or objective for the run

### Verification-related fields

- Readiness summary
- Blocking issues and warnings
- Section projection / render compatibility
- Publish readiness / approval eligibility

### Artifact-state fields

- Candidate id
- Spec version
- `sourceContextSummary`
- Preview mode
- Current review state

### Optional archive retrieval

- Prior candidate runs
- Audit timeline entries
- Older comments or rejected variants

The main implication is that prompt assembly should pull a compact session memory card, not the full revision payload and not raw provider output.

## 9. Drift Risks If No Contract Is Created

| Risk | Verdict | What goes wrong |
|---|---|---|
| Hidden second truth store | DRIFT RISK | Memory starts competing with the revision model instead of merely pointing to it. |
| Stale prompt context | DRIFT RISK | `sourceContextSummary`, proof refs, or variant intent can drift away from the current draft or published base. |
| Memory/publish collision | DRIFT RISK | Session memory can accidentally look like approval or publish state. |
| Duplicate state across UI and audit trail | DRIFT RISK | The same decision lives in form state, audit details, and memory with no single owner. |
| Vendor coupling | DRIFT RISK | Provider-specific traces or transport details can leak into memory and create brittle dependencies. |
| Chat-noise accumulation | DRIFT RISK | The workspace becomes a log of conversation, not a structured working state. |
| Long-term memory creep | DRIFT RISK | Session memory quietly becomes durable user memory, which current docs do not justify. |

Verdict: without a contract, the memory card will almost certainly drift into a hidden state store.

## 10. Recommended Minimum Doc Domain

The smallest clean package is an engineering-only pair:

1. `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
   - scope and exclusions
   - canonical truth vs session memory
   - ownership / update rules
   - explicit non-goals

2. `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
   - always-in-context fields
   - recent-turn fields
   - verification fields
   - archival / optional retrieval rules
   - assembly order and derived-only boundaries

I do not think a new product PRD is needed yet. The existing PRDs already define the canonical truth posture and the AI-assistive boundary; the missing piece is a small internal engineering contract for session memory.

## 11. Overall Verdict

| Major area | Verdict |
|---|---|
| Existing operational state | FULLY PRESENT |
| Memory-like state | IMPLICIT / UNMODELED |
| Canonical truth boundary | SHOULD STAY OUTSIDE MEMORY |
| Needed session memory | SHOULD BECOME MEMORY-CARD STATE |
| Risk of doing nothing | DRIFT RISK |

Overall, the codebase already has the ingredients for a session-scoped Memory Card, but they are scattered across workflow state, derived summaries, audit details, and review-page context.

This is not a signal to build a broad memory platform. It is a signal to formalize a small session-only contract so prompt assembly can stay stable without turning canonical truth into memory.

## 12. Next Smallest Safe Step

Write `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md` first, with an explicit canonical-vs-session boundary and ownership matrix for the service landing workspace.

Then validate that draft against the current service generate -> review flow before adding any retrieval, history, or persistence complexity.


