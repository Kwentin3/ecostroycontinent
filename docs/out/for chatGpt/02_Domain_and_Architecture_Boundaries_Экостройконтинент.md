# Domain and Architecture Boundaries

## Purpose

Этот файл даёт компактный архитектурный дистиллят: какие доменные границы уже зафиксированы и что новый чат не должен размывать.

## Canonical truths

- `Content Core` in SQL is the source of truth for content entities, relations, statuses and published revisions.
- `Admin Console` is the write-side tool.
- `Public Web` is a published read-side surface; it must not become owner of editorial truth.
- `MediaAsset` is a first-class entity; `Gallery` is a lightweight ordered grouping concept.
- Binaries live in `S3-compatible storage`; public delivery goes through `CDN`; raw public URLs are delivery outputs, not editorial truth.
- Route ownership is explicit:
  - `Service` owns `/services/[slug]`
  - `Case` owns `/cases/[slug]`
  - `Article` owns `/blog/[slug]`
  - `Page` owns standalone pages and page-level composition only
- `Publish` is an explicit domain operation with validation, published revision semantics and operational side effects.
- `Lead / intake domain` is adjacent to content domain, but separate from it.
- `AI` is assistive only: not source of truth, not route owner, not autonomous publisher.
- Acceptable posture: modular monolith is fine; contract-first boundaries are mandatory.

## Publish semantics

- `Published` is not just a status label on a live page.
- Publish promotes one validated revision to the active public revision.
- Rollback returns to a previous published revision.
- Changing `slug` on a published entity requires redirect / revalidation / sitemap follow-up.

## Media boundary

- Metadata truth lives in SQL.
- Binary truth lives in object storage.
- Public serving lives behind CDN.
- Content entities link media through IDs / refs, not through hardcoded URLs.

## AI boundary

- AI can draft, rewrite, summarize, propose SEO fields and suggest alt text.
- AI cannot silently change canonical truth.
- AI cannot publish.
- AI should surface uncertainty instead of inventing commercial facts.

## Anti-Drift Guardrails

### Mandatory rules

- `Admin Console` remains write-side only.
- `Public Web` remains read-side only.
- `Content Core` remains the source of truth for content entities, relations, statuses and published revisions.
- `Publish` remains explicit domain operation, not save-time status mutation.
- Published read-side consumes only validated published revisions.
- `Service` and `Case` own route truth; `Page` does not duplicate or override it.
- `MediaAsset` and `Gallery` remain first-class supporting entities.
- `AI` remains assistive only: not source of truth and not autonomous publisher.
- Contracts outrank backlog convenience, local shortcuts and ad hoc implementation pressure.

### Forbidden moves

- hardcoded content, SEO, CTA or route truth in templates or UI components
- public web owning publish truth
- `Page` silently taking route ownership from `Service` or `Case`
- raw media URLs as source of truth instead of `MediaAsset` / `Gallery`
- implicit publish through save or edit
- bypassing revision, review, approval or publish discipline "temporarily"
- silent AI truth changes
- second competing model for media, SEO, review or publish
- mixing content contract with DB or ORM design
- mixing operations contract with infra runbook or endpoint design
- broadening first slice into page builder, enterprise DAM or broad CMS
- ad hoc conflict resolution in code where canon already decides the issue

### Stop-and-escalate triggers

- implementation requires violating route ownership
- implementation requires bypassing explicit publish
- truth must be stored outside `Content Core`
- a second competing model appears for media, SEO, review or publish
- infra limitation pushes implementation to break canon
- PRD and contracts read differently
- backlog task conflicts with contract or domain truth

## Do not reopen by default

- `Public Web` is read-side only.
- `Admin Console` is write-side only.
- `Media` is a separate first-class domain.
- `Lead` is not part of the content entity model.
- `Page` is not a second route owner for `Service`, `Case` or `Article`.
- `Modular monolith acceptable; no premature microservice sprawl`.

## What this file owns

- Cross-doc domain boundaries.
- Architecture posture needed for future chats.
- Contract meaning of publish, route ownership and media truth.

## What this file does not own

- DB schema.
- API shape.
- Infra provisioning.
- UI behavior details.

## Source docs used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/reports/2026-03-23/DOCS.Bounded_Domain_Consistency_Sweep_Экостройконтинент_v0.1.report.md`
