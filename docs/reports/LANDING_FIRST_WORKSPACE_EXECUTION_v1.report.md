# LANDING_FIRST_WORKSPACE_EXECUTION_v1

## Summary

Implemented the landing-first AI workspace as the primary AI-assisted admin surface for `Экостройконтинент`, anchored to canonical `Page` truth through `pageId`.

The workspace now has:
- a sidebar entry in `AdminShell` for review-capable roles;
- a chooser route at `/admin/workspace/landing`;
- a page-scoped workspace route at `/admin/workspace/landing/[pageId]`;
- a source-editor CTA when a `Page` owner exists;
- one active workspace session per `pageId` in the MVP flow;
- shared derived-artifact usage for preview, verification, and review visibility;
- reuse of the current Memory Card runtime, prompt packet assembler, structured-output LLM boundary, and review/publish workflow.

Implementation commit:
- `6390126` - `Implement landing-first workspace`

Push status:
- pushed to `origin/main`

## What Was Implemented

- Sidebar navigation now exposes the landing workspace to `seo_manager`, `business_owner`, and `superadmin`.
- `/admin/workspace/landing` works as the chooser/resume surface and only navigates.
- `/admin/workspace/landing/[pageId]` is the dedicated workspace screen for a concrete `Page` owner.
- The source editor remains the canonical truth-editing surface.
- The workspace screen is bounded into:
  - intent composer;
  - preview;
  - Memory Card panel;
  - turn log;
  - verification and review handoff.
- Candidate generation and review handoff reuse the existing prompt assembly / LLM / review pipeline.
- The derived artifact slice is shared across preview, verification, audit details, and review visibility.
- Transitional landing-neutral wrappers were introduced so the legacy service-prefixed substrate does not define the new semantics.

## Changed Files

- Routes and pages:
  - `app/admin/(console)/workspace/landing/page.js`
  - `app/admin/(console)/workspace/landing/[pageId]/page.js`
  - `app/api/admin/workspace/landing/[pageId]/route.js`
  - `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
  - `app/admin/(console)/review/[revisionId]/page.js`
- Runtime and helpers:
  - `lib/admin/nav.js`
  - `lib/admin/landing-workspace.js`
  - `lib/landing-workspace/landing.js`
  - `lib/landing-workspace/session.js`
  - `lib/ai-workspace/memory-card.js`
- UI components:
  - `components/admin/AdminShell.js`
  - `components/admin/admin-ui.module.css`
  - `components/admin/LandingWorkspaceMemoryPanel.js`
  - `components/admin/LandingWorkspaceVerificationPanel.js`
- Tests:
  - `tests/admin-shell.test.js`
  - `tests/landing-workspace.test.js`
  - `tests/landing-workspace.route.test.js`
- Docs aligned to the new landing-first contract pack:
  - `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
  - `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
  - `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
  - `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
  - `docs/engineering/LANDING_COMPOSITION_*`
  - `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
  - `docs/engineering/LLM_*`
  - `docs/engineering/MEMORY_CARD_*`
- Report artifacts retained from the implementation pass:
  - `docs/reports/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_V1.report.md`
  - `docs/reports/LANDING_FIRST_DOMAIN_REBASE_V1.report.md`
  - `docs/reports/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_V1.report.md`

## How PageId Anchoring Was Enforced

- `pageId` is the explicit route anchor for the workspace screen and API route.
- The chooser only resumes or navigates; it does not create Page truth.
- `app/admin/(console)/workspace/landing/[pageId]/page.js` refuses non-`Page` entities and missing source truth with `notFound()`.
- `lib/landing-workspace/session.js` re-normalizes the returned session slice to the requested `pageId`, even when the stored session row is already anchored.
- `app/api/admin/workspace/landing/[pageId]/route.js` writes accepted memory deltas back with `ENTITY_TYPES.PAGE` and the concrete `pageId`.

## How Session Behavior Was Implemented

- One active workspace session per `pageId` is the MVP rule.
- Existing sessions are resumed when the chooser or the page route finds them.
- If no matching session exists, the first workspace read creates the session-scoped Memory Card state for that `pageId`.
- The Memory Card stays session-scoped working state only.
- No second landing draft store was introduced.
- No long-term memory semantics were added.

## How Transitional Naming Was Handled

- Landing-neutral wrapper modules were introduced so the new path does not read as service-first:
  - `lib/admin/nav.js`
  - `lib/admin/landing-workspace.js`
  - `lib/landing-workspace/landing.js`
  - `lib/landing-workspace/session.js`
- The review page still renders the legacy `ServiceLandingFactoryPanel` for older service revisions, but it is explicitly marked as legacy compatibility only.
- The landing workspace path itself uses landing-neutral names and semantics.

## Tests and Checks Run

- `npm test`
- `npm run build`
- Local browser smoke:
  - the admin login page rendered locally at `http://127.0.0.1:3000/admin/login`
  - `POST /api/admin/login` returned `500` in this local Windows runtime
  - this was treated as a non-authoritative local limitation because the canonical Docker + SQL runtime lives on the server

## Rollout Status

- Not deployed from this workstation.
- The repo already contains the server rollout path:
  - `build-and-publish` builds and publishes the image to GHCR on `push` to `main`
  - `deploy-phase1` is a manual dispatch workflow on the self-hosted server runner that pins `/opt/ecostroycontinent/runtime/.env` to a specific GHCR digest and then runs `docker compose up -d`
- Precise rollout prep:
  1. Merge this commit to `main`.
  2. Let `build-and-publish` publish the new image digest to GHCR.
  3. Dispatch `deploy-phase1` with the pinned `ghcr.io/kwentin3/ecostroycontinent-app@sha256:...` image ref.
  4. Verify `https://ecostroycontinent.ru/api/health` and then smoke the authenticated admin UI on the server-backed runtime.

## Remaining Known Risks

- Live authenticated browser proof on the server-backed runtime was not completed in this workstation session.
- The local Windows machine is not a faithful runtime mirror because it does not carry the server-side Docker + SQL stack.
- The review page intentionally retains the legacy service-prefixed verification panel for older service revisions, so future cleanup should keep that compatibility boundary explicit.
