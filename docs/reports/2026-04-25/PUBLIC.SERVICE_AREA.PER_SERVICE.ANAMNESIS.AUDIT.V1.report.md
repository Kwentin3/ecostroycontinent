# PUBLIC.SERVICE_AREA.PER_SERVICE.ANAMNESIS.AUDIT.V1

Date: 2026-04-25  
Mode: audit only, no implementation  
Contour: repository code + read-only deployed runtime checks at `https://ecostroycontinent.ru`  

## 1. Executive verdict

Verdict: `SERVICE_LEVEL_AREA_MISSING` for the canonical route-owning `Service` entity.

The system supports a global company service area in `Global Settings`, and it supports factual case geography through `Case.location`. It does not currently support structured service-level geography for `/services/[slug]` pages.

There is partial, non-canonical geography support in `Page.targeting.serviceArea` and `GEO_COVERAGE` page sections, but the project canon says `Page` must not become a second owner of service route truth. Therefore that page-targeting mechanism cannot safely be treated as the real solution for `Service -> /services/[slug]`.

Current effective behavior is:

```text
effectiveServiceArea = global.serviceArea || global.primaryRegion
```

The desired business model for service landing pages is not implemented yet:

```text
effectiveServiceArea = service.serviceArea || global.serviceArea
```

## 2. Business interpretation

The right domain split is:

- `Global Settings`: shared fallback geography for the company and common local SEO/contact signals.
- `Service`: commercial landing page with its own optional coverage/service area when that service differs from the company default.
- `Case`: factual location of completed work, used as proof geography, not as a coverage promise.

For the current rental service, the safe interpretation is: `/services/arenda-tehniki` inherits the global area until owner confirms a separate rental coverage area. It should not invent a region, office address, or "выезд за пределы зоны" wording without owner confirmation.

## 3. Canon findings

Documents read:

- `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-25/PUBLIC.LOCAL_CONTEXT.SEO_ADDRESS.AUDIT.CONTEXTUAL.report.md`
- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0.report.md`
- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0.report.md`
- `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.ADDENDUM.RUNTIME_CONTEXT.report.md`

Key canon points:

