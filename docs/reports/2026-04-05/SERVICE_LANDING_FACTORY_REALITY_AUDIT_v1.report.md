# SERVICE_LANDING_FACTORY_REALITY_AUDIT_v1.report

## 1. Audit Scope

This is a code-reality audit of the service-first landing factory. I checked actual source code, actual admin wiring, actual route handlers, the LLM facade, readiness/verification/publish integration, the public read-side, and the feature-specific tests.

This audit does not assume the execution reports are true. Live runtime and pilot claims are marked separately unless they were independently verifiable from the repo and local access available in this session.

## 2. Sources Checked

### Product / contract docs

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`
- `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md`
- `docs/engineering/SERVICE_BLOCK_REGISTRY_CONTRACT_v1.md`
- `docs/engineering/SERVICE_RENDER_CONTRACT_v1.md`
- `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md`
- `docs/engineering/SERVICE_PUBLISH_ARTIFACT_CONTRACT_v1.md`

### LLM infra docs

- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_TRANSPORT_AND_SOCKS5_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_ERROR_AND_RESULT_BOUNDARY_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_IMPLEMENTATION_PLAN_v1.md`
- `docs/reports/2026-04-05/LLM.INFRA.BASELINE.PREVIEW_CUTOVER_AND_RUNTIME_CANON_ALIGNMENT_Экостройконтинент_v0.1.report.md`

### Project grounding docs

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_EXECUTION_v1.report.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_CONFORMANCE_AUDIT_v1.report.md`

### Code paths inspected

- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js`
- `app/api/admin/revisions/[revisionId]/publish/route.js`
- `app/api/admin/revisions/[revisionId]/submit/route.js`
- `app/api/admin/revisions/[revisionId]/owner-action/route.js`
- `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `components/admin/LlmDiagnosticsPanel.js`
- `components/admin/PreviewViewport.js`
- `components/public/PublicRenderers.js`
- `app/services/[slug]/page.js`
- `app/services/page.js`
- `lib/landing-factory/service.js`
- `lib/llm/facade.js`
- `lib/llm/providers/gemini.js`
- `lib/llm/transport.js`
- `lib/llm/structured-output.js`
- `lib/llm/config.js`
- `lib/content-ops/readiness.js`
- `lib/content-ops/workflow.js`
- `lib/read-side/public-content.js`
- `lib/content-core/service.js`
- `lib/content-core/repository.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`
- `lib/content-core/content-types.js`
- `lib/auth/roles.js`
- `lib/auth/session.js`

### Tests run

- `node --test tests/service-landing-factory.test.js`
- `node --test tests/llm-infra.test.js`
- `node --test tests/admin/readiness-actionability.test.js tests/admin/content-ops-cockpit.test.js tests/admin/content-ops-cockpit-view.test.js`
- `npm test`
- `npm run build`

## 3. What Is Definitely Implemented

| Area | Status | Evidence | Reality check |
|---|---|---|---|
| Service-only route family | FULLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:55-148`, `lib/landing-factory/service.js:20-24, 272-290, 325-360, 500-534` | The feature is scoped to the service route family and the generator route rejects non-service entities. |
| Usable admin trigger | FULLY VERIFIED | `components/admin/EntityEditorForm.js:501-523`, `lib/auth/roles.js:13-18`, `lib/auth/session.js:23-30`, `lib/admin/page-helpers.js:23-40` | The generator is a real formAction button in the service editor, available to `seo_manager` and `superadmin`, not just a dormant endpoint. |
| LLM baseline consumption | FULLY VERIFIED | `lib/llm/facade.js:92-187`, `lib/llm/providers/gemini.js:70-190`, `lib/llm/transport.js:143-179`, `lib/llm/structured-output.js:5-65` | Feature code calls the existing LLM facade, goes through SOCKS5 transport, requests structured output, then validates locally. There is no provider-specific leakage in the service feature path. |
| Closed service registry | FULLY VERIFIED | `lib/landing-factory/service.js:24-60, 155-188, 313-360` | Only the five service sections exist in the registry, and section order is enforced. No page-builder union is introduced here. |
| Publish handoff into existing workflow | FULLY VERIFIED | `app/api/admin/revisions/[revisionId]/publish/route.js:7-30`, `lib/content-ops/workflow.js:172-274`, `app/admin/(console)/revisions/[revisionId]/publish/page.js:14-74` | The feature hands off to the existing review/approve/publish workflow. There is no second publish truth store. |
| Rollback untouched | FULLY VERIFIED | `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js:8-36`, `lib/content-ops/workflow.js:276-299`, `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:81-90` | Rollback remains the same pointer-based publish model. |
| Public read-side purity | FULLY VERIFIED | `app/services/[slug]/page.js:6-30`, `app/services/page.js:4-17`, `lib/read-side/public-content.js:22-165` | Public service pages consume published state only. The landing factory did not weaken the published-only read path. |
| Local verification coverage | FULLY VERIFIED | `tests/service-landing-factory.test.js:41-218`, `tests/llm-infra.test.js:27-361` | The pure service-factory and LLM paths are covered by unit tests, and the full local test suite and build passed in this session. |

