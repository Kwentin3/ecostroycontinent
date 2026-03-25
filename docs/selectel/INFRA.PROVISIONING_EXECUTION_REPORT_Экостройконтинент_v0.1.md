# INFRA.PROVISIONING_EXECUTION_REPORT_Экостройконтинент_v0.1

## Purpose

Этот документ фиксирует factual result execution-pass по базовому phase-1 provisioning для проекта «Экостройконтинент».

Статус этого прохода: `blocked before cloud resource creation`.

## What Was Planned

- проверить доступы и входной пакет;
- создать одну VM в Selectel;
- создать S3 buckets для `media` и `backups`;
- подготовить CDN baseline;
- подготовить host/runtime/deploy baseline;
- зафиксировать factual operational state.

## What Was Actually Completed

- Локальный git `origin` уже указывает на canonical repo `Kwentin3/ecostroycontinent`.
- GitHub access подтверждён:
  - repo `Kwentin3/ecostroycontinent` доступен;
  - default branch = `main`.
- Локальный tooling baseline уточнён:
  - `docker` доступен локально;
  - `gh` auth работает;
  - `python-openstackclient` был установлен локально как минимальный execution tool.
- Наличие локальных secret-reference assets подтверждено без раскрытия значений.
- Selectel auth был реально проверен через локальный `rc.sh`.
- Фактическое наличие runtime manifests в repo было проверено.

## What Was Not Completed

Не выполнено из-за blockers:

- VM creation
- SSH verification against provisioned VM
- bucket creation
- CDN creation
- DNS creation/update
- Traefik host setup on remote VM
- self-hosted runner setup on remote VM
- GHCR pull validation on remote VM
- compose runtime creation for `app` + `sql`
- backup path setup to S3
- remote logging / cleanup / retention hooks

## Agent Choices Made Locally

- В качестве минимального local execution tool был установлен `python-openstackclient 9.0.0`.
- На этом проходе не создавались placeholder cloud resources и не сочинялись runtime manifests.
- Execution был остановлен на первом подтверждённом access blocker и втором confirmed repo blocker.

## Blockers and Warnings

### Blocking

1. Selectel auth check failed with `HTTP 401`.
   Это означает, что текущий локальный `rc.sh` / service-user auth не даёт рабочий cloud access для provisioning.

2. `NO_RUNTIME_MANIFESTS_FOUND` in repo.
   В репозитории отсутствуют `Dockerfile`, `docker-compose` / `compose` manifests и `.github/workflows`, поэтому даже при успешном cloud access нельзя честно завершить runtime/deploy baseline без новых implementation artifacts.

### Warnings

- Input pack документирует “prepared access”, но фактический cloud auth на этом execution pass не подтвердился.
- GHCR naming, runner method, backup cadence и retention numbers по-прежнему остаются open implementation decisions.

## Deviations From Canon

- Архитектурных deviations from canon не вводилось.
- Фактическое отклонение от ожидаемого execution path только одно: documented Selectel access currently does not authenticate.

## Short Verdict

Этот execution pass не дошёл до создания облачных ресурсов.

Состояние:

- `access checks`: completed
- `cloud provisioning`: blocked
- `runtime/deploy provisioning`: blocked
- `factual reporting`: completed
