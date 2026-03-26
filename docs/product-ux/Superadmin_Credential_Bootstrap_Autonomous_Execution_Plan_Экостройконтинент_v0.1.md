# Superadmin Credential Bootstrap Autonomous Execution Plan Экостройконтинент v0.1

Дата: 2026-03-25  
Проект: «Экостройконтинент»  
Тип: autonomous execution plan / implementation readiness  
Место в репозитории: `docs/product-ux/`

Основание:

- [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md)
- [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)
- [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md)
- [Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md)
- [Superadmin_Credential_Bootstrap_Contract_Plan_Report_Экостройконтинент_v0.1.md](../reports/2026-03-25/Superadmin_Credential_Bootstrap_Contract_Plan_Report_Экостройконтинент_v0.1.md)

## 1. Executive framing

This plan covers the narrow implementation-readiness path for `bootstrap_superadmin_credentials`, a one-time or exceptional security bootstrap flow that initializes login and password for the `Superadmin` account.

This is an enablement task, not an auth platform initiative.

The goal is to move from contract pack to safe coding readiness without introducing:

- a generic privileged-user creation system;
- a reusable reset or rotate framework;
- a hidden bootstrap shortcut through ordinary user CRUD;
- raw DB credential writes;
- plaintext secret leakage into logs, reports, transcripts, or audit events.

Success state for this plan:

- all pre-coding security decisions are closed;
- secure reveal model is chosen and frozen;
- bootstrap authority model is chosen and frozen;
- exact target identity handling is frozen;
- minimal runtime service boundary is frozen;
- audit and redaction boundary is frozen;
- the implementation path is ready for coding without hidden backdoors or scope creep.

## 2. Scope of execution

### In scope

- close the remaining pre-coding design gates for bootstrap;
- choose and freeze the secure reveal model;
- choose and freeze the bootstrap authority model;
- define exact target identity handling;
- choose the minimal runtime service boundary;
- define audit, redaction, and secret-delivery constraints;
- define a narrow implementation safety plan;
- define focused verification and proof artifacts;
- define the go/no-go readiness gate before coding.

### Out of scope

- full IAM / identity platform design;
- MFA, SSO, recovery center, or password rotation platform;
- broad account lifecycle management;
- generic user administration expansion;
- public-facing auth UX redesign;
- any future surfaces such as SEO dashboard, public AI chat, calculator, CRM-lite, broad analytics, EN rollout, or multi-region launch.

### Intentionally blocked

- ordinary `users/create` flow becoming the bootstrap primitive;
- agent deciding to create a superadmin on its own;
- any plaintext secret in ordinary operator output;
- any reusable emergency bypass;
- any hidden runtime fallback that makes the bootstrap flow look generic;
- any raw DB credential write path;
- any secret-bearing operation that cannot be delivered securely and redacted correctly.

## 3. Canon constraints that must not be reopened

- `Phase 1 = narrow launch-core`.
- `Admin Console = write-side tool`.
- `Public Web = published read-side only`.
- `Content Core in SQL = source of truth`.
- `MediaAsset = first-class entity`.
- `Publish = explicit domain operation`.
- `Approval != Publish`.
- `AI = assistive only`.
- `No autonomous publish`.
- `No raw unrestricted DB access`.
- `No raw unrestricted storage access`.
- `Business Owner = review-first / truth-confirmation posture`.
- `bootstrap_superadmin_credentials` remains one-time or exceptional, not a reusable admin escape hatch.
- `bootstrap` must stay distinct from `reset` and `rotate`.
- `agent` must remain bounded by delegation envelope and stop on ambiguity.

## 4. Decision gates before coding

