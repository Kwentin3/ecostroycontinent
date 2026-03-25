# Admin Operations Contract First Slice

Проект: «Экостройконтинент»  
Версия: v0.2  
Статус: implementation-facing operations contract for admin first slice  
Основание: `PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `PRD_Экостройконтинент_v0.3.1.md`, `03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`, `02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`, `04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`

## 1. Purpose

Этот документ фиксирует executable operations contract для admin console first slice: кто какие действия может совершать, как движутся revisions, что означает review, approval, publish и rollback, какие readiness outcomes допустимы и какие audit events должны логироваться одинаково.

## 2. Scope

В scope:

- operational actors and action authority
- revision lifecycle
- review submission
- owner approval
- publish
- rollback
- readiness severities and outcomes
- slug-change obligations
- preview semantics
- audit/event contract

Вне scope:

- auth implementation details
- infra orchestration
- observability platform design
- later-slice workflow expansion

## 3. Canon assumptions inherited from PRD

- Approval and publish are separate operations.
- `Business Owner` is review authority where owner review is required.
- `Superadmin` is publish authority in first slice.
- `SEO Manager` works in editor / content operations mode.
- Published read-side consumes only validated published revisions.
- `reviewable revision` is a frozen decision snapshot.
- AI is assistive only and never publishes.

## 4. Operational actors and authority

| Actor | Main role | Can submit to review | Can approve owner-required revision | Can publish | Can rollback |
| --- | --- | --- | --- | --- | --- |
| `Superadmin` | Publish and operational integrity authority | Yes | Backup only in explicit exception handling | Yes | Yes |
| `SEO Manager` | Editorial and SEO operations actor | Yes | No | No | No |
| `Business Owner` | Review authority for business-sensitive changes | No | Yes | No | No |

### Action authority rules

- `SEO Manager` may create and edit drafts, prepare reviewable revisions and respond to send-back comments.
- `Business Owner` reviews decision-ready candidates, not raw editing state.
- `Superadmin` executes publish and rollback only after required approvals and checks.

## 5. Revision lifecycle state machine

### States

- `Draft`
- `Review`
- `Published`

### Transition rules

| From | Action | To | Notes |
| --- | --- | --- | --- |
| none | create revision | `Draft` | New working revision created |
| `Draft` | submit for review | `Review` | Requires minimum reviewable completeness |
| `Review` | send back with comment | `Draft` | Keeps history and review comments |
| `Review` | approve | `Review` with approval marker | Approval does not publish |
| `Review` | publish | `Published` | Only by `Superadmin`, only after required approval and blocking checks pass |
| `Published` | create next revision | `Draft` | New draft starts from published baseline |
| `Published` | rollback | `Published` | Switches active published revision to previous published revision |

### Key lifecycle rules

- Live content is never edited directly.
- Publish always targets one конкретную revision.
- Rollback never means manual live patching.

## 6. Review submission contract

### A revision may enter `Review` only if

- required reviewable fields are present
- critical refs resolve
- intent of change is filled
- change class is identified
- readiness summary is available
- preview state is known for candidate state

### Required submission metadata

- author
- timestamp
- change class
- short intent of change
- whether owner review is required
- AI involvement marker
- preview status

### Preview failure rule

If preview does not render because of clearly technical, infrastructure or transient failure outside candidate content itself, review submission may still proceed only into editorial review and only if:

- candidate state remains structurally valid
- blocking content and relation checks have already passed for review submission
- the failure is explicitly marked as `preview_unavailable`
- a human-readable failure reason is attached

In this case:

- `Business Owner` must not be asked to approve blindly
- owner review remains blocked until candidate visibility is restored
- publish remains blocked until preview is renderable again for the candidate state

If preview fails because of content invalidity, broken refs or candidate-specific rendering breakage, review submission is blocked as normal.

## 7. Reviewable revision edit rule

`Reviewable revision` is frozen for decision-making.

### Allowed without resubmission

- typo fix
- formatting cleanup
- obvious preview metadata correction that does not change public meaning

### Requires resubmission

- any claims-heavy wording change
- CTA change
- SEO intent change affecting public meaning
- route or slug change
- relation/proof basis change
- anything that changes preview meaning

## 8. Owner approval contract

### Owner review is required for

- first publish of launch-core service
- first publish of priority or flagship case
- `Page(type=about)`
- claims-heavy change
- route-affecting change on commercial or proof-led core entity
- substantive `Global Settings` truth change
- `Page(type=contacts)` first publish after contact truth is confirmed

### Owner actions

- `approve`
- `reject`
- `send_back_with_comment`

### Approval semantics

- approval confirms business acceptability of candidate state
- approval does not bypass readiness gates
- approval does not execute publish

## 9. Publish contract

### Publish may be executed only by

- `Superadmin`

### Publish requires

- revision in reviewable state
- all `blocking` readiness checks passed
- owner approval where required
- preview basis known
- publish side effects recorded where applicable

### Publish result

- chosen revision becomes active published revision
- public read-side is allowed to consume it
- side effects are recorded in audit timeline

## 10. Rollback contract

### Rollback may be executed only by

- `Superadmin`

### Rollback semantics

- target is a previous published revision
- rollback creates its own operational event
- rollback does not erase later draft history
- rollback may recreate route-side obligations if route truth changed across revisions

## 11. Readiness result contract

### Severity levels

- `blocking`
- `warning`
- `info`

### Blocking means

- publish is not allowed

### Warning means

- publish is allowed, but quality or trust posture is degraded

### Info means

- explanatory or advisory signal only

### Default blocking categories

- missing required fields
- invalid refs
- invalid route truth
- missing required owner approval
- missing required CTA on money page
- insufficient factual completeness for `Service` or `Case`
- unresolved slug-change obligations on published route-owning entity
- `Page(type=contacts)` without confirmed public contact truth

## 12. Contacts page special rule

`Page(type=contacts)` is not honestly publishable as a conversion page until public contact truth is confirmed.

### Contacts publish is blocked if any of the following is unconfirmed

- primary public phone or explicitly approved alternative primary channel
- messenger set when messengers are used as CTA
- primary CTA wording
- service area / contact wording from `Global Settings`

### After contact truth is confirmed

- minor editorial updates may go through standard editorial flow
- SEO-only updates may go through standard editorial flow
- any change to contact truth itself is treated as global truth change and requires owner approval

## 13. Slug-change obligations

If slug changes on a published route-owning entity, the operation must create obligations:

- redirect required
- revalidation required
- sitemap update required
- canonical URL check required

Exact infra execution is out of scope here, but obligation creation is mandatory domain behavior.

## 14. Preview semantics

Preview means candidate public state under review or pending publish.

### Preview must show

- candidate revision of current entity
- current published `Global Settings` if current revision does not change them
- candidate `Global Settings` if the reviewable candidate changes them or depends on bundled global change
- explicit marker of preview basis

### Preview availability rule

- `preview_renderable` means candidate visibility is available for review and publish decisions
- `preview_unavailable` may exist temporarily only for editorial review handling of transient technical failure
- `preview_unavailable` is never sufficient for owner approval or publish

### Preview rule

Owner must approve what the system is actually going to publish, not an approximate mock state.

## 15. Canonical event taxonomy

| Event key | Meaning | Minimum actor required |
| --- | --- | --- |
| `revision_created` | Draft revision created | `SEO Manager` or `Superadmin` |
| `revision_updated` | Draft revision updated | `SEO Manager` or `Superadmin` |
| `review_requested` | Revision submitted to review | `SEO Manager` or `Superadmin` |
| `preview_render_failed` | Preview for candidate state failed and was marked unavailable | system |
| `owner_review_requested` | Revision marked for owner review lane | system or submitting actor |
| `owner_approved` | Owner approved candidate | `Business Owner` |
| `owner_rejected` | Owner rejected candidate | `Business Owner` |
| `sent_back_with_comment` | Revision returned to draft with comment | reviewer |
| `publish_blocked` | Publish attempt stopped by blocking check | `Superadmin` or system |
| `published` | Revision promoted to active published revision | `Superadmin` |
| `rollback_executed` | Previous published revision restored | `Superadmin` |
| `slug_change_obligation_created` | Redirect / revalidation / sitemap obligations registered | system during publish |

## 16. Audit payload minimum

Every meaningful operation should capture:

- actor
- timestamp
- entity type and entity ID
- revision ID
- action type
- before / after summary
- change comment / intent
- change class
- approval state
- readiness result summary
- preview status and preview failure reason if applicable
- AI involvement yes/no
- AI input context class / source basis if applicable
- side effects triggered

## 17. AI operation markers

If AI assist was used, audit trail should capture at minimum:

- action type
- actor who invoked it
- when
- source basis:
  - `from current entity only`
  - `from linked entities`
  - `from published content`
  - `manual prompt only`
- whether output was accepted, edited or discarded

## 18. Relationship to admin PRD

This document narrows and operationalizes:

- lifecycle model
- revision model
- review / approval model
- publish model and readiness gates
- owner review surface semantics
- audit / forensic / logging model

It does not reopen product scope, entity set or role model.

If backlog convenience, local implementation shortcut or infra pressure conflicts with this contract or domain boundaries, this contract wins and implementation must stop and escalate.

## 19. Open questions allowed here

Допустимы:

- exact mechanism of auth/session handling
- exact transport shape for events
- exact background job execution for revalidation and sitemap refresh

Недопустимы:

- reopening approval vs publish split
- reopening whether owner review exists
- reopening readiness severity model
- reopening whether AI can publish
