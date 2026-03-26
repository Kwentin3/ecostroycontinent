# Admin Agent Ops Implementation Plan Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation roadmap  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот план фиксирует delivery order для MVP slice и early-next slice. Он нужен, чтобы команда не распылилась на broader platform work и не потеряла safe operational posture.

## Scope

- phase order for MVP slice and early-next slice;
- dependency sequencing;
- exit criteria for each delivery step;
- stop gates and risk gates;
- what may ship first and what must wait.

## What this document owns

- implementation sequencing;
- dependency order;
- phase exit criteria;
- stop gates and risk gates;
- what can ship first and what must wait.

## What this document does not own

- detailed code design;
- precise endpoint naming;
- product positioning;
- infra procurement decisions;
- owner truth content.

## Canon assumptions

- Existing canon wins over convenience.
- The admin layer is write-side only.
- The agent layer is bounded and delegated.
- Publish remains explicit.
- Soft-delete/archive/quarantine is preferred over hard destructive actions.

## Non-goals

- implementing a broad AI platform;
- adding public AI chat or calculator work;
- building a page builder;
- shipping raw SQL or raw storage access;
- expanding scope into EN or multi-region launch.

## Recommended delivery order

| Step | Focus | Exit criteria |
| --- | --- | --- |
| 1 | owner confirmations and evidence gaps | contact truth, region, service core, claim boundaries, evidence gaps are explicitly tracked |
| 2 | contract freeze | PRD, domain model, RBAC, workflow, API, media, diagnostics are aligned |
| 3 | content core and revision discipline | draft/review/published behavior is stable for first-slice entities |
| 4 | RBAC and review surfaces | Superadmin / SEO Manager / Business Owner permissions are enforced cleanly |
| 5 | media/storage safety | upload slot, finalize, attach/detach, archive/quarantine and integrity checks are in place |
| 6 | diagnostics and forensic logging | blocked publish, broken refs, audit trails and storage/db traces are visible |
| 7 | internal agent ops API | blocked until upload-route migration is proven safe; then delegated execution envelope, dry-run, allowlists and bounded maintenance are working |
| 8 | MVP proof and hardening | one or two end-to-end flows are demonstrably safe |
| 9 | early-next slice | FAQ, Review / Testimonial, Article are added after MVP is stable |

Current runtime shortcuts that do not match target canon must be migrated inside steps 3-7, not treated as finished state. See [Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md](./Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md).

Hard gate:

- Phase 5 internal agent ops is blocked until Phase 3 media and storage safety is complete and the upload route has been proven not to cross into publish behavior.
- No agent ops enablement may occur before that proof exists.

## Phase 0: blocker resolution

Before implementation finishes, the team should confirm:

- public business name;
- primary phone and messenger set;
- public email decision;
- primary region / service area;
- final launch service core;
- guest-house and commercial inclusion or exclusion;
- 2-3 priority cases;
- claim boundaries for price, срок, guarantee wording;
- initial media archive source.

## Phase 1: contract and model foundation

Build or align:

- content entity contract;
- revision model;
- route ownership rules;
- publish obligations;
- RBAC matrix;
- audit event contract;
- diagnostics severity model.

Why first:

- without these, the code will drift into ad hoc behavior;
- the rest of the plan depends on them being stable.

## Phase 2: workflow and RBAC hardening

Implement or tighten:

- draft / review / published transitions;
- owner approval lane;
- publish and rollback separation;
- role-gated actions for Superadmin, SEO Manager and Business Owner;
- explicit approval and publish events;
- blocked contacts publish rule.

## Phase 3: media and storage safety

Implement:

- presigned upload slot or equivalent bounded upload contract;
- finalize verification;
- metadata editing;
- attach / detach / reorder;
- archive / quarantine posture;
- missing binary and orphan detection.

First code migration inside this phase:

- replace or gate the current media upload route so it no longer auto-publishes content;
- keep the current route treated as a transition path only, not as target contract.

Implementation note:

- if the repo currently uses a local file adapter, keep the storage contract S3-compatible and backend-agnostic so the production backend can be swapped without changing domain behavior.

## Phase 4: diagnostics and forensic logging

Implement:

- broken refs and missing fields checks;
- slug conflict checks;
- proof path checks;
- contact / global truth consistency checks;
- db connectivity checks;
- storage connectivity checks;
- audit timeline and publish event inspection;
- human-readable failure reasons plus machine codes.

## Phase 5: internal agent ops layer

This phase is hard-blocked until media safety proof is complete.

Implement a delegated tool layer that can:

- prepare drafts;
- validate content;
- assemble review packets;
- run diagnostics;
- execute bounded CRUD where allowed;
- run named maintenance actions when explicitly allowlisted.

Named maintenance actions must stay within [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md).

Do not allow:

- publish;
- owner approval;
- raw SQL console;
- raw storage shell;
- silent truth mutation.

## Phase 6: MVP proof and acceptance

MVP acceptance should prove:

- content CRUD works for first-slice entities;
- review and publish work end-to-end;
- rollback works to a previous published revision;
- media upload/finalize works without raw storage access;
- diagnostics can identify real problems quickly;
- audit logs are human-readable and machine-readable;
- agent can help without becoming a publisher.

## Phase 7: early-next slice

Add only after MVP is stable:

- `FAQ`;
- `Review / Testimonial`;
- `Article`;
- richer relation and review packet helpers;
- additional diagnostics that still remain allowlisted.

## Stop gates

Stop immediately if any of the following appears:

- a raw SQL or raw storage path is proposed for agent convenience;
- the agent is given silent publish ability;
- owner review becomes optional for claims-heavy or launch-critical content;
- the plan expands into public AI chat, calculator, SEO dashboard or EN rollout;
- launch-critical pages are treated as publishable without evidence;
- the current implementation gap is mislabeled as canon instead of being fixed to match canon.

## Risks / failure modes

- sequencing is reversed and the agent layer lands before workflow / RBAC safety;
- media gets implemented as file upload only, without finalize or integrity discipline;
- diagnostics are built as a reporting screen instead of a triage tool;
- the MVP quietly turns into a platform roadmap.

## Open questions

- Which validation and forensic checks are mandatory before MVP exit?
- Which named maintenance actions are safe enough to allow in v0.1?
- Do we ship the agent ops API before the UI wrapper, or together?
- Which data migration path is acceptable for media storage backend changes?

## Decisions that must not be reopened by default

- no raw unrestricted DB or storage access for the agent;
- no autonomous publish;
- no broad platform sprawl;
- no public AI chat or calculator in this package;
- no EN or multi-region launch in this package.
