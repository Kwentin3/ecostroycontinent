# LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1

## Purpose

This contract defines the canonical inward-facing result shape for LLM calls in `Экостройконтинент`.

Business code should receive a stable result envelope, not raw provider chaos.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Result envelope shape, error classes, retryable posture, what business callers can see. | App-wide exception taxonomy, observability platform, provider internals, transport internals. | The factory, transport, and structured-output contracts already exist. | Throwing raw provider errors into business code, hiding retryability, collapsing all failures into one generic error. |

## Canonical result envelope

| Field | Required | Notes |
|---|---|---|
| `status` | Yes | `success` or `failure`. |
| `artifact` | No | Present only on success, after local validation passes. |
| `error` | No | Present only on failure, using the canonical error shape. |
| `retryable` | Yes | Stable business-facing retry hint. |
| `traceId` | Yes | Correlation for logs and debugging. |
| `requestId` | No | Optional provider or factory correlation. |
| `providerId` | No | Diagnostic metadata only. |
| `modelId` | No | Diagnostic metadata only. |
| `contractId` | Yes | Declared schema or artifact contract id. |
| `validationState` | Yes | `not_checked`, `passed`, or `failed`. |

Business code may branch on `status` and `retryable`.

Business code must not branch on provider-specific transport details.

## Error classes

| Error class | Layer | Retryable posture | Notes |
|---|---|---|---|
| `factory_resolution_error` | Factory | Usually no | Missing config, no eligible provider/model, unsupported capability. |
| `transport_error` | Transport | Often yes | Proxy, timeout, socket, TLS, network failures. |
| `provider_error` | Provider | Mixed | Quota, auth, rate limit, upstream error, provider rejection. |
| `structured_output_error` | Structured output | Mixed | Invalid shape, parse failure, wrapper mismatch, schema mismatch before local validation. |
| `local_validation_error` | Local validation | No for current artifact | Declared schema or domain validation failed after normalization. |

## Failure boundary

- Transport failure means the request did not complete cleanly at the network layer.
- Provider failure means the provider responded but did not complete the request successfully.
- Structured-output failure means the provider response could not be normalized into the declared contract.
- Local-validation failure means the normalized artifact does not satisfy the contract or the local schema.

These are not interchangeable.

## Retryable vs non-retryable

- `transport_error` is retryable when the failure is transient.
- `provider_error` is retryable only when the upstream condition is transient, such as rate limiting or temporary upstream unavailability.
- `structured_output_error` is retryable only when a reattempt with the same contract could reasonably succeed.
- `local_validation_error` is not retryable for the current artifact.
- `factory_resolution_error` is not retryable until config or capability selection changes.

## What business callers are allowed to see

Business callers may see:

- canonical status
- safe error class
- safe human-readable summary
- retryable flag
- contract id
- minimal diagnostic ids

Business callers must not see:

- raw provider stack traces
- socket objects
- proxy credentials
- provider internal request payloads
- unnormalized provider response blobs as the primary result

## Explicit exclusions

- broad exception taxonomy for the whole system
- app-wide logging standard
- observability platform
- public-facing error UX spec