| Gate | Decision to make | Options | Preferred option | Why | If unresolved | Stop trigger |
| --- | --- | --- | --- | --- | --- | --- |
| Secure reveal model | How the initial secret is created and delivered | A. server-generated password with one-time secure reveal; B. human-entered password in secure operator surface | A | Minimizes plaintext handling risk, keeps agent away from the secret, and is easier to audit as a one-time bootstrap event | Coding cannot start because secret handling and audit design remain ambiguous | Any design that requires plaintext secret exposure outside a secure one-time reveal path |
| Bootstrap authority model | Who is allowed to initiate the bootstrap | A. explicit human bootstrap authority outside ordinary RBAC; B. ordinary product role; C. implicit deployment shortcut | A | The account does not exist yet, so ordinary role-based authority is not enough; a one-time governed authority keeps the flow human-mediated | Delegation envelope cannot be finalized | Any move toward generic or implicit authority |
| Exact target identity handling | What identity receives the bootstrap secret | A. fixed reserved bootstrap identity; B. deploy-time locked registry value; C. free-form user input | A as the canonical choice; B only if it is resolved once into a locked exact-match registry value; never C | Avoids ambiguous target selection and makes the operation fail-closed | Target identity remains ambiguous and the flow can be misused | Any path that allows the agent or operator to improvise the target identity |
| Minimal runtime service boundary | What runtime boundary owns the bootstrap | A. dedicated bootstrap service/operation backed by existing credential primitives; B. reuse existing `users/create` with guardrails; C. thin admin route that calls dedicated service | A, with C only as a thin shell if needed | Keeps the boundary narrow and prevents the generic user-create route from becoming a hidden backdoor | The implementation path stays blurry and ordinary CRUD absorbs bootstrap responsibilities | Any plan that lets the ordinary user-create path act as bootstrap |
| Audit and redaction boundary | What is logged and what is excluded | A. strict secret-class audit with redaction and exclusions; B. generic logs with later sanitization | A | Audit must remain useful without leaking secret material | Security-sensitive logging remains underdefined | Any requirement to log plaintext, secret fragments, or replayable secret values |
| Bootstrap lifetime | Whether the flow is strictly one-time or governed exceptional | A. strictly one-time or exceptional in phase 1; B. reusable exceptional path; C. ordinary repeated path | A | Reuse increases backdoor risk and undermines the bootstrap boundary | The team cannot prove the flow is not a reusable bypass | Any attempt to normalize the flow into a recurring admin mechanism |

## 5. Workstreams

### WS1 — Finalize pre-coding decisions

Objective: close all unresolved bootstrap design gates before any coding begins.

Owned artifacts: decision memo; final bootstrap authority note; target identity note; go/no-go readiness note.

Likely touchpoints: [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md); [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md); [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md) if wording needs a tiny alignment note.

Dependencies: the bootstrap contract, the addendum, the current canon, and the existing runtime primitives.

What agent may decide autonomously: document structure; comparison framing; checklist order; exact phrasing that preserves the chosen decision.

What requires owner review: secure reveal model; bootstrap authority model; exact target identity; one-time vs exceptional lifetime.

Stop triggers: any ambiguity in authority, identity, or secret handling; any drift toward a generic auth platform.

Success criteria: all pre-coding gates are locked and written down as fail-closed decisions.

Proof package: final decision memo; explicit open-question closure; explicit no-reset/no-rotate statement.

### WS2 — Choose and freeze secure reveal path

Objective: select a secure delivery model for the initial secret and freeze it as the only allowed bootstrap reveal posture for this phase.

Owned artifacts: secure reveal decision note; redaction matrix; reveal-channel note.

Likely touchpoints: [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md); [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md).

Dependencies: WS1 decision gates; bootstrap authority model; target identity handling.

What agent may decide autonomously: option comparison, wording, redaction table, machine-readable field set for the chosen path.

What requires owner review: final selection between server-generated one-time reveal and human-entered secure operator surface.

Stop triggers: any path that requires plaintext secret exposure in ordinary transcript or generic logs; any path that allows repeated secret reveal without a governed action.

Success criteria: exactly one reveal model is frozen, redaction is explicit, and the agent never needs to know the plaintext secret.

Proof package: chosen reveal model; secret redaction matrix; secure channel statement; explicit rejection of ordinary logs as delivery path.

### WS3 — Choose and freeze runtime service boundary

Objective: define the smallest runtime boundary that can implement bootstrap safely without using ordinary user CRUD as a backdoor.

Owned artifacts: runtime boundary note; file touchpoint list; no-backdoor statement.

Likely code touchpoints: `app/api/admin/users/create/route.js` as a non-bootstrap comparison point; `app/api/admin/login/route.js`; `lib/auth/password.js`; `lib/content-core/repository.js`; a new dedicated bootstrap service module; possibly a thin admin route shell if operator UX is needed.

Dependencies: WS2 secure reveal choice; WS1 authority and identity decisions.

What agent may decide autonomously: exact internal layering, function naming, failure codes, and whether the runtime boundary is implemented as a dedicated service behind a thin route shell.

What requires owner review: any choice that changes operator UX, secret delivery posture, or authority scope.

Stop triggers: reuse of ordinary `users/create` as the bootstrap primitive; raw DB credential writes; any widening of credential management beyond the bootstrap case.

Success criteria: a dedicated bootstrap boundary is defined, and the generic user-create path remains generic user CRUD.

Proof package: runtime boundary note; explicit exclusion of ordinary CRUD as bootstrap primitive; file touchpoint map.

