# Admin Agent Ops Autonomous Execution Plan

Статус: execution plan / autonomous hardening pass  
Дата: 2026-03-25  
Место в репозитории: `docs/reports/2026-03-25/`

## 1. Executive framing

Сейчас мы делаем не новый PRD, не новый audit и не новый platform layer. Мы делаем узкий autonomous execution pass по уже найденным P0/P1 hardening issues для `admin console + internal agent ops`.

Почему именно это:

- текущий runtime media upload path всё ещё является risky boundary, потому что upload в live route пересекается с publish behavior;
- agent ops нельзя поднимать раньше безопасной media boundary;
- owner wording и allowlist handling уже выявлены как точечные drift/gap points, и их нужно дожать без расширения architecture;
- проект на этой стадии всё ещё упирается в owner confirmations, evidence gaps, media gaps и production readiness, а не в новый крупный roadmap.

Success state для этого прохода:

- upload route больше не crosses into publish behavior;
- sequencing фиксирует migration of the upload route как hard precondition before agent ops;
- `Business Owner` language остаётся review-first и exception-only, без editor drift;
- allowlist handling становится exact, with unknown-ID rejection and no generic maintenance shell;
- если allowlist appendix consumed by code, it is locked as a versioned registry shape;
- proof package is enough to show no hidden-publish path remains and agent ops stay blocked behind the safe media boundary.

## 2. Scope of autonomous execution

### In scope

- P0 removal of hidden publish / direct publish path from `app/api/admin/media/upload/route.js`;
- P0 sequencing hard gate so upload-route migration is a precondition before agent ops;
- P1 wording hardening for owner role posture;
- P1 allowlist validation hardening and registry shape hardening;
- verification, grep/assert checks, targeted code inspection, proof packaging;
- minimal doc sync where it is needed to keep contract and runtime aligned.

### Not in scope

- new PRD work;
- new admin product surfaces;
- new agent platform design;
- raw SQL shell;
- raw object-storage shell;
- future surfaces such as public AI chat, calculator, SEO dashboard, CRM-lite, broad analytics, EN rollout, multi-region launch.

### Intentionally blocked

- any agent ops execution before the media boundary is safe;
- any change that widens permissions beyond current canon;
- any attempt to normalize approval as publish;
- any attempt to turn Business Owner into a default editor;
- any generic maintenance shell or temporary debug backdoor.

## 3. Canon constraints that must not be reopened

- `Admin Console` is write-side only.
- `Public Web` is published read-side only.
- `Content Core` in SQL is the source of truth.
- `MediaAsset` is a first-class entity.
- publish is an explicit domain operation, not a status flip.
- AI is assistive only.
- no autonomous publish by agent.
- no raw unrestricted SQL shell.
- no raw unrestricted object-storage shell.
- owner review remains explicit on claims-heavy and launch-critical materials.
- current runtime reality is not the target contract.
- approval does not equal publish.

## 4. Workstreams

### WS1: Runtime media upload hardening

Objective:

- remove hidden publish / direct publish behavior from `app/api/admin/media/upload/route.js`;
- keep upload as upload/finalize behavior, not live truth mutation;
- make the media boundary safe before any agent ops work proceeds.

Owned artifacts:

- `app/api/admin/media/upload/route.js`
- `lib/media/storage.js`
- if needed, small focused doc sync in `docs/product-ux/Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md`

Code/doc touchpoints:

- upload route imports and call sites;
- storage adapter behavior;
- current-vs-target appendix only if it needs wording alignment after the route change.

Dependencies:

- canon baseline from phase 1;
- audit report findings;
- existing workflow/publish contract.

What the agent may decide autonomously:

- exact refactor shape inside the route;
- helper extraction if needed to remove publish coupling;
- temporary dev-safe containment inside current runtime boundaries;
- exact internal validation order as long as publish coupling is removed.

What requires owner review:

- any change that widens media permissions;
- any storage backend migration beyond the target contract;
- any publish gate semantics change;
- any attempt to preserve auto-publish behavior under a new name.

Stop triggers:

- route still calls publish or equivalent live-state mutation;
- route still makes upload imply publish;
- media hardening requires permission widening;
- route cannot be separated cleanly from publish behavior.

Success criteria:

- upload route no longer crosses into publish behavior;
- upload flow has no hidden publish side effect;
- target contract remains upload/finalize/attach boundary only;
- runtime evidence proves no publish path is reachable from upload.

Proof package:

- changed files list;
- short delta note for route and storage;
- grep proof that publish helper is gone from the upload path;
- verification note showing upload no longer mutates published truth;
- risk note if any temporary containment remains.

### WS2: Implementation plan sequencing hard gate

Objective:

