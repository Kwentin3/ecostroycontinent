# MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1

## Purpose

This contract defines how Memory Card participates in prompt assembly for the AI-assisted service landing workspace. It keeps prompt context compact, session-scoped, and derived from canonical inputs plus the active working state.

## Assembly Principle

- Prompt context is assembled from Memory Card plus canonical inputs.
- Prompt assembler reads Memory Card and does not write it.
- Prompt context is derived per request.
- Memory Card is not itself the prompt.
- Raw chat history is not the default memory model.
- Canonical revision and publish truth remain authoritative outside the prompt layer.
- Any candidate/spec pointer is resolved into a derived prompt-safe slice before assembly.
- Memory-affecting outputs are produced through the structured-output contract and surface here only as accepted deltas.
- Accepted memory deltas can affect future prompt context only after system or human acceptance.
- Rejected or unaccepted deltas must not silently enter Memory Card.

## Always-in Fields

These fields should be present in prompt assembly for the service landing workspace unless the workspace is empty or unavailable:

| Field | Why it is always in |
|---|---|
| Session identity | Anchors the active run to one workspace session, actor, entity, and route family. |
| Editorial intent | Carries the current goal and change intent for the run. |
| Artifact state | Carries the prompt-safe artifact slice: candidate id, spec version, preview mode, verification summary, and section projection summary when available. |
| Active blockers | Prevents the prompt from forgetting why the current run is blocked or paused. |

At minimum, the artifact-state slice must include the current spec version and the current verification summary.

## Conditional Fields

- Proof selection when present
- Accepted decisions when present
- Rejected directions when present, as a negative constraint

Relevance is determined by the prompt assembler based on whether the field was updated in the current session.

## Recent-Turn Slice

The recent-turn slice should carry only a compact outcome summary object with named slots:

- `last_change`
- `last_rejection`
- `last_blocker`
- `generation_outcome`

It must not include the full chat dump or the full trace.

## Never-In List

The prompt assembler must not pull the following into the assembled prompt context:

- raw audit trail
- full revision history
- canonical fields not selected for the current run
- other sessions
- raw provider payloads
- LLM-proposed deltas that were not accepted
- transport internals
- provider internals

## Assembly Order

Default order for prompt assembly:

1. Identity
2. Intent
3. Artifact state
4. Proof selection
5. Editorial decisions
6. Recent trace / outcome slice

This order keeps the prompt anchored to the active run before it adds evidence, decisions, and the latest outcome.

## Derived-Only Boundary

- The prompt assembler reads Memory Card.
- The prompt assembler does not mutate canonical truth.
- Prompt context remains derived.
- Provider chat state is not canonical memory.
- Any accepted delta becomes state only through the system or human workflow, not through raw provider output.

## Minimal Runtime Usage Note

This contract exists to support API-based multi-turn continuity without full chat-history bloat. It should let the admin workspace re-enter a run, preserve the important working context, and keep prompt assembly stable while still deferring all canonical truth to the content and revision model.


