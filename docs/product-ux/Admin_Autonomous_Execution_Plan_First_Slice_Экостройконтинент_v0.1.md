# Admin Autonomous Execution Plan First Slice

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: updated autonomous execution order after local/operator vs canonical-runtime clarification

## 1. Purpose

Этот документ не переписывает PRD, contracts или implementation plan.  
Его задача: обновить автономный execution posture для admin first slice после уточнения среды исполнения:

- Windows IDE / operator machine не является canonical runtime;
- canonical runtime и canonical SQL живут на Linux VM;
- локальные ограничения не дают права вводить вторую SQL truth или вторую infra-модель.

Этот документ нужен как узкий operating note для продолжения автономной реализации без environment drift.

## 2. Canon carried into execution

- `Public Web` остается published read-side only.
- `Admin Console` остается write-side tool only.
- `Content Core` в SQL остается единственным source of truth.
- `Publish` остается explicit domain operation.
- `Service` и `Case` продолжают владеть route truth.
- `Page` не становится route owner для `Service` / `Case`.
- `MediaAsset` и `Gallery` остаются first-class supporting entities.
- Contracts и implementation plan выше локального tooling convenience.
- Canonical phase-1 runtime остается: one Linux VM, one compose stack, `app + sql`.
- Windows operator machine не трактуется как второй canonical runtime и не должна получать вторую domain SQL truth.

## 3. Current execution state

### 3.1 Already implemented in code

- established bounded module layout under `lib/content-core/*`, `lib/content-ops/*`, `lib/read-side/*`, `lib/db/*`, `lib/auth/*`, `lib/media/*`, `lib/admin/*`;
- added SQL migration baseline and migration / seed scripts;
- added content entities, revisions, publish pointers and publish obligations;
- added readiness, review, owner approval, publish, rollback and audit flows;
- added public read-side routes for `/services`, `/cases`, `/about`, `/contacts`;
- added admin shell, editor surfaces, review surface, publish readiness surface, users surface;
- added transport-layer auth redirect helper for admin POST routes;
- added pure-domain tests for password and content-shaping invariants.

### 3.2 Locally verified on the operator machine

- `npm run build`: pass
- `npm test`: pass

### 3.3 Not yet proved against canonical SQL runtime

- `db:migrate`
- `db:seed`
- end-to-end vertical slice with real persisted data
- role/session proof against live DB
- publish / rollback / audit proof against canonical SQL-backed state

## 4. What changed in execution posture

Previous implicit risk:

- treating the IDE machine as if it were a valid place to recreate canonical `sql` runtime locally.

Updated rule:

- implementation may continue locally for code-safe work;
- DB-backed proof must target canonical server-side SQL path, or be explicitly marked as infra-dependent if access is unavailable;
- no local workaround may redefine runtime canon or introduce a second accepted SQL environment.

## 5. Autonomous execution order from the current state

## 5.1 Completed bands

### Band A. Foundation and seams

Status: completed

- bounded modules established;
- config / DB seam introduced;
- content-core and revision backbone introduced.

### Band B. Domain operations spine

Status: completed

- readiness
- review
- owner approval
- publish
- rollback
- audit
- obligations

### Band C. Surface delivery

Status: completed

- admin shell
- editor screens
- review surface
- publish readiness surface
- public read-side pages
- transport cleanup

## 5.2 Active band

### Band D. Canonical proof band

Status: active

Goal:

- move from code-complete-first-slice to SQL-backed, workflow-proved first slice.

Remaining execution tasks:

1. Run migration on canonical SQL target.
2. Run seed on canonical SQL target.
3. Verify fixed-role login path against live sessions.
4. Execute validating vertical slice:
   `MediaAsset -> Gallery -> Case -> Service -> submit -> owner approve -> publish -> public projection -> rollback`
5. Capture audit and obligation evidence from live persisted state.
6. Confirm contacts hard-stop still blocks publish until contact truth is confirmed.

## 5.3 Finalization band

### Band E. Proof package and go/no-go

Status: pending

Goal:

- produce final contract-conformance and anti-drift verdict for the implemented slice.

## 6. Recommended autonomous batching from here

### Batch D1. Canonical SQL bootstrap

Scope:

- run `db:migrate`
- run `db:seed`
- verify seed users and singleton baseline entities

Acceptance gate:

- schema exists on canonical SQL target;
- seed users exist;
- no migration drift;
- no ad hoc manual DB surgery required.

Proof:

- exact commands run
- migration result
- seed result

Stop trigger:

- no access to canonical SQL target;
- runtime access would require inventing a second accepted SQL environment.

### Batch D2. Live auth and role proof

Scope:

- login with seeded users
- verify route access and action access for:
  - `superadmin`
  - `seo_manager`
  - `business_owner`

Acceptance gate:

- `SEO Manager` can edit/submit but not publish;
- `Business Owner` can approve/reject/send back but is not turned into a general editor;
- `Superadmin` can publish, rollback and manage users.

Proof:

- route/access matrix
- screenshots only where they add value

### Batch D3. Validating vertical slice

Scope:

- create or upload one published media asset
- assemble one gallery
- create one case
- create one service linked to proof path
- submit for review
- approve in owner review
- publish
- verify public route output
- rollback to previous published state if available

Acceptance gate:

- public routes show only published state;
- review and approval remain distinct operations;
- route truth remains on `Service` / `Case`;
- rollback is deterministic;
- audit timeline is human-readable.

Proof:

- command log where relevant
- screenshots of review / publish / public projection
- audit event samples
- obligation samples if slug changes are exercised

### Batch D4. Contacts hard-stop and page/global-settings proof

Scope:

- verify `Global Settings` path
- verify `Page(type=about)` path
- verify `Page(type=contacts)` publish block when contact truth is unconfirmed

Acceptance gate:

- contacts page remains blocked until canonical contact truth is confirmed;
- `Page` does not take over service/case route ownership;
- global truth remains in SQL content core.

Proof:

- readiness evidence
- blocked publish evidence
- public read-side evidence after allowed publish paths only

## 7. What may continue autonomously without owner input

- code cleanup that does not alter canon;
- server-aligned migration and seed execution;
- test expansion for already accepted rules;
- proof capture for already accepted workflows;
- narrowing transport or UI implementation details when the contracts already determine behavior.

## 8. What remains stop-and-escalate

- any move that would redefine runtime canon;
- any move that would store truth outside canonical SQL content core;
- any move that would bypass explicit publish;
- any move that would weaken owner approval requirements;
- any missing server/runtime access that prevents canonical SQL proof and cannot be solved without inventing a second accepted environment;
- any owner-dependent truth required for real `/contacts` publish readiness.

## 9. Operator machine rule

The Windows IDE machine is allowed to be:

- code workspace
- build workspace
- pure-test workspace
- operator console

It is not allowed to become:

- a second canonical SQL truth
- a second accepted runtime model for the slice
- a local-only replacement for the Linux VM runtime described by infra canon

## 10. Final execution recommendation

Autonomous implementation should continue from the current codebase without replanning the slice.

Correct next posture:

- keep local work focused on code-safe completion and test-safe hardening;
- perform DB-backed proof only against canonical server-side SQL/runtime;
- if that access is unavailable in the current session, report the remaining work as a narrow infra-dependent proof gap, not as an excuse to re-open architecture or environment assumptions.

Current verdict:

- code implementation: materially advanced and first-slice-shaped
- local proof: partially complete
- canonical SQL proof: still required
- autonomous continuation: yes, but now specifically server-aligned
