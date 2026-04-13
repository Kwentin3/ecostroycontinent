# IMPLEMENTATION.EXECUTION.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1

## 1. Executive Summary

Первая foundation-wave для unified multi-type page workspace реализована и доведена до рабочего контура. Канонический рабочий экран остался один: `Page workspace`. В него добавлены first-wave page types `about`, `contacts`, `service_landing`, `equipment_landing`, baseline source model для `equipment`, typed sections для коммерческих страниц, controlled create modes, shell-faithful preview и русифицированный first-layer GUI.

Изменения доставлены в GitHub и развернуты на сервере. В ходе post-deploy smoke был найден реальный production gap: persisted `equipment` ломался на DB constraint, потому что база ещё не принимала `entity_type = equipment`. Гэп закрыт отдельной миграцией, повторной доставкой и повторным smoke. После исправления создание `equipment`, `service_landing`, `equipment_landing`, preview и review handoff подтвердились на живом контуре.

Итог wave 1: foundation готова к дальнейшему развитию без переоткрытия one-editor decision. При этом часть scale/drift задач сознательно оставлена на следующую волну.

## 2. Source Docs Used

Основной canon и planning baseline:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- `docs/engineering/TEST_DATA_CANON_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1.md`
- `docs/reports/2026-04-13/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.V1.report.md`
- `docs/implementation/PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.md`
- `docs/reports/2026-04-13/PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.report.md`

Supporting context:

- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`

Discrepancies:

- `docs/reports/<latest>/...` были разрешены в актуальные файлы от `2026-04-13`.
- Отдельных path conflicts, блокирующих implementation, не обнаружено.

## 3. Gating Decisions Taken

### 3.1. Exact first-wave changes in `Page`

Для `Page` зафиксирован следующий first-wave shape:

- `slug`
- `pageType`
- `pageThemeKey`
- `title`
- `h1`
- `intro`
- `primaryMediaAssetId`
- `sourceRefs.primaryServiceId`
- `sourceRefs.primaryEquipmentId`
- `sourceRefs.caseIds[]`
- `sourceRefs.galleryIds[]`
- `targeting.geoLabel`
- `targeting.city`
- `targeting.district`
- `targeting.serviceArea`
- `sections[]`
- `blocks[]`
- `seo`

`Page` остаётся owner-ом композиции страницы, порядка секций, targeting и page-level copy. Source domains не растворены в теле страницы.

### 3.2. Exact `equipment` baseline contract

Введён baseline first-class `equipment` contract:

- `slug`
- `locale`
- `status`
- `title`
- `equipmentType`
- `shortSummary`
- `capabilitySummary`
- `keySpecs[]`
- `usageScenarios[]`
- `operatorMode`
- `primaryMediaAssetId`
- `galleryIds[]`
- `relatedCaseIds[]`
- `serviceIds[]`
- `seo`

Это не символическая сущность: она участвует в create flow, workspace source attachment, preview data resolution и review.

### 3.3. Exact first-wave section grammar

`about`:

- required: `hero_offer`, `rich_text`, `proof_cases`, `cta`

`contacts`:

- required: `hero_offer`, `rich_text`, `contact_details`, `geo_coverage`

`service_landing`:

- required: `hero_offer`, `service_scope`, `geo_coverage`, `proof_cases`, `cta`

`equipment_landing`:

- required: `hero_offer`, `equipment_summary`, `equipment_specs`, `geo_coverage`, `proof_cases`, `cta`

### 3.4. Exact create flow by mode

- `standalone`: создаёт `about` или `contacts`; требует тип и название; geo/source не обязателен.
- `from_service`: создаёт `service_landing`; требует primary service и название; geo задаётся page-level полями на старте.
- `from_equipment`: создаёт `equipment_landing`; требует primary equipment и название; geo задаётся page-level полями на старте.
- `clone_adapt`: создаёт новую страницу на основе существующей; стартует из того же рабочего экрана и не создаёт альтернативный editor path.

### 3.5. Exact preview baseline

Preview получает public-shell baseline через тот же read-side renderer, который собирает публичную страницу:

- `header`
- `body`
- `footer`
- device states минимум: `desktop`, `mobile` (в UI также доступен `tablet`)
- preview встроен в page workspace и не образует отдельный subsystem

### 3.6. Legacy-adjacent landing pieces

- `/admin/workspace/landing` и `/admin/workspace/landing/[pageId]` сохранены только как compatibility redirects в `Pages` domain.
- legacy API `/api/admin/workspace/landing/[pageId]` больше не выступает peer save surface; тестами закреплено, что callers redirect-ятся в pages flow.
- top-level nav не содержит отдельного landing editor entry.

### 3.7. Canonical wave-1 Russian labels

В wave 1 в GUI закреплены русские названия:

- `about` -> `О нас`
- `contacts` -> `Контакты`
- `service_landing` -> `Страница услуги`
- `equipment_landing` -> `Страница техники`
- `standalone` -> `Отдельная страница`
- `from_service` -> `Из услуги`
- `from_equipment` -> `Из техники`
- `clone_adapt` -> `Клонировать и адаптировать`
- `equipment` -> `Техника`
- `preview` -> `Предпросмотр`
- `readiness` -> `Готовность`

### 3.8. Deferred to Wave 2 / Wave 3

- полноценные inherited / changed manually / source changed badges по всем полям
- serial production tooling beyond baseline clone/adapt
- duplicate guardrails для `slug`, `title`, `H1`, `intent`, `meta`
- richer geo-specific automation без отдельного page type
- AI section assistance as secondary layer
- масштабный drift dashboard по множеству страниц

## 4. What Was Implemented By Track

### Track A — One-editor runtime guardrails

- Убран peer operator path из top-level навигации.
- Legacy landing routes сведены к redirect/helper-only поведению.
- Publish/review narrative остался внутри page lifecycle и review layer.

### Track B — Page type foundation

- Расширена taxonomy page types до `about`, `contacts`, `service_landing`, `equipment_landing`.
- Обновлены schemas, normalizers, registry records, create flow, edit flow и readiness handling.
- Existing `about` / `contacts` flow сохранён в том же editor surface.

### Track C — Equipment entity foundation

- Добавлен `ENTITY_TYPES.EQUIPMENT`.
- Реализован schema contract, form/top-level field mapping, list/navigation support и persisted storage path.
- После post-deploy gap добавлена DB migration `004_content_entities_equipment_type.sql`.

### Track D — Typed sections foundation

- Введён bounded section grammar по типам страниц.
- Workspace теперь редактирует не плоскую mega-form, а structured sections + metadata layer.
- Section ordering остаётся page-owned.

### Track E — Create/start flow foundation

- Реализованы controlled modes `Standalone`, `From service`, `From equipment`, `Clone/adapt`.
- Для коммерческих страниц primary source attach-ится на старте.
- Geo вошло как page-level targeting, без отдельного `geo_service_landing` type.

### Track F — Preview/public shell foundation

- Preview рендерит страницу вместе с shell.
- Подключены header/footer baseline, public branding, primary phone, email и service area.
- Preview встроен в рабочий экран с компактным readiness panel.

### Track G — Russian operator GUI baseline

- Нормализованы page type labels, create mode labels, source labels, section labels, readiness labels, preview labels.
- В first-layer GUI не торчат raw enum names.
- Русская терминология доведена до минимально последовательного baseline для wave 1.

## 5. Files / Code Zones Changed

Ключевые зоны реализации:

- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/content-ops/readiness.js`
- `lib/read-side/public-content.js`
- `lib/admin/entity-form-data.js`
- `lib/admin/entity-ui.js`
- `lib/admin/nav.js`
- `lib/admin/page-registry-create.js`
- `lib/admin/page-registry-records.js`
- `lib/admin/page-workspace.js`
- `lib/admin/screen-copy.js`
- `lib/ui-copy.js`
- `components/admin/AdminShell.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/EntityTruthSections.js`
- `components/admin/LandingWorkspaceVerificationPanel.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/public/PublicRenderers.js`
- `components/public/public-ui.module.css`
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `db/migrations/004_content_entities_equipment_type.sql`
- `tests/admin/entity-save.route.test.js`
- `tests/admin/page-registry-create.test.js`
- `tests/admin-shell.test.js`
- `tests/content-entity-types.migration.test.js`

