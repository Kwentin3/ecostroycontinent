# INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.2

## Purpose

Этот документ фиксирует factual outcome retry provisioning pass для phase-1 baseline проекта «Экостройконтинент».

Linux VM была использована как **first canonical Docker validation environment**. Отсутствие локального Docker/WSL2 parity на Windows не трактовалось как blocker.

## Planned Scope

План retry-pass был таким:

1. перепроверить access/env;
2. создать минимальный cloud contour;
3. подготовить Linux host baseline;
4. поднять Traefik + compose runtime;
5. подготовить self-hosted runner и GHCR-based deploy path;
6. заложить backup / logging / retention baseline;
7. выпустить factual docs.

## What Was Actually Completed

### Access and control plane

- Selectel auth был подтверждён рабочим:
  - `openstack token issue` succeeded
  - `openstack server list` succeeded
- Canonical repo `Kwentin3/ecostroycontinent` доступен.
- Runtime baseline был закоммичен и pushed в canonical repo:
  - `4ac33b8` `Add phase-1 runtime baseline`
- Manual deploy workflow был добавлен и доведён до рабочего состояния:
  - `00faf26` `Use runner workspace for deploy compose`

### Cloud resources

Создано фактически:

- security group `ecostroycontinent-phase1`
- private network `ecostroycontinent-phase1-net`
- subnet `ecostroycontinent-phase1-subnet` (`192.168.100.0/24`)
- router `ecostroycontinent-phase1-router`
- floating IP `178.72.179.66`
- VM `ecostroycontinent-phase1-vm`
- boot volume `ecostroycontinent-phase1-root-b`

### VM baseline

На VM фактически подготовлено:

- Ubuntu `24.04.4 LTS`
- Docker Engine `28.2.2`
- Docker Compose `2.37.1`
- git / curl / jq / openssl / apache2-utils
- SSH access подтверждён

### Traefik / runtime baseline

Фактически поднято:

- `Traefik` как отдельный host-adjacent container в host network
- self-signed TLS certificate
- one runtime stack с двумя main containers:
  - `repo-app-1`
  - `repo-sql-1`

Фактическая проверка:

- `https://127.0.0.1/api/health` on VM returns `{"status":"ok",...}`
- `https://178.72.179.66/api/health` returns the same health payload with self-signed TLS

Follow-up factual improvement from `2026-03-24`:

- a real Let's Encrypt certificate was later installed on Traefik
- current certificate SANs cover:
  - `ecostroycontinent.ru`
  - `www.ecostroycontinent.ru`
- public health over domain HTTPS is now materially closed on the server side

### Deploy baseline

Фактически подготовлено:

- GHCR image publication path works
- app image pulled on VM from GHCR
- self-hosted runner installed on VM as systemd service
- runner is online in GitHub with labels:
  - `self-hosted`
  - `Linux`
  - `X64`
  - `ecostroycontinent-phase1`
- manual deploy workflow `deploy-phase1` is active and successfully executed on the runner

Successful factual deploy evidence:

- workflow run `23498311265` completed with `success`
- runner updated the compose-managed app runtime and passed health probe through Traefik

### Logging / forensic / retention baseline

Фактически подготовлено:

- host-local runtime logs in `/var/log/ecostroycontinent`
- Traefik access/error logs mounted into the same log surface
- local backup log and cleanup log
- logrotate rule for `/var/log/ecostroycontinent/*.log`
- `fail2ban` installed and enabled with active `sshd` jail
- SSH password authentication confirmed disabled
- cron hooks:
  - `02:15` local PostgreSQL backup
  - `03:15` Docker/log cleanup

### Backup baseline

Фактически подготовлено:

- local PostgreSQL backup script
- verified local artifact:
  - `/opt/ecostroycontinent/backups/local/postgres-20260324T154151Z.sql.gz`
- S3-backed backup upload path from the Linux VM
- verified off-host artifact:
  - `s3://ecostroycontinent-backups-ru3-20260324/postgres/postgres-20260324T175012Z.sql.gz`

### S3 buckets

Выполнено:

- `media` bucket created:
  - `ecostroycontinent-media-ru3-20260324`
  - bucket type set to `public` through Selectel Object Storage API