## 4. What Is Partially Implemented

| Area | Status | Evidence | Reality check |
|---|---|---|---|
| Candidate/spec identity fidelity | DRIFT / MISMATCH | `docs/engineering/SERVICE_LANDING_SPEC_CONTRACT_v1.md:13-45`, `app/api/admin/entities/service/landing-factory/generate/route.js:84-101`, `lib/landing-factory/service.js:272-290, 500-534` | The contract requires `baseRevisionId`, but the runtime generate route does not pass it. The spec therefore gets `baseRevisionId: ""` in the live path, even though the source-context summary contains the revision id in human-readable form. |
| Claim/risk layer | PARTIALLY VERIFIED | `docs/engineering/SERVICE_VERIFICATION_CONTRACT_v1.md:15-36`, `lib/landing-factory/service.js:382-435` | The verification report does have a claim/risk class, but in code it is only a narrow warning layer for missing `problemsSolved` / `methods`. It does not deeply detect unsupported claims or ambiguous commercial statements. |
| Verification gating depth | PARTIALLY VERIFIED | `app/api/admin/entities/service/landing-factory/generate/route.js:118-145`, `lib/landing-factory/service.js:313-493` | The report is real, but the generate route saves the draft first and only then evaluates verification. If verification blocks, a draft can still be left behind. |
| Preview determinism | PARTIALLY VERIFIED | `app/admin/(console)/review/[revisionId]/page.js:22-180`, `components/admin/PreviewViewport.js:5-61`, `components/public/PublicRenderers.js:66-104` | The preview is deterministic in the supported path because it reuses the same public renderers and published lookups. However, it is not a separate factory preview engine; it is a reuse of the existing review page with width toggles and published-state lookups. |
| Silent render fallback | PARTIALLY VERIFIED | `components/public/PublicRenderers.js:84-102, 95-101, 165-253` | Missing related cases or gallery assets are filtered out rather than surfaced as an explicit render error. The verification layer is supposed to prevent this from reaching publish, but the render path itself still omits missing items silently. |
| Source context completeness | PARTIALLY VERIFIED | `lib/landing-factory/service.js:191-243`, `app/api/admin/entities/service/landing-factory/generate/route.js:86-101` | The source context summary is real, but it is mostly entity/payload/proof based. It does not explicitly encode a separate SEO intent/target query field in the runtime route. |
| Live pilot proof | CLAIMED BUT NOT FULLY VERIFIED | `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_EXECUTION_v1.report.md:81-88, 138-171`, `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_CONFORMANCE_AUDIT_v1.report.md:24-39, 81-93, 124-130` | The reports claim a live end-to-end pilot and runtime-green status, but I could not independently verify that live server run from the access available in this session. |

## 5. What Is Only Claimed in Reports and Not Independently Verified

