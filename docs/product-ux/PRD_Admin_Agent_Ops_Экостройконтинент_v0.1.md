# PRD Admin + Agent Ops Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation PRD / narrow phase-1 extension  
Основание: [00_Context_Map_Экостройконтинент.md](./00_Context_Map_Экостройконтинент.md), [01_Project_Truth_and_Current_Phase_Экостройконтинент.md](./01_Project_Truth_and_Current_Phase_Экостройконтинент.md), [02_Domain_and_Architecture_Boundaries_Экостройконтинент.md](./02_Domain_and_Architecture_Boundaries_Экостройконтинент.md), [03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md](./03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md), [04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md](./04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md), [PRD_Экостройконтинент_v0.3.1.md](./PRD_Экостройконтинент_v0.3.1.md), [PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md](./PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md), [Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md), [PRD_Task_Delegation_API_Экостройконтинент_v0.1.md](./PRD_Task_Delegation_API_Экостройконтинент_v0.1.md)

## Purpose

Этот PRD фиксирует узкий implementation scope для admin console + internal agent ops layer. Он не переписывает phase 1 и не расширяет продукт в новую платформу. Его задача - дать команде безопасный, contract-first и практичный пакет для реализации write-side operations, bounded internal delegation, review/publish flow, media operations, diagnostics и forensic logging.

## Scope

- MVP: `Superadmin`, `SEO Manager`, `Business Owner`, internal delegated agent.
- MVP: `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page` with `about` and `contacts`.
- MVP: review / publish / rollback, media upload-finalize-attach-detach, diagnostics, audit, safe wrappers.
- Next slice: `FAQ`, `Review / Testimonial`, `Article`.
- Out of scope: public AI chat, calculator, SEO dashboard, CRM-lite, broad analytics, EN rollout, multi-region launch, page builder, raw DB shell, raw object-storage shell.

## What this document owns

- product scope admin console + internal agent ops layer;
- MVP boundary and early-next slice;
- role posture and review authority;
- non-goals and stop triggers;
- what may be delegated to the internal agent and what never may be delegated.

## What this document does not own

- SQL schema;
- API transport shape;
- UI pixel design;
- infra runbook;
- product strategy beyond current launch-core posture;
- public web feature roadmap outside current canon.

## Canon assumptions

- `Admin Console` is the write-side tool.
- `Public Web` is published read-side only.
- `Content Core` in SQL is the source of truth for content entities, relations, statuses and published revisions.
- `Publish` is an explicit domain operation, not a save-time status flip.
- `MediaAsset` is a first-class entity.
- Binary files live in S3-compatible storage; metadata truth lives in SQL; public delivery goes through CDN.
- `AI` is assistive only: not source of truth, not route owner, not autonomous publisher, not allowed to silently mutate canonical truth.
- `Draft -> Review -> Published` remains the baseline editorial lifecycle.
- Human review stays explicit on claims-heavy and launch-critical materials.
- Modular monolith is acceptable; contract-first boundaries are mandatory.

## Non-goals

- public AI chat;
- calculator / estimate tool;
- SEO dashboard platform;
- CRM-lite beyond basic lead handling;
- broad analytics platform;
- multi-region launch;
- EN rollout;
- visual page builder or no-code canvas CMS;
- raw unrestricted DB shell for agent;
- raw unrestricted S3/object-storage access for agent;
- autonomous publishing by agent.

## Scope: MVP slice

