# Agent API Invocation Contract Pack Report Экостройконтинент v0.1

Дата: 2026-03-25  
Проект: «Экостройконтинент»  
Тип: implementation report / contract-pack design  
Место: `docs/reports/2026-03-25/`

## Executive summary

Собран узкий contract pack для безопасного agent invocation в admin console + internal agent ops контуре.  
Пакет не расширяет runtime и не превращает agent в автономного оператора истины. Вместо этого он фиксирует безопасную multilayer-модель:

- `domain contract` - что tool означает в бизнесе;
- `invocation contract` - что runtime ожидает и возвращает;
- `agent usage contract` - когда tool можно и нельзя вызывать;
- `delegation envelope` - кто действует от чьего имени и в какой рамке;
- `error / stop taxonomy` - как агент обязан останавливаться на blocked / ambiguous / forbidden состояниях.

Решение удерживает phase-1 canon:

- `Admin Console` остаётся write-side;
- `Public Web` остаётся published read-side only;
- `Content Core` в SQL остаётся source of truth;
- `Publish` остаётся explicit domain operation;
- `Approval != Publish`;
- `AI = assistive only`;
- `Business Owner` остаётся review-first / truth-confirmation role;
- raw DB / raw storage access для agent не нормализуются.

## What was created

Новый pack состоит из 5 документов в `docs/product-ux/`:

1. [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](../../product-ux/Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md)
2. [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](../../product-ux/Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md)
3. [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](../../product-ux/Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md)
4. [Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md](../../product-ux/Agent_Tool_Usage_Rules_Экостройконтинент_v0.1.md)
5. [Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md](../../product-ux/Agent_Error_and_Stop_Taxonomy_Экостройконтинент_v0.1.md)

Для контекстной совместимости использовались уже существующие canon/spec docs:

- [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](../../product-ux/Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md)
- [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](../../product-ux/RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md)
- [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](../../product-ux/Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md)
- [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](../../product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md)
- [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](../../product-ux/Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)
- [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](../../product-ux/DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md)
- [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](../../product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)
- [Admin_Agent_Ops_Autonomous_Execution_Report_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Autonomous_Execution_Report_Экостройконтинент_v0.1.md)

## Why this pack exists

Обычного OpenAPI / Swagger здесь недостаточно.  
Он описывает форму вызова, но не фиксирует:

- доменный смысл tool-а;
- делегирование authority;
- choice rules для agent-а;
- stop conditions;
- forbidden combinations;
- безопасную модель ошибок;
- логирование и forensic trace.

Без этого agent очень быстро начинает:

- выбирать “почти подходящий” tool;
- auto-chain-ить действия через blocked boundary;
- трактовать approval как publish;
- воспринимать owner как editor;
- считать allowlist декоративной проверкой.

Новый pack закрывает именно этот gap.

## Design choices

### 1. Separation of concerns

Пакет намеренно разделён на 3 слоя:

- `domain contract` - business meaning;
- `invocation contract` - runtime expectation;
- `agent usage contract` - sequencing and boundary behavior.

Это важно, потому что агенту недостаточно знать, что tool “делает”.  
Ему нужно знать, когда tool уместен, когда он запрещён и что делать при blocked состоянии.

### 2. Delegation as first-class boundary

Введён отдельный delegation envelope, чтобы agent acted on behalf of human/role/scope, а не как самостоятельный субъект власти.

Envelope фиксирует:

- `initiator_human_id`;
- `acting_role`;
- `delegated_scope`;
- `allowed_operations` or `policy_reference`;
- explicit prohibitions;
- review requirement;
- expiry / revocation;
- trace / audit fields.

Это сделано, чтобы технически валидный call всё равно мог быть disallowed, если:

- scope слишком широк;
- delegation expired;
- delegation revoked;
- call crosses publish boundary;
- call crosses safe media boundary;
- call needs exact allowlist match.

### 3. Fail-closed usage rules

В usage rules агенту запрещено:

- обходить blocked boundary соседним tool-ом;
- трактовать upload как publish;
- трактовать approval как publish;
- нормализовать raw DB / raw storage access;
- использовать fallback dispatcher под видом удобства.

Если операция blocked or ambiguous, агент обязан остановиться.

### 4. Stable error and stop model

Error / stop taxonomy специально разделяет:

