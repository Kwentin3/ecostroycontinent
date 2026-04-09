# LANDING_COMPOSITION_CONTRACT_EXTENSION_PLAN_v1

## 1. Why Contract Extension Is Needed Now

The current landing composition contract pack is already strong enough to support a bounded landing workspace, but the latest workflow/UI work exposed a real gap.

What is already contract-strong:
- closed landing block registry;
- deterministic render and publish gating;
- reusable proof references;
- structured copy for `hero`, `content_band`, and `cta_band`;
- review and verification discipline.

What is now too weak for the emerging SEO workflow:
- semantic visual weight of page-scoped copy;
- page-level visual atmosphere;
- bounded block-level surface differentiation;
- contract-backed color consistency mechanisms;
- explicit readability/contrast guardrails for new visual-semantic controls.

The current mockups and workflow docs are correctly discovering that SEO operators need more than block presence and copy fields. They need a bounded way to make one proof feel primary, another feel quieter, and the whole page read as one coherent commercial argument.

The current engineering contract does not yet express that layer strongly enough.

This plan exists to extend the contract just enough to support that workflow without sliding into a general page builder.

## 2. Current Strong Contract Areas

The current contract pack is already strong in:
- bounded page structure through a closed block registry;
- explicit `Page` owner truth and publish discipline;
- entity-backed references to `MediaAsset`, `Service`, and `Case`;
- deterministic preview/public render semantics;
- structured copy in `landing_hero`, `content_band`, and `cta_band`;
- verification outputs and approval/publish gates;
- shell-region separation from ordinary composition blocks.

These areas do not need philosophical reopening. Any extension should layer on top of them.

## 3. Current Weak Or Absent Contract Areas

The contract is currently weak, partial, or absent in these areas:
- text emphasis as semantic loudness;
- page-level color/background treatment;
- block-level surface treatment;
- color consistency mechanisms tied to tokens/themes;
- readability/contrast semantics for new visual treatments;
- bounded layout-density and proof-emphasis semantics;
- explicit distinction between contract fields, token references, and UI-only conveniences.

Critical stance:
- the UI/workflow work is right that this layer matters;
- the current mockups overreach where they treat `prominence`, `density`, `alignment`, and `surface` as if they are already contract-backed;
- the next move is not to implement mockup controls directly;
- the next move is to define the smallest safe contract extension that makes those controls honest.

## 4. Capability-Extension Matrix

