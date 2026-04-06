# MEMORY_CARD_DOMAIN_DESIGN_V1

## Summary

The narrow Memory Card domain has been designed and documented as a session-scoped working-state layer for the AI-assisted service landing workspace.

## What Was Created

- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`

## What Was Updated

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`

Refined after reviewer feedback:

- the Memory Card scope boundary now uses simple lists instead of a dense table
- artifact state now resolves a pointer into a derived prompt-safe slice before assembly
- lifecycle now states that reopen from archive pointer creates a new session
- the prompt contract now names the recent-turn slots explicitly
- derived snapshot semantics are now explicit and non-ambiguous

## What Was Intentionally Excluded

- Long-term user memory
- Vector retrieval or memory platform design
- Org-wide memory graph
- Public AI memory
- Any code implementation
- Any new product PRD for memory
- Any third memory engineering document

## Sufficiency Check

The 2-doc pack was sufficient.

The domain map carries the boundary, shelves, ownership, lifecycle, drift risks, and cross-domain relations. The prompt context contract carries the assembly principle, always-in fields, conditional fields, never-in list, order, and derived-only boundary.

## Residual Ambiguity

The only intentionally deferred question is runtime storage mechanics for session persistence. That is an implementation concern, not a missing domain contract.

The prompt-listed context-pack filenames were not present under those exact names in the workspace, so the design was grounded in the closest available canon docs and the current service landing code path.

## Next Smallest Safe Step

Use the new Memory Card contracts as the basis for any implementation work on prompt assembly or session rehydration, without expanding the scope into long-term memory or a broader AI platform.

