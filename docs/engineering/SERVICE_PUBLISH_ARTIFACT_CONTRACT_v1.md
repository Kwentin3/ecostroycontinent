# SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1

## Purpose

This contract defines what is frozen at the publish boundary for the service-first rollout.

It is grounded in the current published revision pointer semantics.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Publish boundary semantics, approval record vs published artifact, public consumption rules, rollback meaning. | New snapshot store design, broad workflow redesign, other route families. | The current active published revision pointer remains the public source of truth. | Silent mutation of published content, draft leakage to public, autonomous publish. |

## Publish boundary

Publish freezes the approved service landing state into the current revision model.

The published artifact is the active published revision plus the publish metadata that points to it.

No new immutable snapshot store is required for v1.

## Frozen set at publish time

- approved service landing spec version
- canonical service revision payload
- published reference set for media, cases, and galleries
- SEO fields used by the service route
- publish metadata such as approver and publish time

If any of those change after publish, that is a new draft and a new publish action, not an in-place mutation.

## Approval record vs published artifact

| Artifact | Meaning | Public visibility |
|---|---|---|
| Approval record | Human sign-off that the candidate may move to publish. | No |
| Published artifact | The revision selected by the active published pointer. | Yes |

Approval is not public release.

## Public read-side rule

The public read-side may consume only:

- the active published revision
- published lookups for linked cases, galleries, and media
- published global settings when the current service renderer already uses them as fallback presentation text

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

This contract matches the current `active_published_revision_id` model.

It does not claim a physically immutable snapshot store that the runtime does not currently have.

