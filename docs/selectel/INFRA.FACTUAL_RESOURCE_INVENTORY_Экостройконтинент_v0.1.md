# INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.1

## Purpose

Этот документ перечисляет фактически подтверждённые ресурсы и surfaces после execution pass.

Он не описывает желаемую архитектуру; он описывает только то, что реально подтверждено.

## Confirmed Local / Control-Plane Facts

### Git / GitHub

- Canonical repo: `Kwentin3/ecostroycontinent`
- Canonical repo URL: `https://github.com/Kwentin3/ecostroycontinent`
- Local git `origin`: points to canonical repo
- Repo visibility: public
- Default branch: `main`

### Local tooling

- `docker` available locally
- `docker` local version confirmed
- `gh` available and authenticated
- `openstack` CLI installed locally

### Local secret-reference assets

- Selectel RC reference: present locally
- Local secrets reference pack: present locally

## Cloud Resources Created By This Pass

### VM

- Created: `No`
- VM ID: `not available`
- VM name: `not available`
- VM IP: `not available`
- SSH verified: `No`

### S3 / Object Storage

- Media bucket created: `No`
- Backups bucket created: `No`
- Final bucket names chosen: `No`

### CDN

- Created: `No`
- Media delivery URL/path: `not available`

### DNS

- DNS records created/updated by this pass: `No`

### Runner

- Self-hosted runner provisioned on VM: `No`
- Runner registered to canonical repo: `No`

### Runtime / Deploy

- Remote compose surface created: `No`
- `app` runtime deployed: `No`
- `sql` runtime deployed: `No`
- GHCR pull validated on target VM: `No`

### Backup / Logging / Retention

- Backup path to S3 created: `No`
- Remote logging baseline created: `No`
- Remote cleanup / retention hooks created: `No`

## Factual Negative Findings

- Selectel auth check failed with `HTTP 401`.
- No runtime manifests were found in repo:
  - no compose files
  - no Dockerfiles
  - no `.github/workflows`

## Inventory Verdict

Confirmed created cloud resources from this pass: `none`.

Confirmed working control-plane facts:

- canonical repo access works
- local origin is correct
- local execution tooling exists

Confirmed blockers:

- Selectel access not authenticating
- runtime/deploy manifests absent from repo
