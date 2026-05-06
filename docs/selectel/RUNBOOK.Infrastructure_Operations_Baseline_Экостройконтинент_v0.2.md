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
- Production delivery mode: `app_proxy` until all CDN edge probes are stable
- Known CDN blocker as of 2026-04-28: some Selectel edge nodes return cached `403 HIT`

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
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
```

Current expected content blockers:

```powershell
$env:EXPECT_ABOUT = 'known_missing'
$env:EXPECT_CONTACTS = 'known_missing'
```

Use `EXPECT_ABOUT=published` and/or `EXPECT_CONTACTS=published` only after approved Content Core pages are published. The smoke script must stay read-only: it checks health, readiness, public launch routes, robots, sitemap honesty, admin protection, and optional `EXPECT_MEDIA_URL`; it must not create content, authenticate, publish, migrate, or mutate production data.

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
gh workflow run deploy-phase1.yml --repo Kwentin3/ecostroycontinent --ref main
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
- CDN object path may return `200 OK` from some edge nodes and cached `403` from others
- CDN root `/` may return `403`
- bucket root `/` may return `404`
- production app delivery must stay on `MEDIA_DELIVERY_MODE=app_proxy` until CDN edge sampling is clean

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
6. Run `APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:launch` from a clean repo checkout. `known_content_blocker` for `/about` and `/contacts` is acceptable only while owner content is missing; `failed` is not acceptable.
7. Confirm disk still has headroom:

```bash
df -h /
```

8. Confirm latest backup file exists in `/opt/ecostroycontinent/backups/local`.
9. Confirm `backup_s3_ok` appears in `/var/log/ecostroycontinent/backup.log`.
