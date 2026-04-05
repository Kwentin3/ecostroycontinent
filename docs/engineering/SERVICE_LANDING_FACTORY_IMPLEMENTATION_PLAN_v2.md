# SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2

This v2 supersedes v1 for implementation sequencing. V1 remains a historical record of the earlier infra-first shape.

## 1. Objective

Implement the service-first landing factory for `/services/[slug]` on top of the already working LLM runtime baseline, with deterministic preview, machine verification, and explicit human publish handoff.

This plan is now feature-execution-first, not infra-build-first.

It does not reopen route scope, publish semantics, or AI posture.

## 2. Current Baseline and Assumptions

- LLM infra baseline is already delivered and working end-to-end.
- Current runtime baseline is:
  - `gemini`
  - `gemini-3-flash-preview`
  - authenticated SOCKS5
  - structured output
  - local validation
  - admin diagnostics green
- Runtime canon is already aligned:
  - `server env -> docker compose -> container env -> process.env`
- The service-first rollout boundary remains:
  - `/services/[slug]` only
- AI remains assistive only.
- Public web remains read-side only.
- Publish remains explicit and human-controlled.
- The Gemini 3 preview posture is a real operational dependency, not a hypothetical one.
- Content/evidence/owner gaps still exist outside pure infra and may gate the pilot.

## 3. What Is Already Delivered

| Area | Status | Implication |
|---|---|---|
| LLM facade, SOCKS5 transport, structured output, local validation | Working | Do not re-plan infra baseline here. |
| Admin diagnostics for LLM and SOCKS5 | Working | Diagnostics can be used as an execution proof, not rebuilt. |
| Runtime env canon alignment | Working | Feature code can assume the canonical server env path. |
| Service-first contract pack | Accepted | The implementation plan should consume the contracts, not reopen them. |
| Current publish / rollback semantics | Existing canonical behavior | Publish handoff must attach to current semantics, not replace them. |

## 4. Remaining Implementation Scope

The remaining work is feature-side, not infra-side:

- service candidate/spec projection wiring
- section registry enforcement
- verification/report wiring
- preview rendering path for service artifacts
- publish handoff into existing publish semantics
- one real service proving path
- feature QA and hardening

What is no longer on the critical path:

- LLM factory/transport/structured-output baseline work
- runtime env canon work
- admin diagnostics baseline work

## 5. Workstreams

| Workstream | Owns | Depends on | Does not own |
|---|---|---|---|
| Service candidate/spec projection | Convert a real service revision payload into the factory-facing candidate/spec view. | Existing LLM baseline, service spec contract, current revision payload model. | Broad CMS redesign, other route families, raw HTML/JSX generation. |
| Section registry enforcement | Apply the allowed service block/section set and reject unsupported shapes. | Service block registry contract, candidate/spec projection. | Generic block platform, FAQ/article/review surfaces, homepage support. |
| Verification and report wiring | Produce the machine-verifiable report and gate approval/publish outcomes. | Spec projection, registry enforcement, current readiness rules. | New publish architecture, broad SEO tooling, public AI features. |
| Preview rendering path | Render the approved service artifact deterministically for review/preview. | Spec, registry, verification, existing renderer/runtime behavior. | Page-builder UX, design-system rewrite, route-family expansion. |
| Publish handoff | Attach approval to the existing publish flow and preserve rollback semantics. | Verification success, existing publish semantics. | New snapshot store, new publish architecture, bypass paths. |
| Pilot execution and QA | Prove the end-to-end flow on one real service entity and harden the path. | All prior workstreams, real content readiness. | General rollout to all services, broader product scope. |

## 6. Ordered Phases

