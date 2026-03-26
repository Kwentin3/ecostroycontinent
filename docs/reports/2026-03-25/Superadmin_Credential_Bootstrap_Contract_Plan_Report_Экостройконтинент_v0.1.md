# Superadmin Credential Bootstrap Contract & Plan Report Экостройконтинент v0.1

Дата: 2026-03-25  
Проект: «Экостройконтинент»  
Тип: design report / security-sensitive contract pack  
Место в репозитории: `docs/reports/2026-03-25/`

## Executive summary

Подготовлен узкий contract-first пакет для одного security-sensitive кейса: bootstrap логина и пароля для учётной записи `Superadmin`.

Ключевая цель этого пакета не в том, чтобы построить полный IAM, а в том, чтобы безопасно описать одну bounded operation так, чтобы:

- агент мог участвовать только в пределах explicit delegation envelope;
- человек оставался инициатором и конечным владельцем авторизации;
- secret material не утекал в логи, отчёты, transcripts и audit events;
- операция fail-closed на любой неоднозначности;
- bootstrap не превращался в reset / rotate / role elevation shortcut;
- пакет встраивался в уже принятый agent invocation contract pack, а не ломал его.

В результате создана минимальная, но достаточная связка документов:

1. [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](../../product-ux/Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)
2. [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](../../product-ux/Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md)
3. [Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md](../../product-ux/Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md)

Генеральный вывод:

- canonical name выбран как `bootstrap_superadmin_credentials`;
- операция определена как one-time / exceptional security bootstrap boundary;
- agent не получает plaintext secret и не становится секрет-холдером;
- общий agent API invocation pack дополнен security-sensitive overlay, потому что обычных domain / invocation / usage / delegation / error правил недостаточно для secret-bearing flows;
- implementation path intentionally остаётся narrow и не уводит проект в auth platform sprawl.

## Why this operation is special

`bootstrap_superadmin_credentials` - это не обычный CRUD, не обычный password reset и не role elevation.

Она особенная по нескольким причинам:

1. Она создаёт или активирует стартовую privileged access boundary для всей системы.
2. Она может включать генерацию или раскрытие секрета, который нельзя логировать или повторно воспроизводить без явного security design.
3. Она должна быть human-initiated и explicitly authorized.
4. Она должна быть auditable, но audit не может содержать plaintext secret.
5. Она должна быть one-time или, как минимум, tightly constrained exceptional flow.
6. Она должна fail-closed при ambiguity, unsafe delivery, delegation expiry или повторной попытке bootstrap поверх уже существующего результата.

Именно поэтому в пакет добавлен отдельный security-sensitive addendum. Generic tool contract template полезен для обычных операций, но для secrets нужен явный overlay:

- secret classification;
- one-time reveal posture;
- redaction rules;
- audit exclusions;
- secure delivery rules;
- stop conditions for secret ambiguity.

Без этого agent быстро начинает воспринимать credential handling как обычный operational task, а это уже backdoor drift.

## Canonical operation name

Выбранное имя: `bootstrap_superadmin_credentials`

Почему именно оно:

- `bootstrap` фиксирует исключительный одноразовый характер действия;
- `superadmin_credentials` ограничивает scope именно учётными данными, а не generic user management;
- имя не скрывает тот факт, что операция security-sensitive;
- имя не создаёт ложное ожидание, что это reusable admin setup shortcut.

Почему не другие варианты:

- `initialize_superadmin_account` звучит шире и опаснее: может читаться как создание аккаунта в целом, а не как узкий security bootstrap.
- `provision_superadmin_credentials` слишком легко превращается в повторяемую операционную процедуру и звучит как обычная provisioning workflow.

## What was created

### 1) Security-sensitive addendum

Файл: [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](../../product-ux/Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)

Назначение:

- описать, как секреты классифицируются;
- как они могут быть раскрыты только один раз;
- что нельзя писать в логи, отчёты, docs или agent transcripts;
- какие delivery channels допустимы;
- какие redaction и audit-exclusion правила обязательны.

Это addendum нужен как mandatory overlay для любого tool contract, который касается secret material.

### 2) Bootstrap contract

Файл: [Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md](../../product-ux/Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md)

Назначение:

