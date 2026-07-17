# Selectel Runtime Runbook - Экостройконтинент

Статус: актуальный operations baseline для phase-1 production runtime.
Обновлено: 2026-06-24.

Этот документ оставлен как единственный операционный runbook в `docs/selectel`. Старые input packs, review notes, gaps, provisioning reports и v0.1-контракты удалены из этой папки как исторический шум.

## Canonical Sources

- Runtime compose surface: `compose.yaml`
- Env contract: `.env.example`
- Production env on VM: `/opt/ecostroycontinent/runtime/.env`
- Current-state handoff: `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- Short agent briefing: `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`

Do not put secrets into repo docs. Real secrets live only in server env, GitHub secrets, root-only host files, or local ignored operator files.

## Current VM

- Provider: Selectel
- VM name: `ecostroycontinent-phase1-vm`
- Floating IP: `178.72.179.66`
- OS baseline: Ubuntu 24.04 LTS
- Runtime model: one VM, Docker Engine, Docker Compose, Traefik, app container, PostgreSQL container, self-hosted GitHub runner
- Canonical repo: `Kwentin3/ecostroycontinent`
- GHCR image: `ghcr.io/kwentin3/ecostroycontinent-app`

SSH from operator machine:

```powershell
ssh -i "$env:USERPROFILE\.ssh\sait_selectel_rsa" root@178.72.179.66
```

## Host Surfaces

- repo checkout: `/opt/ecostroycontinent/repo`
- app runtime env: `/opt/ecostroycontinent/runtime/.env`
- backup S3 env: `/opt/ecostroycontinent/runtime/backup-s3.env`
- Traefik config: `/opt/ecostroycontinent/traefik/traefik.yml`
- Traefik dynamic config: `/opt/ecostroycontinent/traefik/dynamic/routes.yml`
- Traefik certs: `/opt/ecostroycontinent/traefik/certs`
- certbot hooks: `/etc/letsencrypt/renewal-hooks/{pre,deploy,post}`
- scripts: `/opt/ecostroycontinent/scripts`
- local backups: `/opt/ecostroycontinent/backups/local`
- host logs: `/var/log/ecostroycontinent`

Expected steady containers:

- `ecostroycontinent-traefik`
- `repo-app-1`
- `repo-sql-1`

Check:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

## Compose Runtime

Manual runtime refresh on VM:

```bash
cd /opt/ecostroycontinent/repo
docker compose --env-file /opt/ecostroycontinent/runtime/.env --project-name repo -f compose.yaml pull app
docker compose --env-file /opt/ecostroycontinent/runtime/.env --project-name repo -f compose.yaml up -d --remove-orphans
```

Rules:

- `/opt/ecostroycontinent/runtime/.env` is the app runtime env source.
- `/opt/ecostroycontinent/runtime/backup-s3.env` is ops-only and must not be injected into the app container.
- Routine app deploy updates the app image. SQL/data changes must be explicit.

## Deploy Path

Build and deploy are GitHub/GHCR/runner driven, not ad-hoc file copy.

Deploy guardrail:

- `deploy-phase1.yml` creates a fresh pre-migration PostgreSQL dump from `repo-sql-1`.
- The pre-migration dump is uploaded to the backup S3 bucket before `npm run db:migrate`.
- The app container never receives backup S3 credentials; backup env remains host/runner ops-only.
- If the pre-migration backup or remote verification fails, deploy must stop before migrations.

Manual build:

```powershell
gh workflow run build-and-publish.yml --repo Kwentin3/ecostroycontinent --ref <branch-or-main>
gh run watch --repo Kwentin3/ecostroycontinent <build-run-id> --exit-status
```

Deploy pinned image:

```powershell
gh workflow run deploy-phase1.yml --repo Kwentin3/ecostroycontinent --ref <same-ref> -f image_ref=ghcr.io/kwentin3/ecostroycontinent-app@sha256:<digest> -f run_live_removal_acceptance=false
```

Watch deploy:

```powershell
gh run list --repo Kwentin3/ecostroycontinent --workflow deploy-phase1.yml --limit 5
gh run watch --repo Kwentin3/ecostroycontinent <run-id>
```

After deploy, verify live `/api/readiness` and the smoke result. Do not infer deployed truth from branch name alone.

## Health And Readiness

On VM through Traefik:

```bash
curl -ksSf https://127.0.0.1/api/health
curl -ksSf https://127.0.0.1/api/readiness -H "Host: ecostroycontinent.ru"
```

From operator machine:

```powershell
curl.exe -k https://178.72.179.66/api/health
curl.exe https://ecostroycontinent.ru/api/readiness
```

Expected production readiness:

- `/api/health`: lightweight liveness, 200
- `/api/readiness`: strict readiness, 200, `status=ready`, `database.status=ok`, non-null safe `runtime.commit`
- no secrets, connection strings, stack traces, usernames, hostnames or tokens in readiness response

## Public TLS

Current public TLS model:

- Traefik serves static cert/key files from `/opt/ecostroycontinent/traefik/certs`.
- `ecostroycontinent.ru` and `www.ecostroycontinent.ru` are issued by Let's Encrypt through certbot standalone HTTP-01.
- certbot is installed from Ubuntu packages and `certbot.timer` must stay enabled.
- certbot renewal uses hooks copied from `scripts/ops`:
  - `certbot-pre-stop-traefik.sh` stops `ecostroycontinent-traefik` only when a renewal challenge runs.
  - `deploy-traefik-tls-cert.sh` copies `fullchain.pem` and `privkey.pem` into Traefik cert paths.
  - `certbot-post-start-traefik.sh` starts Traefik again after the renewal attempt.
- Expected renewal downtime is a short Traefik stop during the HTTP-01 challenge. App and PostgreSQL containers are not changed.

Server-side hook install paths:

```bash
/etc/letsencrypt/renewal-hooks/pre/ecostroycontinent-stop-traefik.sh
/etc/letsencrypt/renewal-hooks/deploy/ecostroycontinent-deploy-traefik-cert.sh
/etc/letsencrypt/renewal-hooks/post/ecostroycontinent-start-traefik.sh
```

Read-only TLS checks:

```bash
certbot certificates
openssl x509 -in /opt/ecostroycontinent/traefik/certs/ecostroycontinent.crt -noout -subject -issuer -dates -ext subjectAltName
systemctl list-timers --all --no-pager | grep certbot
curl -fsS https://ecostroycontinent.ru/api/readiness
```

Operator-side TLS checks:

```powershell
curl.exe -I https://ecostroycontinent.ru/
curl.exe https://ecostroycontinent.ru/api/readiness
```

Renewal path check:

```bash
certbot renew --dry-run --cert-name ecostroycontinent.ru
```

Emergency manual reissue on VM:

```bash
docker stop ecostroycontinent-traefik
certbot certonly --standalone --non-interactive --agree-tos --register-unsafely-without-email --cert-name ecostroycontinent.ru -d ecostroycontinent.ru -d www.ecostroycontinent.ru
/opt/ecostroycontinent/scripts/deploy-traefik-tls-cert.sh
docker start ecostroycontinent-traefik
curl -fsS https://ecostroycontinent.ru/api/readiness
```

## Launch Smoke

Read-only smoke from a clean repo checkout:

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

The smoke must stay read-only: no auth, no publish, no mutations, no migrations, no production data writes.

Current expected owner content state:

- `/about`: published
- `/contacts`: published

## Media Storage And CDN

Production posture:

- `MEDIA_STORAGE_MODE=s3`
- `MEDIA_DELIVERY_MODE=auto`
- `MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`
- current media bucket: `ecostroycontinent-media-ru3-20260428`
- CDN resource name: `ecostroycontinent-media-cdn-v3`
- CDN resource id: `bab68f25-17dd-402e-9a8e-70a294915a47`
- default CDN domain: `bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`
- public bucket origin: `https://media.ecostroycontinent.ru`
- origin Host header: `media.ecostroycontinent.ru`

