# PRD: Contract-Driven LLM Landing Factory для «Экостройконтинент»

This draft is intentionally narrow. It defines a landing-first composition workspace, not a general website generator and not a page builder replacement.

## 1. Title and status

- Title: `Contract-Driven LLM Landing Factory` for `Экостройконтинент`
- Status: Draft
- Scope: narrow, contract-first, phase-aware
- Date: 2026-04-05
- Basis: canonical product docs from `docs/product-ux/*` plus `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`

## 2. Purpose / problem statement

The project needs a safe way to generate landing composition candidates with LLM assistance inside hard boundaries. The current system already has content revisions, explicit review and publish stages, media storage, SEO fields, and admin roles. What is missing is a first-class contract-driven workflow that turns a brief plus existing structured entities and assets into a landing draft, validates it, previews it, lets humans comment and revise it, and only then allows an explicit publish step.

The problem to solve is not "how to let AI build any page." The problem is how to let AI help produce useful landing experiments without breaking content truth, runtime determinism, or publish discipline.

## 3. Why now

- The canonical project model already treats `Content Core` as source of truth, `Admin Console` as write-side, and `Public Web` as read-side.
- Draft, review, publish, rollback, media upload, and SEO metadata already exist in the current system, which makes a narrow factory layer feasible.
- The project now needs a controlled composition surface that is faster than fully manual authoring but safer than arbitrary generation.
- A landing-first composition workspace is the smallest useful AI-enabled surface that can fit the current canon without turning the product into a generic builder.
- Current runtime gaps make this especially important: the scope must stay bounded because not every desired block or route is already renderable or discoverable.

## 4. Strategic fit with current project canon

| Canon principle | PRD implication |
|---|---|
| `Content Core` in SQL is the source of truth | The landing factory can produce structured candidates, but it does not become a second truth store. |
| `Admin Console` is the write-side tool | The factory lives in admin-only surfaces. |
| `Public Web` is read-side only | Public pages consume approved published artifacts only. |
| Publish is explicit | A human must approve and publish. AI cannot self-publish. |
| AI is assistive only | AI can draft, compare, and suggest, but cannot own truth. |
| Runtime must remain deterministic | The published result must render from a contract, not from arbitrary generated code. |

This PRD does not reopen phase-1 strategic canon. It sits on top of it and respects the current content-core, revision, review, and publish model.

Memory Card is an officially recognized session-scoped working-state layer for the AI-assisted landing workspace. It can carry prompt-assembly context, proof selection, and decision breadcrumbs, but it is not canonical truth, not publish state, and not a second source of truth. The engineering semantics live in `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md` and `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`.

## 5. Rollout boundary

### First rollout

- First rollout is `landing-first`.
- In scope for first rollout: landing composition candidates inside the dedicated admin workspace.
- Out of first rollout: `/cases/[slug]`, `/about`, `/contacts`, `/`, any article, FAQ, or review route, and any new route family.
- Service pages under `/services/[slug]` remain route-owning SEO surfaces and adjacent reuse inputs, not the primary AI workspace target in this draft.
- The `/services` index remains a read-side catalog and can continue to serve service-route truth.
- Rationale: the project now needs the landing composition surface first, while service pages remain an important secondary truth surface.

### Preconditions and deferred gaps

| Gap | Classification | v0.2 treatment |
|---|---|---|
| Root homepage `/` is outside the unified content-core path | ACCEPTABLE LIMITATION FOR FIRST ROLLOUT | The factory does not target `/`. |
| `hero` / public render drift | EXPLICITLY DEFERRED OUTSIDE THIS EPIC | Hero-like composition is not part of the first rollout contract. |
| `faq_list` contract/runtime gap | EXPLICITLY DEFERRED OUTSIDE THIS EPIC | FAQ is not in the first rollout surface. |
| Incomplete SEO discovery routes | ACCEPTABLE LIMITATION FOR FIRST ROLLOUT | The factory does not promise full launch SEO coverage in this release slice. |
| Missing content entities outside first slice | EXPLICITLY DEFERRED OUTSIDE THIS EPIC | They require separate route-family contracts later. |

## 6. Epic scope

### In scope

