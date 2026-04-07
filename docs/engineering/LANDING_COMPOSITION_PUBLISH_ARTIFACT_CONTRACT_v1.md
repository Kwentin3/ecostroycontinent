# LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1

## Purpose

This contract defines what is frozen at the publish boundary for the landing-first composition workspace.

It is grounded in the current published page truth model and does not require a new immutable snapshot store.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Publish boundary semantics, approval record vs published artifact, public consumption rules, rollback meaning. | New snapshot store design, broad workflow redesign, route-family expansion, generic page-builder semantics. | The current published page truth remains the public source of truth. | Silent mutation of published content, draft leakage to public, autonomous publish. |

## Publish boundary

Publish freezes the approved landing draft into the canonical published page truth selected by the workflow.

The workflow must resolve exactly one `Page` owner before publish.

The published artifact is the active published page revision plus the publish metadata that points to it.

There is no separate landing-owned published store in v1.

No new immutable snapshot store is required for v1.

## Frozen set at publish time

- approved landing composition spec version
- canonical draft payload
- target `Page` owner
- published reference set for media, services, cases, and shell data
- SEO fields used by the published landing surface
- publish metadata such as approver and publish time

If any of those change after publish, that is a new draft and a new publish action, not an in-place mutation.

## Approval record vs published artifact

| Artifact | Meaning | Public visibility |
|---|---|---|
| Approval record | Human sign-off that the draft may move to publish. | No |
| Published artifact | The revision selected by the active published pointer. | Yes |

Approval is not public release.

The landing draft itself is workspace state; the durable owner of the publish result is always `Page`.

## Public read-side rule

The public read-side may consume only:

- the active published page revision
- published lookups for linked services, cases, galleries, and media
- published global shell data when the current renderer uses it as fallback presentation text

Draft revisions, review state, and approval records are not public inputs.

## Rollback semantics

- Rollback switches the active published pointer to a previous published revision.
- Rollback does not mutate the old published revision.
- Rollback does not delete approval history.
- Rollback does not convert a draft into published state.

## No silent mutation rule

- Published content is not edited in place.
- Any post-publish change creates a new draft revision.
- Any change that affects the published artifact requires an explicit republish action.

## Runtime honesty note

This contract matches the current published revision pointer model.

It does not claim a physically immutable snapshot store that the runtime does not currently have.
