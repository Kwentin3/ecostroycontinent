# RUNTIME_DEPLOY_ARTIFACTS.POST_IMPLEMENTATION_GAPS_Экостройконтинент_v0.1

## What Is Closed

Repository-level runtime/deploy blocker is closed.

The repo now contains:

- a minimal `next-app` baseline
- a real `Dockerfile`
- a real `compose.yaml`
- a real build/publish workflow for GHCR
- a minimal `.env.example`
- a mandatory `.dockerignore`

## What Still Remains Open

These are no longer blocker-class gaps for repo implementation, but they still remain open:

- exact GHCR tag policy
- exact future deploy workflow on runner
- exact VM-side secret delivery
- exact `Traefik` attachment on host/runtime boundary
- exact rollback operator flow

## Local Verification Limits Found

Current Windows machine still has local tooling limits:

- Docker Linux-container backend is not healthy for full `docker build` verification
- Compose CLI is not available in the current Docker installation

This affects local parity checks, but does not invalidate the implemented repo artifacts.

## Recommended Next Step

Next best step:

1. re-run baseline provisioning against Selectel with the new repo artifacts;
2. use the target Linux VM as the honest container/runtime execution environment;
3. treat local Windows Docker limitations as workstation issues, not as repo-state blockers.
