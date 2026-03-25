# INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.1

## Purpose

Этот документ фиксирует gaps после provisioning execution pass и отделяет blocking issues от later follow-ups.

## Blocking Gaps

### 1. Selectel access is not working

- `openstack token issue` with the current local Selectel auth returns `HTTP 401`.
- Пока это не исправлено, VM / buckets / CDN / DNS provisioning честно выполнить нельзя.

### 2. Runtime manifests are absent

- Repo currently has no:
  - `Dockerfile`
  - `docker-compose` / `compose` manifest
  - `.github/workflows`
- Даже при рабочем cloud access нельзя завершить runtime/deploy baseline без этих artifacts.

## Non-Blocking Gaps For Docs, But Still Needed Before Serious Operation

- exact GHCR namespace / image naming
- exact runner registration/supervision method
- exact persistent volume layout
- exact backup frequency
- exact retention numbers
- exact deploy trigger policy
- exact rollback operator flow
- exact DNS records for public runtime

## What Does Not Need Reopening

- one VM posture
- `app` + `sql` runtime posture
- `Traefik` as reverse proxy
- self-signed current TLS posture
- Selectel as provider and DNS provider
- GHCR as registry
- runner on VM as accepted deploy execution posture

## Recommended Next Step

1. Repair Selectel service-user auth / RC so that `openstack token issue` succeeds.
2. Add minimal runtime/deploy artifacts to the repo:
   - one `Dockerfile` for `app`
   - one compose surface for `app` + `sql`
   - one minimal GitHub Actions workflow for build/publish/deploy
3. Rerun provisioning execution after those two blockers are closed.

## Short Status

- baseline infra execution: `blocked`
- blockers are concrete and reproducible
- no unsafe secret handling was introduced
