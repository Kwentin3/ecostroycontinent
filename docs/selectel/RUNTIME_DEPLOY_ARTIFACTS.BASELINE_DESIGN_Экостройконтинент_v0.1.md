# RUNTIME_DEPLOY_ARTIFACTS.BASELINE_DESIGN_Экостройконтинент_v0.1

## 1. Document Purpose

Этот документ фиксирует минимальный набор runtime/deploy artifacts, который должен появиться в репозитории проекта "Экостройконтинент", чтобы baseline provisioning/deploy path можно было реализовывать без архитектурных догадок.

Это design document, а не implementation pack. Он не заменяет host/runtime contract и deploy contract, а переводит их в минимально достаточный file surface для следующего implementation pass.

## 2. Current Execution Blocker

Текущий честный blocker после закрытия Selectel auth path:

- в репозитории отсутствует runtime/deploy surface;
- нет `Dockerfile` для `app`;
- нет compose surface для `app + sql`;
- нет GitHub Actions workflow для build/publish path в GHCR;
- нет committed env-boundary artifact, который задаёт допустимую форму runtime/deploy inputs без хранения секретов.

Пока этих файлов нет, повторный provisioning/deploy pass неизбежно начинает додумывать:

- как собирать `app` image;
- как запускать one-stack runtime;
- как публиковать artifact в GHCR;
- какие env inputs вообще должны существовать.

## 3. Minimal Required Artifact Set

Минимально обязательный набор для phase 1:

| Artifact | Expected path | Why it is required | Owner concern |
|---|---|---|---|
| App Dockerfile | `Dockerfile` | Даёт один канонический image build surface для `app` | app runtime + infra build |
| Compose surface | `compose.yaml` | Даёт один канонический one-stack runtime surface для `app` + `sql` | runtime / host-deploy boundary |
| Build/publish workflow | `.github/workflows/build-and-publish.yml` | Даёт канонический GHCR artifact path из GitHub | CI build surface |
| Env boundary example | `.env.example` | Фиксирует набор ожидаемых env names без секретов | runtime/deploy boundary |
| Docker ignore file | `.dockerignore` | Ограничивает build context и снижает риск accidental inclusion локального мусора, docs и sensitive хвостов | build-context hygiene |

Для этого pass не требуется отдельный mandatory deploy workflow file. На текущем шаге достаточно спроектировать и затем реализовать build/publish baseline; deploy execution surface уже зафиксирован отдельным infra-contract и может быть добран следующим узким implementation pass.

## 4. Dockerfile Design Boundary

### Purpose

`Dockerfile` должен описывать, как получить один deployable image для сервиса `app`.

### Why it is needed

- без него GHCR build/publish path не имеет честного source artifact;
- без него self-hosted runner не может работать с воспроизводимым image reference;
- без него baseline deploy сваливается в ad-hoc сборку на VM, что противоречит канону.

### Expected scope

`Dockerfile` должен:

- собирать ровно один production-oriented image для `app`;
- иметь явную точку запуска приложения;
- быть пригодным для публикации в GHCR;
- не зависеть от ручной сборки прямо на боевой VM.

### Allowed content class

- build steps, нужные именно для `app`;
- production runtime command;
- minimal exposed internal app port;
- multi-stage build, если он нужен для разумного уменьшения image size, но без избыточной сложности.

### Forbidden content class

- логика `sql`, `Traefik`, backup, runner;
- секреты, токены, ключи, пароли;
- hardcoded production URLs;
- deploy logic;
- fake placeholder command вроде `sleep infinity`;
- "temporary" image, который не запускает реальный `app`.

### Minimal design answer

Для phase 1 нужен один Dockerfile. Отдельные Dockerfile для dev/stage/admin сейчас не требуются.

## 5. Compose Surface Design Boundary

### Purpose

`compose.yaml` должен быть каноническим runtime launch surface для одного phase-1 stack.

### Why it is needed

- без него нельзя честно описать, как `app` и `sql` живут в accepted one-VM posture;
- без него self-hosted runner не имеет канонического runtime update entrypoint;
- без него deploy surface остаётся декларацией без минимального execution target.

### Expected scope

`compose.yaml` должен покрывать минимум:

- service `app`;
- service `sql`;
- internal service-to-service connectivity;
- explicit persistent storage hook for `sql`;
- env-file / env-variable attachment points без secret values;
- image reference path for `app`.

### Allowed content class

- один canonical compose file;
- named volume или иной минимальный persistence hook для `sql`;
- один internal network, если он реально нужен для читаемости;
- labels / hooks, совместимые с later Traefik integration, если они не раздувают baseline.