## 6. Delivery Notes

Commits:

- `58a9c08` — `Implement unified multi-type page workspace foundation`
- `427cf39` — `Fix equipment storage foundation gap`

Push:

- Оба коммита отправлены в `origin/main`.

Build/publish:

- GitHub build-and-publish run `24339277863` завершился успешно.
- Собран image digest: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:ea930558246f3093aa812ca87bed431d17993b987fad53f0e54a49444d98e2ed`

Deploy:

- Автоматический deploy workflow `deploy-phase1` run `24338779749` упал на внешнем helper-image pull (`busybox:1.36`), не на приложении.
- Доставка завершена вручную через SSH на `root@178.72.179.66`.
- На сервере выполнены `git pull`, DB migration apply, обновление `APP_IMAGE`, `docker compose up -d --force-recreate`.

Health:

- `https://ecostroycontinent.ru/api/health` -> `ok`
- `https://127.0.0.1/api/health` на хосте -> `ok`

## 7. Tests / Checks Run

Local / repo checks:

- `npm test`
- `npm run build`
- `node --test tests/content-entity-types.migration.test.js`
- `node --test tests/admin-shell.test.js tests/content-entity-types.migration.test.js`

Targeted coverage touched by implementation:

- content schemas and entity save route
- page registry create flow
- legacy landing route guardrails
- admin shell navigation
- equipment DB contract safeguard

Build note:

- `npm run build` проходит, но сохраняется уже существующее предупреждение Turbopack/NFT trace around `next.config.mjs` / `lib/config.js` / `app/api/media/[entityId]/route.js`. На foundation-wave regression это не повлияло.

## 8. Post-Deploy Smoke Results

Live smoke проведён на `https://ecostroycontinent.ru` через real admin UI.

Проверено:

1. Открывается реестр страниц.
2. Открывается реестр техники.
3. Создана test service source:
   `entity_3ce82af4-56e3-4419-a49e-9c092f06c4af` / `test-foundation-service`
4. Создана test equipment source:
   `entity_85793a87-4d33-4f3b-9da2-0af0ba8ee612` / `test-foundation-equipment`
5. Создана `about` page:
   `entity_ce701af1-27dd-4bd6-9495-03868d7d5089`
6. Создана `contacts` page:
   `entity_12562425-94d2-4da5-aee8-02ccad7a522f`
7. Создана `service_landing` из услуги:
   `entity_cbc06af9-f492-4c2e-a772-371f444cce58`
8. Создана `equipment_landing` из техники:
   `entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2`
9. Все типы открываются в одном unified page workspace.
10. Metadata modal открывается и остаётся отдельным management layer.
11. Preview показывает shell, а не только body.
12. Review handoff работает по page lifecycle path.
13. Второй landing editor surface в top-level UI не появился.
14. Первый слой GUI в live UI виден на русском языке.

Post-deploy defect and closure:

- Первичный live smoke поймал production bug: создание `equipment` падало на DB check constraint.
- Исправлено миграцией `004_content_entities_equipment_type.sql`, повторным push/deploy и повторным smoke.

Operational note:

- В live contour были созданы test smoke entities/pages. Они остаются как тестовые артефакты текущей валидации и требуют отдельного housekeeping decision.

## 9. Plan Closure Matrix

