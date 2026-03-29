# PRD vs Code Audit: Экостройконтинент v0.1

Дата: 2026-03-29  
Тип: `audit` / `implementation truth report`

## Executive verdict

Если сравнивать код с полным набором PRD, хотелок и сопроводительных контрактов, картина такая:

- `admin`-часть, RBAC, workflow ревью/паблиша, content core и медиа-основание уже выглядят как рабочая production-like база;
- публичная launch-поверхность пока не дотягивает до уровня полноценного сайта запуска;
- SEO/discoverability, launch content inventory, public lead-capture и часть later-slice типов сущностей пока либо частично реализованы, либо вообще отсутствуют в runtime;
- часть документов сознательно уводит future scope за рамки первого среза, и эти вещи я не считаю багом реализации.

Итог в одной фразе: **как CMS/админ-платформа первый срез уже сильный, как готовый публичный launch-site - еще нет**.

## Scope and sources

Смотрел не один файл, а весь рабочий пакет в `docs/product-ux` плюс фактический runtime в `app`, `components`, `lib`, `db`, `scripts`, `tests`.

### Документные семейства

- Core PRD: `PRD_Экостройконтинент_v0.2.md`, `PRD_Экостройконтинент_v0.3.md`, `PRD_Экостройконтинент_v0.3.1.md`
- Admin first slice: `PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Implementation_Backlog_First_Slice_Экостройконтинент_v0.2.md`, `Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md`
- Content / workflow / RBAC: `Content_Contract_Экостройконтинент_v0.2.md`, `Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md`, `RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md`, `Superadmin_Credential_Bootstrap_Contract_Экостройконтинент_v0.1.md`, `Superadmin_Credential_Bootstrap_Execution_Plan_Экостройконтинент_v0.1.md`
- SEO / launch: `Launch_SEO_Core_Экостройконтинент_v0.1.md`, `SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`, `SEO_Test_Matrix_Экостройконтинент_v0.1.md`, `SEO_Test_Support_API_Spec_Экостройконтинент_v0.1.md`, `Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
- Media: `Media_Gallery_PRD_Hardening_Addendum_Экостройконтинент_v0.1.md`, `Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`, `Media_Gallery_Autonomous_Implementation_Plan_Экостройконтинент_v0.1.md`, `Media_Gallery_Continuation_Plan_Экостройконтинент_v0.1.md`, `Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md`
- Agent ops: `PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md`, `PRD_Task_Delegation_API_Экостройконтинент_v0.1.md`, `Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md`
- Infra reality check: `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`

### Runtime evidence

- route tree and build manifest;
- admin/auth/session helpers;
- content-core schemas and workflow;
- media storage and library routes;
- public read-side projection;
- seed script;
- test suite and `npm run build`.

## Level legend

| Level | Meaning |
| --- | --- |
| 4 | shipped and verified in code, build, and tests |
| 3 | shipped, but with controlled deferrals or environment-dependent behavior |
| 2 | skeleton / partial: real code exists, but the PRD promise is incomplete |
| 1 | absent from codebase |

## Doc family verdicts

| Doc family | Verdict | Why |
| --- | --- | --- |
| Core PRD set | Partial overall | first-slice backend is strong, but the public launch promises in the later versions are not fully realized |
| Admin first slice | Shipped | console, CRUD, review, publish, rollback, RBAC and bootstrap are in place |
| Content / workflow / RBAC | Shipped for first slice | the contract-first content engine and permission model are implemented and tested |
| Media | Mostly shipped | the media workspace is real, but the target-state storage/distribution posture still has transitional pieces |
| SEO / launch | Partial | editor-side SEO exists, but public discovery, indexing, and measurement plumbing are missing |
| Agent ops | Partial | documentation exists, but generic runtime delegation is not a first-class executable subsystem |
| Owner pack | Not fully met | the launch content inventory and public readiness still lag behind the intent |

## Domain matrix

| Domain | What the docs wanted | What the code actually does | Level |
| --- | --- | --- | --- |
| Public launch surface | launch-ready homepage, services/cases/about/contacts, blog, FAQ, reviews, forms, events, conversions | routes exist for `services`, `cases`, `about`, `contacts`; home is still a placeholder with "В разработке"; no blog, FAQ, reviews, public forms, or event tracking | 2 |
| Public read-side projection | published-only public rendering | `lib/read-side/public-content.js` and `components/public/PublicRenderers.js` render published entities only; services/cases/about/contacts are wired to that read-side | 3 |
| Admin auth / RBAC | superadmin, SEO manager, business owner, guarded actions, one-time bootstrap | session cookies, route guards, role helpers, bootstrap flow, self-protection on user ops, no-access redirects are implemented | 4 |
| Content core first slice | normalized `global_settings`, `media_asset`, `gallery`, `service`, `case`, `page`, revisions, audit | exactly those first-slice entities exist in schema/migrations; revision states, audit events, owner-approval and published pointers are implemented | 4 |
| Workflow / publish | draft -> review -> published, owner approval, rollback, obligations | `submitRevisionForReview`, `processOwnerAction`, `publishRevision`, rollback, and publish-obligation gating are all present | 4 |
| Media workspace | first-class media assets, gallery editing, upload/finalize, archive posture, image editing, S3/CDN target | gallery workspace, upload, collections, archive/restore lifecycle, preview, crop/rotate/flip/reset, and local/S3 adapter exist; target-state storage is still transitional | 3 |
| SEO / discoverability | `robots.txt`, `sitemap.xml`, `/llms.txt`, `/llms-full.txt`, JSON-LD, Search Console, telemetry | hidden SEO fields and readiness gates exist in admin; public discovery files, structured data routes, and conversion instrumentation do not | 2 |
| Launch content inventory | seeded launch services/cases/pages, proof-led content, confirmed service area | seed script creates users and `global_settings` only; there is no repo-level launch inventory for services/cases/pages | 1 |
| Later-slice content types | article, FAQ, reviews/testimonials | these types are in docs but not in runtime schema/routes; there is no public blog surface | 1 |
| Agent ops / delegation runtime | reusable delegation API, bounded executor, safe wrappers, diagnostics | docs are strong, and runtime has bootstrap plus health/audit helpers, but not a reusable delegation subsystem | 2 |

## What is implemented well

### Admin and workflow

- `lib/auth/session.js`, `lib/admin/page-helpers.js`, and `lib/admin/route-helpers.js` enforce role boundaries rather than relying on UI-only checks.
- `app/admin/(console)/page.js` is a real role-aware dashboard, not a placeholder.
- `app/admin/(console)/review/page.js` and `app/admin/(console)/review/[revisionId]/page.js` cover review queue, owner decisions, diff context, and preview jump-in.
- `app/api/admin/revisions/[revisionId]/submit/route.js`, `.../owner-action/route.js`, `.../publish/route.js`, and `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js` implement the publish flow contract.

### Content core

- `lib/content-core/schemas.js` and `lib/content-core/pure.js` normalize and validate the first-slice model.
- `lib/content-core/service.js` persists revisions, published pointers, and audit events.
- The runtime explicitly rejects later-slice assumptions, so the code does not pretend to support content types that are not actually there.
- Tests lock invariants such as entity-type allowlists, fixed `about`/`contacts` page truth, and supported media payload shape.

### Media

- `components/admin/MediaGalleryWorkspace.js` is a working workspace with search, filtering, inspector, collection management, and archive/restore behavior.
- `components/admin/MediaImageEditorPanel.js` ships draft-safe crop/rotate/flip/reset actions.
- `components/admin/MediaCollectionOverlay.js` folds collection operations into the media surface.
- `lib/media/storage.js` supports both local and S3-compatible adapters and computes delivery URLs accordingly.
- `app/api/admin/media/upload/route.js` keeps upload flow draft-safe instead of auto-publishing binary truth.

### Public read-side

- `app/services/[slug]/page.js`, `app/cases/[slug]/page.js`, `app/about/page.js`, and `app/contacts/page.js` are wired to published data rather than draft data.
- Public rendering is factored into `components/public/PublicRenderers.js`, which is the right direction architecturally.

## What is still missing or partial

### Public launch site is not launch-complete

- `app/page.js` is still a decorative shell.
- There is no `app/blog` route.
- There are no public FAQ, review, or testimonial routes.
- There are no public lead-capture forms, click-to-call links, click-to-Telegram links, or telemetry hooks.
- `app/layout.js` stays minimal and does not provide the SEO/discovery layer expected by the launch docs.

### SEO/discoverability is mostly contract-only

- The admin side contains hidden SEO fields and readiness checks.
- The public side does not yet expose `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, JSON-LD, or search-engine wiring.
- That means the docs are ahead of the runtime in discoverability, even though the editor model is prepared.

