# Agent Tool Contract Template Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: canonical template / tool contract pattern  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот документ даёт canonical template для одной tool contract.  
Он нужен, чтобы каждая agent-callable operation описывалась одинаково: domain meaning, invocation contract и agent usage contract отдельно, без смешивания смысла, транспорта и выбора tool-а.

## Scope

- canonical shape одной tool contract;
- обязательные и запрещённые поля;
- разделение domain contract, invocation contract и agent usage contract;
- минимальные safety требования к tool documentation.

## What this document owns

- шаблон структуры tool contract;
- минимальный набор обязательных полей;
- правила, какие секции должны присутствовать у каждой tool contract;
- guidance, как не смешивать доменную семантику и runtime invocation.

## What this document does not own

- endpoint inventory;
- конкретные request / response schemas;
- backend implementation;
- UI формы;
- policy engine;
- tool runtime code.

## Canon assumptions

- Tool contract должна быть полезна и человеку, и агенту.
- Если формулировка допускает двусмысленность, она должна считаться неприемлемой.
- `upload != publish`.
- `approval != publish`.
- `owner != general editor`.
- `unknown allowlist_id -> reject`.
- `agent cannot improvise around blocked boundaries`.

## Non-goals

- миллионы полей “на всякий случай”;
- enterprise theater;
- попытка описать весь backend в одном документе;
- техническая спецификация без доменного смысла;
- скрытый policy logic in prose без явной структуры.

## Separation model

### 1. Domain contract

Отвечает на вопрос: что операция означает в домене.

Содержит:

- смысл операции;
- что она явно не делает;
- какие сущности и состояния затрагивает;
- может ли операция затронуть public truth;
- может ли она менять published state;
- где граница между content, media, workflow, diagnostics и maintenance.

### 2. Invocation contract

Отвечает на вопрос: что runtime ожидает получить и вернуть.

Содержит:

- identity и version;
- input shape;
- required / optional / prohibited inputs;
- preconditions;
- execution semantics;
- side effects;
- output contract;
- failure codes;
- audit fields.

### 3. Agent usage contract

Отвечает на вопрос: когда агент должен вызывать этот tool, когда не должен и что делать при blocked / ambiguous / partial failure.

Содержит:

- selection guidance;
- prerequisite checks;
- forbidden combinations;
- retry / no-retry rules;
- stop conditions;
- follow-up tool guidance;
- anti-improvisation rules.

## Minimum required fields

Каждая tool contract должна явно содержать следующие группы полей.

| Group | Required fields |
| --- | --- |
| Identity | `contract_id`, `operation_name`, `version`, `owning_domain` |
| Meaning | `domain_meaning`, `explicit_non_meaning` |
| Permission boundary | `allowed_roles`, `agent_allowed`, `delegation_requirements`, `human_approval_required` |
| Preconditions | `preconditions`, `boundary_checks`, `state_requirements` |
| Input contract | `required_inputs`, `optional_inputs`, `prohibited_inputs`, `invalid_combinations` |
| Execution semantics | `sync_or_async`, `idempotency`, `side_effects`, `public_truth_effect` |
| Output contract | `success_statuses`, `blocked_statuses`, `partial_statuses`, `human_summary`, `machine_code` |
| Failure semantics | `validation_failure`, `permission_failure`, `policy_failure`, `review_block`, `boundary_block`, `runtime_failure` |
| Audit / trace | `actor`, `delegated_by`, `delegation_id`, `role`, `trace_id`, `correlation_id`, `entity_refs`, `audit_event_ids` |
| Agent usage rules | `when_to_call`, `when_not_to_call`, `preceding_tool`, `forbidden_auto_chain`, `stop_conditions` |

## Canonical template

### A. Identity

- `contract_id`: `[stable id]`
- `operation_name`: `[tool or API name]`
- `version`: `[contract version]`
- `owning_domain`: `[content | workflow | media | diagnostics | db-wrapper | storage-wrapper | maintenance]`
- `tool_kind`: `[read | draft-write | review-prep | publish | rollback | diagnostics | maintenance | wrapper]`

### B. Domain meaning

- What this operation does in business / domain terms:
  - `[describe the domain action]`
- What this operation explicitly does not do:
  - `[describe the excluded effect]`
- Whether it may touch:
  - draft truth;
  - review state;
  - published truth;
  - media metadata;
  - binary object state;
  - audit / forensic state.

### C. Permission boundary

- Who may invoke it directly:
  - `[Superadmin / SEO Manager / Business Owner / none]`
- Whether agent may invoke it:
  - `[yes / no / delegated only]`
- On behalf of which role(s):
  - `[role list]`
- Whether human approval is required:
  - `[yes / no / only for certain change classes]`
- Whether this tool is blocked until a safe boundary is proven:
  - `[yes / no]`

### D. Preconditions

List the state that must already be true before invocation:

