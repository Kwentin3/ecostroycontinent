# INFRA.PROVISIONING_EXECUTION_Экостройконтинент_v0.2.report

## Executive Status

Retry-pass завершился со статусом:

- `baseline provisioning partially completed`

Что реально удалось закрыть:

- working Selectel auth path
- one working Linux VM in Selectel
- host baseline on VM
- Traefik + self-signed TLS baseline
- one working runtime stack with `app + sql`
- GHCR publication and pull path
- self-hosted GitHub runner on VM
- successful manual deploy workflow execution on the runner
- local backup / logging / cleanup hooks
- S3 bucket creation
- S3-backed backup upload

Что не удалось честно закрыть:

- CDN baseline
- DNS cutover was intentionally not touched

Linux VM была использована как **first canonical Docker validation environment**. Локальное отсутствие Docker parity на Windows не трактовалось как blocker.

## Initial Conditions for Retry

Этот retry-pass выполнялся уже после закрытия двух исходных blockers прошлого прохода:

1. Selectel auth diagnostics были завершены и canonical auth path был подтверждён.
2. Runtime/deploy artifacts были реализованы в repo.

В ходе retry-pass это было перепроверено фактически:

- `openstack token issue` succeeded
- `openstack server list` succeeded
- local `origin` already pointed to `https://github.com/Kwentin3/ecostroycontinent.git`
- runtime baseline был запушен в canonical repo

## Source-of-Truth Inputs Used

Во время pass использовались ранее подготовленные документы из `docs/selectel`, включая:

- infrastructure PRD baseline
- input pack
- VM/runtime contract
- deploy/GHCR/runner contract
- Selectel auth diagnostics
- runtime/deploy baseline design
- implementation report and post-implementation gaps
- previous blocked provisioning report

Работа велась без переоткрытия базовой архитектуры и без выхода за accepted canon.

## Execution Chronology

## 1. Access / Env Recheck

### 1.1 Repo and control plane recheck

Было подтверждено:

- canonical repo: `Kwentin3/ecostroycontinent`
- default branch: `main`
- GitHub CLI auth working
- OpenStack CLI available locally
- SSH available locally

### 1.2 Selectel auth recheck

Использован корректный auth path по diagnostics:

- auth data from local `docs/selectel/rc.sh`
- real password path from local non-git secret reference
- validation by `openstack token issue`

Фактический outcome:

- token issued successfully
- project lookup succeeded
- `openstack server list` returned an empty list, which was acceptable for a fresh project state

Практический вывод:

- Selectel access blocker из предыдущего pass действительно закрыт

## 2. Canonical Repo Baseline Closure

Хотя runtime artifacts уже были в local working tree, canonical GitHub repo initially did not yet contain them remotely.

Чтобы не имитировать image-based deploy path, сначала была закрыта эта factual gap:

- committed: `4ac33b8` `Add phase-1 runtime baseline`
- pushed to `origin/main`

После этого:

- build/publish workflow existed in canonical repo
- `Dockerfile`, `compose.yaml`, `.env.example` and app code existed in canonical repo
- GHCR build path became honest relative to source of truth

## 3. GHCR Build Path

После push был запущен build/publish workflow.

Фактический outcome:

- GitHub Actions successfully built and published the app image
- VM-side later `docker pull ghcr.io/kwentin3/ecostroycontinent-app:latest` succeeded

Это закрыло минимальный artifact publication path:

- repo -> GitHub Actions -> GHCR

## 4. Cloud Provisioning

## 4.1 Security boundary

Создан security group:

- `ecostroycontinent-phase1`

Ingress rules:

- `tcp/22`
- `tcp/80`
- `tcp/443`

## 4.2 First VM create attempts and provider-side friction

Первая попытка поднять VM через direct attach to `external-network` не завершилась successfully.

Наблюдались фактические provider-side issues:

- invalid availability-zone combination on the first boot attempt
- direct external-network attach later failed with:
  - `Failed to allocate the network(s), not rescheduling`

Эти проблемы не были owner-level decisions. Это были technical placement constraints inside the provider implementation.

## 4.3 Minimal networking workaround inside accepted scope

Чтобы не менять канон, был выбран минимальный practical workaround:

- one private network
- one subnet
- one router to `external-network`
- one floating IP for the single VM

Создано:

- network `ecostroycontinent-phase1-net`
- subnet `ecostroycontinent-phase1-subnet`
- router `ecostroycontinent-phase1-router`
- floating IP `178.72.179.66`

Это не ввело новый architectural layer за пределами phase 1. Это был минимальный provider-compatible networking contour for the same one-VM baseline.

## 4.4 Final successful VM provisioning

Фактически сработала следующая combination:

- AZ: `ru-3b`
- flavor: `PRC10.2-2048`
- boot volume: `30 GB`, type `basic.ru-3b`
- image source: `Ubuntu 24.04 LTS 64-bit`
- keypair: `ssh-agent-codex`
- private fixed IP: `192.168.100.62`
- floating IP: `178.72.179.66`

Created resources:

- server `ecostroycontinent-phase1-vm`
- volume `ecostroycontinent-phase1-root-b`

Exact canonical sizing outcome preserved:

- `2 vCPU`
- `2 GB RAM`
- `30 GB disk`

## 5. SSH and Host Baseline

### 5.1 SSH access

После привязки floating IP SSH network path заработал.

Фактически подтверждено:

- image default login user = `root`
- SSH with local private key succeeded

### 5.2 Host preparation

На VM были установлены:

- Docker Engine
- Docker Compose
- git
- curl
- jq
- openssl
- apache2-utils
- cron

Были подготовлены operational directories:

- `/opt/ecostroycontinent/runtime`
- `/opt/ecostroycontinent/traefik`
- `/opt/ecostroycontinent/scripts`
- `/opt/ecostroycontinent/backups`
- `/var/log/ecostroycontinent`

Фактическая проверка:

- Docker service active
- `docker --version` and `docker compose version` succeeded

## 6. Runtime Baseline on Linux VM

## 6.1 Repo state on host

Canonical repo был cloned на VM в:

- `/opt/ecostroycontinent/repo`

Runtime env был вынесен из repo в:

- `/opt/ecostroycontinent/runtime/.env`

Secrets in repo were not introduced.

## 6.2 Compose runtime

Compose surface used:

- one stack
- `app`
- `sql`

Фактически были подняты:

- `repo-app-1`
- `repo-sql-1`

Database contract was materialized via host-side generated password and `DATABASE_URL`.

## 6.3 Traefik baseline

Traefik был поднят как отдельный host-adjacent container:

- image: `traefik:v3.1`
- host network
- public ports:
  - `80`
  - `443`
- dashboard port:
  - `8080`

Self-signed certificate был создан на VM и подключён в Traefik dynamic config.

## 6.4 First canonical validation

Фактические successful checks:

- `curl -ksSf https://127.0.0.1/api/health`
- `curl.exe -k https://178.72.179.66/api/health`

Returned payload:

- `status=ok`
- service reported as configured

Практический вывод:

- first canonical Linux VM-side runtime validation completed honestly

## 7. Runner and Deploy Baseline

## 7.1 Runner installation

On-VM self-hosted runner был установлен и зарегистрирован against:

- `https://github.com/Kwentin3/ecostroycontinent`

Фактический state:

- runner service installed as systemd unit
- runner online in GitHub
- labels:
  - `self-hosted`
  - `Linux`
  - `X64`
  - `ecostroycontinent-phase1`

## 7.2 Minimal deploy workflow

В canonical repo был добавлен manual deploy workflow.

Intermediate commits on this branch:

- `321a399` `Add phase-1 deploy workflow`
- `23cfa23` `Fix deploy workflow dispatch syntax`
- `5821234` `Fix deploy workflow runtime target`
- `00faf26` `Use runner workspace for deploy compose`

## 7.3 Honest failures during deploy-path hardening

До финального successful run были две реальные failure iterations:

### Failure 1

Workflow created a second compose project and hit:

- `Bind for 127.0.0.1:3000 failed: port is already allocated`

Практическая причина:

- deploy job tried to raise a parallel compose project instead of updating the canonical runtime project

### Failure 2

Workflow tried to sync the host repo checkout and failed because that checkout was root-owned.

Практическая причина:

- unnecessary coupling between runner workspace and host repo mutation

Обе проблемы были исправлены без redesign:

- deploy was switched to operate through one canonical compose project name
- runner now deploys from its own checkout while still targeting the canonical runtime project

## 7.4 Final successful deploy run

Фактический successful deploy evidence:

- workflow `deploy-phase1`
- run ID `23498311265`
- status `success`

Run succeeded through:

- self-hosted runner on VM
- GHCR login
- compose update
- Traefik-backed health probe

Это означает, что minimal deploy baseline теперь не только declared, but executed successfully in reality.

## 8. Backup / Logging / Retention

## 8.1 Local backup baseline

Был реализован local PostgreSQL backup script:

- `/opt/ecostroycontinent/scripts/backup-db-local.sh`

Фактический artifact:

- `/opt/ecostroycontinent/backups/local/postgres-20260324T154151Z.sql.gz`

## 8.2 Logging / traceability baseline

Фактически используются следующие operational log surfaces:

- `/var/log/ecostroycontinent/traefik.log`
- `/var/log/ecostroycontinent/access.log`
- `/var/log/ecostroycontinent/backup.log`
- `/var/log/ecostroycontinent/cleanup.log`
- runner systemd journal
- Docker container logs
- GitHub Actions run logs