### WS4 — Implementation safety plan

Objective: define how coding will proceed without secret leakage, role drift, or hidden fallback behavior.

Owned artifacts: implementation checklist; audit/redaction checklist; failure-mode checklist; test/verification checklist.

Likely touchpoints: bootstrap service file; operator route or service entry point; auth helper calls; audit event emission; logging redaction rules.

Dependencies: WS1, WS2, and WS3 frozen decisions.

What agent may decide autonomously: order of internal helper calls; exact stable error codes; minimal service decomposition; verification command list.

What requires owner review: anything that would change secret handling, add repeated bootstrap semantics, or introduce a new privileged capability.

Stop triggers: plaintext secret in logs; any hidden fallback branch; any reusable emergency bypass; any attempt to broaden the feature into reset/rotate or full IAM.

Success criteria: the implementation plan is narrow, auditable, and ready for coding without introducing a backdoor shape.

Proof package: checklist set; failure-mode coverage; route/service split description; audit redaction rules.

### WS5 — Verification and proof package

Objective: define the focused checks that must pass before and after implementation.

Owned artifacts: verification checklist; proof bundle template; review gate checklist.

Likely touchpoints: contract docs, addendum, runtime service files, audit events, and any bootstrap-specific operator surface.

Dependencies: the implementation safety plan and the frozen decision gates.

What agent may decide autonomously: exact grep/assert checks; focused code-review sequence; proof formatting.

What requires owner review: final security-sensitive acceptance of the chosen bootstrap flow.

Stop triggers: any proof requirement that would expose the secret; any inability to demonstrate that the bootstrap path is not the ordinary user-create path.

Success criteria: the proof package can demonstrate the security claims without secret leakage.

Proof package: changed files list; concise delta summary; proof of non-backdoor boundary; proof of redaction; proof of delegation checks; unresolved questions, if any.

### WS6 — Implementation readiness gate

Objective: issue the final go/no-go before coding.

Owned artifacts: readiness memo; approval checklist; final unresolved-questions list.

Likely touchpoints: all documents and the planned runtime boundary.

Dependencies: all earlier workstreams.

What agent may decide autonomously: assembly of the readiness package and sequencing of proofs.

What requires owner review: final go/no-go to code.

Stop triggers: any unresolved decision gate; any secret-handling ambiguity; any runtime boundary that still resembles a generic CRUD backdoor.

Success criteria: the feature is ready to code under a narrow, fail-closed, human-mediated boundary.

Proof package: final readiness memo; gate closure evidence; explicit confirmation that coding may start only after all gates are closed.

## 6. Canonical execution chain

### Step 1. Lock the bootstrap scope

Preconditions: the contract pack and addendum exist; the feature is still only a bootstrap flow.

Action: record the exact scope, the canonical name, and the no-reset/no-rotate boundary.

Expected result: the task is visibly narrow and cannot be reinterpreted as generic auth work.

Verification: explicit scope note; explicit out-of-scope note; explicit one-time or exceptional boundary note.

Artifacts: scope lock memo; final decision gate list.

Stop trigger: any scope expansion into user lifecycle, reset, rotate, MFA, SSO, or generic IAM.

### Step 2. Choose the secure reveal model

Preconditions: bootstrap authority and target identity are being defined.

Action: compare server-generated one-time reveal against human-entered secure operator surface; freeze the chosen model.

Expected result: one secret-handling pattern is locked and all ordinary logs/transcripts remain secret-free.

Verification: secret-handling table; audit redaction matrix; secure channel statement.

Artifacts: secure reveal decision note; redaction matrix.

Stop trigger: any requirement to expose plaintext secret in normal output or to reuse the secret in multiple delivery paths.

### Step 3. Freeze the bootstrap authority and target identity

Preconditions: secure reveal posture is known.

Action: define the explicit human bootstrap authority and the exact reserved target identity, with exact-match handling and no free-form improvisation.

Expected result: the flow is human-mediated and the target account is unambiguous.

Verification: exact target identity note; authority note; delegation-envelope alignment check.

Artifacts: authority model note; target identity note.

Stop trigger: ambiguity about who may initiate the operation or which identity is being bootstrapped.

### Step 4. Freeze the runtime service boundary

Preconditions: authority, target identity, and secure reveal model are known.

Action: choose a dedicated bootstrap service boundary backed by existing credential primitives and explicitly exclude ordinary `users/create` from bootstrap duty.

Expected result: the runtime shape is narrow and does not become a hidden backdoor through generic CRUD.

