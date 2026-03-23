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
