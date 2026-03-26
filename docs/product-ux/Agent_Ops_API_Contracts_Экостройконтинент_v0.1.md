# Agent Ops API Contracts Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: contract-first API / tool spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [PRD_Task_Delegation_API_Экостройконтинент_v0.1.md](./PRD_Task_Delegation_API_Экостройконтинент_v0.1.md)

## Purpose

Этот документ описывает bounded tool/API contracts для internal agent ops layer. Он нужен, чтобы агент был полезным операционным исполнителем, а не unsafe raw-access оболочкой над БД или storage.

## Scope

- common execution envelope and result contract;
- domain-oriented content, review, media and diagnostics operations;
- safe DB and storage wrapper contracts;
- dry-run, idempotency and allowlist rules;
- audit requirements for delegated actions.

## What this document owns

- common execution envelope;
- domain-oriented agent operations;
- safe DB wrapper contract;
- safe storage wrapper contract;
- dry-run / idempotency / allowlist rules;
- response and error contract;
- audit requirements for agent actions.

## What this document does not own

- product strategy;
- human review policy;
- UI layout;
- exact SQL text;
- storage provider implementation;
- background job orchestration details.

## Canon assumptions

- Agent is a bounded internal operator.
- Agent never silently publishes.
- Agent never has raw unrestricted SQL or raw unrestricted object-storage access.
- Domain-oriented operations are preferred over low-level technical commands.
- All meaningful actions are auditable.

## Non-goals

- arbitrary query console;
- bucket browser;
- general orchestration platform;
- multi-agent marketplace;
- autonomous publish assistant;
- free-form destructive maintenance by default.

## Common execution envelope

Every agent call MUST carry a structured envelope with at least:

```json
{
  "operation": "update_service_draft",
  "delegated_by_user_id": "user_123",
  "delegated_role": "seo_manager",
  "delegation_id": "delegation_123",
  "capability_bundle": "content_ops_v1",
  "allowlist_id": "content_allowlist_v1",
  "delegation_scope": [
    "service_draft_updates",
    "review_packet_assembly"
  ],
  "delegation_expires_at": "2026-03-25T18:00:00Z",
  "delegation_revoked_at": null,
  "idempotency_key": "uuid",
  "correlation_id": "uuid",
  "trace_id": "uuid",
  "dry_run": true,
  "target": {
    "entity_type": "service",
    "entity_id": "entity_123"
  },
  "input": {}
}
```

Required envelope fields:

- `operation`
- `delegated_by_user_id`
- `delegated_role`
- `delegation_id`
- `capability_bundle`
- `allowlist_id`
- `delegation_scope`
- `delegation_expires_at`
- `delegation_revoked_at`
- `idempotency_key`
- `correlation_id`
- `trace_id`
- `dry_run`
- `target`

Validation rule:

- `allowlist_id` must exactly match a locked versioned registry entry from the allowlist appendix;
- unknown or missing `allowlist_id` values must be rejected with `allowlist_violation`;
- no alias, wildcard, prefix or fallback mapping is allowed.

## Result contract

Every response should be machine-readable and human-readable.

```json
{
  "status": "blocked",
  "ok": false,
  "summary": "Slug conflict blocks publish readiness.",
  "blocking_issues": [
    {
      "code": "slug_conflict",
      "message": "Another published service already uses this slug."
    }
  ],
  "warnings": [],
  "diff": {},
  "preview": {},
  "side_effects": [],
  "audit_event_ids": ["audit_123"]
}
```

Recommended terminal statuses:

- `ok`
- `blocked`
- `needs_confirmation`
- `rejected`
- `dry_run`
- `not_found`

## Operation families

### 1. Content operations

Domain-oriented operations only.

Examples:

- `create_draft_entity`
- `update_draft_entity`
- `clone_published_to_draft`
- `link_entities`
- `unlink_entities`
- `submit_revision_for_review`
- `build_review_packet`
- `summarize_revision_diff`
- `prepare_owner_summary`

Rules:

- operate on entity types, not raw tables;
- mutate drafts only;
- never publish;
- never silently change canonical truth outside allowlist.

### 2. Review and readiness operations

Examples:

- `check_publish_readiness`
- `check_required_fields`
- `check_reference_integrity`
- `check_slug_conflict`
- `check_contact_truth`
- `check_proof_path`

Rules:

- output must include blocking and warning items separately;
- dry-run is the default posture for readiness probes;
- results must be understandable by humans and models.

### 3. Media operations

Examples:

