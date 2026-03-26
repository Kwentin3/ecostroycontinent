# PRD Task Delegation API

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: draft / working skeleton  
База: текущий canonical execution flow, admin first-slice canon, acceptance report и closing plan

## 1. Purpose and non-goals

Этот документ описывает продуктовые требования к удобному API, через который оператор может делегировать мне или другому автономному исполнителю работу по репозиторию без постоянного переписывания контекста в чате.

Цель API не в том, чтобы заменить planning, contracts или acceptance review. Цель в том, чтобы упаковать работу в структурированный execution package, который:

- содержит канонические источники;
- задаёт границы изменений;
- фиксирует ожидаемый результат и proof;
- позволяет выполнять работу батчами;
- поддерживает stop-and-escalate без потери контекста;
- остаётся repo-bound и canon-safe.

### Non-goals

- Не строить общий multi-agent orchestration platform.
- Не строить public developer portal.
- Не заменять PRD, contracts или implementation plan.
- Не вводить новый source of truth для продукта.
- Не превращать API в task tracker с enterprise workflow theater.
- Не добавлять отдельную scheduling систему, если достаточно простого package/state model.

## 2. Problem statement

Сейчас делегирование работы автономному исполнителю требует слишком много неструктурированного текста: контекст, канон, ограничения, proof expectations и stop rules приходится повторять вручную.

Это создаёт риски:

- prompt drift;
- loss of canonical sources;
- неявные scope expansions;
- размытые stop points;
- слабую воспроизводимость результата;
- лишние ручные согласования там, где они не нужны.

Нужен API, который позволяет передать работу как честный execution package и затем получить понятный статус, proof и итоговый verdict.

## 3. Target users and actors

### Operator / owner

Человек, который формирует пакет работы, задаёт границы и получает итоговый proof.

### Autonomous executor

Исполнитель, который читает package, выполняет работу в репозитории и возвращает результаты, proof и stop triggers.

### Reviewer / approver

Человек, который использует output API, чтобы быстро понять:

- что было запрошено;
- что было сделано;
- что было доказано;
- где был stop;
- можно ли принимать результат.

## 4. Product principles

- One package must be enough to start meaningful work.
- Canonical sources must be explicit, not implied.
- Scope boundaries must be machine-readable and human-readable.
- Work should be executable in bands or workstreams, not as one opaque blob.
- Stop rules must be first-class, not hidden in prose.
- Proof must be attached to execution, not invented after the fact.
- The package must support both narrow implementation tasks and wider closing batches.
- The API must preserve repo-bound execution and not drift into general orchestration.

## 5. Core capabilities

### 5.1 Execution package creation

The API must let an operator create a work package with:

- objective;
- scope;
- canonical sources;
- repo / branch context;
- allowed and forbidden changes;
- execution bands or workstreams;
- proof requirements;
- stop-and-escalate conditions;
- expected deliverables;
- optional comments for the executor.

### 5.2 Canonical source binding

The API must support attaching the sources of truth that the executor must use.

Required source classes:

- PRD and contract documents;
- implementation plan;
- acceptance report;
- closing plan / owner wishes, when relevant;
- repo state snapshot or commit reference;
- any explicit owner confirmations required for the batch.

The package must distinguish:

- canonical inputs;
- helpful context;
- optional references;
- out-of-scope materials.

### 5.3 Scope guardrails

The API must let the operator specify:

- files or modules that may change;
- files or modules that must not change;
- product areas in scope;
- explicit anti-scope;
- whether the batch is allowed to make narrow reversible fixes;
- whether documentation sync is allowed.

### 5.4 Band-based execution

The API must support sequential bands, not only one monolithic task.

Typical band types:

- acceptance-closing band;
- owner-wishes band;
- proof-hardened band;
- cleanup / sync band.

Each band should be able to declare:

- prerequisites;
- stop triggers;
- proof obligations;
- acceptance gate;
- whether the next band may start automatically.

