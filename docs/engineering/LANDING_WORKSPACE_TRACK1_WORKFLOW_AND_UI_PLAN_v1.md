# LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1

## 1. Objective

Define the next correct product/UX step for the landing-first workspace:

- a real SEO-operator workflow;
- a narrow screen model that supports that workflow;
- a constrained editing model that helps composition without drifting into a page builder.

This plan is intentionally narrow. It does not reopen backend contracts, publish semantics, route ownership, or broad admin redesign.

## 2. Current Problem Statement

The current landing workspace is directionally correct, but the first visible layer is still shaped like an engineering console rather than an SEO composition tool.

What the current screen gets right:

- it is page-anchored;
- preview, verification, and review handoff are real;
- source editor remains the truth-editing surface;
- publish is still explicit and human-controlled.

What the current screen gets wrong:

- it exposes `Memory Card`, trace, candidate/spec, verification classes, and internal state too early;
- it gives equal visual weight to source context, preview, memory state, and technical verification;
- it makes the operator think about runtime state before they think about materials, narrative, and emphasis;
- it does not yet give the operator a strong "compose from meaningful pieces" workflow.

The main UX problem is not that the operator lacks enough freedom. The main UX problem is that the first layer is showing the wrong things first.

## 3. Real Operator Job And Workflow

The SEO operator is not designing a page from scratch and is not editing backend objects. The operator is assembling a persuasive landing from reusable proof material plus a small amount of page-scoped connective copy.

### Real day-to-day workflow

1. Choose the `Page` owner.
   - Enter from `/admin/workspace/landing`.
   - Open the correct page-anchored workspace.
2. Read the current landing goal.
   - Confirm what this page is trying to sell or explain.
   - Confirm whether the current version is baseline, in progress, or blocked.
3. Choose the right materials.
   - Pick the most useful media.
   - Pick the strongest service cards.
   - Pick the best case cards.
4. Build the story.
   - Decide what comes first, what proves the claim, and what closes the page.
   - Use the fixed landing structure, not a blank canvas.
5. Add connective copy.
   - Write or accept short bridging text between proof blocks.
   - Tighten headline, support copy, and CTA framing.
6. Set emphasis.
   - Decide which proof is dominant.
   - Decide which block is compact versus highlighted.
   - Avoid layout micromanagement.
7. Preview as a reader.
   - Check that the page reads as one story.
   - Check desktop/mobile quickly.
8. Check blockers.
   - Read a short operator-facing blocker summary.
   - If the blocker is a truth/data issue, jump to the source editor.
   - If the blocker is a composition/copy issue, stay in the workspace.
9. Hand off to review.
   - Review remains explicit.
   - Workspace does not publish.

### Practical rule

If the operator needs to fix canonical truth, relations, or reusable entity data, they leave the workspace and use the source editor.

If the operator needs to improve sequence, emphasis, or connective copy, they stay in the workspace.

## 4. Core Mental Model Of The Workspace

The minimum useful mental model is:

`Choose materials -> build story -> tune emphasis -> preview -> fix blockers -> hand off`

This is the right mental model because it matches the real operator job:

- choose proof;
- shape sequence;
- write the short copy that makes the sequence coherent;
- confirm the page reads well;
- send it into review.

This is the wrong mental model:

- inspect session state;
- inspect candidate/spec/runtime state;
- chat with AI until something happens;
- style arbitrary blocks.

The workspace should feel like a narrow SEO landing composer, not like a runtime dashboard and not like Figma.

## 5. Reusable Inputs Vs Page-Scoped Content

### What belongs in the reusable library

- `MediaAsset` items and lightweight `Gallery` selections
- `Service` cards
- `Case` cards
- fixed shell status references for header/footer

### What does not belong in the reusable library

- freeform text snippets as global reusable content by default
- SEO fields
- slug or route settings
- review state
- session memory or trace data
- arbitrary style tokens
- header/footer as draggable blocks

### Product position

The reusable library is an evidence library, not a design library.

It exists to help the operator choose proof, not to expose every implementation object in the system.

### Page-scoped connective copy

Connective copy should stay page-scoped by default.

That includes:

- hero framing copy;
- one supporting explanatory band;
- short transition copy between proof-heavy sections;
- CTA note and closing framing.

