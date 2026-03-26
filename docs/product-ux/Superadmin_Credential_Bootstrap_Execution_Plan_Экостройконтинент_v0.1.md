# Superadmin Credential Bootstrap Execution Plan Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation design plan  
Основание: [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md), [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md), [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md), [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](./Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md), [Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md](./Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md), [Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md](./Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md), [PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md](./PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md), [Admin_Autonomous_Execution_Plan_First_Slice_Экостройконтинент_v0.1.md](./Admin_Autonomous_Execution_Plan_First_Slice_Экостройконтинент_v0.1.md)

## 1. Executive framing

This plan is only about the minimal security-sensitive design and implementation contour for bootstrapping the `Superadmin` credential path.

It is not:

- a full auth platform;
- a password reset ecosystem;
- a password rotation ecosystem;
- a broad user-management initiative;
- a generic identity backoffice;
- a new backdoor for privileged access.

Success for this pass means:

- the bootstrap contract is explicit and narrow;
- the secret handling rules are explicit and redacted;
- the implementation path is one canonical path, not multiple ad hoc ones;
- the agent cannot see plaintext secrets in ordinary output;
- the team knows what to build before coding starts.

## 2. Scope of this plan

### In scope

- choose the canonical operation name and meaning;
- define the security-sensitive addendum;
- define the delegation and confirmation model;
- define the one-time reveal and secure delivery posture;
- define the failure / stop taxonomy for bootstrap;
- align the plan with current first-slice auth/login state;
- define proof artifacts required before implementation.

### Out of scope

- reset flow;
- rotate flow;
- MFA / SSO / broad IAM;
- recovery center UX;
- user lifecycle tooling beyond the one bootstrap boundary;
- raw DB manipulation of credentials;
- plaintext secret handling in logs, docs or agent reports.

### Intentionally blocked

- any attempt to use this flow as a generic admin-create shortcut;
- any attempt to let the agent become the secret holder;
- any attempt to make the bootstrap authority reusable as a permanent backdoor.

## 3. Canon constraints that must not be reopened

- `Admin Console` is write-side only.
- `Public Web` is published read-side only.
- `AI` is assistive only.
- `No autonomous publish`.
- `No raw unrestricted DB access`.
- `No raw unrestricted storage access`.
- bootstrap is not reset.
- bootstrap is not rotate.
- password material never appears in ordinary logs or agent transcripts.
- the agent must stop on ambiguity instead of guessing the target identity.

## 4. Workstreams

### WS1: Contract finalization

Objective:

- finalize the canonical bootstrap contract and the security-sensitive addendum.

Owned artifacts:

- [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](./Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md)
- [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)

Dependencies:

- current auth/login canon;
- first-slice admin bootstrap and seed notes;
- existing agent invocation pack.

What can be decided autonomously:

- canonical operation name;
- scope boundary;
- bootstrap vs reset vs rotate distinction;
- redaction posture.

What requires owner review:

- whether the bootstrap authority is deployment-time only or a narrow secure operator authority;
- whether the initial secret is generated server-side or entered via a secure human-only surface.

Stop triggers:

- the contract starts to read like generic user CRUD;
- the operation can be reused as a normal admin shortcut;
- plaintext secret handling appears in the contract.

Success criteria:

- one narrow bootstrap contract exists;
- the addendum clearly covers secret handling and one-time reveal.

Proof package:

- final contract doc;
- final addendum doc;
- explicit bootstrap/reset/rotate distinction;
- explicit no-plaintext-in-transcript rule.

### WS2: Delegation and authority model

Objective:

- define who may initiate the bootstrap and how the agent may act on their behalf.

Owned artifacts:

- bootstrap contract authority section;
- addendum redaction / secure delivery section.

Dependencies:

- WS1 contract shape;
- existing delegation envelope spec;
- RBAC canon.

What can be decided autonomously:

- one-time or short-lived scope;
- mandatory confirmation count;
- revocation and expiry semantics;
- whether the agent is allowed to see only redacted outputs.

What requires owner review:

- exact bootstrap authority class outside ordinary product roles;
- exact secure delivery surface.

Stop triggers:

- the authority model starts to look like a permanent emergency bypass;
- the agent can call the operation without explicit human confirmation;
- the delegation can survive bootstrap completion and be reused casually.

Success criteria:

- a one-time bootstrap authority is defined;
- the agent is bounded and delegated only;
- revocation / expiry are fail-closed.

Proof package:

- delegation model excerpt;
- confirmation rules;
- expiry / revocation rules;
- agent transcript redaction rule.

### WS3: Runtime path selection

Objective:

- decide how implementation should be built without creating a backdoor.

Owned artifacts:

- implementation plan section for runtime path;
- final notes on code integration points.

Dependencies:

- WS1 and WS2;
- current auth code context:
  - `lib/auth/password.js`
  - `lib/auth/session.js`
  - `lib/content-core/repository.js`
  - `app/api/admin/users/create/route.js`

What can be decided autonomously:

- whether the runtime path is a dedicated bootstrap service or a one-time admin operation backed by a dedicated service layer;
- whether password generation is server-side only;
- whether the existing generic user-create route remains non-bootstrap.

What requires owner review:

- if the team wants to expose any human-facing bootstrap UI;
- if the team wants the bootstrap to happen only as a deployment task with no runtime UI.

Stop triggers:

- the plan uses generic users/create as the bootstrap primitive;
- the plan requires raw SQL credential surgery;
- the plan exposes secret material in a normal API response.

Success criteria:

- one canonical runtime path is selected;
- no duplicate bootstrap path is introduced;
- the path can be implemented with existing credential primitives without drifting into a broad auth system.

Proof package:

- runtime-path decision note;
- no-backdoor statement;
- explicit statement that `users/create` is not the bootstrap contract.

### WS4: Secret delivery and redaction

Objective:

- specify how the bootstrap secret is handled, revealed and redacted.

Owned artifacts:

- addendum secret-handling rules;
- contract secret-handling section;
- audit redaction rules.

Dependencies:

- WS1;
- WS2;
- security-sensitive addendum.

What can be decided autonomously:

- one-time reveal semantics;
- what may be logged;
- what must never be logged;
- whether the agent sees only a redacted status result.

What requires owner review:

- choice of secure human-only reveal surface;
- whether a one-time setup link or one-time display is the preferred secure channel.

Stop triggers:

- any plaintext secret enters transcript, report or audit;
- the delivery channel is not secure enough;
- the secret can be re-shown without a new governed operation.

Success criteria:

- secrets are one-time and redacted;
- the human gets a secure reveal if required;
- the agent receives only nonsecret metadata.

Proof package:

- redaction matrix;
- secure delivery decision;
- one-time reveal rule;
- audit exclusion list.

### WS5: Verification and implementation gate

Objective:

- produce the pre-coding proof that the design is safe enough to implement.

Owned artifacts:

- final contract doc;
- final execution plan;
- addendum;
- optional note in the generic invocation pack, if the team wants a cross-link.

Dependencies:

- WS1 through WS4.

What can be decided autonomously:

- proof checklist;
- redaction checklist;
- fail-closed verification steps.

What requires owner review:

- final acceptance of the one-time bootstrap authority model.

Stop triggers:

- any proof path depends on broadening auth scope;
- any proof path depends on hidden fallback access;
- any proof path cannot demonstrate that the agent never sees the secret value.

Success criteria:

- the team has a concrete pre-coding safety gate;
- the plan demonstrates the design is narrow, auditable and one-time;
- bootstrap is still distinct from reset / rotate.

Proof package:

- final checklist;
- stop gate list;
- unresolved questions list;
- implementation assumptions list.

## 5. Canonical execution chain

### Step 1. Freeze the operation boundary

Preconditions:

- the team agrees this is bootstrap only;
- reset and rotate stay out of scope.

Action:

- lock the operation name and the no-reset/no-rotate rule.

Expected result:

- no ambiguity about the scope class.

Verification:

- the contract says bootstrap only;
- the plan says reset / rotate are out of scope.

Artifacts:

- contract title and non-goals;
- addendum bootstrap/reset/rotate distinction.

Stop trigger:

- anyone tries to broaden the operation into general credential lifecycle management.

### Step 2. Finalize delegation and confirmation

Preconditions:

- a human bootstrap authority exists for this one-time action.

Action:

- define the explicit human confirmation required for the target identity and secure delivery mode.

Expected result:

- the agent may act only on behalf of a human bootstrap authority, not as an autonomous identity admin.

Verification:

