# LLM_INFRA_DOMAIN_MAP_v1

## Purpose

This cluster defines the minimum engineering canon for safe LLM integration in `Экостройконтинент`.

It exists to keep provider choice, transport, structured output, and local validation out of business code while still giving the landing factory a stable way to request structured artifacts.

## Why this is the minimum sufficient set

The current project posture already accepts a minimal LLM factory, no provider-specific hardcode in business logic, and SOCKS5 routing for outbound LLM traffic.

To implement that posture safely, we need exactly these seams:

- one factory contract for caller posture and provider/model resolution
- one transport contract for SOCKS5 and network boundaries
- one structured output contract for artifact generation and normalization
- one error/result boundary contract for stable inward-facing results
- one implementation plan to sequence the work, including admin diagnostics

Anything broader would drift into prompt library design, agent orchestration, memory, observability platform design, a provider catalog, or a generic admin playground.

No separate config document is required because config posture is owned directly by the factory and transport contracts.

## Placement

These docs live under `docs/engineering/` because they are implementation-oriented contracts.

Product posture stays in `docs/product-ux/`.

## Read order

1. `LLM_FACTORY_CONTRACT_v1.md`
2. `LLM_TRANSPORT_AND_SOCKS5_CONTRACT_v1.md`
3. `LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
4. `LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`
5. `LLM_INFRA_IMPLEMENTATION_PLAN_v1.md`

## Dependency order

- Factory contract sets the caller posture and provider/model resolution rules.
- Transport contract defines how outbound traffic is routed and bounded.
- Structured output contract defines how artifacts are requested and normalized.
- Error/result contract defines the stable envelope returned inward.
- Implementation plan depends on all of the above and does not add new scope.
- The earlier `LLM_INTEGRATION_IMPLEMENTATION_PLAN_v1.md` is a precursor and is not the current canonical implementation plan.

## Product and engineering inputs

| Type | Documents | Role |
|---|---|---|
| Product inputs | `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`, `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`, `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md` | Establish the landing-first composition workspace posture, SOCKS5 requirement, AI assistive-only boundary, and runtime honesty. |
| Adjacent session-state input | `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`, `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md` | Define session-scoped working state that prompt assembly can consume before calling the factory; LLM infra may emit structured outputs that propose memory-affecting deltas, but it does not own session memory or provider chat state. |
| Engineering inputs | The landing-first composition contract pack, with the service-mode pack retained as adjacent / historical | Define the structured artifacts the landing workspace will request from the LLM infra. |
| Engineering outputs | The 5 docs in this cluster | Define the infrastructure canon that the landing factory implementation must use. |

## What this domain unblocks for the landing-factory rollout

- Structured landing composition candidate generation instead of raw text prompts.
- Local schema validation of generated artifacts before review or publish.
- Deterministic transport posture through a single LLM facade and SOCKS5 routing.
- Config-driven initial posture via `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3-flash-preview`, and authenticated SOCKS5 host/port/user/pass settings in `.env`.
- Stable error handling so landing-factory code can reason about retryable vs non-retryable outcomes.
- A clean boundary between business logic and provider/network details.

## Explicitly outside this domain

- Multi-agent orchestration
- Agent tool invocation contracts
- Long-term memory systems
- Public AI chat or public AI tools
- Prompt library governance
- Model evaluation framework
- Broad observability platform spec
- Provider feature matrix or provider benchmark program
- Landing business logic
- CMS redesign
- Publish workflow redesign

## Intentionally deferred topics

- Provider load balancing beyond a single active-provider selection posture
- Advanced streaming semantics unless needed by a specific future contract
- Tool-calling frameworks not required for structured artifact generation
- Memory or retrieval layers
- Session-scoped Memory Card ownership
- Wider AI assistant surfaces beyond the landing factory use case


