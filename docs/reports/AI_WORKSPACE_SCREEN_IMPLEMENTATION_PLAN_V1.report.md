# AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_V1

## What gap is being closed

The current shipped AI workspace is embedded inside the source-editor right rail and uses the review page for preview.

The planned gap closure is:
- add a left-sidebar AI workspace entry;
- add a dedicated admin workspace screen;
- keep the backend unchanged;
- bring preview, memory state, and operator actions into one visible workspace surface.

## What existing pieces are reused

- `AdminShell` for admin chrome and role gating.
- `ServiceLandingWorkspacePanel` for Memory Card visibility.
- `ServiceLandingFactoryPanel` for candidate / verification reporting.
- `PreviewViewport` for preview device switching and rendering.
- `readMemoryCardSlice(...)` and `applyAcceptedMemoryDelta(...)` for session-state behavior.
- `requestStructuredArtifact(...)` for the existing generation backend.
- `buildServiceLandingDerivedArtifactSlice(...)` for the shared run slice.
- The existing review / publish workflow, unchanged.

## What new UI surface is proposed

- A landing-first route family under `/admin/workspace/landing`.
- A root workspace entry page for choosing or resuming a landing draft.
- A dedicated workspace page keyed by `pageId`, with any `landingDraftId` remaining an internal workspace handle.
- A bounded, chat-like interaction shell that uses structured actions rather than raw prompt editing.
- A single-session chooser rule: one active workspace session per `pageId`, with no parallel landing-owned draft store.

## What is intentionally NOT included

- No backend rebuild.
- No new generation endpoint.
- No page-builder behavior.
- No public AI UI.
- No general chat product.
- No broad admin redesign.
- No new long-term memory system.
- No new publish workflow.

## What the smallest safe implementation step should be

1. Add the sidebar entry.
2. Add `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]`.
3. Reuse the existing workspace backend and Memory Card loader paths.
4. Render the dedicated screen with reused workspace, verification, and preview components.
5. Keep the source editor as the canonical truth-editing surface with a link into the new workspace.

## Notes on the current reality

The dedicated workspace screen does not exist yet in code. The backend is already in place, so the work is primarily a UI-surface and navigation change, not a backend rewrite.
