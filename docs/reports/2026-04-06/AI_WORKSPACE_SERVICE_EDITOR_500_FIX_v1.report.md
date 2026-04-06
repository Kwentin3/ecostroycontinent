# AI_WORKSPACE_SERVICE_EDITOR_500_FIX_v1

## Summary
The service editor was returning `500` on the live admin routes:
- `/admin/entities/service/new`
- `/admin/entities/service/[id]`

The failure was not a UI or routing bug. It was a live database schema gap on the server runtime.

## Root cause
The deployed app code already expected the Memory Card session columns on `app_sessions`, but the live PostgreSQL schema did not have them yet.

The runtime error observed on the server was:
- `column s.workspace_memory_card does not exist`

That error came from `lib/ai-workspace/memory-card.js` via the service editor data loader.

## Fix applied
Applied the missing server migration on the live VM:

- `db/migrations/002_workspace_memory_card.sql`

This migration adds:
- `app_sessions.workspace_memory_card`
- `app_sessions.workspace_memory_card_updated_at`

No application code changes were needed for this fix.

## Verification
Verified after migration:
- `GET /admin/entities/service/new` -> `200 OK`
- `GET /admin/entities/service/entity_8a7991c9-b091-4b6c-9e68-15159a5eda6e` -> `200 OK`

Verified the rendered HTML now contains the expected service workspace surfaces:
- `Service workspace state`
- `Service candidate report`

Verified on the server:
- app container is running
- SQL container is healthy
- `002_workspace_memory_card.sql` is recorded as applied by the migration runner

## Scope notes
- Service-only scope stayed intact.
- No route-family changes were made.
- No product or architecture redesign was introduced.
- This was a runtime/schema catch-up, not a code refactor.