- Create a landing candidate from a brief or existing content context.
- Produce a machine-readable landing spec for that candidate.
- Validate the candidate against a strict contract.
- Generate a deterministic preview for human review.
- Support comments, comparison, and revision loops inside admin.
- Allow an approved version to enter the existing editorial publish workflow.
- Preserve auditability from draft to publish.
- Keep ordinary content and layout experiments inside the approved landing composition contract free from server redeploys.

### Out of scope

- Arbitrary HTML, JSX, or freeform frontend code generation.
- A general no-code page builder.
- A public page editing surface.
- Autonomous publish by AI.
- A new design system editor.
- A new website generation platform.
- Solving current SEO discovery infrastructure gaps inside this epic.
- Expanding route ownership beyond the approved landing workspace and adjacent service-route reuse in this draft.

## 7. Non-goals

- Not "AI builds websites automatically."
- Not a visual page-builder replacement.
- Not a general website generation platform.
- Not a way to bypass editorial review.
- Not a way to let AI mutate published truth silently.
- Not a way to publish directly from prompts.
- Not a replacement for the current content-core or publish model.
- Not a new public AI chat or public generator surface.

## 8. Personas / roles involved

| Role | Primary job in this epic | Notes |
|---|---|---|
| SEO Manager | Creates or refines candidates, checks search intent, metadata, and variant fit, comments on drafts. | Main day-to-day operator for experimentation. |
| Business Owner | Confirms business truth, offer fit, proof, and final commercial approval. | Human approval is required before publish. |
| Superadmin | Owns publish and rollback authority. | Final release authority stays explicit. |
| AI assistant | Drafts, rewrites, proposes structured variants, and suggests SEO wording. | Assistive only, not truth owner, not publisher. |

## 9. Core concept

In this project, "contract-driven landing factory" means a landing-first composition line for landing candidates where every step is structured and reviewable.

`brief -> landing draft -> validation report -> preview artifact -> comment / revision -> approval record -> publish`

In v0.2, `Landing Draft` is the workspace-facing composition artifact over existing `Page` truth and reusable structured inputs. `Landing Spec` is the formalized contract interpretation of that draft. The draft and spec are first-class for the factory UI and verification flow, but neither is a second source of truth. The underlying content and page truth remain canonical, and the draft/spec pair names the exact candidate being generated, reviewed, approved, and published.

Every publishable landing draft resolves into exactly one `Page` owner at publish time. There is no separate landing-owned published truth in this PRD.

The factory is an operational layer above the content core. It does not replace canonical content truth, and it does not let AI invent arbitrary page structure. The output must stay machine-verifiable, human-reviewable, and deterministic at render time.

## 10. State model

### Candidate, review, approval, publish, public

| State | Meaning | Public visibility | AI boundary |
|---|---|---|---|
| Candidate | Mutable working draft created by human or AI-assisted flow. | No | AI may help create or revise it. |
| Review | Candidate is under human comment, compare, and revision. | No | AI may suggest edits, but not advance state. |
| Approval | Human has accepted the candidate as publishable. | No | AI cannot grant approval. |
| Publish | Explicit action that freezes the approved snapshot into the existing publish workflow. | Not yet public until publish completes | AI cannot publish. |
| Public | Published state consumed by the public read-side only. | Yes | AI cannot move content here directly. |

Approval is not public release. Publish is explicit. Public read-side only consumes published state.

### Validation classes

- Structural / schema validation
  - Checks required fields, allowed block shapes, allowed variants, and payload completeness.
- Reference / content-truth validation
  - Checks that linked entities, proof, and media refs exist and are allowed for publication.
- Render compatibility validation
  - Checks that the candidate can be deterministically rendered by the current approved renderer.
- Editorial / publish-readiness validation
  - Checks CTA presence, owner approval, SEO completeness, and other publish gates.
- Claim / risk validation
  - Checks unsupported claims, weak proof, and obvious editorial risk before approval or publish.

These validation classes are product-level expectations for the factory, not a full engineering contract.

## 11. Primary workflow

1. Create candidate.
   - Start from a brief, target, and business goal for the landing workspace and its approved source inputs.
2. Generate or compose landing spec.
   - Express the candidate as structured data, not as freeform page code.
3. Validate.
   - Run the candidate through structural, truth, render, editorial, and claim checks.
4. Preview.
   - Render the candidate into a deterministic review artifact.
5. Comment and compare.
   - SEO Manager, Business Owner, and Superadmin can review differences, annotate, and request changes.
6. Revise.
   - Update the candidate or spec and revalidate.
