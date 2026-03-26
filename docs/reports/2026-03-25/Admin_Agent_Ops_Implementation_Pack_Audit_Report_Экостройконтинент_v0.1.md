# Admin Agent Ops Implementation Pack Audit Report

Статус: audit / implementation-readiness report  
Дата: 2026-03-25  
Место в репозитории: `docs/reports/2026-03-25/`

## 1. Executive verdict

**NOT READY: NEEDS TARGETED HARDENING**

The 9-doc implementation pack is directionally correct and canon-aligned, but it is not yet safe to hand off as implementation-ready without one blocking runtime migration:

- the current admin media upload route still auto-publishes after upload;
- the current media storage adapter is still local filesystem-backed instead of the target S3-compatible boundary;
- the documents now separate current runtime from target contract, but runtime code still violates the target publish safety posture.

This means the pack is good as a contract package, but the current runtime gap must be closed before the pack can be treated as safe implementation ground truth.

## 2. Canon alignment summary

What the pack gets right:

- `Admin Console` stays write-side only.
- `Public Web` stays published read-side only.
- `Content Core` in SQL remains the source of truth for entities, relations, statuses and published revisions.
- `Publish` stays an explicit domain operation, not a status flip.
- `MediaAsset` stays a first-class entity.
- binary truth and metadata truth remain separated.
- AI stays assistive only.
- `Business Owner` stays review-first, not unrestricted editor.
- future surfaces stay out of scope.

What the pack does not break:

- phase 1 narrow launch posture;
- owner review discipline;
- claims-heavy and launch-critical review gating;
- contract-first modular monolith posture;
- audit and forensic traceability;
- safe wrapper posture instead of raw DB or S3 access.

Where the pack is strong:

- it now has a dedicated current-vs-target appendix;
- it has explicit allowlist and named maintenance appendices;
- it states approval does not equal publish;
- it makes delegation bounded with expiry and revocation;
- it separates diagnostics into practical classes.

## 3. Audit by 5 seams

### 3.1 Current state vs target state

Status: **partially aligned in docs, blocking gap in runtime**

Findings:

- The new PRD and appendix explicitly distinguish target canon from current runtime reality.
- The appendix correctly records that the current media upload route is not the target safety posture.
- The appendix also correctly records that storage is still local filesystem-backed in current runtime.
- The runtime route still imports both `submitRevisionForReview` and `publishRevision`, which means upload currently crosses into publish behavior.

Why this matters:

- If implementation starts from the live route without a migration guardrail, the team can confuse transitional runtime behavior with accepted canon.
- That is especially dangerous for media, because media upload is the most likely place for accidental publish coupling to survive.

Minimal fix:

- Keep the current runtime appendix as a migration delta note, not as canonical behavior.
- Replace or gate the current upload route before implementation work starts relying on it.
- Treat the live route as unsafe transitional code, not as the intended media contract.

Severity: **blocking**

Relevant evidence:

- [Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md](../../product-ux/Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md)
- [app/api/admin/media/upload/route.js](../../../app/api/admin/media/upload/route.js)
- [lib/media/storage.js](../../../lib/media/storage.js)

### 3.2 Owner role drift

Status: **controlled, no material drift detected**

Findings:

- `Business Owner` is consistently described as review-first authority.
- The pack does not give owner general content operator power by default.
- The main drift risk is wording around `bounded owner-truth fragments` or `edit bounded owner-truth fragments`, which can be misread as a normal editor capability if read without the surrounding exception language.

Why this matters:

- Owner role drift is one of the fastest ways to break truth discipline.
- If owner becomes a fallback CMS editor, review boundaries blur and sensitive claims can be edited outside the intended governance path.

Minimal fix:

- Keep owner editing only as explicit exception surface.
- Reword any action label that sounds like general editing into `dedicated owner-truth form submission` or `truth-confirmation exception surface`.

Severity: **low**

Relevant evidence:

- [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](../../product-ux/PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md)
- [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](../../product-ux/RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md)

### 3.3 Approval vs publish separation

Status: **fully separated in docs, but runtime still unsafe**

Findings:

- The workflow spec now explicitly states that approval does not publish.
- It also forbids wording such as `approved content becomes live`, `owner approve triggers publish`, `review save updates public state`, and `approval is equivalent to publish`.
- The spec preserves slug-change obligations, preview semantics and rollback semantics.
- The first-slice admin operations contract already has the same separation.
- The runtime media upload path still auto-publishes, so the doc boundary is correct while one route still violates it.

Why this matters:

- Approval and publish are different domain actions.
- If they are coupled, human review becomes performative rather than a real truth gate.
- If upload or review completion can mutate public truth, the whole approval model becomes unsafe.

Minimal fix:

- Keep the existing workflow wording.
- Make sure no route, webhook or helper treats approval as live-state mutation.
- Ensure publish can only happen through explicit publish action after all gates are satisfied.

Severity: **blocking**

Relevant evidence:

- [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](../../product-ux/Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md)
- [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](../../product-ux/Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)
- [app/api/admin/media/upload/route.js](../../../app/api/admin/media/upload/route.js)

### 3.4 DB/S3/storage wrapper safety and allowlists

