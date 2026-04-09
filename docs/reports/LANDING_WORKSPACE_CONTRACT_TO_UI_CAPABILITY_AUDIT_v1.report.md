# LANDING_WORKSPACE_CONTRACT_TO_UI_CAPABILITY_AUDIT_v1

## 1. Audit Scope
This audit compares the current landing-first composition contract pack against the current UI/workspace surface, with special attention to the local HTML mockups `v5` and `v6` as the latest visible UI explorations.

The audit is strict about one distinction:
- contract-backed capability;
- UI-plan convention;
- prototype-only behavior;
- what should or should not be surfaced in MVP first-layer UI.

This is not an implementation plan and not a redesign document.

## 2. Sources Checked
Primary contract and engineering sources:
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`

Workflow / UI sources:
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_v1.md`
- `docs/reports/LANDING_WORKSPACE_UI_SURFACE_AUDIT_v1.report.md`
- `docs/reports/LANDING_WORKSPACE_PRD_DOCS_EXPECTATION_AUDIT_v1.report.md`
- `docs/reports/LANDING_FIRST_CONTRACT_REALITY_AUDIT_v1.report.md`

Runtime confirmation source:
- `lib/landing-workspace/landing.js`

Current UI/prototype references:
- `artifacts/landing-workspace-mockup-v5.html`
- `artifacts/landing-workspace-mockup-v6.html`

## 3. Contract Capability Inventory
The current contract pack is strongest in four areas:
- closed block family and bounded composition structure;
- explicit reference-based composition using existing media / service / case truth;
- structured copy fields for hero/content/cta plus CTA varianting and SEO payload;
- verification, render determinism, shell-region separation, and publish gating.

The current contract pack is weak or absent in visual-composition controls such as:
- prominence presets;
- density presets;
- alignment presets;
- section surface/background treatment;
- depth/shadow treatment;
- arbitrary media/card layout modes;
- page-level background / gradient / image treatment.

Those richer controls appear in workflow/UI planning docs and current mockups, but they are not strongly backed by the current engineering composition contract.

