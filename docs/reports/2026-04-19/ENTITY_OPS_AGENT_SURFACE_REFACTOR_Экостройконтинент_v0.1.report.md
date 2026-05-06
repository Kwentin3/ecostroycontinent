# ENTITY_OPS_AGENT_SURFACE_REFACTOR Экостройконтинент v0.1

## Status

Implemented.

## Goal

Refactor the existing `entity-ops` admin-runtime CLI so it matches the real bounded runtime surfaces that the agent now uses in practice.

This pass intentionally stayed inside the existing tool instead of creating another parallel script family.

## Why this refactor was needed

Before this change, `entity-ops` only covered generic draft entity CRUD through:

- login
- lookup
- save
- delete

That was no longer enough for real agent work on the live server because the runtime now also contains:

- dedicated media library create/update routes;
- formal public display mode switching;
- removal mark / unmark / purge workflows.

The agent was already using ad-hoc one-off scripts and direct request snippets around those routes.

That created avoidable drift:

- the reusable CLI was narrower than the real bounded runtime surface;
- proof scripts and one-off fixes were carrying operational knowledge that should have lived in the shared tool;
- media patching and removal maintenance were not represented in the documented input contract.

## Implemented capabilities

`entity-ops` now supports four bounded operation kinds:

1. `entity`
2. `media`
3. `display_mode`
4. `removal`

### `entity`

Unchanged core contract:

- `create`
- `update`
- `upsert`
- `delete`

### `media`

New bounded capability:

- create a media asset from local `filePath` through `/api/admin/media/library/create`
- update media metadata through `/api/admin/media/library/[entityId]`
- optionally replace the binary on update using `filePath`
- optionally send collection membership changes

### `display_mode`

New bounded capability:

- read current runtime mode through `/api/public/display-mode`
- switch persisted mode through `/api/admin/system/display-mode`
- preserve the formal `published_only` confirmation requirement

### `removal`

New bounded capability:

- mark entity for removal
- unmark entity
- purge a marked graph through the bounded removal sweep route

The CLI does not bypass graph-safety logic and refuses purge planning if the root is not marked.

## Key design decisions

1. One existing entrypoint was preserved.

The tool remains `scripts/entity-ops.mjs`.

2. No raw ops backdoor was introduced.

Everything still goes through existing authenticated application routes.

3. Dedicated runtime routes are used where they already exist.

Media patching now uses the media library API instead of pretending the generic entity save route is the only useful surface.

4. The tool remains dry-run first.

New mutation kinds inherit the same default safety posture.

5. The tool stays bounded.

This refactor did not add:

- publish automation
- owner-review automation
- raw SQL
- raw storage cleanup
- generic verification DSL

## Files changed

- `lib/entity-ops/input.js`
- `lib/entity-ops/client.js`
- `lib/entity-ops/runner.js`
- `scripts/entity-ops.mjs`
- `tests/entity-ops.test.js`
- `tests/entity-ops.client.test.js`
- `tests/entity-ops.runner.test.js`
- `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md`

## Verification

### Targeted tests

- `node --experimental-specifier-resolution=node --test tests/entity-ops.test.js tests/entity-ops.client.test.js tests/entity-ops.runner.test.js`

Result:

- pass

### Full test suite

- `npm test`

Result:

- pass

### Build

- `npm run build`

Result:

- pass

### Live dry-run smoke

Executed a live `dry-run` against the deployed server using the refactored CLI.

Confirmed:

- media operation kind resolves and plans against live runtime data;
- display mode operation kind resolves and plans against live runtime state;
- no mutation was executed during this smoke.

## Documentation updated

- `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md`

The document now reflects:

- new operation kinds;
- dedicated runtime routes behind each kind;
- updated input contract;
- live-safe usage expectations.

## Deferred by design

The following ideas were intentionally left out of this pass:

- HTML token verification built into `entity-ops`
- publish/review actions inside `entity-ops`
- generic maintenance registry execution from this CLI

Reason:

those would widen the tool from a bounded admin-runtime operator client into a much broader ops platform, which is not justified by the current canon.

## Final assessment

The refactor was worth doing.

`entity-ops` is now materially closer to the real bounded runtime surface that the agent already depends on, while still staying inside the project’s safety boundaries.
