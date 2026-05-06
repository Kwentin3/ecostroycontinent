# Local Geography Model Addendum — Экостройконтинент v0.1

Status: canon addendum for Phase 1 launch-core  
Date: 2026-04-25  

## 1. Purpose

This addendum clarifies local geography ownership for the public site and admin content model.

It resolves the ambiguity between:

- company address and organization/local business truth;
- service-specific coverage promises on route-owning service pages;
- factual locations of completed work in cases.

This document does not introduce a multi-region SEO expansion and does not create a separate `ServiceArea` entity for P0.

## 2. Three Geography Levels

### Company / Organization Address

Company-level geography belongs to `Global Settings` and organization/local business truth.

Allowed fields/concepts:

- `publicOfficeAddress` or `officeAddress`, only when owner-approved;
- `legalAddress`, only when owner-approved and needed separately;
- `primaryRegion`;
- default company service area.

Physical address must not be invented. `PostalAddress` schema must not be emitted from city/country alone.

### Service Coverage

Service-level geography belongs to the route-owning `Service` entity.

It answers the commercial question:

> Is this specific service available in my area?

P0 model:

```text
effectiveServiceArea = service.serviceArea || global.defaultServiceArea
```

Implementation note for the current codebase:

- the existing `global_settings.serviceArea` field acts as `global.defaultServiceArea`;
- a separate field rename is not required for P0;
- the public semantics should treat this value as the default/fallback service area.

`Service.serviceArea` is optional, but publish-relevant. If empty, the service inherits the global default. The admin UI should make this inheritance visible to editors.

`Service.serviceAreaNote` is optional owner-approved nuance for the coverage statement. It must not contain invented promises about price, schedule, availability, guarantees, or unconfirmed out-of-area work.

### Case Location

Case geography belongs to `Case.location`.

It is proof geography: the location where a specific completed work happened.

It is not a promise that the related service is always available there.

Public rendering may show this as a small proof label, for example:

```text
Локация: Адлер
```

or:

```text
Объект: Тула, Центральный федеральный округ
```

Only factual, owner-approved case data may be used.

## 3. Entity Ownership

| Entity | Owns | Must not own |
| --- | --- | --- |
| `Global Settings` | company/contact/local business truth, default service area fallback, owner-approved address fields | service-specific commercial coverage promises |
| `Service` | route-owned commercial offer and optional service-specific coverage | company legal address, case proof location |
| `Case` | factual completed-object location and proof details | service coverage promise |
| `Page` | standalone page composition only | service route truth or service coverage truth for `/services/[slug]` |
| `Equipment` | supporting rental content | public service-area ownership |

`Page.targeting.serviceArea` is not the canonical solution for `/services/[slug]`. It may exist for standalone/page-composition tooling, but it must not replace `Service.serviceArea`.

## 4. Publish Readiness

A `Service` can be publish-ready only when it has an effective service area:

```text
service.serviceArea || global.defaultServiceArea
```

Rules:

- if `service.serviceArea` exists, use it;
- if `service.serviceArea` is empty and global default service area exists, publish can proceed with an "inherits global service area" informational signal;
- if neither exists, readiness must flag a launch-local-truth issue;
- this check must not require duplicating the global value into every service.

For current implementation, `global_settings.serviceArea` is the global default service area.

## 5. Public Rendering

Service pages should render visible geography from `effectiveServiceArea`.

Rules:

- render the geography block only when `effectiveServiceArea` exists;
- render `serviceAreaNote` only when it contains non-empty owner-approved text;
- empty, whitespace-only, null, or undefined fields must not create empty UI blocks;
- the service page must not use `Case.location` as a coverage statement;
- the service page must not rely on `Page.targeting.serviceArea` for canonical service geography.

Case cards and case detail pages may show `Case.location` as proof geography when present. If absent, no empty label should render.

## 6. SEO / Schema

Schema and metadata must follow visible truth:

- `areaServed` for a service page should use `effectiveServiceArea`;
- global/local business schema should use the confirmed company/global area, not a service override unless the structured-data surface is explicitly for that service;
- `PostalAddress` must not be generated without owner-approved physical address fields;
- `Case.location` must not be used as `areaServed`;
- no multi-region/city-clone expansion is introduced by this model.

## 7. Phase 1 Scope

P0 implements the simple optional field model:

- `Service.serviceArea`;
- optional `Service.serviceAreaNote`;
- fallback to existing `Global Settings.serviceArea`;
- readiness, renderer, metadata/schema, and tests for override/fallback/empty behavior.

Out of scope for P0:

- dedicated `ServiceArea` entity/ref system;
- `/equipment` public domain;
- city or district landing clones;
- pricing, availability backend, CRM, calculators;
- switching public display mode from `under_construction`.

## 8. Owner Decisions Still Required

Owner must confirm:

- final public company/office/legal address model, if any;
- final global default service area wording;
- whether each published service inherits the global area or has its own coverage;
- whether out-of-area wording is allowed;
- factual locations for cases.