- `request_upload_slot`
- `finalize_upload`
- `update_media_metadata`
- `attach_media`
- `detach_media`
- `reorder_gallery_assets`
- `archive_media`
- `quarantine_media`
- `check_media_integrity`

Rules:

- no direct bucket browsing;
- no unrestricted delete;
- prefer archive/quarantine over hard deletion;
- upload and finalize are separate steps;
- finalize must verify that the binary really exists and matches the expected shape.

### 4. Diagnostics operations

Examples:

- `find_broken_refs`
- `find_missing_required_fields`
- `find_slug_conflicts`
- `find_missing_media`
- `find_orphan_media`
- `inspect_audit_timeline`
- `inspect_publish_events`
- `check_db_connectivity`
- `check_storage_connectivity`
- `list_recent_errors`

Rules:

- diagnostics may read broadly, but only through allowlisted views and wrappers;
- diagnostics should not mutate truth unless the action is a named maintenance task;
- the output must recommend the next bounded action.

### 5. Safe DB wrappers

The agent must not get `run arbitrary query` in MVP.

Allowed wrapper shape:

- `db_get_row`
- `db_find_rows`
- `db_count_rows`
- `db_run_named_maintenance`

Wrapper rules:

- allowlist of tables and fields is explicit;
- filters are constrained;
- no arbitrary SQL text;
- no joins outside approved named views or named maintenance actions;
- named maintenance dispatch must exact-match the task name from the maintenance appendix;
- no generic maintenance shell, no fallback dispatcher, no unknown task coercion;
- every call has `dry_run` support where relevant;
- every mutation records an audit event.

Example safe contract:

```json
{
  "operation": "db_find_rows",
  "table": "content_revisions",
  "filters": {
    "state": "review"
  },
  "allowlist_id": "diagnostics_allowlist_v1",
  "dry_run": true
}
```

### 6. Safe storage wrappers

Allowed wrapper shape:

- `storage_presign_upload`
- `storage_probe_object`
- `storage_archive_object`
- `storage_quarantine_object`
- `storage_check_integrity`

Wrapper rules:

- no raw bucket shell;
- no unrestricted destructive delete;
- no anonymous object listing by default;
- destructive actions require named allowlist and explicit confirmation token when they are ever enabled;
- archive/quarantine is the default safety posture.

## Safety rules

- Agent cannot publish.
- Agent cannot approve owner-required revisions.
- Agent cannot mutate canonical truth silently.
- Agent cannot bypass allowlists.
- Agent cannot ignore `dry_run` when a risky operation requires it.
- Agent cannot use a raw SQL shell or raw object storage shell.
- Any destructive action must be a named, allowlisted maintenance task with explicit confirmation.
- Any allowlist id or named maintenance task that is not explicitly registered must fail closed.
- Any action after `delegation_expires_at` or after revocation must be rejected.

See [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md) for the explicit allowlist matrix and [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md) for the phase-1 named maintenance list.

## Audit requirements

Every agent action must record:

- who requested it;
- on behalf of which human role it was executed;
- operation name;
- target entity / object / row;
- dry-run or executed;
- before / after or structured diff;
- blocking issues;
- warnings;
- trace ids and correlation ids;
- any side effects or refusal reason.

If AI assisted the action, record the source basis class:

- current entity only;
- linked entities;
- published content;
- manual prompt only.

## Error taxonomy

Recommended error codes:

- `auth_required`
- `forbidden`
- `scope_denied`
- `allowlist_violation`
- `validation_failed`
- `conflict`
- `not_found`
- `preview_unavailable`
- `owner_approval_required`
- `publish_blocked`
- `confirmation_required`
- `dry_run_only`
- `storage_missing_binary`
- `storage_integrity_failed`
- `db_wrapper_unavailable`

Human-readable failure reasons are mandatory alongside machine codes.

## Risks / failure modes

- domain operations degrade into technical admin verbs;
- allowlists are defined too broadly;
- dry-run becomes a fake checkbox instead of a real safety gate;
- agent responses omit audit or trace context;
- the same operation can mutate truth in one path and only preview in another;
- storage and DB wrappers silently become raw shells by another name.

## Open questions

- Which named maintenance tasks are allowed in MVP?
- Should `Business Owner` ever launch agent actions, or only review packets?
- Should all mutating operations require an explicit `dry_run -> confirm` two-step, or only risky ones?
- Which wrapper views are read-only enough for SEO Manager versus Superadmin only?

## Decisions that must not be reopened by default

- No raw unrestricted SQL in MVP.
- No raw unrestricted object-storage access in MVP.
- Agent never publishes.
- Agent never auto-approves owner-required content.
- Domain-oriented operations outrank low-level technical commands.
