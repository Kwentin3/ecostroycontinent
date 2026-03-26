# SEO Test Support Implementation Report

## Executive Summary
Собран узкий SEO testing contour для проекта `Экостройконтинент`, который позволяет позже тестировать роль `SEO Manager` не хаотичным UI-тыканием, а через осмысленный probe harness и документированный capability map.

Ключевой вывод:
- текущий SEO surface в коде уже достаточно богат для role-safe testing;
- broad QA platform не нужна;
- hidden admin backdoor не нужен;
- минимальный support layer можно держать как internal probe CLI поверх существующих routes;
- production runtime сейчас не является валидной SEO-fixture средой, потому что SEO user в prod inactive;
- поэтому support contour is stage/dev-first by design.

## How The Task Was Interpreted
Я трактовал задачу как последовательность:
1. определить фактический SEO surface из кода и текущей runtime reality;
2. построить capability inventory и test matrix;
3. спроектировать минимальный bounded test-support interface;
4. реализовать только тот slice, который не расширяет права и не превращается в QA platform;
5. проверить, что support layer не лезет в raw DB/storage и не нормализует publish bypass.

Я сознательно не делал:
- broad auth redesign;
- raw admin backdoor;
- new production API endpoint;
- publish bypass;
- role widening;
- raw DB or raw storage access.

## Actual Current SEO Surface Summary

### Code-Defined Surface
SEO role can currently:
- log in to admin;
- open dashboard `/admin`;
- open review queue `/admin/review`;
- open review detail `/admin/review/[revisionId]`;
- open entity list and editor pages for:
  - `global_settings`
  - `media_asset`
  - `gallery`
  - `service`
  - `case`
  - `page`
- save drafts;
- submit drafts for review;
- upload media inline on non-global_settings editors;
- inspect history and audit timeline.

### Forbidden Surface
SEO role cannot:
- publish;
- approve as Business Owner;
- rollback;
- manage users;
- use raw DB or storage shells;
- access any hidden SEO dashboard;
- cross publish/approval boundaries.

### Runtime Reality Gap
- Production SEO fixture is inactive.
- That means production is not a usable default SEO testing target.
- Current UI markup is semantic enough that no new product backdoor was needed.
- The main friction is fixture availability, not the lack of screens.

## Capability Inventory

### Positive Capabilities
| Capability | Status | Notes |
| --- | --- | --- |
| Login/logout/session | present | Existing admin auth flow.
| Dashboard navigation | present | Role-aware dashboard sections.
| Draft save | present | Existing entity save route.
| Review submission | present | Existing review submission route.
| Review queue/detail | present | SEO can inspect review state and preview.
| Media upload | present | Inline upload exists for SEO-authorized editor surfaces.
| History and audit inspection | present | Editor history pages render audit timeline and revision diffs.
| SEO field editing | present | SEO fields are rendered in the entity editor form.

### Forbidden Capabilities
| Capability | Status | Notes |
| --- | --- | --- |
| Publish | forbidden | Superadmin only.
| Owner action | forbidden | Business Owner or Superadmin only.
| Rollback | forbidden | Superadmin only.
| User management | forbidden | Superadmin only.
| Raw infra access | forbidden | Not part of product surface.

### Ambiguous Or Gapped Capabilities
| Capability | Status | Why |
| --- | --- | --- |
| Production SEO login | blocked | Prod SEO user inactive.
| Media attach after upload | partially implemented | Picker uses published media only; uploaded draft asset may not appear immediately.
| Deterministic automation hooks | optional | Current semantic markup is usable, but stable probe harness is still useful.
| Cleanup/reset for scratch drafts | absent | No content delete helper exists.

## Test Matrix Summary
The test matrix now covers:
- auth/session;
- dashboard and navigation;
- entity list and editor;
- review workflow;
- media upload and media relation surface;
- forbidden routes;
- validation and error cases;
- history and rollback boundaries.

The most important current negative cases are:
- `/admin/users` is linked in nav but route-blocked;
- publish pages are blocked to SEO;
- owner-action is blocked to SEO;
- rollback is blocked to SEO.

The most important current positive cases are:
- draft save;
- review submit;
- review queue visibility;
- entity editor SEO fields;
- inline media upload.

## Gap Analysis

### Gaps That Need Support
| Gap | Impact | Chosen response |
| --- | --- | --- |
| No active SEO fixture in prod | production cannot be used as default SEO target | stage/dev-first probe harness and/or seed fixture.
| No deterministic probe command | repeated SEO testing would be brittle | implement a minimal CLI probe.
| Media picker depends on published media | upload-positive and attach-positive paths may need fixture support | document this as a test matrix gap, not as a reason to reintroduce hidden publish.

### Gaps That Do Not Need New Product Power
| Gap | Why no new power is needed |
| --- | --- |
| Stable selectors | current routes and semantic labels are enough for MVP.
| Review inspection | existing review pages already expose the state.
| Negative RBAC | current route guards already enforce this.

