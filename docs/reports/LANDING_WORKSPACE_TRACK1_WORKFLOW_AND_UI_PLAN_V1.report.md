# LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_V1.report

## Scope

Produced a narrow product/UX plan for Track 1: the SEO-operator workflow and the landing composition workspace experience.

No code was changed. No backend redesign was proposed.

## Grounding Summary

The current landing-first workspace is live, page-anchored, and no longer blocked by the earlier revision-save bug. The main remaining product problem is not runtime architecture. It is first-layer UX:

- the current workspace shows too much memory/verification/runtime vocabulary too early;
- the operator needs help choosing proof, shaping sequence, and writing connective copy;
- the workspace must stay bounded and must not drift into a generic page builder or prompt lab.

## Core Position

The workspace should be positioned as a narrow SEO landing composer:

- not a general page builder
- not a designer tool
- not a prompt lab
- not a visual editor for everything

## Main Recommendations

1. Use the workflow:
   - choose materials -> build story -> tune emphasis -> preview -> fix blockers -> hand off
2. Make the primary screen model:
   - library on the left -> constrained composition canvas in the center -> compact checklist/review rail on the right
3. Keep reusable inputs limited to:
   - media/galleries
   - service cards
   - case cards
   - locked shell status only
4. Keep connective copy page-scoped by default.
5. Allow only bounded emphasis/layout presets, not free styling controls.
6. Use a bounded LLM helper, not a chat-like panel.
7. Replace the current technical first layer with:
   - composition-first UI
   - collapsed technical detail layer

## Critical Stance

What the current screen does wrong:

- it behaves like a runtime console on first read;
- it gives memory and verification internals too much weight;
- it does not foreground material choice and story construction strongly enough.

What is tempting but dangerous:

- free canvas
- open-ended style controls
- full AI chat rail
- duplicating the source editor inside the workspace

Where the plan says "no":

- no page-builder freedom
- no design-tool behavior
- no chat-first workflow
- no technical diagnostics in the main layer

## Smallest Safe Next Slice

The next implementation slice should:

1. introduce a materials rail;
2. turn the center into a fixed-slot composition stack with `Compose / Preview`;
3. compress the right rail into blockers + review;
4. move session/verification internals behind disclosure;
5. add bounded block-level helper actions instead of a chat panel.

## Deliverable

Main plan:

- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`

## Verdict

The right next step is a workflow-first simplification, not more backend work and not more visual freedom.
