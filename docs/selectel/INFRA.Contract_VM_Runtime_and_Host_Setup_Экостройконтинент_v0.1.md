# INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1

## 1. Document Purpose

Этот документ фиксирует канонический host/runtime contract для phase-1 инфраструктуры проекта «Экостройконтинент».

Он отвечает на вопрос: как должен быть устроен runtime baseline на одной VM в Selectel так, чтобы он был простым, управляемым и не ломал уже принятый продуктовый и инфраструктурный канон.

Этот документ не является provisioning guide, deploy runbook, Compose manifest или security-handbook.

## 2. Scope and Role of VM Host

Accepted:

- Одна VM в `Selectel` остаётся допустимым runtime host для phase 1.
- Эта поза допустима, потому что phase 1 остаётся narrow launch-core с одним обязательным публичным runtime environment и без требований к многозонной или multi-node схеме.
- Baseline sizing for this VM is fixed at `2 CPU`, `2 GB RAM`, `30 GB disk`.
- `app` и `sql` на одной VM допустимы сейчас, потому что phase 1 приоритизирует простоту операционного контура, а не раннюю инфраструктурную декомпозицию.
- DNS provider for `ecostroycontinent.ru` remains `Selectel`.
- Self-signed certificates are the current practical TLS posture for phase 1; production-friendly TLS remains a later improvement decision.

Required:

- VM должна нести host/runtime baseline для:
  - ingress
  - application runtime
  - database runtime
  - deploy execution on host
  - bounded local operational evidence
- VM должна поддерживать публичный домен `ecostroycontinent.ru` как primary public runtime target после фиксации точных DNS records.

Forbidden:

- Рассматривать phase-1 VM как повод для раннего ввода Kubernetes, multi-VM orchestration или микросервисной схемы.
- Навешивать на host дополнительные платформенные слои, не нужные для launch-core.

Open:

- Exact DNS records for `ecostroycontinent.ru`.

## 3. Accepted Runtime Model

Accepted:

- Host OS: одна general-purpose Linux VM.
- Runtime layer: `Docker Engine` + `Docker Compose`.
- Edge / ingress layer: `Traefik`.
- Application runtime: один `app` container.
- Database runtime: один `sql` container.
- One compose stack with `app` + `sql` is the accepted phase-1 runtime packaging.
- Deploy execution surface: `GitHub self-hosted runner` на этой же VM.
- External managed layers: `GitHub`, `GHCR`, `Selectel S3`, `CDN`.

Required:

- Public website и admin surface обслуживаются одним phase-1 app runtime, сохраняя read-side / write-side separation на доменном уровне.
- `sql` container remains the PostgreSQL runtime on the same host and does not become a public ingress endpoint.
- Self-hosted runner остаётся deploy concern и не является частью публичного request path.

Allowed:

- В будущем вынести SQL runtime за пределы VM, если phase-1 ограничения перестанут быть достаточными.
- Уточнить packaging mode для runner без смены самого accepted runtime model.

Forbidden:

- Переоткрывать same-VM posture как будто уже принято требование к отдельному SQL host.
- Смешивать deploy tooling с публичным runtime path.

## 4. Host-Level Components

Required on the VM:

- Host OS и стандартный service manager.
- Docker Engine.
- Docker Compose.
- Traefik runtime.
- `app` container runtime.
- `sql` container runtime.
- GitHub self-hosted runner.
- Persistent local storage для SQL runtime.
- Bounded local storage для логов, forensic artifacts, runner workspace и временных operational файлов.

Allowed on the VM:

- Обычные host-level utilities, нужные для поддержки Docker/runtime/deploy baseline.
- Временные operational artifacts, если у них есть cleanup posture.

Forbidden on the VM as source of truth:

- Каноническое хранение media binaries.
- Каноническое хранение backup artifacts на долгий срок.
- Secrets в repo-working-tree или публичных docs.
- Raw CDN URLs как canonical media identity.
- Snowflake build artifacts как единственный deploy source.

