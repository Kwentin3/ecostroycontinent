# INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface.REVIEW_NOTES_Экостройконтинент_v0.1

## Confirmed from existing canon

- Canonical repo source of truth is `Kwentin3/ecostroycontinent`.
- Phase 1 keeps one VM in Selectel with one compose stack and two main containers: `app` and `sql`.
- `Traefik` remains the ingress layer.
- GHCR remains the accepted image registry.
- Self-hosted runner on the VM remains the accepted deploy execution surface.
- Deploy stays image-based and must not drift into manual snowflake mutation on the server.
- Dedicated separate stage environment is not a mandatory phase-1 baseline.
- Current TLS posture remains self-signed and does not change the deploy contract itself.

## Points intentionally left open

- exact GHCR namespace / image / tag naming
- exact runner registration and supervision method
- exact deploy trigger policy
- exact compose file naming / project layout
- exact `Traefik` placement inside or adjacent to the compose surface
- exact migration / schema-change handling
- exact rollback operator flow
- exact deploy trace persistence split

## Owner review points

- No new owner-level architecture decision is required to review this contract.
- Remaining open points are mainly implementation-level choices for the next execution-oriented pass.

## Intentionally excluded implementation details

- full GitHub Actions workflow YAML
- full Docker Compose files
- secret values and final credentials handoff
- exact branch protection / release governance rules
- stage pipeline design
- detailed rollback runbook
