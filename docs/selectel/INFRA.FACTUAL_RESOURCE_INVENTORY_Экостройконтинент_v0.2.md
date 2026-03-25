# INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2

## Scope

Ниже перечислены только фактически созданные или фактически подтверждённые resources/surfaces. Секреты не включены.

## 1. Control Plane

- Provider: `Selectel`
- Region path used in this pass: `ru-3`
- Canonical repo: `Kwentin3/ecostroycontinent`
- Canonical repo URL: `https://github.com/Kwentin3/ecostroycontinent`

## 2. VM Resources

### Server

- Name: `ecostroycontinent-phase1-vm`
- ID: `b59e961d-dde7-4dc6-9c6d-0a8692db6451`
- Status: `ACTIVE`
- AZ: `ru-3b`
- Flavor: `PRC10.2-2048`
- vCPU: `2`
- RAM: `2048 MB`
- Keypair: `ssh-agent-codex`
- Fixed IP: `192.168.100.62`
- Floating IP: `178.72.179.66`
- OS image used for boot volume: `Ubuntu 24.04 LTS 64-bit`
- Image ID: `a7433b0b-8bee-4d6e-b6db-447f1696eaf4`

### Boot volume

- Name: `ecostroycontinent-phase1-root-b`
- ID: `56ba9427-875e-461b-a165-2369ed2714ef`
- Size: `30 GB`
- Type: `basic.ru-3b`
- Status: `in-use`

## 3. Network Resources

- Security group: `ecostroycontinent-phase1`
- Security group ID: `f10d87e3-f534-4a35-ab1c-ab1fc69e24d2`
- Ingress rules:
  - `tcp/22`
  - `tcp/80`
  - `tcp/443`

- Private network: `ecostroycontinent-phase1-net`
- Private network ID: `86cf49f6-8634-4147-a70a-b9403a42961e`
- Subnet: `ecostroycontinent-phase1-subnet`
- Subnet CIDR: `192.168.100.0/24`
- Router: `ecostroycontinent-phase1-router`
- Router ID: `2b0a12de-8094-46b9-9a3d-10cb83ede088`

- Floating IP ID: `255fe85d-8d3e-40c8-b73a-65c527e15a85`
- Floating IP address: `178.72.179.66`

## 4. Runtime / Host Facts

- Hostname: `ecostroycontinent-phase1-vm`
- Host OS: `Ubuntu 24.04.4 LTS`
- Docker Engine: `28.2.2`
- Docker Compose: `2.37.1`
- SSH password auth: `disabled`
- Root SSH login: `key-only` (`PermitRootLogin prohibit-password`)
- Host hardening package: `fail2ban`
- Active jail: `sshd`
- Root disk usage at inventory time: `3.2G / 30G` used

Current running containers:

- `ecostroycontinent-traefik`
- `repo-app-1`
- `repo-sql-1`

## 5. Traefik Facts

- Placement: host-adjacent container on host network
- Image: `traefik:v3.1`
- Public ports:
  - `80`
  - `443`
- Local dashboard port:
  - `8080`
- Cert posture: Let's Encrypt on both `ecostroycontinent.ru` and `www.ecostroycontinent.ru`
- Dynamic routers observed:
  - `app@file`
  - `dashboard@file`
  - `web-to-websecure@internal`

## 6. Runner / Deploy Facts

- Runner service:
  - `actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service`
- Runner status: `online`
- Runner labels:
  - `self-hosted`
  - `Linux`
  - `X64`
  - `ecostroycontinent-phase1`

Deploy workflows/facts:

- Build workflow: `build-and-publish`
- Deploy workflow: `deploy-phase1`
- Successful deploy run ID: `23498311265`
- Successful deploy trigger: `workflow_dispatch`

App image fact:

- Host runtime image reference is pinned by digest in `/opt/ecostroycontinent/runtime/.env`
- GHCR image name: `ghcr.io/kwentin3/ecostroycontinent-app`

## 7. Runtime Validation Facts

- Linux VM was used as first canonical Docker validation environment
- Verified health path on VM:
  - `https://127.0.0.1/api/health`
- Verified health path over floating IP:
  - `https://178.72.179.66/api/health`

## 8. Backup / Logging / Retention Facts

- Local backup directory: `/opt/ecostroycontinent/backups/local`
- Verified local backup artifact:
  - `postgres-20260324T154151Z.sql.gz`
- Verified off-host backup artifact:
  - `s3://ecostroycontinent-backups-ru3-20260324/postgres/postgres-20260324T175012Z.sql.gz`
- Backup script: `/opt/ecostroycontinent/scripts/backup-db-local.sh`
- Cleanup script: `/opt/ecostroycontinent/scripts/docker-retention.sh`
- Cron file: `/etc/cron.d/ecostroycontinent-baseline`
- Logrotate file: `/etc/logrotate.d/ecostroycontinent`
- Host log directory: `/var/log/ecostroycontinent`
- Root-only backup S3 env file: `/opt/ecostroycontinent/runtime/backup-s3.env`

## 9. Storage / CDN / DNS Facts

### Actually created

- Media bucket:
  - `ecostroycontinent-media-ru3-20260324`
  - type: `public`
- Backups bucket:
  - `ecostroycontinent-backups-ru3-20260324`
  - type: `private`

### Actually changed

- `ecostroycontinent.ru` now resolves to `178.72.179.66`
- `www.ecostroycontinent.ru` now resolves to `178.72.179.66`

### Still open / partial

- CDN resource:
  - `ecostroycontinent-media-cdn`
  - ID: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd`
  - default CDN domain: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net`
  - status at inventory update time: `active`
- factual CDN media delivery path:
  - `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt`
- confirmed HTTP CDN media delivery path:
  - `http://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt`
- confirmed HTTPS CDN media delivery path:
  - `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt`
- residual local validation note:
  - this Windows Server 2019 operator machine may still show `schannel` trust issues during local verification even after the server-side chain and SANs are correct
