# Named Maintenance Task Appendix Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: appendix / named maintenance allowlist  
Основание: [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот appendix делает `db_run_named_maintenance` и storage maintenance concrete enough for MVP. Он нужен, чтобы named maintenance не превращался в generic backdoor под красивым именем.

## Scope

- phase-1 allowed named maintenance tasks;
- task boundaries and safety posture;
- tasks that remain forbidden or not yet allowed;
- explicit review / audit / dry-run expectations.

## What this document owns

- the narrow MVP maintenance allowlist;
- task names that may be wired into wrappers;
- safety posture per task.

## What this document does not own

- general admin shell design;
- arbitrary database operations;
- storage provider selection;
- workflow policy;
- full observability tooling.

## Canon assumptions

- maintenance is narrow, named and auditable;
- maintenance is not a raw technical shell;
- destructive behavior stays exceptional;
- archive / quarantine is preferred over delete.

## Registry shape

- the named maintenance list is a locked versioned registry in v0.1;
- task names must exact-match one of the allowed entries in this appendix;
- unknown task names must fail closed;
- no prefix, wildcard or generic dispatch is allowed.

## Non-goals

- generic DBA toolbox;
- generic bucket cleanup shell;
- broad repair automation;
- hidden mutation paths.

## Allowed phase-1 tasks

| Task name | What it does | Safety posture |
| --- | --- | --- |
| `complete_publish_obligation` | marks a publish obligation completed after the required external step is done | idempotent, auditable, non-destructive |
| `refresh_published_projection` | refreshes read-side projection after a publish or rollback | idempotent, auditable, non-destructive |
| `quarantine_orphan_media` | moves orphan or suspect media into quarantine posture | bounded, reversible where practical, auditable |
| `archive_inactive_media` | archives media that should remain retained but inactive | bounded, reversible where practical, auditable |
| `purge_expired_sessions` | removes expired admin sessions as a hygiene task | bounded, auditable, narrowly scoped |
| `reconcile_audit_timeline` | performs a consistency check on audit rows and indices | read-only or minimally mutating depending on implementation; must be declared |

## Forbidden named tasks in MVP

- any generic `run_sql`;
- any generic `run_query`;
- any generic `delete_objects`;
- any blanket bucket cleanup task;
- any task that can publish or approve content;
- any task whose effect cannot be described in one sentence.

## Task rules

- every task must support `dry_run` where meaningful;
- every task must log exact allowlist id and correlation id;
- every task must be idempotent where practical;
- every destructive-like task must prefer quarantine or archive first;
- no generic maintenance shell or temporary debug dispatcher is allowed;
- if the task cannot be described and bounded clearly, it does not belong in MVP.

## Risks / failure modes

- the named task list grows into a full ops platform;
- a one-off repair task becomes a hidden raw shell;
- task naming hides destructive behavior;
- maintenance is used to bypass workflow or review.

## Decisions that must not be reopened by default

- named maintenance must stay narrow and explicit;
- raw SQL is not a named maintenance task;
- raw bucket cleanup is not a named maintenance task;
- publish and approval are not maintenance tasks.
