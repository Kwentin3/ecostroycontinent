# Workflow Publish Revision Spec Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: workflow / revision / publish spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [02_Domain_and_Architecture_Boundaries_Экостройконтинент.md](./02_Domain_and_Architecture_Boundaries_Экостройконтинент.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)

## Purpose

Этот документ фиксирует семантику `Draft -> Review -> Published`, owner review map, publish readiness gates, rollback, preview и slug-change obligations. Он нужен, чтобы publish оставался отдельной операцией, а не случайным побочным эффектом CRUD.

## Scope

- revision state machine;
- change classes and owner review map;
- review submission and approval semantics;
- publish and rollback semantics;
- preview basis and publish side effects;
- slug-change obligations and contacts publish rule.

## What this document owns

- state machine of revisions;
- review lanes and approval semantics;
- publish gates and obligations;
- preview rules;
- rollback semantics;
- who may do what in workflow.

## What this document does not own

- content field schema;
- UI design;
- storage backend;
- diagnostics catalog beyond workflow-related checks;
- agent transport contract.

## Canon assumptions

- Publish is explicit and revision-based.
- Approval and publish are separate operations.
- The active published revision is the one public web consumes.
- AI content never goes live without human review and explicit publish.
- `Business Owner` remains review authority for claims-heavy and launch-critical materials.

## Non-goals

- multi-step enterprise workflow engine;
- arbitrary custom states per entity type;
- implicit publish on save;
- hidden live edits to published content;
- automatic owner approval by AI.

## Revision state machine

| From | Action | To | Notes |
| --- | --- | --- | --- |
| none | create draft | `Draft` | new working revision |
| `Draft` | submit for review | `Review` | only when reviewable minimum is met |
| `Review` | approve | `Review` | approval marker only; does not publish |
| `Review` | reject | `Draft` | history remains intact |
| `Review` | send back with comment | `Draft` | same as reject but comment-forward |
| `Review` | publish | `Published` | `Superadmin`; `SEO Manager` only for `Page` revisions after required owner approval |
| `Published` | create next revision | `Draft` | new draft starts from published baseline |
| `Published` | rollback | `Published` | switch active published revision to previous published revision |

## Change classes

| Class | Meaning | Owner review default |
| --- | --- | --- |
| A | minor editorial change | no |
| B | SEO-only operational change | no |
| C | commercial presentation change | yes for launch-core and flagship items |
| D | route-affecting change | yes |
| E | global truth change | yes |
| F | new launch-critical entity publish | yes |

### Typical examples

- A: typo fix, formatting cleanup, alt text improvement.
- B: meta title, meta description, internal linking, canonical refinement without route change.
- C: hero promise rewrite, CTA wording change, proof narrative changes.
- D: slug change, canonical route shift, depublication of live route-owning entity.
- E: public phone, messengers, region, contact truth, default CTA wording.
- F: first publish of launch service page, priority case, about page, or other launch-critical entity.

## Review lanes

### Editorial review lane

Used for ordinary content and readiness checks. Editors and Superadmin can see blockers, diff and preview candidate state.

### Owner review lane

Used for change classes that require explicit Business Owner authority. The owner sees a decision-ready packet, not a raw editing canvas.

## Review submission rules

A revision may enter `Review` only if:

- required fields are present;
- critical refs resolve;
- change intent is recorded;
- change class is determined;
- preview status is known;
- readiness summary is available.

Allowed after submission without resubmission only if the change is non-meaningful:

- typo fix;
- formatting cleanup;
- obvious preview metadata correction that does not change public meaning.

Any meaningful change requires a new review cycle.

## Owner review map

| Entity / change class | Owner review required? | Notes |
| --- | --- | --- |
| `Service`, first publish | Yes | especially launch-core pages |
| `Service`, commercial presentation | Yes for launch-core services | includes claims-heavy rewrites |
| `Service`, route-affecting | Yes | slug or route truth change |
| `Case`, first publish | Yes | especially priority or flagship cases |
| `Case`, commercial presentation | Yes for flagship / claims-heavy cases | proof narrative matters |
| `Page(type=about)` | Yes | launch-critical trust page |
| `Page(type=contacts)` first publish | Yes after contact truth is confirmed | blocked before confirmation |
| `Global Settings` substantive truth change | Yes | contacts, region, default CTA, brand truth |
| minor routine proof-led update on a published non-flagship case | No by default | still audited |

## Approval semantics

- approval confirms business acceptability of candidate state;
- approval does not bypass readiness gates;
- approval does not execute publish;
- approval does not make content live;
- approval does not change the active published revision;
- approval is not a save-time side effect.

### Forbidden wording / interpretation

The implementation and docs must not imply any of the following:

- "approved content becomes live"
- "owner approve triggers publish"
- "review save updates public state"
- "approval is equivalent to publish"

## Publish contract

Publish may be executed by:

- `Superadmin` for any publishable entity type in first slice;
- `SEO Manager` only for `Page` revisions that are already in `Review` and already have required owner approval.

Publish requires:

- revision in `Review`;
- all blocking readiness checks passed;
- required owner approval, if applicable;
- preview basis known;
- explicit publish action;
- publish side effects recorded in audit and obligations.

Publish result:

- chosen revision becomes active published revision;
- public read-side may consume it;
- read-side refresh or cache / projection hooks run as named side effects.

## Readiness gates

### Blocking gates

- missing required fields;
- broken or invalid refs;
- duplicate or invalid route truth;
- missing required owner approval;
- missing required CTA on money page;
- missing minimum factual completeness for `Service` or `Case`;
- unresolved slug-change obligations for published route-owning entity;
- `Page(type=contacts)` without confirmed contact truth.

### Warning gates

- weak but non-blocking proof inventory;
- partial SEO enhancement opportunity;
- missing optional media or supporting blocks;
- incomplete enrichment that does not change correctness.

## Slug-change obligations

If a published route-owning entity changes slug, the operation must create explicit obligations:

- redirect required;
- revalidation required;
- sitemap update required;
- canonical URL check required.

The publish event must not hide these side effects.

## Preview semantics

Preview means the candidate public state under review or pending publish.

Preview must show:

- the candidate revision;
- the current published baseline where relevant;
- the exact basis of preview;
- whether global settings are bundled into the candidate view.

`preview_unavailable` is never sufficient for owner approval or publish.

## Rollback semantics

- rollback targets a previous published revision;
- rollback does not erase later draft history;
- rollback is a distinct audited event;
- rollback may recreate route obligations if route truth changed across revisions.

See [Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md](./Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md) for any codepaths that already behave differently in the current runtime.

## Why publish is separate from CRUD

- CRUD answers "what is the draft state?"
- publish answers "what exact revision is now public truth?"
- separating them prevents silent live edits;
- separating them makes owner review explicit;
- separating them makes forensic analysis possible.

## Risks / failure modes

- save actions silently mutate live truth;
- approval gets mistaken for publish;
- preview becomes a fake mock instead of the real candidate state;
- slug-change obligations are created but not surfaced;
- contacts page goes live before contact truth is confirmed;
- rollback is implemented as a manual text patch instead of revision switch.

## Open questions

- Which side effects are mandatory in MVP beyond active pointer switch and audit?
- Should warnings be shown in a compact banner, a checklist, or both?
- How much of the review packet should be auto-generated versus manually curated?

## Decisions that must not be reopened by default

- Publish remains separate from approval.
- Publish remains separate from CRUD.
- Rollback is revision switching, not manual live editing.
- Owner review stays explicit for claims-heavy and launch-critical materials.
- `Page(type=contacts)` remains blocked until contact truth is confirmed.
