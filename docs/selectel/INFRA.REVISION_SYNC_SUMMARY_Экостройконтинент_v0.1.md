# INFRA.REVISION_SYNC_SUMMARY_Экостройконтинент_v0.1

## Drift points fixed

- `UNBOOK` file naming drift was corrected to `RUNBOOK`, and redirect mapping was added.
- Primary domain `ecostroycontinent.ru` was kept canonical and synchronized with DNS provider `Selectel`.
- TLS wording was tightened: self-signed is now the accepted current phase-1 posture, while a production-friendly TLS improvement path remains open.
- VM sizing ambiguity was removed: baseline is now `2 CPU`, `2 GB RAM`, `30 GB disk`.
- Runtime packaging wording was aligned to one compose stack with two main containers: `app` and `sql`.
- GitHub repo source of truth was synchronized to `Kwentin3/ecostroycontinent`.
- S3 wording was narrowed from fully unknown bucket names to an accepted `media` / `backups` naming convention.
- Stage wording was tightened: dedicated separate stage is not a mandatory baseline for current phase 1.

## Open decisions removed

- VM size as an unresolved point
- disk size as an unresolved point
- DNS provider ambiguity
- whether self-signed TLS is acceptable for current phase 1
- whether dedicated separate stage is mandatory for current phase 1

## Open decisions still remaining

- exact DNS records
- final production-friendly TLS improvement path
- exact GHCR image/tag naming
- exact runner registration and supervision method
- exact persistent volume layout
- exact retention numbers
- exact healthcheck details
- exact log sink / rotation implementation

## Readiness

The infra-doc set is now sufficiently synchronized for the next narrow document:

- `deploy / GHCR / runner / compose surface contract`

No additional broad revision pass is required before that next step.
