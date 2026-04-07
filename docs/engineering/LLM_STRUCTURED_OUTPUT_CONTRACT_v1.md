# LLM_STRUCTURED_OUTPUT_CONTRACT_v1

## Purpose

This contract defines the default structured-output posture for `Экостройконтинент`.

Contract artifacts must be requested as structured output, normalized locally, and validated locally before they are allowed inward.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Structured artifact request posture, output normalization, schema-driven expectations, plain-text exception rules. | Provider catalog, transport routing, business validation, prompt library governance. | The factory can ask for declared artifact classes and declared schemas. | Raw freeform output as the primary path for contract artifacts, provider compliance as sole truth, silent schema drift. |

## Default posture

Structured output is the default path for contract artifacts.

The caller must declare:

- the artifact class
- the schema id
- the schema version
- the business context needed to populate the artifact

Provider-native structured output is preferred when available.

For Gemini 3 preview models, the adapter may set a minimal-thinking posture to keep the structured-output path deterministic for this baseline.

## Normalization boundary

Provider-native structured output is not the final truth boundary.

The canonical path is:

`provider response -> normalization -> local schema validation -> canonical artifact`

Provider compliance is not enough.

Local validation remains authoritative.

If the provider output cannot be normalized into the declared schema, the request fails.

## Current project artifact classes

| Artifact class | Purpose | Typical use |
|---|---|---|
| `landing_composition_candidate_spec` | Structured candidate/spec for the landing-first composition workspace | Landing draft creation and revision proposals |
| `service_landing_candidate_spec` | Structured candidate/spec for the adjacent service-mode workflow | Historical / route-specific service-page candidates |
| `structured_revision_proposal` | Proposed structured changes against an existing artifact | Reviewable updates before approval |
| `structured_explanation` | Structured rationale or explanation tied to a contract artifact | Human review support and decision support |
| `llm_diagnostic_probe` | Minimal infra diagnostic artifact for connectivity and SOCKS5 checks | Admin LLM test and transport test |

`landing_composition_candidate_spec` is the primary artifact class for the current workspace target.

`service_landing_candidate_spec` remains supported as an adjacent service-mode artifact for route-owning service-page truth, but it is no longer the primary workspace artifact.

These classes are the current minimum.

Additional classes require a contract update.

## Memory Card bridge

- A structured artifact may propose changes that affect Memory Card state.
- Such output is always a proposed delta, not a direct memory write.
- Provider compliance does not authorize mutation of Memory Card.
- A proposed delta becomes active only after local validation plus system or human acceptance.
- No dedicated memory-specific artifact class is introduced in v1; memory-affecting proposals reuse the existing structured-output path.
- The Memory Card prompt context contract defines how accepted deltas surface in future prompt assembly.

## Plain text rule

Plain text is allowed only when the caller explicitly asks for a human-facing explanation or other non-artifact output.

Plain text is not acceptable as the primary output path for contract artifacts.

Plain text must not be used as a fallback for a contract artifact request that should have been structured.

## Schema-driven expectations

Structured outputs are schema-first.

The schema must define:

- required fields
- optional fields
- enums and allowed values
- nested object shape
- provenance fields when needed
- versioning or compatibility markers when needed

Provider-specific JSON mode, tool-call mode, or equivalent mechanism is an adapter detail.

The contract only cares that the final normalized result matches the declared schema.

## Local validation boundary

Local validation is mandatory after normalization.

The local validator is the final authority on whether the artifact is accepted inward.

Validation failures are not provider failures.

Validation failures are contract failures.

## Explicit exclusions

- deep generic schema framework design
- provider comparison paper
- broad prompt serialization spec
- agent memory design
- public AI content delivery

