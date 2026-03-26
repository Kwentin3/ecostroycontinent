# RBAC and Permission Matrix Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: permission spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)

## Purpose

Этот документ фиксирует, кто что может делать в admin console + internal agent ops layer. Цель - удержать publish authority, owner review и safe wrappers в предсказуемых границах.

## Scope

- human role permissions for `Superadmin`, `SEO Manager` and `Business Owner`;
- delegated agent capability boundaries;
- review, publish and rollback authority;
- diagnostics and maintenance gating;
- database and storage wrapper gating.

## What this document owns

- human role permissions;
- delegated agent capability boundaries;
- review / publish authority;
- diagnostics and maintenance authority;
- database and storage wrapper gating.

## What this document does not own

- exact UI flow;
- exact API path names;
- schema details;
- per-field validation logic;
- human wording of review comments.

## Canon assumptions

- `Superadmin` is the publish authority in MVP.
- `Business Owner` is review authority for claims-heavy and launch-critical changes.
- `SEO Manager` is the day-to-day editor.
- The internal agent is not a free-standing human role; it acts only under delegation.
- AI never publishes and never silently mutates canonical truth.

## Non-goals

- a broad enterprise IAM redesign;
- per-field bespoke permission spaghetti;
- raw DB shell permissions;
- raw S3/object-storage permissions;
- public customer-facing permissions model.

## Role model

| Actor | Primary posture |
| --- | --- |
| `Superadmin` | operational integrity, publish/rollback, users/roles, bounded maintenance |
| `SEO Manager` | content ops, media ops, review prep, bounded diagnostics |
| `Business Owner` | explicit review authority and truth confirmation only, not general editing |
| Internal delegated agent | bounded executor under a named delegation and allowlist |

## Permission matrix

Legend:

- `Yes` = allowed by default in the stated posture.
- `Limited` = allowed only through a dedicated bounded surface or allowlist.
- `No` = not allowed in MVP.
- `Delegated` = available only when the agent is explicitly launched under a human role and capability bundle.

| Action | Superadmin | SEO Manager | Business Owner | Internal Agent |
| --- | --- | --- | --- | --- |
| Login / access admin | Yes | Yes | Yes | Delegated session only |
| View work queue / dashboards | Yes | Yes | Yes | Delegated |
| Create / edit draft content | Yes | Yes | No by default | Delegated |
| Confirm bounded owner-truth fragments | Yes | Limited | Limited, via dedicated truth-confirmation form | Delegated only if the delegated human role allows it |
| Confirm `Global Settings` truth fragments | Yes | Yes | Limited, truth-confirmation form only | Delegated |
| Create / edit `MediaAsset` metadata | Yes | Yes | No | Delegated |
| Upload / finalize media | Yes | Yes | No | Delegated |
| Attach / detach media or galleries | Yes | Yes | No | Delegated |
| Reorder gallery assets | Yes | Yes | No | Delegated |
| Submit revision for review | Yes | Yes | No | Delegated |
| View review packet / diff | Yes | Yes | Yes | Delegated |
| Approve / reject / send back | Yes, backup only | No | Yes | No |
| Publish revision | Yes | No | No | No |
| Roll back published revision | Yes | No | No | No |
| Run read-only diagnostics | Yes | Yes | Yes, review-scoped | Delegated |
| Run maintenance / repair wrappers | Yes | No by default | No | Delegated only through Superadmin envelope |
| Use DB safe wrappers | Yes, allowlisted | Read-only diagnostics only | No | Delegated only, allowlisted |
| Use storage safe wrappers | Yes, allowlisted | Yes, allowlisted and bounded | No | Delegated only, allowlisted |
| Manage users and roles | Yes | No | No | No |
| View full audit / forensic trail | Yes | Entity-scoped | Review-scoped | Delegated |

## Delegated agent rules

- The agent always inherits a bounded subset of the delegating human role, never a superset.
- The agent may prepare, validate, summarize and assemble, but it may not become the final human authority.
- The agent may never self-escalate from a read or draft capability into publish or destructive capability.
- The agent must carry `delegated_by_user_id`, `delegated_role`, `capability_bundle` and `allowlist_id` in every mutation or diagnostic trace.

## Specific boundaries

### Superadmin

Allowed:

- content operations;
- publish and rollback;
- user and role management;
- bounded maintenance actions;
- safe DB / storage wrappers when explicitly allowlisted.

Not allowed:

- raw unrestricted SQL;
- raw unrestricted object storage;
- silent publish without contract checks;
- bypassing owner review where it is required.

### SEO Manager

Allowed:

- draft content CRUD;
- media metadata and bounded media operations;
- review preparation;
- diagnostics relevant to content readiness;
- safe read-only or bounded wrappers that do not mutate canonical truth outside allowlist.

Not allowed:

- publish / rollback;
- user and role management;
- arbitrary maintenance actions;
- unrestricted DB or storage access.

### Business Owner

Allowed:

- review queue access;
- approve / reject / send back with comment;
- preview and diff;
- bounded truth confirmation via dedicated truth-confirmation form only when explicitly supported as an exception surface.

Not allowed:

- general content editing by default;
- publish / rollback;
- storage and DB access;
- user management;
- agent-style autonomous operations.

Posture:

- review-first, not edit-first;
- owner truth confirmation is an explicit exception, not the normal CMS path;
- if a truth-edit surface exists, it must be narrowly scoped and auditable.

## Risks / failure modes

- Business Owner becomes a hidden CMS editor instead of review authority;
- SEO Manager gains publish capability by convenience;
- agent capability bundle becomes indistinguishable from a human superuser;
- a bounded truth form quietly turns into a general editor surface;
- DB or storage wrapper access expands beyond allowlist discipline.

## Open questions

- Should the owner truth-confirmation exception surface be exposed in MVP, or only review actions?
- Which diagnostics can the Business Owner see without exposing operational noise?
- Do we need any delegated agent path for user/role tasks at all, or should that remain human-only?
- Which wrapper actions are maintenance-only and which are safe enough for normal diagnostics?

## Decisions that must not be reopened by default

- `Superadmin` remains the publish authority in MVP.
- `Business Owner` remains a review authority, not a general content operator.
- The agent remains bounded and delegated.
- No raw unrestricted DB access.
- No raw unrestricted storage access.
- No autonomous publish path.
