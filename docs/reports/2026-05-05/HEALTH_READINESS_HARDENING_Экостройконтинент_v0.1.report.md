# HEALTH_READINESS_HARDENING_Ecostroycontinent_v0.1

Date: 2026-05-05
Revalidated after branch collapse: 2026-05-06

## Executive Verdict

`LAUNCH_RISK_TECH_DEBT_REDUCED`.

The app now has a DB-backed readiness endpoint. `/api/health` remains a lightweight liveness endpoint, while `/api/readiness` returns HTTP 200 only when the application runtime can complete a safe PostgreSQL probe through the existing DB helper path.

The implementation was built, tested, deployed to production, and re-smoked on 2026-05-06 from the canonical `main` worktree.

## Current Main Baseline

Commands captured in the canonical worktree:

```text
git status --short --branch
## main...origin/main

git branch --show-current
main

git rev-parse --short HEAD
b34db54

node -v
v22.19.0

npm -v
11.6.2
```

Worktree status:

```text
git worktree list
d:/Users/Roman/Desktop/Proekty/sait Armen repair  b34db54 [main]
```

At the start of the 2026-05-06 revalidation there were no unrelated dirty files in this worktree.

## State Before The Change

`app/api/health/route.js` was shallow:

```js
import { getRuntimeConfig } from "../../../lib/runtime-config";

export async function GET() {
  const config = getRuntimeConfig();

  return Response.json({
    status: "ok",
    service: "next-app",
    nodeEnv: config.nodeEnv,
    databaseConfigured: config.databaseConfigured
  });
}
```

This proved only that `DATABASE_URL` was configured, not that PostgreSQL was reachable or that DB-backed public routes could work.

Before hardening, deploy workflow checks used `/api/health` as the post-deploy probe. After hardening, `.github/workflows/deploy-phase1.yml` checks both `/api/health` and `/api/readiness`.

Current code search:

```text
.github/workflows/deploy-phase1.yml:107 curl ... /api/health
.github/workflows/deploy-phase1.yml:108 curl ... /api/readiness
.github/workflows/deploy-phase1.yml:113 curl ... /api/health
.github/workflows/deploy-phase1.yml:114 curl ... /api/readiness
```

Older runbooks and historical reports still mention `/api/health`; they are documentation cleanup, not runtime blockers.

## Implementation Choice

Chosen approach: keep `/api/health` as liveness and add `/api/readiness` as strict readiness.

Reason:

- It preserves the existing `/api/health` response contract.
- Readiness now has an explicit failure contract with HTTP 503.
- Missing `/about` and `/contacts` content remains outside readiness.
- The endpoint is public-safe because it exposes status only, not DB connection details.

## Files Changed By The Readiness Commit

Readiness implementation commit:

```text
54489169aa2f7f42bde1520b113ed276fa6bf950
fix: add DB-backed readiness probe
```

Changed files:

- `.github/workflows/deploy-phase1.yml`
- `app/api/readiness/route.js`
- `lib/db/client.js`
- `lib/health/readiness.js`
- `lib/runtime-config.js`
- `tests/readiness-route.test.js`

## Readiness Contract

Success:

```json
{
  "status": "ready",
  "service": "next-app",
  "nodeEnv": "production",
  "timestamp": "2026-05-06T08:29:40.391Z",
  "database": {
    "status": "ok"
  },
  "runtime": {
    "node": "v22.22.2",
    "version": null,
    "commit": null
  }
}
```

Failure:

- HTTP status: `503`.
- Body `status`: `not_ready`.
- `database.status`: `error` or `not_configured`.
- No connection string, DB host, DB user, DB name, stack trace, SQL error, token, or secret value is returned.

DB probe:

- Uses the existing `lib/db/client.js` pool path.
- Executes read-only `SELECT 1 AS ok`.
- Mutates no data.
- Does not inspect Content Core publication state.
- Does not treat `/about` or `/contacts` absence as readiness failure.

## Test Coverage

`tests/readiness-route.test.js` covers:

- success path;
- DB failure path;
- missing DB config path;
- absence of secret leakage in serialized JSON;
- terminal route status code and response headers.

The failure test injects an error containing a fake PostgreSQL URL and password, then asserts that the serialized readiness response does not include the URL, password, `DATABASE_URL`, or internal error message.

## Local Verification

Commands run after the branch collapse on canonical `main`:

```text
npm ci
```

Passed.

```text
npm test
```

Passed: `458` tests.

```text
npm run build
```

Passed on Next.js `16.2.4`; `/api/readiness` appears in the App Router build output.

```text
git diff --check
```

Passed.

Closed-world packaging check:

- `.next/server/app/api/readiness/route.js.nft.json` includes packaged `next`, `pg`, `pg-pool`, and related PostgreSQL runtime dependencies.
- The readiness route does not rely on workspace-only imports.

