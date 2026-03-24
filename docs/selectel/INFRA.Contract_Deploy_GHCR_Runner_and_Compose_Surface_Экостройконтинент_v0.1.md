# INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1

## 1. Document Purpose

Этот документ фиксирует минимальный deploy contract для phase-1 инфраструктуры проекта «Экостройконтинент».

Его задача: закрепить, как должен быть устроен deploy surface между canonical GitHub repo, GHCR, self-hosted runner и Docker Compose на одной Selectel VM.

Этот документ не является full CI/CD handbook, не заменяет secrets contract и не содержит production deployment implementation.

## 2. Scope of Deploy Surface

Accepted:

- Deploy surface phase 1 ограничен цепочкой:
  - GitHub repo
  - build/publication to GHCR
  - deploy execution on self-hosted runner
  - runtime update through Docker Compose
- Этот контракт существует поверх уже принятого host/runtime baseline и не переопределяет его.

Required:

- Deploy surface должен поддерживать accepted phase-1 runtime posture:
  - one VM
  - `app` + `sql`
  - `Traefik`
  - no Kubernetes
  - no microservices

Forbidden:

- Смешивать deploy contract с provisioning contract.
- Раздувать phase 1 до multi-environment release platform by default.

## 3. Accepted Deploy Model

Accepted:

- GitHub repo `Kwentin3/ecostroycontinent` is the canonical source of deploy truth.
- GitHub Actions remains the accepted build surface.
- GHCR remains the accepted image registry.
- Self-hosted runner on the VM remains the accepted deploy execution surface.
- Docker Compose remains the accepted runtime launch/update surface.
- Phase 1 accepts an image-based deploy model, not manual file-copy deployment.

Required:

- A deploy must be anchored to declared artifacts coming from the canonical repo and GHCR.
- Routine deploy must primarily update the `app` release.
- `sql` stays inside the same compose surface, but routine app deploys must not assume routine SQL container churn.

Allowed:

- Narrow manual approval or manual workflow dispatch in GitHub.
- Future refinement of triggers without changing the accepted deploy model.

Forbidden:

- Treating the old typo repo `Kwentin3/ecostroycontinet` as deploy truth.
- Building or mutating the live release directly on the VM as the canonical deploy method.

## 4. Source of Truth and Artifact Flow

Source of truth:

- GitHub repo `Kwentin3/ecostroycontinent`

Minimal accepted artifact flow:

1. Change is committed to the canonical GitHub repo.
2. GitHub build surface produces a release image.
3. Release image is published to GHCR.
4. Self-hosted runner on the VM receives the deploy instruction.
5. Runner updates the compose-managed runtime to the intended image reference.
6. Runtime resumes under the existing host/ingress contract.

Required:

- Repo truth, artifact truth and runtime truth must stay linked by an observable deploy trail.
- Runtime should be reproducible from repo state + image reference + compose/config state.

Forbidden:

- Ad-hoc deploys from local untracked files.
- Untracked artifacts as the only release source.

## 5. GHCR Baseline

Accepted:

- GHCR is the only accepted phase-1 container registry in the deploy path.
- GHCR stores deployable images for the runtime update path.

Required:

- Runner must pull deploy artifacts from GHCR, not from local ad-hoc builds.
- Deploy contract assumes versioned image references exist, even if exact tag scheme remains open.

Allowed:

- Exact GHCR namespace / image / tag naming to remain open for the next narrow contract or implementation pass.

Forbidden:

- Using the obsolete typo repo as the base for GHCR naming or docs references.
- Depending on mutable local images on the VM as canonical release artifacts.

## 6. Runner Baseline

Accepted:

- Self-hosted runner lives on the same Selectel VM as the phase-1 runtime.
- Runner is the deploy execution surface, not the product runtime itself.

Required:

- Runner responsibility ends at controlled deploy execution:
  - receive deploy job
  - authenticate to the required artifact/config surfaces
  - pull the intended image reference
  - execute compose-level update actions
  - emit deploy outcome signals
- Runner must not become a public request handler, app worker or editorial source of truth.

Allowed:

- Registration and supervision method may be chosen later with the simplest acceptable phase-1 setup.

Forbidden:

- Treating runner workspace as runtime source of truth.
- Mixing runner-only operational state with app content/state ownership.

## 7. Compose Surface Baseline

Accepted:

- Docker Compose is the phase-1 runtime launch and update surface.
- Compose surface must manage at minimum the two main containers:
  - `app`
  - `sql`

