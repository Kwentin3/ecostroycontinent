# Current Runtime vs Target State Appendix Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: appendix / implementation gap note  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md](./Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md)

## Purpose

Этот appendix отделяет текущую runtime reality от целевого contract state. Он нужен, чтобы команда не путала уже существующее поведение с тем безопасным поведением, которое фиксирует этот package.

## Scope

- current runtime facts observed in the repo;
- target state required by canon;
- migration delta;
- temporary guardrails until target state is implemented;
- blocking risks that follow from the delta.

## What this document owns

- explicit distinction between current runtime and target canon;
- implementation gap notes that affect safe rollout;
- temporary guardrails for transitional behavior.

## What this document does not own

- target canon itself;
- detailed code changes;
- infra deployment design;
- owner confirmations;
- future product scope.

## Canon assumptions

- target canon outranks current runtime convenience;
- current runtime behavior is evidence of a gap, not new canon;
- upload is not publish;
- safety posture is more important than transitional shortcuts.

## Non-goals

- redefining media or publish canon;
- introducing new product scope;
- justifying unsafe shortcuts as acceptable end state;
- replacing the main contract docs.

## Current runtime reality

Observed in the repository at the time of writing:

- media upload route currently writes the uploaded binary and then saves a draft revision, but no longer submits for review or publishes the revision;
- media storage adapter currently writes to a local filesystem directory rather than a production S3-compatible backend;
- the content workflow already has draft / review / publish / rollback semantics and audit events;
- the current code therefore contains the intended domain spine, one media path that now stays inside draft state, and a storage backend that is still not yet aligned with the target safety posture.

Relevant paths:

- `app/api/admin/media/upload/route.js`
- `lib/media/storage.js`
- `lib/content-ops/workflow.js`

## Target state

- media upload and finalize are separate steps;
- binary truth lives in S3-compatible storage;
- metadata truth lives in SQL;
- public delivery goes through CDN;
- upload must not auto-publish content;
- agent actions must remain bounded by allowlists and audit.

## Migration delta

| Area | Current runtime | Target state | Gap type |
| --- | --- | --- | --- |
| Media upload | upload creates draft asset state only, no publish side effect | upload only creates or finalizes asset state, no publish side effect | workflow still needs explicit finalize discipline |
| Storage backend | local filesystem adapter | S3-compatible storage abstraction | infrastructure and contract |
| Finalize step | not clearly separated | explicit finalize with integrity checks | domain contract |
| Delete posture | not yet codified as safe default | archive/quarantine before hard delete | safety posture |

## Blocking risks

- local adapter behavior leaks into production assumptions;
- binary truth and metadata truth drift;
- implementation shortcuts are mistaken for canonical contract decisions.

## Temporary guardrails

- treat the current media upload route as a transition path, not final canon;
- avoid adding new code that depends on upload being a publish action;
- keep storage abstractions S3-compatible in behavior even if a local adapter remains in non-production;
- require explicit review before any media route changes that touch publish semantics.

## Open questions

- Which current runtime shortcuts need immediate migration versus acceptable short-term containment?
- What is the minimum safe order for completing explicit finalize flow and moving media upload toward the S3-compatible target backend?
- Which parts of the local adapter, if any, can remain in non-production only?

## Risks / failure modes

- the team treats transition code as finished canon;
- migration pressure causes a hidden publish side effect to remain in place;
- storage abstraction is left vague and never reaches the target boundary.

## Decisions that must not be reopened by default

- current runtime is not the same as target canon;
- upload is not publish;
- local filesystem adapter is not the end state;
- safe wrappers and audit are not optional.