- описать доменный смысл операции;
- зафиксировать permission boundary;
- отделить bootstrap от reset / rotate / CRUD / role elevation;
- определить input / output / failure / audit / stop semantics;
- встроить delegation envelope и secret-handling overlay.

### 3) Execution plan

Файл: [Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md](../../product-ux/Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md)

Назначение:

- описать, как это потом безопасно реализовывать;
- зафиксировать stop gates до coding;
- показать порядок принятия решений;
- удержать minimal runtime boundary;
- не дать плану расползтись в full auth platform.

## Contract shape summary

Для `bootstrap_superadmin_credentials` зафиксированы следующие поля и смысловые слои:

- `contract_id`;
- `operation_name`;
- `version`;
- `owning_domain`;
- `domain_meaning`;
- `explicit_non_meaning`;
- `allowed_initiators`;
- `allowed_roles`;
- `delegation_requirements`;
- `preconditions`;
- `input_contract`;
- `prohibited_inputs`;
- `execution_semantics`;
- `output/result_contract`;
- `failure_semantics`;
- `audit_contract`;
- `stop_conditions`;
- `agent_usage_rules`.

Отдельно через addendum добавлены security-sensitive поля:

- `secret_class`;
- `secret_present_in_input`;
- `secret_present_in_output`;
- `secret_delivery_mode`;
- `one_time_reveal_required`;
- `redaction_policy`;
- `secret_audit_exclusions`;
- `secret_rotation_scope`;
- `reveal_owner`.

Это важно, потому что именно здесь проходит граница между обычной tool invocation и secret-bearing operation.

## Delegation model

Операция определена как human-initiated и explicitly authorized.

Основная модель:

- есть one-time bootstrap authority, которая инициирует действие;
- agent может действовать только on behalf of that authority;
- delegation должна быть explicit, scoped и time-bounded;
- delegation должна быть revocable;
- agent не должен сам решать, что пришло время создать superadmin credentials;
- technically valid API call still may be forbidden for the agent if delegation scope does not cover it.

Что это даёт:

- человек остаётся owner of intent;
- agent становится bounded operator, а не security admin;
- один и тот же tool нельзя использовать как скрытый backdoor для произвольного privileged-user creation.

## Secret-handling posture

Это самый чувствительный блок.

Зафиксировано:

- plaintext password, bootstrap token, recovery code, secret link value и похожие секреты не должны попадать в обычные logs, reports, docs, audit events или agent transcripts;
- если bootstrap предполагает one-time reveal, secret может быть показан только один раз и только через secure human-only delivery path;
- agent transcript должен содержать только redacted status и nonsecret metadata;
- audit должен фиксировать факт handling, тип секрета, направление delivery, reveal status и channel posture, но не сам secret.

Дополнительно зафиксированы принципы:

- не логировать секрет, а потом пытаться “санитизировать”;
- не подменять secret hash recoverable text;
- если что-то можно replay-нуть как секрет, это тоже не должно попадать в обычный лог;
- если secure delivery cannot be guaranteed, operation must fail closed.

## Execution plan summary

Execution plan deliberately narrow and security-first.

### Workstream 1: contract finalization

Цель:

- финально зафиксировать operation meaning, non-meaning и security overlay.

Что должно быть решено до coding:

- canonical operation name;
- one-time vs exceptional scope;
- whether secret is generated server-side or entered by human in secure operator surface;
- whether reveal is secure UI only or another explicitly governed secure channel.

### Workstream 2: delegation and authority model

Цель:

- описать, кто именно может инициировать вызов и в какой рамке.

Stop gates:

- no generic app role may become implicit bootstrap authority;
- no hidden role escalation;
- no ambiguous target identity.

### Workstream 3: runtime path selection

Цель:

- определить, какой minimal service boundary будет использовать существующие auth primitives.

Важно:

- не использовать ordinary user-create route как bootstrap backdoor;
- не записывать raw credentials напрямую в DB;
- не вводить broad auth platform layer.

### Workstream 4: secure delivery and redaction

Цель:

- определить one-time reveal posture;
- определить redaction rules and audit exclusions;
- определить human-only delivery channel.

Stop gates:

- any need to show secret in ordinary transcript;
- any delivery path that is not explicitly secure and bounded;
- any reuse of bootstrap secret as reusable support artifact.

### Workstream 5: verification and implementation gate