| Capability | Level | Current contract status | Why extension is or is not needed | MVP recommendation | Drift risk | Rationale |
|---|---|---|---|---|---|---|
| `textEmphasisPreset` for page-scoped framing copy | block | unsupported as named field | Real workflow needs semantic loudness without raw typography control. This is the clearest missing contract field. | extend now | medium | Model semantic weight as bounded presets, not as font-size/weight freedom. |
| `pageThemeKey` for page-level atmosphere | page + theme/token | unsupported | Page atmosphere clearly affects SEO/operator judgment and reading coherence. The contract needs a safe page-level scene control, but that does not have to mean fixed theme keys forever. | extend now | medium | Start with theme/token references, while leaving explicit room for a future bounded custom page palette path. |
| Block-level `surfaceTone` tied to page theme | block + theme/token | unsupported | Useful for hero/content/cta distinction and bounded visual hierarchy. | extend now, but only for selected block families | medium | Keeps visual differentiation bounded and theme-consistent. |
| Theme/token registry for landing composition | theme/token | unsupported in current landing contracts | Needed so page and block treatments reuse an approved palette system instead of drifting into ad hoc colors. | extend now | low | This is the core consistency mechanism. |
| Verification for contrast/readability on resolved theme + surfaces | verification | partial; current verification is editorial/structural, not visual-semantic | Once visual-semantic fields exist, readability failures become real publish risks. | extend now alongside contract extension | low | Guardrails belong in verification, not in the main first-layer UI. |
| Explicit order semantics for refs inside proof blocks | block | implicit | Already matters in render/runtime and should become more explicit if UI will expose it. | extend now as clarification, not a broad redesign | low | This reduces ambiguity without widening product scope. |
| `densityPreset` for block rhythm | block | unsupported | Useful, but more layout-like than semantic. Not the smallest safe extension. | extend later | medium | Better after theme and surface semantics are locked. |
| `prominencePreset` for whole proof blocks | block | unsupported | Product need is real, but this is broader and easier to overuse than text emphasis. | extend later | high | Add only after Stage A fields prove stable. |
| `alignmentPreset` | block | unsupported | Low-value compared to text emphasis and surface. Easy to become layout tinkering. | ui-only for mockups / wait | medium | Not strong enough for immediate contract elevation. |
| `mediaLayoutMode` | block | unsupported as strong contract field | Potentially useful, but layout-heavy and not yet the core workflow blocker. | extend later | medium | Revisit after Stage A, and only with very small preset sets. |
| `surfaceTone` on proof-heavy blocks | block + theme/token | unsupported | There is a plausible bounded use for proof-cluster grouping, especially when operators need one proof section to read as a stronger cluster. | extend later | medium | Valid Stage B candidate for `media_strip` or `case_cards`, but too early for Stage A. |
| `serviceCardLayoutMode` / `caseCardLayoutMode` | block | unsupported | Tempting but high drift risk toward layout engine behavior. | future / reject for MVP | high | The product is not a card-layout lab. |
| Page-level direct color values | page | unsupported | Solves flexibility but creates inconsistency and builder drift. | reject | high | Raw color values are too much freedom for MVP. |
| Block-level direct color values | block | unsupported | Same problem, but even worse at local drift level. | reject | high | Violates bounded-composition posture. |
| Arbitrary gradients / background images | page or block | unsupported | Attractive in mocks, but not needed for MVP and highly builder-like. | reject | high | This is exactly the kind of freedom that should stay out. |
| Depth/shadow presets | block | unsupported | Nice-to-have styling polish, not core SEO workflow unlock. | future | medium | Can wait until real semantic controls stabilize. |
| UI color-picking helpers, sampled color, copy/apply treatment | ui-only | unsupported as contract concern | Useful for consistency, but should not bloat spec. | ui-only | low | Keep convenience in UI, but back it with tokens. |
| Generic bridge slot between any two blocks | block/page | unsupported | The workflow wants more glue, but generic between-any-two-block slots are too loose. | reject for now | medium | Prefer bounded copy fields or explicit future slot objects, not arbitrary bridge rows. |
| Shell-specific per-page styling | shell | unsupported | Breaks shell stability and global consistency. | reject | high | Shell stays fixed and derived from published shell truth. |

## 5. Proposed Minimal MVP-Safe Extension Set

The smallest safe extension set is not “all the controls from the mockups.”

It is exactly this:

### A. Add `pageThemeKey`

Add one page-level field that points to an approved landing theme token set.

Intent:
- define overall page atmosphere;
- define base background/text/accent token family;
- keep visual choices coherent across blocks;
- avoid raw color entry.

Recommended shape:
- page-level contract field only;
- required or strongly recommended for new landing drafts;
- value is a reference key, not raw color payload.

Important refinement:
- Stage A should start with preset-based `pageThemeKey`;
- the plan should not assume that page-level atmosphere must forever remain preset-only;
- a later bounded page-level palette path is allowed as a valid extension candidate if it stays token-backed, verification-guarded, and consistency-aware.

That means the contract should leave conceptual room for a future field such as:
- a bounded page palette override object or palette reference set;
- still token-resolved;
- still validated for contrast/readability;
- still far away from arbitrary freeform styling.

### B. Add `textEmphasisPreset` for page-scoped copy blocks

Add a bounded semantic text-weight preset for text-bearing, page-scoped blocks.

Intent:
- let operators make copy read as stronger, standard, or quieter;
- keep this tied to semantic intent, not typography micromanagement.

Recommended shape:
- block-level field;
- enum, not numeric font size;
- applies only to block framing copy, not reusable entity internals.

Discipline rule:
- `textEmphasisPreset` means semantic loudness, not typography freedom;
- it may influence renderer-selected text scale/weight/tone indirectly;
- it must not expose raw `fontSize`, `fontWeight`, font-family, line-height, or arbitrary typographic styling controls;
- the operator is choosing how loudly a section speaks, not designing typography.

### C. Add `surfaceTone` for selected block families

Add one bounded block-level surface treatment field that resolves through the page theme.

Intent:
- distinguish primary sections from supporting sections;
- create page rhythm without free styling.

Recommended shape:
- block-level field;
- token-resolved preset, not raw background values;
- available only on blocks where surface treatment is meaningfully useful.

### D. Add a minimal theme/token contract layer

The main spec should not absorb raw visual values. It should reference a compact theme/token layer.

Intent:
- preserve consistency;
- allow future palette growth without rewriting the draft schema;
- keep UI freedom bounded by approved token systems.