- `backups` bucket created:
  - `ecostroycontinent-backups-ru3-20260324`

Observed fact:

- earlier credential attempts failed with `InvalidAccessKeyId`
- after secret-pack refresh, bucket operations authenticated successfully on the working `ru-3` endpoint path

## What Was Not Completed

### CDN baseline

Partial:

- CDN resource was created
- default CDN domain was assigned
- object fetch through CDN is confirmed on HTTP object path
- HTTPS fetch through the default CDN domain is not yet confirmed as healthy

Practical reason:

- CDN API access was confirmed
- the factual bucket public origin was later confirmed as:
  - `https://5136cb12-b86a-4094-9a63-f17da3df1443.selstorage.ru`
- CDN resource was created:
  - name: `ecostroycontinent-media-cdn`
  - ID: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd`
  - default domain: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net`
- current factual serving state:
  - `http://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt` returns `200 OK`
  - `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt` is still not confirmed healthy from the operator side

### DNS baseline

Не выполнено:

- no DNS records were created or changed

Practical reason:

- DNS was not required for first canonical Linux VM-side validation under the accepted self-signed posture
- no safe reason appeared to mutate public DNS during this pass while CDN remained incomplete

Follow-up factual note from `2026-03-24`:

- delegated public DNS was later corrected
- `ecostroycontinent.ru` now resolves to `178.72.179.66`
- `www.ecostroycontinent.ru` now resolves to `178.72.179.66`
- a real Let's Encrypt certificate was then installed on Traefik
- current certificate SANs cover both apex and `www`
- residual trust oddities seen on this Windows Server 2019 machine should be treated as local operator-path issues unless contradicted by external checks

## Additional Completed Notes

### S3 backup upload

Выполнено.

Current state:

- local backup hook works
- off-host upload from the Linux VM to the backups bucket works
- backup script now writes both `backup_local_ok` and `backup_s3_ok` events to `/var/log/ecostroycontinent/backup.log`

## Agent Decisions Made Inside Allowed Scope

- Chosen VM implementation pattern:
  - exact sizing preserved via `PRC10.2-2048` + separate `30 GB` boot volume
- Chosen placement workaround:
  - direct attach to `external-network` failed
  - minimal private network + router + floating IP pattern was used instead
- Final successful provider placement:
  - VM in `ru-3b`
  - boot volume type `basic.ru-3b`
- Traefik was placed adjacent to the compose surface as a separate host-level container.
- Deploy trigger was kept minimal:
  - `workflow_dispatch`
- Host runtime env was kept outside repo in `/opt/ecostroycontinent/runtime/.env`.
- Runtime app image was pinned on host by digest instead of mutable tag.

## Blockers and Warnings

### Warning: provider placement was not trivial

Observed facts:

- direct external-network attach failed with network allocation errors
- some availability-zone/flavor combinations were rejected before the final working combination was found

This was resolved without reopening canon, but it is worth preserving operationally.

### Warning: Node 20 deprecation notice in Actions

Observed fact:

- successful deploy workflow emitted a GitHub Actions warning about Node 20-based actions

This is not a current blocker, but should be cleaned up in a later pass by bumping action versions.

## Deviations From Documents

No architecture deviation from canon was introduced.

Narrow implementation deviations from the earlier docs:

- one extra minimal private network/router/floating-IP layer was required in practice because direct public network attach did not succeed
- Traefik was materialized outside `compose.yaml`, which remains consistent with the accepted “adjacent placement allowed” boundary
- final bucket names were expanded to globally unique semantic names:
  - `ecostroycontinent-media-ru3-20260324`
  - `ecostroycontinent-backups-ru3-20260324`
- backup upload is implemented through a root-only VM env file plus host-side AWS CLI because secrets must not live in repo

## Result Summary

### Completed

- Selectel auth recheck
- canonical repo / GHCR / runner path
- VM provisioning
- host baseline
- Traefik baseline
- runtime baseline on Linux VM
- self-hosted runner baseline
- successful manual deploy workflow execution
- local backup / logging / retention hooks
- S3 storage baseline
- off-host backup upload baseline

### Partial

- operational traceability baseline
- CDN baseline
- DNS baseline remained intentionally untouched

### Blocked

- none

## Final Status

`baseline provisioning partially completed`
