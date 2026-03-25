# Admin Implementation Backlog First Slice

Проект: «Экостройконтинент»  
Версия: v0.2  
Статус: execution backlog and autonomous work basis for admin first slice  
Основание: `PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`, `PRD_Экостройконтинент_v0.3.1.md`, `04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`

## 1. Purpose

Этот документ переводит admin PRD и два implementation contracts в минимальный execution backlog для first slice. Его задача не в том, чтобы создать большой roadmap, а в том, чтобы задать узкий, dependency-aware и launch-disciplined порядок автономной работы по admin domain.

## 2. Scope

В scope:

- first-slice admin domain only
- content core support for `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page`
- admin workflows for draft, review, owner approval, publish, rollback
- review, readiness, preview and audit support
- minimal role-based access for `Superadmin`, `SEO Manager`, `Business Owner`

Вне scope:

- later-slice entities: `FAQ`, `Review`, `Article`
- public AI chat
- calculator
- broad analytics or SEO dashboard
- enterprise IAM
- design-system expansion
- broad infra program beyond admin slice needs

## 3. Execution principles

- Build only what is needed for launch-core content operations.
- Respect contract-first order: content truth first, operations truth second, UI and API behavior after that.
- Do not implement builder-style flexibility not demanded by first slice.
- Stop and escalate where owner confirmation or infra confirmation is required.
- Prefer vertical slices that end in verifiable behavior over large speculative platform layers.

### Condensed guardrails for execution

#### Mandatory rules

- treat `Admin Console` as write-side only
- treat `Public Web` as read-side only
- keep truth in `Content Core`
- treat publish as explicit operation only
- treat `Service` / `Case` route truth and `MediaAsset` / `Gallery` first-class posture as non-negotiable
- treat contracts and domain boundaries as higher authority than backlog convenience

#### Forbidden moves

- no hardcoded content, SEO, CTA or route truth in templates or UI components
- no implicit publish via save or edit
- no bypass of revision, review, approval or publish flow "for now"
- no raw media URLs as canonical truth
- no second competing model for media, SEO, review or publish
- no scope broadening into builder-first or DAM-first behavior

#### Stop-and-escalate triggers

- backlog task appears to conflict with contract truth
- implementation pressure pushes route ownership violation
- implementation pressure pushes publish bypass
- required truth seems to need storage outside `Content Core`
- infra limitation would force canon-breaking shortcut

## 4. Done criteria for the backlog

Admin first slice is considered implementation-ready when:

- content model for first-slice entities is unambiguous in code and storage boundaries
- revision lifecycle works end-to-end for first-slice entities
- owner review flow is usable for `Business Owner`
- publish consumes only validated reviewable revisions
- rollback is deterministic
- `/contacts` cannot publish without confirmed contact truth
- slug-affecting publish creates obligations and logs them
- audit trail captures canonical events and AI markers
- role checks match the operations contract

## 5. Work packages

### WP-1. Content core foundation

#### Goal

Create the minimal write-side content core foundation that can represent first-slice entities, refs, revisions and published revision pointers without ambiguity.

#### Includes

- first-slice entity representations
- stable IDs / refs
- route-owning entity handling
- published revision pointer model
- support for `Global Settings`

#### Why first

Everything else depends on this layer: admin forms, preview, readiness, publish and read-side projection.

#### Deliverables

- implemented first-slice entity storage model
- implemented revision storage discipline
- tests or verification for entity creation and revision linkage

#### Done when

- a `Service`, `Case`, `Page`, `Gallery`, `MediaAsset` and `Global Settings` record can be created and versioned
- published revision pointer can be assigned without mutating live content directly

### WP-2. Typed blocks and relation integrity

#### Goal

Implement the bounded content-assembly model for `Page` and relation integrity for all first-slice entities.

#### Includes

- phase-1 typed blocks
- relation validation
- gallery and media linkage
- route ownership guardrails
- explicit `gallery` block handling through `Gallery` refs only

#### Depends on

- `WP-1`

#### Deliverables

- typed block schemas in code
- relation resolution logic
- validation for broken refs and disallowed ownership collisions
- no fallback path that turns `gallery` block into ordered inline media list

#### Done when

- `Page` can store and validate only allowed typed blocks
- relations resolve only through stable refs
- invalid route duplication is rejected

### WP-3. Readiness engine

#### Goal

Implement publish-readiness evaluation aligned with PRD and operations contract.

#### Includes

- `blocking`, `warning`, `info` severity model
- entity-specific structural checks
- `/contacts` special rule
- slug-change obligation detection
- preview status handling for transient technical preview failure without weakening publish rules

#### Depends on

- `WP-1`
- `WP-2`

#### Deliverables

- readiness evaluation service or equivalent domain module
- machine-readable readiness results
- human-readable readiness explanations for admin UI
- preview status model with explicit `preview_renderable` / `preview_unavailable`

#### Done when

- system can explain why candidate revision is or is not publishable
- `/contacts` is blocked until contact truth is confirmed
- service and case structural minimums are enforced
- transient preview failure is visible and logged without enabling blind owner approval or publish

### WP-4. Review and owner-approval workflow

#### Goal

