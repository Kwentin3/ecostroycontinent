# LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1

## Purpose

This plan sequences the landing-first composition workspace so the implementation can stay narrow, reviewable, and deterministic.

It assumes the existing LLM baseline, Memory Card semantics, and admin write-side model remain in place.

## Objective

Implement the landing-first composition workspace as the primary AI-assisted surface for the project, while keeping service pages as an adjacent route-owning SEO surface and not as the primary AI workspace target.

## Current baseline

- LLM infra baseline already exists.
- Memory Card is session-scoped and accepted-delta only.
- The admin shell and review flow already exist.
- Service route truth remains available as adjacent substrate.
- The workspace should not become a generic page builder.

## Remaining implementation scope

- landing composition candidate/spec projection
- block registry enforcement
- verification/report wiring
- preview rendering path
- publish handoff into existing workflow
- one real landing proving path

## Workstreams

| Workstream | Owns | Depends on | Does not own |
|---|---|---|---|
| Draft/spec projection | Convert structured entities and assets into the landing draft/spec view. | Landing spec contract, current truth model, LLM baseline. | Route-family expansion, raw HTML/JSX, generic page-builder freedom. |
| Block registry enforcement | Apply the allowed landing block set and reject unsupported shapes. | Block registry contract, candidate/spec projection. | Generic block platform, unrestricted composition. |
| Verification and report wiring | Produce the machine-verifiable report and gate approval/publish outcomes. | Spec projection, registry enforcement, readiness logic. | New publish architecture, public AI features. |
| Preview rendering path | Render the approved landing artifact deterministically for review/preview. | Spec, registry, verification, current renderer/runtime behavior. | Page-builder UX, design-system rewrite. |
| Publish handoff | Attach approval to the existing publish flow and pointer semantics. | Verification success, current publish semantics. | New snapshot store, bypass paths. |
| Pilot execution and QA | Prove the end-to-end flow on one real landing composition. | All prior workstreams, real content readiness. | General rollout to all surfaces, broader product scope. |

## Ordered phases

### Phase 0 - contract lock

- Finalize the landing composition contracts.
- Freeze the allowed block ids.
- Freeze the required verification outputs.

### Phase 1 - draft and spec handling

- Build the landing draft/spec projection.
- Keep canonical truth in Content Core.
- Keep the landing draft workspace-facing, not published truth.
- Ensure every publishable landing draft resolves to one canonical `Page` owner before publish.

### Phase 2 - verification and preview

- Produce the verification report.
- Block unsupported blocks and unsupported refs.
- Render preview deterministically from the approved registry.

### Phase 3 - publish handoff and rollback

- Connect approval to the existing publish path and canonical `Page` owner.
- Preserve pointer-based rollback semantics.
- Keep publish separate from draft and review state.

### Phase 4 - limited rollout

- Exercise the flow on a real landing composition.
- Confirm that the rollout does not imply route-family explosion.
- Confirm that public reads remain published-only.

## Deferred items

- `/cases/[slug]` as an AI workspace target
- `/about` and `/contacts` as AI workspace targets
- prompt-lab style UX
- public AI surfaces
- broad page-builder freedom
- replacing the current publish workflow
- solving all content/evidence gaps in code
- any route-family expansion beyond the composition workspace and the existing route-owning pages

## What should not be attempted in first rollout

- Multi-route landing generation
- A generic block editor
- New route-family ownership
- Public AI generation surfaces
- A new CMS architecture
- A new publish architecture
