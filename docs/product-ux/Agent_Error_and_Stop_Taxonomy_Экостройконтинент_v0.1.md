# Agent Error and Stop Taxonomy Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: error / stop taxonomy  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md), [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](./Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот документ фиксирует machine-readable и human-readable модель ошибок, blocked и stop-состояний для agent-invoked tools.  
Он нужен, чтобы agent не превращал любое failure в попытку обхода, а человек получал понятный reason и следующий bounded шаг.

## Scope

- error class hierarchy;
- machine codes and human explanations;
- retry policy;
- stop policy;
- distinction between reject / block / partial / runtime failure / ambiguity;
- how to report blocked boundaries in a human-readable way.

## What this document owns

- error taxonomy for agent-invoked operations;
- stop taxonomy for blocked boundaries;
- retry / no-retry posture;
- human + machine reporting requirements.

## What this document does not own

- application exception classes in code;
- transport-level HTTP details;
- logging backend implementation;
- UI error design;
- monitoring / alerting policy.

## Canon assumptions

- every meaningful block must be explainable to a human;
- every meaningful block must have a stable machine code;
- dangerous operations fail closed;
- blocked boundaries are stop signals, not hints to improvise;
- `upload != publish`;
- `approval != publish`;
- `unknown allowlist_id -> reject`.

## Non-goals

- giant enterprise error catalog;
- stack-trace-centric human UX;
- vague “something went wrong” responses;
- retry loops that try to cross safety boundaries;
- ambiguous error codes that combine policy and runtime failure.

## Taxonomy summary

| Class | High-level machine code | Meaning | Agent action |
| --- | --- | --- | --- |
| Invalid input | `validation_failed` | required field missing, malformed value, invalid combination | fix input and retry only if corrected |
| Forbidden by role | `role_forbidden` | role does not permit the action | stop |
| Forbidden by delegation scope | `delegation_scope_denied` | action is outside delegated scope | stop |
| Blocked by review requirement | `review_required` | human review is required before proceeding | stop and hand back for review |
| Blocked by publish boundary | `publish_boundary_blocked` | action would affect live truth without explicit publish | stop |
| Blocked by safe media boundary | `media_boundary_blocked` | upload / finalize / binary state is not safe enough yet | stop |
| Blocked by allowlist policy | `allowlist_violation` | unknown or forbidden allowlist / maintenance id | stop |
| Runtime failure | `runtime_failure` or `integration_failure` | transient backend / connectivity / system failure | retry only if safe and clearly transient |
| Ambiguous / missing context | `ambiguous_context` | the agent cannot safely choose or proceed | stop and ask for clarification |

## Human-readable explanation rules

Every failure response must include:

- what operation was attempted;
- which boundary or rule stopped it;
- what object or entity was involved;
- what the safe next step is;
- whether a human decision is needed.

Human explanations must not:

- expose secrets;
- speculate about hidden system internals;
- blur policy failure with runtime failure;
- suggest that a blocked boundary can be bypassed by a different tool.

## Detailed classes

### 1. Invalid input

Examples:

- missing required field;
- wrong enum;
- invalid target id;
- prohibited input combination;
- malformed `allowlist_id` syntax.

Machine code examples:

- `validation_failed`
- `conflict`
- `not_found`
- `dry_run_only`

Agent policy:

- may retry only after correcting the input;
- if correction requires guessing, stop;
- do not switch to a broader tool to compensate for bad input.

### 2. Forbidden by role

Examples:

- Business Owner tries to use a general content-edit tool not granted by canon;
- SEO Manager tries to publish;
- agent is asked to do a human-only action.

Machine code examples:

- `role_forbidden`
- `auth_required`

Agent policy:

- stop;
- do not retry with the same call;
- do not ask a different tool to smuggle the same effect.

### 3. Forbidden by delegation scope

Examples:

- delegated envelope allows draft CRUD but not publish;
- delegation expired or revoked;
- action is outside the exact allowed family.

Machine code examples:

- `delegation_scope_denied`
- `delegation_expired`
- `delegation_revoked`

Agent policy:

- stop immediately;
- do not infer a wider scope from human intent;
- do not look for a “close enough” operation.

### 4. Blocked by review requirement

Examples:

- claims-heavy content not yet reviewed by owner;
- launch-critical material missing explicit owner decision;
- review packet not accepted yet.

Machine code examples:

- `review_required`
- `owner_approval_required`

Agent policy:

- stop and surface the required human step;
- do not convert review into publish;
- do not auto-edit content to escape the review gate.

### 5. Blocked by publish boundary

Examples:

- tool would mutate live truth implicitly;
- approval is being treated as publish;
- upload path is attempting to become live state.

Machine code examples:

- `publish_boundary_blocked`
- `publish_blocked`

Agent policy:

- stop;
- do not chain to another tool to achieve the same public effect;
- escalate only through explicit publish flow if the human / role path allows it.

### 6. Blocked by safe media boundary

Examples:

- binary not finalized;
- metadata and storage truth mismatch;
- upload would need to become public to “work”;
- missing binary or integrity failure blocks media use.

Machine code examples:

- `media_boundary_blocked`
- `storage_missing_binary`
- `storage_integrity_failed`

Agent policy:

- stop;
- do not publish as workaround;
- do not attach media as if binary safety had already been proven;
- do not use raw storage access to bypass the boundary.

### 7. Blocked by allowlist policy

Examples:

- unknown `allowlist_id`;
- forbidden maintenance task name;
- no exact registry match;
- attempt to use a generic dispatcher.

Machine code examples:

- `allowlist_violation`
- `scope_denied`

Agent policy:

- stop;
- do not guess the nearest id;
- do not fall back to a “temporary debug” path;
- do not open raw DB / raw storage access.

### 8. Runtime failure

Examples:

- DB connectivity failure;
- storage connectivity failure;
- transient integration failure;
- named maintenance infrastructure failure.

Machine code examples:

- `runtime_failure`
- `db_wrapper_unavailable`
- `integration_failure`

Agent policy:

- may retry only if the failure is clearly transient and retry stays within same boundary;
- if retry is speculative, stop;
- do not convert runtime failure into a policy bypass.

### 9. Ambiguous / missing context

Examples:

- the target entity cannot be unambiguously identified;
- two tool families look plausible;
- the next safe action is unclear;
- the required human decision is missing.

Machine code examples:

- `ambiguous_context`
- `preview_unavailable`

Agent policy:

- stop;
- ask for clarification or review;
- do not choose a broader tool just to make progress.

## Retry policy

| Class | Retry allowed? | Notes |
| --- | --- | --- |
| Invalid input | only after correction | no blind retry |
| Forbidden by role | no | policy error, not transient |
| Forbidden by delegation scope | no | delegation must change first |
| Blocked by review requirement | no | human decision required |
| Blocked by publish boundary | no | explicit publish path only |
| Blocked by safe media boundary | no | fix media state first |
| Blocked by allowlist policy | no | exact allowlist is mandatory |
| Runtime failure | maybe | only if transient and safe |
| Ambiguous / missing context | no | clarify first |

## Stop policy

The agent must stop when:

- the response is blocked by any boundary rule;
- the error indicates review is required;
- the error indicates allowlist mismatch;
- the error indicates role or delegation denial;
- the next move would require inventing new runtime behavior;
- the only escape is to widen permissions or cross canon.

## Audit expectations

Blocked and rejected outcomes must still be auditable.  
Audit should include:

- attempted operation;
- machine code;
- human-readable reason;
- actor / delegated by / role;
- trace / correlation ids;
- target entity refs;
- whether retry was attempted.

## Open questions

- Should we unify `not_found` and `conflict` under a single retry policy at runtime, or keep them separate for debugging clarity?
- Do we want a dedicated `blocked_by_truth_boundary` subtype for claims-heavy content, or is review requirement sufficient?
- Which error classes should be shown directly to the Business Owner versus only to Superadmin / operators?

## Risks / failure modes

- machine code exists but human explanation is vague;
- human explanation exists but code is not stable;
- retry policy is ignored and blocked boundary becomes a loop;
- agent treats ambiguous context as permission to guess;
- runtime and policy failures collapse into one generic status.

## Decisions that must not be reopened by default

- Human-readable failure reasons are mandatory.
- Machine-readable statuses are mandatory.
- Dangerous operations must fail closed.
- Blocked boundaries are stop signals.
- `upload != publish`.
- `approval != publish`.
- `unknown allowlist_id -> reject`.

## Implementation notes for future coding, but no code

- Every tool response should carry both a stable machine code and a short human summary.
- Runtime should distinguish retryable transient failures from policy / boundary failures.
- If an error would otherwise be generic, it should be mapped to the narrowest truthful class in this taxonomy.
