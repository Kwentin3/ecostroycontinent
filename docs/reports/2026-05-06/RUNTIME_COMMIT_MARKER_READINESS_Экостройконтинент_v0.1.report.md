# RUNTIME_COMMIT_MARKER_READINESS_Ecostroycontinent_v0.1

Date: 2026-05-06

## Executive Verdict

`DEPLOYED_RUNTIME_REVISION_NOW_PROVABLE`.

`/api/readiness` now exposes a safe runtime marker with Node version, app version, commit SHA, and build time. Production readiness proves both DB-backed readiness and the exact deployed commit running inside the container.

## Baseline

Canonical worktree before changes:

```text
git status --short --branch
## main...origin/main

git branch --show-current
main

git rev-parse --short HEAD
c7bfef3
```

Production readiness before deploy:

```json
{
  "status": "ready",
  "service": "next-app",
  "nodeEnv": "production",
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

Server runtime before deploy:

```text
APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03
Container Id=3d3bb3501202f6643a0a49b1c76b54b0d4ad70d53822cb06e3896fd5e8f80740
Image Id=sha256:68f5ac23a5f986c5d51946f63c3374c36853480f4e4b1dbc98309eb03bfc2a40
OCI revision=54489169aa2f7f42bde1520b113ed276fa6bf950
APP_COMMIT_SHA=<empty>
APP_VERSION=<empty>
BUILD_TIME=<empty>
```

Strict launch smoke before deploy:

```text
APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true npm run smoke:launch
summary.failed=1
failed check=/api/readiness#runtime.commit
reason=runtime commit marker missing
```

This was the expected baseline failure on the old production image.

## What Changed

Runtime marker formation:

1. `.github/workflows/build-and-publish.yml` derives:
   - `APP_COMMIT_SHA=${{ github.sha }}`
   - `APP_VERSION` from `package.json`
   - `BUILD_TIME` from UTC build time.
2. The workflow passes these values as Docker build args.
3. `Dockerfile` stores them as runner image `ENV`.
4. `lib/health/readiness.js` reads only safe marker env keys and exposes:
   - `runtime.node`
   - `runtime.version`
   - `runtime.commit`
   - `runtime.buildTime`
5. `scripts/smoke-launch-readonly.mjs` supports `EXPECT_RUNTIME_COMMIT=true` and fails if readiness has no commit marker.
6. `.github/workflows/deploy-phase1.yml` deploy smoke now requires:
   - `database.status=ok`
   - `runtime.commit` matching a SHA-like value.

Safety:

- No env dump is exposed.
- No DB URL, token, secret, internal host, or stack trace is exposed.
- Commit marker is accepted only as a 7-40 character hex SHA.
- Version marker is restricted to a short safe version string.
- Build time must parse as a date.

## Changed Files

- `.github/workflows/build-and-publish.yml`
- `.github/workflows/deploy-phase1.yml`
- `Dockerfile`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_..._v0.2.md`
- `lib/health/readiness.js`
- `scripts/smoke-launch-readonly.mjs`
- `tests/readiness-route.test.js`
- `tests/smoke-launch-readonly.test.js`

Code commit:

```text
fa6d3042c31f891b34e3e6c898fb536f81a0b677
chore: expose runtime commit marker in readiness
```

## Verification Before Commit

Targeted tests:

```text
node --experimental-specifier-resolution=node --test tests/readiness-route.test.js
5 tests passed

node --experimental-specifier-resolution=node --test tests/smoke-launch-readonly.test.js
5 tests passed
```

Full local checks:

```text
npm test
464 tests passed

npm run build
passed on Next.js 16.2.4

git diff --check
passed
```

`git diff --check` emitted only standard Windows LF-to-CRLF warnings for touched text files.

Closed-world/runtime packaging evidence:

- GitHub Actions build run `25426449353` succeeded.
- The workflow's runtime image verification built the image with marker build args, ran the image, checked required DB migrations, and asserted `APP_COMMIT_SHA`, `APP_VERSION`, and `BUILD_TIME` exist inside the runtime image.
- No external npm imports were added for the marker path.