It should not become a new reusable content entity by default. That would create content overhead too early and push the product toward CMS complexity instead of composition speed.

## 6. Screen Model Recommendation

## Position

The primary screen model should be:

`Library on the left -> constrained composition canvas in the center -> compact checklist and review rail on the right`

This is not the same as a generic builder layout.

The center is not a free canvas. It is a fixed story stack made from the approved landing composition slots.

### Why not preview-first

Pure preview-first is too passive.

It helps inspection, but it hides the real work:

- choosing materials;
- shaping sequence;
- writing connective copy;
- setting emphasis.

Preview must stay close, but preview alone should not be the primary working mode.

### Why not action-first

Action-first turns the screen into a form plus buttons.

That reinforces the wrong operator behavior:

- type a prompt;
- hope the system does the right thing;
- inspect diagnostics afterward.

That is too close to a prompt lab.

### Why this model is correct

The left column helps the operator choose reusable inputs.

The center column helps the operator assemble the story in fixed slots.

The right column keeps blockers and handoff visible without turning them into the main task.

### Recommended first-layer layout

- Top bar:
  - page identity
  - one source-editor CTA
  - one compact state line
- Left rail:
  - `Media`
  - `Services`
  - `Cases`
  - locked shell status
- Center:
  - fixed composition slots
  - inline copy and emphasis controls
  - a `Compose / Preview` toggle
- Right rail:
  - top 3 blockers or `Ready for review`
  - review CTA
  - context-sensitive lightweight inspector when a block is selected

### Chooser screen recommendation

Keep the chooser simple.

It should do only three things:

- show the current resumed page if one exists;
- list available `Page` owners;
- open the workspace.

It should not become a planning dashboard.

## 7. Minimum Editable Control Contract Per Block

The product must be explicit here. Too many controls will turn this into a page builder.

### Allowed control types

- choose source refs
- include / exclude optional block
- select one emphasis preset
- select one layout preset where needed
- write short page-scoped copy
- reorder cards inside a block where relevant
- choose one bounded proof-order preset at page level

### Explicitly out of scope

- arbitrary drag-anywhere placement
- pixel sizing
- raw width / height controls
- free x/y movement
- arbitrary color pickers
- arbitrary typography controls
- custom shadows
- free spacing / margin editing
- custom CSS-like control sets
- per-breakpoint manual layout editing

### Page-level ordering rule

Ordering should remain mostly fixed by the landing registry.

The only allowed ordering freedom in MVP should be one bounded page-level proof-order choice:

- `media-first`
- `services-first`

`Hero` stays first.

`Case cards` stay after the core proof block.

`Content band` stays near the close.

`CTA band` stays last.

Header and footer remain fixed shell regions and are never part of block ordering.

### Per-block contract

#### `landing_hero`

Allowed:

- headline
- short supporting text
- CTA variant
- main media selection
- emphasis preset: `standard` or `high-impact`
- alignment preset: `left` or `center`

Out of scope:

- arbitrary text color
- arbitrary background color
- custom typography

#### `media_strip`

Allowed:

- choose media assets
- reorder chosen assets
- layout preset: `single`, `strip`, `two-up`
- aspect ratio preset: `landscape`, `square`
- optional short caption line

Out of scope:

- arbitrary resize handles
- free crop tool inside the workspace
- masonry/grid design freedom

#### `service_cards`

Allowed:

- choose service cards
- reorder cards inside the block
- emphasis preset: `balanced` or `highlight-first`
- optional short intro line above the cards

Out of scope:

- custom per-card styling
- card-by-card free size control

#### `case_cards`

Allowed:

- choose case cards
- reorder cards inside the block
- emphasis preset: `balanced` or `highlight-first`
- optional short proof intro line

Out of scope:

- arbitrary comparison layouts
- free visual arrangement

#### `content_band`

Allowed:

- eyebrow/subtitle
- body copy
- tone preset: `neutral` or `accent`
- width preset: `compact` or `full`

Out of scope:

- rich-text freeform formatting
- arbitrary color and spacing controls

#### `cta_band`

Allowed:

- CTA variant
- short note
- emphasis preset: `standard` or `strong`
- alignment preset: `left` or `center`

Out of scope:

- design-heavy button styling
- arbitrary layout experimentation

### Design principle behind this contract