Цель:

- проверить, что design is narrow, auditable and fail-closed;
- подготовить proof artifacts before coding.

Required proofs:

- final bootstrap contract;
- addendum coverage;
- delegation model;
- secret redaction matrix;
- secure delivery decision;
- runtime path decision;
- explicit no-reset / no-rotate statement;
- explicit statement that agent never sees plaintext secret values.

## Relationship to the current agent contract pack

Новый пакет не отменяет уже существующий agent API invocation pack.
Он расширяет его только в одном месте: security-sensitive operations.

Что уже покрыто generic pack:

- domain contract;
- invocation contract;
- agent usage rules;
- delegation envelope;
- error / stop taxonomy.

Что добавляет bootstrap-specific layer:

- secret classification;
- one-time reveal semantics;
- secure delivery posture;
- stricter redaction policy;
- audit exclusions for secret material;
- explicit no-backdoor boundary for bootstrap flows.

Именно поэтому addendum нужен отдельно, а не как “ещё один пункт в template”.
Для обычных tools template достаточно.
Для secrets нужен overlay, иначе safety details легко теряются.

## Runtime context considered

Этот report и связанные документы были спроектированы с учётом существующих auth primitives и ролевой модели проекта.

Полезный контекст:

- в кодовой базе уже есть login/password primitives;
- есть существующий user creation path;
- есть hashing / verification helpers;
- есть phase-1 roles `Superadmin`, `SEO Manager`, `Business Owner`.

Но этот контекст не означает, что bootstrap должен быть сделан через обычный user CRUD flow.
Напротив, документация специально удерживает:

- bootstrap как exceptional security operation;
- ordinary user CRUD как separate concern;
- no raw DB manipulation of credentials;
- no agent-chosen escalation path.

## Verification and safety checks

Проверка пакета проводилась как docs-only verification.

Что должно быть true после применения пакета:

- `bootstrap_superadmin_credentials` read as one-time exceptional flow;
- secret material is not normalized into agent logs or reports;
- agent may only act within delegation envelope;
- ambiguity leads to stop;
- bootstrap / reset / rotate are distinct;
- generic invocation pack remains intact and is not overextended;
- implementation plan remains narrow and does not drift into full IAM.

What was intentionally not done:

- no code changes;
- no new auth platform;
- no broad user-management redesign;
- no general password reset ecosystem;
- no reusable admin bypass.

## Risks and residuals

Residual risks are intentionally small but real:

1. The actual runtime implementation still needs a narrow service boundary decision.
2. The secure human-only delivery path still needs to be turned into code or operator UX.
3. The current app auth primitives must be wired without creating a hidden shortcut.
4. If the team later adds more secret-bearing operations, the generic template may need optional secret fields as a future enhancement.

These are not blockers for the contract design itself.
They are implementation decisions that must stay within the bounds defined here.

## Open questions

These are the only questions left intentionally open before coding:

- Will the initial password be generated server-side and revealed once, or entered by a human in a secure operator surface?
- Is the bootstrap authority deployment-time only, or an explicitly governed operator class for this one-time action?
- Do we need a minimal secure reveal UI now, or only a service-level contract with human-only delivery semantics?
- Which exact runtime service boundary will own the primitive so that the ordinary user-create route cannot become a backdoor?

## Explicit non-goals

This package does not design:

- full IAM / SSO / MFA platform;
- broad account lifecycle management;
- password reset ecosystem;
- role-elevation framework;
- raw DB writes for credentials;
- reusable emergency bypass;
- agent autonomous security admin behavior;
- future surfaces such as public AI chat, calculator, SEO dashboard, CRM-lite, broad analytics, EN rollout, or multi-region launch.

## Final assessment

The bootstrap design is ready as a narrow contract pack and execution plan.

What is good:

- the canonical name is narrow and explicit;
- the operation is human-mediated and fail-closed;
- secret handling is treated as a first-class security boundary;
- delegation is bounded, revocable and auditable;
- the generic agent contract pack remains useful without being abused as a secret-delivery mechanism.

What remains intentionally unresolved:

- exact runtime service boundary implementation;
- exact secure reveal surface;
- final code wiring.

Those items are properly left to the implementation phase, because the design now contains the guardrails needed to keep them safe.

