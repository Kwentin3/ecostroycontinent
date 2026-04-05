# SERVICE_LANDING_FACTORY_CONFORMANCE_AUDIT_v1.report

## 1. Audit Scope

This audit checks the service-first landing factory implementation against:
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`
- `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md`
- `docs/engineering/SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/SERVICE_RENDER_CONTRACT_v1.md`
- `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- the working LLM infra baseline docs

The audit is based on actual code and live runtime proof, not on intended design only.

## 2. A. What parts of the PRD are fully realized?

| PRD area | Status | Evidence |
|---|---|---|
| Service-only scope for `/services/[slug]` | Fully realized | The feature entrypoint is `app/api/admin/entities/service/landing-factory/generate/route.js`; no other route families were added. |
| AI assistive only | Fully realized | The feature uses the existing internal LLM facade and structured output. No autonomous publish or public AI surface was added. |
| Deterministic, contract-driven artifact path | Fully realized | `lib/landing-factory/service.js` builds a structured candidate/spec and verification report. |
| Human review and explicit publish | Fully realized | The live pilot used review, owner approval, and the existing publish route. |
| Service-first preview | Fully realized | `app/admin/(console)/review/[revisionId]/page.js` renders the deterministic preview path for the generated service artifact. |
| Publish handoff | Fully realized | The generated revision enters the existing `submit -> approve -> publish` workflow. |
| One real proving path | Fully realized | Live proof completed on a real published media asset and a real service page. |

## 3. B. What parts of the implementation plan are fully realized?

| Plan area | Status | Evidence |
|---|---|---|
| Remove infra baseline work from critical path | Fully realized | The feature consumed the already working LLM infra baseline; no baseline rebuild occurred. |
| Candidate/spec projection | Fully realized | `requestServiceLandingCandidate(...)` in `lib/landing-factory/service.js` powers the feature entrypoint. |
| Registry enforcement | Fully realized | The service registry is closed and enforced in the service landing code path. |
| Verification/report wiring | Fully realized | The verification report separates structural, truth, render, editorial, and claim/risk classes. |
| Preview rendering path | Fully realized | The review page preview is deterministic and based on published lookups. |
| Publish handoff | Fully realized | The existing publish semantics were reused rather than replaced. |
| Real pilot / proving step | Fully realized | A live service proof completed successfully. |

## 4. C. What contract rules are enforced in code?

| Contract rule | Enforced? | Code evidence |
|---|---|---|
| Service-only rollout | Yes | `SERVICE_LANDING_ROUTE_FAMILY = "service"` and the generate route only handles service entities. |
| Closed section registry | Yes | `SERVICE_LANDING_SECTION_REGISTRY` contains only the five service sections. |
| Structured output as default | Yes | The candidate request is built as a structured artifact request in `lib/landing-factory/service.js`. |
| Local validation after provider response | Yes | The service candidate is parsed locally before being accepted as a spec. |
| No raw provider data in business logic | Yes | Feature entrypoint consumes the facade result, not provider-specific payloads. |
| Deterministic preview | Yes | The review page renders the preview from the artifact and published lookups. |
| Explicit publish only | Yes | Publish remains the existing explicit revision publish route. |
| Public read-side only | Yes | Public `/services/[slug]` reads the published state only. |

## 5. D. What remains partial?

| Area | Status | Why partial |
|---|---|---|
| Broad rollout across all services | Partial / deferred | Only one real proving path was executed. The rollout is still intentionally service-only and narrow. |
| Media publication UX | Partial | The pilot required a published primary media asset; the live proof used the canonical revision workflow, but media publication remains a content-ops boundary rather than a landing-factory-owned surface. |
| Human proof readiness | Partial | The factory can enforce proof boundaries, but it cannot create missing truth or evidence. |
| Review UX generality | Partial | The preview and review flow is valid for the service path, but broader editorial surfaces were not expanded. |

## 6. E. What remains deferred?

Intentionally deferred:
- homepage support,
- `/cases/[slug]`,
- `/about`,
- `/contacts`,
- article/FAQ/review expansion,
- generic page-builder behavior,
- public AI UI,
- prompt-lab UX,
- broad variant platform behavior,
- replacing current publish semantics,
- broad SEO/discovery runtime expansion,
- all non-service route families.

## 7. F. What deviated from plan and why?

### 7.1 Published media became a hard pilot prerequisite

The v2 plan already warned that content/evidence readiness could gate the pilot. In practice, the service publish flow would not pass until a real primary media asset was published.

This was not a code defect in the landing factory.
It was the actual publish gate working as intended in `lib/content-ops/readiness.js` and `lib/content-ops/workflow.js`.

### 7.2 Media publish was performed through the canonical revision workflow

The pilot needed a real published media asset before service publish could proceed.
That media asset was published through the standard revision workflow, not by inventing a new media publish path.

That is a correct adaptation, not a scope expansion.

### 7.3 No new preview/public route was added

The plan called for a preview path, not a new public AI or page-builder surface. The implementation used the existing admin review preview instead.

This is faithful to the approved contract posture.

## 8. G. What remaining gray zones still exist?

| Gray zone | Current stance |
|---|---|
| Preview-model operational dependency | Gemini 3 preview remains the active model posture. It is working, but still a narrow operational dependency. |
| Content/evidence readiness | The factory can only prove what the corpus and media already support. Missing proof stays blocking. |
| Owner-review / claim boundaries | The service factory must continue to fail closed when claims or proof are weak. |
| Media readiness prerequisite | A service publish proof requires a published primary media asset. That is a real readiness gate, not a factory bug. |
| Generalization beyond service-only | Intentionally not attempted. |

## 9. H. What is the next smallest safe implementation step after this execution?

The next smallest safe step is not route expansion.

The next step is one of:
1. add another real service proving case only if the content owner provides a stronger proof/media set, or
2. harden the operator workflow around service proof selection and media readiness, without broadening route families, or
3. document the exact pilot checklist for service editors so the same success path is repeatable.

The safest default is to keep the scope service-only and widen only proof coverage, not product surface area.

## 10. Overall Verdict

Overall status: `PARTIALLY READY -> REALIZED FOR SERVICE-ONLY PILOT`

Meaning:
- the service-first landing factory is implemented and proven for one real service path,
- the accepted contracts are respected,
- the implementation plan was followed where it still applied,
- the remaining work is now in repetition, proof coverage, and operator readiness, not in rebuilding the feature.