## Build Artifact

Build run:

```text
GitHub Actions run: 25426449353
Head SHA: fa6d3042c31f891b34e3e6c898fb536f81a0b677
Conclusion: success
```

Image:

```text
Tag: ghcr.io/kwentin3/ecostroycontinent-app:sha-fa6d304
Pinned digest: ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb
OCI revision: fa6d3042c31f891b34e3e6c898fb536f81a0b677
OCI created: 2026-05-06T09:10:51.696Z
```

## Deploy

Deploy method:

- Manual SSH to `root@178.72.179.66`.
- Updated `/opt/ecostroycontinent/runtime/app-image.env` to the pinned digest.
- Ran `docker compose pull app`.
- Ran `docker compose up -d --no-deps app`.
- Did not run migrations.
- Did not restart or mutate Postgres.
- Did not change env secrets.
- Did not change Traefik labels.
- Did not change Content Core, publish workflow, media delivery mode, lead domain, Yandex Metrika, or fallback public content.

Server runtime after deploy:

```text
APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb
Container Id=d77029ced6322e5430382e79611489ad09468859bdb6365bbd42fe360caa9ddf
Image Id=sha256:b674a804154c3864601069a05b5cf6301a6b272271972d4880c29acc677ed3e3
RestartCount=0
Status=running
StartedAt=2026-05-06T09:14:18.251314488Z
```

Runtime env marker inside the container:

```text
APP_COMMIT_SHA=fa6d3042c31f891b34e3e6c898fb536f81a0b677
APP_VERSION=0.1.0
BUILD_TIME=2026-05-06T09:10:53Z
```

Compose status after deploy:

```text
repo-app-1  ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb  Up
repo-sql-1  postgres:16-alpine                                                                                               Up 6 weeks (healthy)
```

App logs after restart:

```text
Next.js 16.2.4
Ready
```

## Production Readiness After Deploy

`GET https://ecostroycontinent.ru/api/readiness`:

```json
{
  "status": "ready",
  "service": "next-app",
  "nodeEnv": "production",
  "database": {
    "status": "ok"
  },
  "runtime": {
    "node": "v22.22.2",
    "version": "0.1.0",
    "commit": "fa6d3042c31f891b34e3e6c898fb536f81a0b677",
    "buildTime": "2026-05-06T09:10:53Z"
  }
}
```

Acceptance:

- HTTP status: `200`.
- `database.status`: `ok`.
- `runtime.commit`: non-null.
- `runtime.commit` matches the deployed code commit `fa6d3042c31f891b34e3e6c898fb536f81a0b677`.
- No secrets are present in the readiness JSON.

## Production Smoke

Command:

```powershell
$env:APP_BASE_URL='https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT='true'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
```

Result:

```json
{
  "runtimeMarker": {
    "version": "0.1.0",
    "commit": "fa6d3042c31f891b34e3e6c898fb536f81a0b677",
    "node": "v22.22.2",
    "buildTime": "2026-05-06T09:10:53Z"
  },
  "summary": {
    "passed": 22,
    "failed": 0,
    "known_content_blocker": 2,
    "skipped": 1
  }
}
```

Manual public route acceptance:

```text
/api/health       200
/api/readiness    200 commit=fa6d3042c31f891b34e3e6c898fb536f81a0b677 database.status=ok
/                 200
/services         200
/cases            200
/robots.txt       200
/sitemap.xml      200
/admin            307 /admin/login
/about            404 known content blocker
/contacts         404 known content blocker
```

## Open Items

- `/about` and `/contacts` remain owner/content blockers until approved Content Core pages are published.
- Optional media smoke is still `not_configured` because no stable known public media URL was provided.
- Future deploy workflow may replace direct curl/grep probes with `npm run smoke:launch` once runner-side Node/npm execution is standardized for post-deploy acceptance.

## Git Status

Before report creation:

```text
## main...origin/main
```

Expected final delivery after committing this report: clean `main` in sync with `origin/main`.
