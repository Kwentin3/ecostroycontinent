# PRD: Contract-Driven LLM Landing Factory для «Экостройконтинент»

This draft is intentionally narrow. It defines a controlled landing and page experimentation workflow, not a general website generator and not a page builder replacement.

## 1. Title and status

- Title: `Contract-Driven LLM Landing Factory` for `Экостройконтинент`
- Status: Draft
- Scope: narrow, contract-first, phase-aware
- Date: 2026-04-05
- Basis: canonical product docs from `docs/product-ux/*` plus `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`

## 2. Purpose / problem statement

The project needs a safe way to generate landing page candidates with LLM assistance inside hard boundaries. The current system already has content revisions, explicit review and publish stages, media storage, SEO fields, and admin roles. What is missing is a first-class contract-driven workflow that turns a brief into a structured landing candidate, validates it, previews it, lets humans comment and revise it, and only then allows an explicit publish step.

The problem to solve is not "how to let AI build any page." The problem is how to let AI help produce useful landing experiments without breaking content truth, runtime determinism, or publish discipline.

## 3. Why now

- The canonical project model already treats `Content Core` as source of truth, `Admin Console` as write-side, and `Public Web` as read-side.
- Draft, review, publish, rollback, media upload, and SEO metadata already exist in the current system, which makes a narrow factory layer feasible.
- The project now needs a controlled experimentation surface that is faster than fully manual authoring but safer than arbitrary generation.
- A contract-first landing factory is the smallest useful AI-enabled surface that can fit the current canon without turning the product into a generic builder.
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

## 5. Epic scope

### In scope

- Create a landing candidate from a brief or existing content context.
- Produce a machine-readable landing spec for that candidate.
- Validate the candidate against a strict contract.
- Generate a deterministic preview for human review.
- Support comments, comparison, and revision loops inside admin.
- Allow an approved version to enter the existing editorial publish workflow.
- Preserve auditability from draft to publish.
- Keep ordinary content and layout experiments inside the approved contract free from server redeploys.

### Out of scope

- Arbitrary HTML, JSX, or freeform frontend code generation.
- A general no-code page builder.
- A public page editing surface.
- Autonomous publish by AI.
- A new design system editor.
- A new website generation platform.
- Solving current SEO discovery infrastructure gaps inside this epic.
- Expanding route ownership beyond what the current canon and runtime can already support.

### Dependencies and current limitations

- Current runtime drift exists between contract and renderer for some blocks.
- `hero` and `faq_list` are examples of contract/runtime mismatch that this PRD does not pretend to fix.
- The root homepage is still outside the unified content-core read path.
- SEO discovery support is incomplete in runtime, so the first rollout cannot assume full `robots`, `sitemap`, and AI-discovery coverage.

## 6. Non-goals

- Not "AI builds websites automatically."
- Not a visual page-builder replacement.
- Not a general website generation platform.
- Not a way to bypass editorial review.
- Not a way to let AI mutate published truth silently.
- Not a way to publish directly from prompts.
- Not a replacement for the current content-core or publish model.
- Not a new public AI chat or public generator surface.

## 7. Personas / roles involved

| Role | Primary job in this epic | Notes |
|---|---|---|
| SEO Manager | Creates or refines candidates, checks search intent, metadata, and variant fit, comments on drafts. | Main day-to-day operator for experimentation. |
| Business Owner | Confirms business truth, offer fit, proof, and final commercial approval. | Human approval is required before publish. |
| Superadmin | Owns publish and rollback authority. | Final release authority stays explicit. |
| AI assistant | Drafts, rewrites, proposes structured variants, and suggests SEO wording. | Assistive only, not truth owner, not publisher. |

## 8. Core concept

In this project, "contract-driven landing factory" means a narrow production line for landing or page candidates where every step is structured and reviewable:

`brief -> landing spec -> candidate -> validation report -> preview artifact -> comment / revision -> approved artifact -> publish`

The factory is an operational layer above the content core. It does not replace canonical content truth, and it does not let AI invent arbitrary page structure. The output must stay machine-verifiable, human-reviewable, and deterministic at render time.

## 9. Primary workflow

1. Create candidate.
   - A human or assisted admin flow starts from a brief, target, and business goal.
2. Generate or compose landing spec.
   - The candidate is expressed as structured data, not as freeform page code.
3. Validate.
   - The system checks required fields, allowed blocks, stable refs, SEO constraints, and publish gates.
4. Preview.
   - The candidate is rendered into a deterministic review artifact.
5. Comment and compare.
   - SEO Manager, Business Owner, and Superadmin can review differences, annotate, and request changes.
6. Revise.
   - The candidate or spec is updated and revalidated.
7. Approve.
   - A human approval marks the artifact as ready for publish.