Implement reviewable revision flow, owner review lane and frozen review snapshot discipline.

#### Includes

- submit to review
- review metadata capture
- owner review required logic
- approve / reject / send back with comment
- reviewable revision edit rule enforcement

#### Depends on

- `WP-1`
- `WP-3`

#### Deliverables

- review transition handling
- owner approval markers
- send-back comment support
- resubmission behavior for meaningful changes

#### Done when

- `SEO Manager` can submit revision for review
- `Business Owner` can approve or send back required items
- meaningful changes after review submission require resubmission

### WP-5. Publish and rollback operations

#### Goal

Implement deterministic publish and rollback behavior for first-slice entities.

#### Includes

- publish action by `Superadmin`
- publish gating using readiness and approval state
- published revision activation
- rollback to previous published revision
- slug-change obligation creation

#### Depends on

- `WP-3`
- `WP-4`

#### Deliverables

- publish operation
- rollback operation
- side-effect obligation recording

#### Done when

- only validated revision can publish
- rollback restores previous published revision deterministically
- slug change records required obligations

### WP-6. Audit and forensic timeline

#### Goal

Implement canonical event logging and human-readable operational timeline for admin actions.

#### Includes

- event taxonomy support
- audit payload minimum
- AI involvement markers
- AI input context class markers

#### Depends on

- `WP-4`
- `WP-5`

#### Deliverables

- canonical event emission
- audit persistence
- entity-level operational timeline view support
- timeline presentation optimized for human-readable chronological flow, not raw log dump

#### Done when

- core events are logged consistently
- publish, approval, rollback and send-back events are traceable
- AI-assisted actions are distinguishable from manual edits

### WP-7. Admin access and role enforcement

#### Goal

Implement minimal role-gated access for the three fixed roles.

#### Includes

- login/auth wiring for first slice
- role assignment assumptions in code
- action-level permission checks aligned with operations contract
- minimal user management support for `Superadmin`

#### Depends on

- `WP-4`
- `WP-5`

#### Deliverables

- role-aware admin access
- action-level permission guardrails
- minimal user management path

#### Done when

- `SEO Manager` cannot publish
- `Business Owner` cannot bypass editor flow and publish
- `Superadmin` can manage users and publish

### WP-8. Admin UI vertical slices

#### Goal

Deliver only the UI surfaces needed to exercise the first-slice contracts end-to-end.

#### Includes

- entity lists for first-slice entities
- create/edit surfaces
- review inbox
- owner review card
- publish readiness view
- revision history
- audit timeline
- minimal user management

#### UI guidance for implementation

- dashboard groups work by actionability: `requires your action`, `waiting on others`, `ready for next step / ready to publish`
- readiness is visible inside editor flow as persistent panel, not only in final publish screen
- revision history and audit timeline should read as chronological narrative first
- media picker for visual assets should be grid-first with thumbnail preview, practical alt visibility and where-used visibility during selection

#### Depends on

- `WP-2`
- `WP-3`
- `WP-4`
- `WP-5`
- `WP-6`
- `WP-7`

#### Deliverables

- usable admin UI for content operations first slice

#### Done when

- first-slice actor workflows can be executed without direct DB or developer intervention

## 6. Cross-package verification

These checks should be run as integration-level verification, not only as unit logic.

- Create `Service` draft -> submit review -> owner approve if required -> publish.
- Create `Case` draft with gallery -> publish only after factual minimum and proof pass.
- Create `Page(type=contacts)` draft -> verify publish blocked before contact truth confirmation.
- Change slug on published route-owning entity -> verify obligation record exists.
- Send reviewed revision back with comment -> verify new draft path remains traceable.
- Roll back published revision -> verify previous published revision becomes active.
- Use AI assist on draft -> verify audit captures AI markers and source basis.

## 7. Autonomous work order

This is the recommended execution order for autonomous work:

1. `WP-1. Content core foundation`
2. `WP-2. Typed blocks and relation integrity`
3. `WP-3. Readiness engine`
4. `WP-4. Review and owner-approval workflow`
5. `WP-5. Publish and rollback operations`
6. `WP-6. Audit and forensic timeline`
7. `WP-7. Admin access and role enforcement`
8. `WP-8. Admin UI vertical slices`

## 8. Explicit stop-and-escalate points

Autonomous work should stop and ask for confirmation when blocked by:

- final public contact truth
- final launch service-core confirmation if code path depends on hard inclusion rules
- final flagship / priority case map if workflow logic depends on exact classification source
- exact auth mechanism choice if repo context does not already constrain it
- exact infra hook for redirect persistence, cache revalidation or sitemap refresh

These are not reasons to delay internal admin slice work that does not depend on them.

## 9. What should not be built under this backlog

- visual page builder behavior
- arbitrary custom block engine
- generalized workflow designer
- broad analytics layer
- CRM-lite
- future-slice FAQ/Review/Article authoring unless explicitly pulled in later
- generic media library expansion beyond first-slice needs

## 10. Relationship to the admin PRD and contracts

This backlog is downstream of:

- `PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`

If implementation pressure conflicts with this backlog, the contracts win over the backlog, and the PRD wins over all three.