## Proposed Minimal Test-Support API / Interface
The minimal support interface is not a new backend endpoint. It is a small internal probe CLI:
- `scripts/proof-seo-surface.mjs`
- `npm run proof:seo:surface`

Why this is the right contour:
- it stays internal;
- it uses existing SEO-authorized routes only;
- it can run read-only by default;
- mutation mode is explicit and stage/dev-only;
- no extra production privileges are introduced.

### Contract Shape
| Field | Rule |
| --- | --- |
| contract_id | `seo_surface_probe_v0.1`
| operation_name | `probe_seo_surface`
| owning_domain | `admin/test-support`
| default_mode | read-only probe
| mutation_mode | explicit opt-in only
| allowed initiator | internal agent or operator with delegated test scope
| forbidden behavior | raw DB/storage, publish bypass, role widening, secret leakage

### Output Shape
The probe returns JSON with:
- auth status;
- visible routes;
- forbidden routes;
- entity surface;
- review surface;
- media surface;
- gaps;
- residual risks;
- optional mutation results.

## Autonomous Execution Plan
The implementation path used here was intentionally narrow:
1. Audit actual SEO surface from code.
2. Write inventory, matrix, and support spec docs.
3. Implement a probe CLI instead of a new API endpoint.
4. Keep mutation mode explicit and production-blocked.
5. Verify the slice with help-mode, syntax check, unit tests, and build.
6. Stop.

The plan deliberately avoided:
- UI rewiring;
- permission changes;
- raw infra access;
- broad QA framework construction.

## Implementation Result

### Files Added
- [docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md](../../product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md)
- [docs/product-ux/SEO_Test_Matrix_Экостройконтинент_v0.1.md](../../product-ux/SEO_Test_Matrix_Экостройконтинент_v0.1.md)
- [docs/product-ux/SEO_Test_Support_API_Spec_Экостройконтинент_v0.1.md](../../product-ux/SEO_Test_Support_API_Spec_Экостройконтинент_v0.1.md)
- [docs/product-ux/SEO_Test_Autonomous_Execution_Plan_Экостройконтинент_v0.1.md](../../product-ux/SEO_Test_Autonomous_Execution_Plan_Экостройконтинент_v0.1.md)
- [scripts/proof-seo-surface.mjs](../../../scripts/proof-seo-surface.mjs)

### Files Updated
- [package.json](../../../package.json)

### What The Probe CLI Does
- logs in as SEO with existing auth;
- probes the SEO-visible routes;
- records forbidden routes separately, including negative POST checks for `users/create`, `publish`, `owner-action`, and `rollback`;
- optionally creates a scratch service draft and uploads a proof media asset only when explicitly enabled by `--mutate` or `SEO_TEST_MUTATE=1` plus `SEO_TEST_MUTATION_OK=1`;
- refuses to mutate in production before probe activity begins;
- never logs secrets;
- never uses raw DB or storage access.

### Why This Is Safe
- no new production endpoint was created;
- no role boundary was widened;
- no publish or owner path was touched;
- no raw DB/storage shell was introduced;
- the support layer is internal and auditable;
- the probe is read-only by default.

## Verification / Proof Package

### Checks Performed
- `node scripts/proof-seo-surface.mjs --help`
- `node --check scripts/proof-seo-surface.mjs`
- `npm test`
- `npm run build`

### Results
- probe CLI help output is correct and self-describing;
- probe CLI parses cleanly;
- production mutation refusal is fail-closed before any probe activity begins;
- existing tests still pass: 13/13;
- production build still passes.

### What Was Not Verified
- full live probe execution against an active SEO fixture;
- mutation mode against stage/dev data;
- browser automation using selectors.

Reason:
- the current local shell has no live DB/runtime for SEO probing;
- production SEO fixture is inactive;
- running mutation against production would be a safety violation.

## Residual Risks
- production SEO login remains inactive, so a live SEO probe still needs stage/dev fixture or activation;
- media attach tests may still need a published-media fixture because picker currently reads published assets;
- no cleanup helper exists for scratch drafts, so mutation mode should remain stage/dev-only and deliberate;
- if browser automation later becomes flaky, stable selector hooks may still be worth adding, but not as a first move.

## Explicit Non-Goals
- no broad QA platform;
- no broad auth platform;
- no raw DB/storage shell;
- no SEO dashboard product work;
- no publish bypass;
- no role widening;
- no hidden admin backdoor.

## Stop Triggers Hit Or Not Hit
- hidden publish reintroduced: not hit
- SEO permissions widened: not hit
- raw DB/storage access normalized: not hit
- secret leakage introduced: not hit
- broad QA platform drift: not hit
- publish / approval boundary bypassed: not hit
- canonical SEO role drift: not hit

## Where This Lives
This report is stored in:
- [docs/reports/2026-03-26/SEO_Test_Support_Implementation_Report_Экостройконтинент_v0.1.report.md](./SEO_Test_Support_Implementation_Report_Экостройконтинент_v0.1.report.md)
