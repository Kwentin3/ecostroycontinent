# Agent API Invocation Contract Pack Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: contract pack / invocation layer  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md), [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md), [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md), [Admin_Agent_Ops_Autonomous_Execution_Report_Экостройконтинент_v0.1.md](../reports/2026-03-25/Admin_Agent_Ops_Autonomous_Execution_Report_Экостройконтинент_v0.1.md)

## Purpose

Этот пакет описывает, как internal agent должен безопасно вызывать внутренние tools / API в рамках phase 1 канона.  
Он нужен не для расширения runtime, а для фиксации invocation contract: что означает tool, когда его можно вызывать, кто действует от чьего имени, какие проверки обязательны и когда агент должен остановиться.

## Scope

- доменное значение agent-callable tools;
- минимальный canonical template одной tool contract;
- delegation envelope и роль делегирования;
- правила выбора и последовательности вызовов;
- error / stop taxonomy;
- compact examples of representative tool contracts;
- separation of domain contract, invocation contract and agent usage contract.

## What this document owns

- общую модель contract pack для agent invocation;
- минимальные обязательные поля одного tool contract;
- границу между domain meaning, runtime invocation и agent usage rules;
- delegation envelope как first-class safety boundary;
- machine-readable и human-readable failure model.

## What this document does not own

- полный endpoint inventory проекта;
- backend adapters;
- JSON schema для всех сущностей;
- новый platform layer;
- UI админки;
- конкретную реализацию publish / rollback / media / diagnostics;
- raw DB / raw storage execution.

## Canon assumptions

- `Phase 1 = narrow launch-core`.
- `Admin Console = write-side tool`.
- `Public Web = published read-side only`.
- `Content Core in SQL = source of truth`.
- `MediaAsset = first-class entity`.
- `Publish = explicit domain operation`.
- `Approval != Publish`.
- `AI = assistive only`.
- `No autonomous publish`.
- `No raw unrestricted DB access`.
- `No raw unrestricted storage access`.
- `Business Owner = review-first / truth-confirmation posture`.
- `Agent ops remains behind safe media boundary`.

## Non-goals

- полноценный backend protocol spec на весь продукт;
- новый AI orchestration platform;
- общий admin shell;
- rule engine для произвольных действий;
- giant enterprise spec pack ради формы;
- размывание role boundaries под удобство executor-а.

## Why simple API docs are not enough

Обычный OpenAPI / Swagger описывает форму запроса и ответа, но не решает главные safety-вопросы:

- что tool означает в доменных терминах;
- когда tool можно вызывать, а когда нельзя;
- кто действует напрямую, а кто только по делегированию;
- какие границы нельзя пересекать даже при технически валидном вызове;
- что делать при blocked / ambiguous / partial failure;
- как зафиксировать audit trail так, чтобы его могли читать люди и LLM.

Без layered contract pack агент легко начинает:

- выбирать “почти подходящий” tool;
- auto-chain-ить вызовы через blocked boundary;
- трактовать approval как publish;
- воспринимать owner как editor;
- использовать allowlist как декоративную проверку.

## Proposed contract-pack structure

Пакет должен быть разделён на 5 слоёв.

### 1. Domain contract

Отвечает на вопрос: что делает operation в терминах бизнеса и домена.

Должен фиксировать:

- domain meaning;
- explicit non-meaning;
- owning domain;
- affected entity family;
- какие публичные последствия tool может и не может иметь.

### 2. Invocation contract

Отвечает на вопрос: что runtime ожидает получить и вернуть.

Должен фиксировать:

- identity tool-а;
- required input shape;
- preconditions;
- execution semantics;
- side effects;
- output shape;
- failure codes;
- audit requirements.

### 3. Agent usage contract

Отвечает на вопрос: когда агенту именно этот tool вызывать, а когда нет.

Должен фиксировать:

- tool selection guidance;
- prerequisite checks;
- forbidden combinations;
- partial failure handling;
- stop conditions;
- forbidden auto-chaining.

### 4. Delegation envelope

Отвечает на вопрос: по чьему поручению и в какой рамке агент действует.

Должен фиксировать:

- initiator human;
- acting role;
- delegated scope;
- explicit prohibitions;
- review requirements;
- expiry / revocation;
- trace / audit context.

### 5. Error / stop taxonomy

Отвечает на вопрос: как tool и agent должны сигнализировать о blocked, rejected, ambiguous и runtime-failure состояниях.

Должен фиксировать:

- machine code;
- human-readable reason;
- retry policy;
- when to stop;
- when to ask for review;
- when to select another bounded tool, а когда нельзя.

## Minimal canonical fields for one tool contract

