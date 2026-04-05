# LLM_INFRA_IMPLEMENTATION_PLAN_v1

## Objective

Implement the minimum LLM infrastructure baseline for `Экостройконтинент` so that business code can request structured artifacts through one internal facade without knowing provider APIs, network details, or SOCKS5 configuration.

This baseline is required before any landing-factory work can safely use LLM assistance.

This plan also adds admin-only diagnostics for:

- LLM connectivity test
- SOCKS5 transport test

This plan does not implement landing generation, a public AI surface, memory, agents, or a broad observability platform.

This plan supersedes `LLM_INTEGRATION_IMPLEMENTATION_PLAN_v1.md` for the baseline because diagnostics are now part of the required implementation scope.

## Assumptions

- There is no active full LLM runtime baseline yet.
- Server runtime env is the source of truth for provider, model, and SOCKS5 credentials.
- The app config loader must be extended to parse the LLM env fields.
- Outbound LLM traffic must go through authenticated SOCKS5.
- Admin console can host internal diagnostics.
- Future landing-factory usage depends on structured artifacts and the error/result boundary already documented in the LLM infra pack.
- The first diagnostics rollout must be restricted to `superadmin`.
- `gemini` with `gemini-3-flash-preview` is the initial provider/model posture, not a platform commitment.

## Implementation Workstreams

| Workstream | Owns | Depends on | Does not own |
|---|---|---|---|
| LLM facade and provider resolution | Internal entrypoint, config-driven provider/model selection, caller-facing result envelope. | Config schema extension, error/result contract. | Transport setup, prompt libraries, business validation, admin UX. |
| Provider adapter wiring | Provider-specific request/response translation and capability checks. | Facade contract, transport handle, chosen provider/model. | SOCKS5 policy, business logic, content truth, publish flow. |
| Transport + SOCKS5 | Outbound transport path, proxy config, timeout/retry posture, network error normalization. | Server env, config loader, adapter interface. | Provider request format, business rules, structured artifact semantics. |
| Structured output + local validation boundary | Structured output request posture, normalization, local schema validation after provider response. | Facade, provider adapter, artifact schema. | Publish logic, admin routing, public rendering. |
| Admin diagnostics | Internal diagnostics page or page section, LLM test, SOCKS5 transport test, readable result presentation. | Facade, transport, structured output, admin auth. | Content mutation, publish, public AI tools, playground behavior. |
| Integration hardening / QA | Failure-class coverage, smoke checks, regression checks, redaction discipline. | All prior workstreams. | New product scope, broader observability, model benchmarking program. |

## Ordered Phases

### Phase 0 - contract lock and runtime grounding

Purpose:

- lock the runtime-facing env names
- lock the result and error boundaries
- lock the admin diagnostics expectations
- confirm the first rollout is superadmin-only

Key outputs:

- agreed LLM env contract for server runtime and local example env:
  - `LLM_PROVIDER`
  - `LLM_MODEL`
  - `LLM_GEMINI_API_KEY`
  - `LLM_GEMINI_BASE_URL`
  - `LLM_SOCKS5_ENABLED`
  - `LLM_SOCKS5_HOST`
  - `LLM_SOCKS5_PORT`
  - `LLM_SOCKS5_USERNAME`
  - `LLM_SOCKS5_PASSWORD`
- app config schema update plan for LLM fields
- diagnostics result shape and failure classes
- explicit access rule for diagnostics
- diagnostic artifact class contract (`llm_diagnostic_probe`)

Dependencies:

- existing LLM infra contract docs
- existing landing-factory contract docs
- current admin auth model

Exit condition:

- the baseline has a fixed set of config keys, result classes, and diagnostics behaviors

### Phase 1 - facade, provider, and transport skeleton

Purpose:

- create one internal LLM facade
- resolve provider and model from config
- route outbound requests through authenticated SOCKS5

Key outputs:

- internal LLM entrypoint
- provider adapter boundary
- transport boundary with proxy support
- normalized transport and provider errors

Dependencies:

- server env values for provider and SOCKS5
- config loader extension
- provider credentials
- selected initial provider/model posture

Exit condition:

- a minimal LLM call can leave the app through authenticated SOCKS5 and return a canonical inward-facing result envelope

### Phase 2 - structured output and local validation

Purpose:

- make structured output the default path for contract artifacts
- enforce local validation after provider response normalization

Key outputs:

- minimal structured output request shape
- response normalization step
- local validation step
- failure path for provider-compliant but locally invalid output

Dependencies:

- phase 1 baseline
- schema for the minimal test artifact
- structured output contract

Exit condition:

- a minimal structured artifact can be requested, normalized, validated, and returned inward

### Phase 3 - admin diagnostics

Purpose:

- add internal admin tools that prove the baseline works
- separate transport failures from provider failures and validation failures

