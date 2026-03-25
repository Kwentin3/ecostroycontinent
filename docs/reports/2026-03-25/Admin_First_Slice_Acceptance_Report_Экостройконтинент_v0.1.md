# Admin First Slice Acceptance Report

Статус: acceptance / reconciliation / evidence report  
Дата: 2026-03-25

## 1. Executive summary

Этот отчет сопоставляет canonical expectations для admin console first slice с фактической реализацией в текущем worktree и с доказанным proof against canonical Linux VM runtime.

Главный вывод:

- доменный и operational spine first slice реализован materially;
- canonical runtime proof выполнен честно against accepted `app + sql` runtime на Linux VM;
- но часть PRD- и UI-level acceptance criteria выполнена только частично;
- поэтому итоговый verdict: `ACCEPT WITH CONDITIONS`.

Это не “красивое почти готово”, а конкретный verdict:

- принимать можно как materially implemented admin first slice;
- полностью закрытым first slice считать пока нельзя;
- до full acceptance нужно закрыть несколько узких, но прямых acceptance gaps.

## 2. Scope of this acceptance review

В review включено:

- canonical baseline из PRD, project truth, boundary docs, content/operations contracts, implementation plan и UI conventions;
- текущий код в `app/`, `lib/`, `components/`, `db/`, `scripts/`, `tests/`;
- SQL migration baseline;
- proof scripts;
- фактический canonical runtime proof, выполненный на Linux VM against one compose stack `app + sql`.

В review не включено:

- повторное planning-проектирование;
- новый implementation run beyond narrow proof fixes;
- future-slice scope;
- enterprise IAM / analytics / builder / DAM expansion.

Важно:

- в user prompt перечислены admin contracts/backlog как `v0.1`, но в текущем repo реально присутствуют canonical admin docs `v0.2`;
- acceptance review выполнен по более новым реально присутствующим canonical inputs;
- relevant implementation commits как отдельный commit-set отсутствуют: review выполнен по текущему dirty worktree, а не по завершенной commit history.

## 3. Canonical expectations baseline

Ниже перечислены ключевые acceptance expectations, которые считались обязательными:

- `Public Web` должен остаться published read-side only.
- `Admin Console` должен остаться write-side tool only.
- `Content Core` в SQL должен быть source of truth для entities, relations, statuses и published revisions.
- `Publish` должен остаться explicit domain operation, не status flip.
- public read-side должен читать только published truth.
- `Service` и `Case` должны сохранить route truth.
- `Page` не должен перехватывать route truth `Service` / `Case`.
- `MediaAsset` и `Gallery` должны остаться first-class supporting entities.
- owner review должен оставаться отдельным approval-focused mode.
- dashboard должен оставаться action-centered.
- readiness должен быть видим внутри editing flow.
- audit / revision history должны оставаться human-readable.
- AI не должен становиться source of truth или autonomous publisher.

## 4. What was planned

Из implementation plan и admin PRD для first slice ожидались следующие deliverables:

1. bounded admin-domain foundation:
   - SQL schema;
   - auth / session baseline;
   - content core;
   - operations engine;
   - published read-side seam.

2. first-slice entity coverage:
   - `Global Settings`
   - `MediaAsset`
   - `Gallery`
   - `Service`
   - `Case`
   - `Page`

3. explicit operational flow:
   - draft
   - review
   - owner approval where required
   - publish
   - rollback
   - audit trail
   - slug-change obligations

4. admin surfaces:
   - dashboard
   - entity lists/editors
   - review inbox
   - owner review detail
   - publish readiness
   - user management
   - revision history / audit

5. first validating vertical slice:
   - `MediaAsset -> Gallery -> Case -> Service -> review -> owner approval -> publish -> public projection -> rollback`

6. verification:
   - tests;
   - build;
   - canonical runtime proof;
   - contacts hard-stop proof.

## 5. What was implemented

Фактически реализовано:

- SQL schema baseline с `app_users`, `app_sessions`, `content_entities`, `content_revisions`, `publish_obligations`, `audit_events`;
- DB client, migration script и seed script;
- auth/session fixed-role baseline;
- typed content core для first-slice entities;
- readiness engine;
- review / owner action / publish / rollback operations;
- audit event recording;
- public published read-side routes:
  - `/services`
  - `/services/[slug]`
  - `/cases`
  - `/cases/[slug]`
  - `/about`
  - `/contacts`
- admin UI surfaces:
  - dashboard
  - review inbox
  - review detail
  - entity list/editor/history
  - publish readiness
  - user management