- PRD says `/contacts` includes contacts and service area, and launch has one primary region cluster as an owner decision: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:82`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:88`.
- PRD keeps `Service`, `Case`, and `Article` as route-owning entities, while `Page` must not duplicate their route truth: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:284`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:510` - `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:512`.
- PRD treats `Global Settings` as source of truth for shared company/local business schema fields, including service area: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:205`.
- Content Contract lists `service_area_refs[]` for `Service`, and says Service links to service areas through references: `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:51`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:139`.
- Content Contract also says the phase-1 launch region / primary service area must be stored in `Global Settings`: `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:104` - `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:109`.
- Admin Console MVP spec explicitly lists `service_area_refs[]` as a `Service` field/relation point: `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md:106` - `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md:110`.
- Case geography is factual: Case requires `location`: `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md:121` - `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md:122`; Public Launch Canon also requires `location context`: `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:123` - `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:128`.
- Launch SEO Core recommends one launch cluster, `Сочи / Большой Сочи`, and warns against geographic sprawl: `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:17`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:33`.

Conclusion from canon: service-level geography is not forbidden. It is implied by the content/admin specs through `service_area_refs[]`, but the implemented code currently lags behind that canon.

## 4. Current schema/contracts

| Entity | Field | Purpose | Supports geography? | Notes |
| --- | --- | --- | --- | --- |
| `Global Settings` | `serviceArea` | Shared service area / company geography | Yes | Implemented in schema: `lib/content-core/schemas.js:189` - `lib/content-core/schemas.js:205`. |
| `Global Settings` | `primaryRegion` | Shared launch region fallback | Yes | Implemented with `serviceArea`: `lib/content-core/schemas.js:195` - `lib/content-core/schemas.js:196`. |
| `Service` | none of `serviceArea`, `areaServed`, `coverageArea`, `locality`, `region` | Service landing route truth | No | Service schema has slug/title/H1/summary/scope/CTA/relations/media/SEO only: `lib/content-core/schemas.js:233` - `lib/content-core/schemas.js:247`. |
| `Service` | `serviceScope`, `summary`, `methods`, `seo` | Free-text fields where geography could be manually written | Partial workaround | Not structured, not suitable as source of `areaServed`. Normalization ignores service-area fields: `lib/content-core/pure.js:500` - `lib/content-core/pure.js:515`. |
| `Case` | `location` | Factual completed-object location | Yes, as proof geography | Required in schema: `lib/content-core/schemas.js:267` - `lib/content-core/schemas.js:280`. |
| `Page` | `targeting.serviceArea`, `geoLabel`, `city`, `district` | Page-composition targeting | Partial, non-canonical for Service routes | Implemented for `Page`: `lib/content-core/schemas.js:302` - `lib/content-core/schemas.js:307`; route ownership makes it unsafe as Service truth. |
| `MediaAsset` | none | Visual proof | Irrelevant | Media can prove an object/service visually but does not define coverage. |
| `Equipment` | none | Supporting content for rental service | Irrelevant for coverage | Equipment supports rental content; it should not own public geography in this epic. |

## 5. Current admin support

`Global Settings` admin support exists:

- `components/admin/EntityTruthSections.js:160` - `components/admin/EntityTruthSections.js:170` renders the Global Settings service area / primary region group.
- `lib/admin/entity-form-data.js:46` - `lib/admin/entity-form-data.js:56` collects `serviceArea`, `primaryRegion`, organization city/country, and contact confirmation fields.
- `lib/content-core/pure.js:456` - `lib/content-core/pure.js:473` normalizes those fields into `global_settings`.

`Service` admin support for service-level geography is missing:

- Service form groups cover service data, scope, CTA, relations, media, and SEO, but no `serviceArea` or coverage field: `components/admin/EntityTruthSections.js:206` - `components/admin/EntityTruthSections.js:292`.
- Service payload normalization does not pass a service-area field into the `Service` schema: `lib/content-core/pure.js:500` - `lib/content-core/pure.js:515`.
- Service publish readiness checks slug, minimum text, CTA, proof path, and references, but not service-level geography: `lib/content-ops/readiness.js:138` - `lib/content-ops/readiness.js:203`.

`Case` admin support for factual location exists:

- Case form exposes required `location`: `components/admin/EntityTruthSections.js:394` - `components/admin/EntityTruthSections.js:410`.
- Case readiness requires `location`: `lib/content-ops/readiness.js:243` - `lib/content-ops/readiness.js:257`.

`Page` targeting exists but is not the canonical answer:

- Page-derived save path can store `targeting.serviceArea`: `app/api/admin/entities/[entityType]/save/route.js:95` - `app/api/admin/entities/[entityType]/save/route.js:100`.
- This belongs to page composition and legacy landing generation, not to route-owning `Service`.

## 6. Current public rendering

Current public rendering uses global geography on service pages.

Evidence:

- `ServicePage` builds contact projection from `globalSettings` only: `components/public/PublicRenderers.js:826` - `components/public/PublicRenderers.js:835`.
- The service page inserts `<ServiceAreaNote contactProjection={contactProjection} />`, with no service-level value passed: `components/public/PublicRenderers.js:859` - `components/public/PublicRenderers.js:869`.
- `ServiceAreaNote` reads `contactProjection.publicRegion`, which comes from global `serviceArea || primaryRegion`: `components/public/PublicRenderers.js:253` - `components/public/PublicRenderers.js:283`.
- `buildPublicContactProjection` derives `serviceArea`, `primaryRegion`, `publicRegion`, and `hasPublicRegion` only from `globalSettings`: `lib/public-launch/contact-projection.js:140` - `lib/public-launch/contact-projection.js:185`.

Other public surfaces:

- Home renders global `contactProjection.publicRegion`: `app/page.js:91` - `app/page.js:112`.
- Contacts page renders global `contactProjection.publicRegion`: `components/public/PublicRenderers.js:1091` - `components/public/PublicRenderers.js:1097`.
- Case detail renders `item.location` in the case hero: `components/public/PublicRenderers.js:925` - `components/public/PublicRenderers.js:946`.
- Page-level `GEO_COVERAGE` renders `section.body`, page targeting, and then `globalSettings.serviceArea`: `components/public/PublicRenderers.js:599` - `components/public/PublicRenderers.js:618`.

Important nuance: `GEO_COVERAGE` has a fallback text `"География пока не заполнена."` if nothing is present. That behavior is acceptable for page editor preview surfaces, but it should not become the public canonical behavior for route-owning Service pages.

## 7. Current SEO/schema behavior

Current structured data has global-only area behavior:

- `buildLocalBusinessStructuredData` uses `contactProjection.serviceArea || contactProjection.primaryRegion` for `areaServed`: `lib/public-launch/seo-structured-data.js:93` - `lib/public-launch/seo-structured-data.js:120`.
- `contactProjection` itself is derived only from `Global Settings`: `lib/public-launch/contact-projection.js:140` - `lib/public-launch/contact-projection.js:185`.
- `PublicPageShell` builds `LocalBusiness` and breadcrumbs; there is no separate service-level schema generator for `Service` pages in current code: `components/public/PublicRenderers.js:409` - `components/public/PublicRenderers.js:421`.
- `app/services/[slug]/page.js:43` - `app/services/[slug]/page.js:49` builds metadata from `service.seo` or service text, so service-level geography can only appear there if editors manually place it into SEO copy.

Current previous address audit remains valid:

- Model B was chosen: no confirmed physical address, public site uses service area.
- `PostalAddress` should not be generated without a confirmed physical address contract.
- When `LocalBusiness` schema is emitted, `areaServed` is still global-only.

Live caveat: current deployed `contactTruthConfirmed=false`, so LocalBusiness schema is intentionally gated off in live mode. The code path still matters for launch because once contact truth is confirmed, `areaServed` will come from the global projection only.

## 8. Current live content snapshot

Read-only checks were run against deployed runtime/server. Local workspace DB was not used as source of truth.

Runtime:

| Check | Result |
| --- | --- |
| Base URL | `https://ecostroycontinent.ru` |
| `/api/health` | `200`, `status=ok`, `databaseConfigured=true` |
| `/api/public/display-mode` | `mode=under_construction`, `underConstruction=true`, `indexingSuppressed=true` |
| `/` | `200 text/html` |
| `/services` | `200 text/html` |
| `/services/arenda-tehniki` | `200 text/html`, holding page due under-construction mode |
| `/contacts` | `200 text/html` |
| `/cases` | `200 text/html` |