Clear separation:
- contract fields own editorial/compositional intent such as `pageThemeKey`, `textEmphasisPreset`, and `surfaceTone`;
- token/theme registry owns resolved color families, approved pairings, foreground/background mappings, and contrast-safe combinations;
- UI-only helpers own convenience behavior such as recent colors, copy/apply treatment, or reuse-this-page-accent suggestions.

This separation should stay explicit in future contract docs so that color freedom does not accidentally leak into the draft schema.

### E. Extend verification for readability failures

Once new visual-semantic fields exist, verification must check whether the resolved result stays readable.

Intent:
- prevent obvious failures like white-on-white, dark-on-dark, or unreadable accented text;
- keep these as editor/review guardrails, not as arbitrary user restrictions.

## 6. Page-Level Vs Block-Level Vs Token-Level Distinctions

This distinction must be explicit or the workspace will drift.

### Page-level contract

Good page-level extension candidates:
- `pageThemeKey`
- later, a bounded page palette control path that still resolves through approved tokens

Why page-level:
- page atmosphere needs coherence;
- this is where overall background/text/accent family belongs;
- page-level treatment should not be reconstructed ad hoc from block-local settings.

Important guardrail:
- page-level contract may carry chosen palette intent;
- it should not carry arbitrary raw color values in Stage A;
- any future bounded custom palette path must still be expressed as controlled token references or a tightly bounded palette object, never as unconstrained visual styling.

### Block-level contract

Good block-level extension candidates:
- `textEmphasisPreset`
- `surfaceTone`
- explicit ref ordering clarification for proof blocks

Why block-level:
- the operator is shaping section emphasis and rhythm;
- these controls belong to semantic sections, not to the whole page or to raw UI state.

### Shell-level contract

No meaningful MVP extension should be added here.

Rule:
- shell regions remain fixed;
- shell should consume page theme passively if the renderer later supports that;
- shell is not a first-class styling surface for per-page operator control.

### Theme/token-level contract

This is the correct home for:
- allowed color families;
- foreground/background/accent mappings;
- contrast-safe text pairings;
- optional theme scene variants.
- any future bounded custom page palette primitives, if they are added later

Rule:
- token registry owns actual color values and resolved combinations;
- page and block contracts only reference approved keys.
- token registry, not the page draft, should remain the home of actual hex/RGB-like values.

### UI-only conveniences

These should remain out of contract for now:
- copy/apply style shortcuts;
- “reuse this page’s accent” helpers;
- sampled-color suggestions;
- smart warnings about near-duplicate tones.
- recent-colors trays or reuse-last-treatment shortcuts

These are useful, but they are tooling behaviors, not composition truth.

## 7. Guardrails And Verification Implications

Once the contract grows into visual-semantic controls, verification must grow too.

### Minimum guardrail posture

#### Hard blockers

Use blockers for obvious readability failures in text-bearing regions:
- unreadable foreground/background pairing;
- contrast collapse in `landing_hero`, `content_band`, or `cta_band`;
- theme/block combinations that make required copy unreadable.

#### Warnings

Use warnings for softer issues:
- weak visual separation between adjacent sections;
- overuse of accent surfaces on too many blocks;
- low contrast in secondary/supporting supporting text that remains technically readable but editorially weak.

### Where guardrails live

- contract: defines the existence and allowed values of fields;
- token registry: defines approved pairings and resolved values;
- verification: checks whether the resolved page remains readable and coherent;
- UI: may show local warnings, but must not become the only enforcement point.

### Critical stance on contrast

Contrast should not be modeled as a raw user-editable parameter.

It should be a verification outcome over resolved theme + block settings.

That keeps the operator in content/composition mode while still preventing obviously bad results.

## 8. Block-Family Analysis

### `landing_hero`

Extension candidates that make sense now:
- `textEmphasisPreset`
- `surfaceTone`
- inheritance from `pageThemeKey`

Why:
- hero framing is page-scoped;
- hero carries the main commercial signal;
- hero is where semantic loudness matters most.

Do not add now:
- raw typography controls;
- arbitrary hero background imagery;
- arbitrary color pickers.

### `media_strip`

Extension candidates that make sense now:
- stronger explicit ref ordering semantics

Maybe later:
- `mediaLayoutMode`
- bounded density behavior
- bounded `surfaceTone` if proof-cluster grouping turns out to be a real operator need and can remain token-backed

