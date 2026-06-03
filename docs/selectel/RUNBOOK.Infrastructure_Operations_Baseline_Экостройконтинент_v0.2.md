# RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2

## Scope

Этот runbook описывает текущий фактический operations baseline для phase-1 contour, поднятого в Selectel.

## 1. Connect to VM

Current public entry:

- Floating IP: `178.72.179.66`

Current verified SSH pattern from the operator machine:

```powershell
ssh -i "$env:USERPROFILE\.ssh\sait_selectel_rsa" root@178.72.179.66
```

## 2. Main Operational Surfaces

Host paths:

- repo checkout: `/opt/ecostroycontinent/repo`
- app runtime env: `/opt/ecostroycontinent/runtime/.env`
- backup S3 env: `/opt/ecostroycontinent/runtime/backup-s3.env` (ops-only; not injected into the app container)
- Traefik config: `/opt/ecostroycontinent/traefik/traefik.yml`
- Traefik dynamic config: `/opt/ecostroycontinent/traefik/dynamic/routes.yml`
- Traefik certs: `/opt/ecostroycontinent/traefik/certs`
- scripts: `/opt/ecostroycontinent/scripts`
- local backups: `/opt/ecostroycontinent/backups/local`
- host logs: `/var/log/ecostroycontinent`

Systemd surfaces:

- runner service:
  - `actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service`
- host hardening service:
  - `fail2ban`

CDN surfaces:

- CDN resource name: `ecostroycontinent-media-cdn-v3`
- CDN resource id: `bab68f25-17dd-402e-9a8e-70a294915a47`
- Default CDN domain: `bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`
- Current public bucket origin: `https://media.ecostroycontinent.ru`
- Current media bucket: `ecostroycontinent-media-ru3-20260428`
- Origin Host header: `media.ecostroycontinent.ru`
- Production delivery mode: `MEDIA_DELIVERY_MODE=auto`.
- Published public markup resolves media `previewUrl` directly to the Selectel CDN when a storage key and CDN base URL are available.
- `/api/media-public/:entityId` remains a fallback/handoff route; it can redirect to CDN or stream from storage, but public HTML should not need that app hop in CDN-capable modes.

## 3. Check Container State

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

Expected steady state:

- `ecostroycontinent-traefik`
- `repo-app-1`
- `repo-sql-1`

## 4. Check Runner

Service-level check on VM:

```bash
systemctl status actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service --no-pager
```

GitHub-side check from operator machine:

```powershell
gh api repos/Kwentin3/ecostroycontinent/actions/runners
```

## 5. Check Traefik

Health through Traefik on VM:

```bash
curl -ksSf https://127.0.0.1/api/health
```

External health from operator machine:

```powershell
curl.exe -k https://178.72.179.66/api/health
```

Read-only launch smoke from operator machine after PR/deploy:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT = 'true'
$env:EXPECT_ABOUT = 'published'
$env:EXPECT_CONTACTS = 'published'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
Remove-Item Env:EXPECT_ABOUT
Remove-Item Env:EXPECT_CONTACTS
```

Current expected owner content state:

```powershell
$env:EXPECT_ABOUT = 'published'
$env:EXPECT_CONTACTS = 'published'
```

Use `EXPECT_ABOUT=known_missing` and/or `EXPECT_CONTACTS=known_missing` only for an environment where approved Content Core pages are intentionally absent. Keep `EXPECT_RUNTIME_COMMIT=true` for post-deploy production acceptance so `/api/readiness` must expose a non-null deployed commit marker. The smoke script must stay read-only: it checks health, readiness, public launch routes, robots, sitemap honesty, admin protection, and optional `EXPECT_MEDIA_URL`; it must not create content, authenticate, publish, migrate, or mutate production data.

Current media launch posture as of 2026-06-03:

- Production media storage is S3-backed.
- Production media delivery is switched to CDN-first safe mode: `MEDIA_DELIVERY_MODE=auto`, `MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`.
- Public HTML should contain direct `selcdn.net` image URLs for published media in CDN-capable modes.
- App public media routes remain fallback/handoff routes; they should not be the normal image `src` on the public site.
- Stable read-only media smoke URL for `EXPECT_MEDIA_URL`:
  - `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- Public app route handoff can be checked separately:
  - `https://ecostroycontinent.ru/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f` should return `302` to the CDN URL when CDN probing is healthy.
- Include media in launch smoke:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT = 'true'
$env:EXPECT_ABOUT = 'published'
$env:EXPECT_CONTACTS = 'published'
$env:EXPECT_MEDIA_URL = 'https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
Remove-Item Env:EXPECT_ABOUT
Remove-Item Env:EXPECT_CONTACTS
Remove-Item Env:EXPECT_MEDIA_URL
```

This URL maps to an existing published `media_asset` and is used only as operational smoke evidence. Do not store raw CDN URLs as editorial truth in content entities, and refresh the runbook if the asset is intentionally unpublished or removed.

Traefik dashboard raw data on VM:

```bash
curl -sSf http://127.0.0.1:8080/api/rawdata | jq '.routers | keys'
```

Traefik logs:

```bash
tail -n 100 /var/log/ecostroycontinent/traefik.log
tail -n 100 /var/log/ecostroycontinent/access.log
```

## 6. Check Compose Runtime

Pull/update manually on host:

```bash
cd /opt/ecostroycontinent/repo
docker compose --env-file /opt/ecostroycontinent/runtime/.env --project-name repo -f compose.yaml pull app
docker compose --env-file /opt/ecostroycontinent/runtime/.env --project-name repo -f compose.yaml up -d --remove-orphans
```

App runtime env is sourced only from `/opt/ecostroycontinent/runtime/.env`; backup env stays separate.

## 7. Check Deploy Path

Manual deploy trigger:

```powershell
gh workflow run build-and-publish.yml --repo Kwentin3/ecostroycontinent --ref <branch-or-main>
gh run watch --repo Kwentin3/ecostroycontinent <build-run-id> --exit-status