### Forbidden content class

- отдельные dev-only services;
- analytics/monitoring sidecars;
- hidden backup platform;
- секреты в явном виде;
- broad environment matrix;
- сложный multi-file orchestration baseline по умолчанию.

### One file or split

Для phase 1 baseline нужен один canonical compose file: `compose.yaml`.

Split на несколько compose files допускается только позже и только при явной практической причине. Сейчас split был бы overengineering и увеличил бы drift.

### Minimal design answer

Compose surface должен описывать только `app + sql`. Точное включение `Traefik` в этот же compose file остаётся open implementation point и не блокирует дизайн текущего minimal artifact set.

Persistence hook for `sql` не является optional detail и не должен оставляться "на потом" в implementation pass.

## 6. GitHub Actions / GHCR Workflow Design Boundary

### Purpose

`.github/workflows/build-and-publish.yml` должен задавать минимальный GitHub-based artifact flow:

1. взять canonical repo state;
2. собрать `app` image из `Dockerfile`;
3. опубликовать image в GHCR.

### Why it is needed

- без него GHCR остаётся договорённостью без repo-level execution surface;
- без него нет честного bridge между canonical repo и deployable artifact;
- без него следующий provisioning/deploy pass будет вынужден импровизировать CI path.

### Expected scope

Workflow должен:

- запускаться в GitHub Actions;
- собирать `app` image;
- публиковать tagged image в GHCR;
- оставлять traceable link между repo revision и image artifact.
- явно оставаться build/publish surface, а не притворяться полным deploy execution.

### Allowed content class

- minimal trigger logic;
- GHCR login/publish steps;
- build metadata / tags;
- narrow manual trigger и/или простой branch trigger.

### Forbidden content class

- full release governance;
- multi-environment promotion;
- SSH deploy script as mandatory part of этого же baseline;
- секреты в YAML;
- provisioning steps;
- broad rollback orchestration.

### Minimal design answer

На этом шаге достаточно одного workflow для build/publish baseline.

Отдельный dedicated deploy workflow может появиться следующим узким шагом, но не является обязательным artifact для текущего design pass. Важно лишь не выдавать build/publish workflow за полный deploy contract.

Boundary rule:

- build/publish concern = собрать и опубликовать artifact;
- deploy execution concern = runner на VM получает явную инструкцию обновить runtime до конкретного artifact.

Нельзя оставлять двусмысленность вида "runner как-нибудь сам подхватит новый image".

## 7. Env / Secrets Boundary Artifacts

### Mandatory artifact

`/.env.example`

### Purpose

Этот файл должен задавать список ожидаемых env names для runtime/deploy surface без хранения реальных значений.

### Why it is needed

- без него compose/workflow/Dockerfile начинают молча расходиться по именам env;
- без него следующий pass будет вынужден угадывать, какие inputs вообще нужны;
- он отделяет committed contract surface от реального secrets handoff.

### Allowed content class

- env variable names;
- пустые или example placeholders;
- короткие comments по тому, где переменная используется.

### Forbidden content class

- реальные secret values;
- RC credentials;
- SSH keys;
- S3 keys;
- GHCR tokens;
- production passwords;
- длинные application docs, не относящиеся к runtime/deploy boundary.

### Boundary rule

Коммитится только contract surface вроде:

- app runtime env names;
- SQL connection env names;
- image/runtime-related names, если они действительно нужны runtime/deploy path;
- optional bucket/CDN variable names, только если приложение уже реально использует их в phase 1.

Rule of minimality:

- не добавлять env names "на будущее";
- не раздувать `.env.example` в общий config catalog;
- если переменная не нужна для `app runtime`, `app -> sql` connection или уже реально используемого S3/CDN path, её не должно быть в baseline файле.

Не коммитятся:

- `.env`
- `.env.production`
- любые actual secret-bearing env files

## 8. Optional Supporting Files

Текущий blocker-closing baseline уже включает все обязательные files. Дополнительные supporting files сверх этого набора сейчас не нужны.

Что не требуется сейчас:

- `compose.override.yaml`
- dedicated `deploy.yml`
- stage-only env files
- separate secrets template pack
- broad Makefile / task runner layer

## 9. Artifact Placement in Repo

Recommended baseline placement:

| Path | Artifact | Reason |
|---|---|---|
| `Dockerfile` | app image build surface | simplest single-app baseline, no extra repo topology assumptions |
| `compose.yaml` | one-stack runtime surface | canonical phase-1 compose entrypoint |
| `.github/workflows/build-and-publish.yml` | GH Actions workflow | conventional GitHub execution path |
| `.env.example` | committed env contract surface | simplest low-noise place for runtime/deploy env names |
| `.dockerignore` | build-context boundary | protects baseline build surface from accidental context drift |