Verification: boundary description; call-path exclusion check; file touchpoint map.

Artifacts: runtime boundary note; implementation touchpoint map.

Stop trigger: any path where ordinary user creation can bootstrap superadmin credentials.

### Step 5. Freeze audit and redaction rules

Preconditions: runtime boundary exists on paper.

Action: define exactly what is logged, what is redacted, what is excluded, and what secret-bearing details never appear in reports or transcripts.

Expected result: audit remains useful for forensics without leaking secret material.

Verification: audit field list; exclusion list; redaction validation.

Artifacts: audit/redaction matrix.

Stop trigger: any need to log plaintext, replayable secret fragments, or raw secure-link values.

### Step 6. Assemble the implementation readiness gate

Preconditions: all decision gates are locked.

Action: gather proof artifacts, confirm stop conditions, and issue the coding readiness recommendation.

Expected result: the team can move to coding only within the frozen boundary.

Verification: readiness checklist; explicit pass/fail on each gate.

Artifacts: readiness memo; proof bundle template.

Stop trigger: any unresolved gate, any boundary leak, or any suggestion to widen the scope for convenience.

## 7. Approval budget and autonomy boundary

### Agent may decide autonomously

- document structure;
- comparison framing;
- exact wording that preserves the already chosen security posture;
- proof-package format;
- verification command list;
- exact internal function naming once the boundary is frozen.

### Agent may recommend only

- secure reveal model selection;
- bootstrap authority model selection;
- exact target identity handling choice;
- runtime boundary choice if it would alter operator UX or security posture.

### Explicit human decision required

- which secure reveal model is approved;
- who or what acts as the bootstrap authority;
- what exact reserved target identity is used;
- whether the flow is one-time only or an explicitly governed exceptional path;
- final go/no-go before coding.

### Must stop instead of improvising

- if the agent would need to weaken security for convenience;
- if plaintext secret exposure becomes necessary;
- if ordinary user CRUD starts looking like a bootstrap shortcut;
- if raw DB credential writes become the easiest path;
- if the feature begins to resemble a reusable admin bypass;
- if the feature drifts into reset / rotate / full IAM territory.

## 8. Secure reveal decision analysis

| Option | Pros | Risks | Operational complexity | Audit implications | Agent involvement boundary | Failure modes | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Server-generated password with one-time secure reveal | Keeps secret generation inside a controlled boundary; agent never needs plaintext; easier to enforce one-time reveal; easier to redact and audit | Requires a secure human-only reveal channel; reveal-consumed logic must be correct | Moderate | Audit can record that reveal happened, secret class, and channel, without logging the secret | Agent can request the operation and report only redacted status | Reveal channel unavailable; one-time reveal not consumed; operator loses the secret after reveal if not captured securely | Preferred |
| B. Human-entered password in secure operator surface | Simple mental model; human owns the password from the start | Higher plaintext handling risk; operator may paste into the wrong place; more chance of accidental logging or clipboard leakage | Lower on paper, higher in real security risk | Audit must still exclude the secret, but the operator flow is easier to misuse | Agent must never see the password; operator must complete the secret entry independently | Secret copied into logs; operator typo; agent transcript contamination; hidden reuse of the field later | Not preferred for this phase |

Recommendation: choose Option A for this project phase.

Why:

- it gives the smallest leakage surface;
- it keeps the agent away from plaintext secret values;
- it aligns with one-time exceptional bootstrap semantics;
- it is easier to prove fail-closed behavior in audit and verification;
- it reduces the chance of hidden secret propagation through normal operator tools.

If Option A cannot be implemented safely, stop rather than downgrading to a weaker posture without review.

## 9. Runtime service boundary analysis

| Option | Pros | Risks | Hidden shortcut risk | Auditability | Fit with current canon | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Dedicated bootstrap service / operation backed by existing credential primitives | Narrow and explicit; makes the bootstrap flow a separate security boundary; easiest to reason about in delegation and audit; can reuse hashing and repository helpers without reusing CRUD semantics | Requires one small dedicated boundary and careful secure reveal integration | Low | High; the operation can be logged as a dedicated security bootstrap event | Strong fit; keeps phase 1 narrow and avoids platform sprawl | Preferred |
| Reuse existing `users/create` path with hard guardrails | Lowest immediate code churn | Very high risk of hidden backdoor drift; ordinary CRUD becomes privileged bootstrap by convention; audit becomes ambiguous | High | Lower; the same path serves generic creation and sensitive bootstrap | Poor fit; violates the design intent to keep bootstrap distinct from ordinary user CRUD | Reject |
| Thin admin route calling a dedicated bootstrap service | Can keep UI surface small while preserving a dedicated service boundary | Acceptable only if the real security boundary stays in the dedicated service, not in the generic CRUD path | Low if service is dedicated | High if service owns the audit and redaction logic | Good fit if the route is just a shell over the dedicated service | Accept only as a shell, not as the boundary itself |