| Claim | Status | Why |
|---|---|---|
| Live pilot succeeded end-to-end on a real service entity | CLAIMED BUT NOT FULLY VERIFIED | The execution report says it happened, but I did not have independent live server access to reproduce or confirm it from this session. |
| Live runtime and LLM baseline were already green for the pilot | CLAIMED BUT NOT FULLY VERIFIED | Local tests and build passed here, but that is not the same as independently verifying the VM / deployed runtime state described in the report. |
| Conformance audit says the candidate/spec path is fully realized | CLAIMED BUT NOT FULLY VERIFIED | The code path is real, but the missing `baseRevisionId` makes the runtime shape less complete than the audit claims. |

## 6. Drift Against PRD / Contracts / Plan

| Target layer | Status | What matches | What drifts |
|---|---|---|---|
| PRD posture | FULLY VERIFIED | Service-only rollout boundary, explicit human review/publish, assistive-only AI posture, published read-side only | No material PRD drift in route scope. |
| Engineering contracts | PARTIALLY VERIFIED | Closed registry, structured output, local validation, explicit publish handoff, published-only read-side all exist | The runtime candidate spec does not carry the required `baseRevisionId`. Claim/risk checking is narrower than the contract language implies. |
| Execution / conformance reports | DRIFT / MISMATCH | The reports correctly identify the broad wiring and the route names | The reports overstate completeness on candidate/spec fidelity and on live pilot verification. Code inspection does not support a blanket "fully realized" claim. |

## 7. Fragile Seams and Operational Risks

| Seam | Status | Why it matters |
|---|---|---|
| Missing `baseRevisionId` in the live generate route | DRIFT / MISMATCH | This weakens auditability of the generated candidate/spec and is a direct contract mismatch. |
| Draft persists before verification | PARTIALLY VERIFIED | A blocked generation attempt can still leave a draft revision behind, which may create operator noise and stale artifacts. |
| Published media is a real dependency | FULLY VERIFIED | The feature and the existing publish gate both depend on published media truth. That is correct architecture, but it is an operational prerequisite for real pilots. |
| Gemini 3 preview posture | FULLY VERIFIED | The baseline depends on the minimal-thinking adapter posture for Gemini 3 preview models. That is working, but it is a provider-specific operational dependency. |
| Renderer omission fallback | PARTIALLY VERIFIED | Missing optional references can disappear from preview/public render instead of becoming an explicit rendering error. Verification is supposed to keep this from reaching publish, but the render path is still permissive. |
| Claim/risk analysis depth | PARTIALLY VERIFIED | The current report is more of a "missing narrative" warning than a full unsupported-claims detector. |
| Route-level integration coverage | PARTIALLY VERIFIED | The test suite covers pure functions and infra, but I did not find a direct route integration test for the generate endpoint itself. |

## 8. Overall Verdict

| Area | Status |
|---|---|
| A. Scope reality | FULLY VERIFIED |
| B. Feature entrypoint reality | FULLY VERIFIED |
| C. LLM usage reality | FULLY VERIFIED |
| D. Service candidate/spec reality | DRIFT / MISMATCH |
| E. Registry enforcement reality | FULLY VERIFIED |
| F. Verification / report reality | PARTIALLY VERIFIED |
| G. Preview reality | PARTIALLY VERIFIED |
| H. Publish handoff reality | FULLY VERIFIED |
| I. Read-side reality | FULLY VERIFIED |
| J. Pilot reality | CLAIMED BUT NOT FULLY VERIFIED |
| K. Operational seam reality | PARTIALLY VERIFIED |

Overall verdict: the service-first landing factory is real, reachable, and mostly wired correctly, but it is not fully contract-honest yet. The clearest concrete drift is that the runtime generate route does not populate the required `baseRevisionId` in the candidate/spec. The live pilot remains report-asserted rather than independently verified from this session.

## 9. Next Smallest Safe Follow-up Step

Wire `baseRevisionId` from the generate route into `requestServiceLandingCandidate(...)`, add a route-level integration test that asserts the candidate/spec carries the base revision id, and keep the scope service-only. That is the smallest safe step because it closes the most concrete contract mismatch without broadening route scope or changing publish semantics.
