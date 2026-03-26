# SEO Test Autonomous Execution Plan

## Executive Framing
This pass turns the current SEO UI/runtime surface into a deterministic, role-safe test contour for agent-driven verification.

We are not building a broad QA platform. We are not widening SEO permissions. We are not introducing a hidden admin backdoor. We are formalizing the smallest possible support layer so an agent can later test the real SEO role with less chaos and fewer brittle assumptions.

Success state for this pass:
- the current SEO surface is clearly inventoried from code and runtime reality;
- the test matrix covers positive, negative, boundary, and validation cases;
- the minimal support interface is defined as a narrow probe contour;
- a minimal implementation exists if and only if it stays bounded;
- no canon drift or role widening is introduced.

## Scope Of Execution
In scope:
- SEO UI/runtime inspection;
- capability inventory and canon-vs-runtime delta;
- test matrix and gap analysis;
- minimal internal probe contract;
- minimal implementation of the probe harness if it remains narrow;
- focused verification and report.

Out of scope:
- broad QA infrastructure;
- auth/IAM redesign;
- raw DB or storage shell access;
- publish bypass;
- role widening;
- production user activation policy;
- SEO dashboard product features.

Intentionally blocked:
- any helper that would let the agent act outside the SEO role;
- any helper that would normalize secret handling or raw infra access;
- any helper that would reopen publish semantics;
- any helper that would become a general admin operator.

## Canon Constraints That Must Not Be Reopened
- `SEO Manager` is not a publisher.
- `Approval != Publish`.
- `Business Owner` remains review-first.
- `Admin Console` remains write-side only.
- `Public Web` remains published read-side only.
- `Content Core` remains source of truth.
- No raw unrestricted DB or storage access.
- No hidden publish path.
- No broad QA platform.

## Workstreams

### WS1 — Inspect Current SEO UI And Runtime Surface
Objective:
map the actual SEO-visible UI and route surface.

Owned artifacts:
- `SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`

Touchpoints:
- admin pages;
- SEO/editor routes;
- review routes;
- auth/session role checks.

Dependencies:
- current codebase;
- runtime role mappings;
- any available stage/dev fixtures.

Autonomous decisions:
- which pages/actions are actually SEO-visible;
- which route boundaries are positive versus forbidden.

Requires review:
- none unless runtime evidence conflicts with canon.

Stop triggers:
- the real SEO surface cannot be determined;
- the surface implies hidden privilege widening;
- production runtime is mistaken for stage/dev truth.

Success criteria:
- SEO surface is enumerated by route and action;
- positive and forbidden surfaces are separated;
- runtime gaps are explicit.

Proof package:
- route inventory;
- capability table;
- canon-vs-runtime delta.

### WS2 — Capability Inventory And Canon Delta
Objective:
translate the SEO surface into a role-safe capability map.

Owned artifacts:
- `SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`

Touchpoints:
- `lib/auth/session.js`;
- admin page guards;
- entity editor form;
- review/detail pages.

Dependencies:
- WS1 findings.

Autonomous decisions:
- which capabilities are present, forbidden, ambiguous, or blocked.

Requires review:
- if a capability appears to require role widening to test.

Stop triggers:
- the map drifts into future surfaces;
- the map normalizes publish or owner escalation.

Success criteria:
- positive, forbidden, ambiguous, and gap cases are separated cleanly.

Proof package:
- capability matrix;
- evidence of forbidden surfaces;
- gap list.

### WS3 — Test Matrix And Gap Analysis
Objective:
define what must be tested for the current SEO role.

Owned artifacts:
- `SEO_Test_Matrix_Экостройконтинент_v0.1.md`

Touchpoints:
- dashboard;
- entity list/editor pages;
- review queue/detail;
- media upload;
- history/forbidden routes.

Dependencies:
- WS1 and WS2.

Autonomous decisions:
- which scenarios are positive, negative, boundary, or validation.

Requires review:
- if a scenario requires a new privileged path.

Stop triggers:
- test cases require raw DB/storage;
- test cases require publish bypass;
- test cases require SEO permission widening.

Success criteria:
- matrix covers the real SEO role surface and the failure boundaries.

Proof package:
- scenario table;
- support-needed mapping;
- test order recommendation.

### WS4 — Minimal Test-Support API / Interface Design
Objective:
define the smallest bounded operator contour that makes SEO testing repeatable.

Owned artifacts:
- `SEO_Test_Support_API_Spec_Экостройконтинент_v0.1.md`

Touchpoints:
- existing authenticated routes;
- existing semantic HTML and link/form structure;
- optional probe script boundary.

Dependencies:
- WS2 and WS3.

Autonomous decisions:
- whether no new backend API is needed;
- whether a probe CLI is sufficient;
- whether mutation mode must stay optional.

Requires review:
- if the proposed support contour looks like a hidden backdoor.

Stop triggers:
- the support design becomes a broad QA platform;
- the support design requires raw DB/storage;
- the support design widens SEO business permissions.

Success criteria:
- one minimal, bounded, auditable support interface is defined.

Proof package:
- contract outline;
- allowed inputs/outputs;
- failure and stop model.

