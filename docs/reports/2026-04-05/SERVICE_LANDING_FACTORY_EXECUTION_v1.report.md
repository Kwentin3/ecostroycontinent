# SERVICE_LANDING_FACTORY_EXECUTION_v1.report

## 1. Summary

Service-first landing factory for `Экостройконтинент` was implemented and proved on the live runtime for the supported rollout boundary: `/services/[slug]` only.

The implementation now has:
- a structured service candidate/spec generation path through the existing LLM facade,
- explicit section registry enforcement,
- verification/report wiring,
- deterministic review preview,
- handoff into the existing review/approve/publish workflow,
- one real pilot proving path on a live service entity,
- conformance to the already working LLM infra baseline and runtime canon.

The live pilot succeeded after one factual runtime precondition was satisfied: a published primary media asset had to exist before the service publish gate would allow publication.

## 2. Pre-Implementation Grounding Summary

Before implementation, the actual code paths were grounded in the current runtime, not only the docs.

Relevant runtime facts:
- The service landing factory entrypoint lives in `app/api/admin/entities/service/landing-factory/generate/route.js`.
- The structured artifact and verification logic lives in `lib/landing-factory/service.js`.
- The service-only section registry is hardcoded there as:
  - `service_hero`
  - `primary_media`
  - `service_scope`
  - `related_cases`
  - `gallery`
- The existing publish semantics remain in `lib/content-ops/workflow.js` and `app/api/admin/revisions/[revisionId]/publish/route.js`.
- Publish readiness for services is enforced by `lib/content-ops/readiness.js`, including the explicit requirement that the primary media asset must already be published.
- The admin review surface renders the deterministic preview in `app/admin/(console)/review/[revisionId]/page.js`.
- The service factory review panel is shown in `components/admin/ServiceLandingFactoryPanel.js`.
- The service editor trigger is wired from `components/admin/EntityEditorForm.js`.
- The working LLM baseline is already in place and was not rebuilt for this feature work.

## 3. What Was Implemented

### 3.1 Service candidate/spec projection

The feature now generates a service landing candidate/spec through the existing LLM facade using the service-only contract shape defined in `lib/landing-factory/service.js`.

The candidate/spec path is structured, not raw-text based:
- input payload is normalized through the service content contract,
- the prompt is scoped to `/services/[slug]`,
- structured output is requested via the existing LLM infra baseline,
- the response is validated locally before it is accepted as a candidate/spec.

### 3.2 Section registry enforcement

The service-first registry is enforced as a closed set.

The implementation does not allow arbitrary blocks or route-family drift. Only the service contract sections are accepted and projected.

### 3.3 Verification/report wiring

Service verification now produces a machine-readable report that separates:
- structural/schema checks,
- reference/truth checks,
- render compatibility checks,
- editorial/publish-readiness checks,
- claim/risk checks.

The report is used to gate review and publish handoff.

### 3.4 Deterministic preview path

The review page renders the approved service artifact deterministically through the existing preview viewport.

No fallback page-builder or unsafe render path was introduced.

### 3.5 Publish handoff

The service landing factory hands off to the existing explicit publish workflow.

It does not create a second publish truth or bypass review/publish semantics.

### 3.6 Pilot proving path

A real live proving path was executed end-to-end:
- published primary media asset,
- service candidate/spec generation,
- verification,
- review preview,
- owner approval,
- explicit publish,
- public read verification.

## 4. Changed Files

This report documents the full feature implementation set already delivered in the repo. The key files are:

- `lib/landing-factory/service.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `lib/content-ops/readiness.js`
- `lib/content-ops/workflow.js`
- `lib/llm/providers/gemini.js`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/SERVICE_LANDING_FACTORY_IMPLEMENTATION_PLAN_v2.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`

The final reporting pass added:
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_EXECUTION_v1.report.md`
- `docs/reports/2026-04-05/SERVICE_LANDING_FACTORY_CONFORMANCE_AUDIT_v1.report.md`

## 5. Tests / Checks Run

Local verification:
- `npm test`
- `npm run build`

Live runtime verification:
- admin login on `https://ecostroycontinent.ru`
- published media asset proof path
- service factory generate route
- review page preview
- owner approve
- publish route
- public service page read check

### Observed local checks

- test suite passed: `73/73`
- build passed
- the pre-existing Turbopack warning remains unrelated to this feature path and did not block build

### Observed live checks

- media asset publish path completed through the standard revision workflow
- service candidate/spec generation returned a reviewable revision
- service publish completed
- public `/services/[slug]` read path returned `200`

## 6. Real Pilot / Proving Path

### Pilot target

The real pilot used a live media asset and a live service entity created for the proof run.

Published primary media asset used in the pilot:
- `entity_b7f31586-34e9-40f4-a5e6-927996913cbd`

Service entity / revision from the proving path:
- service slug: `pilot-service-mnlslpw0`
- service revision: `rev_d774a5ac-b663-46d9-acb0-15f0527567e8`
- resulting published service entity:
  - `entity_27589a74-d2c2-48bc-8df1-11be8e587256`

### Pilot flow

1. A draft media asset was created and then published through the standard revision workflow.
2. The service landing factory generate route was called with the published media asset as `primaryMediaAssetId`.
3. The service candidate/spec was generated successfully.
4. The generated service revision entered review.
5. Owner approval was recorded.
6. Superadmin publish completed through the existing revision publish route.
7. The public service page returned successfully and contained the expected title.

### Pilot outcome

The proving path succeeded end-to-end for the supported service-only rollout boundary.

## 7. Server Rollout Status

The LLM runtime baseline and runtime canon were already live and green before this landing-factory proving step.

For the landing factory pilot, the live runtime accepted the feature flow after the required published-media precondition was satisfied.

Current status:
- server runtime is aligned with the working LLM baseline,
- service factory code is live,
- pilot service proof succeeded,
- no additional server-side code rollout was required during the final proving pass.

## 8. Diagnostics Status

The LLM diagnostics baseline remained green during this feature work.

The service factory consumed the existing working infra baseline and did not rebuild provider, transport, SOCKS5, structured output, or local validation plumbing.

## 9. Known Remaining Risks

- The pilot required a published primary media asset. That is an explicit runtime readiness gate, not a bug.
- The rollout remains service-only. Other route families remain intentionally out of scope.
- Content/evidence readiness still matters. The factory does not solve missing proof or owner-review truth by code.
- Gemini 3 preview remains the active provider/model posture. That is working now, but it is still a narrow operational dependency.

## 10. Explicit Deferred Items

The following were intentionally not expanded in this execution:
- homepage support,
- cases/about/contacts rollout,
- article/FAQ/review expansion,
- generic page-builder behavior,
- public AI UI,
- prompt-lab UX,
- broad variant platform behavior,
- replacing current publish semantics,
- broad SEO/discovery runtime expansion.

