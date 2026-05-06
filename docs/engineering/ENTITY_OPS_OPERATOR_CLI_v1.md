# Entity Ops Operator CLI v1

## Purpose

`entity-ops` is a bounded admin-runtime CLI for operator and agent work.

It is intentionally not a raw database shell and not a publish shortcut.

The tool covers narrow operation families through one stable entrypoint:

- `entity`: create, update, upsert, and delete draft entities through the canonical admin save/delete routes.
- `media`: create or patch media assets through the dedicated media library API, from local files or a bounded `sourceUrl` download.
- `page_workspace`: save page composition/metadata or submit a page draft through the unified Page Workspace API.
- `workflow`: submit a resolved revision to review, approve owner-required review, or publish a review revision through existing workflow routes.
- `relation`: append, remove, or replace supported relation fields after resolving referenced entities through lookup.
- `resolve`: read entity/revision context without mutation.
- `display_mode`: switch the persisted public display mode through the superadmin control route.
- `removal`: mark, unmark, and purge entities through the bounded removal-quarantine and sweep routes.

## Why this tool exists

The project already has guarded write-side routes, role checks, workflow boundaries, and runtime validation. `entity-ops` keeps those guarantees while giving the operator and the internal agent one compact, scriptable control surface.

## What it intentionally uses

- `/api/admin/login`
- `/api/admin/entities/[entityType]/lookup`
- `/api/admin/entities/[entityType]/save`
- `/api/admin/entities/[entityType]/delete`
- `/api/admin/entities/page/[pageId]/workspace`
- `/api/admin/revisions/[revisionId]/submit`
- `/api/admin/revisions/[revisionId]/owner-action`
- `/api/admin/revisions/[revisionId]/publish`
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
- Entity input rejects unknown save fields instead of silently sending values the admin route cannot persist.
- Entity delete still goes through lookup and the bounded delete route.
- Media `sourceUrl` downloads are converted into the same multipart `File` shape as local uploads and still use media library routes.
- Page Workspace actions still resolve the page first and then use the bounded JSON workspace route.
- Workflow publish and owner approval require explicit confirmation flags in input; the CLI calls the runtime workflow routes and does not bypass permissions.
- Relation operations resolve references through lookup, compute the next relation value, then send a full merged entity payload to the admin save route because that route validates full drafts.
- Resolve operations are read-only and return entity/revision context even without `--execute`.
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

- `--kind`: `entity`, `media`, `page_workspace`, `workflow`, `relation`, `resolve`, `display_mode`, `removal`
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
- `create` derives a lookup matcher from `slug` or page `pageType` when possible and refuses to overwrite an existing match.
- `delete` resolves the target through lookup first and then calls the bounded admin delete route in `responseMode=json`.
- Multiline list fields such as `keySpecs` and `usageScenarios` may be expressed as JSON arrays; the CLI serializes them into the newline form expected by the admin route.
- Unknown entity fields are rejected at input normalization time. Use `page_workspace` for nested page composition payloads such as `sourceRefs`, `mediaSettings`, `targeting`, or `sections`.

### 2. Media operations

Supported modes:

- `create`
- `update`
- `upsert`

`media` uses the dedicated media library routes, not the generic entity save route.

Typical use cases:

- upload a new file from disk
- upload a new file from an HTTP(S) image URL
- patch media metadata safely
- replace a binary on a draft media asset
- update collection membership during a media patch

Example:

