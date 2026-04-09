# LANDING_COMPOSITION_CONTRACT_EXTENSION_PLAN_V1

## What Definitely Needs Contract Extension

These areas are now strong enough to justify contract work:
- page-level theme/atmosphere as a bounded `pageThemeKey` in Stage A, with explicit room for a later bounded custom page-palette path;
- semantic text loudness for page-scoped copy via a bounded `textEmphasisPreset`;
- limited block-level `surfaceTone` for `landing_hero`, `content_band`, and `cta_band`;
- verification coverage for readability/contrast once those visual-semantic fields exist.

The current workflow and mockups are correctly showing that structure + refs + copy are not enough by themselves. The operator needs bounded hierarchy and atmosphere control.

## What Should Stay UI-Only For Now

These may be useful, but do not need to become composition truth yet:
- copy/apply style shortcuts;
- reuse-page-accent helpers;
- sampled-color or consistency nudges;
- local editor warnings about weak visual rhythm;
- recent-colors or reuse-last-treatment trays.

These are good tooling behaviors, not core spec fields.

## What Should Explicitly Wait

These are tempting, but should not enter the first extension set:
- density presets across many block families;
- proof-level prominence controls on all blocks;
- alignment presets;
- media/service/case layout-mode expansion;
- depth/shadow controls;
- generic transition-copy slots between arbitrary sections;
- proof-heavy `surfaceTone` outside selected Stage B evaluation.

They are either too layout-like, too weakly justified, or too easy to turn into page-builder drift.

## Smallest Safe Extension Set

Recommended Stage A only:
1. Add `pageThemeKey` at page level.
2. Add `textEmphasisPreset` on `landing_hero`, `content_band`, and `cta_band`.
3. Add `surfaceTone` on the same text-bearing block families.
4. Add a compact theme/token registry contract those fields resolve through.
5. Extend verification with readability/contrast guardrails for the resolved result.
6. Clarify ordered-input semantics for proof refs.

Important refinement:
- `textEmphasisPreset` must be documented as semantic loudness only, not font-size/font-weight freedom;
- page-level color evolution may later add a bounded custom palette path, but only through token-backed, verified, consistency-safe rules.

## Critical Stance

The current contract is too weak for bounded visual-semantic composition, but the mockups are also ahead of the contract in risky places. The right answer is not “yes to every visual control.” The right answer is to add only the fields needed to express page atmosphere and semantic text weight safely, to keep contract fields separate from token definitions and UI conveniences, and to leave richer layout/styling behavior behind later evidence.

## Recommended Next Move

The next move should be contract + verification planning together, not contract-only in isolation.

Reason:
- once `pageThemeKey`, `textEmphasisPreset`, and `surfaceTone` exist, readability/contrast must already have a verification home;
- otherwise the project would add visual freedom without the guardrails that keep it bounded.
