# Entity Ops CLI Refactor And Deploy V1

Date: 2026-04-29  
Repository: `Kwentin3/ecostroycontinent`  
Local branch: `feat/local-geo-canon-then-refactor`  
Delivered commit: `d9fd7aacb4df610fc8531f031ac68c02da3150dc`  
Short commit: `d9fd7aa refactor: extend entity ops content CLI`

## Executive Summary

The `entity-ops` operator CLI was refactored from a mostly entity/media/page-workspace tool into a practical content-operations surface for repeated admin-runtime work.

The refactor was motivated by the SHANTUI SE420LCW / HYUNDAI HX520L content task. That task exposed real friction:

- photos found during research needed to become media assets without a separate one-off download/upload script
- new equipment cards needed to be attached to an existing rental service relation safely
- content batches needed a runtime-backed path to resolve IDs/revisions and move draft content through review/publish without raw DB shortcuts

The new verdict is still conservative: `entity-ops` is the strategic control surface for repeated content operations, but it is not a full CMS graph compiler and not an autonomous publisher.

## Delivery Outcome

Done:

- Added `sourceUrl` / `url` media uploads.
- Added workflow operations: `submit_to_review`, `approve_owner`, `publish`.
- Added relation operations: `append`, `remove`, `replace`.
- Added read-only `resolve`.
- Updated lookup API summary so workflow planning can see revision review state.
- Updated CLI help text.
- Updated text report output for workflow/relation/resolve fields.
- Updated detailed operator documentation in `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md`.
- Added tests covering normalization, runner behavior, client routing, formatter output, and lookup route fields.
- Built and deployed the new runtime image to the server.

Final live state:

- GitHub build workflow: `25103392499`, `success`
- GitHub deploy workflow: `25103505881`, `success`
- Deployed image:
  `ghcr.io/kwentin3/ecostroycontinent-app@sha256:c6a23b103b7638c0f25629ea1b293a3580393fdeb8d34bb3e020e049146213a8`
- Live health response:
  `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`
- Local git tree after delivery:
  `## feat/local-geo-canon-then-refactor...origin/feat/local-geo-canon-then-refactor`

## Changed Files

Runtime and CLI:

- `lib/entity-ops/input.js`
- `lib/entity-ops/runner.js`
- `lib/entity-ops/client.js`
- `lib/entity-ops/io.js`
- `scripts/entity-ops.mjs`
- `app/api/admin/entities/[entityType]/lookup/route.js`

Tests:

- `tests/entity-ops.test.js`
- `tests/entity-ops.runner.test.js`
- `tests/entity-ops.client.test.js`
- `tests/entity-ops.io.test.js`
- `tests/admin/entity-lookup.route.test.js`

Documentation:

- `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md`
- this report

## New CLI Capabilities

### Media From URL

`media` operations now accept either a local `filePath` or remote `sourceUrl` / `url`.

Important behavior:

- `filePath` and `sourceUrl` are mutually exclusive.
- `sourceUrl` is downloaded through `fetch` with redirects enabled.
- The response must resolve to an image MIME type or an image-like URL extension.
- The downloaded bytes are wrapped into the same multipart `File` shape as local uploads.
- `filename` is optional; the CLI infers it from the URL path or MIME type if omitted.
- The runtime still uses the canonical media library routes:
  - `/api/admin/media/library/create`
  - `/api/admin/media/library/[entityId]`

Example:

```json
{
  "kind": "media",
  "mode": "create",
  "sourceUrl": "https://example.com/media/shantui-se420lcw.jpg",
  "filename": "shantui-se420lcw.jpg",
  "fields": {
    "title": "SHANTUI SE420LCW",
    "alt": "Экскаватор SHANTUI SE420LCW"
  }
}
```

### Workflow Operations

Added `kind: "workflow"` with modes:

- `submit_to_review`
- `approve_owner`
- `publish`

Workflow target resolution:

- direct `revisionId` works without `entityType`
- entity lookup works through `entityType` plus `entityId`, `match.slug`, or page `match.pageType`
- entity lookup uses `/api/admin/entities/[entityType]/lookup`

Safety gates:

- `publish` requires `confirmPublish: true`
- `approve_owner` requires `confirmOwnerApproval: true`
- owner-required revisions must be approved before publish
- only review revisions are published
- only draft revisions are submitted to review, except review state is treated as an idempotent skip

Runtime routes:

- `/api/admin/revisions/[revisionId]/submit`
- `/api/admin/revisions/[revisionId]/owner-action`
- `/api/admin/revisions/[revisionId]/publish`

Example:

```json
{
  "kind": "workflow",
  "entityType": "equipment",
  "mode": "publish",
  "match": {
    "slug": "shantui-se420lcw"
  },
  "confirmPublish": true
}
```

### Relation Operations

Added `kind: "relation"` with modes:

- `append`
- `remove`
- `replace`