Published inventory snapshot:

| Entity type | Count |
| --- | ---: |
| `equipment` | 5 |
| `global_settings` | 1 |
| `media_asset` | 5 |
| `page` | 1 |
| `service` | 1 |
| active published `case` rows | 0 |

Global Settings live geography:

| Field | Value |
| --- | --- |
| `serviceArea` | `Сочи и Большой Сочи` |
| `primaryRegion` | `Сочи` |
| `contactTruthConfirmed` | `false` |

Service `arenda-tehniki` live geography-relevant snapshot:

| Check | Result |
| --- | --- |
| `slug` | `arenda-tehniki` |
| `h1` | `Аренда строительной техники` |
| `serviceArea` key | absent |
| `areaServed` key | absent |
| `coverageArea` key | absent |
| `primaryRegion` key | absent |
| payload keys | `ctaVariant,equipmentIds,galleryIds,h1,methods,primaryMediaAssetId,problemsSolved,relatedCaseIds,seo,serviceScope,slug,summary,title` |
| `summary` contains `Сочи` | false |
| `serviceScope` contains `Сочи` | false |
| `methods` contains `Сочи` | false |
| SEO description contains `Сочи` | false |

Interpretation: the rental service currently has no service-level geography either as structured data or as visible service copy. It inherits only global geography through the renderer.

## 9. Gap analysis

Main gap:

The current code can answer "where does the company generally work?" but it cannot answer "where is this specific service available?" as structured route-owning truth.

Specific risks:

- All service detail pages will render the same global service area even when business operations differ by service.
- SEO/schema `areaServed` is global-only; a future service page with narrower or different coverage cannot express it structurally.
- Editors could bury geography in `summary`, `serviceScope`, `methods`, or SEO copy, but that would be free text, hard to validate, and easy to drift.
- `Page.targeting.serviceArea` could tempt future agents to create page-managed service landing pages, contradicting route ownership.
- Case `location` is correctly separate from coverage, but live content has no cases yet, so proof geography is not present publicly.
- Current service readiness gates do not warn if a service lacks either an explicit service area or a clear inherited-global decision.

For current launch-core, the gap is tolerable only if owner confirms that all public service pages inherit the same global area. It is not sufficient if rental, construction works, or later subservices have different coverage.

## 10. Recommended model

Target model:

```text
Global Settings
  serviceArea: default/fallback public service area
  primaryRegion: short launch region cluster

Service
  serviceArea: optional service-specific public coverage
  serviceAreaNote: optional owner-confirmed nuance
  effectiveServiceArea = service.serviceArea || global.serviceArea

Case
  location: factual completed-object location
```

Behavior:

- If `service.serviceArea` exists, ServicePage visible geography and service-level SEO/schema should use it.
- If `service.serviceArea` is empty, ServicePage should inherit `global.serviceArea`.
- If both are empty, no public empty geography block should render; admin/readiness should flag the missing launch truth.
- `case.location` should never be interpreted as service coverage. It is proof geography only.
- No physical address should be shown unless owner confirms it.
- No `/equipment` domain or equipment-owned geography should be introduced for this issue.

