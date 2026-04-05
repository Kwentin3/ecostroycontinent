# LANDING.CONTRACT.ANAMNESIS.V1

Срез состояния: 2026-04-05

Источник проверки: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`, `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`, плюс текущий runtime-код, API и SQL-схема.

Ниже только факты текущего состояния, отклонения и риски. Если чего-то нет, помечено `NOT FOUND`. Если состояние не удалось подтвердить однозначно, помечалось бы `UNCLEAR`.

## Section 1 - Content Model Reality

| Entity | Reality | Key fields actually present | Evidence | Deviation from canon |
|---|---|---|---|---|
| `global_settings` | EXISTS | `publicBrandName`, `legalName`, `primaryPhone`, `activeMessengers`, `publicEmail`, `serviceArea`, `primaryRegion`, `defaultCtaLabel`, `defaultCtaDescription`, `organization`, `contactTruthConfirmed`, `seo` | `db/migrations/001_admin_first_slice.sql:19,21,30`; `lib/content-core/content-types.js:1,10`; `lib/content-core/schemas.js:81`; `lib/content-core/pure.js:118` | Это singleton truth record; отдельный уникальный индекс есть только для `global_settings`. |
| `page` | EXISTS | `slug`, `pageType`, `title`, `h1`, `intro`, `blocks[]`, `primaryMediaAssetId`, `seo` | `db/migrations/001_admin_first_slice.sql:19,21`; `lib/content-core/content-types.js:19,24`; `lib/content-core/schemas.js:154`; `lib/content-core/pure.js:35`; `components/admin/EntityTruthSections.js:318` | `pageType` ограничен `about` / `contacts`; `blocks[]` не редактируется напрямую, а синтезируется из формы. |
| `service` | EXISTS | `slug`, `title`, `h1`, `summary`, `serviceScope`, `problemsSolved`, `methods`, `ctaVariant`, `relatedCaseIds`, `galleryIds`, `primaryMediaAssetId`, `seo` | `db/migrations/001_admin_first_slice.sql:19,21,34`; `lib/content-core/schemas.js:125`; `lib/content-core/pure.js:162`; `components/admin/EntityTruthSections.js:151` | Связи хранятся inline ID-списками, без отдельных join-таблиц. |
| `case` | EXISTS | `slug`, `title`, `location`, `projectType`, `task`, `workScope`, `result`, `serviceIds`, `galleryIds`, `primaryMediaAssetId`, `seo` | `db/migrations/001_admin_first_slice.sql:19,21,34`; `lib/content-core/schemas.js:140`; `lib/content-core/pure.js:177`; `components/admin/EntityTruthSections.js:234` | Связи также inline, без отдельной relation-модели. |
| `media_asset` | EXISTS | `assetType`, `storageKey`, `mimeType`, `originalFilename`, `title`, `alt`, `caption`, `ownershipNote`, `sourceNote`, `uploadedBy`, `uploadedAt`, `sizeBytes`, `status`, `lifecycleState` | `db/migrations/001_admin_first_slice.sql:19,21,34`; `lib/content-core/schemas.js:99`; `lib/content-core/pure.js:136`; `app/api/admin/media/upload/route.js:53` | Это metadata record for binary; SEO-слой здесь не подтвержден как persisted contract. |
| `gallery` | EXISTS | `title`, `primaryAssetId`, `assetIds`, `caption`, `relatedEntityIds`, `seo` | `db/migrations/001_admin_first_slice.sql:19,21,34`; `lib/content-core/schemas.js:116`; `lib/content-core/pure.js:153`; `lib/admin/media-gallery.js:433` | Это lightweight ordered grouping, а не full DAM album. |
| `Article` | NOT FOUND | NOT FOUND | `lib/content-core/content-types.js:1`; `db/migrations/001_admin_first_slice.sql:19,21`; `app/admin/(console)/page.js:74` | Нет runtime entity type, нет таблицы, нет админ-сурфейса. |
| `FAQ` | NOT FOUND | NOT FOUND | `lib/content-core/content-types.js:1`; `db/migrations/001_admin_first_slice.sql:19,21`; `app/admin/(console)/page.js:74` | Нет runtime entity type, нет таблицы, нет админ-сурфейса. |
| `Review` | NOT FOUND | NOT FOUND | `lib/content-core/content-types.js:1`; `db/migrations/001_admin_first_slice.sql:19,21`; `app/admin/(console)/page.js:74` | Нет runtime entity type, нет таблицы, нет админ-сурфейса. |

Ключевые факты:

- `blocks[]` хранится внутри `content_revisions.payload` как JSONB, а не в отдельной blocks-таблице: `db/migrations/001_admin_first_slice.sql:34,39,58`, `lib/content-core/schemas.js:154,160`.
- Версионирование есть через `content_revisions`, но текущий save-path переиспользует существующий draft, если он уже есть, вместо создания новой draft-ревизии на каждый save: `lib/content-core/service.js:44,49,59,72`.
- Ревизия и published state разделены: `content_entities.active_published_revision_id` хранит активную опубликованную ревизию: `db/migrations/001_admin_first_slice.sql:25,61,63`; `lib/content-core/repository.js:23,124,298`.
- `hero` присутствует в блок-схеме и в синтезаторе page payload, но в публичном рендерере для page нет `case "hero"`: `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:19`; `lib/content-core/pure.js:40`; `components/public/PublicRenderers.js:165,251`.
- `faq_list` описан в контентном контракте, но в runtime block union его нет: `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:39`; `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:71`.

## Section 2 - Admin Capabilities

| Capability | Reality | Role gate | Evidence | Missing pieces |
|---|---|---|---|---|
| Create/edit drafts | YES | editor roles via `requireEditorUser` | `components/admin/EntityEditorForm.js:501,504`; `app/api/admin/entities/[entityType]/save/route.js:80,97`; `lib/auth/session.js:116`; `lib/admin/page-helpers.js:22` | Draft save is form-driven, not general block composition. |
| Link entities | YES | editor roles | `components/admin/EntityTruthSections.js:197,281,377`; `lib/admin/media-gallery.js:104,118,188,203,223,323` | Links are inline ID lists; no separate relation table UI was found. |
| Manage SEO fields | YES for `page` / `service` / `case` / `global_settings`; PARTIAL for `gallery`; NOT FOUND for `media_asset` | editor roles | `components/admin/EntityTruthSections.js:20,144,227,311,415`; `lib/content-core/schemas.js:9,81,116,125,140,154` | `media_asset` schema does not persist an SEO object. |
| Media upload / management | YES | editor roles | `app/api/admin/media/upload/route.js:21,47,53`; `app/admin/(console)/entities/[entityType]/page.js:64,101,113`; `lib/admin/media-gallery.js:355,386` | Media editor exists, but gallery handling is folded into the media workspace. |
| Preview | YES / PARTIAL | review roles and editor media preview | `app/admin/(console)/review/[revisionId]/page.js:68,78,111,169`; `app/api/admin/media/[entityId]/preview/route.js:6,18,27`; `components/admin/EntityEditorForm.js:125` | Preview is explicit and separate; it is not a universal inline page-builder preview. |
| Publish | YES | superadmin only | `app/admin/(console)/revisions/[revisionId]/publish/page.js:14,16,68`; `app/api/admin/revisions/[revisionId]/publish/route.js:7,20`; `lib/auth/session.js:108`; `lib/admin/page-helpers.js:42` | Publish is a separate operation, not a save-side effect. |
| Rollback | YES | superadmin only | `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:81,83,84`; `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js:8,24`; `lib/auth/session.js:108` | Rollback is explicit and target-revision based. |
| Draft / Review / Published lifecycle | YES | editor, review, publish gates split by role | `lib/content-core/content-types.js:34`; `lib/content-ops/workflow.js:31,106,172,276`; `app/admin/(console)/review/page.js:11` | Lifecycle exists, but entity coverage is still narrow. |
| Article / FAQ / Review admin surfaces | NOT FOUND | NOT FOUND | `app/admin/(console)/page.js:74,85,86,87,88,89,90`; `app/admin/(console)/entities/[entityType]/page.js:19,25` | Those entity types are absent from runtime surfaces. |

Missing pieces:

- `Gallery` does not have a standalone editor route; it redirects into the media workspace: `app/admin/(console)/entities/[entityType]/page.js:29,51,60`; `app/admin/(console)/entities/[entityType]/[entityId]/page.js:41,60`.
- `page` editing is form-based and fixed to about/contacts; there is no general landing composer with arbitrary block authoring: `components/admin/EntityTruthSections.js:318`; `lib/content-core/pure.js:35`.
- The admin dashboard only loads supported first-slice entity types: `app/admin/(console)/page.js:74,85,86,87,88,89,90`.

## Section 3 - Page Composition Model

| Item | Reality | Evidence | Notes |
|---|---|---|---|
| `blocks[]` exists | YES | `lib/content-core/schemas.js:154,160`; `lib/content-core/pure.js:35,104` | The page payload is structured JSON. |
| Block union | YES, fixed | `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:71` | Runtime union is bounded, not open-ended. |
| Direct block authoring in admin | NOT FOUND | `components/admin/EntityTruthSections.js:354,357,360,368,373`; `lib/content-core/pure.js:35,104` | Admin collects flat fields and relation IDs; blocks are synthesized. |
| Block registry | NOT FOUND | `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:71`; `components/public/PublicRenderers.js:166` | I did not find a dynamic registry or plug-in block catalog. |
| `hero` block | PRESENT in schema, NOT RENDERED publicly | `lib/content-core/content-types.js:24`; `lib/content-core/pure.js:40,42,47`; `components/public/PublicRenderers.js:153,165,251` | The renderer uses `page.h1` / `page.intro` and ignores `hero` blocks. |
| `faq_list` block | NOT FOUND in runtime | `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:39`; `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:71` | Contract drift versus docs. |
| Page structure description | EXISTS | `components/admin/EntityTruthSections.js:321,337,354,377,404,415` | Page shape is described as route + SEO + content + relations + media. |

Short conclusion:

- Current page composition is a fixed, form-synthesized projection, not a general landing page composer.
- The page model has structured JSON and typed blocks, but the implementation is only partially aligned with the contract because `hero` is dropped and `faq_list` is absent.

## Section 4 - Render Model (Public Web)

| Route / surface | Reality | Evidence | Notes |
|---|---|---|---|
| `/services` and `/services/[slug]` | YES, dynamic published read-side | `app/services/page.js:4,7,10`; `app/services/[slug]/page.js:6,11,12,23`; `lib/read-side/public-content.js:27,84` | Reads only published service data. |
| `/cases` and `/cases/[slug]` | YES, dynamic published read-side | `app/cases/page.js:4,7,10`; `app/cases/[slug]/page.js:6,11,22`; `lib/read-side/public-content.js:32,98` | Reads only published case data. |
| `/about` and `/contacts` | YES, dynamic published read-side | `app/about/page.js:6,10,20`; `app/contacts/page.js:6,10,20`; `lib/read-side/public-content.js:112,159,163` | Rendered via `StandalonePage`. |
| `StandalonePage` block mapping | YES, deterministic for known types | `components/public/PublicRenderers.js:153,166,167,179,196,213,224,238,251` | Unknown block types fall through to `return null`. |
| Root homepage `/` | STATIC shell, not content-core consumer | `app/page.js:5,25,33,39`; `app/page.js:6` | This route bypasses published read-side projection. |
| Public read source | PUBLISHED-ONLY for content routes | `lib/read-side/public-content.js:22,27,32,37,48,84,98,112` | Public helpers join `active_published_revision_id`. |

Notes:

- The public renderers are structured and deterministic for the supported block union, but the renderer is not universal for every block present in schema.
- The homepage is a separate hardcoded shell, so the public site is not uniformly contract-driven.

## Section 5 - Media System

| Item | Reality | Evidence | Notes |
|---|---|---|---|
| Storage backends | Local filesystem and S3-compatible storage | `lib/media/storage.js:8,84,147,158` | Adapter selection is config-driven. |
| Delivery URL | CDN/public base URL or API route | `lib/media/storage.js:190,193,196,199`; `app/api/media/[entityId]/route.js:14,20,26`; `app/api/media-public/[entityId]/route.js:4,13,15` | Raw URLs are delivery outputs, not canonical refs. |
| Binary storage key | Canonical binary reference | `app/api/admin/media/upload/route.js:44,47,53`; `lib/content-core/schemas.js:101`; `lib/media/storage.js:15,96` | `storageKey` is the storage-side key, not a public URL. |
| Metadata | `title`, `alt`, `caption`, `ownershipNote`, `sourceNote`, `uploadedBy`, `uploadedAt`, `status`, `lifecycleState` | `lib/content-core/schemas.js:99,103,105,107,108,109,110,112,113`; `lib/admin/media-gallery.js:376,377,378,379,390,391,392` | Metadata is first-class, and warnings are tracked. |
| Relations | Inline IDs in payloads, resolved in app code | `lib/content-core/schemas.js:119,121,134,135,148,149,157,159`; `lib/read-side/public-content.js:61,67`; `lib/admin/media-gallery.js:104,118,188,203,223` | `Gallery` assets are resolved through published lookups. |
| Admin preview | YES | `app/api/admin/media/[entityId]/preview/route.js:6,18,27,31` | Uses draft-or-published media state. |
| Media create flow | Upload stores binary, then saves a `media_asset` draft revision | `app/api/admin/media/upload/route.js:47,53,58,69` | `status: "ready"` lives in payload; workflow state is still revision-based. |

Short conclusion:

- Media is modeled as a binary plus metadata plus revision history.
- Public delivery is decoupled from canonical storage, and relations are ID-based rather than URL-based.

## Section 6 - SEO Model

| SEO item | Reality | Evidence | Notes |
|---|---|---|---|
| `slug` | EXISTS on `page` / `service` / `case` | `lib/content-core/schemas.js:126,141,155`; `lib/content-core/pure.js:164,179,104` | No slug on `media_asset`; `gallery` also has no route slug. |
| `title` | EXISTS | `lib/content-core/schemas.js:127,142,157`; `components/admin/EntityTruthSections.js:161,244,340` | Title is top-level content. |
| `H1` | EXISTS on `page` / `service` / `case` | `lib/content-core/schemas.js:128,143,158`; `components/admin/EntityTruthSections.js:165,345` | One `h1` field exists per entity; I did not find a DOM scan for multiple H1s. |
| `description` | Structured via `seo.metaDescription` and entity summaries | `lib/content-core/schemas.js:11,129,146,159`; `components/admin/EntityTruthSections.js:28,48,169,276` | No separate SEO description field beyond the structured SEO object. |
| `canonicalIntent` | EXISTS | `lib/content-core/schemas.js:12`; `components/admin/EntityTruthSections.js:32`; `app/api/admin/entities/[entityType]/save/route.js:53` | Used in admin and payload builder. |
| Indexation control | EXISTS (`index` / `noindex`) | `lib/content-core/schemas.js:13`; `components/admin/EntityTruthSections.js:37,38,39,40`; `app/api/admin/entities/[entityType]/save/route.js:54` | Indexation is payload-level. |
| Open Graph fields | EXISTS | `lib/content-core/schemas.js:14,15,16`; `components/admin/EntityTruthSections.js:44,48,51` | OG image uses `openGraphImageAssetId`. |
| `gallery` SEO | EXISTS | `lib/content-core/schemas.js:116,122`; `app/api/admin/entities/[entityType]/save/route.js:67,74` | `gallery` has structured SEO support. |
| `media_asset` SEO | NOT FOUND | `lib/content-core/schemas.js:99,114`; `lib/content-core/schemas.js:184,189` | `media_asset` persists metadata, not a full SEO object. |
| Slug uniqueness | PARTIAL / enforced at publish-time | `lib/content-ops/readiness.js:131,134,136,189,192,194,248,252,256`; `lib/content-ops/workflow.js:208,209` | Published slug collisions are blocked by readiness/workflow, not by a DB unique constraint. |
| Sitemap / robots / llms / JSON-LD routes | NOT FOUND | Runtime search in `app` tree found no `robots`, `sitemap`, `llms`, or `json-ld` route files; docs expect them at `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:119,133,141,190,205` | SEO discovery infra is incomplete in runtime. |

Short conclusion:

- SEO data fields exist in structured payloads.
- SEO delivery infrastructure is incomplete: payload-level controls exist, but runtime SEO discovery routes were not found.

## Section 7 - Validation / Guards

| Guard | Reality | Evidence | Notes |
|---|---|---|---|
| Schema validation | YES | `lib/content-core/schemas.js:165,168,170,172,174,176,178` | Zod validates entity payload shapes. |
| Mandatory fields | YES | `lib/content-ops/readiness.js:68,73,77,90,131,141,145,149,154,189,199,240,244` | Required-field checks are explicit. |
| Published ref checks | YES | `lib/content-ops/readiness.js:25,30,35,40,46,48,108,110,112,116,158,161,167,169,174,217,220,225,262,264`; `lib/read-side/public-content.js:54,61,67` | Refs must exist and usually must already be published. |
| Proof path checks | YES | `lib/content-ops/readiness.js:149,154,203,205` | Service and case need proof material to publish. |
| CTA checks | YES | `lib/content-ops/readiness.js:145,146` | Service publish requires CTA text. |
| Contacts truth gate | YES | `lib/content-ops/readiness.js:301,302,306,310` | Contacts page depends on global settings truth confirmation. |
| Open publish obligations | YES | `lib/content-ops/readiness.js:315,317,318`; `lib/content-ops/workflow.js:227,228,229,230,231,232` | Slug-change side effects block publish until completed. |
| Media `alt` / ownership note | WARNING only | `lib/content-ops/readiness.js:94,95,98,99`; `lib/admin/media-gallery.js:276,285,289` | Missing alt and rights notes warn, but do not hard-block by themselves. |

Short conclusion:

- Validation is materially stronger than the raw content model: schema validation exists, and publish gates are explicit.
- The strongest guards live in app-layer readiness, not in DB constraints.

## Section 8 - Publish Mechanics

| Mechanic | Reality | Evidence | Notes |
|---|---|---|---|
| Draft save | YES | `lib/content-core/service.js:44,49,59,72,75,90` | Save updates current draft or creates a new draft revision if none exists. |
| Submit for review | YES | `app/api/admin/revisions/[revisionId]/submit/route.js:7,14,20,26`; `lib/content-ops/workflow.js:31,52,53,55,56` | Separate operation from save. |
| Owner action | YES | `app/api/admin/revisions/[revisionId]/owner-action/route.js:8,15,25,32`; `lib/content-ops/workflow.js:106,115,138,143` | Approve / reject / send back are explicit. |
| Publish | YES | `app/api/admin/revisions/[revisionId]/publish/route.js:7,14,20,25`; `lib/content-ops/workflow.js:172,185,200,204,208,218,225` | Publish is blocked by readiness, owner approval, preview status, and slug collisions. |
| Active published state | YES | `db/migrations/001_admin_first_slice.sql:25,61,63`; `lib/content-core/repository.js:84,90,298,303` | Public read-side follows `active_published_revision_id`. |
| Slug-change side effects | YES | `lib/content-ops/workflow.js:227,228,229,230,231,232,234,245,249`; `db/migrations/001_admin_first_slice.sql:68,72,73` | Redirect / revalidation / sitemap / canonical-check obligations are created. |
| Rollback | YES | `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js:8,15,24,30`; `lib/content-ops/workflow.js:276,280,284` | Rollback points the entity back to a published revision. |
| Immutable snapshot | PARTIAL | `lib/content-core/repository.js:186,190,199,208,229`; `lib/content-ops/workflow.js:218,225` | The published revision is snapshot-like, but there is no separate immutable snapshot store or DB-level freeze. |
| Public reads only published state | YES | `lib/read-side/public-content.js:22,27,32,37,48,84,98,112,126,133,140`; `app/services/page.js:4,7`; `app/page.js:5,6` | Content routes read published-only data; the home shell is the exception and is static. |

Short conclusion:

- Publish mechanics are explicit and reasonably disciplined.
- The main gap is not the workflow itself, but that the persisted published row is not physically immutable.

## Section 9 - AI Usage

| AI item | Reality | Evidence | Notes |
|---|---|---|---|
| Runtime AI integration | NOT FOUND | Runtime search across `app`, `lib`, `components`, and `db` found no `openai`, `OpenAI`, `LLM`, `llms.txt`, or model client code | Only docs mention the AI layer. |
| Revision metadata | YES | `db/migrations/001_admin_first_slice.sql:49,50`; `lib/content-core/repository.js:49,50,173,174,223,224` | AI involvement and source basis are stored as revision metadata. |
| UI surfacing | YES | `app/admin/(console)/review/[revisionId]/page.js:126,129`; `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:69,70`; `components/admin/TimelineList.js:33` | Badges show `"С участием ИИ"`. |
| AI writes directly to DB | NOT FOUND | `app/api/admin/entities/[entityType]/save/route.js:80,97`; `lib/content-core/service.js:44,92` | All content writes still go through normal save/review/publish paths. |
| Human-in-the-loop | PARTIAL | `lib/content-ops/workflow.js:31,106,172`; `app/api/admin/revisions/[revisionId]/publish/route.js:7,14` | Human approval exists in workflow, but not as an AI generation pipeline. |

Short conclusion:

- AI is present as metadata and UI labeling only.
- I did not find an operational AI content-generation path or AI-to-DB write path in runtime code.

## Section 10 - Gap Analysis

| Question | Answer | Explanation |
|---|---|---|
| 1. Can we represent a page as JSON spec? | PARTIAL | Yes, `page` payload is JSONB and `blocks[]` is typed, but the implementation is limited to a fixed page schema (`about` / `contacts`) and a form-synthesized block set. Root `/` is still a static shell. `lib/content-core/schemas.js:154,160`; `lib/content-core/pure.js:35,104`; `app/page.js:5,25`. |
| 2. Can we validate it? | YES | Zod schemas and readiness gates exist for entity payloads, refs, proof, CTA, contacts truth, and publish side effects. `lib/content-core/schemas.js:165,168,170,172,174,176,178`; `lib/content-ops/readiness.js:274,321`. |
| 3. Can frontend deterministically render it? | PARTIAL | For supported block types, yes: `StandalonePage` maps block type to component. But `hero` is silently ignored and unknown blocks return `null`; root `/` is not content-core driven. `components/public/PublicRenderers.js:153,166,251`; `app/page.js:5,51`. |
| 4. Is there a publish snapshot? | PARTIAL | There is an active published revision pointer plus published revision rows, but no separate immutable snapshot store or DB freeze was found. `db/migrations/001_admin_first_slice.sql:25,61,63`; `lib/content-core/repository.js:298,303`; `lib/content-ops/workflow.js:218,225`. |
| 5. Are there block-level restrictions? | YES | Block types are a fixed discriminated union; arbitrary custom blocks are not supported. `lib/content-core/content-types.js:24`; `lib/content-core/schemas.js:71`; `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:39`. |
| 6. Is there protection from arbitrary structure? | PARTIAL | App-layer validation blocks arbitrary shapes, but enforcement is not DB-level and the page composer is not registry-driven. `lib/content-core/schemas.js:165,178`; `lib/content-core/pure.js:116,192`; `components/admin/EntityTruthSections.js:354,357,360,368,373`. |

Bottom line:

- The system is already structurally close to contract-driven publishing for a narrow first slice.
- It is not yet a general contract-driven landing platform.

## Section 11 - Risk Map

| Risk area | Risk | Evidence |
|---|---|---|
| Architectural | Two composition paths exist: content-core read-side routes and a hardcoded homepage shell. That weakens a single JSON-spec narrative. | `app/page.js:5,25,33`; `app/services/page.js:4`; `app/about/page.js:6` |
| Product | `Article`, `FAQ`, and `Review` are absent from runtime entity coverage, while the docs still mention them. | `app/admin/(console)/page.js:74,85,86,87,88,89,90`; `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:241`; `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:39` |
| SEO | Route-level SEO discovery infrastructure was not found: no `robots.txt`, `sitemap.xml`, `/llms.txt`, `/llms-full.txt`, or JSON-LD route files in `app`. | Runtime search in `app`; docs expect them at `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:119,133,141,190,205` |
| Runtime | `hero` blocks are synthesized but not rendered; unknown blocks are dropped. The published row is snapshot-like but not DB-immutable. | `lib/content-core/pure.js:35,40,42,47`; `components/public/PublicRenderers.js:165,251`; `lib/content-core/repository.js:186,190,229` |
| Security | Content truth is protected mostly by app-layer guards; direct DB writes or bypassed server flows could still mutate published rows. | `lib/content-ops/readiness.js:274,321`; `lib/content-ops/workflow.js:172,225`; `db/migrations/001_admin_first_slice.sql:34,58` |

## Section 12 - Readiness Score

| Dimension | Score | Why |
|---|---|---|
| Content model readiness | 3/5 | Typed first-slice entities and revisions exist, but the model is narrow and not all contract entities are present. |
| Admin readiness | 3/5 | Draft / review / publish / rollback flows exist, but there is no standalone gallery editor and no `Article` / `FAQ` / `Review` coverage. |
| Render readiness | 3/5 | Published read-side rendering is deterministic for supported types, but `hero` is dropped and the homepage is static. |
| Validation readiness | 4/5 | Schema validation plus readiness gates are materially strong. |
| Publish readiness | 4/5 | Explicit publish / rollback / obligation flows exist, with role gates and readiness checks. |
| Overall | PARTIALLY READY | The runtime is close to a contract-driven first slice, but not yet a general contract-driven landing platform. |

Final conclusion:

- The project is **PARTIALLY READY** for contract-driven landing generation.
- The strongest pieces are the revision model, readiness gates, published-only read-side, and explicit publish/rollback mechanics.
- The main gaps are missing content types, incomplete SEO discovery runtime, static root homepage, and page-block/render mismatches (`hero` dropped, `faq_list` absent).