### Launch content inventory is not in the repo seed

- `scripts/seed-data.mjs` seeds users and `global_settings`, but not launch services, cases, or pages.
- So the runtime can render public pages, but the repository itself does not yet guarantee a ready-to-launch content set.

### Agent ops are still mostly documents

- The `PRD_Task_Delegation_API` and `PRD_Admin_Agent_Ops` materials describe a bounded operational model.
- The codebase has bootstrap, health, and audit support, but not a general delegation runtime or task-execution API.

## Verification

- `npm test` passed: 36/36 tests green.
- `npm run build` passed.
- Build emitted one non-blocking Turbopack warning about an unexpected NFT trace through `lib/config.js` and `app/api/media/[entityId]/route.js`.

## Bottom line

Если свести все PRD и хотелки к честному runtime-срезу, то вывод такой:

- first-slice admin/content-core/media foundation уже хорошо собрана;
- public launch surface, SEO/discovery и launch content inventory пока не закрыты до уровня "можно запускать без оговорок";
- repo сейчас больше похож на сильную CMS-основу для запуска, чем на полностью готовый public launch site.

Отдельно: я **не** считал missing-частями явно out-of-scope вещи вроде English rollout, multi-region, broad analytics или public AI chat, потому что сами документы выводят их за первый срез.
