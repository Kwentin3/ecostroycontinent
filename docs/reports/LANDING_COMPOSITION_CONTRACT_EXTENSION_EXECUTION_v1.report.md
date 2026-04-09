# LANDING_COMPOSITION_CONTRACT_EXTENSION_EXECUTION_v1

## Scope

This execution implemented Stage A of the landing composition contract-extension plan.

The goal was to make the newly approved visual-semantic layer honest across:
- contract docs;
- schema and draft/runtime seams;
- deterministic render semantics;
- verification guardrails;
- tests.

This pass did not broaden into page-builder behavior, raw styling freedom, or arbitrary typography controls.

## Grounding Summary

Before changes, the landing-first stack already had:
- a strong closed block registry;
- page-anchored landing draft truth;
- deterministic block projection;
- verification for structural/editorial readiness.

But it did not yet have a coherent Stage A home for:
- page-level atmosphere intent;
- semantic loudness for page-scoped copy;
- bounded section tone treatment;
- contrast/readability ownership for those new controls.

The main runtime seam was also still missing a compact theme/token layer, so any future UI work would have risked inventing behavior beyond the contract.

## What Changed

### Contract docs updated

- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`

### New companion contract

- `docs/engineering/LANDING_COMPOSITION_THEME_TOKEN_REGISTRY_CONTRACT_v1.md`

### Code and schema alignment

- `lib/landing-composition/visual-semantics.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/landing-workspace/landing.js`
- `components/public/PublicRenderers.js`
- `components/public/public-ui.module.css`

### Tests updated

- `tests/content-core.service.test.js`
- `tests/landing-workspace.test.js`
- `tests/landing-workspace.route.test.js`

## Stage A Capability Implementation

### `pageThemeKey`

Implemented as a real page-level composition field in the schema/runtime path.

Current Stage A behavior:
- token-backed theme selection only;
- resolved through a compact landing theme registry;
- carried through landing draft projection and normalized page payloads;
- used by preview/public render and verification.

Future seam preserved:
- the contracts now explicitly leave room for a later bounded page-palette path;
- that future path must stay token-backed, verification-guarded, and consistency-aware;
- no raw color payloads were introduced.

### `textEmphasisPreset`

Implemented on:
- `landing_hero`
- `content_band`
- `cta_band`

Semantic stance:
- this is semantic loudness only;
- it is not raw font-size control;
- it is not a typography playground;
- renderer maps it indirectly to presentation semantics.

### `surfaceTone`

Implemented only on:
- `landing_hero`
- `content_band`
- `cta_band`

Stage A discipline:
- bounded enum only;
- resolved through the page theme registry;
- no raw background values;
- no proof-heavy block rollout in Stage A.

Stage B seam preserved:
- docs explicitly leave room for later evaluation on proof-heavy blocks such as `media_strip` or `case_cards`;
- Stage A structure does not make that extension awkward.

### Theme/token registry

Implemented as a compact contract + runtime registry with:
- approved theme keys;
- bounded `surfaceTone` mappings;
- contrast posture metadata;
- explicit separation from UI-only helper behavior.

### Verification/readability guardrails

Verification now owns Stage A readability semantics.

Current semantics implemented:
- blocker if theme/tone semantics are missing or unresolved for a text-bearing block;
- warning for softer contrast posture;
- warning when emphasis surfaces are overused across all Stage A text-bearing blocks;
- blocker on duplicate ordered proof refs.

This keeps contrast/readability enforcement in verification rather than pushing it into the operator as another manual styling burden.

## Why This Is Canon-Safe

The execution stays inside the agreed product and architecture boundaries:
- `Page` remains the only publish owner truth;
- no new published landing truth was introduced;
- no page-builder freedom was added;
- no raw styling payload was added to the composition truth;
- shell regions remain fixed and non-editable;
- proof-heavy blocks did not gain Stage A styling freedom prematurely.

## Tests And Checks Run

- `npm test`
- `npm run build`

Both passed.

Build note:
- the existing Next.js NFT warning from `next.config.mjs` remains;
- it predates this contract-extension pass and is not caused by Stage A changes.

## Git Status

- Commit(s): `7cad87c` (`Extend landing composition stage A semantics`)
- Push status: pushed to `origin/main`

## Rollout Status

No deploy was executed in this pass.

Rollout prep status:
- no migration required;
- runtime-facing code and renderer semantics are in place;
- safe next rollout would be the usual app deploy/build pipeline.
- no deploy was executed from this workspace during the pass.

## Known Remaining Limitations

- Stage A currently uses only registry-backed `pageThemeKey`; the future bounded page-palette path is intentionally left as a seam, not implemented.
- Proof-heavy block `surfaceTone` support remains deferred.
- `textEmphasisPreset` and `surfaceTone` exist in runtime/spec and render semantics, but no production operator UI control surface was added in this pass.
- Contrast/readability logic is intentionally compact in Stage A and may need richer heuristics once real operator usage appears.