The operator should control hierarchy and clarity, not frontend styling.

## 8. LLM Helper Role In MVP

## Recommendation

Use a bounded helper, not a chat-like panel.

### What the helper should do

- draft connective copy for the selected block
- rewrite or shorten selected copy
- suggest a stronger proof sequence
- explain blockers in operator language
- suggest a CTA phrasing variant

### What the helper should not be

- not a persistent chat sidebar
- not an open-ended prompt editor
- not the main way to operate the screen
- not the place where hidden product logic lives

### UX form

The helper should appear as:

- inline actions on a selected block
- a small contextual drawer
- one compact page-level `Help me improve this` entry point

This part of the user's instinct is right:

- downscope full chat;
- keep AI help bounded and subordinate to the composition workflow.

The dangerous version of that instinct would be to remove AI help completely and leave the operator alone with sequence and copy decisions. The right move is not "no helper." The right move is "bounded helper."

## 9. Details / Inspector Strategy

## Recommendation

Use inline quick controls plus a lightweight inspector.

### Inline controls

Every block card in the center should expose the common actions:

- choose inputs
- move earlier / later where allowed
- adjust emphasis preset
- open copy editor
- open preview focus

### Lightweight inspector

When a block is selected, the right rail should switch from the default checklist view to a lightweight inspector for that block.

The inspector should only show:

- selected inputs
- allowed presets
- short copy fields
- one or two AI helper actions

### Default right rail state

When no block is selected, the right rail should show:

- top blockers
- one short status summary
- review handoff

### Do not use

- right-click menus as the primary interaction model
- a permanently open heavyweight inspector
- a technical details rail on first load

### Mobile posture

On smaller screens, the inspector becomes a bottom sheet. The first layer stays:

- page identity
- composition stack
- preview toggle
- blockers/handoff drawer

## 10. Primary Vs Secondary Screen Layers

### Primary first visible layer

- page identity and source-editor CTA
- reusable material library
- constrained composition stack
- selected block quick controls
- `Compose / Preview` switch
- top blocker summary
- review handoff CTA

### Secondary layer

- session continuity hint
- recent step summary
- detailed blocker list
- shell status
- device switch

### Hidden or collapsed technical layer

- memory session internals
- candidate/spec IDs
- request/trace IDs
- provider/model/transport path
- verification class matrix
- section projection table
- deep audit details

The rule is simple:

If it helps engineering explain runtime truth but does not help the operator make the next landing decision, it is not first-layer UI.

## 11. Risks / Drift Warnings

### Current screen drift

The current screen is too technical, too equal-weight, and too diagnostic on first read.

### Tempting but dangerous moves

- turning the center into a free canvas
- adding raw visual style controls
- making header/footer feel draggable
- treating connective copy as a new reusable entity system
- making the helper a full prompt/chat panel
- putting verification internals on the first layer "for transparency"

### Where we must say no

- no drag-anything-anywhere freedom
- no arbitrary style inspector
- no duplicated source editor inside the workspace
- no chat-first operating model
- no technical runtime vocabulary on the primary layer

### What part of the user instinct is right

- the current screen is overloaded
- the operator needs a simpler first layer
- the hard part is story and proof selection, not block dragging
- full chat should be downscoped

### What part of the user instinct needs discipline

- a more visual workspace does not mean a free canvas
- more control does not mean style freedom
- a better composition tool does not mean a page builder

## 12. Explicit Non-Goals

- not a general page builder
- not a designer tool
- not Figma for SEO
- not a prompt lab
- not a public AI surface
- not a second source editor
- not a typography/color playground
- not a generic component canvas

## 13. Smallest Safe Next Implementation Slice

1. Replace the current left memory-first rail with a reusable materials rail:
   - `Media`
   - `Services`
   - `Cases`
   - locked shell status
2. Replace the center preview-first surface with a constrained composition stack of fixed landing slots plus a `Compose / Preview` toggle.
3. Replace the current always-open verification detail rail with a compact checklist:
   - top blockers
   - readiness summary
   - review CTA
4. Add block-level inline controls and a lightweight inspector instead of a permanent technical details rail.
5. Add bounded helper actions for copy and blocker explanation, but do not add a full chat panel.

This is the smallest slice that changes the operator experience in the right direction without reopening architecture or drifting into a page builder.
