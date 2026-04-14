# Entity Ops Operator CLI v1

## Purpose

`entity-ops` is a bounded operator CLI for creating and updating draft entities through the existing admin runtime.

It intentionally uses:

- `/api/admin/login`
- `/api/admin/entities/[entityType]/lookup`
- `/api/admin/entities/[entityType]/save`
- `/api/admin/entities/[entityType]/delete`

It intentionally does **not** use raw SQL, direct draft mutation, or publish shortcuts.

## Why this tool exists

The project already has a strong admin write-side with RBAC, draft revisions, owner-review rules, and audit events.

The CLI keeps those guarantees while making batch content work faster for the operator and for the agent:

- login is explicit;
- lookup is authenticated and bounded;
- save goes through the canonical draft flow;
- delivery works both locally and on the server runtime.

## Runtime contract

The CLI reads env from the active Node process.

Recommended local invocation:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json
```

Equivalent explicit invocation:

```powershell
node --env-file=.env scripts/entity-ops.mjs --input .\var\entity-batch.json
```

Recommended server invocation:

```bash
cd /opt/ecostroycontinent/repo
node --env-file /opt/ecostroycontinent/runtime/.env scripts/entity-ops.mjs --input /opt/ecostroycontinent/runtime/entity-batch.json
```

Primary env values:

- `ENTITY_OPS_BASE_URL` or `APP_BASE_URL`
- `ENTITY_OPS_USERNAME`
- `ENTITY_OPS_PASSWORD`
- `ENTITY_OPS_TIMEOUT_MS`

If `ENTITY_OPS_USERNAME` / `ENTITY_OPS_PASSWORD` are omitted, the tool falls back to `SEED_SUPERADMIN_USERNAME` / `SEED_SUPERADMIN_PASSWORD`.

## Default safety posture

The CLI is `dry-run` by default.

Use `--execute` only when the preview is acceptable:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json --execute
```

## Input contract

The tool accepts `JSON` or `JSONL`.

The simplest `JSON` batch:

```json
[
  {
    "entityType": "service",
    "mode": "upsert",
    "slug": "vyvoz-grunta",
    "title": "Вывоз грунта",
    "h1": "Вывоз грунта",
    "summary": "Организуем вывоз грунта со строительных площадок.",
    "serviceScope": "Погрузка, вывоз, закрывающие документы",
    "ctaVariant": "call"
  },
  {
    "entityType": "page",
    "mode": "update",
    "match": {
      "pageType": "about"
    },
    "fields": {
      "pageType": "about",
      "title": "О компании",
      "h1": "О компании",
      "intro": "Работаем по Сочи и Большому Сочи."
    }
  }
]
```

Notes:

- `entityType` supports the current admin first-slice entity families.
- `mode` supports `create`, `update`, `upsert`, `delete`.
- `match` may contain `entityId`, `slug`, or `pageType`.
- When `fields` is omitted, all non-reserved top-level keys are treated as save fields.
- Field names must match the existing admin save route contract.
- `delete` resolves the target through lookup first and then calls the bounded admin delete route in `responseMode=json`.

## Output

The tool prints:

- execution mode;
- total operations;
- summary counters;
- per-entity result lines;
- preview diff keys in dry-run and execute mode.

Optional JSON report:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json --report .\var\entity-ops-report.json
```

## Delivery flow

Recommended path for production delivery:

1. Merge or push the code to `main`.
2. Let `build-and-publish.yml` publish the new image to GHCR.
3. Dispatch `deploy-phase1.yml` with the pinned image digest.
4. Verify `/api/health` through Traefik.
5. Run `entity-ops` against the deployed runtime with the server env file.

## Verification checklist

1. `npm test`
2. `npm run build`
3. Local dry-run with a small batch
4. Local execute smoke against a controlled entity
5. GitHub delivery
6. Server deploy
7. Server dry-run or execute smoke against the deployed runtime
