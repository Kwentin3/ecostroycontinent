# Agent Security Sensitive Operation Addendum Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: addendum / secret-handling overlay  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md), [Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md](./Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md), [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md)

## Purpose

Этот addendum добавляет минимальные правила для operations, которые создают, раскрывают, проверяют или меняют секреты: passwords, bootstrap tokens, recovery codes, one-time setup links, credential reset material и похожие данные.

Generic agent pack already covers domain / invocation / usage / delegation / stop layers.  
It does not, by itself, describe secret-handling enough for security-sensitive operations.  
This addendum closes that gap without turning the project into a broad auth platform.

## Scope

- secret classification;
- bootstrap / reset / rotate distinction;
- one-time reveal posture;
- secure delivery channels;
- redaction rules;
- audit exclusion rules for secret material;
- extra stop rules for unsafe delivery.

## What this addendum owns

- how secret-bearing operations must be documented;
- how secret-bearing outputs must be redacted;
- which delivery paths are allowed for secret reveal;
- which fields may never appear in audit, logs, reports or agent transcripts;
- what the runtime must treat as unsafe by default.

## What this addendum does not own

- full identity management;
- MFA / SSO / session policy;
- password policy platform;
- recovery center UX;
- broad admin account lifecycle;
- new role model.

## Canon assumptions

- secrets are never normal log material;
- agent transcripts are not a secret delivery channel;
- a secret may be revealed at most once when the design calls for one-time reveal;
- bootstrap is exceptional and time-bounded;
- reset and rotate are distinct operations and must not be merged into bootstrap;
- if a secret cannot be delivered securely, the operation must fail closed.

## Non-goals

- turning credential handling into a general auth platform;
- allowing plaintext passwords in reports, event logs or docs;
- using email/chat/plain text as the canonical secret channel;
- allowing agents to see credential material by default;
- making one-time secret delivery reusable or ambient.

## Secret classification

Use these classes when a tool or operation handles secret material:

| Class | Examples | Handling posture |
| --- | --- | --- |
| `credential_secret` | password, initial bootstrap password, rotate password | never log plaintext; one-time reveal only if explicitly designed |
| `bootstrap_secret` | bootstrap token, setup link, activation code | one-time, short-lived, secure channel only |
| `recovery_secret` | recovery code, break-glass code | exceptional, human-mediated, audited, non-ambient |
| `session_secret` | session id, cookie token, bearer token | never log; not returned to agent as plain value |
| `verification_secret` | emailed code, phone code, challenge token | time-bounded, narrow, never treated as canonical secret truth |

## Bootstrap / reset / rotate distinction

### Bootstrap

First-time initialization of access for a designated privileged account or bootstrap slot.

Properties:

- one-time or exceptional;
- human-initiated;
- may create the initial credential material;
- should not be reusable as a normal account-management path.

### Reset

Restoration of access to an existing account after loss or lockout.

Properties:

- separate contract;
- usually requires stronger governance;
- not part of the bootstrap operation in this phase.

### Rotate

Replacement of an existing secret with a new secret.

Properties:

- separate contract;
- should preserve account identity;
- not the same as first-time initialization.

## Required addendum fields for secret-bearing tool contracts

Any tool contract that touches secrets must explicitly add:

| Field | Required meaning |
| --- | --- |
| `secret_class` | what kind of secret is involved |
| `secret_present_in_input` | whether secret material is ever accepted as input |
| `secret_present_in_output` | whether secret material is ever returned |
| `secret_delivery_mode` | how, if at all, the secret is revealed |
| `one_time_reveal_required` | whether the secret may be shown once only |
| `secure_channel_required` | whether a secure delivery channel is mandatory |
| `redaction_policy` | what must be removed from logs / reports / traces |
| `secret_audit_exclusions` | what must never be written into audit events |
| `secret_rotation_scope` | bootstrap / reset / rotate / none |
| `reveal_owner` | which human sees the secret, if anyone |

## Secret-handling posture

### Must never be logged

- plaintext password;
- password fragment or recovery phrase;
- bootstrap token value;
- setup link containing a secret token;
- recovery code value;
- session cookie / bearer token value;
- raw secret payloads in request / response bodies;
- full secure-link URLs if the query string contains a secret;
- secret hash if it would be confused as a recoverable secret in the audit trail.

### May be logged

- that a secret was generated or updated;
- secret class;
- delivery mode;
- the fact that one-time reveal happened;
- opaque delivery status;
- target account id or username if that is not itself secret in the current flow;
- confirmation ref / approval ref;
- trace and correlation ids;
- nonsecret audit summary.

### Agent transcript rules

- the agent never receives plaintext secret values;
- the agent never repeats secret values back into the transcript;
- the agent may report only redacted success / failure status;
- if a secret must be shown to a human, the reveal happens in a secure human-only surface, not in the agent log.

### Secure delivery rules

Allowed secure delivery patterns:

- secure admin UI one-time reveal;
- explicit human-only operator session;
- dedicated secure channel controlled by the runtime;
- other out-of-band channel only if it is explicitly designed as secure and one-time.

Not allowed as canonical delivery:

- plain chat transcript;
- plaintext email;
- copied docs;
- generic logs;
- shared screenshots without secure session controls.

### Redaction principles

- redact by default;
- never reconstruct secret values in human summaries;
- replace secret values with stable placeholders or opaque handles if needed;
- if a placeholder could be replayed as a secret, do not log it either.

## One-time reveal semantics

If the operation design calls for a one-time reveal:

- the secret is generated or activated once;
- it is displayed only to the intended human in a secure channel;
- the system marks the reveal as consumed;
- the secret is not re-displayed through the same operation path;
- subsequent access requires a separate, explicitly governed operation.

## Audit and forensic posture

Secret-bearing operations must still be auditable, but the audit trail must answer the following without exposing the secret itself:

- who initiated it;
- on behalf of which role or bootstrap authority;
- what secret class was handled;
- whether the reveal was one-time;
- which secure channel was used;
- whether the action succeeded, was blocked, or failed;
- what confirmation was used;
- what object or account was targeted;
- what delegated authority was in effect.

## Stop conditions

The agent or runtime must stop if:

- the requested delivery channel is not secure enough;
- the secret would need to appear in a log, report or transcript;
- the operation is ambiguous between bootstrap, reset and rotate;
- the target account identity is unclear;
- delegation is missing, expired or revoked;
- the operation would create a reusable secret backdoor;
- the design would require raw DB or raw storage access to work.

## Risks / failure modes

- secret values leak into audit or support logs;
- one-time reveal becomes repeatable;
- bootstrap is silently reused as a reset tool;
- the agent receives material it should never see;
- security-sensitive handling is buried inside generic prose instead of being explicit.

## Decisions that must not be reopened by default

- Plaintext secrets never go into logs, reports or docs.
- Agent transcripts are not a secret delivery channel.
- Bootstrap, reset and rotate are separate operation classes.
- One-time reveal is one-time.
- If secure delivery cannot be guaranteed, fail closed.

## Implementation notes for future coding, but no code

- Any security-sensitive tool contract should reference this addendum explicitly.
- The runtime should redact at the boundary, not after the fact.
- Secret-bearing success responses should be redacted by construction.
- The agent should treat any secret-related ambiguity as a stop signal, not an invitation to guess.
