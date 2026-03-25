# RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.1

## Purpose

Этот runbook фиксирует текущий operational baseline после provisioning execution pass.

Текущее factual состояние: remote infrastructure baseline ещё не поднят, потому что execution blocked before VM creation.

## Current State

- Provisioned VM: `not available yet`
- SSH target: `not available yet`
- Remote Traefik runtime: `not available yet`
- Remote `app` / `sql` compose stack: `not available yet`
- Self-hosted runner on VM: `not available yet`
- S3 buckets created by this pass: `not available yet`
- CDN created by this pass: `not available yet`

## What Can Be Checked Right Now

### GitHub / repo

- Canonical repo: `Kwentin3/ecostroycontinent`
- Local origin is already aligned to the canonical repo.

### Local execution tooling

- `gh auth status`
- `docker version`
- `openstack --version`

These checks are local-only and do not prove that cloud/runtime resources exist.

## VM Access

Current status:

- There is no provisioned VM from this pass, so there is no factual SSH target to use.

Once Selectel access is repaired and a VM is created, the minimal connection check should be:

```powershell
ssh <vm-user>@<vm-ip>
```

## Containers and Compose State

Current status:

- No remote compose surface exists yet.
- Repo currently has no verified runtime manifests for `app` + `sql`.

Once a VM and compose baseline exist, the minimum runtime checks should be:

```bash
docker ps
docker compose ps
```

## Runner State

Current status:

- No self-hosted runner is installed on a provisioned VM from this pass.

Once runner setup exists, minimum checks should cover:

- runner service is registered;
- runner service is active;
- runner can receive jobs from `Kwentin3/ecostroycontinent`.

## Traefik State

Current status:

- No factual remote Traefik baseline exists yet.

Once Traefik is provisioned, minimum checks should cover:

```bash
docker ps
docker logs <traefik-container>
```

## Backup Path

Current status:

- No factual backup path to S3 was created in this pass.

Once backup baseline exists, minimum checks should cover:

- backup target bucket is reachable;
- a new backup artifact appears in the `backups` path;
- backup job outcome is observable in logs.

## Basic Logs

Current status:

- No remote host/runtime logs were created because remote runtime was not provisioned.

Local-only execution evidence from this pass exists in:

- git history
- current infra markdown docs

## Minimal Operational Check

Current blocked baseline check:

1. Confirm `gh` access to `Kwentin3/ecostroycontinent`.
2. Confirm `openstack token issue` works with current Selectel auth.
3. Confirm repo contains runtime manifests.
4. Only after that continue to VM, buckets, runner and compose setup.

## Runbook Limitation

Этот runbook intentionally reflects a blocked baseline.

Он не должен читаться как доказательство того, что remote infra уже работает. Он фиксирует, что нужно смотреть и в каком порядке после устранения текущих blockers.