# Extract the published digest from the build log, then deploy the pinned image.
gh workflow run deploy-phase1.yml --repo Kwentin3/ecostroycontinent --ref <same-ref> -f image_ref=ghcr.io/kwentin3/ecostroycontinent-app@sha256:<digest> -f run_live_removal_acceptance=false
```

Watch the last run:

```powershell
gh run list --repo Kwentin3/ecostroycontinent --workflow deploy-phase1.yml --limit 5
gh run watch --repo Kwentin3/ecostroycontinent <run-id>
```

## 8. Check Backup Path

Local backup artifacts:

```bash
ls -lah /opt/ecostroycontinent/backups/local
tail -n 50 /var/log/ecostroycontinent/backup.log
```

Manual backup run:

```bash
/opt/ecostroycontinent/scripts/backup-db-local.sh
```

Check remote S3 backup artifacts from the operator machine:

```powershell
$env:AWS_ACCESS_KEY_ID='<backup access key>'
$env:AWS_SECRET_ACCESS_KEY='<backup secret key>'
$env:AWS_DEFAULT_REGION='ru-3'
aws --endpoint-url https://s3.ru-3.storage.selcloud.ru s3 ls s3://ecostroycontinent-backups-ru3-20260324/postgres/
```

## 9. Check Basic Logs

```bash
tail -n 100 /var/log/ecostroycontinent/backup.log
tail -n 100 /var/log/ecostroycontinent/cleanup.log
journalctl -u docker --no-pager -n 100
journalctl -u actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service --no-pager -n 100
docker logs --tail 100 repo-app-1
docker logs --tail 100 repo-sql-1
docker logs --tail 100 ecostroycontinent-traefik
```

## 10. Check SSH Hardening

Current factual state:

- `PasswordAuthentication no`
- `PermitRootLogin prohibit-password`
- `fail2ban` enabled with `sshd` jail

Useful checks:

```bash
sshd -T | egrep 'passwordauthentication|permitrootlogin|pubkeyauthentication|kbdinteractiveauthentication'
systemctl status fail2ban --no-pager
fail2ban-client status
fail2ban-client status sshd
```

## 11. Check CDN Bootstrap

Check CDN resource state from the operator machine:

```powershell
$token = '<project-scoped IAM token>'
$projectId = '8a10b267-f953-42f5-883f-25251b0e57c4'
$resourceId = 'bab68f25-17dd-402e-9a8e-70a294915a47'
curl.exe -H "X-Auth-Token: $token" -H "X-Project-Id: $projectId" https://api.selectel.ru/cdn/v3/resources/$resourceId/status
curl.exe -H "X-Auth-Token: $token" -H "X-Project-Id: $projectId" https://api.selectel.ru/cdn/v3/resources/$resourceId
```

Check origin object directly:

```powershell
curl.exe -I https://media.ecostroycontinent.ru/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp
curl.exe -I https://media.ecostroycontinent.ru/media/03daa15f-1b58-4633-b5ab-b805418ef0ae.jpg
```

Check CDN object:

```powershell
curl.exe -I https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp
```

```powershell
curl.exe -I https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/03daa15f-1b58-4633-b5ab-b805418ef0ae.jpg
```

Expected current factual behavior:

- bucket origin object returns `200 OK`
- CDN object path should return `200 OK` for the runbook smoke object and the legacy root-level canary
- CDN root `/` may return `403`
- bucket root `/` may return `404`
- production app delivery is `MEDIA_DELIVERY_MODE=auto`; if CDN edge sampling regresses, rollback to `app_proxy` and clear `MEDIA_PUBLIC_BASE_URL`

## 12. Retention / Cleanup

Configured hooks:

- `/opt/ecostroycontinent/scripts/backup-db-local.sh`
- `/opt/ecostroycontinent/scripts/docker-retention.sh`
- `/etc/cron.d/ecostroycontinent-baseline`
- `/etc/logrotate.d/ecostroycontinent`

Manual cleanup trigger:

```bash
/opt/ecostroycontinent/scripts/docker-retention.sh
```

## 13. Basic Operational Verification

Minimal operator check:

1. SSH to VM.
2. Confirm runner service is `active`.
3. Confirm `docker ps` shows `traefik`, `app`, `sql`.
4. Confirm `curl -ksSf https://127.0.0.1/api/health` returns `status: ok`.
5. Confirm `curl -ksSf https://127.0.0.1/api/readiness -H "Host: ecostroycontinent.ru"` returns `status: ready` and `database.status: ok`.
6. Run `APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch` from a clean repo checkout. `known_content_blocker` is acceptable only for explicitly known-missing owner content in a non-production environment; `failed` is not acceptable.
7. Confirm disk still has headroom:

```bash
df -h /
```

8. Confirm latest backup file exists in `/opt/ecostroycontinent/backups/local`.
9. Confirm `backup_s3_ok` appears in `/var/log/ecostroycontinent/backup.log`.