Любой tool contract считается минимально достаточным только если в нём есть:

| Field | Meaning |
| --- | --- |
| `contract_id` | уникальный id контракта |
| `version` | версия контракта |
| `operation_name` | имя tool / API operation |
| `owning_domain` | домен-ответственный за смысл |
| `domain_meaning` | что operation делает в терминах бизнеса |
| `explicit_non_meaning` | что operation делать не должен |
| `allowed_roles` | кто может вызывать напрямую |
| `delegation_requirements` | кто может вызывать через делегирование |
| `preconditions` | что должно быть истинно до вызова |
| `input_contract` | обязательные и запрещённые входы |
| `execution_semantics` | sync / async, idempotency, side effects |
| `output_contract` | success / blocked / rejected / dry-run |
| `failure_contract` | machine codes и human reasons |
| `audit_contract` | что должно логироваться |
| `stop_conditions` | когда агент обязан остановиться |
| `agent_usage_rules` | когда вызывать и когда не вызывать |

## Representative tool contracts

Эти примеры показывают, как template работает на практике. Это не полный каталог API.

| Example | Domain meaning | Invocation / usage boundary |
| --- | --- | --- |
| `create_draft_entity` | создать новый draft для `Service`, `Case`, `Page`, `FAQ` и т.д. | только draft-state, без publish side effect, нужен корректный entity type и delegated scope |
| `update_draft_entity` | изменить draft-кандидат в рамках разрешённой сущности | нельзя менять published truth напрямую; если change class требует owner review, tool должен вернуть blocked / needs_confirmation |
| `submit_revision_for_review` | перевести готовый draft в review lane | только если readiness checks выполнены; не публикует и не делает content live |
| `validate_publish_readiness` | проверить готовность к publish | read-only, dry-run by default, возвращает blocking и warning separately |
| `request_upload_slot` / `finalize_upload` | оформить безопасный media upload boundary | upload и finalize раздельны; finalize не равен publish и не должен его скрыто вызывать |
| `attach_media` | привязать MediaAsset к сущности или gallery | только после безопасного media state; relation update, не binary mutation и не publish |
| `db_get_row` / `storage_probe_object` | получить bounded read-only access для диагностики | allowlist only, exact registry match, no raw shell, no fallback dispatcher |
| `build_review_packet` | собрать decision-ready packet для owner review | не меняет truth; подготавливает diff, proof, blockers и trace context |

## Recommended document set

### New pack docs

- [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md)
- [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md)
- [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](./Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md)
- [Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md](./Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md)
- [Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md](./Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md)
- [Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md](./Agent_Security_Sensitive_Operation_Addendum_Экостройконтинент_v0.1.md)

### Canon source docs

- [PRD_Экостройконтинент_v0.3.1.md](./PRD_Экостройконтинент_v0.3.1.md)
- [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md)
- [Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md)
- [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md)
- [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md)
- [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md)
- [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)
- [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md)
- [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)

## Open questions

- Какие tool families входят в MVP invocation surface, а какие остаются diagnostics-only?
- Какие human-only operations вообще не должны иметь agent-callable аналога?
- Нужно ли в MVP различать tool contracts по `Superadmin` / `SEO Manager` / `Business Owner`, или достаточно single contract с delegation gating?
- Какие tool-операции требуют mandatory dry-run перед executed mode?

## Risks / failure modes

- OpenAPI описан, но agent usage rules не описаны и agent начинает импровизировать.
- Delegation envelope есть на бумаге, но runtime не проверяет expiry / revocation / scope.
- Role gating есть, но owner начинает читаться как general editor.
- Allowlist exact-match есть в docs, но runtime допускает fallback mapping.
- Error taxonomy есть, но blocked conditions возвращаются как generic failure и теряют смысл.

## Decisions that must not be reopened by default

- Domain contract, invocation contract and agent usage contract remain separate layers.
- `upload != publish`.
- `approval != publish`.
- `owner != general editor`.
- `unknown allowlist_id -> reject`.
- `agent cannot improvise around blocked boundaries`.
- `No raw unrestricted DB access`.
- `No raw unrestricted storage access`.
- `No autonomous publish`.

## Implementation notes for future coding, but no code

- Runtime should validate tool identity, delegation envelope, role, exact allowlist id and boundary state before dispatch.
- Any missing required field must fail closed with a stable machine code and a human explanation.
- A tool contract must not be accepted if its wording allows publish to be inferred from upload, approval or review.
- Tool selection logic should prefer the narrowest domain-specific operation, not the most convenient technical primitive.
- Credential bootstrap, reset and rotate contracts must import the security-sensitive addendum when secret material is involved.
