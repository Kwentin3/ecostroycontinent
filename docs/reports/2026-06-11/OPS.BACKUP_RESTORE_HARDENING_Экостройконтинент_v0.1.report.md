# OPS Backup Restore Hardening - Экостройконтинент v0.1

Date: 2026-06-11
Scope: PostgreSQL backup automation, deploy backup gate, S3 backup/media recoverability, restore drill evidence, docs refresh.

## Summary

DB backup automation was real before this pass, but restore confidence was incomplete: the old dump required a pre-existing production role, deploy migrations had no backup gate, backup/media buckets had no versioning, and current docs still treated restore evidence as open work.

This pass made the backup tooling repo-owned, added pre-migration backup enforcement to deploy, installed refreshed host scripts on the VM, enabled S3 versioning for backup and media buckets, and ran a restore drill against a disposable PostgreSQL container.

During final verification, `npm audit --audit-level=high` reported new high advisories in the existing dependency set. The pass therefore also updated Next.js to `16.2.9` and refreshed transitive XML dependencies enough for the high-level audit gate to pass. Moderate advisories remain as a separate dependency backlog.

## Changes

- Added repo source scripts:
  - `scripts/ops/backup-db-local.sh`
  - `scripts/ops/verify-latest-backup.sh`
  - `scripts/ops/restore-drill-latest-backup.sh`
- Updated `.github/workflows/deploy-phase1.yml` so deploy creates and verifies a pre-migration DB backup before `npm run db:migrate`.
- Added `.gitattributes` to keep shell/YAML files LF-normalized.
- Installed the refreshed scripts on the VM under `/opt/ecostroycontinent/scripts`.
- Enabled S3 versioning on:
  - backup bucket
  - media bucket
- Updated current runbook, Selectel agent context, docs index, and project handoff.
- Updated `next` to `16.2.9` after the high audit gate started failing.

## Verification Evidence

VM: `ecostroycontinent-phase1-vm`.

Fresh host backup:

- file: `/opt/ecostroycontinent/backups/local/postgres-20260611T184313Z.sql.gz`
- S3 upload: `backup_s3_ok`
- local verify: `backup_verify_ok`
- remote verify: `remote=ok`

Restore drill:

```text
tables=25
migration_rows=14
content_entities=84
published_revisions=59
media_entities=60
restore_drill_ok file=/opt/ecostroycontinent/backups/local/postgres-20260611T184313Z.sql.gz
```

Runner-mode predeploy backup simulation:

```text
backup_s3_ok s3://ecostroycontinent-backups-ru3-20260324/postgres/postgres-20260611T184502Z.sql.gz
backup_local_ok file=/tmp/runner-predeploy-backup-check/postgres-20260611T184502Z.sql.gz bytes=236103 s3=ok
backup_verify_ok file=/tmp/runner-predeploy-backup-check/postgres-20260611T184502Z.sql.gz age_seconds=2 remote=ok
```

Media integrity check from the initial audit:

- current latest media storage keys in DB: `60`
- missing S3 objects for those keys: `0`
- media bucket versioning after hardening: `Enabled`
- backup bucket versioning after hardening: `Enabled`

## Remaining Risks

- This is still daily/predeploy logical dump backup, not WAL/PITR.
- Remote backup expiry/lifecycle is intentionally not configured yet; deletion policy needs an owner/operator decision.
- Cron failure alerting is still basic. Logs exist, but there is no push alert if a nightly backup fails.
- DB rollback does not automatically restore deleted media binaries. Media S3 versioning mitigates this, but object-version restore remains an operator procedure.
- `npm audit` still reports moderate `postcss` advisories through Next.js; `npm audit --audit-level=high` passes.