## 4. Capability Matrix
| Capability | Contract status | Applies to | Current UI state | MVP recommendation | Drift risk | Verdict | Rationale |
|---|---|---|---|---|---|---|---|
| Closed block presence / absence in a fixed registry | explicit | `landing_hero`, `media_strip`, `service_cards`, `case_cards`, `content_band`, `cta_band` | surfaced | first-layer | low | CONTRACT-STRONG / UI-PRESENT | Registry is closed and current UI correctly treats composition as bounded add/remove, not free block creation. |
| Fixed shell regions separate from composition blocks | explicit | `landing_header`, `landing_footer` | surfaced | first-layer as status only | low | CONTRACT-STRONG / UI-PRESENT | Shell is contractually fixed and should stay visible only as locked context, not as editable/reorderable sections. |
| Deterministic render path for preview/public | explicit | whole page | surfaced | first-layer | low | CONTRACT-STRONG / UI-PRESENT | Render contract explicitly requires the same approved block set and order to drive preview and public render. |
| Hero-first / CTA-last bounded composition endpoints | explicit | `landing_hero`, `cta_band` | surfaced | first-layer | low | CONTRACT-STRONG / UI-PRESENT | Registry and render docs make these endpoints fixed. Current UI already preserves that boundary. |
| Proof-order changes across major block families | convention only | `media_strip`, `service_cards`, `case_cards`, `content_band` | misleading | contextual only after contract clarification | high | UI-LEADS-CONTRACT | Workflow docs discuss bounded proof-order patterns, but engineering contracts are still deterministic and do not strongly define operator-controlled reorder freedom across block families. |
| Selecting media / service / case references | explicit | `landing_hero` media, `media_strip`, `service_cards`, `case_cards` | surfaced | first-layer | low | CONTRACT-STRONG / UI-PRESENT | Spec and runtime schema explicitly carry `mediaAssetIds`, `serviceCardIds`, `caseCardIds`, and `hero.mediaAssetId`. |
| Ordering references inside a block | implicit | `media_strip`, `service_cards`, `case_cards` | absent | contextual only | medium | CONTRACT-STRONG / UI-MISSING | Render contract says referenced assets/cards render in declared order; arrays and deterministic render make order meaningful even if UI does not yet expose it. |
| Hero structured inputs: headline, support copy, main media | implicit | `landing_hero` | partial | contextual only | low | CONTRACT-STRONG / UI-MISSING | Written docs compress `hero` into one field, but runtime schema makes `headline`, `body`, and `mediaAssetId` real spec fields. UI only hints at them today. |
| Structured supporting copy band (`body`, `subtitle`) | explicit | `content_band` | partial | first-layer or contextual light editor | low | CONTRACT-STRONG / UI-MISSING | `content_band` is one of the clearest contract-backed copy surfaces, but current mockups blur it into generic bridge editing instead of a first-class bounded band. |
| CTA variant and CTA note / framing copy | explicit | `landing_hero`, `cta_band` | partial | contextual only | low | CONTRACT-STRONG / UI-MISSING | `ctaVariant` and `ctaNote` are contract-backed, but current UI shows CTA language without exposing varianting or note editing explicitly. |
| Arbitrary transition copy between any two proof blocks | unsupported | page-level between any blocks | misleading | hidden / future until contract object exists | medium | UI-LEADS-CONTRACT | Current mockups show a bridge row before every block, but engineering contracts do not define free transition-copy slots between arbitrary sections. |
| Verification blockers / approval gate / review gating | explicit | whole draft | surfaced | first-layer compact | low | CONTRACT-STRONG / UI-PRESENT | Verification contract explicitly defines blockers, warnings, approval eligibility, and publish readiness. |
| SEO / publish metadata | explicit | whole draft | absent | hidden / advanced | low | CONTRACT-STRONG / UI-MISSING | `seo` is real contract data, but belongs behind disclosure or a later publish/readiness layer, not in first-layer composition UI. |
| Prominence / emphasis presets | convention only | hero, media, services, cases, content, CTA | misleading | hidden / advanced until contract extension | high | UI-LEADS-CONTRACT | Workflow docs propose them; engineering composition contracts do not. Current mockups make them look stronger than they are. |
| Density / compact vs expanded behavior | convention only | media, services, cases, content, CTA | misleading | hidden / advanced until contract extension | medium | UI-LEADS-CONTRACT | Useful product idea, but not currently a strong spec field in engineering contracts. |
| Alignment presets | convention only | hero, content, CTA, some card blocks | misleading | hidden / advanced | medium | UI-LEADS-CONTRACT | Present in workflow docs, absent from engineering contract shape. |
| Surface/background treatment (`plain`, `tinted`, `emphasis`) | convention only | hero, content, CTA, proof blocks | misleading | hidden / advanced | high | UI-LEADS-CONTRACT | This is precisely the kind of capability that can drag the workspace toward page-builder semantics if surfaced before a contract update. |
| Depth / shadow treatment | convention only | media, case, CTA, proof clusters | absent | future | high | FUTURE / NOT MVP | Mentioned only in workflow refinement ideas, not supported in composition contracts. |
| Media layout mode (`single`, `two-up`, `strip`) | convention only | `media_strip` | absent | contextual only after contract update | medium | CONTRACT-PARTIAL / UI-SHOULD-WAIT | UI docs propose bounded presets, but engineering contracts currently only guarantee referenced media rendered in order. |
| Service / case layout modes (`grid`, `spotlight-first`, etc.) | convention only | `service_cards`, `case_cards` | absent | future | high | CONTRACT-PARTIAL / UI-SHOULD-WAIT | Tempting, but weakly backed and easy to turn into layout drift. |
| Text size / typography treatment controls | convention only | hero, content, CTA | absent | hidden / advanced or future | high | TOO RISKY FOR FIRST-LAYER UI | This is the fastest route from bounded composition into typography playground behavior. |
| Page-level background / gradient / imagery | unsupported | whole page | absent | future | high | FUTURE / NOT MVP | Not listed in composition spec; any such control would be inventing a new visual contract. |
| Section-level gradient / background imagery | unsupported | any block | absent | future | high | FUTURE / NOT MVP | Same problem as page backgrounds, but even more likely to produce page-builder drift. |