Status: **ready with minor tightening**

Findings:

- The agent contract now explicitly forbids raw unrestricted SQL and raw unrestricted object-storage access.
- The DB/storage appendix now has explicit allowlists for read operations and named maintenance.
- The storage appendix distinguishes archive, quarantine, restore and hard delete.
- The named maintenance appendix makes maintenance concrete enough for MVP.
- The current risk is not absence of a contract; it is the possibility of implementation drift if unknown allowlist IDs or generic maintenance shells are accepted later.

Why this matters:

- A vague wrapper usually becomes a backdoor with a nicer name.
- If allowlists are not exact, temporary debug tooling becomes permanent unsafe access.
- If destructive operations are not explicitly typed, the system will drift toward convenience over safety.

Minimal fix:

- Validate `allowlist_id` as an exact enum or locked registry value.
- Reject unknown named maintenance actions.
- Keep `dry_run` and audit mandatory for risky operations.
- Preserve archive and quarantine as default safety posture.

Severity: **medium**

Relevant evidence:

- [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](../../product-ux/Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md)
- [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](../../product-ux/DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md)
- [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](../../product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)

### 3.5 MVP sequencing against real blockers

Status: **aligned, with one hard gate**

Findings:

- The implementation plan now starts with owner confirmations and evidence gaps.
- Media and storage safety comes before agent ops.
- The agent layer is deferred until after bounded wrappers, diagnostics and audit are in place.
- The plan now explicitly says the current upload route must be replaced or gated so it no longer auto-publishes.

Why this matters:

- The project’s real blockers are still owner confirmations, evidence gaps, media gaps and production readiness.
- If agent ops arrives too early, it will magnify the wrong behavior instead of helping the team operate safely.

Minimal fix:

- Keep agent ops as a late slice.
- Make media upload migration a hard precondition for any delegated operator flow.
- Allow only contract work, read-only diagnostics scaffolding and audit plumbing before confirmations close.

Severity: **medium**

Relevant evidence:

- [Admin_Agent_Ops_Implementation_Plan_Экостройконтинент_v0.1.md](../../product-ux/Admin_Agent_Ops_Implementation_Plan_Экостройконтинент_v0.1.md)
- [Admin_Agent_Ops_Open_Questions_Экостройконтинент_v0.1.md](../../product-ux/Admin_Agent_Ops_Open_Questions_Экостройконтинент_v0.1.md)

## 4. Exact patch list

| Document | Section | Change | Why | Priority |
| --- | --- | --- | --- | --- |
| `app/api/admin/media/upload/route.js` | upload handler | remove direct publish path or gate it behind explicit publish contract | current runtime auto-publishes | P0 |
| `Admin_Agent_Ops_Implementation_Plan_Экостройконтинент_v0.1.md` | Phase 3 media and storage safety | make upload-route migration a hard precondition before agent ops | avoids inheriting unsafe route behavior | P0 |
| `RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md` | owner action wording | rename any `edit bounded owner-truth fragments` wording to explicit exception-surface language | prevents owner-as-editor drift | P1 |
| `Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md` | allowlist handling | require exact `allowlist_id` validation and unknown-ID rejection | prevents generic backdoor behavior | P1 |
| `DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md` | registry shape | lock the allowlist as a versioned registry if code consumes it directly | reduces drift between docs and runtime | P1 |

## 5. Missing artifacts / appendices

No new mandatory artifact is missing.

Already present and sufficient for safe handoff:

- current-vs-target delta appendix;
- DB/storage allowlist appendix;
- named maintenance task appendix;
- delegation envelope in the agent contract;
- approval vs publish separation in workflow spec.

Optional only if the team wants a single operational page:

- one short migration checklist that maps the P0 runtime fix to the plan.

## 6. Proposed tightened sequencing

1. Close owner confirmations and evidence gaps.
2. Freeze workflow, RBAC and allowlist contracts.
3. Migrate media upload away from auto-publish.
4. Stabilize audit and forensic logging.
5. Add read-only diagnostics first, then bounded maintenance.
6. Enable internal agent ops only after the media boundary is safe.
7. Deliver early-next slice entities after the MVP slice is proven.

What can start before owner confirmations:

- contract drafting;
- read-only diagnostics scaffolding;
- audit schema and event taxonomy;
- non-sensitive draft CRUD;
- current-vs-target migration notes.

What must stay blocked until confirmations close:

- first publish of contacts and other truth-sensitive pages;
- claims-heavy publish;
- agent publish;
- any destructive operation outside archive or quarantine posture.

## 7. Stop triggers

Stop and do not hand this pack to implementation if any of the following remains true:

- approval is treated as publish;
- `Business Owner` becomes a general CMS editor;
- agent gets raw SQL or raw object-storage power;
- current runtime and target state are merged into one implicit canon;
- destructive operations lack explicit allowlists and audit;
- upload still reaches publish through a hidden path;
- agent ops starts before the media boundary is safe.

## 8. Report location

This report lives here:

- `docs/reports/2026-03-25/Admin_Agent_Ops_Implementation_Pack_Audit_Report_Экостройконтинент_v0.1.md`

That is the place to keep the audit trail for this review pass.
