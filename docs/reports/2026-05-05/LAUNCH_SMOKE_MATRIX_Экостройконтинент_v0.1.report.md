# LAUNCH_SMOKE_MATRIX_Ecostroycontinent_v0.1

Date: 2026-05-05
Execution / revalidation date: 2026-05-06

## Executive Verdict

`LAUNCH_ACCEPTANCE_REPEATABILITY_IMPROVED`.

The repository now has a compact read-only launch smoke matrix for production/stage acceptance. It checks runtime health, DB-backed readiness, public launch routes, SEO honesty, admin protection, known owner/content blockers, and optional media delivery without authenticating or mutating production data.

## Before

Existing smoke coverage:

- `scripts/smoke-public-admin.mjs`
- npm script: `smoke:public-admin`

That script was useful for public/admin no-500 checks, but it did not explicitly cover:

- `/api/readiness`;
- DB readiness status;
- secret absence in health/readiness JSON;
- `/robots.txt`;
- sitemap URL honesty;
- `/about` and `/contacts` as `known_content_blocker` rather than generic missing pages;
- optional known media URL checking;
- version/build marker extraction.

## What Changed

Added:

- `scripts/smoke-launch-readonly.mjs`
- npm script: `smoke:launch`
- unit coverage in `tests/smoke-launch-readonly.test.js`
- launch smoke instructions in `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_..._v0.2.md`

No dependencies were added or updated.

## Command

Default production command:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
```

Optional env:

```text
APP_BASE_URL=https://ecostroycontinent.ru
EXPECT_ABOUT=published|known_missing
EXPECT_CONTACTS=published|known_missing
EXPECT_READINESS=true|false
EXPECT_MEDIA_URL=https://example.test/path/to/public/media.webp
SMOKE_HOST_HEADER=ecostroycontinent.ru
SMOKE_TIMEOUT_MS=10000
```

Current expected owner/content state:

```text
EXPECT_ABOUT=known_missing
EXPECT_CONTACTS=known_missing
```

## Matrix Coverage

Runtime / readiness:

- `/api/health`
- `/api/health#no-secrets`
- `/api/readiness`
- `/api/readiness#no-secrets`
- readiness DB status must be `ok` when `EXPECT_READINESS=true`
- runtime marker is printed when readiness exposes it

Public routes:

- `/`
- `/services`
- `/cases`

Known owner/content blockers:

- `/about`
- `/contacts`

SEO honesty:

- `/robots.txt` must return 200, expose sitemap, and disallow admin.
- `/sitemap.xml` must return 200 and contain `<loc>` entries.
- Core public routes `/`, `/services`, `/cases` must be present in sitemap.
- `/about` and `/contacts` must be absent when expected `known_missing`.
- `/about` and `/contacts` must be present when expected `published`.
- Every sitemap `<loc>` is fetched read-only and must not return 404/5xx.

Admin protection:

- `/admin`
- `/admin/review`
- `/admin/entities/service`

Expected unauthenticated admin result:

- redirect to `/admin/login` or `/admin/no-access`, or
- `401`, or
- `403`.

Unexpected:

- `200` public admin page;
- `404`;
- `5xx`;
- redirect to an unrelated location.

Optional media:

- If `EXPECT_MEDIA_URL` is set, the script checks it with `HEAD`, falling back to `GET` only on `405`.
- If it is not set, media is reported as `skipped` / `not_configured`.
- No test asset is created.

## Result Semantics

- `passed`: expected read-only check succeeded.
- `failed`: unexpected behavior; script exits with code `1`.
- `known_content_blocker`: expected owner/content blocker; script exits with code `0` if no failures exist.
- `skipped`: optional check not configured; script exits with code `0` if no failures exist.

The script never prints raw response bodies for page routes and sanitizes URLs by dropping query strings and hashes in summaries.

## Unit Test Coverage

Added tests assert:

- sitemap `<loc>` extraction and entity decoding;
- secret-shaped health/readiness payload detection;
- success matrix with `/about` and `/contacts` as known missing owner content;
- failure when sitemap lists a known missing owner route.

Terminal outcome:

- `runLaunchSmoke()` returns observable summary counts and check rows.
- CLI sets exit code `1` when `summary.failed > 0`.

## Local Verification

```text
node --experimental-specifier-resolution=node --test tests/smoke-launch-readonly.test.js
```

Passed: 4 tests.

```text
npm test
```

Passed: 462 tests.

```text
npm run build
```

