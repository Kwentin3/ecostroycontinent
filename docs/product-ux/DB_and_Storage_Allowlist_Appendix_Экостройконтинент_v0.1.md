# DB and Storage Allowlist Appendix Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: appendix / allowlist matrix  
Основание: [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот appendix фиксирует жёсткий allowlist для safe DB и storage operations. Он нужен, чтобы запрет `no raw SQL / no raw bucket shell` не остался декларацией.

## Scope

- allowed operations;
- allowed entities / tables / prefixes;
- forbidden variants;
- destructive-action posture;
- maintenance-only actions that need explicit naming and confirmation.

## What this document owns

- explicit DB and storage allowlists;
- destructive-action posture;
- confirmation rules for risky operations;
- forbidden variant boundaries.

## What this document does not own

- SQL schema;
- storage provider selection;
- business content model;
- workflow policy;
- UI presentation.

## Canon assumptions

- allowlists are mandatory and auditable;
- no raw unrestricted SQL or storage access for agent;
- archive/quarantine is preferred over hard delete;
- wrappers must remain domain-oriented.

## Registry shape

- allowlist registry is versioned and locked in v0.1;
- if code consumes this appendix directly, it must use exact registry entries only;
- valid registry ids are:
  - `content_allowlist_v1`
  - `diagnostics_allowlist_v1`
  - `storage_allowlist_v1`
  - `maintenance_allowlist_v1`
- unknown or missing registry ids must fail closed;
- no alias, prefix, wildcard or fallback mapping is allowed.

## Non-goals

- arbitrary query console;
- bucket browser;
- generalized ops shell;
- turning maintenance notes into a generic admin platform.

See [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md) for the phase-1 named maintenance task list.

## DB allowlist

| Operation | Allowed targets | Forbidden variants | Notes |
| --- | --- | --- | --- |
| `db_get_row` | allowlisted entity and revision tables, user table for role checks, audit events for inspection | arbitrary table names, raw SQL text | read-only only |
| `db_find_rows` | allowlisted tables and named diagnostic views | joins outside named views, unconstrained filters, raw SQL text | use for diagnostics and review queue |
| `db_count_rows` | allowlisted tables or named views | arbitrary SQL expressions | read-only only |
| `db_run_named_maintenance` | named maintenance tasks only | generic maintenance shell, ad hoc SQL | requires exact allowlist id, exact task name and audit |

### Recommended allowlisted areas

- `content_entities`
- `content_revisions`
- `publish_obligations`
- `audit_events`
- `app_users`
- `app_sessions` only for narrowly defined session hygiene tasks
- named diagnostic views for content integrity, review queue and publish inspection

### Forbidden DB variants in MVP

- arbitrary `SELECT`, `UPDATE`, `DELETE`, `INSERT`, `ALTER` text from agent input;
- cross-tenant or cross-scope broad sweeps not defined in the allowlist;
- schema-changing operations;
- bulk destructive cleanup without a named maintenance action;
- any query path that can bypass domain-level validation.

## Storage allowlist

| Operation | Allowed targets | Forbidden variants | Notes |
| --- | --- | --- | --- |
| `storage_presign_upload` | media upload prefix only | arbitrary bucket paths | upload slot only |
| `storage_probe_object` | media upload / active media prefixes | list-all bucket browse | existence / metadata probe only |
| `storage_check_integrity` | allowlisted media prefixes | unrestricted bucket traversal | used by diagnostics |
| `storage_archive_object` | archive prefix or designated archive target | hard delete | safe retention posture |
| `storage_quarantine_object` | quarantine prefix or designated quarantine target | hard delete | safety / policy posture |

### Destructive-action matrix

| Action | MVP posture | Allowed by default | Notes |
| --- | --- | --- | --- |
| `detach` | allowed | Yes | relation-only operation, does not destroy binary |
| `archive` | allowed | Yes | preferred over delete when asset is no longer active |
| `quarantine` | allowed | Yes | for suspect, broken or policy-sensitive assets |
| `restore` | bounded maintenance | No, explicit allowlist only | requires audit and confirmation |
| `hard delete` | forbidden by default | No | only if canon changes explicitly and with strong review |

## Confirmation rules

- risky operations require `dry_run` first where meaningful;
- destructive actions require explicit confirmation token or confirm step;
- every call must record exact allowlist id;
- every call must record correlation and trace ids;
- unknown or missing allowlist ids must fail closed;
- every denied attempt must be auditable.

## Open questions

- Which named maintenance actions deserve inclusion in MVP, if any?
- Which read-only wrappers are enough for diagnostics without broadening scope?
- Should restore ever become a normal operation, or remain a special maintenance-only action?

## Risks / failure modes

- "temporary debug helper" becomes a raw shell in disguise;
- allowlist expands to become the whole database or bucket;
- hard delete starts as a convenience and ends as unsafe default;
- archive/quarantine are skipped and cleanup becomes destructive.

## Decisions that must not be reopened by default

- no raw unrestricted SQL in MVP;
- no raw unrestricted storage access in MVP;
- archive/quarantine are preferred over hard delete;
- allowlists must be explicit and auditable.
