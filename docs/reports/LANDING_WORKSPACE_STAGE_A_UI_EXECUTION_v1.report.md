# LANDING_WORKSPACE_STAGE_A_UI_EXECUTION_v1

## Scope

This pass replaced the old landing workspace interaction model with the real Stage A product screen for the landing-first workspace.

It was a bounded screen execution task, not a new architecture cycle and not a page-builder rollout.

## Grounding Summary

Before this pass, the runtime path already had:
- page-anchored landing workspace routing;
- generation and review handoff;
- Stage A contract/runtime support for `pageThemeKey`, `textEmphasisPreset`, and `surfaceTone`.

But the actual screen still behaved like a technical console:
- memory/session panels were foregrounded;
- verification was too verbose on the first layer;
- there was no real reusable-materials rail;
- there was no honest manual workspace edit path for Stage A fields or proof selection;
- there was no single primary page surface.

## What Was Implemented

### Current surface replaced/refined

Replaced the old three-column console-like workspace page with:
- left materials rail;
- one central page sheet for composition and preview;
- compact support rail for blockers, helper, and review handoff.

Main implementation files:
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `components/admin/LandingWorkspaceStageAScreen.js`
- `components/admin/LandingWorkspaceStageAScreen.module.css`
- `lib/admin/landing-workspace-ui.js`

### New manual workspace save path

Added a bounded manual save path to the canonical landing workspace route:
- `actionKind=save_workspace_draft`
- same page-anchored route
- same `saveDraft(...)` service path
- same verification/report pipeline
- same memory-card anchoring rules

Route file:
- `app/api/admin/workspace/landing/[pageId]/route.js`

This keeps UI actions on the same factory-backed route instead of inventing a side API.

## How Stage A Fields Are Surfaced

### `pageThemeKey`

Surfaced as a page-level atmosphere control at the top of the central page stage.

Behavior:
- contextual to the page, not repeated per block;
- uses bounded theme choices only;
- no raw color editing UI.

### `textEmphasisPreset`

Surfaced only on the selected Stage A text-bearing blocks:
- `landing_hero`
- `content_band`
- `cta_band`

Behavior:
- shown as semantic loudness controls;
- not shown as font-size or font-weight controls;
- not exposed on proof-heavy blocks.

### `surfaceTone`

Surfaced only on the same Stage A text-bearing blocks.

Behavior:
- contextual block toolbar only;
- bounded section treatment language;
- no design-sandbox behavior;
- not rolled out to `media_strip`, `service_cards`, or `case_cards`.

## Interaction Model

### Left rail

Implemented:
- reusable materials for media, services, and cases;
- visible used-state;
- explicit `Добавить` / `Убрать` logic through compact icon actions;
- explicit hero-media action for media assets;
- restrained family differentiation through marker/icon accents;
- media preview thumbnails.

Deliberately avoided:
- whole-card click opening actions;
- recommendation scoring;
- heavy CRUD-like list treatment.

### Center page surface

Implemented:
- one primary page sheet only;
- no composition rail;
- compose vs preview distinction;
- in-place block selection;
- dashed hover state in compose mode;
- solid selected state in compose mode;
- explicit `⋯` secondary action entry point;
- inline page-scoped connective copy editing;
- proof ordering controls inside proof blocks;
- hero media selection reflected directly on the page.

### Right rail

Implemented:
- compact blocker summary;
- small AI helper area with change-intent input and generate action;
- review CTA and current review link;
- small selected-block context card.

Deliberately avoided:
- dense verification console;
- full chat thread;
- giant inspector.

## What Was Intentionally Left Out

- arbitrary color picker
- arbitrary gradients or background images
- proof-heavy `surfaceTone`
- typography playground controls
- density/alignment/prominence playground
- shell editing
- full chat rail
- generic block/page-builder behavior

## Tests And Checks Run

- `npm test`
- `npm run build`

Both passed.

Additional operational checks:
- `build-and-publish` GitHub Actions run `24183485987` succeeded
- `deploy-phase1` GitHub Actions run `24184650021` succeeded
- live `https://ecostroycontinent.ru/api/health` returned `200 OK`
- live `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]` routes returned auth redirects to `/admin/login`, confirming reachability through the deployed contour

## Git Status

- Commit(s): pending
- Push status: pending

## Rollout Status

- rollout executed through `deploy-phase1`
- deployed image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:1cbd744b44a4ecf9ce5f58d0e57e73605f4e1bebb98e411592f5b4df5d16aebc`

## Known Limitations

- This pass did not perform a full authenticated operator smoke after deploy.
- Preview mode is intentionally a clean bounded workspace preview, not a full second rendering framework with every production annotation.
- Review handoff remains route-backed and test-covered, but was not manually re-auth-smoked in this pass.
- The chooser route was not broadly redesigned; the main replacement happened on the page-anchored workspace screen.
