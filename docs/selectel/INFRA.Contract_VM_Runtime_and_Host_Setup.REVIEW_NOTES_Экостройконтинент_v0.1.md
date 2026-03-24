# INFRA.Contract_VM_Runtime_and_Host_Setup.REVIEW_NOTES_Экостройконтинент_v0.1

## Confirmed from previous documents

- Phase 1 remains a narrow launch-core and accepts a simple practical infra baseline.
- Provider stays `Selectel`.
- One-VM posture is already accepted for phase 1.
- DNS provider for `ecostroycontinent.ru` stays in `Selectel`.
- Current practical TLS posture for phase 1 is self-signed.
- VM sizing baseline is now fixed at `2 CPU`, `2 GB RAM`, `30 GB disk`.
- `Docker Engine` + `Docker Compose` remain the accepted runtime layer.
- `Traefik` remains the accepted ingress layer.
- One compose stack with `app` + `sql` on the same VM remains accepted for phase 1.
- `GitHub` + `GHCR` + self-hosted runner on the same VM remain the accepted deploy posture.
- GitHub repo source of truth is `Kwentin3/ecostroycontinent`.
- Old typo repo `Kwentin3/ecostroycontinet` is non-canonical.
- `S3` with separate `media` and `backups` naming conventions remains accepted.
- `CDN` remains the media delivery layer.
- Logging, forensics, backup and retention are mandatory.
- Public site stays published read-side; admin stays write-side; infra must not break that split.
- Dedicated separate stage environment is not mandatory for current phase 1.

## Assumptions kept open on purpose

- Exact DNS records for `ecostroycontinent.ru`.
- Final production-friendly TLS improvement path.
- Exact volume layout on the VM.
- Exact runner packaging / supervision method.
- Exact log sink, healthchecks, restart policies and retention numbers.

## Owner review points

- No additional owner confirmation is required to review this contract revision.
- Remaining open points are implementation-level or later-phase operational decisions.

## Intentionally excluded from this contract

- Terraform, OpenStack CLI or any other provisioning implementation.
- Full Docker Compose manifests.
- Detailed deploy workflow design and GHCR naming.
- Detailed secrets/access handoff.
- Detailed backup schedule and recovery procedures.
- Detailed TLS/DNS implementation.
- Any push toward Kubernetes, microservices or early managed-DB migration.