7. Approve.
   - A human approval marks the artifact as ready for publish, but not yet public.
8. Publish.
   - The approved version enters the existing explicit publish workflow and becomes the published snapshot.

AI may assist during creation, validation explanation, and revision, but it never skips validation, human review, or publish.

## 12. Product surfaces

### Admin-side surfaces only

- Landing composition workspace for candidate creation and iteration.
- Spec-oriented editor or form surface for structured landing composition data.
- Validation panel that explains pass, fail, and blocking reasons.
- Variant compare and review history.
- Comment thread for SEO Manager, Business Owner, and Superadmin.
- Publish handoff surface that uses the existing editorial publish workflow.

### Preview / review surfaces

- Deterministic admin preview of the landing candidate.
- Side-by-side comparison between versions or variants.
- Machine-readable validation output plus human-readable summary.
- Review state that is separate from publish state.

### Published read-side relationship

- The public web remains read-side only.
- The factory does not add a public editing path.
- The public site can only consume approved published artifacts through the canonical read-side projection.
- If a route or block is not supported by the current runtime contract, it does not become public by default.

### 12.1 Current working UX hypothesis for the SEO operator

The main user of the landing workspace is the SEO Manager acting as a landing composer.

The expected operator flow is:

1. Choose a landing or page owner from the workspace entry.
2. Inspect the available content materials.
3. Assemble a coherent page from reusable proof elements.
4. Add short connective copy where the page needs meaning, transitions, or framing.
5. Preview the page as a human would read it.
6. Check blockers or readiness issues.
7. Hand the result to review when it is ready.

The workspace should support that flow without turning into a broad page builder, a design tool, or a technical console.

A likely practical screen shape is:

- a compact library of reusable materials;
- a central landing composition canvas;
- an assistant / review rail for help, feedback, and readiness.

The exact visual arrangement can evolve, but the operator should always be able to quickly see what to choose, what to place, what to read, and what to hand off.

### 12.2 Reusable content vs page-scoped connective copy

The factory should treat photos, service cards, and case cards as reusable content inputs.

Short connective text that helps the page read as one story belongs to the specific landing composition draft or page version. It is part of that page's composition, not a standalone reusable content library by default.

This means the workspace can use:

- reusable proof elements, such as photos, services, and cases;
- page-scoped introduction, transition, and closing copy;
- simple visual placement and resizing that keeps elements readable and proportionate.

The product goal is not to make the operator manage content mechanics. The goal is to make the operator feel like they are building a clear landing page from meaningful pieces.

## 13. Canonical artifacts

| Artifact | Role | Relation to existing revision model | Truth status |
|---|---|---|---|
| Landing draft | Working output from AI or human-assisted composition. | Lives as mutable draft state before formal review. | Not truth. |
| Landing spec | Formal contract view of the landing draft. | Interprets the structured inputs; does not replace canonical page truth. | Reviewable contract, not separate source of truth. |
| Validation report | Machine-generated result of contract checks and blockers. | Derived from the candidate/spec pair. | Derived artifact. |
| Preview artifact | Deterministic rendered view for human review. | Derived from the draft/spec pair. | Derived artifact. |
| Approval record | Human sign-off that the draft may enter publish. | Captures the approved draft/spec boundary before public release. | Pre-public decision record. |
| Published artifact | Frozen version that entered publish workflow and became public. | Backed by the active published revision pointer. | Canonical published snapshot. |

## 14. Rules and constraints

- Deterministic rendering is mandatory.
  - The same approved landing artifact, rendered by the same contract version, must produce the same public result.
- No arbitrary code generation.
  - AI cannot emit custom HTML, JSX, or executable frontend code as the primary product path.
- No silent content truth mutation.
  - Canonical fields cannot change invisibly through AI suggestions.
- No autonomous publish.
  - A human must explicitly approve and publish.
- No open-ended block structure.
  - Only typed, registered, contract-defined blocks are allowed.
- No unsafe fallback rendering.
  - Unsupported blocks or broken refs should fail validation or remain draft, not silently degrade into uncontrolled output.
- No-redeploy experiments are narrow.
  - Allowed without redeploy: changing content values, reordering already registered blocks or variants, swapping already supported refs, and editing SEO or proof fields inside the landing composition contract.
  - Not allowed without engineering work: adding a new block type, changing renderer behavior, introducing a new route family, changing validation logic, or altering schema / storage shape.
