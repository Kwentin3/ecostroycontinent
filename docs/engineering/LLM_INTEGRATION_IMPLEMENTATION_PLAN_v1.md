# LLM_INTEGRATION_IMPLEMENTATION_PLAN_v1

> Deprecated precursor. The canonical baseline plan is [LLM_INFRA_IMPLEMENTATION_PLAN_v1.md](./LLM_INFRA_IMPLEMENTATION_PLAN_v1.md).

## Objective

Implement the foundational LLM infrastructure needed to support structured artifact generation for the landing factory without exposing provider or transport details to business code.

The outcome should be a narrow internal LLM baseline, not a broad AI platform.

## Assumptions

- There is not yet a connected runtime LLM baseline.
- Authenticated SOCKS5 is required for outbound LLM traffic.
- A practical initial provider/model posture may be `gemini` with `gemini-2.5-flash` behind that transport boundary.
- AI remains assistive only and does not own truth or publish.
- The landing factory will consume structured artifacts, not raw text.
- The current project does not need multi-agent orchestration or memory to complete the first rollout.

## Workstreams

| Workstream | Owns | Depends on |
|---|---|---|
| Contract lock | Finalize the five engineering docs in this cluster. | Product posture and runtime honesty. |
| Factory baseline | Build the internal LLM facade and provider/model resolution posture. | Factory contract. |
| Transport baseline | Wire the outbound transport path and SOCKS5 routing. | Transport contract. |
| Structured output baseline | Normalize provider output into declared artifact schemas. | Structured output contract. |
| Error/result baseline | Surface a stable inward-facing result envelope. | Error/result contract. |
| Landing factory integration | Consume structured artifacts from the LLM baseline. | All prior workstreams. |
| Hardening | Verify retry, failure, and local validation behavior against real inputs. | Working baseline. |

## Ordered phases

### Phase 0 - contract lock

- Freeze the five docs.
- Freeze the structured-output default posture.
- Freeze the SOCKS5 transport boundary.

### Phase 1 - factory and transport skeleton

- Create the internal LLM facade.
- Add provider/model resolution by config.
- Route all outbound LLM traffic through the transport boundary.

### Phase 2 - structured output and validation

- Add schema-driven structured output requests.
- Normalize provider responses.
- Run mandatory local schema validation before the result is returned inward.

### Phase 3 - result boundary and error shaping

- Normalize errors into the canonical result envelope.
- Keep retryability explicit.
- Keep provider/network details out of business-facing callers.

### Phase 4 - landing-factory integration

- Connect the service-first landing factory to structured artifact generation.
- Ensure the landing factory asks for artifacts, not raw text.
- Confirm that the landing factory can consume failure and retry signals cleanly.

### Phase 5 - limited hardening

- Validate behavior with real service candidate/spec artifacts.
- Check that provider fallback or config changes do not leak into business code.
- Verify that transport changes do not require landing-factory rewrites.

## Critical dependencies

- A chosen active provider/model set in runtime configuration.
- A transport configuration that supports authenticated SOCKS5.
- A local schema validator for structured artifacts.
- The service-first landing-factory contracts that define the artifact classes.

## Exit criteria

- Business code can request an LLM artifact without knowing provider or transport details.
- The outbound path uses authenticated SOCKS5 when configured.
- Structured output is the default path for artifact requests.
- Local validation is mandatory before a result is returned inward.
- The result envelope is stable and safe for business code.
- The landing factory can consume service candidate/spec artifacts through this baseline.

## Deferred items

- Multi-agent orchestration
- Long-term memory
- Public AI surfaces
- Broad observability platform design
- Provider benchmark framework
- Provider load balancing beyond a simple active-provider selection posture
- Advanced streaming semantics unless a later contract requires them
- Prompt library governance

## What landing-factory implementation must wait for

- The factory contract must be locked.
- Authenticated SOCKS5 transport must be defined and wired.
- Structured output normalization must exist.
- Local validation must sit after normalization.
- The canonical result envelope must be stable.

Only after those seams exist should landing-factory code consume LLM artifacts.