| Area | Included in MVP | Notes |
| --- | --- | --- |
| Roles | `Superadmin`, `SEO Manager`, `Business Owner`, internal delegated agent | Agent is a bounded system actor, not a new human role. |
| Content entities | `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page` | `Page` in phase 1 means concrete standalone pages, not a generic page builder. |
| Page types | `about`, `contacts` | Home remains a public projection / shell and is not treated as free-form Page CRUD. |
| Workflow | `Draft -> Review -> Published`, rollback, owner approval lane | Publish remains separate from CRUD. |
| Media | upload slot, finalize, metadata edit, attach/detach, gallery assembly, archive/quarantine | No raw bucket browsing or destructive default deletes. |
| Diagnostics | broken refs, slug conflicts, missing fields, missing proof path, contact truth, media integrity, DB/storage health | Diagnostics are operational, not analytical theater. |
| Audit / forensics | human-readable + machine-readable audit trail, publish events, storage trace, db wrapper trace | Must be useful to humans and LLM-assisted investigation. |
| Safe wrappers | bounded DB and storage wrappers with allowlists, dry-run and idempotency | No arbitrary SQL or arbitrary object storage ops. |
| Agent ops | draft prep, validation, review packet assembly, bounded CRUD, diagnostics, named maintenance | Agent may assist, but never silently publish or approve. |

## Scope: early-next slice

| Area | Included after MVP | Notes |
| --- | --- | --- |
| Content entities | `FAQ`, `Review / Testimonial`, `Article` | Added only after first slice is stable. |
| Relations | richer linking and reuse patterns for FAQ/review/article | Keep typed relation rules. |
| Review packets | more automated review bundling and diffs | Useful once content volume grows. |
| Diagnostics | expanded content health checks and storage integrity views | Still bounded and allowlisted. |

## Role posture

| Role | Product posture |
| --- | --- |
| `Superadmin` | operational integrity authority, publish/rollback authority, user/role admin, bounded maintenance authority |
| `SEO Manager` | day-to-day content and media operator, review prep, diagnostics, bounded CRUD |
| `Business Owner` | review-first authority for claims-heavy and launch-critical materials; explicit exception-only truth confirmation where needed |
| Internal delegated agent | safe executor for bounded operations under explicit delegation, with audit, dry-run and allowlists |

## Why this slice exists now

- The project already has a narrow launch-core canon, but execution still needs a safe operational contour.
- The team needs practical tools for content CRUD, review/publish flow, media operations, diagnostics and forensics without creating a general infra control plane.
- The current phase is still evidence-led; the admin/agent layer must help close gaps, not hide them.

## Implementation reality note

This PRD distinguishes target canon from current runtime reality. Any route or storage behavior that already exists in code but does not yet match the target safety posture must be treated as a migration gap, not as new canon. See [Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md](./Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md).

## Key product decisions

- Admin stays write-side only.
- Public web stays read-side only.
- Publish stays explicit and human-mediated.
- Agent is a bounded internal operator, not an autonomous owner of truth.
- Safe wrappers are preferred over raw DB or raw S3 access.
- Hard delete is not the default posture; archive/quarantine is preferred where practical.
- Owner review remains explicit on claims-heavy and launch-critical materials.

## Risks / failure modes

- agent becomes a silent publisher;
- DB or storage shortcuts bypass allowlists and audit;
- owner review gets diluted into a soft approval hint;
- media metadata and binary storage collapse into one unsafe surface;
- diagnostics turn into an unbounded admin shell;
- the next slice expands into a broader AI/platform story;
- current implementation gaps, such as local storage adapters or direct route-level shortcuts, are mistaken for canon changes instead of being fixed to match canon.

## Open questions

- Should the owner ever get a dedicated bounded truth-edit form, or stay review-only except for explicit exception flows?
- Which named maintenance actions belong in MVP, and which should wait?
- Which storage backend and CDN wiring will be used first in production?
- How much of the agent ops surface should be available in UI versus API-first only?
- Should the next slice be shipped as one batch, or sequence `FAQ`, `Review / Testimonial`, and `Article` separately?
- Which current runtime shortcuts must be migrated before the package is considered implementation-safe?

## Decisions that must not be reopened by default

- `Draft -> Review -> Published` remains the lifecycle baseline.
- `Publish` remains separate from CRUD.
- `AI` remains assistive only.
- `Public Web` remains read-side only.
- `Admin Console` remains write-side only.
- No public AI chat, calculator, SEO dashboard, EN rollout or multi-region expansion in this package.
- No raw unrestricted DB console or raw unrestricted object storage access for the agent.
- No autonomous publishing by the agent.