## 5. Runtime Placement Rules

Required:

- `Traefik` является единственным публичным ingress component на VM host.
- `app` container работает за Traefik и не рассматривается как отдельно публикуемый edge endpoint.
- `sql` container живёт только во внутреннем runtime контуре и не открывается как публичный surface.
- Persistent truth for structured content, settings, leads and publish state lives in PostgreSQL, а не в container filesystem.
- Runner живёт на VM, но логически отделён от app/sql runtime и не владеет продуктовой truth-моделью.

Allowed:

- Docker-managed volumes или host-mounted volumes для DB и вспомогательных runtime needs.
- Временные local files для deploy, backup staging или log rotation, если они bounded и не претендуют на роль canonical storage.

Forbidden:

- Treating container-local filesystem as canonical storage for media, backups or published content truth.
- Direct public exposure of database runtime.
- Bypassing Traefik as canonical ingress path.
- Treating runner workspace as source of truth for runtime state.

Boundary rule:

- Host concerns = OS, Docker runtime, ingress service, local disk discipline, local operational evidence, runner supervision.
- App concerns = product logic, publish logic, read-side rendering, admin behavior, content truth.

## 6. Network / Ingress Baseline

Accepted:

- Primary public domain: `ecostroycontinent.ru`.
- DNS provider remains `Selectel`.
- Public ingress terminates on Traefik.
- One public runtime environment is the only mandatory phase-1 baseline.
- Dedicated separate stage environment is not mandatory for current phase 1 unless explicitly added later.
- Self-signed certificates are the current practical TLS posture for phase 1.

Required:

- Only Traefik should face public HTTP(S) traffic.
- `app` and `sql` runtime services must not become independent public network entrypoints by default.
- Public site remains published read-side surface; admin remains write-side surface within the same app runtime baseline.

Allowed:

- Non-public technical access path for maintenance or temporary stage-like checks.
- Future improvement from self-signed to a more production-friendly TLS posture.

Forbidden:

- Publishing the database directly to the internet.
- Treating direct container port exposure as the canonical production ingress design.
- Inventing multi-domain or multi-environment routing in this contract without accepted input.

Open:

- Exact DNS records for `ecostroycontinent.ru`.
- Final production-friendly TLS improvement path.
- Whether admin uses same host/path or a separate public route pattern.

## 7. Storage / Volume Baseline

Required:

- VM disk must have room for:
  - host OS
  - Docker runtime data
  - persistent PostgreSQL storage
  - Traefik runtime state if needed by chosen implementation
  - runner workspace
  - bounded local logs / forensic artifacts
  - bounded temporary operational files
- PostgreSQL data must survive container recreation and ordinary host restart.
- App runtime must stay replaceable from image + config, not from hand-mutated local filesystem.
- Media binaries remain in S3; backups remain in a separate S3 bucket.
- VM storage policy must assume the accepted sizing baseline of `30 GB disk` and avoid growth patterns that cannot fit into that posture.

Allowed:

- Exact volume layout to be decided later at provisioning/compose-contract level.
- Short-lived local backup/export staging before upload to S3.

Forbidden:

- Storing the only valid copy of media on VM disk.
- Storing the only valid recovery copy solely on the VM.
- Allowing uncontrolled growth of Docker layers, temp files, logs or runner leftovers.

## 8. Logging / Forensic Baseline on Host

Required:

- Host/runtime layer must preserve enough evidence to reconstruct:
  - host restart or service failure
  - Traefik failure or proxy-level issue
  - app/sql container crash or restart
  - deploy attempt outcome
  - cleanup / backup job outcome
- At minimum, host/runtime evidence should include:
  - Traefik access/error signals
  - container stdout/stderr or equivalent service logs
  - Docker/runner/service lifecycle events
  - operational task outcomes that affect recovery or incident analysis

Allowed:

