# LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_V1

## What the primary execution target is

The primary execution target is the landing-first workspace anchored to canonical `Page` truth.

Service pages under `/services/[slug]` remain adjacent SEO truth, but they are not the primary AI workspace target.

## What exact MVP surface is planned

- `AdminShell` sidebar entry.
- `/admin/workspace/landing` chooser / resume route.
- `/admin/workspace/landing/[pageId]` dedicated workspace route.
- One bounded interaction shell with preview, verification, and review handoff.

## What is reused unchanged

- Canonical source editor for truth editing.
- Current embedded workspace / verification panels as reusable surfaces.
- `PreviewViewport`.
- `readMemoryCardSlice(...)` and `applyAcceptedMemoryDelta(...)`.
- `assemblePromptPacket(...)`.
- Existing structured-output LLM boundary and result envelope.
- Existing review / publish workflow.
- The current server-side session-backed Memory Card store.

## What is newly built

- Landing-first workspace route pages.
- Sidebar navigation entry.
- Page-keyed chooser / resume UX.
- Session ownership guard for one active session per `pageId`.
- Workspace screen composition around a bounded operator interaction shell.

## What is explicitly excluded from MVP

- Workspace-created `Page` truth.
- Multiple active sessions by default.
- Prompt lab behavior.
- Public AI chat.
- Generic page-builder behavior.
- New publish workflow.
- Broad admin redesign.

## What the most important implementation rule is

One active workspace session per `pageId`, with `pageId` as the canonical owner anchor and no separate landing-owned published truth.

## What the smallest first code step should be

Add `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]` behind the admin shell, with a loader that resolves an existing `Page` owner and resumes or creates the single session for that `pageId`.

