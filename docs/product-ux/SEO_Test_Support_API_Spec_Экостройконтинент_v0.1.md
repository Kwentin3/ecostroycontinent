# SEO Test Support API Spec

## Purpose
Определить минимальный bounded operator/test-support contour, который позволит агенту детерминированно тестировать реальный SEO surface без расширения business permissions и без появления скрытого admin backdoor.

## Scope
Этот документ покрывает:
- minimal internal probe interface;
- route- and selector-level testing support;
- read-only inspection by default;
- optional explicit mutation for scratch setup in stage/dev only;
- failure and stop behavior for the probe.

Он не покрывает:
- production business API;
- broad QA platform;
- raw DB/storage shell;
- hidden privileged operator surface;
- SEO dashboard product features.

## Canon Assumptions
- SEO role already exists in the product model.
- SEO can edit drafts, submit for review, inspect review and history, and upload media.
- SEO cannot publish.
- `Approval != Publish`.
- Current prod SEO user is inactive, so the default probe target is stage/dev or a disposable test fixture.
- No new privileged runtime surface should be added if existing routes and semantic HTML can be probed safely.

## Design Choice
The minimal support layer is a `probe`-style operator interface, not a new production endpoint.

Reason:
- The current UI is already semantically rich.
- Existing SEO routes are enough to test business behavior.
- A probe script or probe module keeps the support surface internal and auditable.
- No new auth privilege is required to observe the SEO surface.

## Minimal Interface Shape

### Operation Contract Template
| Field | Value / rule |
| --- | --- |
| contract_id | `seo_surface_probe_v0.1`
| operation_name | `probe_seo_surface`
| version | `0.1`
| owning_domain | `admin/test-support`
| agent_invokable | yes, but only within delegated stage/dev test scope
| production_safe | read-only probe only; mutation path must remain explicit and optional
| default_mode | `inspect`

### Domain Meaning
This operation observes the actual SEO role surface and, when explicitly enabled, exercises narrow SEO-authorized write paths through normal business routes.

It does:
- log in as SEO using existing auth;
- inspect SEO-visible pages and actions;
- verify positive and negative role boundaries;
- optionally create scratch draft state through normal SEO routes only;
- output a structured capability and gap report.

It does not:
- create new authority;
- bypass publish/review boundaries;
- bypass role checks;
- write to raw DB or raw storage;
- expose secrets;
- use a hidden admin API to fake the product.

### Allowed Initiators
- internal agent working on behalf of a human operator;
- developer/operator running the probe locally or in stage;
- CI if explicitly pointed at a safe disposable environment.

### Delegation Requirements
- explicit operator request or task assignment;
- explicit scope boundary for SEO testing;
- explicit environment boundary;
- explicit stop if fixture is missing.

### Preconditions
- `APP_BASE_URL` is set;
- SEO credentials are available for the target environment;
- the target environment is stage/dev or an approved test fixture if mutation is requested;
- no raw DB/storage access is being used;
- the probe has an explicit stop path for inactive SEO fixtures.

### Input Contract
| Input | Rule |
| --- | --- |
| `baseUrl` | required, canonical admin origin
| `username` | required, SEO fixture username reference
| `password` | required, SEO fixture password reference
| `mutate` | optional boolean, default `false`
| `targetRoutes` | optional allowlisted route list
| `scratchPrefix` | optional string for test fixture naming, stage/dev only
| `timeoutMs` | optional bounded timeout

### Prohibited Inputs
- raw DB credentials;
- storage access keys;
- publish tokens;
- arbitrary shell commands;
- free-form role escalation;
- unbounded route crawling;
- any input that would let the probe perform an action SEO could not normally do.

### Execution Semantics
- Default mode is read-only inspection.
- Route checks must be performed through normal authenticated HTTP requests.
- Mutation mode may only call existing SEO-authorized business routes.
- Mutation mode must never call publish, owner approval, rollback, user management, or raw infra paths.
- No direct database mutation is allowed.

### Output Contract
The probe returns a structured report with these top-level sections:
- `auth`
- `visibleRoutes`
- `allowedActions`
- `forbiddenRoutes`
- `entitySurface`
- `reviewSurface`
- `mediaSurface`
- `gaps`
- `residualRisks`
- `mutations` if `mutate=true`

### Failure Semantics
| Failure class | Machine-level code | Human-readable meaning | Retry policy |
| --- | --- | --- | --- |
| login failure | `AUTH_FAILED` | SEO fixture not available or credentials invalid | retry only after fixture correction
| route denied | `FORBIDDEN_BY_ROLE` | expected negative boundary observed | do not retry as a test failure
| route missing | `ROUTE_UNAVAILABLE` | probe target absent from current runtime | stop and record gap
| mutation blocked | `WRITE_PATH_BLOCKED` | existing permissions or readiness prevented action | stop unless scope explicitly includes fix
| unexpected publish path | `CANON_DRIFT` | a write path crossed into publish semantics | stop immediately
| secret leakage | `SECRET_LEAK` | probe output would expose secret material | stop immediately
| ambiguous target | `AMBIGUOUS_TARGET` | probe cannot identify the intended SEO fixture | stop and ask for explicit target

### Audit And Trace Expectations
- report a probe trace id;
- redact all secret material;
- never print passwords, tokens, or session cookies;
- log only route names, response classes, and redacted outcomes;
- keep a human-readable summary and a machine-readable JSON payload.

### Stop Conditions
- if the probe would need a weaker security posture to work;
- if a route can only be tested through a hidden backdoor;
- if mutation would require broadening SEO permissions;
- if the environment has no valid SEO fixture and no approved stage/dev substitute;
- if a test would cross publish or owner boundaries;
- if the probe starts to look like a general purpose admin operator.

## Selector And Hook Position
- MVP does not require a new hidden backend API.
- The current UI is semantic enough to be probed with routes and labels.
- Stable `data-testid` hooks are optional future hardening, not a prerequisite for this slice.
- If the team later finds browser automation brittle, selector hooks may be added as non-semantic test-only affordances, but only as narrow UI support, not as product logic.

## Representative Probe Operations
| Probe family | What it covers | Safety posture |
| --- | --- | --- |
| `probe_auth` | login/logout/session | read-only
| `probe_dashboard` | admin dashboard sections and navigation | read-only
| `probe_entity_surface` | list and editor pages for SEO entity types | read-only unless explicit mutate mode
| `probe_review_surface` | review queue, detail, owner boundary | read-only
| `probe_media_surface` | upload and media relation flows | explicit SEO-authorized business route only
| `probe_negative_boundaries` | users, publish, owner-action, rollback | read-only

## Why This Does Not Widen Business Semantics
- The probe does not add new powers.
- It only exercises powers already granted to SEO by the business model.
- It does not bypass publish or owner boundaries.
- It does not introduce a hidden operational surface for production operators.
- It is intentionally internal and bounded by environment and delegation.

## Open Questions
- Should mutation mode be enabled only on stage/dev or also on a dedicated disposable test database?
- Do we want a future selector registry with `data-testid` hooks, or is the current semantic markup sufficient indefinitely?
- Should the probe be exposed as a package script, a standalone CLI, or both?

## Decisions Not Reopened By Default
- No raw DB shell.
- No raw storage shell.
- No hidden SEO admin endpoint.
- No publish bypass.
- No role widening.
- No broad QA platform.
