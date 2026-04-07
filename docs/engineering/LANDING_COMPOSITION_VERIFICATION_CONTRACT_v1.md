# LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1

## Purpose

This contract defines the machine checks and gating rules for landing composition drafts in the landing-first workspace.

It turns the draft/spec pair into a verification report that can drive review, approval, and publish decisions.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Validation classes, severities, report shape, and gating semantics. | Render implementation, route work, broad CMS validation policy. | Spec, block registry, render, and current readiness logic are available. | Hidden human override, silent warnings that allow publish, non-composition validation domains. |

## Validation classes

| Class | Purpose | Default severity | Blocks publish |
|---|---|---|---|
| Structural / schema | Checks required fields, field types, composition family, and allowed block ids. | Blocker | Yes |
| Reference / truth | Checks that linked services, cases, media, shell regions, and base truth exist and are published where required. | Blocker | Yes |
| Render compatibility | Checks block order, declared blocks, and required inputs for deterministic render. | Blocker | Yes |
| Editorial / publish readiness | Checks CTA, proof path, SEO completeness, and publish obligations. | Blocker or warning, depending on the issue. | Usually yes |
| Claim / risk | Checks unsupported claims, weak proof, and ambiguous commercial statements. | Warning by default | Can become blocker if the claim cannot be substantiated |

## Minimum machine-verifiable outputs

| Field | Required | Notes |
|---|---|---|
| `candidateId` | Yes | Stable draft identifier. |
| `pageId` | Yes | Canonical `Page` truth owner that the draft will publish into. |
| `basePageId` | No | Present when the draft is derived from an existing `Page` truth. |
| `compositionFamily` | Yes | Fixed to `landing`. |
| `specVersion` | Yes | Contract version used for verification. |
| `checkedAt` | Yes | Timestamp of the verification run. |
| `overallStatus` | Yes | `pass`, `pass_with_warnings`, or `blocked`. |
| `classResults` | Yes | Per-class pass/block output. |
| `blockingIssues` | Yes | Structured list of blockers. |
| `warnings` | Yes | Structured list of non-blocking issues. |
| `renderCompatible` | Yes | Boolean render compatibility result. |
| `publishReady` | Yes | Boolean publish readiness result. |
| `approvalEligible` | Yes | Human-review gate result before publish. |

## Gating semantics

- Structural or reference failures block review advance.
- Render compatibility failures block preview or public release.
- Editorial readiness failures block approval or publish depending on the issue.
- Claim or risk warnings do not auto-publish.
- Claim or risk blockers must stop approval when the source basis is insufficient.
- Human approval is still required even when verification passes.

## Relation to current readiness checks

This contract mirrors the current readiness model:

- title, hero, proof and CTA presence
- selected services, cases, and media references
- published references for media and structured proof assets
- shell region references when the composition uses them
- SEO fields
- open publish obligations

The contract does not invent a second gating system. It organizes the existing logic into a machine-readable factory report.

## Report shape

| Report section | Contents |
|---|---|
| Identity | candidate id, base page id when applicable, composition family, spec version |
| Summary | overall status, blocker count, warning count, approval eligibility |
| Class results | one entry per validation class with status and message list |
| Blocking issues | structured blockers with field references when available |
| Warnings | structured warnings with field references when available |
| Render outcome | render compatible or not, plus the blocked block ids if any |
| Publish outcome | publish ready or not, plus the blocking reason if not |

## Runtime honesty note

The report must fail a draft that relies on unsupported blocks or unsupported route families.

The report must not hide the difference between a landing composition draft and route-owning published page truth.
