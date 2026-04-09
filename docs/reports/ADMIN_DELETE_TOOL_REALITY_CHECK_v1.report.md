# ADMIN_DELETE_TOOL_REALITY_CHECK_v1

## Scope

Reality check for the first admin delete-tool slice after:

- code push;
- live DB migration;
- GHCR build;
- live deploy.

This report checks whether the feature is now real enough for operator testing.

## What Is Fully Aligned

### Marker path is real

- `content_entities.creation_origin` exists on the live database.
- migration `003_entity_creation_origin.sql` was applied successfully on the VM.
- runtime save/create paths now support explicit `creationOrigin = "agent_test"` for the intended agent/test flows.

Verdict:

- `marker path = REAL`

### Test filter and bulk delete are real in the code/runtime surface

- `media`, `service`, and `case` list surfaces now carry test-row awareness.
- `Только тестовые` filter exists in the relevant list/workspace surfaces.
- bulk delete posts through the dedicated delete route and respects safe-delete rules.

Verdict:

- `test filter / bulk delete = REAL`

### Ordinary delete path is real

- `service` and `case` editors now expose explicit delete actions.
- media workspace exposes delete from the existing operational surface.
- delete route returns readable refusal messages instead of raw DB failures.

Verdict:

- `ordinary delete path = REAL`

### Safe-delete refusal is real and bounded

The implementation now explicitly refuses deletion when the entity is:

- published/live;
- in review/publish flow;
- referenced by published objects;
- referenced by non-test drafts;
- not test-marked during test-only bulk delete.

Verdict:

- `refusal layer = REAL`

## Live Runtime Evidence

### Deploy / image / health

- `build-and-publish` run `24200583018` succeeded
- `deploy-phase1` run `24200736549` succeeded
- running app container image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:952e5f8a93fac2e621f3f71810681fad61d210bb8e4f7a8e3c7dfbb2f2bdc0bf`
- host runtime env pin now matches the same digest
- live health probe:
  - `https://ecostroycontinent.ru/api/health` -> `200`

### Admin reachability

- `https://ecostroycontinent.ru/admin/entities/service` redirects to `/admin/login`
- this confirms the live admin route remains reachable behind auth

## What Remains Partial

### Live authenticated UI walkthrough

This pass did **not** include a dedicated authenticated browser walkthrough of:

- clicking `Удалить` in each entity surface;
- running bulk delete against live test-marked rows;
- visually reading refusal toasts/modals in the deployed UI.

That means the feature is runtime-backed and deployed, but final operator ergonomics should still be checked in the real admin session.

Verdict:

- `live authenticated delete walkthrough = PARTIAL`

### Deploy workflow pin hygiene

The deploy workflow still succeeded while leaving stale `APP_IMAGE=...:latest` in host `.env`.
The actual runtime was correct because compose was launched with explicit shell override, and the host file was corrected manually after deploy.

Verdict:

- `deploy pin persistence = PARTIAL`

## Scope Discipline Check

First-slice scope stayed narrow:

- no `Page` deletion;
- no archive-first platform;
- no grouped bundle cleanup;
- no naming-based heuristics;
- no workspace-level destructive controls.

Verdict:

- `scope discipline = KEPT`

## Overall Verdict

The first-slice admin delete tool is now honest enough to support the next operator step.

Status:

- `IMPLEMENTED AND DEPLOYED`

with two explicit caveats:

1. live authenticated operator testing is still needed;
2. deploy workflow host-env pinning should be hardened in a follow-up patch.

## Next Smallest Safe Step

Run one focused operator test pass on the deployed admin:

- create one explicit agent-test `media`, `service`, and `case`;
- confirm `Только тестовые` filtering;
- bulk delete the test set;
- attempt one unsafe delete and confirm readable refusal.

After that, patch the deploy workflow so host `.env` pinning no longer needs manual correction.