| Phase | Purpose | Key outputs | Exit condition |
|---|---|---|---|
| Phase 0 - pilot selection and truth lock | Choose the one real service entity used for proving and confirm it has enough truth anchors, media, and owner reviewability. | Pilot slug selection, content/evidence readiness check, claim-boundary check. | A single real service pilot is selected or a content-readiness blocker is named explicitly. |
| Phase 1 - candidate/spec projection wiring | Build the factory-facing candidate/spec view from the existing service revision payload. | Candidate/spec projection, source-context mapping, supported field normalization. | A real service revision can be projected into the service candidate/spec shape. |
| Phase 2 - registry enforcement and verification | Enforce the allowed section set and produce a machine-verifiable report. | Registry gate, verification report, blocking semantics for unsupported refs/sections/claims. | Unsupported sections/refs fail before publish and the report is readable and stable. |
| Phase 3 - preview rendering and publish handoff | Render the approved artifact deterministically and hand it to the existing publish workflow. | Deterministic preview, publish handoff, pointer-preserving rollback compatibility. | Preview matches the approved contract and publish uses current semantics without bypass. |
| Phase 4 - real pilot proving step | Run the end-to-end path on one real service entity only. | Draft -> review -> approve -> publish -> public read proof for the pilot slug. | One real service page proves the full factory path without route-family drift. |
| Phase 5 - QA and limited hardening | Fix only the issues surfaced by the pilot and confirm the path remains service-only. | Narrow bug fixes, regression checks, rollout notes. | Pilot path is stable and no unintended route or publish behavior appears. |

## 7. Real Pilot / Proving Step

The proving step must use one actual service entity from the current service corpus.

Pilot constraints:

- stay inside `/services/[slug]`
- do not create a new route family
- do not use a synthetic demo route as the proof
- do not broaden to cases/about/contacts/homepage
- do not replace the current publish workflow

Pilot selection rule:

- choose the service with the best available truth anchors, media, and owner-reviewability
- if no service is sufficiently ready, stop and report the content/evidence blocker rather than widening scope

Pilot success means:

- a real service candidate/spec is generated from the existing revision payload
- the candidate passes registry enforcement and verification
- the preview matches the allowed contract
- the approved artifact enters the existing publish flow
- the public service page reads only published state

## 8. Gray Zones / Operational Caveats

| Gray zone | Why it matters | Operational stance |
|---|---|---|
| Gemini 3 preview dependency | The working baseline currently depends on preview-model posture and a narrow adapter-side behavior adjustment. | Treat as a known operational dependency, not as a feature rewrite target. |
| Content/evidence readiness | A pilot service may not have enough proof, media, or truth anchors to pass verification. | Do not solve missing content truth with code; surface the blocker. |
| Owner-review / claim boundary | The AI must not invent claims that are not backed by proof. | Verification must fail closed when claims or evidence are insufficient. |
| Schema/render edge | The service block/section contract must remain aligned with the current renderer. | Fix only within the service-only contract boundary; do not generalize to other route families. |

## 9. Exit Criteria

The plan is ready for implementation execution when all of the following are true:

- a real service candidate/spec can be generated through the existing LLM baseline
- section registry enforcement blocks unsupported sections, refs, and shapes
- verification produces a stable, machine-readable report
- preview rendering is deterministic and matches the approved contract
- publish handoff uses the current explicit publish semantics
- rollback remains pointer-based and does not require a new publish architecture
- one real service pilot succeeds end-to-end
- no route-family drift occurs
- no arbitrary HTML/JSX, page-builder, or public AI surface is introduced
- the implementation does not require rebuilding the already working LLM infra baseline

## 10. Deferred Items

Do not attempt these in the first feature rollout:

- `/`
- `/cases/[slug]`
- `/about`
- `/contacts`
- article, FAQ, and review expansion
- homepage unification
- broad variant system design
- generic prompt-lab UX
- public AI surfaces
- replacing the current publish workflow
- solving all content/evidence gaps in code
- broad SEO or discovery runtime expansion
- immutable snapshot store redesign
- any route-family expansion beyond services

## APPENDIX A — What changed vs v1

- Moved out of the critical path:
  - LLM factory/transport/structured-output build-out
  - runtime env canon work
  - admin diagnostics baseline work
- New primary execution path:
  - service candidate/spec projection
  - section registry enforcement
  - verification/report wiring
  - preview rendering
  - publish handoff
  - one real service proving step
- Remaining gray zones:
  - preview-model operational dependency
  - content/evidence readiness
  - owner-review / claim-boundary readiness
  - any service schema/render edge that still appears in the pilot
- Intentionally still deferred:
  - all non-service route families
  - public AI surfaces
  - prompt-lab or broad variant systems
  - replacing publish semantics
  - solving content-quality gaps by broadening scope
