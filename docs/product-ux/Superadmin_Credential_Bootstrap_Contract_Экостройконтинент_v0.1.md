# Superadmin Credential Bootstrap Contract Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: security-sensitive tool contract  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md), [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](./Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md), [Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md](./Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md), [Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md](./Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md), [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md), [PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md](./PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md), [Admin_Autonomous_Execution_Plan_First_Slice_Экостройконтинент_v0.1.md](./Admin_Autonomous_Execution_Plan_First_Slice_Экостройконтинент_v0.1.md), [Admin_Closing_Batch_Acceptance_Report_Экостройконтинент_v0.1.md](../reports/2026-03-25/Admin_Closing_Batch_Acceptance_Report_Экостройконтинент_v0.1.md)

## 1. Executive summary

This document defines a single minimal security-sensitive operation contract for bootstrapping credentials for the `Superadmin` account.

The operation is intentionally narrow:

- it is human-initiated;
- it is one-time or exceptional;
- it is auditable;
- it is fail-closed;
- it does not reveal secrets in ordinary logs, reports, or agent transcripts;
- it does not become a generic privileged-user creation endpoint;
- it does not cover password reset or password rotation.

The canonical operation name is:

- `bootstrap_superadmin_credentials`

The reason for this name is simple:

- `bootstrap` communicates that the operation is an exceptional first-time initialization boundary;
- `superadmin_credentials` makes it clear that the tool deals with credentials, not a broad user-management flow;
- `initialize_superadmin_account` sounds broader than we want;
- `provision_superadmin_credentials` sounds reusable enough to drift into a normal admin shortcut.

## 2. Why this operation is special and not just another CRUD call

This is not ordinary user creation.

It is not:

- generic account CRUD;
- role elevation;
- password reset;
- password rotation;
- a hidden backdoor for emergency admin access;
- a normal admin convenience flow.

It is special because it touches the minimum security boundary that unlocks the admin system itself.

The operation exists only so that the project can:

- seed or initialize the designated privileged `Superadmin` bootstrap target;
- deliver an initial secret safely;
- establish the first trusted login path;
- do so without exposing the secret material to logs or agent output.

The operation must be treated as a one-time bootstrap boundary, not a reusable admin escape hatch.

## 3. Proposed canonical operation name

Canonical name:

- `bootstrap_superadmin_credentials`

Why this name is preferred:

- it is narrower than `provision_superadmin_credentials`;
- it is clearer than `initialize_superadmin_account`;
- it names credentials directly, which is the actual sensitive object;
- it naturally implies exceptional, bounded use.

Recommended contract identifiers:

- `contract_id`: `superadmin_credential_bootstrap_v1`
- `operation_name`: `bootstrap_superadmin_credentials`
- `version`: `v0.1`
- `owning_domain`: `security_bootstrap`

## 4. Full contract outline for the operation

### A. Domain meaning

What the operation does:

- initializes credentials for the designated `Superadmin` bootstrap target;
- may create or activate the reserved bootstrap account slot if the system design requires it;
- generates or provisions the initial secret through a secure one-time delivery path;
- records an auditable bootstrap event.

What it explicitly does not do:

- it does not create arbitrary privileged users;
- it does not elevate an existing non-superadmin user to superadmin through a casual shortcut;
- it does not implement routine password reset;
- it does not implement periodic password rotation;
- it does not touch content, publish, media or public read-side truth.

Bootstrap vs CRUD:

- CRUD manages normal account records;
- bootstrap initializes the first trusted privileged access path;
- bootstrap is exceptional and governed differently.

Bootstrap vs reset:

- bootstrap is first-time initialization or explicit bootstrap-slot activation;
- reset restores access to an existing account after loss or lockout;
- reset is out of scope here.

Bootstrap vs role elevation:

- bootstrap creates or initializes the privileged credential;
- role elevation changes authorization state for an existing identity;
- role elevation is not what this operation is for.

### B. Contract shape

