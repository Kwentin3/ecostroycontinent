# LANDING_COMPOSITION_RENDER_CONTRACT_v1

## Purpose

This contract defines deterministic rendering for approved landing composition drafts in the landing-first workspace.

The same approved composition must render the same result every time, given the same renderer version, theme/token registry version, and published lookup state.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Deterministic preview and public render rules, block-to-render mapping, theme/token resolution, failure behavior, and fallback rules. | Frontend architecture beyond the workspace, raw design-system freedom, generic page-builder semantics, route ownership. | The landing composition spec, block registry, and theme/token registry are already locked. | Silent fallback to unsupported sections, arbitrary markup generation, raw style interpretation from draft payloads, generic page-builder behavior. |

## Render principle

Preview and public render must use the same block order, the same proof ref order, the same theme/token resolution rules, and the same block mappings.

The published result is always a `Page`-owned published shell or another route-owning page truth carrier, but the render semantics must remain deterministic.

## Render inputs

- Approved landing composition spec
- Published lookups for related services, cases, galleries, and media
- Published global shell data for header/footer presentation
- Approved landing theme/token registry entry addressed by `pageThemeKey`

Preview may inspect the working draft for review annotations, but preview must not invent a different layout from public render.

## Supported render mapping

| Block id | Render target | Source fields | Render rule |
|---|---|---|---|
| `landing_hero` | Top hero band | `title`, `hero`, `ctaVariant`, `textEmphasisPreset`, `surfaceTone` | Render the landing introduction at the top of the page, using semantic loudness and bounded surface treatment resolved through the selected page theme. |
| `media_strip` | Visual support strip | `mediaAssetIds` | Resolve only published media assets and render them in declared order. |
| `service_cards` | Service proof cards | `serviceCardIds` | Resolve only published services and render them in declared order. |
| `case_cards` | Case proof cards | `caseCardIds` | Resolve only published cases and render them in declared order. |
| `content_band` | Supporting composition band | `body`, `subtitle`, `textEmphasisPreset`, `surfaceTone` | Render the supporting copy as one deterministic band, using semantic loudness and bounded surface treatment resolved through the selected page theme. |
| `cta_band` | Final CTA band | `ctaVariant`, `ctaNote`, `textEmphasisPreset`, `surfaceTone` | Render the closing action area without inventing claims and with bounded tone semantics resolved through the selected page theme. |

## Shell regions

| Region id | Render target | Source fields | Render rule |
|---|---|---|---|
| `landing_header` | Header shell region | `headerRef` | Render published global shell data only. |
| `landing_footer` | Footer shell region | `footerRef` | Render published global shell data only. |

Shell regions are fixed and do not gain per-page styling freedom in Stage A.

## Theme and tone resolution

`pageThemeKey` is page-level atmosphere intent.

The render path must resolve it through the landing theme/token registry.

`surfaceTone` is a bounded block-level reference that resolves inside the selected page theme.

`textEmphasisPreset` is semantic loudness only:
- it may influence renderer-selected text scale, weight, spacing, or contrast treatment indirectly;
- it must not be treated as raw typography freedom;
- the renderer chooses concrete presentation, not the draft.

## Future extension seam

Stage A does not introduce raw page palette overrides.

But the render contract intentionally leaves room for a later bounded page-palette path if it remains:
- token-backed;
- verification-guarded;
- consistency-aware;
- and still resolved through deterministic renderer rules.

That future seam must extend theme resolution. It must not bypass it.

## No unsafe fallback rule

- Unknown block ids must not be rendered as a generic fallback.
- Unknown block ids must fail verification before public release.
- Missing required inputs for a declared block must fail verification, not degrade silently.
- Optional blocks may be omitted if they are not present in the draft.
- Shell regions are not block ids; they are fixed presentation regions and must resolve separately from the block registry.
- Unknown `pageThemeKey`, `surfaceTone`, or `textEmphasisPreset` values must fail verification, not silently downgrade into arbitrary styling.

## Preview vs public

| Mode | Allowed inputs | Allowed behavior |
|---|---|---|
| Preview | Working draft plus published lookup data | May show review annotations and validation notes. |
| Public | Approved published artifact plus published lookup data only | Must show only the published landing truth. |

Preview and public may share the same render code path, but they must not diverge in block semantics.

## Runtime honesty note

This contract does not rely on freeform page-builder behavior.

If a future change needs a new block family, raw visual freedom, or arbitrary styling payloads, that is a new engineering contract, not a silent extension of this one.