Passed on Next.js `16.2.4`; `/api/health`, `/api/readiness`, `/robots.txt`, and `/sitemap.xml` are present in the App Router build output.

```text
git diff --check
```

Passed. PowerShell/Git emitted only standard Windows LF-to-CRLF warnings for touched text files.

Closed-world check:

```text
rg --pcre2 -n 'from\s+["''](?!node:|\.\.?/)' scripts/smoke-launch-readonly.mjs tests/smoke-launch-readonly.test.js
```

No external npm imports were found. The script uses Node built-ins and global Fetch/Response only, so no ghost dependency was introduced.

## Production Smoke Result

Command:

```powershell
$env:APP_BASE_URL='https://ecostroycontinent.ru'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
```

Result:

```json
{
  "baseUrl": "https://ecostroycontinent.ru/",
  "expectations": {
    "about": "known_missing",
    "contacts": "known_missing",
    "readiness": true,
    "media": "not_configured"
  },
  "runtimeMarker": {
    "version": null,
    "commit": null,
    "node": "v22.22.2"
  },
  "sitemap": {
    "urlCount": 4,
    "urls": [
      "https://ecostroycontinent.ru/",
      "https://ecostroycontinent.ru/services",
      "https://ecostroycontinent.ru/cases",
      "https://ecostroycontinent.ru/services/arenda-tehniki"
    ]
  },
  "summary": {
    "passed": 21,
    "failed": 0,
    "known_content_blocker": 2,
    "skipped": 1
  }
}
```

Key route outcomes:

- `/api/health`: passed, HTTP 200.
- `/api/readiness`: passed, HTTP 200, `database.status=ok`.
- `/`: passed, HTTP 200.
- `/services`: passed, HTTP 200.
- `/cases`: passed, HTTP 200.
- `/robots.txt`: passed, HTTP 200.
- `/sitemap.xml`: passed, HTTP 200, 4 URLs.
- `/about`: `known_content_blocker`, HTTP 404.
- `/contacts`: `known_content_blocker`, HTTP 404.
- `/admin`: passed, HTTP 307 to `/admin/login`.
- `/admin/review`: passed, HTTP 307 to `/admin/login`.
- `/admin/entities/service`: passed, HTTP 307 to `/admin/login`.
- media: skipped / not configured.

Sitemap honesty:

- `/about` absent while expected `known_missing`.
- `/contacts` absent while expected `known_missing`.
- Every listed sitemap URL returned 200 during the smoke.

Secret safety:

- `/api/health#no-secrets`: passed.
- `/api/readiness#no-secrets`: passed.

## Server Acceptance

Read-only SSH checks on `178.72.179.66`:

```text
repo-app-1  ghcr.io/kwentin3/ecostroycontinent-app@sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03  Up 24 hours  127.0.0.1:3000->3000/tcp
repo-sql-1  postgres:16-alpine                                                                                               Up 6 weeks (healthy)
```

Traefik-local probes on VM:

```json
{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}
{"status":"ready","service":"next-app","nodeEnv":"production","database":{"status":"ok"},"runtime":{"node":"v22.22.2","version":null,"commit":null}}
```

Recent app logs:

```text
docker logs --since 10m repo-app-1
<empty>
```

No deploy, migration, content mutation, auth flow, or test entity creation was performed for this task.

## Changed Files

- `package.json`
- `scripts/smoke-launch-readonly.mjs`
- `tests/smoke-launch-readonly.test.js`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_..._v0.2.md`
- `docs/reports/2026-05-05/LAUNCH_SMOKE_MATRIX_..._v0.1.report.md`

## Open Items

- `/about` and `/contacts` remain owner/content blockers until approved content is published through Content Core.
- `runtime.version` and `runtime.commit` are still `null` in readiness because runtime env does not inject `APP_VERSION` / `APP_COMMIT_SHA`.
- Optional media smoke remains `not_configured`; add a stable known public media URL later without creating test assets.
- The deploy workflow still uses direct curl health/readiness probes. It can later call `npm run smoke:launch` from the runner if TLS/host-header execution is standardized.

## Git Status

At report authoring:

```text
## main...origin/main
M docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_..._v0.2.md
M package.json
?? scripts/smoke-launch-readonly.mjs
?? tests/smoke-launch-readonly.test.js
?? docs/reports/2026-05-05/LAUNCH_SMOKE_MATRIX_..._v0.1.report.md
```

Expected final delivery status after commit: clean `main` in sync with `origin/main`.
