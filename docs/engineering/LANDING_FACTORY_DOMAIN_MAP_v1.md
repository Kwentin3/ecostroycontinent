# LANDING_FACTORY_DOMAIN_MAP_v1

## Purpose

This doc cluster is the minimum engineering canon for the landing-first composition workspace rollout of `Экостройконтинент`.

It is intentionally narrow. It exists to turn the accepted product posture into a small implementation-ready contract set, not into a broad platform blueprint.

## Why this is the minimum sufficient set

The primary target is the landing / one-page composition workspace.

The first canonical rollout needs exactly one doc each for:

- the candidate/spec shape
- the allowed block registry
- deterministic render behavior
- verification and gating
- the publish boundary
- implementation order

Service pages under `/services/[slug]` remain route-owning SEO surfaces and reusable adjacent inputs, but they are no longer the primary AI workspace target in this domain.

Anything beyond that would either duplicate one of those seams or drift into broader CMS, SEO, or AI platform work.

## Placement

These docs live under `docs/engineering/` because they are implementation-oriented contracts.

Product posture and canon stay in `docs/product-ux/`.

## Read order

1. `LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
2. `LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
3. `LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
4. `LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
5. `LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`
6. `LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`

## Adjacent / historical service-mode pack

These docs remain available as adjacent, historical, service-mode references:

- `SERVICE_LANDING_SPEC_CONTRACT_v1.md`
- `SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md`
- `SERVICE_RENDER_CONTRACT_v1.md`
- `SERVICE_VERIFICATION_CONTRACT_v1.md`
- `SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- `SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`

Use the service-mode pack when you are specifically working on service-page SEO truth, route ownership, or historical comparison. Do not treat it as the primary target for the AI workspace domain anymore.