Do not add now:
- block surface styling as an independent design tool;
- raw color/background editing.

### `service_cards`

Extension candidates that make sense now:
- stronger explicit ref ordering semantics

Maybe later:
- bounded prominence/layout mode after Stage A proves stable

Do not add now:
- per-card styling;
- typography overrides;
- color controls.

### `case_cards`

Extension candidates that make sense now:
- stronger explicit ref ordering semantics

Maybe later:
- bounded spotlight/grid mode if the renderer and verification can keep it deterministic
- bounded `surfaceTone` for proof-cluster grouping if the page needs a stronger trust band before CTA

Do not add now:
- visual freedom beyond token-backed section treatment.

### `content_band`

Extension candidates that make sense now:
- `textEmphasisPreset`
- `surfaceTone`
- inheritance from `pageThemeKey`

Why:
- this block exists precisely to carry page-scoped explanation and transition logic;
- it is the cleanest place to express semantic emphasis without touching reusable entity truth.

### `cta_band`

Extension candidates that make sense now:
- `textEmphasisPreset`
- `surfaceTone`
- inheritance from `pageThemeKey`

Why:
- CTA framing is page-scoped;
- visual emphasis matters commercially here;
- bounded presets are enough.

### Shell regions

Do not extend now.

Rule:
- shell remains fixed, globally sourced, and non-compositional.
- If a later renderer wants shell/theme interplay, it should derive from `pageThemeKey`, not from page-specific shell editing.

### Page-level composition context

Extension candidates that make sense now:
- `pageThemeKey`

Why:
- overall atmosphere is a real product need;
- the page needs a coherent visual scene;
- this is safer at page-level than through many block-local color knobs.

## 9. Explicit Non-Goals

Do not add now:
- arbitrary page backgrounds;
- arbitrary gradients;
- arbitrary background imagery;
- raw color values in the landing draft;
- arbitrary typography controls;
- arbitrary spacing/layout controls;
- free canvas behavior;
- shell-level styling freedom;
- per-card design controls;
- a general visual editor grammar.

Do not treat the current mockups as authority for all surfaced controls. Several of their controls are still exploratory and must remain so until contract-backed.

## 10. Staged Rollout Plan

### Stage A: smallest safe contract additions

This is the recommended immediate contract-extension slice.

1. Extend the landing composition spec with:
   - `pageThemeKey`
   - `textEmphasisPreset` on `landing_hero`, `content_band`, `cta_band`
   - `surfaceTone` on `landing_hero`, `content_band`, `cta_band`
2. Add a compact landing theme/token registry contract that defines:
   - allowed theme keys;
   - token families for background/text/accent/surface;
   - approved surface-tone mappings within a theme.
3. Extend verification contract with:
   - resolved readability/contrast checks for text-bearing blocks;
   - blocker/warning semantics for obvious readability failures.
4. Clarify ref-order semantics for `media_strip`, `service_cards`, `case_cards` as explicit ordered inputs.

Why this is enough:
- it unlocks real operator-facing hierarchy and atmosphere control;
- it avoids free color/styling freedom;
- it creates a path for UI controls that are finally contract-honest.

### Stage B: optional next bounded additions

Only after Stage A proves useful and stable.

Candidates:
- `densityPreset` on selected block families;
- bounded `mediaLayoutMode` for `media_strip`;
- bounded `proofProminencePreset` for proof-heavy blocks;
- bounded `surfaceTone` on selected proof-heavy blocks such as `media_strip` or `case_cards`;
- very small set of service/case layout presets if render and verification can hold determinism.

Condition:
- do not add these by default just because mockups showed them;
- add them only if real operator testing shows Stage A is still too rigid.

### Explicit future / reject list

Future only, not MVP-safe:
- depth/shadow styling;
- sophisticated card layout modes;
- per-block typography variation;
- per-page decorative background imagery.

Reject for this contract cycle:
- raw color values;
- arbitrary gradients;
- arbitrary background images;
- arbitrary block spacing or sizing;
- shell-level page-specific visual editing;
- generic “bridge slot between any two blocks” semantics.

## 11. Smallest Safe Next Step

The next smallest safe step is not implementation.

It is a contract-planning package that does two things together:
- define `pageThemeKey`, `textEmphasisPreset`, and `surfaceTone` as bounded contract additions;
- extend the verification contract to enforce resolved readability/contrast guardrails for those additions.

That is the smallest move that turns the current UI/workflow discoveries into an honest engineering path without turning the workspace into a page builder.