- lock the sequencing so migration of the upload route is a hard precondition before agent ops;
- prevent agent layer from moving earlier than the safe media boundary.

Owned artifacts:

- `docs/product-ux/Admin_Agent_Ops_Implementation_Plan_Экостройконтинент_v0.1.md`
- if needed for consistency, `docs/reports/2026-03-25/Admin_Agent_Ops_Implementation_Pack_Audit_Report_Экостройконтинент_v0.1.md`

Code/doc touchpoints:

- phase ordering;
- explicit hard gate language for media migration;
- agent ops entry condition.

Dependencies:

- WS1 must define the runtime media boundary;
- audit report already identifies the blocker.

What the agent may decide autonomously:

- exact wording of the hard gate;
- exact ordering between documentation subtasks and verification subtasks;
- how to phrase preconditions without broadening scope.

What requires owner review:

- any sequencing that lets agent ops start before media safety is proven;
- any reordering that makes the plan look like documentation-first instead of runtime-first.

Stop triggers:

- plan allows agent ops before safe media boundary;
- plan still treats upload migration as optional or advisory;
- plan broadens into new roadmap slices.

Success criteria:

- implementation plan says upload migration is a hard precondition before agent ops;
- agent ops remains deferred until media boundary proof exists;
- sequencing matches the current blockers, not a broader product fantasy.

Proof package:

- updated plan excerpt;
- short note describing the new hard gate;
- cross-reference to WS1 proof.

### WS3: Owner wording hardening

Objective:

- remove any wording that implies owner-as-editor;
- keep `Business Owner` posture as explicit exception-surface and truth-confirmation authority only.

Owned artifacts:

- `docs/product-ux/PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md`
- `docs/product-ux/RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md`

Code/doc touchpoints:

- owner role descriptions;
- action matrix labels;
- exception-surface wording;
- review-first posture wording.

Dependencies:

- canon owner-review posture;
- audit report finding that owner drift is controlled but wording must stay sharp.

What the agent may decide autonomously:

- precise replacement wording;
- label-level cleanup where the current phrasing is editor-adjacent;
- removing ambiguous nouns like `edit` when the meaning is actually `truth confirmation`.

What requires owner review:

- any new owner editing capability;
- any change that makes owner a fallback CMS operator;
- any exposure of a broader truth-edit surface.

Stop triggers:

- any wording still implies general editor power;
- Business Owner starts to look like a hidden CMS editor;
- owner wording expands scope beyond explicit exception surface.

Success criteria:

- owner language is review-first and exception-only;
- no default owner editing posture remains;
- grep review shows no editor-drift phrasing in owner surface descriptions.

Proof package:

- changed wording diff;
- grep result for owner/edit language;
- short note explaining what was removed and why.

### WS4: Allowlist / registry hardening

Objective:

- make allowlist handling exact;
- reject unknown allowlist IDs;
- remove any generic maintenance shell behavior;
- if code consumes the allowlist appendix directly, lock it as a versioned registry shape.

Owned artifacts:

