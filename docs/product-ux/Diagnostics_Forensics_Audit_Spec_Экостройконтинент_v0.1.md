# Diagnostics Forensics Audit Spec Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: diagnostics / forensic spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)

## Purpose

Этот документ фиксирует диагностику, аудит и форензику как first-class operational capability. Он нужен, чтобы команда могла быстро понять, что сломано, кто это сделал, что было опубликовано и почему publish или maintenance были заблокированы.

## Scope

- content integrity and readiness checks;
- workflow readiness and publish-event inspection;
- route / slug / truth consistency;
- media and storage integrity;
- DB and storage health checks;
- forensic audit timelines and delegated-action traceability.

## What this document owns

- diagnostic categories and severity;
- forensic audit event model;
- machine-readable + human-readable logging;
- publish event inspection;
- storage / DB trace visibility;
- correlation and trace IDs.

## What this document does not own

- general observability platform design;
- log shipping architecture;
- infra alerting policy;
- customer analytics;
- product KPI dashboards.

## Canon assumptions

- Diagnostics are operational, not vanity analytics.
- Audit must be useful to humans and LLM-assisted investigation.
- Every meaningful mutation or blocked attempt should leave a trace.
- The internal agent must not be a black box.

## Non-goals

- broad analytics platform;
- expensive BI tooling;
- raw log firehose as the primary human experience;
- log-only truth without structured events;
- hidden failure states with no user-readable reason.

## Diagnostic categories

| Category | Examples | Typical severity |
| --- | --- | --- |
| Content integrity | broken refs, missing required fields, route conflicts | blocking |
| Workflow readiness | failing publish gates, missing owner approval, preview unavailable | blocking or warning |
| Route and slug | slug conflicts, slug-change obligations, canonical mismatch | blocking |
| Truth consistency | inconsistent contacts, region mismatch, global settings drift | blocking |
| Media integrity | missing binaries, orphan assets, broken gallery membership | blocking or warning |
| Storage health | S3 connectivity, object existence, archive/quarantine consistency | blocking or warning |
| DB health | connectivity, allowlisted wrapper failure, named maintenance failure | blocking |
| Forensics | audit timeline inspection, publish event inspection, agent trace | info |

## MVP diagnostic classes

For phase 1, diagnostics should be grouped into three practical classes:

| Class | Purpose | Priority |
| --- | --- | --- |
| Content truth diagnostics | broken refs, missing fields, missing proof path, slug conflicts, contact/global inconsistencies | highest |
| Workflow / publish diagnostics | failing gates, missing owner approval, preview status, publish event inspection | highest |
| Infra / storage diagnostics | DB connectivity, storage connectivity, missing binary, orphan media, wrapper failures | high |

This grouping keeps the MVP focused on real operational triage instead of broad observability theater.

## Event envelope

Every event should carry a structure like:

- event id;
- timestamp;
- actor user id, if human;
- actor role;
- delegated by user id, if agent;
- delegated role, if agent;
- entity type;
- entity id;
- revision id;
- operation name;
- result status;
- human summary;
- machine code;
- before / after or structured diff;
- correlation id;
- trace id;
- source basis if AI was involved;
- side effects;
- error reason if failed.

## Audit rules

- Every successful mutation must create an audit event.
- Every blocked mutation must create an audit event.
- Dry-run actions should also be auditable when they matter.
- Audit summaries must be short and human-readable.
- Machine codes must be stable and searchable.
- No secrets, credentials or raw object contents should be logged.

## Event taxonomy

| Event family | Examples |
| --- | --- |
| Content lifecycle | `revision_created`, `revision_updated`, `review_requested` |
| Owner review | `owner_review_requested`, `owner_approved`, `owner_rejected`, `sent_back_with_comment` |
| Publish lifecycle | `publish_blocked`, `published`, `rollback_executed`, `slug_change_obligation_created` |
| Media lifecycle | `media_upload_slot_created`, `media_finalized`, `media_attached`, `media_detached`, `media_archived`, `media_quarantined` |
| Diagnostics | `diagnostic_run`, `diagnostic_failed`, `connectivity_check_failed` |
| Maintenance | `named_maintenance_run`, `named_maintenance_failed` |
| Security / permission | `access_denied`, `allowlist_violation`, `scope_denied` |

## Readability requirements

The audit trail must answer, quickly and without guesswork:

1. Who did what?
2. On behalf of which role?
3. What entity or object changed?
4. What was the diff?
5. Was it a dry run or a real mutation?
6. What blocked it if it failed?
7. What side effects were triggered?

## Diagnostics output contract

Each diagnostic result should include:

- `severity`
- `code`
- `message`
- `entity_refs`
- `blocking` or `warning` flag
- `recommended_action`
- `evidence`
- `correlation_id`

## Minimum checks to expose

- broken refs;
- missing required fields;
- failing publish gates;
- slug conflicts;
- missing proof path;
- inconsistent contacts or global settings;
- missing media;
- orphan media;
- audit trail inspection;
- publish event inspection;
- db connectivity;
- storage connectivity;
- recent errors or operational health.

## Forensic use cases

- explain why publish was blocked;
- reconstruct who changed a slug;
- identify missing proof paths before owner review;
- prove whether a media asset is orphaned, missing or quarantined;
- distinguish agent-prepared drafts from human decisions;
- verify that rollback restored a previous published revision rather than patching live state.

## Risks / failure modes

- logs are human-readable but not machine-parseable;
- machine events exist but no human summary is useful;
- agent actions do not mention delegation context;
- publish events are logged without side effects or obligations;
- storage traces and DB traces are missing or disconnected from entity/revision context;
- diagnostics become a noisy dashboard instead of a quick operational triage tool.

## Open questions

- What retention period is acceptable for audit and forensic records?
- Which diagnostics should be visible to `Business Owner` versus `SEO Manager`?
- Should audit views support entity timeline only, or also correlation-based cross-entity search in MVP?
- Which named maintenance actions need a forensic trail beyond the normal audit event?

## Decisions that must not be reopened by default

- Every meaningful write has an audit trail.
- Blocked actions are auditable too.
- Human-readable failure reasons are mandatory.
- Machine-readable codes are mandatory.
- No secrets in audit logs.