Rules:

- Published public HTML should use direct CDN image URLs in CDN-capable mode.
- `/api/media-public/:entityId` remains fallback/handoff delivery.
- Admin draft/review media should stay behind authenticated preview routes unless a separate access decision changes that.
- Do not store raw CDN URLs as editorial media truth.

Read-only CDN checks:

```powershell
curl.exe -I https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
curl.exe -I https://media.ecostroycontinent.ru/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
```

App fallback/handoff check:

```powershell
curl.exe -I https://ecostroycontinent.ru/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f
```

Expected: CDN object returns 200 for known smoke object; app route may redirect to CDN when CDN probing is healthy.

## Runner

VM service:

```bash
systemctl status actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service --no-pager
```

GitHub-side check:

```powershell
gh api repos/Kwentin3/ecostroycontinent/actions/runners
```

Runner is deploy execution surface only. It is not product runtime, data truth, or public request path.

## Logs

Useful checks:

```bash
tail -n 100 /var/log/ecostroycontinent/backup.log
tail -n 100 /var/log/ecostroycontinent/cleanup.log
tail -n 100 /var/log/ecostroycontinent/traefik.log
tail -n 100 /var/log/ecostroycontinent/access.log
journalctl -u docker --no-pager -n 100
journalctl -u actions.runner.Kwentin3-ecostroycontinent.ecostroycontinent-phase1-vm.service --no-pager -n 100
docker logs --tail 100 repo-app-1
docker logs --tail 100 repo-sql-1
docker logs --tail 100 ecostroycontinent-traefik
```

