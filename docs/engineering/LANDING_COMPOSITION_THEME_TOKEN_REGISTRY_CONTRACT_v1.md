# LANDING_COMPOSITION_THEME_TOKEN_REGISTRY_CONTRACT_v1

## Purpose

This contract defines the compact landing theme/token registry used by Stage A landing composition.

It gives `pageThemeKey` and `surfaceTone` a deterministic resolution target without turning the landing draft into a raw styling payload.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Approved landing theme keys, token families, surface-tone mappings, and contrast posture metadata. | Raw user-entered colors, UI color-picking helpers, arbitrary gradients, generic design-system governance. | The landing composition spec references theme/tone intent and verification inspects the resolved result. | Hex/RGB payloads inside the landing draft, arbitrary style sandbox freedom, shell-level page-specific styling. |

## Registry rule

The registry is compact and closed in Stage A.

The draft references keys from this registry. The draft does not carry raw visual values.

## Stage A registry entries

| Theme key | Purpose | Notes |
|---|---|---|
| `earth_sand` | Warm neutral landing baseline. | Safe default for general proof-first pages. |
| `forest_contrast` | Higher-contrast trust-forward scene. | Stronger commercial contrast while remaining bounded. |
| `slate_editorial` | Cooler editorial scene. | Valid but may produce warning-level combinations on stronger surfaces. |

## Required token concepts per theme

Each theme entry must define, at minimum:
- base page background semantics;
- base foreground/text semantics;
- accent semantics;
- bounded `surfaceTone` mappings for `plain`, `tinted`, and `emphasis`;
- contrast posture metadata sufficient for verification to classify blockers vs warnings.

The registry may carry actual resolved values in implementation code, but the composition contract must treat those as registry-owned, not draft-owned.

## Stage A bounded surface-tone semantics

| `surfaceTone` | Meaning | Notes |
|---|---|---|
| `plain` | Lowest visual lift; relies on base page scene. | Safe default. |
| `tinted` | Mild section separation within the current page theme. | Used to create rhythm without strong spotlighting. |
| `emphasis` | Strongest bounded section treatment available in Stage A. | May trigger warnings if overused or if the chosen theme yields weaker contrast posture. |

Stage A applies `surfaceTone` only to:
- `landing_hero`
- `content_band`
- `cta_band`

Proof-heavy blocks are intentionally excluded in Stage A.

## Contract field vs token vs UI helper

This separation is mandatory:

- Contract fields: `pageThemeKey`, `surfaceTone`, `textEmphasisPreset`
- Token registry: actual theme entries, surface-tone mappings, foreground/background pairings, contrast posture metadata
- UI-only helpers: recent colors, copy/apply treatment, reuse-this-page accent suggestions, consistency nudges

UI helpers may reference registry knowledge, but they must not become composition truth.

## Future bounded page-palette seam

Stage A uses `pageThemeKey` as the only page-level atmosphere selector.

That does not mean the system is locked into preset-only page atmosphere forever.

A future bounded page-palette path is allowed if it remains:
- token-backed rather than raw-value-backed;
- verification-guarded;
- consistency-aware;
- clearly separate from UI convenience features.

Any such path must extend this registry model. It must not bypass it with arbitrary colors.

## Explicit non-goals

- raw page-level color values in the landing draft
- raw block-level color values in the landing draft
- arbitrary gradients
- arbitrary background images
- shell-specific theme editing
- generic style-copying truth outside the draft/token distinction
