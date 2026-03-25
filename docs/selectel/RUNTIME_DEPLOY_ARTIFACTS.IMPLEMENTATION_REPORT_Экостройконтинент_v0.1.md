# RUNTIME_DEPLOY_ARTIFACTS.IMPLEMENTATION_REPORT_Экостройконтинент_v0.1

## 1. Summary

Этот implementation pass закрыл исходный repository-level blocker: в репозитории теперь есть минимальный честный app/runtime surface и обязательный набор phase-1 runtime/deploy artifacts.

Итоговый статус:

- `runtime/deploy baseline artifacts implemented`

## 2. Files Created

### Repo-level app baseline created to remove the blocker

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `lib/runtime-config.js`
- `app/layout.js`
- `app/page.js`
- `app/admin/page.js`
- `app/api/health/route.js`

### Required runtime/deploy artifacts implemented

- `Dockerfile`
- `compose.yaml`
- `.github/workflows/build-and-publish.yml`
- `.env.example`
- `.dockerignore`

## 3. Why This Minimal Set Was Implemented

Изначальный blocker был не в Selectel auth и не в infra contract design, а в отсутствии app layer в repo.

Чтобы честно реализовать runtime/deploy artifacts, сначала понадобился минимальный repo bootstrap, который:

- materializes `next-app` as an actual runtime surface;
- даёт реальный `build` и `start` contract;
- задаёт минимальный server/runtime behavior;
- позволяет собирать container image без speculative placeholders.

После этого были реализованы именно те artifacts, которые уже были утверждены design-pass:

- `Dockerfile`
- `compose.yaml`
- `.github/workflows/build-and-publish.yml`
- `.env.example`
- `.dockerignore`

## 4. Narrow Implementation Decisions Taken

В пределах уже принятого канона были приняты следующие узкие implementation decisions:

- app baseline materialized as `Next.js App Router`
- dependency baseline:
  - `next@16.2.1`
  - `react@19.2.4`
  - `react-dom@19.2.4`
- runtime packaging uses `next.config.mjs` with `output: "standalone"`
- minimal runtime config lives in one server-side entrypoint: `lib/runtime-config.js`
- minimal app surface includes:
  - `/`
  - `/admin`
  - `/api/health`
- Docker runtime image baseline: `node:22-alpine`
- SQL runtime image baseline in compose: `postgres:16-alpine`
- app image naming baseline for GHCR:
  - `ghcr.io/kwentin3/ecostroycontinent-app`
- compose keeps `Traefik` outside the file for now; compose surface only owns `app + sql`
- `sql` persistence hook implemented as named volume `sql_data`
- workflow scope stays build/publish only and does not pretend to perform deploy execution

## 5. Assumptions Made

These assumptions were necessary and already supported by canonical docs:

- project runtime stack = `Next.js + PostgreSQL`
- one runtime app is enough for public surface and future admin surface
- internal app runtime port = `3000`
- `DATABASE_URL` remains the minimal app-to-sql connection contract
- `.env.example` should contain only:
  - app runtime variable(s)
  - app-to-sql connection variable(s)
  - compose/sql variables
  - image reference variable used by the compose surface

## 6. Verification Performed

### Successful verification

- `npm install` completed successfully
- `npm run build` completed successfully
- resulting routes were generated:
  - `/`
  - `/admin`
  - `/api/health`
- `compose.yaml` was parsed successfully as YAML

### Verification limits on current local Windows machine

- `docker build` reached Dockerfile execution, but local Docker failed with Windows-side Linux container backend issue:
  - `failed to start service utility VM ... kernel ... not found`
- `docker compose` / `docker-compose` is not usable in the current local machine state:
  - compose plugin/command is absent in the available Docker toolchain

Практическая трактовка:

- repo-level artifacts are now implemented honestly;
- local Docker parity on this machine is not fully verifiable because of local engine/tooling state;
- this is no longer a repository blocker.

## 7. Points Intentionally Left Minimal

- no deploy workflow was added
- no stage pipeline was added
- no secrets implementation was added
- no `Traefik` container/service was added into `compose.yaml`
- no broad env matrix was added
- no DB migration framework was added
- no extra services beyond `app + sql` were added

## 8. Remaining Open Points

Implementation-level open points still left intentionally open:

- exact GHCR tagging policy beyond the baseline naming
- exact future deploy workflow shape on self-hosted runner
- exact VM-side secret handoff
- exact `Traefik` attachment to runtime on the host
- exact rollback operator flow
- exact long-term DB integration details inside the app layer

## 9. Readiness for Provisioning Retry

С точки зрения repository surface проект теперь готов к повторному baseline provisioning pass.

The original repo blocker is closed because:

- app runtime surface exists
- Docker build surface exists
- compose runtime surface exists
- GHCR build/publish workflow exists
- env/secrets boundary surface exists
- build context boundary exists

What may still need separate attention before or during the next provisioning retry:

- working Docker Linux-container backend on the operator machine if local container verification is required there
- VM-side deploy execution and runner setup
- real secrets handoff outside repo