- `docs/product-ux/Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md`
- `docs/product-ux/DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- any code path that reads the allowlist registry directly

Code/doc touchpoints:

- `allowlist_id` validation;
- unknown-ID rejection;
- named maintenance dispatch;
- registry shape if appendix is consumed by code.

Dependencies:

- WS1 and WS2 do not need to finish first, but this work must not relax publish or storage boundaries;
- existing allowlist appendix and named maintenance appendix.

What the agent may decide autonomously:

- exact enum or locked-registry representation for `allowlist_id`;
- exact rejection path for unknown IDs;
- exact internal shape of versioned registry, if code needs one.

What requires owner review:

- any allowlist expansion;
- any generic fallback that could behave like a shell;
- any hardening choice that silently widens access instead of narrowing it.

Stop triggers:

- unknown allowlist IDs are accepted or silently mapped;
- named maintenance becomes a generic maintenance shell;
- code requires broader permissions than current canon allows.

Success criteria:

- allowlist IDs are exact and validated;
- unknown IDs are rejected;
- no generic maintenance shell remains;
- if code consumes the appendix, it is versioned/locked and auditable.

Proof package:

- validation diff;
- allowlist registry shape note, if applicable;
- targeted grep proof showing no generic fallback path;
- short summary of allowed vs rejected behavior.

### WS5: Proof, verification and final readiness check

Objective:

- collect proof that the hardening pass is complete;
- verify that no hidden publish path, owner drift or allowlist backdoor remains;
- decide whether anything is still blocked.

Owned artifacts:

- final changed files list;
- concise delta summary;
- verification notes;
- unresolved questions list, if any;
- final proof package.

Code/doc touchpoints:

- all modified docs;
- `app/api/admin/media/upload/route.js`;
- `lib/media/storage.js`.

Dependencies:

- WS1 must be proven;
- WS2 hard gate must be written;
- WS3 and WS4 must be settled;
- no stop trigger may remain open.

What the agent may decide autonomously:

- which focused checks are sufficient;
- how to package proof for human review;
- whether a remaining question is informational or blocking.

What requires owner review:

- any remaining blocker;
- any proposed scope expansion;
- any unresolved permission or publish question.

Stop triggers:

- hidden publish path still exists;
- current runtime and target contract are still blurred;
- owner wording still implies editor-level power;
- allowlist hardening still has a generic fallback;
- proof package cannot demonstrate safe media boundary and agent blocking.

Success criteria:

- proof package clearly demonstrates removal of hidden publish behavior;
- proof package clearly demonstrates allowlist hardening;
- proof package clearly demonstrates agent ops remains blocked behind safe media boundary;
- no unresolved blocking questions remain.

Proof package:

- changed files list;
- concise delta summary;
- risk notes;
- proof of hidden-publish removal;
- proof of allowlist hardening;
- proof that agent ops remains blocked behind safe media boundary;
- unresolved questions, if any.

## 5. Canonical execution chain

### Step 1. Re-lock scope and baseline

Preconditions:

- audit report is available;
- runtime evidence files are identified;
- no scope expansion request has been introduced.

Action:

- confirm the exact P0/P1 items and the exact files they touch;
- re-check current runtime vs target contract boundaries;
- freeze the execution scope to this hardening pass only.

Expected result:

- the agent has a clean map of what is in scope and what is blocked.

Verification:

- targeted grep of audit report, implementation plan, and runtime files;
- no new future-surface tasks appear.

Artifacts:

- short baseline note;
- scope lock note.

Stop trigger:

- any discovery that requires a broader architecture rewrite or new epic.

### Step 2. Remove hidden publish from the media upload route

Preconditions:

- scope is frozen;
- runtime media route is confirmed as the P0 risk zone.

Action:

- refactor `app/api/admin/media/upload/route.js` so upload no longer crosses into publish behavior;
- keep media upload as upload/finalize behavior only;
- preserve current canon and avoid introducing new publish semantics.

Expected result:

- upload no longer mutates public truth;
- publish remains an explicit separate operation.

Verification:

- grep/assert check for `publishRevision` or equivalent live-state mutation in the route;
- focused code inspection of the upload path;
- targeted route test if the repo already has a practical harness for it.

Artifacts:

- route diff;
- verification note;
- proof note that upload no longer implies publish.

Stop trigger:

- any remaining publish coupling in the upload route;
- any attempt to preserve hidden publish behind a renamed helper.

### Step 3. Make upload-route migration a hard gate before agent ops

Preconditions:

- Step 2 has a clear result or a documented blocker;
- the media boundary is understood.

Action:

- update the implementation plan so upload-route migration is a hard precondition before agent ops;
- ensure agent ops is explicitly sequenced after safe media boundary proof.

Expected result:

- sequencing now blocks agent ops until the media boundary is safe.

Verification:

- plan text review;
- grep for hard-gate wording;
- no language that suggests agent ops can move ahead of media safety.

Artifacts:

- updated implementation plan excerpt;
- hard-gate note.

Stop trigger:

- sequencing still allows agent ops to begin before media boundary proof.

### Step 4. Harden owner wording to explicit exception surface

Preconditions:

- owner-review canon is loaded;
- current wording is available in PRD and RBAC docs.

Action:

- replace editor-adjacent owner wording with exception-surface / truth-confirmation language;
- remove phrases that imply owner-as-editor by default.

Expected result:

- Business Owner remains review-first, not general content operator.

Verification:

- grep review for `owner`, `edit`, `truth confirmation`, `exception surface`;
- manual reading of changed sections to ensure the drift is gone.

Artifacts:

- wording diff;
- grep evidence.

Stop trigger:

- any phrase still makes owner look like a fallback editor.

### Step 5. Harden allowlist validation and registry shape

Preconditions:

- allowlist appendix and agent contract are loaded;
- named maintenance list is available.

Action:

- enforce exact `allowlist_id` validation;
- reject unknown IDs;
- remove any generic maintenance shell fallback;
- if code consumes the appendix, lock it as a versioned registry shape.

Expected result:

- allowlist handling is exact, auditable and bounded.

Verification:

- grep for allowlist validation;
- focused inspection of dispatch logic;
- targeted check that unknown IDs fail closed.

Artifacts:

- allowlist hardening diff;
- registry shape note if applicable.

Stop trigger:

- any fallback behavior that behaves like a shell;
- any permission widening to make exact validation easier.

### Step 6. Run verification and compile proof package

Preconditions:

- Steps 2 through 5 are complete or blocked for a recorded reason.

Action:

- collect changed files;
- collect concise deltas;
- collect proof of hidden-publish removal;
- collect proof of allowlist hardening;
- collect proof that agent ops remains blocked behind the safe media boundary.

Expected result:

- there is a clean proof bundle for human review.

Verification:

- route/runtime check;
- permission/allowlist check;
- canon-drift check;
- regression-risk check.

Artifacts:

- final proof package;
- unresolved questions list, if any.

Stop trigger:

- proof package cannot demonstrate the core safety claims.

## 6. Approval budget and autonomy boundary

Agent may decide autonomously:

- exact route refactor shape as long as publish coupling is removed;
- exact wording replacements for owner exception-surface language;
- exact exact-match allowlist validation mechanics;
- exact locked-registry shape if the code consumes the appendix directly;
- which focused verification checks are enough for proof.

Agent must only propose, not decide:

- any new owner editing capability;
- any new publish gate semantics;
- any new maintenance action outside the named allowlist;
- any expansion of storage or DB permissions;
- any movement of agent ops earlier than the safe media boundary.

Owner review is required:

- if any change widens role power;
- if any change expands allowlists;
- if any change alters publish semantics;
- if any change touches a risky boundary and the safety proof is not yet complete.

Explicit stop instead of improvisation:

- agent cannot invent new runtime behavior;
- agent cannot silently widen permissions;
- agent cannot normalize raw DB or raw storage access;
- agent cannot let upload imply publish;
- agent cannot move agent ops earlier than the safe media boundary;
- agent cannot convert a narrow hardening pass into a broad architecture initiative.

## 7. Verification strategy

| Change class | How to verify | Accept criteria |
| --- | --- | --- |
| Doc changes | grep forbidden phrases, compare against canon constraints, read the changed sections for role and publish semantics | no wording drift, no hidden publish language, no owner-as-editor language |
| Route/runtime change | focused code inspection, targeted route test if available, grep for publish helper imports/calls | upload path no longer reaches publish behavior |
| Permission/allowlist change | exact-ID validation check, targeted failure case for unknown IDs, inspect dispatch for generic fallback | unknown IDs fail closed, no generic shell exists |
| Regression-risk check | search for other media paths that import publish helpers, inspect any shared helper reuse | hidden publish coupling does not reappear elsewhere |
| Canon-drift check | compare modifications against phase 1 canon and audit stop triggers | no widened roles, no new surfaces, no approval/publish coupling |

Recommended checks:

- `rg` for forbidden terms and helper calls;
- focused code inspection around the modified route and allowlist dispatch;
- targeted tests only where the repo already has a light harness;
- no full QA program, no broad refactor chase.

## 8. Proof package

The agent should return the following at completion:

- changed files list;
- concise delta summary;
- risk notes;
- proof of hidden-publish removal;
- proof of allowlist hardening;
- proof that agent ops remains blocked behind the safe media boundary;
- verification notes;
- unresolved questions, if any.

The proof package is complete only if it shows:

- upload no longer implies publish;
- current runtime and target contract are clearly separated;
- owner wording no longer implies editor-level power;
- allowlists are exact and fail closed;
- agent ops does not move before media safety is proven.

## 9. Stop triggers

- upload route still crosses into publish behavior;
- current runtime and target contract cannot be cleanly separated;
- owner wording still implies editor-level power;
- allowlist cannot be made exact without hidden generic fallback;
- implementation requires widening permissions beyond current canon;
- agent ops would start before the safe media boundary;
- a supposedly narrow fix turns into broader architecture drift;
- any step produces a hidden publish path, a raw shell, or a new future surface.

## 10. Minimal sequencing recommendation

1. First, remove publish coupling from the media upload route.
2. Second, prove the upload route is now upload/finalize only.
3. Third, lock the sequencing so agent ops stays behind the safe media boundary.
4. Fourth, clean owner wording so it stays exception-surface only.
5. Fifth, harden allowlist validation and registry shape.
6. Sixth, compile the proof package and stop if any safety claim cannot be proven.

## Recommended execution mode

**semi-autonomous with one mid-point review gate**

Why this is the right mode:

- the P0 media route change is a live runtime-risk boundary, so it should not be treated as a purely cosmetic doc pass;
- the remaining P1 changes are narrow and deterministic, but they still touch role wording and allowlist semantics, which should not be allowed to drift silently;
- one mid-point review after WS1 gives us proof that hidden publish is gone before the agent proceeds with the lower-risk P1 cleanup;
- this keeps the work autonomous enough to move quickly, while still preventing a bad runtime assumption from being normalized.