Recommendation: use a dedicated bootstrap service boundary, optionally exposed through a thin admin/operator route shell if the product needs one.

Why:

- it preserves a clean security boundary;
- it prevents the ordinary user-create route from becoming a bootstrap backdoor;
- it makes secret handling, audit, and delegation logic explicit;
- it remains narrow enough for a small team.

## 10. Verification strategy

### Contract-to-code alignment checks

- verify that the implementation follows the frozen contract name and scope;
- verify that the bootstrap path does not call the ordinary `users/create` route as its main primitive;
- verify that the chosen secure reveal model matches the documented decision.

### Secret-handling verification

- verify that plaintext secret values do not appear in ordinary logs, docs, reports, transcripts, or audit events;
- verify that the reveal is one-time if the chosen model uses a reveal;
- verify that any secure-link or secret-delivery value is redacted or excluded.

### Audit / redaction verification

- verify that audit contains actor, delegated_by, target identity, operation, outcome, and channel class;
- verify that audit does not contain recoverable secret material;
- verify that redaction rules are applied at the boundary, not after the fact.

### Boundary verification that ordinary user-create path is not a backdoor

- inspect call graph and route wiring;
- verify that bootstrap-specific code path is separate from generic user CRUD;
- verify that `users/create` remains generic user creation only.

### Failure-path verification

- verify forbidden-by-role, forbidden-by-delegation, ambiguous-target, unsafe-delivery, and bootstrap-already-exists cases;
- verify that each blocked case fails closed with a stable code and a human-readable explanation.

### Canon-drift verification

- verify that the plan and implementation never widen into reset / rotate / general IAM;
- verify that no future surface appears in the bootstrap path;
- verify that approval, publish, and bootstrap remain separate concepts.

## 11. Proof package

After implementation, the agent should return:

- changed files list;
- concise delta summary;
- proof that the bootstrap path is distinct from ordinary user CRUD;
- proof that plaintext secret is not exposed in ordinary logs, reports, or transcripts;
- proof of explicit delegation and authority checks;
- proof of one-time or exceptional boundary enforcement;
- proof of audit and redaction coverage;
- proof that no generic maintenance or fallback shortcut was introduced;
- unresolved questions, if any.

## 12. Stop triggers

- implementation requires plaintext secret exposure outside the secure reveal path;
- ordinary `users/create` becomes a hidden bootstrap backdoor;
- exact target identity remains ambiguous;
- bootstrap authority becomes generic, implicit, or reusable without governance;
- implementation needs raw DB credential writes;
- the feature starts expanding into reset, rotate, or full IAM;
- audit cannot remain useful without logging secret material;
- the agent must improvise around unresolved security decisions;
- any chosen path weakens the security posture for convenience;
- any path reintroduces secret-bearing ordinary logs or transcripts.

## 13. Minimal sequencing recommendation

1. Close the decision gates.
2. Freeze secure reveal, authority, target identity, runtime boundary, and audit/redaction.
3. Assemble the verification checklist and proof package template.
4. Move to coding only after the readiness gate is green.

What must be proven before coding:

- the secure reveal model is explicit and one-time or strictly governed;
- the bootstrap authority is human-mediated and bounded;
- the target identity is exact and non-ambiguous;
- the runtime boundary is dedicated and not the generic user-create path;
- the audit/redaction boundary is strict and secret-free.

What remains blocked:

- any coding that depends on unresolved security decisions;
- any reuse of generic CRUD as a hidden bootstrap shortcut;
- any plaintext secret handling outside secure delivery.

What should be deferred:

- reset / rotate work;
- broader auth platform changes;
- MFA / SSO / recovery UX;
- any future-surface expansion.

## Recommended execution mode

Recommended mode: `semi-autonomous with one or more review gates`

Why:

- the task is narrow enough for autonomous document and verification work;
- the secure reveal model and runtime boundary are security-sensitive decisions that should not be left to improvisation;
- the risk of hidden privileged backdoor drift is real if the agent is allowed to choose the weaker convenience path;
- one or more human review gates are appropriate before coding because the secret-handling and authority model affect the entire bootstrap boundary.

This mode keeps the plan autonomy-ready without pretending that the security choices are low-risk or interchangeable.