- delegation section says one-time and fail-closed;
- confirmation requirements are explicit.

Artifacts:

- delegation model excerpt;
- confirmation rules.

Stop trigger:

- the agent can proceed without explicit human confirmation.

### Step 3. Lock secret-handling

Preconditions:

- the addendum is in place.

Action:

- define what may and may not be logged;
- define one-time reveal or secure delivery;
- define redaction rules.

Expected result:

- plaintext password never appears in ordinary logs, docs or agent output.

Verification:

- addendum says agent transcripts are not a secret delivery channel;
- audit exclusions list is explicit.

Artifacts:

- addendum;
- secret-handling section of the contract.

Stop trigger:

- any design choice requires the secret to be visible in normal text output.

### Step 4. Select the runtime path

Preconditions:

- the existing auth primitives are understood:
  - login verification;
  - password hashing;
  - user record creation.

Action:

- choose one narrow implementation path:
  - dedicated bootstrap service / route; or
  - dedicated one-time bootstrap operation backed by the existing credential primitives.

Expected result:

- one canonical path exists;
- the generic `users/create` route remains generic user CRUD and does not become the bootstrap primitive.

Verification:

- the plan explicitly says the bootstrap path is not the generic create-user path;
- no duplicate bootstrap route is implied.

Artifacts:

- runtime path decision note;
- implementation notes.

Stop trigger:

- the path requires raw SQL credential surgery or broad IAM expansion.

### Step 5. Define stop gates

Preconditions:

- the authority and secret-handling model are set.

Action:

- define the fail-closed conditions.

Expected result:

- the operation stops if target identity is ambiguous, bootstrap already exists, or secure delivery is unsafe.

Verification:

- stop taxonomy includes bootstrap-already-exists, unsafe delivery channel and ambiguous target identity.

Artifacts:

- failure taxonomy section in the contract;
- explicit stop triggers in the plan.

Stop trigger:

- the team tries to make bootstrap reusable as a backdoor.

### Step 6. Establish proof gates

Preconditions:

- contract, addendum, delegation and runtime path are drafted.

Action:

- create a pre-coding proof checklist.

Expected result:

- the team can prove safety before implementation begins.

Verification:

- checklist includes one-time reveal, redaction, fail-closed authority and no reset / rotate crossover.

Artifacts:

- proof checklist;
- final implementation gate section.

Stop trigger:

- proof cannot be produced without broadening scope.

## 6. Proof artifacts expected before coding

- final bootstrap contract;
- final security-sensitive addendum;
- delegation / confirmation model excerpt;
- redaction matrix;
- secure delivery decision;
- runtime path decision;
- explicit no-reset/no-rotate statement;
- explicit statement that the agent never sees plaintext secret values.

## 7. What must be decided before coding

- exact canonical bootstrap target identity;
- exact authority class used to initiate the one-time action;
- secure delivery surface;
- whether the secret is generated server-side or entered via a secure human-only surface;
- whether the runtime path is a dedicated bootstrap service or a dedicated one-time admin operation.

## 8. What is intentionally out of scope

- reset;
- rotate;
- MFA;
- SSO;
- broad recovery center UX;
- general user lifecycle management;
- public-facing auth product;
- anything that would normalize secret disclosure in ordinary logs or transcripts.

## 9. Stop gates

Stop immediately if:

- the design starts to look like a reusable emergency admin shortcut;
- the agent is expected to learn or repeat the secret;
- the secure delivery channel is not explicit;
- the target identity is ambiguous;
- bootstrap becomes reset or rotate by wording drift;
- the implementation path requires raw DB access or generic privileged-user CRUD as a shortcut.

## 10. Open questions

- Is the reserved bootstrap login fixed or configurable?
- Do we want a secure one-time reveal UI now, or only a service contract with human-only delivery semantics?
- Is the bootstrap authority deployment-time only, or an explicitly governed operator class for this one-time action?

## 11. Final recommendation

The safest and leanest path is:

1. keep `bootstrap_superadmin_credentials` as a one-time exceptional contract;
2. attach the security-sensitive addendum;
3. keep reset and rotate out of scope;
4. implement using the existing password hash and user-record primitives behind a dedicated narrow service boundary;
5. require explicit human confirmation and secure one-time delivery;
6. fail closed on any ambiguity.
