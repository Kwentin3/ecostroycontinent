# LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_v1

## 1. What In The Current Track 1 Plan Is Too Rigid

The current Track 1 plan overcorrected in the right direction, but still overcorrected.

What it got right:

- it rejected engineering-console overload;
- it rejected prompt-lab drift;
- it rejected generic page-builder drift;
- it kept the source editor as truth-editing surface.

Where it became too rigid:

- it made the center feel too much like a fixed-slot form;
- it limited page-level flow too aggressively;
- it treated visual hierarchy mostly as a by-product of block choice instead of an operator decision;
- it risked pushing connective copy into a detached form/inspector feeling;
- it reduced the helper so much that it risked becoming decorative instead of useful.

The product should not swing from chaos to rigidity.

The operator does need real freedom, but the right freedom is:

- choose what gets visual weight;
- choose what proof appears compact vs dominant;
- tune how the story breathes between proof clusters;
- adjust the reading sequence inside bounded rules.

The operator does not need:

- arbitrary canvas freedom;
- arbitrary styling;
- frontend-like layout control;
- a blank design sandbox.

## 2. Refined Product Position

The refined workspace is:

- a bounded SEO landing composer;
- built around reusable proof inputs;
- with page-scoped connective copy;
- with limited but meaningful emphasis controls;
- with preview as a major working surface;
- with technical detail behind disclosure.

It is not:

- a general page builder;
- a design tool;
- a prompt lab;
- a layout engine;
- a chat product.

The product job is not "place blocks anywhere."

The product job is:

- pick the strongest proof;
- arrange persuasive hierarchy;
- write the glue that makes the page read as one argument;
- hand off a coherent landing to review.

## 3. Bounded Composition Model

## Position

The workspace should move from `fixed story stack` to `bounded composition`.

That means:

- the semantic block family remains bounded by the landing registry;
- the page still reads through a known landing structure;
- but the operator gets controlled freedom over prominence, grouping, and flow.

### What remains fixed

- header and footer are fixed shell regions;
- `Hero` remains first;
- `CTA` remains last;
- the page uses the approved landing block families only;
- the workspace does not allow arbitrary new sections or arbitrary free placement.

### What becomes flexible

- proof cluster order within a bounded range;
- which block is visually dominant;
- which proof block is compact vs expanded;
- how much connective copy sits before or between proof sections;
- whether the page reads as `proof-first`, `offer-first`, or `case-first` within bounded patterns.

### Recommended composition model

The center should be a `story rail`, not a blank canvas and not a form stack.

The story rail should support:

- one required `Hero`;
- one or two primary proof blocks in flexible order:
  - `Media`
  - `Services`
  - `Cases`
- one optional supporting explanation block;
- one required closing `CTA`.

### Bounded page-level flow presets

Allow a small set of page-level flow modes:

- `offer -> media -> services -> cases -> CTA`
- `offer -> services -> cases -> media -> CTA`
- `offer -> media -> cases -> services -> CTA`

This is enough freedom to shape persuasive rhythm without letting the operator invent arbitrary structure.

### Block grouping rule

Two proof-heavy blocks may be visually grouped as one cluster, but they still remain semantically separate blocks.

That gives the operator a way to create a strong middle section without creating a free layout system.

## 4. Semantic Order Vs Visual Emphasis Model

This distinction must be explicit.

### Semantic order

Semantic order answers:

- what comes first in meaning;
- what proves the promise;
- what closes the argument.

Semantic order remains tightly bounded.

### Visual emphasis

Visual emphasis answers:

- what gets the biggest visual weight;
- what feels dominant vs supporting;
- where the reader pauses;
- what reads as a quick scan vs a full section.

Visual emphasis should be more flexible than semantic order.

### Page-level flow

Page-level flow is not the same as block order.

It is the combined effect of:

- semantic order;
- compact vs expanded blocks;
- visual emphasis presets;
- connective copy placement.

### Critical product stance

The existing plan over-weighted semantic order and under-weighted visual emphasis.

That is the wrong tradeoff.

The operator does not need more semantic chaos. The operator needs more emphasis control.

## 5. Refined Minimum Editable Control Contract

The control contract should stay small, but it must become meaningfully useful.

## Global rules

Allowed:

- presets
- bounded toggles
- compact vs expanded modes
- emphasis levels
- alignment presets
- internal card ordering where relevant
- limited background/text treatment presets

Forbidden:

- arbitrary per-pixel sizing
- free drag-anywhere placement
- raw CSS-like property control
- arbitrary color picker freedom
- arbitrary typography freedom
- breakpoint-by-breakpoint manual design

## Shared control vocabulary

Use one compact set of shared controls across block families:

- `Prominence`: `supporting`, `standard`, `featured`
- `Density`: `compact`, `comfortable`, `expanded`
- `Alignment`: `left`, `center`
- `Surface`: `plain`, `tinted`, `emphasis`
- `Depth`: `flat`, `raised`

This is enough to create visual hierarchy without turning every block into a mini design surface.

## `landing_hero`

Allow:

- headline
- short support copy
- CTA variant
- main media selection
- prominence: `standard` / `featured`
- alignment: `left` / `center`
- surface: `plain` / `tinted`
- text size preset: `standard` / `large`

Do not allow:

- arbitrary colors
- arbitrary font selection
- arbitrary height controls

## `media_strip`

Allow:

- asset selection
- asset ordering
- layout preset: `single`, `two-up`, `strip`
- aspect behavior: `landscape`, `square`, `mixed-safe`
- density: `compact` / `comfortable`
- prominence: `standard` / `featured`
- optional caption mode: `off` / `short`
- depth: `flat` / `raised`

