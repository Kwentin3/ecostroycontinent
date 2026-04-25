# Entity Ops Operator CLI v1

## Purpose

`entity-ops` is a bounded admin-runtime CLI for operator and agent work.

It is intentionally not a raw database shell and not a publish shortcut.

The tool covers four narrow operation families through one stable entrypoint:

- `entity`: create, update, upsert, and delete draft entities through the canonical admin save/delete routes.
- `media`: create or patch media assets through the dedicated media library API.
- `display_mode`: switch the persisted public display mode through the superadmin control route.
- `removal`: mark, unmark, and purge entities through the bounded removal-quarantine and sweep routes.

## Why this tool exists

The project already has guarded write-side routes, role checks, workflow boundaries, and runtime validation. `entity-ops` keeps those guarantees while giving the operator and the internal agent one compact, scriptable control surface.

## What it intentionally uses

- `/api/admin/login`
- `/api/admin/entities/[entityType]/lookup`
- `/api/admin/entities/[entityType]/save`
- `/api/admin/entities/[entityType]/delete`
- `/api/admin/media/library/create`
- `/api/admin/media/library/[entityId]`
- `/api/public/display-mode`
- `/api/admin/system/display-mode`
- `/api/admin/entities/[entityType]/[entityId]/mark-removal`
- `/api/admin/entities/[entityType]/[entityId]/unmark-removal`
- `/api/admin/removal-sweep/purge`

## What it intentionally does not use

- raw SQL
- direct draft mutation
- direct bucket mutation
- publish or owner-review bypasses
- generic maintenance dispatch

## Runtime contract

Recommended local invocation:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json
```

Explicit invocation:

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

- The CLI is `dry-run` by default.
- `--execute` is required for mutation.
- Health probe and login always run first.
- Entity delete still goes through lookup and the bounded delete route.
- Display mode still respects the runtime confirmation rule for `published_only`.
- Removal purge still goes through the bounded sweep route; the CLI does not bypass graph safety.

Example:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json --execute
```

## CLI arguments

```text
node --env-file=.env scripts/entity-ops.mjs --input <file> [--kind <kind>] [--entity-type <type>] [--mode <mode>] [--execute]
```

Supported overrides:

- `--kind`: `entity`, `media`, `display_mode`, `removal`
- `--entity-type`: default entity type for entries that need one
- `--mode`: default mode for the selected kind
- `--base-url`
- `--username`
- `--password`
- `--change-intent`
- `--creation-origin`
- `--format`: `text` or `json`
- `--json`: shorthand for `--format json`
- `--report`: write a JSON report to a file
- `--execute`: apply the operations

## Input contract

The tool accepts `JSON` or `JSONL`.

Windows note:

- input files are decoded safely from UTF-8, UTF-8 with BOM, UTF-16LE, or UTF-16BE
- PowerShell-generated batch files do not need manual recoding before use
- `--json` is recommended when the caller wants machine-readable stdout and wants to avoid console-format ambiguity

When `fields` is omitted, non-reserved top-level keys become save fields.

### 1. Entity operations

Supported modes:

- `create`
- `update`
- `upsert`
- `delete`

Example:

```json
[
  {
    "kind": "entity",
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
    "kind": "entity",
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

- `match` may contain `entityId`, `slug`, or `pageType`.
- `delete` resolves the target through lookup first and then calls the bounded admin delete route in `responseMode=json`.
- Multiline list fields such as `keySpecs`, `usageScenarios`, and `equipmentSpecs` may be expressed as JSON arrays; the CLI serializes them into the newline form expected by the admin route.

### 2. Media operations

Supported modes:

- `create`
- `update`
- `upsert`

`media` uses the dedicated media library routes, not the generic entity save route.

Typical use cases:

- upload a new file from disk
- patch media metadata safely
- replace a binary on a draft media asset
- update collection membership during a media patch

Example:

```json
[
  {
    "kind": "media",
    "mode": "create",
    "filePath": ".\\var\\media\\excavator.jpg",
    "changeIntent": "Upload source media for equipment card",
    "creationOrigin": "agent_test",
    "fields": {
      "title": "Гусеничный экскаватор ZAUBERG EX-210C",
      "alt": "Гусеничный экскаватор ZAUBERG EX-210C на карьере",
      "caption": "Рабочий вес 20,1 т, вместимость ковша 1,0 м3."
    }
  },
  {
    "kind": "media",
    "mode": "update",
    "entityId": "entity_06107869-2e15-43ca-b251-11d7505519e3",
    "collectionIds": ["entity_gallery_1"],
    "fields": {
      "title": "Гусеничный экскаватор ZAUBERG EX-210C",
      "sourceNote": "Источник: карточка товара ZAUBERG",
      "ownershipNote": "Перед публикацией проверить права на использование."
    }
  }
]
```

Media notes:

- `create` requires `filePath`.
- `upsert` can create only if the target does not exist and `filePath` is supplied.
- `update` may also use `filePath` to send a replacement binary through the canonical media patch route.
- `collectionIds` are treated as a membership update and cause `collectionsTouched=true` to be sent.

### 3. Display mode operations

Supported mode:

- `set`

Example:

```json
[
  {
    "kind": "display_mode",
    "displayMode": "mixed_placeholder",
    "reason": "Verify placeholder contour after admin refactor"
  }
]
```

Safety note:

- `published_only` still requires `confirmPublishedOnly: true`.

Example:

```json
[
  {
    "kind": "display_mode",
    "displayMode": "published_only",
    "reason": "Return the site to published-only mode",
    "confirmPublishedOnly": true
  }
]
```

### 4. Removal operations

Supported modes:

- `mark`
- `unmark`
- `purge`

Example:

```json
[
  {
    "kind": "removal",
    "entityType": "case",
    "mode": "mark",
    "match": {
      "entityId": "entity_case_1"
    },
    "removalNote": "test graph cleanup"
  },
  {
    "kind": "removal",
    "entityType": "case",
    "mode": "purge",
    "match": {
      "entityId": "entity_case_1"
    }
  }
]
```

Removal notes:

- `mark` and `unmark` resolve the entity first and then use the bounded runtime routes.
- `purge` refuses to run in planning if the root entity is not marked for removal.
- The CLI does not replace the graph-safety logic inside the removal sweep route.

## Output

The tool supports two stdout modes:

- `text`: human-readable summary for operators
- `json`: machine-readable report for agents and automation

Text mode prints:

- execution mode
- total operations
- summary counters
- per-operation result lines
- preview diff keys in dry-run and execute mode
- route messages for redirect-backed actions
- current display mode after a successful mode switch
- uploaded local file path for media create/update operations

Optional JSON report file:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json --report .\var\entity-ops-report.json
```

Machine-readable stdout:

```powershell
npm run entity:ops -- --input .\var\entity-batch.json --json
```

## Recommended delivery flow

1. Run local dry-run against a small controlled input.
2. Run local execute smoke only on disposable or tightly bounded targets.
3. Push the code.
4. Build and publish the runtime image.
5. Deploy the pinned image to the server.
6. Verify `/api/health`.
7. Run `entity-ops` against the deployed runtime with the server env file.

## Verification checklist

1. `npm test`
2. `npm run build`
3. Local dry-run against each newly used operation kind
4. Local execute smoke against controlled targets
5. GitHub delivery
6. Server deploy
7. Server dry-run or execute smoke against the deployed runtime

## Explicit non-goals

- autonomous publish
- owner-review automation
- raw DB cleanup
- raw storage cleanup
- generic forensics shell
- mixed verification/mutation mega-script