# LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_V1.report

## Scope

Refined the Track 1 workflow/UI plan so it stays bounded without becoming too rigid and slot-like.

No code was changed. No architecture was reopened.

## What The Previous Plan Overcorrected

The previous plan correctly rejected:

- engineering-console overload
- prompt-lab drift
- generic page-builder drift
- open-ended AI chat

But it overcorrected by making the composition model too close to a fixed stack.

## Refined Position

The workspace should be:

- a bounded SEO landing composer
- with reusable proof inputs
- with page-scoped connective copy
- with meaningful emphasis controls
- with preview as a major surface
- with technical detail behind disclosure

## Main Refinements

1. Replace `fixed story stack` with a `story rail`.
2. Keep semantic order tightly bounded, but allow more freedom in visual prominence and proof-cluster flow.
3. Expand the minimum control contract to include useful presets:
   - prominence
   - density
   - alignment
   - surface
   - depth
4. Move connective copy into the composition flow itself as embedded glue, not detached form fields.
5. Keep the helper bounded, but make it materially useful through contextual actions and a lightweight helper drawer.
6. Use inline actions + floating toolbar + lightweight contextual panel instead of a heavyweight inspector.

## Critical Stance

What freedom is actually needed:

- emphasis
- compact vs expanded treatment
- proof ordering within bounded ranges
- embedded connective copy

What freedom is dangerous:

- free canvas
- arbitrary styling
- arbitrary layout control
- full chat-first behavior

What remains hard-bounded:

- approved landing block families only
- `Hero` first
- `CTA` last
- fixed shell regions
- source editor remains truth-editing surface

## Deliverables

- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_v1.md`
- `docs/reports/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_V1.report.md`

## Verdict

The right middle is not fixed-slot rigidity and not builder chaos.

It is bounded composition with real emphasis controls.