```json
[
  {
    "kind": "media",
    "mode": "create",
    "sourceUrl": "https://example.com/media/shantui-se420lcw.jpg",
    "filename": "shantui-se420lcw.jpg",
    "changeIntent": "Upload sourced media for equipment card",
    "creationOrigin": "operator_content_sync",
    "fields": {
      "title": "SHANTUI SE420LCW",
      "alt": "Экскаватор SHANTUI SE420LCW",
      "caption": "Медиа для карточки техники SHANTUI SE420LCW."
    }
  },
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

- `create` requires `filePath` or `sourceUrl`.
- `sourceUrl` may also be written as `url`; `filename` is optional when the URL path or response content type gives a safe image filename.
- `filePath` and `sourceUrl` are mutually exclusive in one operation.
- `upsert` can create only if the target does not exist and a binary source is supplied.
- `update` may also use `filePath` or `sourceUrl` to send a replacement binary through the canonical media patch route.
- `collectionIds` are treated as a membership update and cause `collectionsTouched=true` to be sent.

### 3. Page Workspace operations

Supported modes:

- `save_composition`
- `save_metadata`
- `send_to_review`

`page_workspace` uses the unified page workspace route and sends JSON, not multipart form data. This is the correct path for nested page composition objects.

Example:

```json
[
  {
    "kind": "page_workspace",
    "mode": "save_composition",
    "match": {
      "pageType": "about"
    },
    "changeIntent": "Update about page source proof block",
    "composition": {
      "title": "О компании",
      "sourceRefs": {
        "caseIds": ["entity_case_1"],
        "galleryIds": ["entity_gallery_1"]
      }
    }
  },
  {
    "kind": "page_workspace",
    "mode": "save_metadata",
    "match": {
      "pageType": "about"
    },
    "metadata": {
      "slug": "about",
      "seo": {
        "metaTitle": "О компании"
      }
    }
  }
]
```

Page Workspace notes:

- `pageId`, `entityId`, `match.slug`, or `match.pageType` is required.
- Dry-run shows the changed workspace keys before execution.
- `send_to_review` does not publish and does not bypass owner review.

### 4. Workflow operations

Supported modes:

- `submit_to_review`
- `approve_owner`
- `publish`

Example:

```json
[
  {
    "kind": "workflow",
    "mode": "submit_to_review",
    "revisionId": "rev_equipment_1",
    "returnTo": "/admin/entities/equipment"
  },
  {
    "kind": "workflow",
    "entityType": "equipment",
    "mode": "approve_owner",
    "match": {
      "slug": "shantui-se420lcw"
    },
    "comment": "Owner approved for launch content sync.",
    "confirmOwnerApproval": true
  },
  {
    "kind": "workflow",
    "entityType": "equipment",
    "mode": "publish",
    "match": {
      "slug": "shantui-se420lcw"
    },
    "confirmPublish": true
  }
]
```

Workflow notes:

- A workflow operation may target `revisionId` directly without `entityType`, or resolve the latest revision by `entityId`, `match.slug`, or page `match.pageType`.
- `entityType` is required only when the CLI needs to resolve an entity before choosing the latest revision.
- `publish` requires `confirmPublish: true`.
- `approve_owner` requires `confirmOwnerApproval: true`.
- Owner-required revisions must be owner-approved before publish; the CLI blocks earlier instead of attempting a runtime publish.

### 5. Relation operations

Supported modes:

- `append`
- `remove`
- `replace`

Supported relation fields:

- `service`: `equipmentIds`, `relatedCaseIds`, `galleryIds`
- `equipment`: `serviceIds`, `relatedCaseIds`, `galleryIds`
- `case`: `serviceIds`, `equipmentIds`, `galleryIds`
- `gallery`: `assetIds`, `relatedEntityIds`

Example:

```json
[
  {
    "kind": "relation",
    "entityType": "service",
    "mode": "append",
    "match": {
      "slug": "arenda-spectehniki"
    },
    "field": "equipmentIds",
    "refs": [
      { "slug": "shantui-se420lcw" },
      { "slug": "hyundai-hx520l" }
    ],
    "changeIntent": "Attach new equipment cards to the rental service"
  }
]
```

Relation notes:

- `ids` / `values` accept already-known entity IDs.
- `refs` resolve by lookup before mutation. For common fields the referenced entity type is inferred: for example `equipmentIds` resolves `equipment`.
- Object refs may override type with `entityType` or use nested `match`.
- The CLI merges the current payload and relation change before saving, so admin validation receives a full entity draft rather than a partial relation-only form.

### 6. Resolve operations

Supported mode:

- `entity`

Example:

```json
[
  {
    "kind": "resolve",
    "entityType": "service",
    "match": {
      "slug": "arenda-spectehniki"
    },
    "includePayload": true
  }
]
```

Resolve notes:

- `resolve` is read-only.
- It works without `--execute` and does not count as a dry-run mutation.
- Use it to recover entity IDs, latest revision state, active published revision, and payload shape before building mutation batches.

### 7. Display mode operations

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

### 8. Removal operations

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
- revision IDs and workflow target state where available
- relation field names and resolved reference IDs for relation operations
- latest and published revision summaries for resolve operations
- current display mode after a successful mode switch
- uploaded local file path or source URL for media create/update operations

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

## Context recovery for a new chat

Current verdict: keep `entity-ops` as the strategic content control surface and add only narrow runtime-backed primitives when repeated operator work exposes a real gap.

This refactor was introduced after the SHANTUI SE420LCW / HYUNDAI HX520L content task showed three missing primitives:

- media assets needed to be created from researched image URLs without a separate one-off download script
- newly created equipment needed a safe way to attach itself to the existing rental service relation
- content batches needed a runtime-backed path to submit, approve, publish, and resolve IDs/revisions without raw DB shortcuts

The CLI is still deliberately not a full CMS graph compiler. It does not decide dependencies, invent publish order, or perform hidden owner-review bypasses. For unusual migrations, one-off scripts remain acceptable as an escape hatch, but the default path for repeated content operations should be `entity-ops` plus dry-run JSON reports.

Implementation map:

- `scripts/entity-ops.mjs`: CLI argument surface and report writing.
- `lib/entity-ops/input.js`: input normalization, field allowlists, and form/body builders.
- `lib/entity-ops/runner.js`: dry-run planning and execution routing.
- `lib/entity-ops/client.js`: authenticated HTTP client for admin runtime routes.
- `lib/entity-ops/io.js`: input decoding and text/JSON report formatting.
- `app/api/admin/entities/[entityType]/lookup/route.js`: lookup payload that exposes enough revision state for workflow planning.

## Explicit non-goals

- unconfirmed or autonomous publish
- owner-review bypass automation
- raw DB cleanup
- raw storage cleanup
- generic forensics shell
- mixed verification/mutation mega-script
- dependency-aware graph publishing