Key outputs:

- admin LLM test
- admin SOCKS5 transport test
- concise result display with redaction

Dependencies:

- phases 1 and 2
- admin route wiring
- superadmin access guard

Exit condition:

- an admin user can run both diagnostics and read a stable, non-secret result summary

### Phase 4 - landing-factory readiness

Purpose:

- prove the baseline is ready for the service-first landing factory to consume structured artifacts

Key outputs:

- landing-factory code can request artifacts from the facade
- landing-factory code does not know provider or SOCKS5 details

Dependencies:

- phases 1 through 3
- landing-factory service contract pack

Exit condition:

- the landing-factory implementation can start against the stable LLM baseline

## Admin Diagnostics Design Intent

The admin diagnostics surface must stay internal and narrow.

Recommended shape:

- one admin-only page inside the existing admin console
- two action panels on that page, one for `LLM Test` and one for `SOCKS5 Transport Test`
- no chat UI
- no prompt lab
- no content publishing action

Access:

- first rollout must be `superadmin` only
- diagnostics are engineering tools, not public product features

### LLM Test

Purpose:

- verify provider config is valid
- verify the model call can complete
- verify structured output can return a minimal valid artifact
- verify local validation runs after provider response
- verify stable internal errors are visible when something fails

Behavior:

- sends a minimal internal structured-output request through the facade
- expects a tiny `llm_diagnostic_probe` artifact that passes the same local validation boundary as real artifacts
- does not mutate content truth
- does not publish anything

Minimum result display:

- effective provider
- effective model
- whether SOCKS5 was used
- diagnostic artifact class
- provider result
- structured output result
- local validation result
- human-readable summary

### SOCKS5 Transport Test

Purpose:

- verify outbound LLM traffic can traverse the configured SOCKS5 path
- distinguish transport-layer failure from provider-layer failure
- use the same internal facade so the test remains end-to-end
- surface proxy unreachable, auth/config failure, connect timeout, provider unreachable through proxy, and provider-response failure classes

Behavior:

- uses the same internal LLM facade and transport boundary
- keeps the result diagnostic only
- does not mutate content truth
- does not publish anything

Minimum result display:

- effective provider
- effective model
- whether SOCKS5 was used
- diagnostic artifact class if the request reached structured-output mode
- transport result
- provider result
- structured output result if the request reached that layer
- local validation result if the request reached that layer
- human-readable summary

### Allowed exposure

Diagnostics may show:

- transport class
- provider class
- structured output class
- local validation class
- retryable or non-retryable flag
- trace or request id
- human-readable explanation of where the failure happened

Diagnostics must not show:

- proxy credentials
- provider secrets
- raw request payloads
- raw provider payloads
- socket internals
- content truth mutations

## Result Boundaries

The baseline must keep one canonical inward-facing result envelope.

Required result classes:

- transport success or failure
- provider success or failure
- structured output success or failure
- local validation success or failure

Successful inward-facing result should include:

- status
- normalized artifact when successful
- retryable flag
- provider id
- model id
- transport used flag or equivalent transport summary
- validation state
- trace or request correlation id
- human-readable summary

Failure handling:

- transport failures are surfaced as transport-class failures
- provider failures are surfaced as provider-class failures
- structured output failures are surfaced when provider output cannot be normalized into the declared contract
- local validation failures are surfaced when the normalized artifact does not satisfy local schema or domain rules

Business code must not need raw provider objects, socket objects, or proxy details.

## Critical Dependencies

- server runtime env must include the LLM provider and SOCKS5 fields
- app config loader must parse those fields
- the deployment path that injects server env must carry the same keys
- provider credentials must be available in the server runtime
- authenticated SOCKS5 endpoint must be reachable from the runtime host
- provider capability must support the chosen structured-output posture
- a minimal schema must exist for the diagnostic structured-output request
- admin console route wiring must exist for the diagnostics page
- superadmin guard must be available for the first rollout

## Exit Criteria

- one internal LLM facade path exists
- provider selection is config-driven
- provider adapter boundary exists
- transport supports authenticated SOCKS5
- structured output is the default path for artifact requests
- local validation runs after provider response
- admin LLM test works
- admin SOCKS5 transport test works
- diagnostics distinguish transport, provider, structured output, and validation failures
- changing the active model in config does not require business code changes
- no business module needs to know provider or transport details
- no diagnostics action mutates content truth or publishes content

## Deferred Items

Explicitly deferred from this baseline:

- landing candidate generation itself
- landing publish workflow changes
- prompt library expansion
- multi-provider fallback orchestration
- model benchmarking program
- memory systems
- multi-agent orchestration
- public AI surfaces
- broad observability platform
- generic AI playground or prompt lab
- broader route support outside the service-first landing-factory scope
