# SERVICE_VERIFICATION_CONTRACT_v1

## Purpose

This contract defines the machine checks and gating rules for service landing candidates in the first rollout.

It turns the candidate/spec pair into a verification report that can drive review, approval, and publish decisions.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Validation classes, severities, report shape, and gating semantics. | Render implementation, route work, broad CMS validation policy. | Spec, block registry, render, and current service readiness logic are available. | Hidden human override, silent warnings that allow publish, non-service validation domains. |

## Validation classes

| Class | Purpose | Default severity | Blocks publish |
|---|---|---|---|
| Structural / schema | Checks required fields, field types, route family, and allowed section ids. | Blocker | Yes |
| Reference / truth | Checks that linked cases, galleries, media, and base revision exist and are published where required. | Blocker | Yes |
| Render compatibility | Checks section order, declared sections, and required inputs for deterministic render. | Blocker | Yes |
| Editorial / publish readiness | Checks CTA, proof path, SEO completeness, slug collisions, and publish obligations. | Blocker or warning, depending on the issue. | Usually yes |
| Claim / risk | Checks unsupported claims, weak proof, and ambiguous commercial statements. | Warning by default | Can become blocker if the claim cannot be substantiated |

## Minimum machine-verifiable outputs

| Field | Required | Notes |
|---|---|---|
| `candidateId` | Yes | Stable candidate identifier. |
| `baseRevisionId` | Yes | Revision the candidate is derived from. |
| `routeFamily` | Yes | Fixed to `service`. |
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

This contract mirrors the current service readiness model:

- service `slug` uniqueness
- `title`, `h1`, `summary`, `serviceScope`
- `ctaVariant`
- proof path presence through `primaryMediaAssetId`, `relatedCaseIds`, or `galleryIds`
- published references for media, cases, and galleries
- SEO fields
- open publish obligations

The contract does not invent a second gating system. It organizes the existing logic into a machine-readable factory report.

## Report shape

| Report section | Contents |
|---|---|
| Identity | candidate id, base revision id, route family, spec version |
| Summary | overall status, blocker count, warning count, approval eligibility |
| Class results | one entry per validation class with status and message list |
| Blocking issues | structured blockers with field references when available |
| Warnings | structured warnings with field references when available |
| Render outcome | render compatible or not, plus the blocked section ids if any |
| Publish outcome | publish ready or not, plus the blocking reason if not |

## Runtime honesty note

The report must fail a candidate that relies on unsupported sections or unsupported route families.

The report must not use the service-first rollout to hide the current page-model hero mismatch, the absent FAQ block, or homepage work that is out of scope.

