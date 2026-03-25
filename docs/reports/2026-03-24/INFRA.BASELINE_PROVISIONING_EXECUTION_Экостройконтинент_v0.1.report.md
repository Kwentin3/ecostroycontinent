# INFRA.BASELINE_PROVISIONING_EXECUTION_Экостройконтинент_v0.1.report

## Purpose

Этот отчёт фиксирует детальный factual outcome execution-pass по базовому phase-1 provisioning проекта «Экостройконтинент».

Он не переопределяет infra-канон и не подменяет operational docs в `docs/selectel`. Его задача:

- показать, что именно было проверено;
- отделить реально выполненное от заблокированного;
- зафиксировать reproducible blockers;
- дать следующий узкий шаг без переоткрытия архитектуры.

## Executive Summary

Итоговый статус прохода: `baseline provisioning blocked`.

Cloud resource creation не начался, потому что execution остановился на двух подтверждённых блокерах:

1. Selectel auth не был подтверждён как рабочий для provisioning.
2. В репозитории отсутствуют runtime/deploy manifests, без которых нельзя честно завершить phase-1 runtime/deploy baseline.

При этом control-plane часть подтвердилась:

- canonical GitHub repo доступен;
- local `origin` указывает на canonical repo;
- `gh` auth работает;
- локальный `docker` доступен;
- `openstack` CLI установлен;
- secret-reference files присутствуют локально и не попали в git.

## Scope and Canon Used

Этот execution-pass выполнялся строго в рамках already accepted baseline:

- provider: `Selectel`
- primary domain: `ecostroycontinent.ru`
- DNS provider: `Selectel`
- current phase-1 TLS posture: `self-signed`
- one VM
- VM sizing: `2 CPU / 2 GB RAM / 30 GB disk`
- runtime posture: one compose stack, `app` + `sql`
- deploy posture: GitHub repo `Kwentin3/ecostroycontinent` + GHCR + self-hosted runner on VM
- storage posture: Selectel S3 with semantic split `media` / `backups`
- CDN for media delivery

Архитектурных решений за пределами канона в этом проходе не принималось.

## Execution Chronology

### 1. Repo and Git control check

Проверено:

- local `origin` points to `https://github.com/Kwentin3/ecostroycontinent.git`
- working tree is available
- repo checkout accessible

Результат:

- git drift по `origin` отсутствует
- GitHub repo `Kwentin3/ecostroycontinent` доступен
- default branch подтверждена как `main`

### 2. Local tooling check

Проверено наличие и базовая работоспособность локальных execution tools.

Подтверждено:

- `docker` available locally
- `docker` client/server version: `19.03.5`
- `gh` available and authenticated
- `python`, `pip`, `bash`, `ssh` available locally

Отсутствовало до pass:

- `openstack` CLI

Что было сделано:

- installed `python-openstackclient 9.0.0`

Результат:

- локальный минимальный cloud CLI baseline был доведён до рабочего состояния без записи секретов в repo

### 3. Secret-reference asset presence check

Проверено только наличие, без вывода значений:

- `docs/selectel/rc.sh`
- `docs/selectel/LOCAL_SECRETS_NOT_FOR_GIT.md`

Результат:

- оба local secret-reference assets присутствуют
- они по-прежнему игнорируются git и не были включены в execution artifacts

### 4. Selectel auth check

Что было проверено:

- наличие expected `OS_*` variables в локальном `rc.sh`
- попытка получить токен через `openstack token issue`

Фактический результат:

- `openstack token issue` returned `HTTP 401`

Практическая трактовка:

- на этом pass Selectel access не может считаться working provisioning access
- пока этот шаг не проходит, создавать VM / buckets / CDN / DNS небезопасно и невалидно

### 5. Runtime/deploy artifact check in repo

Проверялось наличие:

- `docker-compose*.yml|yaml`
- `compose*.yml|yaml`
- `Dockerfile*`
- `.github/workflows`

Фактический результат:

- `NO_RUNTIME_MANIFESTS_FOUND`
- `.github` directory absent

Практическая трактовка:

- даже при исправленном Selectel auth нельзя честно завершить runtime/deploy baseline без minimal implementation artifacts

## What Was Actually Completed

### Completed

- canonical repo alignment confirmed
- GitHub repo access confirmed
- local `origin` already canonical
- `gh auth status` confirmed
- `docker version` confirmed
- `openstack` CLI installed locally
- factual access/runtime blockers reproduced
- factual execution docs produced

### Partial

- Selectel access preparation exists locally as reference material, but cloud auth did not pass runtime validation
- local execution environment is partially ready, but remote execution environment was not created

### Not completed

- VM provisioning
- SSH verification to a provisioned VM
- S3 bucket creation
- CDN creation
- DNS changes
- Traefik setup on remote host
- self-hosted runner setup on remote VM
- GHCR pull validation on remote VM
- compose runtime for `app` + `sql`
- backup upload path to S3
- remote logging / forensic hooks
- remote retention / cleanup hooks

## Agent Decisions Made Within Allowed Scope

Принятые narrow implementation decisions:

- installed `python-openstackclient` locally as minimal missing execution dependency
- did not create placeholder cloud resources after failed auth
- did not fabricate runtime manifests
- did not attempt unsafe secret export into repo-managed files
- did not try to “complete” runtime/deploy baseline by undocumented ad-hoc server mutation

Эти решения не меняют канон и направлены только на безопасную execution verification.

## Confirmed Blockers

### Blocker 1: Cloud auth failure

Observed fact:

- `openstack token issue` failed with `HTTP 401`

Why this blocks execution:

- VM creation requires working provider auth
- bucket/CDN/DNS steps require working provider auth
- no safe workaround exists inside current pass without new valid credentials or corrected auth material

### Blocker 2: Missing runtime/deploy artifacts

Observed fact:

- no compose files
- no Dockerfiles
- no `.github/workflows`

Why this blocks execution:

- accepted deploy/runtime baseline explicitly depends on:
  - image-based deploy
  - compose-managed runtime
  - GitHub/GHCR/runner path
- without these artifacts, runtime/deploy provisioning cannot be honestly completed

## Warnings and Cautions

- Input pack says prepared Selectel access exists, but factual auth on this pass did not succeed.
- GHCR naming, runner method, backup cadence and retention numbers remain open implementation decisions, but they are not the primary blockers.
- The current runbook and inventory should not be read as proof that any remote infrastructure is already live.

## Resources Created by This Pass

### Created cloud resources

- none

### Confirmed control-plane resources/surfaces

- canonical GitHub repo
- canonical local `origin`
- local `docker`
- local `gh` auth
- local `openstack` CLI
- local secret-reference assets

## Deviations From Planned Path

There were no architecture deviations from canon.

The only meaningful deviation from the intended execution sequence was early stop after reproducible blockers:

- provider auth not confirmed
- runtime manifests absent

Это deliberate stop, а не incomplete reporting.

## Related Artifacts Produced in This Pass

- `docs/selectel/INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.1.md`

## Recommended Next Step

Следующий лучший шаг не architectural, а corrective:

1. Repair Selectel service-user auth so that `openstack token issue` succeeds.
2. Add minimal runtime/deploy artifacts to repo:
   - one `Dockerfile` for `app`
   - one compose surface for `app` + `sql`
   - one minimal GitHub Actions workflow for build/publish/deploy
3. Re-run baseline provisioning execution after those two blockers are closed.

## Final Status

- access/env check: completed
- factual blocker verification: completed
- VM/S3/CDN/DNS provisioning: blocked
- runtime/deploy provisioning: blocked
- reporting/runbook/inventory: completed

Overall status:

- `baseline provisioning blocked`
