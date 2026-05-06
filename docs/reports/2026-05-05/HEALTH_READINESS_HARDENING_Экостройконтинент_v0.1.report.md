# HEALTH_READINESS_HARDENING_Экостройконтинент_v0.1

Date: 2026-05-05

## Executive verdict

`LAUNCH_RISK_TECH_DEBT_REDUCED`.

The app now has a DB-backed readiness endpoint. `/api/health` remains a lightweight liveness endpoint, while `/api/readiness` returns 200 only after a safe PostgreSQL probe succeeds. The change was deployed to production and smoke-tested through the public domain.

## Baseline before changes

- Branch/worktree used for this task: `chore/health-readiness-hardening` in `d:\Users\Roman\Desktop\Проекты\сайт Армен readiness-hardening`.
- Base commit before implementation: `7d303a7`.
- Node: `v22.19.0`.
- npm: `11.6.2`.
- Existing `/api/health` returned only:
  - `status: ok`
  - `service: next-app`
  - `nodeEnv`
  - `databaseConfigured`
- `/api/health` was used in `.github/workflows/deploy-phase1.yml` as the post-deploy probe.

Production baseline before deploy:

- Host: `178.72.179.66`.
- App container before: `9d655a0cdf42d0616d4e3b6cd100411a6e08c0e4e1e3e5986834410189d0dd91`.
- App image id before: `sha256:20a585f6cb9f1c04d04b062edab4899e19d09689bd0484619be271fdb34aeb1f`.
- App image env before: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:22b6c7b31d39873d52dba4b9762160fdaec7a216a944d38800ba56116ab6a218`.
- App revision label before: `cf0e952e202d2978749f05f178ba229f10a9255c`.
- Public baseline:
  - `/api/health`: 200
  - `/`: 200
  - `/services`: 200
  - `/cases`: 200
  - `/robots.txt`: 200
  - `/sitemap.xml`: 200
  - `/admin`: 307 to `/admin/login`
  - `/about`: 404, known content-state blocker
  - `/contacts`: 404, known content-state blocker

## What changed

Chosen approach: keep `/api/health` as liveness and add `/api/readiness` as stricter readiness.

Reason:

- Existing deploy and monitoring surfaces can keep using a cheap health endpoint.
- Readiness now has a separate failure contract with DB-backed proof.
- Missing `/about` and `/contacts` content does not affect readiness.

Changed files:

- `.github/workflows/deploy-phase1.yml`
  - Post-deploy probe now checks both `/api/health` and `/api/readiness`.
- `app/api/readiness/route.js`
  - New public-safe readiness route.
  - Returns `Cache-Control: no-store, max-age=0`.
  - Returns `X-Robots-Tag: noindex, nofollow`.
- `lib/db/client.js`
  - Added `checkDatabaseConnectivity()` using the existing DB helper path.
- `lib/health/readiness.js`
  - Builds the readiness JSON and maps DB failures to 503.
- `lib/runtime-config.js`
  - Changed extensionless `./config` import to `./config.js` so direct Node tests can import the runtime config path.
- `tests/readiness-route.test.js`
  - Covers success, DB failure, missing DB config, safe JSON redaction, and route status/headers.

## Readiness contract

Success:

```json
{
  "status": "ready",
  "service": "next-app",
  "nodeEnv": "production",
  "timestamp": "2026-05-05T08:56:06.412Z",
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
- Body status: `not_ready`.
- `database.status`: `error` or `not_configured`.
- No connection string, DB host, DB user, stack trace, SQL error, or secret value is returned.

DB probe:

- Uses existing `lib/db/client.js` pool path.
- Executes read-only `SELECT 1 AS ok`.
- Mutates no data.
- Does not inspect Content Core page publication state.

## Local verification

Commands run:

- `npm ci`: passed.
- `node --experimental-specifier-resolution=node --test tests/readiness-route.test.js`: passed after installing dependencies and correcting the existing ESM import fragility in `lib/runtime-config.js`.
- `npm test`: passed, `458` tests.
- `npm run build`: passed on Next.js `16.2.4`; `/api/readiness` appears in the App Router build output.
- `git diff --check`: passed with CRLF normalization warnings only.

Local live DB smoke was not run because this clean worktree has no local `.env` / `DATABASE_URL`. The real DB path was verified on production after deploy.

## Build and deploy

Code commit:

- `54489169aa2f7f42bde1520b113ed276fa6bf950`
- Message: `fix: add DB-backed readiness probe`

Push:

- Branch pushed: `origin/chore/health-readiness-hardening`.

Image build:

- GitHub Actions run: `25366836776`.
- Image tag: `ghcr.io/kwentin3/ecostroycontinent-app:sha-5448916`.
- Image digest: `sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03`.

Deploy method:

- Manual SSH deploy to `root@178.72.179.66`.
- Updated `/opt/ecostroycontinent/runtime/app-image.env` to the pinned GHCR digest.
- Ran `docker compose pull app`.
- Ran `docker compose up -d app`.
- Did not run migrations.
- Did not change Postgres, env secrets, Traefik labels, media delivery mode, Content Core, or public content.

## Production status after deploy

- App container after: `3d3bb3501202f6643a0a49b1c76b54b0d4ad70d53822cb06e3896fd5e8f80740`.
- App image id after: `sha256:68f5ac23a5f986c5d51946f63c3374c36853480f4e4b1dbc98309eb03bfc2a40`.
- App image env after: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:a189414cd93359febf47f809dff190d7cc97bc6927fa0eaa1d9981d79bc77c03`.
- App revision label after: `54489169aa2f7f42bde1520b113ed276fa6bf950`.
- Restart count after deploy: `0`.
- Startup logs:
  - `Next.js 16.2.4`
  - `Ready`
- Container package check:
  - `npm ls next --depth=0` inside container reports `next@16.2.4`.

Production smoke:

- `/api/health`: 200.
- `/api/readiness`: 200, `database.status: ok`.
- `/`: 200.
- `/services`: 200.
- `/cases`: 200.
- `/robots.txt`: 200.
- `/sitemap.xml`: 200.
- `/admin`: 307 to `/admin/login`.
- `/about`: 404, still the known owner/content blocker.
- `/contacts`: 404, still the known owner/content blocker.
- Sitemap check: `/about` and `/contacts` are absent.

Smoke script:

- First `APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:public-admin` attempt failed with transient `[smoke] FAILED: terminated`.
- Manual Node fetch and curl checks immediately after that succeeded for the same route set.
- Re-run of `APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:public-admin` passed:
  - public summary: `ok: 3`, `missing_or_unpublished: 2`, `failed: 0`.
  - admin summary: `redirect: 5`, `failed: 0`.

## Safety confirmation

- Runtime behavior changed only by adding readiness and updating deploy smoke to check it.
- `/api/health` response contract was not broken.
- No DB writes were added.
- No migrations were run.
- No fallback content was added for `/about` or `/contacts`.
- No secrets, connection strings, DB names, DB users, tokens, or stack traces are returned by `/api/readiness`.
- No secrets were added to code, tests, or this report.

## Remaining open items

- `/about` and `/contacts` remain a separate owner/content blocker: publish approved Content Core pages, not fake fallback content.
- `runtime.commit` and `runtime.version` in `/api/readiness` are `null` because `APP_COMMIT_SHA` / `APP_VERSION` are not currently injected into the app runtime env. The container OCI label does carry the deployed commit.
- The project may later add a production smoke script that checks `/api/readiness` directly, instead of relying on manual curl plus deploy workflow checks.

## Git status

At report authoring:

```text
## chore/health-readiness-hardening...origin/chore/health-readiness-hardening
?? docs/reports/2026-05-05/HEALTH_READINESS_HARDENING_Экостройконтинент_v0.1.report.md
```

Expected final delivery status after committing and pushing this report: branch clean, original `сайт Армен repair` worktree still has unrelated pre-existing documentation/out drift from earlier tasks.