- target entity exists or target discovery has been performed;
- delegation envelope is active and not revoked;
- role permits the action;
- allowlist id is exact and registered;
- review requirement is satisfied if applicable;
- safe media boundary is satisfied if applicable;
- publish boundary is not being crossed implicitly;
- idempotency key is present when needed.

### E. Input contract

- Required inputs:
  - `[field list]`
- Optional inputs:
  - `[field list]`
- Prohibited inputs:
  - `[field list]`
- Invalid combinations:
  - `[field list]`

Rules:

- ambiguous or inferred input should be treated as invalid unless explicitly allowed;
- broad free-form blobs are not a substitute for a domain field;
- no hidden “do what I mean” semantics.

### F. Execution semantics

- Sync / async expectation:
  - `[sync | async | mixed]`
- Idempotency expectation:
  - `[idempotent | safe to retry | exactly-once best effort]`
- Side effects:
  - `[list side effects]`
- Public truth effect:
  - `[no effect | draft-only effect | review-only effect | explicit publish effect]`
- Cache / projection / notification obligations:
  - `[if any]`

Rules:

- upload is not publish;
- approval is not publish;
- a successful draft operation must not be able to cross into live truth implicitly.

### G. Output contract

- Success statuses:
  - `[ok | dry_run | accepted | completed]`
- Blocked statuses:
  - `[blocked | needs_confirmation | review_required]`
- Rejected statuses:
  - `[rejected | forbidden | allowlist_violation | not_found]`
- Partial statuses:
  - `[partial | warning | completed_with_warnings]`
- Human summary:
  - one short sentence in plain language;
- Machine fields:
  - `machine_code`;
  - `entity_refs`;
  - `blocking_issues`;
  - `warnings`;
  - `audit_event_ids`;
  - `trace_id`;
  - `correlation_id`.

### H. Failure semantics

The contract must enumerate the failure classes it can emit:

- validation failure;
- role failure;
- delegation scope failure;
- review failure;
- publish boundary failure;
- safe media boundary failure;
- allowlist failure;
- runtime/integration failure;
- ambiguous context failure;
- conflict / not found where relevant.

Each failure must state:

- machine code;
- human-readable reason;
- whether retry is allowed;
- whether another tool may be chosen;
- whether the agent must stop and ask for review.

### I. Audit / trace

Every tool contract must define what is logged:

- who requested the call;
- on behalf of which human role;
- delegated_by;
- delegation_id;
- target entity / object / row;
- operation name;
- input class or diff summary;
- dry_run or executed;
- result status;
- human summary;
- machine code;
- trace / correlation ids;
- audit event ids;
- any side effects or refusal reason.

### J. Agent usage rules

Tool contract must tell the agent:

- when to call this tool;
- when not to call it;
- what tool should usually precede it;
- what tool must never be auto-chained after it;
- what to do if the tool returns blocked / ambiguous / partial.

### K. Stop conditions

The contract must say when the agent must stop instead of improvising:

- blocked by review requirement;
- blocked by publish boundary;
- blocked by safe media boundary;
- unknown allowlist id;
- delegation expired or revoked;
- role mismatch;
- ambiguous target or missing context;
- any attempt to cross into raw DB / raw storage / autonomous publish behavior.

## What must not be missing from any tool contract

- explicit statement of whether the tool can affect published truth;
- explicit statement of whether the agent may invoke it;
- explicit statement of whether human review is required;
- explicit preconditions;
- explicit failure codes;
- explicit audit requirements;
- explicit stop behavior;
- explicit forbidden combinations.

## What must never be implied by any tool contract

- that approval equals publish;
- that upload implies publish;
- that owner is general editor;
- that unknown allowlist IDs can be guessed or approximated;
- that a blocked boundary can be worked around with a neighboring tool.

## Open questions

- Should we normalize a single template for all tool families, or keep small family-specific variants on top of this base template?
- Which fields are mandatory for every tool, and which are optional for read-only diagnostics?
- Do some wrapper tools need stricter audit fields than content tools?

## Risks / failure modes

- template becomes pure prose and the runtime team still invents its own shapes;
- tool contracts drift into endpoint-specific docs with no usage guidance;
- a “helpful” field silently widens role or delegation scope;
- failure handling is defined technically but not operationally;
- audit fields exist but are not traceable in practice.

## Decisions that must not be reopened by default

- Domain contract, invocation contract and agent usage contract remain separate layers.
- The tool contract must explicitly say whether it can affect public truth.
- `upload != publish`.
- `approval != publish`.
- `owner != general editor`.
- `unknown allowlist_id -> reject`.
- `agent cannot improvise around blocked boundaries`.

## Implementation notes for future coding, but no code

- The runtime should validate the tool against the contract before dispatch.
- A tool contract should be rejected if it lacks a clear stop condition or a clear public-truth statement.
- The agent should only receive tools that already pass the permission / delegation / allowlist / boundary checks in the contract layer.
- If the tool touches credentials, tokens or other secret material, pair the contract with [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md).