- media picker and relation pickers;
- pure-domain tests;
- canonical runtime proof scripts for:
  - validating vertical slice
  - contacts hard-stop

Также был выполнен honest runtime proof:

- canonical Linux VM access validated;
- `db:migrate` passed;
- `db:seed` passed;
- live auth/session proof passed;
- validating vertical slice passed;
- contacts hard-stop proof passed.

## 6. Planned vs implemented matrix

| Area | Planned expectation | Implemented state | Acceptance status | Notes |
| --- | --- | --- | --- | --- |
| SQL content core | Single SQL source of truth with revisions and published pointer | Implemented | Fully implemented | `content_entities` + `content_revisions` + `active_published_revision_id` are present |
| Entity coverage | `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page` | Implemented | Fully implemented | Covered in schema, normalization, admin surfaces |
| Role model | `superadmin`, `seo_manager`, `business_owner` | Implemented | Fully implemented | Fixed-role model present |
| Review / approval / publish | Explicit operations | Implemented | Fully implemented | Backed by workflow functions and proof |
| Rollback operation | Explicit rollback by superadmin | Implemented in domain/API | Partially implemented | Operation exists and proof passed, but no visible rollback surface in admin UI |
| Read-side projection | Public pages consume only published truth | Implemented | Fully implemented | Read-side reads `active_published_revision_id` only |
| Dashboard | Action-centered | Implemented | Mostly implemented | Correct grouping present; still lighter than PRD detail expectations |
| Owner review surface | Separate approval-focused surface with preview and diff | Implemented partially | Partially implemented | Separate surface exists; preview exists; diff access missing |
| Preview seam | Candidate public state under review | Implemented partially | Partially implemented | Current preview is skeletal and does not fully hydrate linked entities/media |
| Publish readiness | Visible blockers/warnings/info | Implemented | Mostly implemented | Readiness panel exists; submit handling still rough |
| Revision history / audit | Human-readable timeline with detail access | Implemented partially | Partially implemented | Human-readable summaries exist; detail/drill-down and diff access are missing |
| Media workflow | Preview-first media flow | Implemented | Mostly implemented | Picker is grid-first and preview-first; workflow is minimal but honest |
| User management | Create / activate / deactivate fixed-role users | Implemented | Mostly implemented | Surface exists; destructive confirm missing |
| Tests / proof | Tests + canonical proof package | Implemented partially | Partially implemented | Strong runtime proof exists; repo automated coverage remains narrow |
| WS-8 hardening | Reviewable autonomous continuation posture | Implemented partially | Partially implemented | Proof scripts exist; commit discipline / durable delivery artifact not complete |

## 7. Canon conformance review

### 7.1 What is conformant

- `Public Web` remains read-side only.
  - public routes consume published projections via `lib/read-side/public-content.js`;
  - no draft/admin state is queried directly by public pages.

- `Admin Console` remains write-side only.
  - admin routes manipulate content through operations and repository layers;
  - public templates do not contain write-side mutations.

- `Content Core` in SQL is the source of truth.
  - canonical entity/revision state is stored in SQL;
  - read-side is derived from `active_published_revision_id`.

- `Publish` is explicit operation.
  - publish is not coupled to save;
  - save creates/updates draft, submit moves to review, publish is separate.

- published read-side reads only validated published revisions.
  - public queries use published revision lookups only.

- `Service` and `Case` retain route truth.
  - slug ownership lives in their entities/revisions;
  - public routes resolve by published service/case slug.

- `Page` does not take over `Service`/`Case` route truth.
  - `Page` route truth is fixed to standalone page types only;
  - page blocks can project linked entities but do not own those routes.

- `MediaAsset` and `Gallery` remain first-class.
  - both have first-class entities, relations, readiness checks and admin surfaces.

- AI did not become source of truth.
  - AI flags/markers exist in schema/timeline posture;
  - no autonomous AI publish path exists.

### 7.2 Canon risks or gaps

- no canon-breaking drift was found in route ownership, publish semantics, media truth or public/read-side separation;
- the main gaps are not canon breaks but incomplete product-surface realization:
  - missing diff access;
  - incomplete preview semantics;
  - rollback not exposed in UI.

## 8. PRD / contracts conformance review

### 8.1 PRD conformance

#### Fully or mostly conformant

- fixed role model is implemented;
- dashboard is action-centered rather than a flat status dump;
- readiness is visible inside editor flow and publish readiness surface;
- explicit revision lifecycle exists;
- review / approval / publish / rollback domain path exists;
- media workflow exists and is preview-first;
- user management first slice exists;
- audit timeline exists and is human-readable;
- first-slice entity coverage is present.