| Requirement / track | Planned behavior | Implemented behavior | Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Track A — one editor guardrails | Один operator surface, без peer landing editor | Top-level nav очищен; legacy landing routes redirect only | `components/admin/AdminShell.js`, `lib/admin/nav.js`, `app/admin/(console)/workspace/landing/page.js`, `tests/admin-shell.test.js`, `tests/landing-workspace.route.test.js` | Done | Legacy compatibility сохранена, но не как peer surface |
| Track B — page types | Ввести four-type taxonomy | `about`, `contacts`, `service_landing`, `equipment_landing` работают в одном workspace | `lib/content-core/content-types.js`, `lib/content-core/schemas.js`, `lib/admin/page-workspace.js`, live smoke | Done | Existing static flows не сломаны |
| Track C — equipment source | Реальный baseline entity | Equipment schema, forms, save path, nav, DB migration | `lib/content-core/schemas.js`, `components/admin/EntityTruthSections.js`, `db/migrations/004_content_entities_equipment_type.sql`, live smoke | Done after fix | Первичная production gap закрыта post-deploy |
| Track D — typed sections | Структурированный editor вместо mega-form | Section grammar и per-type required sections реализованы | `lib/content-core/pure.js`, `components/admin/PageWorkspaceScreen.js`, live workspace smoke | Done | Metadata осталась вне central canvas |
| Track E — create flow | Controlled modes с attach primary source | `standalone`, `from_service`, `from_equipment`, `clone_adapt` реализованы | `components/admin/PageRegistryClient.js`, `lib/admin/page-registry-create.js`, live create smoke | Done | Geo added as targeting fields |
| Track F — preview | Shell-faithful preview baseline | Preview показывает header/body/footer и device states | `components/public/PublicRenderers.js`, `components/admin/PageWorkspaceScreen.js`, live preview smoke | Done | Tablet available сверх minimum |
| Track G — Russian GUI | Русский first-layer UI | Labels и hints нормализованы в create/workspace/metadata/nav | `lib/admin/page-workspace.js`, `lib/admin/screen-copy.js`, `PageRegistryClient`, `PageMetadataModal`, live UI smoke | Done | Внутренние enum names остались техническими |

## 10. Page Type Matrix

| Page type | Implemented? | Required sections | Optional sections | Required sources | Readiness behavior | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `about` | Yes | `hero_offer`, `rich_text`, `proof_cases`, `cta` | additional proof content through attached cases/galleries | none | base title/H1/media/source hints | Existing standalone flow preserved |
| `contacts` | Yes | `hero_offer`, `rich_text`, `contact_details`, `geo_coverage` | media attachment | none | base title/H1/media readiness hints | Uses page targeting and contact details |
| `service_landing` | Yes | `hero_offer`, `service_scope`, `geo_coverage`, `proof_cases`, `cta` | gallery/case enrichment | `service` | title/H1/media/source readiness visible in workspace and review | Created from service mode in smoke |
| `equipment_landing` | Yes | `hero_offer`, `equipment_summary`, `equipment_specs`, `geo_coverage`, `proof_cases`, `cta` | gallery/case enrichment | `equipment` | title/H1/media/source readiness visible in workspace and review | Created from equipment mode in smoke |

## 11. Source Entity Matrix

| Source entity | Implemented contract | Used by which page types | Inherited defaults | Page-owned overrides | Notes |
| --- | --- | --- | --- | --- | --- |
| `service` | existing first-class service contract retained | `service_landing`, optionally other pages through references | service identity and related cases/media feed page sections and preview | page copy, order, geo, CTA, SEO, section wording | Commercial offer source remains distinct from page owner |
| `equipment` | baseline contract with specs, scenarios, media, relations | `equipment_landing` | title context, summary/spec/case/media defaults for landing assembly | page copy, geo, CTA, section order, SEO | Became real source only after DB migration closure |
| `case` | existing proof entity retained | all page types via proof sections | proof cards and related evidence | narrative framing around cases | Remains first-class proof layer |
| `media_asset` | existing media truth retained | all page types and sources | hero/preview/body media resolution | page choice of primary media attachment | Published-state friction still visible in review |
| `gallery` | existing grouped media truth retained | all page types and sources | proof/gallery sections | page-level inclusion and order | Remains useful supporting source |