| Field | Required meaning |
| --- | --- |
| `contract_id` | stable id for this operation contract |
| `operation_name` | `bootstrap_superadmin_credentials` |
| `version` | contract version |
| `owning_domain` | `security_bootstrap` |
| `domain_meaning` | one-time initialization of the superadmin credential path |
| `explicit_non_meaning` | not CRUD, not reset, not rotate, not role elevation |
| `allowed_initiators` | human bootstrap authority only; not a generic app role |
| `allowed_roles` | no ordinary product role directly; delegated bootstrap authority only |
| `delegation_requirements` | one-time, explicit, human-confirmed bootstrap delegation |
| `preconditions` | no active superadmin credential exists; exact target identity confirmed; secure delivery available |
| `input_contract` | target identity, bootstrap authority ref, confirmation ref, delivery mode, idempotency key; no plaintext secret in agent-visible input |
| `prohibited_inputs` | arbitrary role selection, multiple targets, secret material in transcript, reset / rotate request disguised as bootstrap |
| `execution_semantics` | one-time, fail-closed, exactly-once best effort, secret generation or activation under secure delivery |
| `output/result_contract` | redacted success or blocked / rejected status; no secret value in agent transcript |
| `failure_semantics` | validation, role, delegation, bootstrap-already-exists, confirmation, channel safety, runtime, policy |
| `audit_contract` | record who initiated, what target was bootstrapped, what secure channel was used, and whether reveal happened; never record plaintext secret |
| `stop_conditions` | ambiguity, existing active superadmin, unsafe delivery, missing confirmation, expired / revoked delegation |
| `agent_usage_rules` | call only after explicit authorization and only when the operation remains within bootstrap scope |

### C. Preconditions

Required preconditions:

- canonical SQL bootstrap / seed baseline is complete;
- the target is the designated superadmin bootstrap slot or the reserved bootstrap account identity;
- no active superadmin credential bootstrap has already completed for this target;
- there is no existing active superadmin credential that would make bootstrap unnecessary;
- the human bootstrap authority is valid and in scope;
- the secure delivery channel is available and approved;
- the target identity is unambiguous;
- the operation has explicit one-time confirmation.

### D. Input contract

Allowed high-level inputs:

- `target_login` or reserved bootstrap identity key;
- `target_display_name` if the design uses one;
- `bootstrap_authority_ref`;
- `confirmation_ref`;
- `delivery_mode` for secure one-time reveal;
- `idempotency_key`;
- `dry_run`.

Prohibited inputs:

- plaintext password in agent-visible input;
- arbitrary role selection;
- multiple user targets;
- a general admin-create payload that could create a non-superadmin user;
- secret material pasted into logs, notes or transcript;
- reset or rotate request disguised as bootstrap.

Input discipline:

- the operation may generate the password server-side;
- if a human-supplied password is ever supported, it must be through a separate secure human-only channel, not via ordinary agent transcript;
- the agent should never need to know the actual password value.

### E. Execution semantics

Recommended semantics:

- one-time or exceptional;
- synchronous from the caller perspective;
- exactly-once best effort with idempotency protection;
- secret generation and secure reveal are treated as one atomic bootstrap event from the human perspective;
- the actual secret must not be echoed back to the agent.

Side effects:

- create or update the reserved superadmin account record;
- persist password hash, not plaintext;
- mark bootstrap completion state;
- emit audit event;
- optionally mark one-time reveal consumed.

Public truth effect:

- none;
- this operation does not affect public read-side content truth.

### F. Output contract

Success output should be machine-readable and redacted.

Recommended high-level success data:

- `status = ok`
- `target_user_id`
- `target_login`
- `delivery_state`
- `bootstrap_state`
- `audit_event_ids`
- `trace_id`
- `correlation_id`

The output must not include:

- plaintext password;
- bootstrap token value;
- setup link with secret query string;
- recovery code;
- any secret fragment;
- any nonredacted session secret.

If secure one-time reveal is part of the design, the human-facing secure UI may show the secret once.  
The agent transcript still must not contain the secret value.

### G. Failure semantics

Failure classes that matter here:

- invalid input;
- forbidden by role;
- forbidden by delegation scope;
- bootstrap already exists;
- missing confirmation;
- unsafe delivery channel;
- ambiguous target identity;
- runtime failure;
- policy violation;
- expired / revoked delegation.

The operation should fail closed if any of the above is true.

### H. Audit / trace

Audit must record:

- initiator human id;
- bootstrap authority reference;
- acting role or authority class;
- target login or reserved target id;
- operation name;
- outcome;
- secure delivery mode;
- whether one-time reveal happened;
- trace / correlation ids;
- refusal reason if blocked.

Audit must not record:

- plaintext password;
- token value;
- secret link value;
- password hash;
- secret fragments;
- raw response payload that contains secret material.

### I. Agent usage rules

Right tool / right time:

- when a human has explicitly authorized a one-time superadmin bootstrap;
- when the target identity is confirmed;
- when secure secret delivery is available;
- when the operation is still within bootstrap scope.

Wrong tool / wrong time:

- for routine user CRUD;
- for password reset;
- for password rotation;
- for broad user-management workflows;
- for generic privileged-user creation;
- when the agent cannot guarantee secure delivery;
- when the target identity is ambiguous;
- when an active superadmin already exists and no bootstrap is needed.

Preceding check:

- validate exact target identity;
- validate bootstrap authority;
- validate that this is bootstrap, not reset / rotate;
- validate secure delivery path;
- validate that the generic agent contract addendum is attached.

Must never auto-chain after this operation:

- publish;
- role elevation;
- content CRUD;
- raw DB or raw storage operations;
- any broader auth-management flow.

### J. Stop conditions

The agent must stop instead of improvising when:

- the target identity is ambiguous;
- the operation would require a reusable backdoor;
- an active superadmin already exists and the bootstrap is no longer needed;
- the secure delivery channel is not available;
- the caller cannot provide explicit confirmation;
- the human asks to reinterpret bootstrap as reset or rotate;
- the operation would require plaintext secret handling in the transcript;
- the only way forward is to widen permissions beyond canon.

## 5. Delegation / authority model

### Allowed initiators

This operation is initiated by a human with explicit bootstrap authority.

In this phase that authority is not a normal product role and not a broad IAM concept.  
It is a one-time, tightly scoped security authority used only for initial bootstrap.

### Can the agent call it?

Yes, but only if:

- the human bootstrap authority explicitly delegates the action;
- the delegated scope is bootstrap-only;
- the delegated scope is one-time or short-lived;
- the secure delivery channel is available;
- the agent does not receive secret material as plain text.

### On behalf of whom

The agent acts on behalf of the explicit human bootstrap authority only.

It does not act as:

- a generic user admin;
- a hidden superuser;
- an autonomous identity operator.

### Confirmation semantics

Required:

- explicit human confirmation that the target is correct;
- explicit human confirmation that this is bootstrap, not reset or rotate;
- explicit human confirmation of the secure delivery mode.

### One-time scope

Recommended:

- the delegation should be single-use or extremely short-lived;
- after completion, the delegation should be revoked or expire immediately;
- the same bootstrap authority must not be reusable as a permanent shortcut.

### Expiry / revocation

Required:

- a revoked delegation must block all further actions;
- an expired delegation must block all further actions;
- the runtime must not “continue anyway” if the bootstrap window has closed.

### Direct human vs delegated agent

Direct human action may be allowed in a secure operator flow, but the agent must remain bounded:

- the human may see the secret in a secure UI;
- the agent may see only redacted status and nonsecret metadata;
- the agent may not become the secret holder or secret relayer in plain text.

## 6. Secret-handling posture

This contract imports [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md) as a mandatory overlay.

### Must not appear in audit, logs, reports or ordinary agent output

- password value;
- generated bootstrap token value;
- one-time setup link value if it contains the secret;
- recovery code value;
- plaintext secret fragments;
- any raw response body containing secret material.

### May be logged

- target login;
- target user id;
- bootstrap state;
- delivery mode class;
- one-time reveal happened or not;
- confirmation reference;
- trace / correlation ids;
- nonsecret refusal reason.

### One-time reveal / secure delivery

If the bootstrap is designed to reveal a generated password:

- the reveal happens once only;
- it happens in a secure human-only surface;
- it is not repeated in the agent transcript;
- it is not repeated in logs, reports or docs;
- it is invalidated after reveal.

### Redaction principles

- redact by default;
- do not log the secret and then try to “sanitize” later;
- do not use the password hash as a convenient substitute for the secret in user-facing text;
- if something could be used to recover or replay the secret, do not log it.

## 7. Error / stop taxonomy for this operation

| Class | High-level machine code | Human-readable explanation | Agent action |
| --- | --- | --- | --- |
| Forbidden by role | `role_forbidden` | the caller does not hold bootstrap authority | stop |
| Forbidden by delegation scope | `delegation_scope_denied` | the delegation does not cover this bootstrap action | stop |
| Forbidden because bootstrap already exists | `bootstrap_already_exists` | an active superadmin credential already exists or bootstrap is already completed | stop |
| Invalid input | `validation_failed` | target identity or required bootstrap input is invalid | correct input only if unambiguous, otherwise stop |
| Missing confirmation | `confirmation_required` | explicit human confirmation has not been recorded | stop and ask for confirmation |
| Unsafe delivery channel | `unsafe_delivery_channel` | the secret cannot be delivered through an approved secure channel | stop |
| Ambiguous target identity | `ambiguous_context` | the target login or bootstrap slot is not uniquely identified | stop and ask for clarification |
| Runtime failure | `runtime_failure` | the backend or service failed unexpectedly | retry only if clearly transient and safe |
| Policy violation | `policy_violation` | the request would leak secrets or violate bootstrap policy | stop |
| Expired / revoked delegation | `delegation_expired` or `delegation_revoked` | the authorization window is no longer valid | stop |

### Retry policy