#### Partial or non-conformant

- owner review surface does not yet provide human-readable diff access.
  - PRD explicitly expects owner to see change intent, diff and preview.

- review inbox/detail do not yet show the full PRD-level decision context.
  - current implementation lacks submitter, why-review-needed framing, current live vs candidate contrast, waiting time and urgency.

- preview semantics are only partial.
  - current preview uses public renderers, but service/case/page preview is hydrated with empty linked data stubs in review detail;
  - this is not yet the full candidate public state described by PRD.

- rollback is not exposed as a user-facing admin surface.
  - PRD acceptance wording expects Superadmin to be able to execute rollback from the system surface, not only through hidden API or proof script.

- diff access in revision history is absent.
  - PRD expects diff access from history / owner review context.

### 8.2 Content contract conformance

#### Conformant

- first-slice entities are present;
- stable refs use entity ids;
- `Page` typed blocks exist;
- gallery semantics are implemented;
- route ownership rules are preserved;
- structural readiness requirements for service/case/page/contacts are implemented in readiness layer.

#### Partial

- content contract is implemented at a minimal executable level, but not every contract-rich intent gets a dedicated UI affordance.
  - example: typed blocks are normalized and persisted, but page editing is simplified into flattened editor inputs rather than a more explicit block-authoring UI.

### 8.3 Operations contract conformance

#### Conformant

- lifecycle states `draft -> review -> published` exist;
- change classes exist;
- review submission rules exist;
- owner approval exists;
- publish is separated from approval;
- rollback operation exists;
- slug-change obligations exist;
- readiness severity model exists;
- contacts hard-stop exists;
- event taxonomy is materially implemented.

#### Partial

- reviewable revision edit rule is narrower than contract wording.
  - current behavior effectively creates/maintains draft-driven editing, rather than a richer “allowed without resubmission” in-review edit rule.

- preview semantics are not fully contract-complete.
  - preview basis marker is not shown clearly;
  - linked data/media are not fully rendered in review preview.

- blocked operations are not surfaced cleanly through route handlers.
  - direct blocked submit/publish can still throw server errors instead of always returning guided operator feedback.

## 9. Implementation plan execution review

### 9.1 Workstream status

| Workstream | Planned | Observed execution state | Review |
| --- | --- | --- | --- |
| WS-0 Boundary scaffolding and verification baseline | Planned | Implemented | Closed |
| WS-1 Content core and revision backbone | Planned | Implemented | Closed |
| WS-2 Typed blocks, relations, media metadata, route integrity | Planned | Implemented | Closed |
| WS-3 Operations engine | Planned | Implemented | Closed |
| WS-4 Published read-side and preview seam | Planned | Implemented partially | Partial because preview seam is weaker than plan intent |
| WS-5 Access control and admin shell baseline | Planned | Implemented | Closed |
| WS-6 Validating vertical slice | Planned | Implemented and canonically proven | Closed |
| WS-7 Global Settings and Page surfaces | Planned | Implemented | Closed with minor UX gaps |
| WS-8 Hardening for autonomous continuation | Planned | Partial | No durable commit set, no repo-integrated proof persistence |

### 9.2 Deviations from plan

- proof execution had to be performed on canonical Linux VM through temporary VM-local source tree and local image build.
  - justified by clarified infra reality;
  - canon-safe;
  - no second SQL/runtime acceptance model was introduced.

- a small proof-oriented route change was added to media upload redirect.
  - justified;
  - narrow;
  - improved proof determinism without changing canon.

- preview seam landed weaker than planned.
  - not a justified defer-by-design;
  - this is a real partial implementation gap.

- rollback surface did not land in admin UI even though rollback operation exists.
  - this is a real gap, not just a plan reinterpretation.

## 10. UI conventions conformance review

### Conformant

- owner review is on a dedicated full-page surface, not mixed into editor;
- preview lives inside the owner review surface, not as separate navigation;
- dashboard is action-centered;
- readiness is visible inside editor flow;
- media picker is grid-first and preview-first;
- one admin styling approach is used consistently;
- timeline is narrative-first, not raw technical table.

### Partial or non-conformant

- timeline detail / diff drill-down is missing.
  - conventions expect summary-first plus detail access, typically drawer/side panel.

- destructive actions do not consistently require explicit confirm.
  - user activation toggle has no confirm;
  - rollback surface is absent;
  - owner reject/send-back and other state-changing actions are immediate.