## 12. GUI Naming Matrix

| Technical term | User-facing Russian label | Where implemented | Status | Notes |
| --- | --- | --- | --- | --- |
| `about` | `О нас` | create flow, metadata, workspace labels | Done | canonical wave-1 label |
| `contacts` | `Контакты` | create flow, metadata, workspace labels | Done | canonical wave-1 label |
| `service_landing` | `Страница услуги` | metadata, workspace, preview heading | Done | avoids raw enum |
| `equipment_landing` | `Страница техники` | metadata, workspace, preview heading | Done | avoids raw enum |
| `standalone` | `Отдельная страница` | create mode selector | Done | first-layer Russian |
| `from_service` | `Из услуги` | create mode selector | Done | first-layer Russian |
| `from_equipment` | `Из техники` | create mode selector | Done | first-layer Russian |
| `clone_adapt` | `Клонировать и адаптировать` | create mode selector | Done | first-layer Russian |
| `equipment` | `Техника` | admin nav, source picker labels | Done | operator-visible entry restored |
| `preview` | `Предпросмотр` | workspace preview card | Done | paired with shell hint |
| `readiness` | `Готовность` | workspace readiness card | Done | kept compact, not cockpit-style |

## 13. Risks Found During Execution

1. Persisted storage lagged behind schema/UI:
   `equipment` был реализован в app layer раньше, чем база начала принимать новый type.
2. Deploy automation не была полностью надёжной:
   GitHub deploy workflow упал на external helper image pull.
3. Legacy landing compatibility routes всё ещё существуют:
   это безопасно только пока они жёстко остаются redirect/helper-only.
4. Live smoke создал test artifacts в реальном контуре:
   нужна отдельная housekeeping policy.
5. Wave 1 ещё не закрывает duplicate-risk и drift UX:
   foundation usable, но не финализирует scale ergonomics.

## 14. What Was Deferred and Why

- Rich inherited / changed manually / source changed UX:
  отложено, чтобы не превратить first wave в diagnostic-heavy machine.
- Serial production accelerators:
  базовый `clone/adapt` есть, но массовые anti-duplicate guardrails и batch tooling отложены.
- Separate `geo_service_landing` page type:
  сознательно не вводился, чтобы geo остался bounded targeting layer.
- AI section assistance:
  не входит в foundation, чтобы не компенсировать недостающую доменную модель.
- Advanced readiness scoring:
  wave 1 ограничена компактными hints и review visibility.

## 15. Remaining Open Questions

1. Нужен ли отдельный housekeeping flow для test smoke entities/pages на live контуре.
2. Какие exact duplicate guardrails должны войти в следующую волну первыми: `slug`, `title`, `H1`, `meta title`, `geo intent`.
3. Насколько глубоко во второй волне показывать inherited vs changed manually vs source changed на section level.
4. Нужно ли усиливать source drift visibility прямо в registry, а не только в workspace/review.
5. Должен ли `service_landing` в wave 2 получить richer proof/benefits/frequently asked questions sections или сначала лучше усилить reuse/scale tooling.

## 16. Recommended Next Wave

Рекомендуемая следующая волна: `Unified multi-type page workspace scale and drift wave`.

Приоритет этой волны:

1. duplicate guardrails для серийных посадок
2. явный UX `унаследовано / изменено вручную / источник изменился`
3. clone/adapt hardening для серии `техника × гео × оффер`
4. registry-scale affordances
5. housekeeping and test-fixture policy for live operator flows
