# LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1

## 1. Objective

Implement the landing-first workspace as the primary AI-assisted surface for `Экостройконтинент` without rebuilding the backend, the LLM baseline, or the publish model.

The workspace must stay landing-first, stay anchored to canonical `Page` truth, and keep Memory Card, prompt assembly, artifact generation, verification, preview, and publish boundaries separate.

This plan is intentionally narrow. It exists to get a future coding agent from the current embedded-panel reality to a real landing workspace with the smallest safe surface area.

## 2. Current baseline and what is already reusable

The following pieces already exist and should be reused, not rebuilt:

- `AdminShell` for admin chrome and access gating.
- The canonical source editor for `Page` truth editing.
- The current embedded workspace panel modules and verification panel modules.
- `PreviewViewport` for deterministic preview rendering.
- `readMemoryCardSlice(...)` and `applyAcceptedMemoryDelta(...)` for session-state handling.
- `assemblePromptPacket(...)` and the existing structured-output LLM boundary.
- The current generation route / landing helper / derived artifact slice path.
- The existing review and publish workflow.
- The landing-first contract pack in `LANDING_COMPOSITION_*`.

Service-first docs and helpers remain adjacent or historical substrate only. They are reusable as legacy substrate, but they are no longer the primary target surface.

## 3. MVP target slice

The first implementation slice should be:

- one sidebar entry in admin;
- one chooser/resume route;
- one dedicated workspace route keyed by `pageId`;
- one active workspace session per `pageId`;
- one bounded interaction shell;
- one shared derived artifact slice for preview, verification, and review handoff.

The MVP is for existing `Page` owners only.

If a source entity does not yet have a `Page` owner, the workspace does not invent one. The operator must create or select the `Page` owner in the canonical source editor flow first, then open the workspace.

Creation or selection of the `Page` owner belongs to the canonical source-editor flow, not to the workspace chooser.

`landingDraftId` may remain an internal workspace handle, but it is not owner truth and it is not the route anchor.

## 4. Route and navigation plan

### Routes

| Route | Purpose | Notes |
|---|---|---|
| `/admin/workspace/landing` | Chooser / resume screen | Lists existing `Page` owners and active workspace sessions. |
| `/admin/workspace/landing/[pageId]` | Dedicated workspace screen | Anchored to canonical `Page` truth. |

### Navigation

- Add one sidebar item in `AdminShell`.
- Keep the canonical source editor navigation unchanged.
- Add a CTA from the canonical source editor to the workspace only when a `pageId` already exists.
- Do not create a new permission model; use the same admin auth / role gate as the source editor.

### Route ownership rule

- `pageId` is the canonical owner anchor.
- `landingDraftId` is only an internal workspace handle if needed.
- The workspace does not create publish-owner truth.

## 5. Entry / session lifecycle plan

### Sidebar entry

- Opens `/admin/workspace/landing`.
- The chooser shows existing `Page` owners and whether a session is active.
- Selecting an entry opens `/admin/workspace/landing/[pageId]`.
- The chooser only navigates; it does not create a second owner truth or a parallel session record by itself.

### Source-editor CTA

- Opens the workspace for the currently edited `Page` owner.
- Only appears when the source editor already has a `pageId`.
- If the source entity has no `Page` owner yet, the operator stays in the canonical source editor flow until that owner exists.

### Session behavior

- One active workspace session per `pageId` for MVP.
- If a session exists, resume it.
- If no session exists, create the first session for that `pageId`.
- Session persistence must survive refresh / route transition using the current server-side session-backed Memory Card store.
- The chooser must not create a second owner truth or a parallel landing-draft store.

## 6. Workspace screen composition

The dedicated screen should use the same admin shell as the rest of admin, but with a workspace-specific internal layout.

### Recommended composition

- Top bar:
  - landing title / working label;
  - current state summary;
  - link back to the canonical source editor;
  - link to the review queue or current review item.
- Left column:
  - source context summary;
  - selected refs / inputs;
  - Memory Card state;
  - recent turn log.
- Center column:
  - preview area;
  - bounded interaction shell;
  - action strip.
- Right column:
  - verification summary;
  - blockers / warnings;
  - candidate report;
  - handoff actions.

### Layout rules

- The workspace must not duplicate the full source editor form.
- Header and footer are fixed shell regions, not ordinary reorderable blocks.
- Preview and verification must read the same derived artifact slice.

## 7. Operator interaction model

### Minimal model

- One intent composer:
  - change intent;
  - short instruction;
  - optional evidence emphasis.
- One bounded action strip:
  - generate candidate/spec;
  - regenerate current section;
  - explain blocker;
  - send to review.
