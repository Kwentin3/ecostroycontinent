# Agent Delegation Envelope Spec Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: delegation / authority spec  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)

## Purpose

Этот документ фиксирует delegation envelope для internal agent.  
Он нужен, чтобы агент действовал не как автономный источник власти, а как bounded executor, работающий от имени конкретного человека, роли и scope.

## Scope

- initiator human semantics;
- acting role semantics;
- delegated scope;
- allowed operations / policy reference;
- explicit prohibitions;
- review requirement;
- expiry / revocation semantics;
- trace / audit fields;
- authority precedence.

## What this document owns

- границу delegated authority;
- различие между direct user authority и delegated agent authority;
- правила, по которым valid call всё равно может быть disallowed;
- обязательные trace и audit поля делегирования.

## What this document does not own

- полный RBAC matrix;
- tool-specific input schemas;
- publish workflow semantics;
- media implementation;
- DB / storage backend;
- UI слоя делегирования.

## Canon assumptions

- delegation всегда создаётся человеком;
- delegation не шире делегирующей human role;
- delegation не может обойти canon;
- delegation не делает agent owner-ом истины;
- delegation не может превратить review-first authority в general editor;
- delegation не может легализовать raw DB / raw storage access.

## Non-goals

- общий IAM redesign;
- “суперделегирование” с необъяснимыми правами;
- hidden operator mode;
- token that means everything;
- delegation without audit trail;
- delegation that outlives the human intent without expiry or revocation.

## Why delegation envelope exists

Технически валидный call может всё равно быть запрещён, потому что:

- действие выходит за delegated scope;
- роль не разрешает такой класс операции;
- операция требует human review;
- операция пересекает publish boundary;
- операция пересекает safe media boundary;
- allowlist id не совпадает с locked registry;
- delegation истёк или был отозван.

Envelope нужен, чтобы runtime мог отличить:

- прямую authority человека;
- bounded authority агента;
- техническую возможность вызова;
- canonical permission to act.

## Required envelope fields

| Field | Required meaning |
| --- | --- |
| `initiator_human_id` | кто инициировал делегирование |
| `delegation_id` | уникальный id делегирования |
| `acting_role` | под какой ролью агент действует |
| `delegated_scope` | какие зоны / операции разрешены |
| `allowed_operations` or `policy_reference` | точная ссылка на разрешённые действия |
| `explicit_prohibitions` | что нельзя делать даже при валидном call |
| `review_requirement` | нужно ли human review и для чего |
| `expiry_at` | срок действия делегирования |
| `revoked_at` | момент отзыва, если был |
| `trace_id` | trace chain |
| `correlation_id` | связка с пакетом и вызовами |
| `idempotency_key` | защита от повторов там, где нужно |
| `allowlist_id` | exact registry reference для safe wrappers and similar ops |

## Example envelope shape

Ниже - не wire format, а читаемая форма того, что должно быть известно runtime и audit trail.

- initiator_human_id: `user_123`
- acting_role: `SEO Manager`
- delegation_id: `deleg_456`
- delegated_scope: `draft CRUD`, `review packet assembly`, `bounded diagnostics`
- allowed_operations: `content_ops_v1`
- explicit_prohibitions: `publish`, `rollback`, `raw DB shell`, `raw storage shell`
- review_requirement: `owner review required for claims-heavy changes`
- expiry_at: `2026-03-25T18:00:00Z`
- revoked_at: `null`
- trace_id: `trace_789`
- correlation_id: `corr_012`
- idempotency_key: `idem_345`

## Authority precedence

Если есть конфликт, применяется порядок:

1. Canon truth and phase-1 constraints.
2. Explicit prohibitions in delegation envelope.
3. Review requirements from workflow / role docs.
4. Delegated scope.
5. Tool contract.
6. User request text.

Иначе говоря: envelope может только сузить права, но не расширить canon.

## Delegation semantics

- Delegation is always human-originated.
- Delegation scope must be narrower than the delegating human role.
- Delegation may be time-bounded.
- Delegation may be revoked at any moment.
- After revocation, every further agent call must fail closed.
- Expiry and revocation must be visible in audit and forensic traces.
- A call that is technically valid for the tool may still be disallowed because the envelope does not permit it.

## Direct authority vs delegated authority

### Direct human authority

Human acts directly under the rights of the role in RBAC.  
The human sees the system as a user.

### Delegated agent authority

Agent acts as an executor of a specific human intent.  
The agent does not inherit the full “human can do anything” assumption.  
It only receives the explicit scope and prohibitions that were delegated.

This distinction matters because:

- a human may browse, decide and review more broadly than the agent;
- the agent may only execute bounded operations;
- the agent must never infer broader rights from the fact that a human has them.

## Required revocation and expiry behavior

- if `revoked_at` is set, all subsequent actions fail closed;
- if `expiry_at` is reached, all subsequent actions fail closed;
- the runtime must not “gracefully continue” on stale delegation;
- the agent should be told that authority ended, not that the operation merely “did not work”.

## Audit requirements

The envelope must leave a trace with:

- initiator human id;
- acting role;
- delegation id;
- delegated scope;
- policy reference or allowlist reference;
- expiry;
- revocation status;
- target entity refs where relevant;
- trace / correlation ids;
- outcome;
- refusal reason if blocked.

## Open questions

- Should the agent be allowed to operate under more than one delegated scope in a single session?
- Which operations, if any, require a human to remain present during execution instead of only granting prior delegation?
- Do we need a separate delegation mode for diagnostics-only vs content ops vs maintenance?

## Risks / failure modes

- delegation becomes a hidden superuser token;
- acting_role and initiator_human_id are recorded but never enforced;
- expiry is logged but not checked;
- revocation is possible in docs but not runtime;
- envelope is technically valid while the call crosses publish or safe media boundary.

## Decisions that must not be reopened by default

- Delegation narrows authority; it does not widen canon.
- Delegation must be human-originated.
- Delegation expiry and revocation are mandatory safety controls.
- Delegated agent authority is not the same as direct human authority.
- No delegated raw DB shell.
- No delegated raw storage shell.
- No delegated autonomous publish.

## Implementation notes for future coding, but no code

- Runtime should reject any call whose envelope is missing required fields or whose scope does not exactly match the requested operation family.
- The agent must never be allowed to “fill in” missing delegation context by guessing intent.
- Any call blocked by revocation, expiry, publish boundary or safe media boundary should produce a clear, auditable denial.
