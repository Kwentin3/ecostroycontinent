# SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v1

This document is superseded by `SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md` for implementation sequencing. It is kept as the historical infra-first baseline.

## Objective

Implement the first rollout of the service-first landing factory for `/services/[slug]` with deterministic preview, machine verification, and explicit publish handoff.

The goal is a narrow, implementation-ready path from candidate to publish without route-family expansion.

## Assumptions

- The current service route family remains the only public target.
- The current revision, review, publish, and rollback model remains canonical.
- AI assistance stays draft-only and assistive only.
- No homepage, case, about, contacts, FAQ, article, or review rollout is included.
- No new immutable snapshot store is required for v1.

## Workstreams

| Workstream | Owns | Depends on |
|---|---|---|
| Contract finalization | Lock the six engineering contracts and close any wording ambiguity. | PRD v0.2 and anamnesis. |
| Spec projection | Turn the service candidate into a normalized service landing spec. | Service Landing Spec Contract. |
| Section registry wiring | Enforce the allowed service section set and ordering. | Service Block Registry Contract. |
| Render alignment | Make preview and public render deterministic for the same service artifact. | Spec and registry contracts. |
| Verification wiring | Produce the machine-verifiable report and gate outcomes. | Spec, registry, render, and current readiness logic. |
| Publish handoff | Attach approval to the existing publish workflow and pointer semantics. | Verification and publish artifact contracts. |
| QA and rollout | Exercise the flow against real service content, media, cases, and galleries. | All prior workstreams. |

## Ordered phases

### Phase 0 - contract lock

- Finalize the six documents in this cluster.
- Freeze the service-only route boundary.
- Freeze the allowed section ids.
- Freeze the required verification outputs.

### Phase 1 - candidate and spec handling

- Build the service candidate/spec projection.
- Make the spec the factory-facing view of the existing service revision payload.
- Keep the canonical revision payload as the source of truth.

### Phase 2 - verification and preview

- Produce the verification report.
- Block unsupported sections and unsupported refs.
- Render preview deterministically from the approved section registry.
- Make preview and public render semantically consistent.

### Phase 3 - publish handoff and rollback

- Connect approval to the existing publish path.
- Preserve active published pointer semantics.
- Keep rollback pointer-based, not mutation-based.

### Phase 4 - limited rollout

- Exercise the flow on current service entities.
- Confirm that the rollout does not touch other route families.
- Confirm that public reads remain published-only.

## Critical dependencies

- The current service renderer must remain the public render target.
- The current publish workflow must remain the publish authority.
- Linked media, cases, and galleries must be resolved from published truth.
- Validation must reject any candidate that relies on unsupported section ids or route families.

## Rollout checkpoints

| Checkpoint | Success condition |
|---|---|
| Contract sign-off | The six docs are approved and internally consistent. |
| Candidate verification | A real service candidate passes structural, truth, render, and readiness checks. |
| Preview parity | Preview matches the approved public section order and semantics. |
| Publish round trip | The candidate can be approved, published, and then rolled back by pointer. |
| Scope guard | Unsupported sections or route families fail before publish. |

## Exit criteria

- A service candidate can move from draft to review to approval to publish using the new factory path.
- The public service page consumes only published state.
- The system remains service-only and does not imply other route families.
- Unsupported section ids, unpublished refs, and missing publish gates are blocked by verification.
- No code path relies on arbitrary HTML, JSX, or page-builder semantics.

## Deferred items

- `/`
- `/cases/[slug]`
- `/about`
- `/contacts`
- article, FAQ, and review workflows
- homepage unification
- `page.hero` and `faq_list` convergence work
- full SEO discovery runtime
- a physically immutable publish snapshot store
- any broader AI platform work

## What should not be attempted in first rollout

- Multi-route landing generation
- A generic block editor
- New route-family ownership
- Public AI generation surfaces
- A new CMS architecture
- A new publish architecture