- disabled reasons are not handled consistently.
  - publish page disables publish when blocking;
  - submit flow does not consistently disable or guide the operator before server error.

- forbidden pattern risk: blocked operations can still surface as raw server failure rather than operator-facing explanation.

## 11. Tests / verification / proof review

### What is strong

- pure-domain tests exist and are useful.
  - route truth normalization;
  - page block shaping;
  - change class logic;
  - owner review logic;
  - auth password hashing.

- build passes locally.

- canonical runtime proof is strong and materially valuable.
  - it was executed against accepted Linux VM runtime;
  - it covered migration, seed, live auth/session, full vertical slice, rollback and contacts hard-stop.

### What is weak

- repo automated test coverage is still narrow.
  - tests are mostly pure-function tests;
  - no committed DB-backed integration test suite;
  - no committed browser/E2E suite.

- proof artifacts are operationally strong but not durably productized.
  - proof scripts exist;
  - but acceptance evidence currently lives mostly in execution logs rather than a committed CI proof artifact trail.

- admin route failure handling is not well covered.
  - blocked publish/submission behavior is not asserted by automated tests.

## 12. Deviations, drift, and unresolved issues

### Clear unresolved issues

1. Owner review diff is missing.
   - direct PRD acceptance mismatch.

2. Preview is not yet a fully faithful candidate public state.
   - linked entities/media are stubbed in review preview;
   - preview basis marker is missing.

3. Rollback has no visible admin UI surface.
   - operation exists and proof passed;
   - operator surface remains absent.

4. Blocked actions can still return `500`.
   - contacts hard-stop proof showed blocked publish as `500` on direct POST;
   - broken review submission also throws server error when triggered directly.

5. Submit/destructive action UX is under-hardened.
   - no consistent explicit confirm for destructive actions;
   - submit is not disabled by readiness the way publish is.

6. Acceptance is being performed against a dirty worktree, not a reviewable implementation commit set.
   - this is not a product-canon defect;
   - it is a delivery and reproducibility risk.

### Drift assessment

- no major canon drift found;
- no broad scope creep into page builder / DAM / analytics suite found;
- there is some surface-level underdelivery relative to PRD:
  - diff;
  - preview fidelity;
  - rollback UI;
  - operator-friendly error handling.

## 13. Deferred items: by design vs by miss

### Deferred by design

- page builder behavior;
- enterprise IAM;
- broad DAM;
- analytics suite;
- theme switching for admin;
- future-slice review heuristics and broader workflow sophistication.

### Deferred by miss or underdelivery

- human-readable diff access in owner review/history;
- fully faithful preview semantics;
- rollback UI surface;
- confirm handling for destructive actions;
- operator-safe blocked-action handling instead of `500`;
- stronger automated DB-backed integration coverage.

## 14. Acceptance verdict

`ACCEPT WITH CONDITIONS`

### Why not `ACCEPT`

Because several explicit first-slice acceptance expectations are only partially satisfied:

- owner review lacks diff access;
- preview semantics are approximate rather than fully candidate-public-state;
- rollback is not exposed as an operator surface;
- blocked actions are not consistently operator-safe.

### Why not `NOT ACCEPTED`

Because the slice is materially real, canon-safe and proven:

- core entity model exists;
- operations model exists;
- public read-side discipline is correct;
- canonical runtime proof passed;
- first validating vertical slice passed;
- contacts hard-stop passed.

This is not a fake demo shell and not a hollow UI-first build. The remaining issues are real, but they are narrow enough to treat as conditions to close before full acceptance rather than as grounds to reject the slice entirely.

## 15. Required follow-up actions before full acceptance

The following conditions should be closed before upgrading verdict from `ACCEPT WITH CONDITIONS` to full `ACCEPT`:

1. Add human-readable diff access to owner review and revision history.
   - owner must be able to review change meaning, not only change intent and preview.

2. Upgrade preview to true candidate-public-state behavior.
   - hydrate linked entities/media/galleries;
   - show explicit preview basis;
   - ensure owner approves what the system will actually publish.

3. Expose rollback as a real superadmin surface.
   - visible path from history or publish/history context;
   - include explicit confirm.

4. Replace raw blocked-action failures with operator-facing handling.
   - blocked submit/publish should redirect back with readable reason, not `500`.

5. Add minimal proof hardening in repo.
   - at least one committed DB-backed or route-level integration proof path;
   - preferably make canonical proof reproducible from a reviewable commit set, not only from dirty worktree state.