Required:

- Compose must be the canonical runtime update entrypoint for container release changes.
- Compose-level release updates must respect the host/runtime boundaries already fixed in the VM contract.
- Routine app deploys should not imply silent redesign of the compose surface.

Allowed:

- Exact compose file naming, project naming and file split to remain open.
- Exact treatment of `Traefik` inside or adjacent to the compose surface to remain open, as long as ingress canon is preserved.

Forbidden:

- Treating Compose as a visual orchestration platform or broad multi-service control plane.
- Bypassing compose with manual one-off container mutation as the accepted steady-state deploy path.

## 8. Deploy Trigger / Update Flow

Accepted:

- Minimal phase-1 deploy trigger may be GitHub-driven and narrow:
  - manual workflow dispatch
  - or a small branch/tag-based trigger
- Exact trigger policy remains open.

Required:

- Deploy flow must distinguish build concerns from deploy concerns:
  - build concern = produce/publish intended image artifact
  - deploy concern = update the VM runtime to that artifact
- Deploy flow should update `app` by explicit image reference and compose action.
- If a release requires SQL/schema-sensitive steps, those steps must be explicit and not hidden inside a vague “just redeploy” assumption.

Forbidden:

- Hidden deploy actions with no observable trigger.
- Treating every app release as an automatic SQL/runtime-wide mutation by default.

## 9. Rollback Baseline

Accepted:

- Minimal phase-1 rollback means returning the `app` runtime to a previously known-good image reference through the same deploy surface.

Required:

- Rollback must remain artifact-based, not memory-based.
- Rollback should be traceable to a prior known-good repo/image combination.

Allowed:

- Exact rollback command shape and operator flow to remain for later runbook/implementation work.

Forbidden:

- Treating rollback as an implicit full data recovery procedure.
- Assuming SQL/data rollback is automatically coupled to every app rollback.

Boundary:

- Deploy rollback covers release version reversal.
- Data recovery remains a separate backup/recovery concern.

## 10. Secrets / Credentials Boundaries

Required:

- No secret values in repo.
- No secret values in this contract.
- Deploy path may depend on:
  - GitHub-side credentials/tokens
  - GHCR pull credentials if needed
  - runner/host-side env secrets
  - app/runtime env secrets
- Secret ownership and handoff remain outside this document.

Allowed:

- Referring to secrets as named inputs or separately provided credentials.

Forbidden:

- Embedding live credentials in workflows, docs or compose examples used as canonical documentation.
- Collapsing the future secrets contract into this deploy contract.

## 11. Logging / Traceability for Deploy

Required:

- Every deploy should leave a minimum trace across the accepted surfaces:
  - source repo/revision reference
  - target image reference
  - runner execution outcome
  - compose update outcome
  - basic timestamped success/failure signal
- Deploy traceability must be sufficient for routine incident reconstruction.

Allowed:

- Exact storage of deploy traces to remain split across GitHub logs, runner logs and host/runtime evidence for phase 1.

Forbidden:

- Silent deploys with no durable outcome signal.
- Deploy path that cannot answer “what revision/image is live now?” with reasonable confidence.

## 12. Explicit Non-Goals

- full GitHub Actions workflow design
- full Docker Compose implementation
- stage pipeline as mandatory baseline
- blue/green, canary or multi-step orchestration by default
- full secrets implementation
- broad release governance process
- Kubernetes or other orchestration redesign
- automatic data recovery as part of ordinary deploy

## 13. Open Decisions

- exact GHCR namespace / image / tag scheme
- exact runner registration and supervision method
- exact deploy trigger policy
- exact compose file naming / project layout
- exact handling of `Traefik` inside or adjacent to the compose surface
- exact migration / schema-change handling in deploy flow
- exact rollback operator flow
- exact deploy trace persistence split across GitHub, runner and host logs

## 14. Acceptance Criteria

This contract is acceptable when:

- it is clear that GitHub repo `Kwentin3/ecostroycontinent` is the deploy source of truth;
- it is clear how GHCR, runner and compose participate in the minimal phase-1 deploy path;
- it is clear where build concerns stop and deploy concerns begin;
- it is clear where deploy concerns stop and runtime concerns begin;
- it is clear what minimal rollback means and what it explicitly does not mean;
- it does not require full workflow code, compose manifests or secrets implementation to stay coherent;
- unresolved implementation-level points remain explicitly listed as open decisions.