### 5.5 Progress and proof reporting

The API must return execution results in a way that is:

- human-readable;
- machine-parseable;
- reproducible;
- tied to concrete artifacts.

At minimum, the proof bundle should be able to include:

- commands run;
- environment used;
- test results;
- build results;
- screenshots or UI evidence if relevant;
- changed files;
- migrations applied;
- unresolved blockers;
- explicit pass / partial / blocked verdict for each band.

### 5.6 Stop-and-escalate handling

The API must support first-class stop reporting.

Stop output should distinguish:

- owner-level blocker;
- infra/runtime blocker;
- canon conflict;
- scope drift risk;
- proof gap;
- implementation defect within scope.

The executor should be able to stop without losing the package context or the proof trail.

### 5.7 Package replay and cloning

The API should support reusing a previous package as a base for a new batch.

Useful cases:

- follow-up band after acceptance review;
- bugfix batch after proof failure;
- same pattern applied to another slice;
- reopening a prior task with minimal changes.

## 6. Minimum package model

The API should support a work package with at least these logical fields:

- `title`
- `goal`
- `context`
- `canonical_sources`
- `repo_scope`
- `allowed_changes`
- `forbidden_changes`
- `execution_bands`
- `proof_requirements`
- `stop_triggers`
- `deliverables`
- `status`
- `verdict`
- `history`

The transport format can be JSON, YAML, form UI, or another internal representation. The PRD does not lock the final wire format.

## 7. Recommended API behaviors

### 7.1 Create

The operator should be able to create a new package from scratch or from an existing template.

### 7.2 Read

The operator should be able to inspect current status, band progress, proof, and blockers without reading raw execution logs first.

### 7.3 Update

The operator should be able to append clarifications, proof requirements, or bounded corrections without rewriting the whole package.

### 7.4 Close

The package should end in one of a small number of terminal outcomes:

- accepted;
- accepted with conditions;
- blocked;
- deferred;
- cancelled.

### 7.5 Audit trail

Every change to the package should be visible as a human-readable timeline.

## 8. UX requirements for the package consumer

Even if the first implementation is API-first, the operator experience must stay simple:

- the package must be easy to scan;
- canonical sources must be visible at a glance;
- the current band must be obvious;
- stop reasons must be readable without parsing raw logs;
- proof must be grouped by band;
- the final verdict must be explicit.

## 9. Constraints and canon

This API must obey the existing project canon:

- it must not introduce a second source of truth for work or product state;
- it must not mutate product canon;
- it must not become a planning replacement;
- it must not authorize canon-breaking shortcuts;
- it must not expand into a general task marketplace;
- it must remain compatible with repo-bound, autonomous execution.

The API itself is not a new product domain for customers. It is an operator tool for delegating execution work safely.

## 10. Success criteria

The API can be considered successful if:

- a new work package can be created without re-explaining the whole project every time;
- the executor can start from canonical sources and package scope alone;
- execution bands are visible and controllable;
- stop points are readable and actionable;
- proof is attached to execution, not bolted on later;
- an owner can review what happened and decide quickly;
- the package can be reused for the next batch with minimal rewriting.

## 11. Open questions

- What exact transport should the first implementation use: JSON over HTTP, internal admin UI, or both?
- Should the package live as a persistent entity in SQL from day one, or start as an API-only envelope with later persistence?
- Which terminal verdicts are required for phase 1, and which can wait?
- How much of the package should be editable after start, and what should be immutable once execution begins?
- Should the API support attachments to repo files and docs by path, or only by semantic source references?

## 12. Draft recommendation

The recommended first cut is a narrow, repo-bound execution package API with:

- structured inputs;
- canonical source binding;
- band-based execution;
- proof bundle output;
- stop-and-escalate support;
- package replay / cloning.

That is enough to make delegation materially easier without turning the project into an orchestration platform.
