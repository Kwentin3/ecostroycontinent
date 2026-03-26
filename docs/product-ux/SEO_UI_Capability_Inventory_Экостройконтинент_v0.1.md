# SEO UI Capability Inventory

## Purpose
Зафиксировать реальный SEO surface текущего admin UI и связанных API-ручек проекта `Экостройконтинент` на основе кода и runtime reality, а не на основе желаемого будущего scope.

## Scope
Этот документ покрывает:
- какие страницы и действия доступны роли `SEO Manager`;
- какие entity types и truth fields реально редактируются;
- какие границы уже enforced code/runtime;
- где есть testing friction;
- где текущая production reality расходится с canonical phase-1 posture.

Этот документ не покрывает:
- полную QA-стратегию;
- broad auth/IAM redesign;
- new production runtime surface;
- SEO dashboard platform;
- hidden admin backdoors.

## What This Document Owns
- current SEO-visible UI surface;
- current SEO-authorized business actions;
- current SEO forbidden actions;
- canon-vs-runtime delta for SEO testing;
- minimum support needed for deterministic agent testing.

## What This Document Does Not Own
- content canon itself;
- publish semantics;
- media storage backend design;
- general admin permissions design;
- production activation policy for users.

## Canon Assumptions
- Phase 1 remains narrow launch-core.
- `Admin Console` is write-side only.
- `Public Web` is published read-side only.
- `Content Core` in SQL remains source of truth.
- `Publish` is explicit and separate from CRUD.
- `Approval != Publish`.
- `AI` and internal agents are assistive only.
- `Business Owner` is review-first / truth-confirmation, not default editor.
- `SEO Manager` is day-to-day content and SEO operator, not publisher.

## Current Runtime Reality
- The codebase exposes a full SEO-capable admin surface.
- The production `seo` account is currently inactive, so the live production runtime is not a usable SEO test fixture without a separate stage/dev activation or seed path.
- The UI is semantic and label-driven enough that the current first slice does not require new backend privileges to become testable.
- The main runtime friction is fixture availability, not lack of screens.

## Actual SEO Surface

### Accessible Screens
| Surface | SEO access | Notes |
| --- | --- | --- |
| `/admin` | yes | Dashboard and action queue.
| `/admin/review` | yes | Review queue.
| `/admin/review/[revisionId]` | yes | Review detail and preview.
| `/admin/entities/global_settings` | yes | Singleton editor.
| `/admin/entities/global_settings/[entityId]` | yes | Same editor detail path.
| `/admin/entities/media_asset` | yes | Media list/editor surface.
| `/admin/entities/gallery` | yes | Gallery list/editor surface.
| `/admin/entities/service` | yes | Service list/editor surface.
| `/admin/entities/case` | yes | Case list/editor surface.
| `/admin/entities/page` | yes | Page list/editor surface.
| `/admin/entities/*/[entityId]` | yes | Entity editor detail pages.
| `/admin/entities/*/[entityId]/history` | yes | Revision history and audit timeline.
| `/admin/users` | no | Static nav link exists, access denied by route guard.
| `/admin/revisions/[revisionId]/publish` | no | Superadmin only.
| `/admin/revisions/[revisionId]/owner-action` | no | Business Owner / Superadmin only.
| `/admin/entities/*/[entityId]/rollback` | no | Superadmin only.

### SEO Business Capabilities
| Capability | Current status | Evidence shape |
| --- | --- | --- |
| Create/edit draft content | present | Entity editor save route for `service`, `case`, `page`, `gallery`, `global_settings`, `media_asset`.
| Edit SEO fields | present | Hidden SEO fields rendered in editor form and normalized into content core.
| Link/unlink relations | present | Checklist and picker UI for service/case/gallery/media relations.
| Submit draft for review | present | Dedicated submit action on draft revisions.
| Review queue inspection | present | Review queue and detail pages.
| Readiness inspection | present | Readiness panel on editor and publish surfaces.
| Audit timeline inspection | present | History pages and timeline widgets.
| Inline media upload | present | Editor media upload form for non-global_settings entities.
| Publish | forbidden | Superadmin only.
| Rollback | forbidden | Superadmin only.
| User management | forbidden | Superadmin only.

### Entity Types SEO Can Work With
- `global_settings`
- `media_asset`
- `gallery`
- `service`
- `case`
- `page`

### Fields SEO Can Touch
| Entity type | Real editable truth |
| --- | --- |
| `global_settings` | public brand name, legal name, primary phone, public email, service area, primary region, default CTA, organization location, contact confirmation, SEO subfields.
| `media_asset` | title, alt, caption, ownership note, source note, status, and hidden storage metadata.
| `gallery` | title, caption, asset relations, primary asset, SEO subfields.
| `service` | slug, title, H1, summary, service scope, problems solved, methods, CTA variant, related cases, galleries, primary media, SEO subfields.
| `case` | slug, title, location, project type, task, work scope, result, related services, galleries, primary media, SEO subfields.
| `page` | page type, slug, title, H1, intro, body blocks, contact note, CTA fields, linked entities, primary media, SEO subfields.

## Forbidden Capabilities
- publishing revisions;
- owner approving/rejecting as Business Owner role;
- rollback;
- user creation or status change;
- any raw DB or storage access;
- any hidden SEO dashboard or bypass path;
- any generic admin shell or secret operator surface.

## Ambiguous Or Partially Implemented Capabilities
| Capability | Status | Why ambiguous |
| --- | --- | --- |
| Media picker visibility after upload | partially implemented | Upload saves draft media asset, but picker uses published media cards only.
| Production SEO testing | blocked | `seo` account is inactive in production runtime.
| Stable automation selectors | partially implemented | Current markup is semantic, but no dedicated test ids exist yet.
| Deterministic fixture reset | not present | No content delete or cleanup helper exists.

## Canon-vs-Runtime Delta
| Canon expectation | Runtime reality | Impact on testing |
| --- | --- | --- |
| SEO role should be testable in a live operator contour | prod SEO account inactive | Need stage/dev seed or active test fixture.
| Media operations should support editorial workflows | upload works, picker is published-only | Need fixture strategy for media attachment tests.
| Agent support should stay bounded | current code is bounded | No need for new privileged backend surface.

## Testing Implications
- The current UI can already support most SEO role testing without widening permissions.
- The hardest missing piece is a deterministic probe harness, not new business powers.
- A minimal support layer can be stage/dev-first and read-only by default.
- Mutation-based setup is only needed for positive create/submit/media cases.

## Risks And Failure Modes
- Treating the static `/admin/users` nav link as permission rather than a forbidden route.
- Misreading draft media upload as published media availability.
- Assuming production SEO login works when the user is inactive.
- Adding a broad test backdoor instead of a narrow probe harness.
- Using hidden publish as a workaround for media picker visibility.

## Open Questions
- Should the deterministic SEO probe run only in stage/dev or also against production read-only?
- Should the future test harness include optional mutation mode for scratch fixtures?
- Do we need stable `data-testid` hooks, or are semantic labels sufficient for the current surface?

## Decisions Not Reopened By Default
- SEO does not get publish authority.
- Business Owner does not become a default editor.
- No raw DB/storage shell for test support.
- No hidden publish path to make media tests easier.
- No broad QA platform is introduced by this package.