Local live DB smoke was not run because this clean worktree has no local `.env` / `DATABASE_URL`. The real DB path was verified on production after deploy.

## Deploy

Image build:

```text
GitHub Actions run: 25366836776
Image tag: ghcr.io/kwentin3/ecostroycontinent-app:sha-5448916
Image digest: sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03
```

Deploy method:

- Manual SSH deploy to `root@178.72.179.66`.
- Updated `/opt/ecostroycontinent/runtime/app-image.env` to the pinned GHCR digest.
- Pulled the app image.
- Recreated/restarted only the app container through Docker Compose.
- Did not run migrations.
- Did not change PostgreSQL.
- Did not change env secrets.
- Did not change Traefik labels.
- Did not change Content Core, publish workflow, media delivery mode, lead domain, Yandex Metrika, or fallback public content.

## Server Baseline And Runtime After Deploy

Current runtime path evidence:

```text
/opt/ecostroycontinent/repo/compose.yaml
/opt/ecostroycontinent/runtime/app-image.env
```

Docker Compose status on 2026-05-06:

```text
repo-app-1  ghcr.io/kwentin3/ecostroycontinent-app@sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03  Up 24 hours  127.0.0.1:3000->3000/tcp
repo-sql-1  postgres:16-alpine                                                                                               Up 6 weeks (healthy)
```

App container:

```text
Id=3d3bb3501202f6643a0a49b1c76b54b0d4ad70d53822cb06e3896fd5e8f80740
Image=sha256:68f5ac23a5f986c5d51946f63c3374c36853480f4e4b1dbc98309eb03bfc2a40
RestartCount=0
Status=running
StartedAt=2026-05-05T08:55:27.597926056Z
```

Container labels:

```text
org.opencontainers.image.revision=54489169aa2f7f42bde1520b113ed276fa6bf950
org.opencontainers.image.version=chore-health-readiness-hardening
org.opencontainers.image.source=https://github.com/Kwentin3/ecostroycontinent
```

Container package check:

```text
node -v
v22.22.2

npm ls next --depth=0 --omit=dev
next@16.2.4
```

Startup log evidence:

```text
Next.js 16.2.4
Ready
```

Recent production logs after the 2026-05-06 smoke window were empty. An older log tail contained repeated Next Server Action lookup errors for action `"x"` from stale/newer/older client requests; they did not cause a crash loop, restart, readiness failure, or public smoke failure. Treat as a low-priority noisy-log follow-up if it recurs.

## Production Smoke

Manual public HTTP smoke on 2026-05-06:

```text
/api/health       200  {"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}
/api/readiness    200  {"status":"ready","service":"next-app","nodeEnv":"production","timestamp":"2026-05-06T08:29:40.391Z","database":{"status":"ok"},"runtime":{"node":"v22.22.2","version":null,"commit":null}}
/                 200
/services         200
/cases            200
/robots.txt       200
/sitemap.xml      200
/admin            307  /admin/login
/about            404
/contacts         404
```

The readiness body contains no secrets, no connection string, no host, no DB user, no DB name, and no stack trace.

Smoke script:

```text
APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:public-admin
```

Passed:

```json
{
  "publicSummary": {
    "ok": 3,
    "missing_or_unpublished": 2,
    "failed": 0
  },
  "adminSummary": {
    "redirect": 5,
    "failed": 0
  }
}
```

The first smoke-script attempt on 2026-05-06 was accidentally run without `APP_BASE_URL` and failed with `fetch failed`; it was an operator invocation error, not a production failure. The corrected run above passed.

## Safety Confirmation

- `/api/health` was not broken.
- `/api/readiness` is unauthenticated but public-safe.
- DB readiness uses read-only `SELECT 1 AS ok`.
- DB failure maps to HTTP 503, not false `ok`.
- No data mutation was added.
- No destructive migration was run.
- No secrets were exposed in responses, tests, or docs.
- No fallback content was added for `/about` or `/contacts`.

## Remaining Open Items

- `/about` and `/contacts` still need approved owner-provided content and publication through Content Core.
- `runtime.version` and `runtime.commit` are currently `null` in `/api/readiness` because `APP_VERSION` / `APP_COMMIT_SHA` are not injected into runtime env. The deployed commit is still available through the container OCI revision label.
- Update older runbooks that still describe `/api/health` as the only post-deploy probe.
- `npm audit --audit-level=high` passed earlier, but `npm audit` still reports moderate advisories; keep them as separate dependency-security backlog.

## Git Status Evidence

Before this report refresh:

```text
git status --short --branch
## main...origin/main
```

Expected after committing this report refresh: `main` clean and in sync with `origin/main`.