## 5. Capabilities Already Well Surfaced In UI
These are the current strengths and should stay visible:
- bounded block presence / absence via a closed set of page sections;
- explicit reusable-material selection from media / services / cases;
- fixed shell status rather than editable shell blocks;
- compact blocker summary and review CTA;
- clear difference between composition work and a generic freeform builder.

In short: structure, references, shell, and gating are already the strongest UI/contract matches.

## 6. Capabilities Contract Allows But UI Does Not Yet Expose Well
These are the best contract-backed candidates for the next UI step:
- hero main media selection and hero support-copy editing;
- first-class `content_band` editing instead of generic bridge-only editing;
- explicit `ctaVariant` / `ctaNote` editing in a bounded contextual control;
- ordering of selected media/assets/cards inside `media_strip`, `service_cards`, and `case_cards`;
- optional SEO/readiness disclosure behind a secondary layer, not first-layer UI.

These are good candidates because they are already grounded in contract/runtime truth and do not require inventing a new visual grammar.

## 7. Capabilities That Should Remain Hidden / Advanced / Future
These should not be surfaced on the first layer now:
- `seo` object details;
- `slug`, `basePageId`, `pageId`, `landingDraftId`, `specVersion` and similar draft metadata;
- typography size/treatment controls;
- depth/shadow controls;
- section-level background imagery or gradients;
- page-level backgrounds / gradients / hero-style “theme” controls.

These either belong to a secondary disclosure layer or are simply outside the current bounded-composition contract.

## 8. Capabilities Risky Because They May Cause Page-Builder Drift
The highest-risk controls are:
- prominence / emphasis as visible first-layer styling knobs;
- density as a pseudo-layout system;
- alignment as a general-purpose layout control;
- surface/background treatment when not tightly tied to a contract field;
- proof-order freedom that exceeds the deterministic render contract;
- media/service/case layout-mode controls before contract clarification;
- any typography or page-background control.

Critical stance:
- the mockups are already ahead of the contract here;
- that makes them useful for exploration, but not safe as direct implementation authority.

## 9. Overall Verdict
### Structural composition and shell handling
- CONTRACT-STRONG / UI-PRESENT

### Reusable proof selection
- CONTRACT-STRONG / UI-PRESENT

### Structured copy and CTA editing
- CONTRACT-STRONG / UI-MISSING

### Verification and handoff
- CONTRACT-STRONG / UI-PRESENT

### Proof-order freedom across block families
- CONTRACT-PARTIAL / UI-SHOULD-WAIT

### Visual emphasis controls (`prominence`, `density`, `alignment`, `surface`)
- UI-LEADS-CONTRACT

### Typography and page-level visual treatment
- FUTURE / NOT MVP

### Background / gradient / imagery controls
- TOO RISKY FOR FIRST-LAYER UI

Bottom line:
- the contract is already rich enough for a useful MVP UI, but mostly in structure, references, copy fields, CTA, SEO, and gating;
- the current mockup/UI exploration is richer than the contract in visual-emphasis controls;
- the safest next UI step is to expose more contract-backed content controls, not more visual styling controls.

## 10. Smallest Safe Next Step
Add one contextual editor path for contract-strong fields only:
- choose and reorder referenced media/services/cases inside their block;
- edit hero support copy, `content_band`, and `ctaBand`/`ctaVariant` in-place;
- keep blockers/review compact;
- do not surface prominence/density/surface controls until the engineering composition contract is extended explicitly.