8. Publish.
   - The approved version enters the existing explicit publish workflow and becomes the published snapshot.

AI may assist during creation, validation explanation, and revision, but it never skips validation, human review, or publish.

## 10. Product surfaces

### Admin-side surfaces only

- Landing Factory workspace for candidate creation and iteration.
- Spec-oriented editor or form surface for structured landing data.
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

## 11. Canonical artifacts

| Artifact | What it is | Truth status | Why it matters |
|---|---|---|---|
| Draft candidate | Working output from AI or human-assisted composition. | Not truth. | Enables exploration without polluting canonical state. |
| Landing spec | Structured contract describing the candidate, allowed structure, refs, SEO, and constraints. | Reviewable contract. | Makes the candidate machine-verifiable. |
| Validation report | System-generated result of contract checks and blockers. | Derived artifact. | Tells humans why a candidate can or cannot advance. |
| Preview artifact | Deterministic rendered view for human review. | Derived artifact. | Lets reviewers see the contract as users would experience it. |
| Approved / published artifact | Frozen version that entered publish workflow and became public. | Canonical published snapshot. | This is the only artifact that should reach public read-side. |

## 12. Rules and constraints

- Deterministic rendering is mandatory.
  - The same approved artifact, rendered by the same contract version, must produce the same public result.
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
- Public read-side only.
  - Published state is the only state visible to public web.
- AI is assistive only.
  - AI can help author and explain, but it is not a route owner or truth owner.

## 13. Success criteria

The epic is successful when all of the following are true:

- A landing candidate can be created as a structured artifact without direct code edits.
- The candidate can be validated against a clear contract and produce actionable failures.
- A deterministic preview can be generated from the candidate.
- SEO Manager and Business Owner can comment and request revision inside admin.
- An approved artifact can move into the existing publish workflow.
- Publish remains explicit and human-controlled.
- Public web consumes only the published snapshot.
- AI-generated content cannot reach public state without human review.
- Ordinary content and layout experiments inside the approved contract do not require a server redeploy.
- The product does not drift into a general page-builder or autonomous website generator.

## 14. Risks / open questions

| Category | Risk / open question | Why it matters |
|---|---|---|
| Architectural | Current runtime already shows contract/render drift in some block areas. | The factory must not promise blocks the renderer cannot deterministically render. |
| Runtime | The root homepage is still outside the unified content-core read path. | The first rollout must be explicit about route coverage. |
| SEO | Discovery infrastructure is incomplete in runtime. | Do not overstate launch SEO automation before the supporting routes exist. |
| Product | The epic could drift into page-builder territory if block freedom is widened too much. | That would break the current canon and dilute the workflow. |
| Operational | Approval, revision, and publish boundaries must remain visible and separate. | The factory must not blur review with release. |
| Security / quality | AI suggestions can carry weak claims or unsupported references. | Human review and validation remain mandatory. |
| Open question | Which route families are first-class targets for landing candidates? | This must be narrowed before rollout. |
| Open question | Where exactly does variant comparison live: candidate level, spec level, or revision level? | The UI and artifact model depend on this decision. |

Current canon already blocks the wider ambition of an arbitrary AI site generator, a full no-code builder, and an autonomous publisher. This PRD accepts those constraints instead of trying to route around them.

## 15. Proposed next document pack after PRD approval

After this PRD is reviewed and accepted, the minimum next engineering doc pack should define:

- Landing spec contract.
- Block registry contract.
- Render contract.
- Verification contract.
- Publish artifact contract.
- Implementation plan.

These are the narrow follow-up documents needed to turn the PRD into executable engineering scope without reopening the whole product direction.

## Appendix A - Proposed follow-up engineering document set

1. `Landing Spec Contract`
   - Why needed: defines the machine-readable shape of a landing candidate, including required fields, allowed references, SEO inputs, and versioning.
   - What it must not do: it must not become a general product requirements document.

2. `Block Registry Contract`
   - Why needed: defines the allowed block types, block variants, field rules, and rejection behavior for landing compositions.
   - What it must not do: it must not open an uncontrolled block system.

3. `Render Contract`
   - Why needed: defines how an approved spec is turned into a deterministic public or preview render.
   - What it must not do: it must not describe ad hoc frontend code generation.

4. `Verification Contract`
   - Why needed: defines the machine checks, severity levels, and publish blockers that guard the workflow.
   - What it must not do: it must not hide human review behind a "validation passed" label.

5. `Publish Artifact Contract`
   - Why needed: defines the frozen snapshot that enters publish, how it relates to revision history, and what the public read-side consumes.
   - What it must not do: it must not turn publish into a silent save operation.

6. `Implementation Plan`
   - Why needed: sequences the engineering work, names dependencies, and separates current runtime gap closure from the epic itself.
   - What it must not do: it must not rewrite the PRD or expand the product scope.
