# AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1

## 1. Objective

Close the visible UX gap between the expected AI-assisted landing workspace and the current shipped implementation by adding one dedicated admin workspace screen for landing composition.

The scope is intentionally narrow:
- reuse the existing backend, Memory Card runtime, prompt packet boundary, and verification/review flow;
- add a real sidebar entry and a dedicated screen;
- keep the current source editor and review flow intact as adjacent surfaces;
- avoid rebuilding the backend or turning the workspace into a prompt lab.

## 2. Current Reality vs Expected UX

### Current shipped reality

- No sidebar entry for AI workspace exists in `AdminShell`.
- No dedicated AI workspace route/page exists under `app/admin`.
- The current AI surface is an embedded right-rail panel inside the canonical source editor.
- Preview is currently visible on the review page, not in a dedicated workspace screen.

### Expected UX baseline

- A left sidebar entry such as `AI-верстка` or `Landing workspace`.
- A dedicated admin screen for landing composition.
- A visible preview area on that screen.
- An operator-facing AI interaction surface.
- Landing-first composition and review flow reused from the existing backend.

### Gap statement

The gap is not a backend capability gap. It is a surface and navigation gap:
- the backend path exists;
- the current UI is embedded, not dedicated;
- the preview is split across review instead of living inside the workspace surface.

## 3. Target UI Scope

The first dedicated workspace screen should cover only the landing-first AI workflow:

- current landing context;
- Memory Card working state;
- AI interaction surface;
- preview;
- verification summary and blockers;
- explicit review handoff.

It should not become:
- a general editor for all content types;
- a public AI chat surface;
- a prompt lab;
- a page-builder replacement.

## 4. Proposed Route and Navigation Model

### Route model

| Route | Purpose | Notes |
|---|---|---|
| `/admin/workspace/landing` | Workspace entry / landing chooser / resume screen | Sidebar entry lands here. It stays landing-first. |
| `/admin/workspace/landing/[pageId]` | Dedicated AI workspace screen for one Page owner | This is the primary workspace screen. |

`landingDraftId` remains an internal workspace handle, not a separate owner truth. The route is keyed by `pageId` so the screen stays anchored to canonical `Page` truth.

### Navigation model

- Add one new sidebar item in `AdminShell`, visible only to users who can work on landing composition.
- Keep the existing source editor navigation unchanged.
- Add a small CTA from the canonical source editor to open the dedicated landing workspace seeded from the current source entity or draft.

### Access model

- Use the same admin authentication and role gating as the source editor.
- Do not create a new permission model.
- Do not expose the route to public users.

## 5. Proposed Screen Composition

The dedicated screen should use the same `AdminShell` wrapper as the rest of admin, but with a workspace-specific internal layout.

### Recommended composition

- Top bar:
  - landing title / working label;
  - current state summary;
  - link back to the canonical source editor;
  - link to the review queue or current review item.

- Left column:
  - current landing context summary;
  - current source refs and selected inputs;
  - Memory Card state and recent turn history.

- Center column:
  - preview area;
  - lightweight AI interaction surface;
  - action buttons for generation / regeneration / blocker explanation.

- Right column:
  - verification summary;
  - blockers and warnings;
  - candidate/spec summary;
  - handoff actions into review.

### Important boundary

The dedicated screen should not duplicate the full canonical editor form. The source editor remains the truth-editing surface for canonical content; the workspace screen is the AI-assisted composition and review surface.

## 6. Reuse vs Move vs New Surface Matrix

| Existing piece | Decision | New role | Why |
|---|---|---|---|
| `AdminShell` | Reuse with one nav item added | Sidebar entry and admin shell frame | Keeps admin styling and role gating consistent. |
| Canonical source editor | Reuse as-is; do not move wholesale | Canonical truth-editing surface | Avoids duplicating truth editing inside the workspace screen. |
| `ServiceLandingWorkspacePanel` | Reuse and possibly wrap | Memory Card / working-state panel on the dedicated screen | This is already the session-state summary surface. |
| `ServiceLandingFactoryPanel` | Reuse | Verification summary / candidate report | Already renders the verification state. |
| `PreviewViewport` | Reuse | Dedicated screen preview area | Already provides device switching and a stable preview shell. |
| `readMemoryCardSlice(...)` | Reuse | Workspace loader input | Keeps session state reads narrow and canonical. |
| `applyAcceptedMemoryDelta(...)` | Reuse | Write-back after acceptance | Preserves accepted-delta-only semantics. |
| `requestStructuredArtifact(...)` | Reuse | Generation entrypoint | No second generation backend should be added. |
| `buildServiceLandingDerivedArtifactSlice(...)` | Reuse and standardize | Shared run slice for preview / verification / audit | Reduces duplicate artifact projections. |
| New workspace route pages | New | Dedicated AI workspace screen and chooser | This is the missing UX surface. |

`ServiceLandingWorkspacePanel`, `ServiceLandingFactoryPanel`, and `buildServiceLandingDerivedArtifactSlice(...)` are transitional names only. They are acceptable as legacy substrate, but the implementation should treat them as landing-neutral wrappers or cleanup candidates, not as the semantic model for the new landing-first workspace.