- invalid input;
- forbidden by role;
- forbidden by delegation scope;
- blocked by review requirement;
- blocked by publish boundary;
- blocked by safe media boundary;
- blocked by allowlist policy;
- runtime failure;
- ambiguous / missing context.

Это нужно, чтобы:

- человек мог быстро понять причину блока;
- LLM-assisted investigation имела стабильные коды;
- agent не превращал blocked condition в попытку обхода.

## Minimal canonical shape of one tool contract

В pack зафиксирован минимальный набор полей для любой agent-callable tool contract:

- `contract_id`
- `version`
- `operation_name`
- `owning_domain`
- `domain_meaning`
- `explicit_non_meaning`
- `allowed_roles`
- `delegation_requirements`
- `preconditions`
- `input_contract`
- `execution_semantics`
- `output_contract`
- `failure_contract`
- `audit_contract`
- `stop_conditions`
- `agent_usage_rules`

Это deliberately narrow.  
Мы не проектировали полный backend spec и не раскрывали весь каталог endpoints.

## Representative examples included in the pack

В overview doc показано 7 representative tool summaries:

- `create_draft_entity`
- `update_draft_entity`
- `submit_revision_for_review`
- `validate_publish_readiness`
- `request_upload_slot` / `finalize_upload`
- `attach_media`
- `db_get_row` / `storage_probe_object`
- `build_review_packet`

Эти примеры нужны, чтобы пакету было понятно, как template применяется вживую, но без превращения документа в полный endpoint inventory.

## Canon constraints preserved

Пакет не ломает уже принятый канон:

- admin stays write-side only;
- public stays published read-side only;
- content core in SQL remains source of truth;
- media asset remains first-class entity;
- upload is not publish;
- approval is not publish;
- owner is not a general editor;
- exact allowlist ids are required;
- unknown allowlist ids reject;
- raw SQL shell and raw storage shell remain forbidden;
- agent stays behind safe media boundary.

## Relationship to current runtime reality

Этот contract pack описывает target invocation posture, а не текущий runtime implementation detail.

Например:

- current media upload route уже был hardened и больше не crosses into publish behavior;
- текущий storage adapter всё ещё может отличаться от target S3-compatible boundary;
- docs intentionally separate current runtime reality from target contract so that implementation does not confuse migration gap with canon.

## Delivery footprint

Создано 5 документов:

- overview pack;
- canonical template;
- delegation envelope spec;
- usage rules;
- error / stop taxonomy.

Это минимально достаточный набор для agent-facing invocation contract.  
Он не дублирует весь existing API contract, а надстраивает над ним safe agent behavior layer.

## Verification performed

Проверено:

- новый pack создан в `docs/product-ux/`;
- файлы не остались в skeleton state;
- pack явно разделяет domain / invocation / usage layers;
- delegation envelope описан как отдельная authority boundary;
- allowlist handling, publish boundary и safe media boundary не размазаны;
- usage rules запрещают auto-chaining через publish и fallback dispatch;
- error taxonomy разделяет policy failures, runtime failures и ambiguous situations.

## Residual risks

- Pack is docs-only; runtime enforcement still needs implementation against these contracts.
- Some current runtime surfaces outside this task may still rely on older adapter assumptions.
- The contract pack can be adopted only if the code path that dispatches tools validates envelope, role, allowlist and boundary state.

## Open questions

- Какие tool families входят в MVP invocation surface, а какие остаются diagnostics-only?
- Какие operations must stay human-only and never get an agent-callable analogue?
- Нужно ли в runtime различать отдельные validation paths for content, media, diagnostics and maintenance tools, или достаточно одного enforcement envelope?
- Какие tool-операции должны быть dry-run mandatory before execution?

## Practical implementation note

Для coding stage следующий порядок должен быть таким:

1. Bind tool selection to the canonical template.
2. Enforce delegation envelope before dispatch.
3. Enforce exact allowlist / registry match.
4. Enforce publish and safe media boundaries before any mutating action.
5. Return stable machine codes and human-readable reasons on every block.

Главное: agent should stop, not improvise.

## Final assessment

Пакет готов как minimal-but-sufficient design package для безопасного agent API invocation в phase-1 каноне.  
Он достаточно узкий, чтобы не превратиться в platform layer, и достаточно конкретный, чтобы быть реализуемым без дальнейшего расшатывания границ.