- invalid input: retry only after clear correction;
- missing confirmation: retry only after confirmation is recorded;
- runtime failure: retry only if transient and still within the safe bootstrap boundary;
- all policy / role / delegation / bootstrap-exists / unsafe-channel failures: do not retry; stop.

## 8. Relationship to the current agent contract pack

This operation fits cleanly into the layered pack because:

- the generic pack already defines domain contract, invocation contract and usage rules;
- the delegation envelope already defines who may act and with what scope;
- the error taxonomy already defines stop-on-ambiguity and fail-closed behavior;
- the addendum adds secret-specific overlay rules that the generic pack intentionally does not spell out in depth.

What already supports it:

- `Agent_Tool_Contract_Template_...` already requires domain meaning, preconditions, output and audit rules;
- `Agent_Delegation_Envelope_Spec_...` already covers initiator, acting role, delegated scope, expiry and revocation;
- `Agent_Tool_Usage_Rules_...` already says to stop on blocked / ambiguous / unsafe boundaries;
- `Agent_Error_and_Stop_Taxonomy_...` already gives a place for role, delegation, review, policy and ambiguity failures.

What needs the addendum:

- secret-classification;
- one-time reveal posture;
- secure delivery channel rules;
- stricter redaction expectations;
- bootstrap / reset / rotate separation.

Do we need to change the generic template?

- not strictly for this task;
- the addendum is enough as a minimal overlay;
- if the team later adds more secret-bearing tools, it may be worth adding optional `secret_class` and `secret_delivery_mode` fields to the generic template, but that is not required to keep this bootstrap contract safe.

## 9. Minimal document set to create or update

Create:

- [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md)
- [Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md)
- [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)

Optional low-cost updates:

- add a one-line reference to the addendum in [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md);
- add a one-line note in [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md) that secret-bearing tools must import the addendum.

## 10. Narrow execution plan

This is the implementation-design order, not code.

### Step 1. Freeze scope

Confirm:

- bootstrap only;
- no reset;
- no rotate;
- no generic auth platform;
- no raw DB or storage access;
- no secret values in logs or transcripts.

Stop if:

- the team starts widening this into account lifecycle or IAM.

### Step 2. Decide the bootstrap authority model

Choose a one-time bootstrap authority class that is outside ordinary app RBAC but still explicitly governed.

Required outcome:

- the first superadmin credential can be initialized without pretending an ordinary product role already exists.

Stop if:

- the design tries to make `SEO Manager` or `Business Owner` the default bootstrap operator.

### Step 3. Lock the contract and addendum

Finalize:

- canonical name;
- input boundary;
- secure delivery rules;
- audit redactions;
- stop conditions;
- one-time scope semantics.

Required proof:

- the contract clearly says bootstrap is not reset or rotate;
- the secret is never returned to the agent transcript.

### Step 4. Decide the runtime path

Pick one narrow implementation path:

- a dedicated bootstrap service / route;
- or a dedicated one-time bootstrap admin operation backed by the existing credential primitives.

Do not allow:

- the generic user-create route to become a hidden backdoor;
- raw SQL credential surgery by agent;
- secret delivery through ordinary logs.

### Step 5. Define secure delivery

Specify the human-only reveal path:

- secure admin UI one-time reveal;
- or another explicitly secured one-time channel.

Required proof:

- the password is visible once to the human, not to the agent transcript;
- the secret is redacted in audit, reports and docs.

### Step 6. Define failure and stop gates

Must stop if:

- target identity is ambiguous;
- an active superadmin already exists;
- confirmation is missing;
- delivery channel is unsafe;
- the operation would create a reusable backdoor;
- the design requires a reset or rotate flow instead of bootstrap.

### Step 7. Produce implementation proof artifacts

Before coding, the team should have:

- the finalized bootstrap contract;
- the security-sensitive addendum;
- the delegation and confirmation model;
- the redaction policy;
- the failure / stop taxonomy;
- the one-time delivery decision.

## 11. Open questions

- What is the exact canonical target identity for the bootstrap superadmin: reserved login string, reserved slot id, or seeded account key?
- Will the password be generated server-side and revealed once, or entered by a human in a secure operator surface?
- Is the bootstrap authority delivered via deployment-time governance, a secure operator action, or another explicit one-time mechanism?
- Do we need a minimal UI surface for bootstrap reveal, or is this purely a service-level contract for now?

## 12. Explicit non-goals

- full auth platform / IAM / SSO;
- password reset ecosystem;
- password rotation ecosystem;
- general user-management platform;
- generic privileged user creation;
- plain-text password handling in logs, docs or agent output;
- raw DB credential manipulation;
- backdoor emergency admin shortcut;
- agent acting as autonomous identity administrator.
