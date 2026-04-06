# MEMORY_CARD_STRUCTURED_OUTPUT_STITCHING_V1

## Scope Of Stitching

This is a narrow documentation-only refinement to align the Memory Card domain with the existing structured-output canon.

It keeps Memory Card session-scoped, mutable, and downstream of canonical truth. It does not add code, does not create a memory platform, and does not expand the artifact taxonomy.

## Docs Changed

- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`

The existing landing-factory PRD Memory Card note remained compatible and did not need a new expansion in this stitch.

## Bridge Rule Added

The canon now says:

- any structured output that affects Memory Card is only a proposed delta
- LLM never writes directly to Memory Card
- provider compliance does not authorize mutation of Memory Card
- a delta becomes active only after local validation plus system or human acceptance
- rejected or unaccepted deltas do not silently enter Memory Card
- the prompt context contract and structured-output contract now point at each other for this bridge

## Optional Output Class Decision

No new optional memory-specific output class was introduced.

The minimum sufficient approach was to reuse the existing structured-output path and define memory-affecting outputs as proposed deltas at the workflow boundary.

## What Was Intentionally Not Expanded

- no long-term memory design
- no vector retrieval layer
- no org-wide memory graph
- no new product PRD
- no new standalone memory artifact taxonomy
- no prompt-governance rewrite
- no code implementation

## Decision Bar

1. Is the canon now explicit that Memory Card is never directly writable by LLM? Yes.
2. Is the canon now explicit about proposed delta semantics? Yes.
3. Did we avoid creating unnecessary new docs? Yes.
4. Did we avoid expanding into long-term memory / platform design? Yes.
5. Next smallest safe step: if implementation work follows, treat any memory-affecting structured artifact as a proposed delta at the workflow boundary and only apply it after system or human acceptance.