## 11. Implementation options

### Option 0: No schema change; use serviceScope/summary text

Pros:

- No code/data migration.
- Safe if all launch services share exactly the same global service area.

Cons:

- Not structured.
- Cannot drive schema `areaServed`.
- Easy to drift between visible copy, SEO description, and Global Settings.
- Does not satisfy the desired `service.serviceArea || global.serviceArea` model.

Fit for launch-core: acceptable only as a short-lived workaround if owner confirms one identical coverage area for every service page.

### Option 1: Minimal optional `serviceArea` on `Service`

Pros:

- Directly supports the target fallback model.
- Smallest product-aligned change.
- Keeps `Service` as route owner for `/services/[slug]`.
- Enables renderer, admin, readiness, metadata, and schema to use the same effective geography.
- Avoids a new domain or city-page system.

Cons:

- Duplicates region strings unless later normalized.
- Needs careful owner-confirmed content entry through admin GUI.

Fit for launch-core: recommended P0 if any launch service has coverage different from the global area, or if owner wants the site to explicitly support per-service coverage before opening public mode.

Minimum implementation surface for a later separate task:

- Add optional `serviceArea` and possibly `serviceAreaNote` to `Service` contract/schema.
- Add admin form fields under Service truth, with clear "inherits global if empty" copy.
- Add effective-area helper: `service.serviceArea || global.serviceArea`.
- Update ServicePage geography block and service-level schema/metadata behavior.
- Add tests for explicit service area, inherited global fallback, and empty-field rendering.
- Update content contract/canon addendum.

### Option 2: Structured `ServiceArea` entity / refs

Pros:

- Aligns with existing docs that mention `service_area_refs[]`.
- Can support multiple zones, included/excluded districts, service-specific notes, and future filtering.

Cons:

- More admin complexity.
- Overbuilt for current phase-1 launch-core.
- Higher risk of geographic sprawl if owner decisions are not settled.

Fit for launch-core: not recommended as P0. Better as P2 after real service/catalog complexity appears.

## 12. Recommended remediation plan

P0:

- Owner confirms the exact global fallback area and whether `Аренда строительной техники` inherits it.
- Owner confirms whether `Строительные работы` has the same or different area.
- Add a short canon clarification: `Global Settings = fallback`, `Service = optional override`, `Case.location = proof fact`.
- If any service differs from global before public launch, implement Option 1 in a separate code/data task before opening public mode.
- Keep writing live service data only through the admin GUI.
- Do not use `Page.targeting.serviceArea` to create page-owned service landing routes.

P1:

- Add admin visibility for "inherits global service area" vs "service-specific service area".
- Make ServicePage and SEO metadata use `effectiveServiceArea`.
- Add readiness warning when a Service neither has explicit service area nor has a valid global fallback.
- Add related cases with `case.location` to make proof geography visible where factual cases exist.

P2:

- Introduce structured `ServiceArea` refs only if there is real operational complexity: different zones, excluded areas, service-specific availability rules, or portfolio filtering.
- Consider per-district/city landing pages only after owner confirmation and proof-backed SEO demand; avoid phase-1 geo sprawl.

## 13. Stop / owner questions

These cannot be solved from code:

- Is `Сочи и Большой Сочи` the final global fallback service area?
- Does `Аренда строительной техники` use the same area, or a narrower/different one?
- Does `Строительные работы` use the same area, or does it differ by work type?
- Is public wording like "выезд на объект по согласованию" owner-approved?
- Is there any confirmed physical address/base that should be public later, or should the site remain service-area only?
- How should out-of-area requests be described, if at all?
- Which first cases will provide factual `case.location` proof geography?

## 14. Final recommendation

Do not leave the model as "one global service area forever" if the business expects service-specific coverage. The current implementation is safe as a global fallback for a narrow launch only if owner confirms all launch service pages share the same area.

Recommended next step: create a small follow-up implementation epic for Option 1, but only after owner confirms the per-service areas. The smallest useful model is an optional `Service.serviceArea` with fallback to `GlobalSettings.serviceArea`, renderer/SEO/readiness support, and tests.

Do not create `/equipment`, do not move geography into page-owned service landings, do not invent an address or region, and do not switch public display mode as part of this issue.

Safety confirmation for this audit:

- Code changed: no.
- Runtime data changed: no.
- Display mode changed: no.
- Direct SQL writes: no.
- Direct write API calls: no.
- New fields/migrations/routes: no.
- Report created: yes.
