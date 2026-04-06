# AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_V1.report

## What was proposed

The plan proposes a five-block practical model for the AI-assisted service landing workspace:

- UI / Workspace
- Workspace Application Layer
- Memory Card
- Prompt Packet Assembly + LLM Boundary
- Canonical Workflow / Truth

Verification, review, and publish handoff are kept inside the application/workflow boundary instead of becoming their own platform layer.

## What was intentionally kept out

- new route families
- long-term memory or vector memory design
- public AI memory
- broad agent-platform design
- page-builder drift
- publish workflow redesign
- a new product PRD
- any implementation code

## Most important isolation rule

Memory Card stays session-scoped working state only, and LLM outputs may affect it only as proposed deltas that become real state only after system or human acceptance.

Prompt context is assembled in one place only, from canonical inputs plus Memory Card, and the UI does not assemble prompt context directly.

The prompt packet shape is singular: one workspace action family should not invent a parallel packet format.

The plan now also names the minimal runtime packet and API bridge explicitly, so implementation can start from concrete read/write shapes instead of re-inventing them per route.

The logical flow is hub-and-spoke, not a literal pipe: Workspace Application reads canonical truth and Memory Card, then calls the prompt packet assembler and LLM boundary before workflow handoff.

The plan now also keeps `assemblePromptPacket(...)` pure, keeps `requestStructuredArtifact(...)` as the single LLM boundary call, and treats candidate/spec as one derived projection rather than a second working copy.

## Smallest next implementation step

Define one narrow prompt packet assembler and one narrow accepted-delta write adapter for the service-only workspace, then wire the service generate path through them before adding any storage or rehydration mechanics.

## Notes from the refinement pass

- The plan calls out the runtime storage / rehydration gap explicitly instead of pretending it is already solved.
- The plan explicitly avoids building a Memory Card storage subsystem before the read/write API and one happy path exist.
- The plan calls out candidate/spec duplication risk so future work does not create a hidden second truth.
- The plan calls out shared preview / verification slices so those views do not drift apart.
- The plan reduces the conceptual 7-layer view into 5 practical blocks so it stays usable for implementation.
- The plan keeps the Memory Card boundary session-scoped and does not expand into a broader memory platform.