### WS5 — Minimal Implementation
Objective:
implement the minimal safe slice only if the support contour remains narrow.

Owned artifacts:
- probe CLI or equivalent internal harness;
- optional package script entry.

Touchpoints:
- `scripts/`;
- `package.json`;
- optional selector hooks only if truly needed.

Dependencies:
- WS4 design gate.

Autonomous decisions:
- exact shape of the probe harness;
- whether mutation mode is optional;
- whether stable selectors are unnecessary because current UI is semantic enough.

Requires review:
- if any new helper could act outside SEO role semantics;
- if any helper resembles a general admin operator.

Stop triggers:
- the slice starts to resemble a QA platform;
- the slice needs hidden privilege expansion;
- the slice needs raw infra access;
- the slice needs publish bypass.

Success criteria:
- the minimal support layer exists and is bounded;
- it supports deterministic SEO role probing;
- it does not change business semantics.

Proof package:
- changed files list;
- CLI/help output;
- narrow behavior summary.

### WS6 — Verification
Objective:
prove the support contour is safe and useful.

Owned artifacts:
- verification notes;
- final implementation report.

Touchpoints:
- script syntax and behavior;
- existing tests/build;
- route and selector inspection.

Dependencies:
- WS5 implementation if implemented.

Autonomous decisions:
- focused verification mechanics;
- whether a full QA run is unnecessary and wasteful.

Requires review:
- if verification cannot prove safety claims.

Stop triggers:
- proof of safety cannot be demonstrated;
- verification would require new privilege or unsafe runtime access.

Success criteria:
- the support contour is verifiable and does not introduce drift.

Proof package:
- exact checks performed;
- results;
- residual risks.

## Canonical Execution Chain
1. Freeze scope and confirm that the target is SEO testing, not broad QA.
2. Inspect current SEO-visible routes and actual runtime role mapping.
3. Build the SEO capability inventory and mark runtime gaps.
4. Build the SEO test matrix with current coverage and support needs.
5. Decide whether the minimal support interface can be satisfied by a probe harness alone.
6. Implement the probe harness only if it remains read-only by default and role-safe when mutation mode is enabled.
7. Verify the probe harness against build/test/runtime expectations as far as available.
8. Publish the implementation report and stop.

### Preconditions
- Current SEO surface is understood well enough to avoid guessing.
- No evidence suggests the design needs a hidden backdoor.
- No step requires widening SEO permissions.

### Expected Result
- A small team can later test the SEO role deterministically with a bounded operator contour.

### Verification
- route inventory matches code;
- capability inventory matches runtime reality;
- probe design remains internal and fail-closed;
- no publish or admin backdoor is introduced.

### Artifacts
- inventory doc;
- matrix doc;
- probe spec;
- implementation report if implemented.

### Stop Trigger
- any step starts to look like a new product platform instead of a narrow support contour.

## Approval Budget And Autonomy Boundary
Agent may decide autonomously:
- exact route inventory;
- exact matrix structure;
- whether a probe CLI is sufficient;
- whether semantic markup is enough and stable selectors are not needed in MVP;
- exact report schema for the probe output.

Agent may recommend but not decide alone:
- whether mutation mode should be enabled in stage/dev only or also in a dedicated disposable test DB;
- whether later browser automation needs `data-testid` hooks.

Agent must stop instead of improvising when:
- a helper would bypass publish or owner boundaries;
- a helper would require raw DB/storage access;
- a helper would widen SEO business permissions;
- the production SEO fixture is missing and no approved stage/dev fixture exists;
- the proposed support layer becomes a generic admin tool.

## Verification Strategy
- doc verification for inventory and matrix completeness;
- route/runtime verification against actual code and current runtime reality;
- capability verification that forbidden actions stay forbidden;
- gap verification that support needs are honest and bounded;
- regression-risk verification that no hidden publish or admin backdoor was introduced;
- build/test verification for any implemented probe script.

## Proof Package
If implemented, return:
- changed files list;
- concise delta summary;
- proof the probe uses existing SEO-authorized routes only;
- proof that no raw DB/storage access exists;
- proof that no publish or owner boundary is bypassed;
- proof that mutation mode is optional and bounded;
- unresolved questions if any.

## Stop Triggers
- the SEO surface cannot be determined with acceptable confidence;
- safe testing would require widening SEO permissions;
- the only feasible design is a broad raw admin/test backdoor;
- implementation would require raw DB/storage shell access;
- the support contour would bypass publish/review/role boundaries;
- the task expands into a broad QA platform or auth platform;
- the only way to test is to fake business behavior rather than inspect/support it narrowly.

## Minimal Sequencing Recommendation
1. Finish inventory and matrix.
2. Confirm the support contour can remain probe-only.
3. Implement the probe harness if safe.
4. Verify and stop.
5. Leave any broader QA tooling for a later slice.

## Recommended Execution Mode
`semi-autonomous with one mandatory design gate before implementation`

Reason:
- The SEO surface is already present in code, so discovery is feasible.
- The current production SEO fixture is inactive, so environment selection matters.
- A probe harness is likely sufficient, but mutation mode must be constrained carefully.
- One design gate prevents a harmless probe from becoming a general admin helper.
