# INFRA.AUDIT.ANAMNESIS_Экостройконтинент_v0.1

## Purpose

Краткий инфраструктурный анамнез проекта «Экостройконтинент»: что найдено, что подтверждено, что не подтверждено и где есть риск drift между документами и локальным состоянием.

## Что найдено

- Canonical product/docs layer under `docs/product-ux/`
- Infra input pack: `docs/selectel/RUNBOOK.Infrastructure_Input_Pack_Экостройконтинент_v0.1.md`
- Local secret reference file: `docs/selectel/rc.sh`
- Local git repository remote now points to canonical repo `https://github.com/Kwentin3/ecostroycontinent.git`
- No runtime/provisioning manifests in repo root:
  - no `docker-compose*`
  - no `Dockerfile*`
  - no visible `.github` workflows

## Что подтверждено

### Подтверждено каноном

- Public site = published read-side surface
- Admin = write-side tool
- Content Core = source of truth
- Media = first-class asset domain
- Publish = explicit domain operation
- Modular monolith acceptable
- Phase 1 stays narrow and simple
- Runtime technology canon supports `Next.js + PostgreSQL + S3/CDN + Traefik`

### Подтверждено infra input pack

- Provider: `Selectel`
- Infra project code: `sait`
- Service user: `sait`, role `member` on project `sait`
- One VM baseline
- DNS provider: `Selectel`
- Current practical TLS posture: self-signed certificates
- Phase-1 sizing baseline: `2 CPU`, `2 GB RAM`, `30 GB disk`
- Docker Engine + Docker Compose
- Traefik
- GitHub + GHCR
- self-hosted runner on the same VM
- one compose stack with `app` + `sql` on the same VM
- S3 with separate `media` and `backups` buckets
- CDN for media delivery
- secrets separated from repo
- logging and forensics mandatory
- retention mandatory

### Подтверждено локально

- `docs/selectel/rc.sh` exists and matches Selectel/OpenStack CLI posture
- `docs/selectel/rc.sh` is now explicitly gitignored as a local secret-reference file
- Git remote is configured locally
- GitHub repo source of truth is `Kwentin3/ecostroycontinent`
- Old typo repo `Kwentin3/ecostroycontinet` is no longer canonical
- Repo currently contains docs and baseline files, but not runtime manifests
- Primary public domain `ecostroycontinent.ru` is now explicitly confirmed by owner input

## Что не подтверждено

- Cloud-side existence of the Selectel project, service user, buckets or VM was not revalidated from provider APIs in this audit
- GHCR namespace/image naming is not fixed in docs
- GitHub runner registration method is not fixed
- DNS records are not fixed
- Final production-friendly TLS improvement path is not fixed
- Backup frequency is not fixed
- Retention numbers are not fixed
- Exact runtime log / forensic schema in SQL is not fixed
- Exact persistent volume layout is not fixed
- The public infra input pack exists locally, but is not yet committed as tracked repo state

## Implicit assumptions

- SQL-in-container implies VM-backed persistent storage, but exact host volume contract is still absent
- Backup posture likely includes DB restore material and critical runtime restore material, but exact inventory is not fixed
- One public runtime environment is treated as sufficient phase-1 baseline, and dedicated stage is not a mandatory truth right now
- Runner can coexist operationally on the same VM, but its packaging mode is not fixed

## Doc drift risk

- Infra input pack previously had a file naming mismatch (`UNBOOK` vs `RUNBOOK`); this pass removes that naming drift
- `docs/selectel` currently mixes a commit-worthy public infra input pack with a local secret-reference file; this is safe only if commit discipline or ignore rules remain explicit
- GitHub remote exists locally, but GHCR naming and runner registration still remain partially unfilled
- Local git remote drift to the obsolete typo repo has been removed
- Product canon already says `Traefik`, `S3/CDN` and one-app-one-sql runtime posture; infra docs had not yet been consolidated into a canonical infra PRD
- Local repo lacks runtime manifests, so discussion can easily drift into provisioning as if deploy assets already exist

## Contradiction check

- No hard contradiction was found between product canon and the infra input pack
- No hard contradiction was found between the input pack and the newly confirmed domain
- The main problem is incompleteness, not contradiction

## Short audit conclusion

Infra posture for phase 1 is sufficiently stable to document and contract, but not sufficiently concrete to jump straight into provisioning without another narrowing pass on deploy/runtime inputs.
