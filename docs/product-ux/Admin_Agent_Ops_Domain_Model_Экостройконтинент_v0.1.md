# Admin Agent Ops Domain Model Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: domain / capability spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [02_Domain_and_Architecture_Boundaries_Экостройконтинент.md](./02_Domain_and_Architecture_Boundaries_Экостройконтинент.md), [03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md](./03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md), [Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)

## Purpose

Этот документ раскладывает admin + agent ops слой на bounded contexts, aggregates, capability areas и границы ответственности. Он нужен, чтобы API, workflow, media, diagnostics и RBAC не расползлись в один общий control plane.

## Scope

- bounded contexts for content, workflow, media, diagnostics, identity and delegation;
- aggregates for content entities, revisions, global settings, media assets, galleries, publish obligations, audit events and admin users;
- route ownership and relation discipline;
- lifecycle boundaries for content and media;
- delegated agent execution envelope and safe wrapper boundaries.

## What this document owns

- bounded contexts and aggregate boundaries;
- lifecycle and ownership of first-slice entities;
- route ownership boundary;
- relation and revision discipline;
- where the internal agent may act safely and where it may not.

## What this document does not own

- transport format;
- UI layout;
- infra deployment;
- concrete SQL migration details;
- wording of review comments or owner decisions.

## Canon assumptions

- `Content Core` in SQL is the truth model.
- `MediaAsset` is first-class.
- `Gallery` is lightweight and reusable.
- `Service`, `Case` and `Article` own route truth.
- `Page` is a composition container for standalone pages and page shells, not a second route owner.
- `Publish` is explicit and revision-based.
- `AI` may assist but never mutates canonical truth silently.

## Non-goals

- page builder semantics;
- raw ORM/table CRUD as the public agent surface;
- multi-tenant product platform design;
- full DAM / media suite;
- broad workflow-engine semantics;
- direct database authoring from the agent;
- direct bucket browsing or object deletion from the agent.

## Bounded contexts

| Context | Responsibility | Must not own |
| --- | --- | --- |
| Content Core | canonical content entities, relations, revisions, published pointers | UI state, infra transport, raw storage objects |
| Editorial Workflow | review, approval, publish, rollback, readiness gates | content semantics, storage implementation |
| Media and Storage | asset metadata, upload/finalize, attachment, integrity, archive/quarantine | public page truth, route ownership |
| Diagnostics and Forensics | health checks, integrity checks, audit timelines, event inspection | canonical content changes except named maintenance |
| Identity and RBAC | admin users, roles, permission gating | content truth |
| Agent Delegation Envelope | delegated execution context, allowlists, dry-run, traceability | truth ownership or unrestricted privileges |

## Aggregate model

| Aggregate / entity | Owns | Key invariants |
| --- | --- | --- |
| `ContentEntity` | one logical content item plus its revisions and active published pointer | only one active published revision; route ownership follows entity type |
| `GlobalSettings` singleton | company truth and global defaults | singleton per environment; contact truth must be explicit |
| `ContentRevision` | one draft/review/published snapshot | state transitions are explicit and auditable |
| `MediaAsset` | metadata for one binary object | binary status must match storage reality |
| `Gallery` | ordered reusable grouping of assets | order and membership are explicit, not implicit |
| `PublishObligation` | slug-change / revalidation / sitemap follow-up | obligations must be visible until completed |
| `AuditEvent` | forensic timeline event | append-only intent; human and machine readable |
| `AdminUser` | identity and role | active/disabled state and role must be explicit |
| `DelegatedOperation` | execution envelope for internal agent runs | allowlist and delegation source must be recorded |

## Lifecycle model

### Content revisions

`Draft -> Review -> Published`

- Draft is the working state.
- Review is the decision state.
- Published is the active public revision.
- Rollback returns to a previous published revision; it is not manual live patching.

### Media assets

Recommended state contour:

`upload_pending -> uploaded_pending_finalize -> ready -> attached`

Non-happy paths:

- `archived`
- `quarantined`
- `missing_binary`

The media lifecycle is separate from content revision lifecycle, but the two must cross-check each other.

### Galleries

Galleries are editor-maintained groupings with ordered membership. They may have their own draft/review/publish discipline if exposed publicly, but they are never allowed to become a semi-DAM subsystem.

## Route ownership boundary

| Entity type | Canonical route ownership | Notes |
| --- | --- | --- |
| `Service` | `/services/[slug]` | route truth lives with the service entity |
| `Case` | `/cases/[slug]` | proof narrative and route truth live with the case entity |
| `Article` | `/blog/[slug]` | supporting knowledge route owner |
| `Page` | standalone pages and page-level composition | in phase 1 this means `about` and `contacts` only |
| `GlobalSettings` | no public route ownership | feeds global truth and schema defaults |
| `MediaAsset` / `Gallery` | no route ownership | supporting media truth only |

## Relation model

- Relations are explicit and stable.
- Relations are recorded by ID / ref, not by copied text.
- Published entities may reference only valid and allowed refs.
- Broken refs are blocking for publish.
- Media usage roles should stay narrow and predictable, such as `primary`, `cover`, `gallery`, `inline`, `hero`.
- `Page` may compose `Service`, `Case`, `FAQ`, `Review` and media, but it does not claim route truth of route-owning entities.

## Agent delegation envelope

The internal agent is not a human role. It is a bounded execution envelope with:

- `delegated_by_user_id`
- `delegated_role`
- `delegation_id`
- `capability_bundle`
- `allowlist_id`
- `delegation_scope`
- `delegation_expires_at`
- `delegation_revoked_at`
- `idempotency_key`
- `dry_run`
- `correlation_id`
- `trace_id`

The envelope must make it obvious:

- who asked for the action;
- what role it was executed under;
- what was allowed;
- what was actually done;
- what was refused.

### Delegation semantics

- delegation is always created by a human;
- delegation scope must be narrower than the delegating human role;
- delegation expires automatically at `delegation_expires_at` if not renewed;
- delegation may be revoked before expiry and revocation must block further agent actions immediately;
- delegation history must remain visible in audit and forensic traces.

## Domain invariants

- Public truth lives only in published revisions.
- Route uniqueness is enforced by entity type and locale.
- `Publish` must never mutate canonical truth silently.
- `Global Settings` changes that affect contacts, region or brand truth require explicit review semantics.
- Media metadata cannot lie about storage state.
- No agent action may bypass the allowlist and still count as valid execution.

## Risks / failure modes

- content truth and read-side projection drift apart;
- the agent becomes a hidden source of truth;
- media metadata and binary storage are treated as one thing;
- publish obligations are created but not visible;
- route ownership gets duplicated between `Page` and route-owning entities;
- relation rules expand into an unbounded linking engine.

## Open questions

- Should `Page` in phase 1 remain strictly `about` and `contacts`, or do we need a second standalone page type before launch?
- Do galleries need a dedicated publish step, or only content entities that reference them?
- Which relation roles are truly required in MVP versus nice-to-have?
- Which delegated maintenance actions may the internal agent run without a human clicking the final confirm step?

## Decisions that must not be reopened by default

- `Service`, `Case` and `Article` own route truth.
- `Page` does not become a second route owner.
- `Publish` remains revision-based and explicit.
- `MediaAsset` remains a first-class entity.
- `Gallery` remains lightweight.
- No raw unrestricted DB or storage access for the agent.
- No autonomous publishing by the agent.
