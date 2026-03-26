# Agent Tool Usage Rules Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: usage / sequencing spec  
Основание: [Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md](./Agent_API_Invocation_Contract_Pack_Экостройконтинент_v0.1.md), [Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md](./Agent_Tool_Contract_Template_Экостройконтинент_v0.1.md), [Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md](./Agent_Delegation_Envelope_Spec_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md](./RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md), [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](./Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)

## Purpose

Этот документ описывает, как agent должен выбирать, последовательность и ограничивать вызовы tools / APIs.  
Он нужен не для runtime syntax, а для поведения: когда вызывать, когда не вызывать, что проверять перед вызовом, что считать стопом и когда не импровизировать.

## Scope

- tool selection guidance;
- pre-call checks;
- forbidden combinations;
- partial failure handling;
- stop behavior;
- sequencing across content, workflow, media, diagnostics and wrappers.

## What this document owns

- правила выбора tool-а;
- порядок проверки safety gates;
- запреты на auto-chaining;
- правила остановки вместо импровизации;
- правила реакции на blocked / ambiguous / partial outcomes.

## What this document does not own

- request / response schemas;
- specific UI flows;
- backend adapter details;
- full endpoint catalog;
- human review policy outside tool usage;
- broader product roadmap.

## Canon assumptions

- `upload != publish`.
- `approval != publish`.
- `owner != general editor`.
- `unknown allowlist_id -> reject`.
- `agent cannot improvise around blocked boundaries`.
- `dangerous operations must fail closed`.
- `agent ops remains behind safe media boundary`.

## Non-goals

- heuristics that “guess the right tool” without explicit boundaries;
- automatic fallback from blocked operation to a broader one;
- hidden retry loops that cross policy boundaries;
- generic “do what I mean” assistant behavior;
- broad orchestration logic disguised as usage guidance.

## Default decision flow

Перед вызовом любого tool agent should follow this order.

1. Identify the domain meaning of the desired action.
2. Match the action to a domain-oriented tool contract.
3. Check whether the tool is in the current delegation envelope.
4. Check the role boundary.
5. Check preconditions and current entity state.
6. Check whether the call touches publish boundary, safe media boundary or allowlist boundary.
7. Decide whether `dry_run` is required.
8. Call the narrowest allowed tool.
9. On blocked / ambiguous / partial failure, stop and report instead of chaining a broader tool.

## When to call

| Tool family | When it is the right choice | Typical preceding check |
| --- | --- | --- |
| `create_draft_entity` / `update_draft_entity` | when the intent is to prepare or refine draft truth | target entity family, delegation scope, edit permission |
| `submit_revision_for_review` | when draft is ready for human review | required fields, reference integrity, change class, review lane |
| `validate_publish_readiness` | before asking for owner review or publish | readiness gates, proof path, slug/route obligations |
| `request_upload_slot` / `finalize_upload` | when adding a new binary object safely | media boundary, storage allowlist, exact delegation scope |
| `attach_media` / `detach_media` / `reorder_gallery_assets` | when relation changes are needed, not binary mutation | asset readiness and relation permissions |
| `build_review_packet` / `prepare_owner_summary` | when a human decision packet is needed | diff, proof, blockers, current vs target state |
| `db_get_row` / `db_find_rows` / `storage_probe_object` | when a bounded diagnostic read is needed | exact allowlist id, read-only posture, no raw shell |

## When not to call

Agent must not call a tool when:

- the call would imply publish implicitly;
- the call would cross a blocked safe media boundary;
- the delegation envelope is expired or revoked;
- the operation is outside delegated scope;
- the tool would require an unknown allowlist id;
- the only way to make it work is to widen permissions beyond canon;
- the agent is trying to rescue an ambiguous situation by guessing.

## Required checks before call

For every call, verify:

- target exists or has been discovered through a bounded read;
- tool contract is the correct family and version;
- delegation envelope is active;
- role boundary permits the action;
- exact allowlist id is present when required;
- publish boundary is not being crossed implicitly;
- safe media boundary is satisfied when relevant;
- `dry_run` is used when the tool or policy requires it;
- output and audit requirements are understood before execution.

## Forbidden combinations

| Combination | Why forbidden |
| --- | --- |
| `submit_revision_for_review` -> automatic publish | approval and publish are separate |
| `approval` -> publish side effect | approval is not publish |
| `request_upload_slot` / `finalize_upload` -> publish side effect | upload is not publish |
| `owner review` -> silent editor mutation | owner is review-first, not general editor |
| unknown `allowlist_id` -> fallback dispatcher | unknown id must reject |
| blocked tool -> broader raw tool | blocked boundary cannot be worked around |
| failed safe wrapper -> raw DB / raw storage shell | raw shell is forbidden |
| blocked review -> direct mutation of published truth | review block is final until human decision |

## Partial failure handling

Если tool вернул partial / blocked / ambiguous:

- preserve the current context;
- log the failure reason and machine code;
- do not auto-chain a broader tool;
- do not silently reduce safety checks;
- retry only if failure is clearly transient and retry is still within the same safe boundary;
- otherwise stop and hand back the blocked state.

## Stop conditions

Agent must stop instead of improvising when:

- the call would cross publish boundary;
- the call would cross safe media boundary;
- the call needs an unknown allowlist id;
- the tool contract is unclear or incomplete;
- the delegation scope does not match;
- the role is insufficient;
- the tool returns ambiguous context that requires human interpretation;
- the only available recovery would widen rights or bypass canon.

## Agent chaining rules

- A narrow read-only diagnostic may precede a write only if the contract explicitly allows that sequence.
- A `dry_run` may precede an executed call when the contract requires it.
- A review packet may precede owner review.
- A readiness validation may precede review.
- No tool family may auto-chain into publish unless the publish tool itself is explicitly invoked by an authorized human path.
- `upload` family must never be auto-chained into `publish`.
- `approval` family must never be auto-chained into `publish`.

## Handling ambiguous target selection

If more than one tool seems plausible:

1. choose the narrower domain-specific tool;
2. if ambiguity remains, stop;
3. ask for human clarification or owner review if the boundary is business-critical;
4. never resolve ambiguity by selecting a broader technical primitive.

## Handling blocked boundaries

When a boundary blocks the action, the agent must not:

- try an adjacent tool family to bypass it;
- reword the call as a different operation with the same effect;
- drop audit or delegation fields;
- switch to raw DB / raw storage access;
- treat a failure as permission to improvise.

## Open questions

- Which tool families should support dry-run by default?
- Which diagnostic tools can the agent run without a human looking at the result immediately?
- Which maintenance actions, if any, may be retried automatically after transient failure?

## Risks / failure modes

- usage guidance becomes “soft advice” and agent starts self-selecting broader tools;
- forbidden combinations are documented but not enforced by runtime;
- blocked boundary is handled by fallback instead of stop;
- publish and approval become adjacent in the mental model again;
- exact allowlist rules get diluted by convenience.

## Decisions that must not be reopened by default

- `upload != publish`.
- `approval != publish`.
- `owner != general editor`.
- `unknown allowlist_id -> reject`.
- `agent cannot improvise around blocked boundaries`.
- `No raw unrestricted DB access`.
- `No raw unrestricted storage access`.
- `No autonomous publish`.

## Implementation notes for future coding, but no code

- The runtime should validate the call sequence against these rules before dispatch.
- Tool selection should prefer the narrowest safe contract, not the most convenient one.
- Any blocked boundary should surface a stop signal, not a hidden fallback.