Do not allow:

- free masonry behavior
- arbitrary cropping tool
- arbitrary width drag handles

## `service_cards`

Allow:

- card selection
- card ordering
- cards-per-row preset: `2-up`, `3-up`
- density: `compact` / `comfortable`
- prominence: `standard` / `featured`
- intro line: `off` / `short`
- alignment: `left` / `center`
- surface: `plain` / `tinted`

Do not allow:

- arbitrary card resizing
- custom card-level visual styling

## `case_cards`

Allow:

- card selection
- card ordering
- layout preset: `grid`, `spotlight-first`
- density: `compact` / `comfortable`
- prominence: `standard` / `featured`
- intro line: `off` / `short`
- surface: `plain` / `tinted`
- depth: `flat` / `raised`

Do not allow:

- free collage-style composition
- arbitrary card-by-card layout freedom

## `content_band`

Allow:

- eyebrow
- body copy
- width behavior: `compact`, `full`
- surface: `plain`, `tinted`, `emphasis`
- text size preset: `standard`, `large`
- alignment: `left`, `center`

Do not allow:

- rich-text formatting toolbox
- arbitrary spacing system

## `cta_band`

Allow:

- CTA variant
- short CTA framing copy
- prominence: `standard`, `featured`
- alignment: `left`, `center`
- surface: `plain`, `tinted`, `emphasis`
- depth: `flat`, `raised`

Do not allow:

- design-heavy button editor
- arbitrary visual theme design

## Product rule

The operator may shape emphasis. The operator may not design the system.

## 6. Connective-Copy Placement In Workflow

The current plan was right that connective copy is page-scoped, but wrong to risk making it feel like a detached form layer.

Connective copy should live inside the composition flow itself.

### Refined rule

Every place where the page needs glue should expose a small inline writing affordance inside the story rail.

That includes:

- intro framing in `Hero`;
- short bridge before a proof block;
- transition between two proof-heavy blocks;
- short explanatory `content_band`;
- CTA framing near the close.

### Interaction model

The operator should experience this as:

- "write the line that introduces this proof"
- "add a short bridge here"
- "tighten this CTA framing"

not as:

- "open another form and fill a disconnected text field"

### Connective-copy slots

Use only a few embedded copy slots:

- `Hero support copy`
- `Proof intro`
- `Proof bridge`
- `Supporting explanation`
- `CTA framing`

This is enough. More than that starts pushing the workspace toward a CMS form builder.

### LLM role here

The LLM is most useful on connective copy, because this is exactly where the operator needs speed without losing coherence.

## 7. Refined Helper Model For MVP

The helper should stay bounded and non-chat-primary, but it should do real work.

## Recommendation

Use `contextual helper actions` plus `one lightweight helper drawer`.

### Smallest useful assistant affordances

- `Rewrite this`
- `Make this clearer`
- `Make this stronger`
- `Shorten this`
- `Suggest transition`
- `Explain blocker`
- `Suggest better proof order`

### Where they appear

- inline on selected copy areas;
- inline on selected blocks;
- in one small helper drawer attached to the current block or page flow.

### What the drawer is for

The drawer should not be a chat room.

It should show:

- current block context;
- one or two suggested rewrites;
- one short explanation of the top blocker;
- one `apply` path.

### What stays out

- open-ended multi-turn chat
- prompt editing
- persistent long conversation history
- "ask anything" assistant mode
- system diagnostics disguised as help

### Critical stance

The previous plan made the helper too small. The right answer is not a full chat rail, but it is also not a nearly invisible helper.

The MVP needs a helper that can materially improve copy and unblock flow.

## 8. Refined Context-Controls / Inspector Model

The current answer should be:

- inline quick actions first;
- floating toolbar second;
- lightweight contextual side panel third;
- right-click only as an optional shortcut.

## Recommended model

### Inline quick actions

Always visible on hover/select:

- move earlier / later where allowed
- change prominence
- change density
- edit copy
- open helper

### Floating toolbar

Appears on block select near the block.

It should contain only the most common actions:

- prominence
- density
- alignment
- helper

### Lightweight contextual side panel

The right rail changes context when a block is selected.

It should show:

- current block settings
- selected inputs
- compact copy fields
- helper suggestions

It should not be permanently heavy.

### Small-screen behavior

On smaller screens, the contextual panel becomes a bottom sheet.

### Explicitly rejected models

- always-open heavyweight inspector
- right-click-only primary control model
- settings buried in distant forms

## 9. What Remains Explicitly Forbidden

- free drag-anything-anywhere canvas
- arbitrary pixel sizing
- arbitrary styling playground
- custom typography control
- custom color system editing
- arbitrary spacing editor
- arbitrary block creation
- duplicate source editor inside workspace
- full AI chat as primary mode
- technical runtime detail on the first layer

## 10. Smallest Safe Next Implementation Slice

1. Replace `fixed slots` language and behavior with a `story rail` that allows bounded proof-cluster reordering and prominence presets.
2. Add shared emphasis controls:
   - prominence
   - density
   - alignment
   - surface
   - depth
3. Embed connective-copy slots directly into the story rail instead of pushing them into detached forms.
4. Add contextual helper actions:
   - rewrite
   - transition
   - blocker explanation
   - proof-order suggestion
5. Replace the idea of a heavy inspector with:
   - inline quick actions
   - floating toolbar
   - lightweight contextual panel

This is the smallest refinement that makes the workspace more usable without turning it into a page builder.
