# LANDING_FACTORY_DOMAIN_MAP_v1

## Purpose

This doc cluster is the minimum engineering canon for the landing-first composition workspace rollout of `Экостройконтинент`.

Alignment note, 2026-04-10:
The term `landing-first composition workspace` in this file now means the main page workspace inside `Страницы`, not a separate first-layer AI domain.

It is intentionally narrow. It exists to turn the accepted product posture into a small implementation-ready contract set, not into a broad platform blueprint.

## Why this is the minimum sufficient set

The primary target is the page-owned composition workspace for standalone pages.

The first canonical rollout needs exactly one doc each for:
- the candidate/spec shape
- the allowed block registry
- deterministic render behavior
- verification and gating
- the publish boundary
- implementation order

Service pages under `/services/[slug]` remain route-owning SEO surfaces and reusable adjacent inputs, but they are not the primary user-facing composition surface in this domain.

Anything beyond that would either duplicate one of those seams or drift into broader CMS, SEO, or AI platform work.

## Placement

These docs live under `docs/engineering/` because they are implementation-oriented contracts.

Product posture and canon stay in `docs/product-ux/`.