Placement rule:

- пока в repo нет явной multi-app структуры, не нужно вводить `apps/`, `deploy/`, `infra/compose/` только ради красоты;
- если до implementation pass появится реальная app directory structure, path decision must be revised explicitly, not silently.

## 10. Acceptance Criteria per Artifact

### `Dockerfile`

Достаточно спроектирован, если:

- ясно, что он собирает один `app` image;
- ясно, что image можно публиковать в GHCR;
- ясно, что он не содержит секретов и не включает unrelated infrastructure logic.

Overengineering:

- несколько Dockerfile без подтверждённой причины;
- dev/stage/prod matrix заранее;
- сложный build graph ради гипотетической оптимизации.

Dishonest placeholder:

- Dockerfile, который не запускает реальное приложение;
- file с generic base image без working app command.

### `compose.yaml`

Достаточно спроектирован, если:

- он покрывает `app + sql`;
- задаёт persistence hook for `sql`;
- даёт один canonical runtime entrypoint;
- не требует hidden extra files, чтобы вообще быть понятным.

Overengineering:

- split into multiple compose files by default;
- ввод дополнительных сервисов beyond `app + sql` без прямой необходимости.

Dishonest placeholder:

- compose file с services без runnable image/build semantics;
- file, который не описывает persistent SQL baseline.

### `.github/workflows/build-and-publish.yml`

Достаточно спроектирован, если:

- он явно строит image из canonical repo;
- публикует его в GHCR;
- оставляет revision-to-artifact traceability.

Overengineering:

- full release platform;
- stage/promotion matrix;
- advanced policy gates без реальной необходимости.

Dishonest placeholder:

- workflow file, который только echo-ит steps и не создаёт artifact;
- workflow, который объявлен как deploy path, но не делает даже build/publish.

Additional boundary:

- workflow acceptable for this pass may stop at GHCR publication;
- it must not imply that deploy execution on runner happens automatically unless a separate explicit deploy step/workflow is actually implemented.

### `.env.example`

Достаточно спроектирован, если:

- он задаёт минимально нужные variable names;
- не содержит ни одного реального секрета;
- помогает согласовать Dockerfile/compose/workflow inputs.

Overengineering:

- десятки speculative env names без связи с runtime/deploy surface;
- попытка превратить example file в полный app config spec.

Dishonest placeholder:

- file без meaningful variable names;
- file, который имитирует env contract, но не покрывает ни app, ни sql, ни build/runtime boundary.

### `.dockerignore`

Достаточно спроектирован, если:

- он явно исключает `.git`, docs output, локальные temp artifacts, env files с секретами и иные нерелевантные build-context classes;
- его наличие считается обязательной частью honest Docker build baseline.

Overengineering:

- сложная политика исключений без реального build context.

Dishonest placeholder:

- отсутствие `.dockerignore` при наличии `Dockerfile`;
- пустой файл, который ничего не ограничивает.

## 11. Explicit Non-Goals

- full production-ready Dockerfile implementation
- full final `compose.yaml`
- separate mandatory deploy workflow
- final secrets implementation
- stage pipeline
- release governance handbook
- app architecture redesign
- Traefik implementation details
- DB migration platform
- Kubernetes / microservices / orchestration redesign

## 12. Remaining Open Decisions

- точная app source layout в репозитории до implementation pass;
- exact app build command and runtime command;
- exact base image choice for `Dockerfile`;
- exact PostgreSQL image/version for `sql`;
- exact GHCR namespace / image / tag scheme;
- exact workflow trigger policy;
- exact later deploy workflow shape, если он будет отделён от build/publish workflow;
- exact env variable list beyond the minimal baseline names;
- exact placement of `Traefik` relative to compose surface;
- exact migration/schema-change handling.

## 13. Readiness for Implementation Pass

После появления этого minimal artifact set в репозитории:

- baseline provisioning/deploy pass станет честно реализуемым с точки зрения runtime/deploy surface;
- Selectel auth уже не будет главным blocker;
- оставшиеся unknowns уйдут в узкий implementation слой, а не в архитектурную пустоту.

Что всё ещё останется open даже после artifact creation:

- точные VM-side secret handoff mechanics;
- exact runner supervision;
- exact GHCR naming policy;
- exact rollback operator flow;
- exact runtime/deploy commands inside the future workflow and compose implementation.

Итоговый verdict:

- `artifact design ready for implementation pass`, если команда принимает описанный minimal file surface без расширения scope.
