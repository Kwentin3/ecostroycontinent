# PRD.Infrastructure_Baseline_Экостройконтинент_v0.1

## 1. Document Purpose

Этот документ фиксирует минимальный канонический infrastructure baseline проекта «Экостройконтинент» для phase 1.

Он не является provisioning runbook, не хранит секреты и не пытается превратить phase 1 в перегруженную target architecture. Его задача: закрепить accepted infrastructure truth, boundaries и open decisions до следующих infra-contracts.

## 2. Phase-1 Infrastructure Truth

- Phase 1 = simple practical baseline under narrow launch-core.
- Public site остаётся published read-side surface.
- Admin остаётся write-side surface.
- Infrastructure поддерживает существующую доменную модель, а не переопределяет её.
- Cloud/provider baseline: `Selectel`.
- Primary public domain: `ecostroycontinent.ru`.
- DNS baseline: domain and DNS provider stay in `Selectel`.
- Runtime baseline: one VM, Docker Engine, Docker Compose, Traefik, one compose stack with `app` container and `sql` container.
- Deploy baseline: GitHub repo `Kwentin3/ecostroycontinent` + GHCR + GitHub self-hosted runner on the same VM.
- Storage baseline: Selectel S3 + semantic split between `media` and `backups`.
- Delivery baseline: CDN in front of media delivery.
- Current practical TLS posture for phase 1: self-signed certificates.
- Phase-1 sizing baseline: `2 CPU`, `2 GB RAM`, `30 GB disk`.
- Secrets stay outside repo.
- Logging, forensics, backup and retention are mandatory.
- Kubernetes and microservices are explicitly out of scope for phase 1.

## 3. Accepted Baseline Decisions

- Один VM/VPS-like host достаточен для phase 1.
- `Traefik` остаётся reverse proxy / edge layer.
- Приложение и база данных живут на одной VM, но в разных контейнерах.
- Один compose stack с двумя основными контейнерами `app` и `sql` достаточен для phase 1.
- DNS provider for `ecostroycontinent.ru` stays in `Selectel`.
- Current practical TLS posture for phase 1 is self-signed; production-friendly TLS remains a later improvement decision.
- Baseline VM sizing is fixed at `2 CPU`, `2 GB RAM`, `30 GB disk`.
- GitHub остаётся code host; GHCR остаётся image registry.
- GitHub repo source of truth is `Kwentin3/ecostroycontinent`.
- Old typo repo `Kwentin3/ecostroycontinet` is non-canonical and must not be used for deploy, GHCR, runner or docs references.
- Self-hosted runner выполняет deploy на той же VM.
- Медиа и backup artifacts физически разделяются по разным S3 buckets under the `media` / `backups` naming convention.
- CDN служит delivery layer только для media path, а не заменяет app runtime.
- Secrets, keys and passwords do not live in repo or public infra docs.
- Runtime logging может временно жить в SQL на phase 1.
- Retention / cleanup posture обязательны и не откладываются.

## 4. Runtime Model

- Один runtime host в Selectel обслуживает phase-1 workload.
- На хосте поднимаются:
  - Docker Engine
  - Docker Compose
  - Traefik
  - `app` container
  - `sql` container
  - GitHub self-hosted runner
- Public traffic идёт через Traefik в `next-app`.
- `postgres` lives inside the `sql` container and обслуживает content core, leads, settings и служебные данные приложения.
- Exact packaging details for the runner and host services are not fixed in this baseline and belong to later contracts.

## 5. Storage Model

- Structured application truth lives in PostgreSQL.
- Media binaries live in Selectel S3 bucket following the `media` naming convention.
- Backup artifacts live in a separate Selectel S3 bucket following the `backups` naming convention.
- Public media must not become source of truth inside app templates or container filesystem.
- Container-local filesystem is not treated as canonical storage for media or backups.
- Persistent DB storage on the VM is required by the accepted runtime model, but exact volume layout remains a provisioning-level contract.

## 6. Delivery Model