Supported fields:

- `service`: `equipmentIds`, `relatedCaseIds`, `galleryIds`
- `equipment`: `serviceIds`, `relatedCaseIds`, `galleryIds`
- `case`: `serviceIds`, `equipmentIds`, `galleryIds`
- `gallery`: `assetIds`, `relatedEntityIds`

Reference inputs:

- `ids` or `values`: already-known entity IDs
- `refs`: objects resolved through lookup
- string refs are treated as entity IDs and must be non-empty

Default reference type inference:

- `assetIds` -> `media_asset`
- `equipmentIds` -> `equipment`
- `relatedCaseIds` -> `case`
- `galleryIds` -> `gallery`
- `serviceIds` -> `service`

The important implementation detail: relation operations do not send a partial relation-only form. They merge the current payload plus the relation change and then call the existing admin save route. This is intentional because the admin save route validates full entity drafts.

Example:

```json
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
```

### Resolve Operation

Added `kind: "resolve"` with mode `entity`.

Behavior:

- read-only
- works without `--execute`
- does not count as a dry-run mutation
- returns entity, latest revision summary, active published revision summary, and optionally payload

Example:

```json
{
  "kind": "resolve",
  "entityType": "service",
  "match": {
    "slug": "arenda-spectehniki"
  },
  "includePayload": true
}
```

## Lookup Route Change

`app/api/admin/entities/[entityType]/lookup/route.js` now includes these revision fields in `latestRevision` and `activePublishedRevision` summaries:

- `ownerReviewRequired`
- `ownerApprovalStatus`
- `previewStatus`

This lets the CLI plan workflow actions before it mutates anything.

## Report Output Change

Text reports now print more useful runtime context:

- `revision: ...`
- `relation: ...`
- `resolvedIds: ...`
- `latestState: ...`
- `publishedRevision: ...`
- local file path or source URL for media upload operations

JSON reports already preserve full item objects.

## Tests And Verification

Shell context:

- Local shell: PowerShell
- Test command shell syntax: PowerShell-compatible commands
- No special test ENV was required beyond the repo defaults

Focused test run:

```powershell
node --test tests/entity-ops.test.js tests/entity-ops.runner.test.js tests/entity-ops.client.test.js tests/entity-ops.io.test.js tests/admin/entity-lookup.route.test.js
```

Result:

- 61 tests
- 61 passed
- 0 failed

Full test run:

```powershell
npm test
```

Result:

- 415 tests
- 415 passed
- 0 failed

Build:

```powershell
npm run build
```

Result:

- Next.js production build succeeded
- TypeScript phase succeeded
- Static generation succeeded for 23 pages

Additional local checks:

```powershell
node --check lib/entity-ops/input.js
node --check lib/entity-ops/runner.js
node --check lib/entity-ops/client.js
node --check lib/entity-ops/io.js
node --check scripts/entity-ops.mjs
node --check app/api/admin/entities/[entityType]/lookup/route.js
git diff --check
node scripts/entity-ops.mjs --help
```

Result:

- JS syntax checks passed
- whitespace check passed
- help text shows the new operation kinds

## Test Integrity Notes

Mocking stayed at boundaries:

- HTTP/network was mocked for `fetch`
- CLI client methods were mocked as boundary abstractions around admin routes
- Filesystem was used only for a temporary local media file test

Observable outcomes asserted:

- media URL upload sends a real `File` with expected name, type, and bytes
- workflow publish calls the correct route only after confirmation
- workflow publish without `confirmPublish` blocks and does not call publish
- direct `revisionId` workflow does not require entity lookup
- relation append resolves refs, merges full payload, and sends all required save fields
- resolve returns entity and revision context without `--execute`
- lookup route returns revision review fields in the JSON response

Irreversible boundaries:

- publish and owner approval are irreversible content workflow actions; tests assert the CLI blocks before calling those route methods when confirmation or owner approval preconditions are missing
- relation save mutates entity draft state; tests assert the full admin-save form body is built from current payload plus relation changes
- media create uploads binary content; tests assert the multipart `File` boundary, not just that a method was called

Route terminal outcome evidence:

- modified lookup route tests assert HTTP status and JSON body shape
- no executable logic was added after terminal `NextResponse.json(...)` returns in the modified lookup route

## Closed-World / Runtime Packaging Evidence

Build artifact evidence:

- `npm run build` generated `.next/standalone`
- `.next/standalone/.next/server/app/api/admin/entities/[entityType]/lookup/route.js` exists
- Dockerfile runner stage copies:
  - `.next/standalone`
  - `.next/static`
  - `node_modules`
  - `package.json`
  - `db`
  - `scripts`
  - `lib`

This matters because `entity-ops` lives under `scripts` and imports `lib/entity-ops/*`. The deployed runner image includes both.

Import/path check:

- no new cross-service workspace imports were introduced
- no `process.cwd()` runtime path hacks were introduced for the changed CLI/runtime files
- no magic config/secret JSON path was introduced

Dependency check:

- no new npm runtime dependency was introduced
- existing dependencies remain declared in `package.json`

GitHub image verification:

- `build-and-publish` ran Docker build
- workflow step `Verify runtime image packages DB migrations` succeeded
- image was pushed to GHCR with tag `sha-d9fd7aa`

## GitHub Actions Delivery

### Initial successful delivery

Build:

- workflow: `build-and-publish`
- run id: `25096202339`
- conclusion: `success`
- branch: `feat/local-geo-canon-then-refactor`
- head SHA: `d9fd7aacb4df610fc8531f031ac68c02da3150dc`
- published digest:
  `sha256:7d941630f37dbd192ea77b554530e09f35d881969f2ecd4866766b7313123f5d`

Deploy:

- workflow: `deploy-phase1`
- run id: `25096298254`
- conclusion: `success`
- deployed image:
  `ghcr.io/kwentin3/ecostroycontinent-app@sha256:7d941630f37dbd192ea77b554530e09f35d881969f2ecd4866766b7313123f5d`
- health probe succeeded through Traefik

### Repeat after GitHub Actions budget update

The user updated the GitHub Actions budget and requested a retry. A fresh build and deploy were run.

Build:

- workflow: `build-and-publish`
- run id: `25103392499`
- conclusion: `success`
- branch: `feat/local-geo-canon-then-refactor`
- head SHA: `d9fd7aacb4df610fc8531f031ac68c02da3150dc`
- published digest:
  `sha256:c6a23b103b7638c0f25629ea1b293a3580393fdeb8d34bb3e020e049146213a8`
- run URL:
  `https://github.com/Kwentin3/ecostroycontinent/actions/runs/25103392499`

Deploy:

- workflow: `deploy-phase1`
- run id: `25103505881`
- conclusion: `success`
- deployed image:
  `ghcr.io/kwentin3/ecostroycontinent-app@sha256:c6a23b103b7638c0f25629ea1b293a3580393fdeb8d34bb3e020e049146213a8`
- run URL:
  `https://github.com/Kwentin3/ecostroycontinent/actions/runs/25103505881`

Deploy log evidence:

- `/opt/ecostroycontinent/runtime/app-image.env` was updated with the pinned image
- `repo-app-1` was recreated and started
- Traefik health probe initially saw a transient `502` during restart, then returned:
  `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`

External health check after deploy:

```powershell
curl.exe -k -fsS https://ecostroycontinent.ru/api/health
```

Result:

```json
{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}
```

## Why This Was Not Merged Into Main Manually

The local branch is far ahead of `origin/main` and contains many prior delivered commits. Directly merging this branch to `main` from the local workspace would bundle much more than this CLI refactor.

To keep delivery bounded, the refactor was:

- committed on `feat/local-geo-canon-then-refactor`
- pushed to GitHub
- built from that exact branch and commit
- deployed by pinned image digest

This avoided an uncontrolled local `main` merge while still deploying the verified runtime artifact.

## Operational Guidance For Next Content Batch

Recommended flow:

1. Use `resolve` to recover target entity IDs and current relation payloads.
2. Use `media` with `sourceUrl` for researched equipment photos.
3. Use `entity` create/upsert for equipment cards.
4. Use `relation append` to attach equipment to `service.equipmentIds`.
5. Use `workflow submit_to_review`, `approve_owner` when needed, and `publish` with explicit confirmations.
6. Keep `--json` reports for machine-readable audit trail.
7. Use one-off scripts only for genuinely unusual migrations or research transforms that do not belong in the stable CLI surface.

## Known Boundaries

Still intentionally out of scope:

- autonomous publish without `confirmPublish`
- owner-review bypass
- dependency-aware graph publishing
- arbitrary relation fields outside the allowlist
- raw DB mutation
- raw object storage mutation
- generic maintenance shell behavior
- image rights validation for externally sourced photos

## Recovery Map

If a new chat needs to continue this work, start here:

- operator CLI docs: `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md`
- input normalization: `lib/entity-ops/input.js`
- execution planner/router: `lib/entity-ops/runner.js`
- HTTP admin client: `lib/entity-ops/client.js`
- report formatter: `lib/entity-ops/io.js`
- CLI entrypoint: `scripts/entity-ops.mjs`
- lookup route: `app/api/admin/entities/[entityType]/lookup/route.js`
- runner tests: `tests/entity-ops.runner.test.js`
- input tests: `tests/entity-ops.test.js`
- client tests: `tests/entity-ops.client.test.js`

Current deployed digest to compare against:

```text
ghcr.io/kwentin3/ecostroycontinent-app@sha256:c6a23b103b7638c0f25629ea1b293a3580393fdeb8d34bb3e020e049146213a8
```
