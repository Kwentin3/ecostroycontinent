# AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1

## 1. Objective

This plan defines the cleanest layered architecture for the AI-assisted service landing workspace so the current service-only rollout can stay isolated, prompt assembly can stay deterministic, Memory Card can stay session-scoped, and canonical content/revision/publish truth can stay the only source of truth.

The goal is not to invent a new platform. The goal is to make the existing seams explicit enough that future implementation can move without truth leakage, memory leakage, preview drift, or provider leakage.

## 2. Current Starting Point

The current codebase already has the right raw seams, but several responsibilities still live close together:

- `app/api/admin/entities/service/landing-factory/generate/route.js` currently orchestrates service-only candidate generation, draft save, readiness, verification, and review submission in one request path.
- `lib/landing-factory/service.js` already contains the service candidate/spec request, the section registry, source-context summary logic, candidate/spec construction, and verification report generation.
- `lib/llm/facade.js` already provides the canonical non-UI LLM entrypoint with structured output, normalization, validation, and a stable inward result envelope.
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md` and `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md` already define session-scoped memory semantics and prompt assembly rules.
- `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md` and `docs/engineering/SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md` already keep verification and publish truth separate from draft or review state.

My read of the current baseline is simple: the primitives exist, but the future implementation should stop treating them as one broad orchestration blob.

## 3. Proposed Practical Architecture

Keep the implementation model to five practical blocks. The older 7-part decomposition is still useful as a conceptual aid, but it should not become the implementation shape.

The five blocks are:

1. UI / Workspace
2. Workspace Application Layer
3. Memory Card
4. Prompt Packet Assembly + LLM Boundary
5. Canonical Workflow / Truth

Verification, review, and publish handoff are protected workflow boundaries inside the application/workflow path, not a standalone platform layer.

### Block model

| Block | Owns | Does not own | Reads from | Writes to | Key anti-coupling rule |
|---|---|---|---|---|---|
| UI / Workspace | Admin screens, forms, preview panes, review presentation, user action capture. | Prompt assembly, provider selection, session-memory mutation, canonical truth. | Application-provided view models, verification state, preview state. | UI-local state and user intent submissions. | UI must never assemble prompt context or infer truth on its own. |
| Workspace Application Layer | Service-only orchestration, candidate/spec request composition, source-context summary, verification gating, review handoff, accepted-delta request handling. | Canonical truth, provider transport, public read-side, direct prompt packet invention, Memory Card semantics. | Canonical service truth, Memory Card reads, prompt packet inputs, readiness inputs. | Candidate/spec artifact, audit details, workflow commands, delta proposals. | This layer orchestrates the service flow, but it does not own truth, memory, or transport. |
| Memory Card | Session-scoped working state, accepted deltas, trace pointers, archive pointer, working decisions. | Canonical content truth, publish truth, raw chat history, provider internals. | Canonical service truth, accepted deltas, system/human acceptance events. | Memory Card state store. | Only accepted deltas may mutate Memory Card; proposed deltas are not writes. |
| Prompt Packet Assembly + LLM Boundary | Prompt-safe context bundle, base prompt packet, structured output, normalization, local validation, inward result envelope. | UI state, Memory Card persistence, canonical truth, provider I/O, workflow decisions. | Canonical inputs, Memory Card, current request intent, current verification summary. | Derived prompt packet and normalized artifact or failure envelope. | One workspace action family should have one base prompt packet shape, and action-specific slices may only extend it. |
| Canonical Workflow / Truth | Entities, revisions, active published pointer, publish records, approval records, final verification state, public read projections. | Prompt assembly, Memory Card, provider behavior, workspace presentation, speculative working state. | Draft/save requests, approval and publish commands, read-side requests, verification outcomes. | Canonical DB state and public projections. | Nothing becomes durable truth until it is persisted here. |

### Important placement rules

- The Prompt Packet Assembly + LLM Boundary is the single place where canonical inputs and Memory Card are merged into a prompt packet.
- The Prompt Packet Assembly + LLM Boundary must produce one base prompt packet shape for all workspace actions that call LLM.
- Action-specific slices may extend the base packet, but they must not replace it or create parallel packet families.
- The prompt packet assembler is a pure context builder; the LLM boundary is a separate normalization and validation boundary.
- `assemblePromptPacket(...)` must stay pure and must not call the provider, mutate Memory Card, or write canonical truth.
- `requestStructuredArtifact(...)` is the only boundary call that crosses into LLM infra.
- The Memory Card is the only session-state layer that may apply accepted deltas.
- The Workspace Application Layer is the only orchestration layer allowed to request a Memory Card update after system or human acceptance.
- Verification, review, publish handoff, and UI preview read the same derived artifact slice; they do not build parallel interpretations.
- The Canonical Workflow / Truth layer remains the only place where truth becomes durable.

## 4. Cross-Layer Rules

1. UI does not assemble prompts directly.
2. UI does not talk to provider or transport code.
3. UI does not mutate Memory Card directly.
4. Memory Card does not own canonical truth.
5. Memory Card does not own publish truth.
6. Memory-affecting structured outputs are proposed deltas only.
7. Accepted memory deltas are applied only through system or human workflow.
8. Prompt assembly reads canonical inputs and Memory Card; it does not read raw provider payloads.
9. Prompt Packet Assembly + LLM Boundary normalizes and validates structured output, but it does not decide business acceptance.
10. Verification does not silently mutate canonical truth.
11. Publish workflow does not read raw LLM output as if it were truth.
12. Public Web stays read-side only and consumes published truth only.
13. Verification and preview must read the same derived artifact slice, not parallel interpretations.

My thought on the most important rule: if any layer besides the prompt packet assembler starts inventing a prompt bundle, the architecture will drift immediately.

## 5. Request Lifecycle

The service-only request flow should stay narrow and explicit:

1. A user action in the admin workspace captures service intent, proof selection, or review input.
2. The UI submits the action to the service-only application entrypoint.
3. The application layer reads canonical service truth and the current Memory Card state.
4. The Prompt Packet Assembly + LLM Boundary builds a derived prompt packet from canonical inputs plus Memory Card.
5. The Workspace Application Layer calls the Prompt Packet Assembly + LLM Boundary with the structured-output request.
6. The Prompt Packet Assembly + LLM Boundary returns a normalized artifact or a canonical failure envelope after local validation.
7. The Workspace Application Layer turns the result into a candidate/spec snapshot and, if applicable, a proposed memory delta.
8. The system or human workflow accepts or rejects the delta; only accepted deltas reach the Memory Card write API.
9. The workspace application and canonical workflow boundaries produce the machine-verifiable report and determine whether the candidate can move to review or publish.
10. The UI renders preview, verification status, blockers, and explicit review/publish actions from the same derived artifact slice.

Important sequence note:

- The candidate/spec may exist as a derived working artifact before publish.
- The verification report may exist before human approval.
- Memory Card mutation is never the same thing as publish.
- Publish remains a separate explicit action in the canonical workflow.
- The flow below is logical, not a literal straight pipe: the Workspace Application Layer reads canonical truth and Memory Card, then invokes the prompt packet assembler and LLM boundary before any workflow handoff.
- Do not use this plan to justify a Memory Card storage subsystem before the read/write API and one happy path exist.

### Minimal persistence decision

Before implementation begins, choose one minimal runtime persistence mechanism for Memory Card so the first happy path survives normal operator interaction such as refresh or route transition.

This is not a full memory platform and not a full rehydration subsystem. It only defines the minimum runtime persistence needed for one real workspace session to continue.

Possible high-level shapes include a narrow DB-backed session row, a TTL-backed session store, or a server-side session store, but this plan does not choose between them here unless current repo reality clearly forces one.

### Minimal runtime packet and API bridge

This is the narrow handoff shape the implementation should use between layers.

#### 1. Memory Card read slice

The Prompt Packet Assembly + LLM Boundary should read only this session-scoped slice from Memory Card:

- `session_id`
- `entity_type`
- `entity_id`
- `route_locked`
- `entity_locked`
- `actor`
- `base_revision_id`
- `change_intent`
- `editorial_goal`
- `variant_direction`
- `proof_selection`
- `candidate_id` or candidate pointer, if one exists
- `spec_version`
- `verification_summary`
- `active_blockers`
- `warnings`
- `recent_turn`
  - `last_change`
  - `last_rejection`
  - `last_blocker`
  - `generation_outcome`
- `trace_id`
- `request_id`
- `archive_pointer`

It must not read the full chat history, raw provider payloads, or unrelated session state.

#### 2. Prompt packet

The Prompt Packet Assembly + LLM Boundary should turn canonical truth plus the Memory Card read slice into one prompt packet shape:

- `request_scope`
  - `session_id`
  - `entity_id`
  - `route_family`
  - `base_revision_id`
- `memory_context`
  - `change_intent`
  - `editorial_goal`
  - `variant_direction`
  - `proof_selection`
  - `verification_summary`
  - `active_blockers`
  - `warnings`
  - `recent_turn`
- `canonical_context`
  - `source_payload`
  - `source_context_summary`
- `artifact_contract`
  - `artifact_class`
  - `schema_id`
  - `schema_version`
  - `response_json_schema`
  - `schema_validator`
- `action_slices` (optional)
  - narrow action-specific extension blocks for a single workspace action
- `prompt`

The prompt packet is the single derived request shape that the workspace application passes into LLM infra.

#### 3. LLM request and result

The workspace application should pass only the following minimal request shape into the structured-output boundary:

- `artifactClass`
- `schemaId`
- `schemaVersion`
- `prompt`
- `responseJsonSchema`
- `schemaValidator`

The boundary should return a canonical result envelope with:

- `status`
- `artifact` or `error`
- `retryable`
- `traceId`
- `requestId`
- `providerId`
- `modelId`
- `contractId`
- `validationState`

#### 4. Candidate bundle and memory delta

On success, the workspace application should materialize a candidate bundle with:

- `candidateId`
- `baseRevisionId`
- `routeFamily`
- `specVersion`
- `sourceContextSummary`
- `payload`
- `spec`
- `sections`

On accepted session-memory updates, the workspace application should emit only an accepted memory delta, not a direct write from the provider result.

That delta should contain only the fields being changed in Memory Card, plus trace/acceptance metadata. It should not carry a full history copy.

#### 5. Minimal read/write APIs

The practical layer boundary should stay close to these API shapes:

| API | Direction | Minimal payload | Purpose |
|---|---|---|---|
| `readMemoryCardSlice(...)` | Memory Card -> Prompt Packet Assembly + LLM Boundary | Session identity, working intent, proof selection, revision pointers, verification summary, recent-turn slice, trace pointers, archive pointer | Give the assembler the current session state without exposing full history. |
| `assemblePromptPacket(...)` | Canonical truth + Memory Card -> Prompt Packet Assembly + LLM Boundary | Canonical service truth slice plus Memory Card read slice | Produce one prompt packet shape for every workspace action that calls LLM. |
| `requestStructuredArtifact(...)` | Workspace Application -> LLM Boundary | `artifactClass`, `schemaId`, `schemaVersion`, `prompt`, `responseJsonSchema`, `schemaValidator` | Ask for a structured artifact and get a normalized inward result envelope back. |
| `materializeCandidateBundle(...)` | LLM Boundary result -> Workspace Application | Result envelope plus session context | Turn the validated artifact into the service candidate bundle. |
| `applyAcceptedMemoryDelta(...)` | Workspace Application -> Memory Card | Accepted delta, acceptance metadata, trace ids | Update session memory only after the system or human gate accepts the change. |
| `saveDraftFromCandidate(...)` | Workspace Application -> Canonical Workflow / Truth | Candidate payload plus audit details | Persist the candidate into the canonical revision workflow. |
| `buildVerificationReport(...)` | Workspace Application + Canonical Workflow boundary | Candidate bundle, readiness state, revision, LLM result | Produce the machine-verifiable report that gates review/publish. |

These API shapes are intentionally small. If a future implementation needs more data, it should first ask whether the data belongs in canonical truth, Memory Card, or derived prompt context before widening the boundary.

### Canonical derived artifact slice

Candidate/spec, verification, preview, and audit details should all point back to one canonical derived artifact slice.

That slice is the shared projection for the current run. Everything else is a pointer, projection, or view over that slice.

Do not keep separate active copies of candidate/spec in UI state, audit details, Memory Card, and verification as if they were equal sources of truth.

## 6. Write Paths / Mutation Matrix

| State | Mutability | Canonical? | Allowed writers | Notes |
|---|---|---|---|---|
| Canonical service entity / revision / publish truth | Explicit, transactional, workflow-controlled | Yes | Canonical Content / Revision / Publish Truth Layer only | Source of truth for all durable service state. |
| Memory Card active session state | Mutable during an active session | No | Memory Card after accepted delta or system/human update | Session-local working state only. |
| Prompt context bundle | Derived-only per request | No | Prompt Packet Assembly + LLM Boundary only | Rebuilt, not persisted as truth. |
| Candidate/spec snapshot | Versioned, reviewable, archival | No | Workspace Application Layer after validation | Derived artifact slice plus pointers/projections only; not a second working copy. |
| Verification report | Append-only per run | No | Workspace Application + Canonical Workflow boundary | Blocks or permits the next explicit step. |
| Preview / review projection | Derived-only | No | Workspace Application + Canonical Workflow boundary | Must share the same derived slice as verification. |
| Trace / result metadata | Append-only diagnostics | No | Prompt Packet Assembly + LLM Boundary and audit details | Diagnostic only, never business truth. |
| Archive pointer | Append-only pointer | No | Memory Card and workflow audit trail | Points to history; it is not the full history. |

The main architectural smell to avoid is a second writable copy of candidate/spec or session state hiding in UI state, audit details, and Memory Card at the same time.

## 7. Failure Boundaries

| Failure boundary | Block | What should happen | Who should see it |
|---|---|---|---|
| Config or model resolution failure | Prompt Packet Assembly + LLM Boundary | Fail before any artifact is accepted inward. | Operator and application layer. |
| Provider or transport failure | Prompt Packet Assembly + LLM Boundary | Return a retryable or non-retryable canonical failure envelope. | Application layer and workspace UI. |
| Structured output failure | Prompt Packet Assembly + LLM Boundary | Reject the provider payload; do not materialize a candidate/spec. | Application layer and workspace UI. |
| Local validation failure | Prompt Packet Assembly + LLM Boundary | Reject the artifact after normalization; no downstream truth mutation. | Application layer and workspace UI. |
| Memory delta rejection | Workspace Application / workflow gate | Keep the candidate or report if needed, but do not mutate Memory Card. | Application layer and audit trail only. |
| Verification blocker | Workspace Application / Canonical Workflow boundary | Block review or publish, but keep the failure readable and explicit. | Review UI and operator. |
| Publish blocker | Canonical Workflow / Truth | Stop publish and require explicit remediation. | Review / publish UI and operator. |

My take:

- The cleanest failure boundary is to reject early in LLM infra, reject again in local validation, and only then let verification decide whether the workflow can continue.
- If a failure needs a hidden fallback to raw text or direct memory mutation, the boundary has already been broken.

## 8. Gray Zones / Risks

These are the places where future agents are most likely to take the wrong shortcut:

| Gray zone | Why it matters | My thought |
|---|---|---|
| Memory Card runtime storage and rehydration | The docs define session-scoped semantics, but not the persistence mechanics. | Choose one minimal persistence mechanism before implementation begins, but keep the full rehydration subsystem deferred. |
| Candidate/spec duplication | Candidate/spec can appear in audit details, UI, and verification. | Keep one canonical write path and treat all other copies as derived views. |
| UI leaking into prompt logic | React components and route handlers can easily start building prompt context ad hoc. | The prompt assembler must stay separate; otherwise session memory becomes impossible to reason about. |
| Preview / verification divergence | Preview and verification must explain the same derived artifact. | If preview invents its own data slice, operators will see a different truth than the verifier. |
| LLM delta bypass | A helper that writes memory before acceptance looks convenient and is architecturally dangerous. | Memory-affecting outputs must remain proposed deltas until a human or system gate accepts them. |
| Session lifetime creep | Session memory can quietly become long-term user memory if no one names the boundary. | Reopen must mean new session from archive pointer, not resurrected hidden state. |
| Preview-model operational dependency | The current LLM baseline depends on a preview-model posture. | Keep that dependency inside LLM infra. Do not let it infect Memory Card semantics or prompt ownership. |
| Layer proliferation | The model can become too "correct" and start owning boundaries that should stay inside workflow. | Keep verification/review/publish as a protected workflow boundary, not a separate platform. |

These are the missed seams I would keep in view before anyone starts implementation:

- A single write adapter for accepted Memory Card deltas.
- A single derived artifact slice shared by prompt assembly, preview, and verification.
- A visible session boundary so operators understand when a run is new versus resumed from archive.

## 9. Smallest Safe Implementation Sequence

This is not the full build plan. It is the smallest safe sequence that would keep the architecture honest:

0. Choose one minimal Memory Card persistence mechanism for the first happy path.
1. Define one pure prompt packet assembler for the service workspace.
2. Define one narrow Memory Card read/write API for accepted deltas only.
3. Route the service generate path through that assembler and the Prompt Packet Assembly + LLM Boundary.
4. Materialize candidate/spec, preview, and verification from the same derived slice.
5. Feed review and publish handoff from the verification result, not from raw LLM output.
6. Do not add a Memory Card persistence subsystem until the read/write API and one happy path are stable.
7. Add Memory Card storage or rehydration mechanics only after the above seams are stable.

## 10. Explicit Non-Goals

This plan does not attempt to:

- expand beyond `/services/[slug]`
- design a long-term memory platform
- design vector retrieval or org-wide memory graphs
- add public AI chat or public AI memory
- redesign the page-builder or broad CMS model
- redesign the publish workflow
- replace the current LLM baseline
- introduce a new product PRD
- blur canonical truth, Memory Card state, and prompt context into one layer

## 11. Bottom Line

The cleanest practical architecture is:

`UI -> Workspace Application [hub: reads canonical truth + Memory Card] -> Prompt Packet Assembly + LLM Boundary -> Canonical Workflow / Truth`

The most important isolation rule is that Memory Card is session-scoped working state only, and the only path into it is through accepted deltas that pass the workflow gate.

If we keep that rule intact, the rest of the system can stay service-only, reviewable, and safe to evolve.
