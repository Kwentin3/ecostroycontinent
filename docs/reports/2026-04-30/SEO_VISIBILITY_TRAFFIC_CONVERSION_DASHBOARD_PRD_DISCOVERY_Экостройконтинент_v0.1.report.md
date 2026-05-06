# SEO Visibility / Traffic / Conversion Dashboard PRD Discovery Report

Проект: «Экостройконтинент»
Дата: 2026-04-30
Статус: discovery + PRD delivery report

## 1. Что подготовлено

Созданы документы:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_DISCOVERY_Экостройконтинент_v0.1.report.md`

Runtime-код не менялся. Миграции, API, UI и внешние интеграции не добавлялись.

## 2. Документы, которые были изучены

Основные product-ux документы:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/RBAC_and_Permission_Matrix_Экостройконтинент_v0.1.md`
- `docs/product-ux/Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md`

Related reports checked for scope/canon:

- `docs/reports/2026-03-23/DOCS.PRD_Экостройконтинент_v0.2.report.md`
- `docs/reports/2026-03-23/DOCS.PRD_Экостройконтинент_v0.3.report.md`
- `docs/reports/2026-03-23/DOCS.PRD_Экостройконтинент_v0.3.1.report.md`
- `docs/reports/2026-03-23/DOCS.Launch_SEO_Core_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-03-23/DOCS.Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-03-29/PRD_vs_Code_Audit_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
- `docs/reports/2026-04-17/IMPLEMENTATION_PLAN.PUBLIC_LAUNCH_REFACTOR.ECOSTROYCONTINENT.V1.report.md`
- `docs/reports/2026-04-17/IMPLEMENTATION_PLAN.UPDATE.NEXT_STAGES.AFTER_STAGE3.ECOSTROYCONTINENT.V1.report.md`
- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0.report.md`

Key canon confirmed:

- `SEO dashboard` is future scope, not launch-core.
- Phase 1 is narrow and proof-led.
- Measurement baseline includes sitemap, Search Console, conversion events and CWV.
- Content Core in SQL is source of truth.
- Public Web is read-side only.
- Admin Console is write-side.
- AI is assistive and never publishes.
- Lead/intake is adjacent to content, not mixed into content entities.

## 3. Кодовая база, которую проверил

Checked areas:

- `db/migrations/*`
- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/content-core/repository.js`
- `lib/content-core/service.js`
- `lib/content-ops/readiness.js`
- `lib/content-ops/workflow.js`
- `lib/read-side/public-content.js`
- `lib/public-launch/seo-runtime.js`
- `lib/public-launch/seo-metadata.js`
- `lib/public-launch/seo-structured-data.js`
- `lib/public-launch/contact-projection.js`
- `app/sitemap.js`
- `app/robots.js`
- `app/page.js`
- `app/services/page.js`
- `app/services/[slug]/page.js`
- `app/cases/page.js`
- `app/cases/[slug]/page.js`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/admin/(console)/page.js`
- `lib/admin/nav.js`
- `components/admin/*Cockpit*`, `components/admin/LaunchCoreCoveragePanel.js`, `components/admin/EntityTruthSections.js`
- `package.json`
- `.env.example`

## 4. Что уже есть в runtime

Content entities:

- `global_settings`, `media_asset`, `gallery`, `service`, `equipment`, `case`, `page` are present in runtime constants and DB constraints.
- `Article`, `FAQ`, `Review/Testimonial` are present in product docs but not in runtime entity constants or migrations.

Status/publish semantics:

- `content_revisions.state` supports `draft`, `review`, `published`.
- `content_entities.active_published_revision_id` is the active published truth pointer.
- `publish_obligations` supports redirect/revalidation/sitemap/canonical follow-up.
- `audit_events` exists for workflow/domain events.

SEO:

- SEO payload fields exist: `metaTitle`, `metaDescription`, `canonicalIntent`, `indexationFlag`, `openGraphTitle`, `openGraphDescription`, `openGraphImageAssetId`.
- `robots.js`, `sitemap.js`, canonical/indexation metadata and structured data helpers exist.
- Sitemap uses published Services, Cases, About page and Contacts page.

Public routes:

- `/`, `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`.
- No `/blog` runtime route was found.

Contacts:

- `Global Settings` supports `primaryPhone`, `activeMessengers`, `publicEmail`, `serviceArea`, `primaryRegion`, `contactTruthConfirmed`.
- Public contact projection builds `tel:` and `mailto:` actions and contact route actions.
- No public lead form submit route or lead storage was found.

Admin:

- `/admin` already has content operations cockpit, evidence register and launch-core coverage.
- Current nav includes `Главная`, `Проверка`, `Настройки`, `Медиа`, `Услуги`, `Техника`, `Кейсы`, `Страницы`, `Пользователи`.
- Future dashboard should likely live as separate `/admin/visibility`, not inside the existing content-ops cockpit.

## 5. Что не найдено

Not found in runtime:

- `analytics_event` or equivalent event table;
- analytics daily aggregates;
- search console import tables/jobs;
- lead/intake tables;
- lead attribution model;
- public lead form;
- Telegram lead notification implementation;
- GA4 integration;
- Яндекс Метрика integration;
- Яндекс Вебмастер integration;
- Google Search Console API integration;
- own event tracker;
- semantic click map storage;
- visual heatmap storage.

`Telegram` currently appears as a messenger option in contact settings/projection, not as lead notification delivery.

## 6. Main Gaps

1. Visibility data is not imported yet.
2. Traffic and behavior data are not collected yet.
3. Intent events are canonically required but not implemented.
4. Lead/intake domain is not implemented.
5. Lead attribution cannot exist until lead/intake exists.
6. Article/FAQ/Review are planned but absent in runtime.
7. Existing admin cockpit is content/readiness-oriented, not analytics-oriented.
8. External analytics/privacy decisions are still open.

## 7. Risks

- Scope creep into a broad analytics product.
- Treating dashboard recommendations as publish-ready changes.
- Duplicating content truth outside Content Core.
- Collecting too much raw behavioral data without retention/privacy rules.
- Building visual heatmap too early.
- Importing GA4/Метрика data without reliable page/entity mapping.
- Showing Business Owner overly technical data instead of decision summary.

## 8. Recommended MVP

Recommended staged MVP:

1. Minimal first-party semantic events and intent events.
2. Route/entity resolver for current public routes.
3. Daily aggregates by page/entity/source/device.
4. Google Search Console import.
5. Admin `/admin/visibility` with Overview, Pages, Page Detail and Issues.
6. Lead attribution only after lead/intake exists.
7. Semantic click map before visual heatmap.

Do not start with GA4/Метрика/BI/visual heatmap unless owner explicitly makes that a separate priority.

## 9. Open Questions

1. Which search source is first: Google Search Console only, or Google + Yandex from the start?
2. Will external analytics scripts be allowed?
3. What cookie/privacy posture is required?
4. What is the exact lead/intake model?
5. Is Telegram notification still mandatory for lead submit?
6. What raw event retention period is acceptable?
7. Should Business Owner see query-level data or only summarized recommendations?
8. When do `Article`, `FAQ`, `Review` become runtime entities?
9. What thresholds define low CTR, low conversion and traffic decline after baseline appears?

## 10. Git / Runtime Confirmation

Runtime-code changes: none intended and none made by this task.

Expected git tree after this documentation task:

- new PRD in `docs/product-ux`;
- new taxonomy companion in `docs/product-ux`;
- this new report in `docs/reports/2026-04-30`;
- no changes under `app`, `components`, `lib`, `db`, `scripts`, or `tests`.
