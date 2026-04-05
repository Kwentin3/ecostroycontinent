# LLM_FACTORY_CONTRACT_v1

## Purpose

This contract defines the canonical internal entrypoint for all non-UI LLM usage in `Экостройконтинент`.

Business code asks the factory for a structured artifact or explanation. It does not talk to providers directly.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Internal LLM entrypoint posture, provider factory role, adapter role, provider/model resolution, caller-visible capability posture, inward-facing result envelope. | Transport details, provider request formats, prompt library governance, agent orchestration, business validation rules. | The current project needs provider abstraction, model selection by config, and SOCKS5 routing for outbound LLM traffic. | Provider-specific hardcoding in business logic, transport leakage, raw-text-first artifact generation. |

## Caller posture

The rest of the codebase is allowed to ask for an LLM result by declaring:

- the artifact class or explanation class it needs
- the schema or contract id it expects
- the business context required to produce that artifact
- optional capability hints, if the caller has a real need

The rest of the codebase is not allowed to know:

- provider-specific request shapes
- transport or proxy details
- auth mechanics
- retry policy internals
- provider message formatting
- raw response object structure

## Factory role

The factory is the internal resolver and orchestrator between business callers and provider adapters.

It selects the active provider and model from runtime configuration and capability rules.

The provider can change without rewriting business callers.

It returns a canonical inward-facing result envelope, not a provider-native response object.

## Provider adapter role

Provider adapters translate the factory request into provider-specific API calls and translate provider responses back into the normalized internal envelope.

Adapters may know provider API details.

Adapters may not know business rules, landing-factory semantics, or transport proxy configuration.

## Active provider and model resolution

Provider and model selection is configuration-driven.

Resolution should follow these principles:

- the active provider is selected outside business code
- the active model is selected by config and capability fit
- structured-output-capable models are preferred for artifact paths
- if the requested artifact requires structured output and the selected model cannot support it, the request fails before any business artifact is returned

This is a selection posture, not a provider catalog.

## Runtime configuration posture

A typical initial runtime posture may use:

- `LLM_PROVIDER=gemini`
- `LLM_MODEL=gemini-2.5-flash`
- `LLM_GEMINI_API_KEY=...`
- `LLM_GEMINI_BASE_URL=...` when a deployment needs a provider endpoint override

The factory consumes provider and model settings.

It does not consume SOCKS5 settings directly.

## Structured output capability posture

Structured output is the default posture for contract-artifact paths.

The factory must expose a structured-output-required mode for artifact generation.

Plain text may only be used for explicit human-facing explanation or other non-artifact requests.

Plain text is not the primary path for contract artifacts.

## What the factory returns inward

The factory returns a canonical result envelope defined by the error/result contract.

The envelope must carry:

- success or failure status
- normalized artifact when successful
- canonical error when failed
- retryable flag
- trace or request correlation id
- provider and model diagnostics only as metadata

The envelope must not expose raw provider chaos as the primary interface.

## Explicit exclusions

- provider catalog documentation
- broad AI SDK design
- prompt template governance
- multi-agent orchestration
- memory systems
- autonomous publish behavior
