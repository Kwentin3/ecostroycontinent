# RUNTIME_DEPLOY_ARTIFACTS.BASELINE_DESIGN.REVIEW_NOTES_Экостройконтинент_v0.1

## Confirmed by existing canon

- Phase 1 keeps one VM, one compose stack, `app + sql`, `Traefik`, GHCR and self-hosted runner.
- Canonical repo source of truth is `Kwentin3/ecostroycontinent`.
- Selectel auth path is no longer the primary blocker.
- Current honest blocker is missing runtime/deploy artifacts in the repository.
- Dedicated separate stage is not a mandatory baseline.
- Public site remains read-side, admin remains write-side, and runtime artifacts must not break that split.

## Design choices intentionally made here

- Minimal mandatory file set is limited to `Dockerfile`, `compose.yaml`, `.github/workflows/build-and-publish.yml`, `.env.example` and `.dockerignore`.
- `compose.yaml` is kept as one canonical file for baseline; split compose topology is deferred.
- `compose.yaml` must include an explicit persistence hook for `sql`; this is not deferred.
- Build/publish workflow is mandatory now; separate deploy workflow is intentionally not mandatory in this design pass.
- Build/publish and deploy execution are kept explicitly separate: artifact publication is mandatory now, runner-driven deploy execution remains a later explicit step.
- Repo-root placement is recommended because the repository does not yet expose a real app directory topology.

## Assumptions kept open

- exact app source layout before implementation
- exact build/runtime command of the app
- exact PostgreSQL image/version
- exact GHCR naming scheme
- exact trigger policy for the workflow
- exact future deploy workflow shape
- exact `Traefik` placement relative to compose surface
- exact env variable list beyond the minimal baseline

## Owner review points

- No new owner-level infrastructure decision is required to review this design.
- The only potentially visible confirmation point is whether phase 1 should keep the simplest repo-root artifact placement if app code is added as a single runtime surface.

## Implementation details intentionally excluded

- final `Dockerfile` content
- final `compose.yaml` content
- final GitHub Actions YAML
- final secret names and values
- final deploy commands on runner
- final rollback runbook
- final TLS, DNS and host provisioning details
