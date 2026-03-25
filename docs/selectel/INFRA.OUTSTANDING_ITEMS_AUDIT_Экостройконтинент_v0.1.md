# INFRA.OUTSTANDING_ITEMS_AUDIT_Экостройконтинент_v0.1

## Purpose

This document summarizes the remaining infrastructure items after the baseline provisioning retry-pass and separates:

- owner-level decisions;
- hardening tasks before more serious exploitation;
- non-blocking hygiene follow-ups.

Basis:

- `PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md`
- `INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.2.md`
- `INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`
- `INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md`

## Current Baseline State

Already factual and working:

- Selectel VM baseline
- Docker / Compose / Traefik host runtime
- app + sql runtime on the Linux VM
- GHCR build/pull path
- self-hosted GitHub runner
- manual deploy workflow
- S3 buckets for `media` and `backups`
- off-host backup upload into the `backups` bucket
- public media origin bucket
- CDN resource created and active
- CDN object fetch confirmed on both HTTP and HTTPS object paths
- public DNS for apex and `www`
- Let's Encrypt certificate on Traefik for `ecostroycontinent.ru` and `www.ecostroycontinent.ru`
- SSH password auth disabled
- `fail2ban` enabled with active `sshd` jail

Still not fully closed:

- backup restore drill
- remote backup retention/lifecycle
- several documentation and workflow hygiene items

## 1. Must Decide

### Public DNS plan

Currently factual for the adopted public path:

- `ecostroycontinent.ru` resolves to `178.72.179.66`
- `www.ecostroycontinent.ru` resolves to `178.72.179.66`
- no DNS-side blocker remains for the current site-domain path

What can still remain open later:

- whether a separate media/CDN hostname will be introduced later
- whether future DNS cutover should include more hostnames than apex + `www`

Practical implication:

- public site-domain certificate issuance is no longer blocked by DNS

Canonical references:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:160](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L160)
- [INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:54](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md#L54)

### Future production-friendly TLS posture

Materially closed for the current public site hostnames:

- `ecostroycontinent.ru` serves a real Let's Encrypt certificate on the VM runtime
- `www.ecostroycontinent.ru` is covered by the same certificate
- Traefik serves SANs for both hostnames

Residual note:

- local Windows-side trust oddities during operator verification should be treated as local client-path issues unless contradicted by external checks

Canonical references:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:35](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L35)
- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:161](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L161)

## 2. Must Harden

### Backup restore drill

Still missing:

- one practical restore-oriented drill from the uploaded S3 artifact

Why this matters:

- upload alone proves off-host storage
- it does not yet prove recoverability

References:

- [INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:48](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md#L48)

### Remote backup lifecycle / retention

Still missing:

- bucket lifecycle / retention for the `backups` bucket

Why this matters:

- local cleanup exists
- remote storage still needs bounded retention to avoid ungoverned growth

References:

- [INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:49](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md#L49)
- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:124](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L124)

## 3. Can Stay Open Temporarily

### Backup frequency

Still not canonically fixed in the PRD, although a working daily cron exists.

Reference:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:164](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L164)

### Exact retention numbers

Still not fixed at the PRD level.

Reference:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:165](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L165)

### Exact runtime log / forensic structure

Still open in the PRD, but the minimal working log surfaces already exist on the VM.

Reference:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:166](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L166)

### Runner registration method

Still open in the PRD, but no longer a delivery blocker because the runner is already installed and online.

Reference:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:163](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L163)

### Future managed DB timing

Still intentionally open and remains out of current phase-1 execution scope.

Reference:

- [PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md:167](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md#L167)

## 4. Hygiene Follow-Ups

- bump GitHub Actions away from Node 20-era action versions
- decide whether the host repo checkout should remain root-owned
- tighten Traefik dashboard access posture if the dashboard is kept
- refresh stale wording in older provisioning docs whenever the factual state changes again

References:

- [INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.2.md:198](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.2.md#L198)
- [INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:73](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md#L73)

## 5. Recommended Working Order

1. Run one restore-oriented backup drill from S3 when live data starts to matter.
2. Add remote lifecycle/retention for the `backups` bucket when backup hardening is reprioritized.
3. Clean up workflow and operator-maintenance hygiene items.

## 6. Honest Status

Infrastructure baseline is no longer blocked by missing core resources.

The remaining work is mostly:

- one owner decision branch;
- backup hardening work;
- several non-blocking hygiene follow-ups.