Phase 1 or 2 should include landing-neutral wrappers or a rename backlog for these transitional names so future code does not keep reading them as service-first semantics.

## 7. Landing Workspace Entry Flow

### Entry options

1. Sidebar entry
   - User clicks `AI-верстка` in the admin sidebar.
   - They land on `/admin/workspace/landing`.
   - The page lists `Page` owners and shows whether each owner has an active workspace session.
   - If a session exists, the chooser offers `Continue`.
   - If no session exists, the chooser offers `Open workspace`, and the first real session is created on `/admin/workspace/landing/[pageId]`.
   - The chooser only navigates; it does not create a second owner truth or a parallel session record by itself.

2. Source-editor CTA
   - User is editing a source entity on its canonical editor screen.
   - A compact CTA opens `/admin/workspace/landing/[pageId]`.
   - This keeps the canonical editor and the AI workspace connected without duplicating the whole form.
   - Creation or selection of the `Page` owner remains outside the workspace and belongs to the canonical source-editor flow.

### What should happen on entry

- Resolve the selected source entity or `Page` owner.
- Load the current Memory Card slice for that session.
- Load the current candidate/spec / verification state from the existing backend.
- Render the dedicated workspace screen.

### Session ownership rule

- The chooser may resume one active workspace session per `pageId`.
- If no active session exists, opening the workspace creates the first session for that `pageId`.
- The chooser must not create a second owner truth or a parallel landing draft store.

## 8. Operator Interaction Model

The interaction model should feel conversational, but stay constrained.

### Recommended minimal model

- One intent composer:
  - change intent;
  - short instruction;
  - optional evidence emphasis.

- One bounded action strip:
  - Generate candidate/spec;
  - Regenerate current section;
  - Explain blocker;
  - Send to review.

- One action log:
  - recent turn summary;
  - outcome;
  - blocker or warning notes;
  - trace pointers.

### What it must not become

- not a raw prompt editor;
- not a multi-room chat product;
- not a general AI playground.

### Prompt discipline rule

The screen may accept action-specific extensions, but it must always use the same base prompt packet shape and the same prompt assembler boundary. The operator should never edit provider prompts directly.

## 9. Preview / Verification / Review Handoff Model

### Preview

- Preview on the dedicated screen should reuse the same preview machinery as review.
- It should render the same derived artifact slice that verification uses.
- The dedicated screen may host the preview in the center column or a pinned preview pane, but it should not invent a second preview truth.

### Verification

- Verification summary should reuse the existing verification report path.
- The workspace screen should show blockers, warnings, and candidate/report state before review handoff.

### Review handoff

- The workspace screen should hand off into the existing review queue and revision review screens.
- Publish remains explicit and human-controlled.
- The workspace must not create a second publish truth.

### Rule

Preview, verification, audit details, and review visibility must all derive from one shared run slice, not from parallel reserialization of the same candidate/spec.

## 10. Phased Implementation Plan

### Phase 1

- Add the sidebar entry.
- Add `/admin/workspace/landing`.
- Add `/admin/workspace/landing/[pageId]`.
- Add landing-neutral wrappers or a rename backlog for the transitional service-prefixed workspace helpers so future code does not keep reading them as service-first semantics.
- Wire the workspace screen to existing backend data and Memory Card reads.
- Keep the existing source editor unchanged except for a small CTA into the new screen.

### Phase 2

- Compose the dedicated screen from reused panels and a small interaction shell.
- Render preview and verification in the workspace screen.
- Keep the current review page as the final workflow surface.

### Phase 3

- Tighten the interaction model:
  - intent entry;
  - action buttons;
  - derived turn log;
  - stable handoff state.
- Add focused tests for reachability and surface coherence.

### What should wait

- full conversational chat history;
- any new memory persistence mechanics beyond the existing session row model;
- moving the entire source editor form into the workspace;
- any page-builder behavior;
- any backend redesign or new generation endpoint.

## 11. Risks / Gray Zones

- The current backend supports generation and review, not an unconstrained chat loop. The first dedicated screen should therefore be structured, not freeform.
- If the workspace screen duplicates the full editor form, it will create a second truth surface.
- If preview and verification do not share the same derived slice, they will drift.
- If the root route has no source chooser, the sidebar entry will feel empty.
- If the workspace becomes a second place to edit canonical truth, the source editor and workspace will compete.
- If a new route is added without a back-link to the source editor, operators may lose the canonical editing path.

## 12. Explicit Non-Goals

- No homepage workspace.
- No cases/about/contacts workspace.
- No public AI UI.
- No prompt-lab surface.
- No page-builder.
- No broad admin shell redesign beyond one workspace nav item and the route wiring needed to reach it.
- No new backend architecture.
- No new LLM provider or transport design.
- No new long-term memory platform.
- No new publish workflow.

## 13. Bottom Line

The smallest correct way to close the UX gap is:

1. add one sidebar entry;
2. add one landing workspace route family;
3. reuse the existing backend, Memory Card, prompt packet, verification, and review handoff;
4. keep the canonical source editor intact as the truth-editing surface;
5. make the dedicated workspace the AI-assisted composition and preview surface.