Этого уже достаточно для phase-1 troubleshooting and basic incident reconstruction.

## 8.3 Retention / cleanup baseline

Были подготовлены:

- cleanup script `/opt/ecostroycontinent/scripts/docker-retention.sh`
- cron file `/etc/cron.d/ecostroycontinent-baseline`
- logrotate file `/etc/logrotate.d/ecostroycontinent`

Cron schedule:

- `02:15` local DB backup
- `03:15` cleanup

Практический смысл:

- finite 30 GB disk is protected against uncontrolled leftovers
- logs are bounded
- temporary backup artifacts are bounded

## 9. Storage / CDN / DNS Branch

## 9.1 S3 branch

Observed fact:

- earlier credential attempts failed with `InvalidAccessKeyId`
- after `docs/selectel/LOCAL_SECRETS_NOT_FOR_GIT.md` was refreshed, both bucket credential pairs authenticated successfully at `https://s3.ru-3.storage.selcloud.ru`
- globally unique semantic buckets were created:
  - `ecostroycontinent-media-ru3-20260324`
  - `ecostroycontinent-backups-ru3-20260324`
- `media` bucket was later switched to `public` through the Selectel Object Storage API
- off-host backup upload was materialized from the Linux VM into:
  - `s3://ecostroycontinent-backups-ru3-20260324/postgres/postgres-20260324T175012Z.sql.gz`

## 9.2 CDN branch

Не был завершён, потому что:

- CDN API access itself was confirmed with an account-scoped IAM token
- the factual bucket public origin was later confirmed as:
  - `https://5136cb12-b86a-4094-9a63-f17da3df1443.selstorage.ru`
- a CDN resource was then created successfully:
  - `ecostroycontinent-media-cdn`
  - resource id `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd`
  - default CDN domain `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net`
- however, at the time of this report update the resource was still in `creating`, and the default CDN domain was not yet externally serving the probe object

## 9.3 DNS branch

Не изменялся intentionally.

Practical reason:

- DNS mutation was not necessary for first canonical VM-side validation
- changing public DNS while CDN branch remained incomplete would not improve honesty of the baseline

## 10. Resources Actually Created

### Cloud

- `ecostroycontinent-phase1-vm`
- `ecostroycontinent-phase1-root-b`
- `ecostroycontinent-phase1-net`
- `ecostroycontinent-phase1-subnet`
- `ecostroycontinent-phase1-router`
- floating IP `178.72.179.66`
- security group `ecostroycontinent-phase1`

### Runtime / Host

- Docker host baseline
- Traefik container
- app container
- sql container
- self-hosted GitHub runner service
- local backup artifacts directory
- backup S3 env file on VM
- retention/logrotate/cron hooks

### Repo / Deploy

- runtime baseline committed to canonical repo
- deploy workflow committed to canonical repo
- successful GHCR publication
- successful self-hosted deploy workflow execution

## 11. Honest Partial / Blocked State

### Completed

- access recheck
- VM provisioning
- host baseline
- Traefik baseline
- Linux VM runtime validation
- runner baseline
- GHCR pull path
- successful deploy baseline
- local backup/logging/retention baseline
- S3 storage baseline

### Partial

- backup baseline
  - local yes
  - off-host S3 yes
- CDN baseline
  - resource yes
  - externally serving traffic not yet confirmed
- forensic baseline
  - enough for phase 1 troubleshooting
  - not yet extended to CDN/public-delivery branch

### Blocked

- none

### Deferred intentionally

- public DNS changes

## 12. Warnings Worth Preserving

### Provider placement friction

Observed during pass:

- not all AZ/flavor combinations accepted the requested shape
- direct external-network attach did not work as a stable provisioning path

This was resolved, but it should remain documented.

### GitHub Actions Node 20 deprecation warning

Successful deploy run still emitted a deprecation warning for action versions that currently run on Node 20.

This does not block phase 1 now, but should be cleaned up in a follow-up workflow hygiene pass.

## 13. Final Verdict

This retry-pass did **not** end in a blocked state.

It also should **not** be reported as fully completed, because CDN/public delivery remained unresolved.

The honest final verdict is:

- `baseline provisioning partially completed`

The project now has a real minimal infra contour:

- one VM
- one public floating IP
- working SSH
- Docker runtime
- Traefik ingress
- app + sql
- GHCR-based image path
- self-hosted runner
- successful runner-driven deploy
- local operational runbook surfaces

The next narrow corrective pass should focus on:

1. materializing CDN over media;
2. recording the factual media delivery path;
3. deciding whether to do DNS cutover;
4. running one restore drill from the uploaded S3 backup;
5. adding remote lifecycle/retention for the backups bucket.