- Standard host logging primitives such as service-manager logs, bounded file logs or both.
- SQL-backed runtime/event logging as a complement to host evidence.

Forbidden:

- Unbounded log growth.
- Silent operational actions with no observable outcome signal.
- Treating host logging as optional because some events also exist in app-level SQL tables.

Open:

- Exact host log sink and format.
- Exact split between SQL forensic events and host-local service logs.

## 9. Retention / Cleanup Expectations

Required:

- Cleanup on VM is mandatory because disk is finite.
- Cleanup policy must cover at least:
  - stopped containers
  - dangling images and unused Docker leftovers
  - stale runner workspace artifacts
  - expired temporary backup/export files
  - rotated logs outside retention
- Disk-pressure handling must remove non-canonical leftovers first, not persistent runtime truth.

Allowed:

- Exact cadence, automation mechanism and thresholds to be defined later.

Forbidden:

- Deleting active DB volumes as routine cleanup.
- Deleting current runtime artifacts blindly.
- Deleting the latest recoverable backup or the only remaining forensic evidence still inside retention.

Open:

- Exact retention numbers.
- Exact disk-pressure thresholds.

## 10. Restart / Recovery Expectations

Required:

- Ordinary host reboot must not require reprovisioning to restore runtime.
- Ordinary container restart must not destroy canonical SQL state.
- Traefik, app runtime, SQL runtime and runner service should be able to resume through ordinary host/service/container restart behavior.
- Recovery baseline must support restoration from routine host/runtime failure with existing phase-1 components and backup posture.

Allowed:

- Short manual operator verification after restart or routine maintenance.

Forbidden:

- Runtime design that depends on manually reconstructed container state after every restart.
- Treating ephemeral app filesystem as the only place where required runtime state lives.

Open:

- Exact restart policies.
- Exact healthcheck behavior.
- Exact recovery targets and timings.

## 11. Deployment Surface Boundaries

Accepted:

- GitHub Actions builds and publishes images to GHCR.
- Self-hosted runner on the VM executes deploy/update actions.
- Docker Compose refreshes runtime containers from versioned images and configuration.

Required:

- Runtime concerns and deploy concerns stay separated:
  - runtime concerns = Traefik, app, sql serving the current release
  - deploy concerns = runner, image pull, compose update, release switch/restart actions
  - host concerns = OS, Docker, disk discipline, local evidence
- Deploy path must update runtime from declared artifacts, not from ad-hoc SSH edits inside running containers.

Allowed:

- Future narrow deploy contract to specify workflow names, image tags and deploy triggers.

Forbidden:

- Using the runner as an app worker or public request handler.
- Using runtime containers as canonical build environment.
- Manual snowflake mutation of live containers as the accepted deployment method.

## 12. Explicit Non-Goals

- Kubernetes
- microservices
- multi-VM high-availability topology
- managed database migration as a phase-1 requirement
- full secrets/access contract
- full backup/recovery runbook
- detailed TLS/DNS implementation
- enterprise observability stack
- Terraform or Compose implementation in this contract

## 13. Open Decisions

- Exact persistent volume layout
- Exact DNS records for `ecostroycontinent.ru`
- Final production-friendly TLS improvement path
- Exact self-hosted runner packaging/supervision method
- Exact log sink/rotation implementation
- Exact cleanup cadence and retention numbers
- Exact healthcheck and restart policy details

## 14. Acceptance Criteria for This Contract

This contract is acceptable when:

- it is clear why one VM is allowed for phase 1;
- it is clear why `app` + `sql` on the same VM are accepted for now;
- it is clear which components must live on the VM and which canonical truths must remain external;
- it is clear where host concerns stop and app concerns begin;
- it is clear where runtime concerns stop and deploy concerns begin;
- it is clear how finite disk, cleanup and local operational evidence are treated at baseline level;
- it does not require invented DNS, TLS, sizing or secrets to remain coherent;
- all unresolved provisioning-level specifics remain explicitly listed as open decisions.