## Backups And Retention

Host artifacts:

- local backups: `/opt/ecostroycontinent/backups/local`
- backup script: `/opt/ecostroycontinent/scripts/backup-db-local.sh`
- backup verification script: `/opt/ecostroycontinent/scripts/verify-latest-backup.sh`
- restore drill script: `/opt/ecostroycontinent/scripts/restore-drill-latest-backup.sh`
- repo source scripts: `scripts/ops/*.sh`
- cleanup script: `/opt/ecostroycontinent/scripts/docker-retention.sh`
- cron file: `/etc/cron.d/ecostroycontinent-baseline`
- logrotate file: `/etc/logrotate.d/ecostroycontinent`

Current behavior:

- cron runs DB backup daily at `02:15 UTC`;
- deploy creates an extra pre-migration DB backup before migrations;
- dumps are plain PostgreSQL SQL dumps compressed as `postgres-YYYYMMDDTHHMMSSZ.sql.gz`;
- dumps are created with `pg_dump --no-owner --no-privileges` so clean-cluster restore does not require the production role to exist first;
- each new dump gets a `.sha256` checksum uploaded beside the dump;
- local retention is 7 days by default;
- backup and media buckets have S3 versioning enabled as of 2026-06-11;
- remote expiry/lifecycle is intentionally not configured yet; keep old backup removal as an explicit owner/operator decision.

Manual checks:

```bash
ls -lah /opt/ecostroycontinent/backups/local
tail -n 50 /var/log/ecostroycontinent/backup.log
/opt/ecostroycontinent/scripts/backup-db-local.sh
/opt/ecostroycontinent/scripts/verify-latest-backup.sh --max-age-hours 30 --require-remote
/opt/ecostroycontinent/scripts/restore-drill-latest-backup.sh
/opt/ecostroycontinent/scripts/docker-retention.sh
df -h /
```

Restore rule:

- restore into a disposable PostgreSQL target first;
- verify table/migration/content/media counts before touching production;
- database restore does not itself restore deleted media binaries, so keep media S3 versioning enabled and do not treat DB rollback as full media rollback.

Remote S3 backup listing requires operator-provided credentials. Do not paste real credentials into docs, shell history screenshots, reports, or commits.

## SSH Hardening

Expected posture:

- `PasswordAuthentication no`
- `PermitRootLogin prohibit-password`
- `fail2ban` enabled with `sshd` jail

Checks:

```bash
sshd -T | egrep 'passwordauthentication|permitrootlogin|pubkeyauthentication|kbdinteractiveauthentication'
systemctl status fail2ban --no-pager
fail2ban-client status
fail2ban-client status sshd
```

## Local Ignored Operator Files

These files may exist locally under `docs/selectel`, but they are not canonical documentation and must stay ignored:

- `LOCAL_SECRETS_NOT_FOR_GIT.md`
- `rc.sh`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, cert/key bundles

`scripts/selectel-media-bucket-crud.mjs` still supports `--from-local-secrets` with the default local secret pack path `docs/selectel/LOCAL_SECRETS_NOT_FOR_GIT.md`. Keep that file local-only.

## Basic Production Verification Checklist

1. SSH to VM.
2. Confirm runner service is active.
3. Confirm `docker ps` shows `ecostroycontinent-traefik`, `repo-app-1`, `repo-sql-1`.
4. Confirm public TLS certificate is valid and not near expiry.
5. Confirm health and readiness over strict public HTTPS.
6. Run read-only launch smoke with expected about/contacts/media settings.
7. Confirm latest backup exists locally.
8. Confirm `backup_s3_ok` appears in backup log when checking backup pipeline.
9. Confirm restore drill passes on a disposable PostgreSQL container.
10. Confirm disk headroom with `df -h /`.
