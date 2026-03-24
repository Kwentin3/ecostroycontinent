# INFRA.GAPS_AND_INPUT_READINESS_Экостройконтинент_v0.1

## Purpose

Этот документ отделяет уже готовый infra input от missing inputs и даёт практическую readiness assessment для следующих агентских шагов.

## What is ready now

- Product/domain canon is stable enough for infra work
- Phase-1 infra posture is already accepted:
  - Selectel
  - DNS in Selectel
  - one VM
  - `2 CPU / 2 GB RAM / 30 GB disk`
  - Docker + Compose
  - Traefik
  - one compose stack with `app` + `sql` on the same VM
  - self-signed TLS as current practical phase-1 posture
  - GitHub + GHCR
  - self-hosted runner on the VM
  - GitHub repo `Kwentin3/ecostroycontinent`
  - S3 semantic split for `media` and `backups`
  - CDN for media
  - secrets outside repo
  - logging / forensics / retention mandatory
- Infra input pack exists locally in the repo working tree
- Local Selectel RC reference exists
- Public domain is now known: `ecostroycontinent.ru`

## What is missing now

- exact DNS records
- final production-friendly TLS improvement path
- exact GHCR namespace / image naming
- GitHub runner registration method
- backup frequency
- retention numbers
- exact runtime log / forensic structure
- exact persistent volume layout
- tracked repo state for the public infra input pack
- runtime manifests:
  - compose files
  - Dockerfiles
  - deploy workflow files

## What blocks provisioning

- no exact DNS records for the public runtime
- no concrete image naming / runner registration details
- no runtime manifests in repo to anchor deploy/runtime contracts
- no provisioning-level contract yet for persistent DB storage layout

## What does not block PRD

- exact retention numbers
- exact backup schedule
- future move to managed database
- whether a separate stage environment appears later
- future production-friendly TLS improvement path
- whether logs remain in SQL after phase 1
- local secret-reference file handling, if `.gitignore` stays explicit and no secrets are committed

## Recommended next step

Next best step: `infra contracts drafting`, not provisioning prompt.

Recommended narrow contract set:

1. VM runtime and host setup contract
2. Deploy path and GHCR contract
3. Storage / backup / retention contract
4. Secrets / access handoff contract

After those contracts, do one preparatory pass to lock:

- DNS
- GHCR/image naming
- runner registration method

## Readiness assessment

- Ready for infra contracts drafting: `Yes`
- Ready for provisioning prompt: `No`
- Needs one more preparatory pass before provisioning: `Yes`

## Short verdict

The project already has enough accepted truth to stop brainstorming and start writing narrow infra contracts. It does not yet have enough concrete provisioning inputs to safely issue a full provisioning prompt without avoidable assumptions.
