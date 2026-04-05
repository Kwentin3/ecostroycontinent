# LLM_TRANSPORT_AND_SOCKS5_CONTRACT_v1

## Purpose

This contract defines the outbound transport boundary for LLM requests in `Экостройконтинент`.

SOCKS5 is a transport concern, not a provider concern and not a business concern.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Transport execution, proxy routing, timeout and retry posture, network error normalization. | Provider request formats, prompt content, structured output policy, business validation, agent orchestration. | The factory already decides what artifact is needed and which provider/model is active. | Transport leakage into business code, proxy logic inside provider adapters, provider-specific networking in callers. |

## Transport role

The transport layer is responsible for executing outbound LLM HTTP traffic with the configured proxy and network policy.

It must own:

- proxy routing
- request timeout policy
- bounded retry policy for transport-class failures
- connection lifecycle handling
- network failure normalization

## SOCKS5 placement

All outbound LLM traffic must pass through the transport layer.

When SOCKS5 is enabled, it lives in the transport layer configuration and execution path.

Provider adapters consume a transport handle or transport service.

Provider adapters do not:

- open sockets directly
- assemble proxy URLs
- decide whether SOCKS5 is enabled
- implement their own proxy stack

## Configuration posture

Transport configuration is runtime-driven and outside business logic.

Typical transport config responsibilities include:

- proxy enabled or disabled
- proxy endpoint and credentials, if any
- connect and read timeout ceilings
- transport retry ceiling
- streaming enabled or disabled per request mode

Changing proxy placement or timeout ceilings should not require business code changes.

Changing the transport implementation should not require rewrites in domain callers.

## Runtime configuration posture

A typical initial transport config may use:

- `LLM_SOCKS5_ENABLED=true`
- `LLM_SOCKS5_HOST=127.0.0.1`
- `LLM_SOCKS5_PORT=1080`
- `LLM_SOCKS5_USERNAME=...`
- `LLM_SOCKS5_PASSWORD=...`

These settings belong to transport configuration, not to provider adapters or business code.

## Error boundary

Transport-class failures include:

- DNS failures
- connect failures
- TLS handshake failures
- proxy handshake failures
- socket timeout
- interrupted stream

Transport errors are normalized at the transport boundary and surfaced upward as transport-class errors.

Higher layers must not inspect socket objects or low-level network internals.

## Adapter consumption rule

Provider adapters may request an execution mode such as standard or streaming.

Provider adapters may not own the transport policy itself.

Any retry loop that belongs to the transport layer must stay there, not in business code or provider adapters.

## Explicit exclusions

- general networking architecture for the whole app
- infra deployment guide
- proxy operations runbook
- provider benchmark policy
- broad observability design