- Primary public domain: `ecostroycontinent.ru`.
- DNS provider remains `Selectel`.
- Traefik is the public entrypoint for app traffic.
- Public site and admin surface are served by the same phase-1 application runtime, while keeping read-side / write-side separation at the domain level.
- Media delivery goes through S3 origin + CDN path.
- Exact DNS records remain open.
- Current phase-1 TLS posture is self-signed; the final production-friendly TLS improvement path remains open.

## 7. Secrets and Access Posture

- No secrets in git.
- No hardcoded secrets in compose or public docs.
- Public infra docs may reference secret names or `provided separately`, but not values.
- Accesses expected outside repo:
  - Selectel RC file
  - service user password
  - SSH private key
  - S3 credentials
  - GitHub / runner / GHCR credentials if needed
  - app and DB env secrets
- A local reference secret file may exist for the owner, but it is outside the canonical repo layer.

## 8. Logging / Forensic Baseline

- Logging is mandatory.
- Forensic posture is mandatory.
- Phase-1 baseline should capture at minimum:
  - application runtime logs
  - deploy/runtime events
  - backup / cleanup outcomes
  - critical operational events needed for incident reconstruction
- Runtime logging may stay in SQL on phase 1.
- Unbounded log growth is explicitly unacceptable.
- Exact event schema, tables or later migration to a separate log sink are not fixed here.

## 9. Backup / Recovery Baseline

- Backup flow to S3 is mandatory.
- Backup artifacts must go to the dedicated `backups` bucket, not to `media`.
- The phase-1 baseline must preserve enough restore material to recover the service after a routine host/runtime failure.
- Exact backup inventory, frequency and recovery targets are not yet fixed.
- Recovery posture belongs to the baseline; detailed procedures belong to later runbooks/contracts.

## 10. Retention / Cleanup Baseline

- Retention is mandatory for:
  - application logs
  - forensic events
  - backup artifacts
  - Docker leftovers
  - temporary files and stale runtime artifacts
- Cleanup is mandatory to protect finite VM disk.
- Exact retention numbers are still open.
- Cleanup policy must not silently delete the only valid recovery artifacts.

## 11. Deployment Baseline

- Source control: GitHub.
- Repository source of truth: `Kwentin3/ecostroycontinent`.
- Image registry: GHCR.
- Build path:
  - GitHub Actions builds images
  - images are published to GHCR
  - self-hosted runner on the VM performs deploy/update
  - Docker Compose refreshes runtime containers
- This baseline accepts image-based deployment, not manual file drift on the server.
- Exact workflow files, image names and runner registration method remain open inputs.

## 12. Environments Baseline

- One public phase-1 runtime environment is the only accepted mandatory baseline.
- Dedicated separate stage environment is not mandatory unless explicitly added later.
- Self-signed certificates are the current practical phase-1 TLS posture.
- Production-friendly TLS posture remains a later decision and should not be treated as already fixed.

## 13. Non-Goals

- Kubernetes
- microservice decomposition
- multi-region runtime
- complex network segmentation beyond phase-1 need
- enterprise-grade observability stack by default
- broad security manifesto inside this PRD
- managed database migration as a phase-1 requirement
- infrastructure decisions that reopen accepted product/content/admin canon

## 14. Open Decisions

- DNS records for `ecostroycontinent.ru`
- final production-friendly TLS improvement path
- exact GHCR namespace / image naming
- GitHub runner registration method
- backup frequency
- retention numbers
- exact runtime log / forensic structure in SQL
- timing and conditions of a future move from sql-in-container to managed database

## 15. Next Documents

- `INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md`
- `INFRA.Contract_Deploy_Path_and_GHCR_Экостройконтинент_v0.1.md`
- `INFRA.Contract_Storage_Backup_Retention_Экостройконтинент_v0.1.md`
- `INFRA.Contract_Secrets_and_Access_Экостройконтинент_v0.1.md`
- `INFRA.Runbook_Recovery_and_Operations_Экостройконтинент_v0.1.md`