- One turn log:
  - last change;
  - last rejection;
  - last blocker;
  - generation outcome.

### What is deliberately excluded

- raw prompt editing;
- freeform multi-room chat;
- prompt-lab behavior;
- broad conversational history;
- multi-thread active sessions by default.

## 8. Truth / memory / artifact / publish boundary rules in implementation terms

1. The canonical source editor owns `Page` truth and canonical content edits.
2. The workspace reads canonical `Page` truth plus the Memory Card slice plus selected proof refs.
3. `assemblePromptPacket(...)` stays pure and is the only place where prompt context is assembled.
4. `requestStructuredArtifact(...)` crosses into the existing LLM boundary and returns a normalized inward envelope.
5. The workspace materializes a candidate bundle and a proposed memory delta from the validated result.
6. `applyAcceptedMemoryDelta(...)` runs only after system or human acceptance.
7. Preview, verification, audit details, and review visibility all read one derived artifact slice.
8. Publish freezes the approved landing draft into exactly one `Page` owner using the existing publish workflow.
9. There is no separate landing-owned published truth.
10. `landing_header` and `landing_footer` are fixed shell regions resolved from published shell truth, not ordinary composition blocks.

## 9. Reuse vs new implementation matrix

| Existing piece | Decision | New role | Notes |
|---|---|---|---|
| `AdminShell` | Reuse | Admin frame + sidebar nav | Keep auth / shell consistent. |
| Canonical source editor | Reuse | Truth-editing surface | Workspace must not replace it. |
| Embedded workspace panel modules | Reuse / wrap | Working-state visibility | Legacy service-prefixed names are okay as transitional substrate. |
| `ServiceLandingFactoryPanel` | Reuse / wrap | Verification summary | Keep behavior, not service-first semantics. Transitional name only. |
| `PreviewViewport` | Reuse | Preview area | Deterministic preview stays in one place. |
| `readMemoryCardSlice(...)` / `applyAcceptedMemoryDelta(...)` | Reuse | Session state read/write | No second memory store. |
| `assemblePromptPacket(...)` | Reuse | Pure prompt assembler | Do not add a second assembler. |
| Existing structured-output LLM boundary | Reuse | Artifact request / normalization | No provider leakage into UI or workflow. |
| Shared derived artifact slice helper | Reuse and standardize | Common run slice | Do not create parallel copies. |
| New workspace routes | New | `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]` | This is the missing UX surface. |

## 10. Ordered implementation phases

### Phase 0 - lock the owner truth and session model

- Confirm the workspace only opens for an existing `Page` owner in MVP.
- Confirm the current server-side Memory Card store is the persistence mechanism.
- Confirm one active session per `pageId`.

### Phase 1 - route and chooser

- Add `/admin/workspace/landing`.
- Add `/admin/workspace/landing/[pageId]`.
- Add the sidebar entry.
- Add the source-editor CTA for existing `pageId` owners.
- Add landing-neutral wrappers or a rename backlog for the transitional service-prefixed workspace helpers so the new code path does not keep reading as service-first semantics.

### Phase 2 - session loading and derived slice

- Load `Page` truth.
- Load Memory Card state.
- Load verification / candidate / preview state from the existing backend.
- Materialize one shared derived artifact slice.

### Phase 3 - screen composition

- Compose the screen from reused panels and a bounded interaction shell.
- Keep header/footer as shell regions, not blocks.
- Keep the source editor untouched.

### Phase 4 - action wiring

- Wire generate / regenerate / blocker explanation / send to review actions.
- Keep accepted-delta semantics explicit.
- Keep publish handoff inside the existing workflow.

### Phase 5 - focused validation

- Add tests for `pageId` anchoring, one session per `pageId`, prompt purity, derived-slice coherence, and no parallel draft stores.

## 11. Risks / gray zones

- The biggest implementation shortcut risk is letting the workspace create `Page` truth.
- Legacy service-prefixed helper names can mislead future agents into service-first semantics.
- If preview and verification do not share one derived artifact slice, the workspace will drift.
- If chooser/session ownership is not enforced, duplicate active sessions can appear.
- If header/footer are treated like blocks, shell semantics will rot into reorderable content.
- If the interaction shell grows beyond intent composer + action strip + turn log, the workspace will drift toward a prompt lab.

## 12. Explicit non-goals

- No generic page builder.
- No public AI UI.
- No broad admin redesign.
- No second publish workflow.
- No long-term memory platform.
- No multi-room chat product.
- No multiple active sessions by default.
- No workspace-created `Page` truth in MVP.
- No route expansion beyond the landing workspace surface plus the existing canonical source editor handoff.
