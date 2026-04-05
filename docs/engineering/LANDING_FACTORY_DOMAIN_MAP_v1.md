# LANDING_FACTORY_DOMAIN_MAP_v1

## Purpose

This doc cluster is the minimum engineering canon for the service-first landing factory rollout of `Экостройконтинент`.

It is intentionally narrow. It exists to turn the accepted product posture into a small implementation-ready contract set, not into a broad platform blueprint.

## Why this is the minimum sufficient set

The first rollout has only one supported route family: `/services/[slug]`.

To implement that rollout safely, we need exactly one doc each for:

- the candidate/spec shape
- the allowed section registry
- deterministic render behavior
- verification and gating
- the publish boundary
- implementation order

Anything beyond that would either duplicate one of those seams or drift into broader CMS, SEO, or AI platform work.

## Placement

These docs live under `docs/engineering/` because they are implementation-oriented contracts.

Product posture and canon stay in `docs/product-ux/`.

## Read order

1. `SERVICE_LANDING_SPEC_CONTRACT_v1.md`
2. `SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md`
3. `SERVICE_RENDER_CONTRACT_v1.md`
4. `SERVICE_VERIFICATION_CONTRACT_v1.md`
5. `SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md`
6. `SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`

`SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v1.md` remains as a historical baseline; v2 is the current implementation-sequencing plan.

## Dependency order

- Spec contract and block registry contract must be settled first.
- Render contract depends on both of those contracts.
- Verification contract depends on spec, registry, and render contracts.
- Publish artifact contract depends on verification semantics and current publish pointer behavior.
- Implementation plan depends on all prior docs and should not invent new product scope.

## Product inputs vs engineering outputs

| Type | Documents | Role |
|---|---|---|
| Product inputs | `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`, `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`, `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md` | Set the accepted posture, service-only boundary, and runtime honesty. |
| Engineering outputs | The 6 docs in this cluster | Define the implementation-ready contract surface for the first rollout. |

## Doc map

| Doc | Owns | Does not own |
|---|---|---|
| `SERVICE_LANDING_SPEC_CONTRACT_v1.md` | Service candidate shape, relation to revision payload, required fields, allowed refs, SEO fields, source context expectations. | Render implementation, publish workflow, other route families. |
| `SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md` | Allowed service sections, ordering, required and optional section fields, excluded blocks. | Generic page block platform, FAQ/article/review surfaces, homepage behavior. |
| `SERVICE_RENDER_CONTRACT_v1.md` | Deterministic preview and public render rules for the service rollout. | Design system policy, frontend architecture beyond this route family. |
| `SERVICE_VERIFICATION_CONTRACT_v1.md` | Validation classes, severities, machine-verifiable report shape, approval and publish gating semantics. | Business strategy, code implementation, broader CMS validation policy. |
| `SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md` | What is frozen at publish boundary, active published pointer semantics, rollback implications. | Immutable snapshot store redesign, broad workflow redesign. |
| `SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md` | Workstreams, sequence, dependencies, checkpoints, deferred items. | Sprint fiction, roadmap theater, new product direction. |

## Explicitly outside this domain

- `/`
- `/cases/[slug]`
- `/about`
- `/contacts`
- article, FAQ, and review routes
- page-builder semantics
- homepage unification
- general AI platform design
- broad CMS redesign
- broad SEO runtime redesign
- immutable publish snapshot store redesign

## Intentionally deferred topics

- Route-family expansion beyond services
- `page` block model convergence with other content contracts
- FAQ/article/review entity packs
- full SEO discovery runtime
- any non-service landing experimentation surface