- Validation classes are part of the product contract.
  - Structural, reference, render compatibility, editorial readiness, and claim / risk checks are all required product-level gates.
- Public read-side only.
  - Published state is the only state visible to public web.
- AI is assistive only.
  - AI can help author and explain, but it is not a route owner or truth owner.

## 15. Success criteria

The epic is successful when all of the following are true:

- A landing draft can be created as a structured artifact without direct code edits.
- The draft can be validated against a clear contract and produce actionable failures.
- A deterministic preview can be generated from the draft.
- SEO Manager and Business Owner can comment and request revision inside admin.
- An approval record can be created without exposing public state.
- An approved artifact can move into the existing publish workflow.
- Publish remains explicit and human-controlled.
- Public web consumes only the published snapshot.
- AI-generated content cannot reach public state without human review.
- Ordinary content and layout experiments inside the approved landing composition contract do not require a server redeploy.
- The product does not drift into a general page-builder or autonomous website generator.
- No route family beyond the approved landing workspace and adjacent service-route reuse is accidentally implied by the first rollout.

## 16. Risks / open questions

| Category | Risk / open question | Why it matters |
|---|---|---|
| Architectural | Current runtime already shows contract/render drift in some block areas. | The factory must not promise blocks the renderer cannot deterministically render. |
| Runtime | The root homepage is still outside the unified content-core read path. | The first rollout must stay landing-first and not imply homepage coverage. |
| SEO | Discovery infrastructure is incomplete in runtime. | Do not overstate launch SEO automation before the supporting routes exist. |
| Product | The epic could drift into page-builder territory if block freedom is widened too much. | That would break the current canon and dilute the workflow. |
| Operational | Approval, revision, and publish boundaries must remain visible and separate. | The factory must not blur review with release. |
| Security / quality | AI suggestions can carry weak claims or unsupported references. | Human review and validation remain mandatory. |
| Scope | Later route-family expansion will require new contracts. | Landing-first rollout must not be mistaken for universal support. |
| Open question | Which composition or adjacent route surfaces are next after landing drafts? | This must be decided in a separate follow-up package, not in v0.2. |

Current canon already blocks the wider ambition of an arbitrary AI site generator, a full no-code builder, and an autonomous publisher. This PRD accepts those constraints instead of trying to route around them.

## 17. Proposed next document pack after PRD approval

After this PRD is reviewed and accepted, the minimum next engineering doc pack should define:

- Landing composition spec contract.
  - Why needed: defines the machine-readable shape of a landing draft, including required fields, allowed references, landing inputs, and versioning.
- Landing composition block registry contract.
  - Why needed: defines the allowed block types, variants, and rejection behavior for the landing-first workspace.
- Landing composition render contract.
  - Why needed: defines how an approved landing draft is turned into a deterministic public or preview render.
- Landing composition verification contract.
  - Why needed: defines the machine checks, severity levels, and publish blockers that guard the workflow.
- Landing composition publish artifact contract.
  - Why needed: defines the frozen snapshot that enters publish, how it relates to revision history, and what the public read-side consumes.
- Implementation plan.
  - Why needed: sequences the engineering work and separates current runtime gap closure from the product scope.

The service-mode contract pack remains adjacent and historical for route-owning service-page truth, but it is no longer the primary follow-up pack for this PRD.

These are the narrow follow-up documents needed to turn the PRD into executable engineering scope without reopening the whole product direction.

## Appendix B - Refinement Notes vs v0.1

- Tightened the first rollout to landing-first and kept service pages as adjacent SEO surfaces rather than the primary workspace target.
- Explicitly excluded `/`, `/cases/[slug]`, `/about`, `/contacts`, and article / FAQ / review routes from the first rollout.
- Reframed `Landing Draft` and `Landing Spec` as formal contract views over existing content and page truth, not second source of truth.
- Separated candidate, review, approval, publish, and public states so approval is no longer blurred with publication.
- Defined no-redeploy experiments precisely and separated them from engineering changes.
- Added validation classes so the later verification contract can be derived from the PRD instead of invented from scratch.
- Introduced a clear preconditions and deferred-gaps view for known runtime mismatches.
- Left unchanged: AI remains assistive only, publish remains explicit, public web remains read-side only, deterministic rendering remains mandatory, and the epic does not become a page builder or autonomous website generator.

