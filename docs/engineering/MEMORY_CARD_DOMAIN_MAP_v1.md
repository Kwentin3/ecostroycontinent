# MEMORY_CARD_DOMAIN_MAP_v1

## Purpose

Memory Card is the session-scoped mutable working-state layer for the AI-assisted landing composition workspace in `Экостройконтинент`. It keeps one active run coherent across generation, review, and revision without competing with canonical truth.

## What It Is

Memory Card is a compact internal state layer that stores the current run's working inputs, derived pointers, and decision breadcrumbs so prompt assembly and review continuity do not have to replay full chat history.

## What It Is Not

- not canonical truth
- not revision truth
- not publish state
- not audit trail
- not long-term user memory
- not provider-managed chat memory
- not public AI memory
- not a page-builder state engine
- not a second approval system

## Scope Boundary

### Owns

- Session-scoped working state for one active workspace run.
- Prompt assembly inputs that can be safely derived from the current run.
- Compact trace pointers and decision breadcrumbs.

### Does not own

- Canonical content, revision rows, published pointers, or audit trail records.
- Full chat history, raw provider payloads, or unrelated sessions.
- Any state that must stay canonical in the content/revision model.

### Assumes

- Content Core remains canonical.
- The landing workspace is composition-first.
- For the landing-first MVP, `pageId` is the primary workspace anchor even though the Memory Card keeps generic `entity_type` / `entity_id` fields for reuse.
- Service pages under `/services/[slug]` remain route-owning SEO surfaces and adjacent reuse inputs, but they are not the primary AI workspace target.
- Publish remains human-controlled.
- LLM infra can request structured artifacts and return a stable result envelope.
- Admin remains the write-side workspace and public web remains read-side only.
- Memory Card stays downstream of canonical truth and upstream of prompt assembly.

### Forbids

- Silent truth mutation.
- Direct LLM writes.
- Provider-owned memory.
- Quiet promotion into long-term storage.
- Memory becoming a second source of truth or a hidden publish state.
- Memory becoming a page-builder engine or a broad agent memory graph.

## Shelves / State Buckets

### Session Identity

- `session_id`
- `entity_type` / `entity_id`
- `actor`
- `created_at`
- `updated_at`
- `closed_at`
- `base_revision_id`
- `route_locked`
- `entity_locked`

Rule: one active Memory Card points at one workspace run, one entity, and one route family at a time.

### Editorial Intent

- change intent
- editorial goal
- variant direction

Rule: this shelf carries the current working objective, not canonical content.

### Proof Selection

- selected media
- selected case ids
- selected gallery ids

Rule: proof selection is a session decision about evidence to carry forward, not a new truth store.

### Artifact State

- candidate/spec pointer as the primary working artifact pointer
- spec version
- preview mode
- verification summary
- review status
- derived snapshot reference, only when explicitly tagged `derived: true` and carrying no truth semantics

Rule: prompt assembly never forwards a bare pointer to the model; the pointer is resolved into a derived artifact slice before prompt assembly.

Rule: artifact state may be derived and archival-friendly, but it must never outrank revision truth.

### Editorial Decisions

- accepted decisions
- rejected directions
- active blockers
- warnings worth carrying forward

Rule: decisions are carry-forward guidance for the active run, not immutable history.

### Trace State

- last LLM trace id
- request id
- generation timestamp

Rule: trace state is diagnostic and reproducibility-oriented, not business truth.

### Archive Pointer

- pointer to audit trail
- pointer to previous runs
- pointer to the last accepted candidate/spec snapshot

Rule: the archive pointer may reference history, but the active Memory Card does not hold the full history itself.

## Ownership / Write Rules

- System and pipeline code write derived state, trace pointers, and verification summaries.
- Human operators write intent, proof selection, and acceptance or rejection decisions.
- LLM never writes directly to Memory Card.
- If an LLM output affects Memory Card, it is only a proposed delta.
- Accepted deltas are applied by system or human workflow.
- Rejected or unaccepted deltas do not mutate Memory Card.
- Canonical inputs are read-only to Memory Card.

## Lifecycle

- Session create: the workspace opens from an admin action or a routed generation entrypoint.
- Active mutation period: the card can change while the run moves through generation, review, and revision.
- Session close: the active run ends, the workspace can reset, and the card stops mutating.
- Archive pointer behavior: closing may preserve a pointer to audit trail entries or previous candidate runs.
- Reopen from an archive pointer creates a new session; it does not resurrect the old one.
- No silent survival between sessions: a new session must be explicit.
- No quiet promotion into long-term memory: persistence beyond the session must be an explicit product decision.

## Drift Risks

- Hidden second truth store
- Direct LLM writes into memory
- Artifact state drifting from revision truth
- Cross-session leakage of proof, decisions, or trace pointers

## Cross-Domain Relations

- Landing factory domain: consumes Memory Card for landing-first composition, review, and verification continuity, but does not own session memory semantics.
- LLM infra domain: consumes prompt context assembled from Memory Card, but does not own session memory semantics.
- Canonical content / revision / publish truth: remains authoritative; Memory Card mirrors only selected, session-scoped working state and pointers.

## Read Order / Next Doc Dependency

Read this document first, then `MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`.

The prompt context contract depends on this domain map.


