# SITE.STRUCTURE.ANAMNESIS.AUDIT.V1 - ADDENDUM.RUNTIME_CONTEXT

Дата: 2026-04-25
Базовый аудит: `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.report.md`
Режим: docs + context hardening + targeted recheck, без продуктового рефакторинга.

## 1. Executive Update

Вывод базового аудита о route skeleton и метадоменах остается валидным: `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `Service`, `Case`, `MediaAsset`, `Gallery` и `Equipment` в коде есть.

Главное уточнение: локальный `ECONNREFUSED` в workspace нельзя трактовать как дефект БД, отсутствие published content или причину "поднимать локальную БД". Workspace не является runtime-контуром. Published inventory нужно проверять на deployed runtime/server/admin/API.

После read-only recheck на сервере подтверждено: production app и SQL runtime работают, публичный сайт сейчас переведен в `under_construction`, а live DB уже содержит Equipment/Media content. Поэтому проблему нужно описывать как runtime/content publication state, а не как "в workspace нет БД".

## 2. Infrastructure Docs Read

- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNTIME_DEPLOY_ARTIFACTS.BASELINE_DESIGN_Экостройконтинент_v0.1.md`
- `compose.yaml`
- `.env.example`
- `.github/workflows/deploy-phase1.yml`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md`
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`

`docs/_index/redirects.md` показывает, что infra docs были перенесены из `docs/infra-ops` в `docs/selectel`. Поэтому agent runtime briefing создан в `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`.

## 3. Runtime Truth Reinterpretation

Было в аудите по смыслу:

> Поднять/проверить локальную БД и published read-side.

Должно быть:

> Проверить published read-side на deployed runtime/server/admin/API. Не считать отсутствие локальной БД в workspace блокером продукта.

Доказательства:

- `compose.yaml:2` фиксирует, что canonical phase-1 runtime живет на Linux VM.
- `compose.yaml:3` - `compose.yaml:4` прямо запрещает трактовать compose как вторую SQL truth для Windows workstation.
- `.env.example:1` - `.env.example:4` фиксирует env schema для app container и предупреждает не создавать второй domain SQL truth на operator IDE.
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md:15` - `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md:18` принимают one-VM posture with `app` + `sql`.
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md:117` запрещает treating runner workspace as source of truth for runtime state.

## 4. Deployed Runtime Recheck

Read-only checks через документированный Selectel access:

- SSH по runbook: `ssh -i "$env:USERPROFILE\.ssh\sait_selectel_rsa" root@178.72.179.66`
- container state: `repo-app-1` up, `repo-sql-1` up/healthy, `ecostroycontinent-traefik` up.
- `https://ecostroycontinent.ru/api/health` вернул `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`.
- Public routes `https://ecostroycontinent.ru/`, `/services`, `/services/arenda-tehniki`, `/cases` отвечают `200 text/html`.
- Но public HTML сейчас показывает holding state `В разработке`, title вроде `Услуга — в режиме подготовки`, robots `noindex, nofollow`.
- Live table `site_display_mode_state` содержит `mode=under_construction`, reason `не готв`, `changed_at=2026-04-25 11:39:51.315853+00`.

Это значит: live runtime доступен и DB configured, но public core намеренно удержан в under-construction mode. Public route `/services/arenda-tehniki` сейчас подтверждает route skeleton, но не подтверждает наличие опубликованной `Service` entity с таким slug, потому что lookup не выполняется в under-construction branch.

## 5. Live Published Inventory Snapshot

Read-only SQL на сервере:

| entity_type | total | active published |
| --- | ---: | ---: |
| `equipment` | 5 | 1 |
| `global_settings` | 1 | 1 |
| `media_asset` | 5 | 5 |
| `page` | 1 | 0 |

В этой проверке нет строк `service`, `case`, `gallery` в `content_entities`. Это уже deployed runtime факт, а не вывод из отсутствия локальной БД.

## 6. Equipment Contract Recheck

Кодовый контракт `Equipment` подтвержден в `lib/content-core/schemas.js:249` - `lib/content-core/schemas.js:264`.

| Field | Contract | Admin input | Live runtime data |
| --- | --- | --- | --- |
| `title` | есть | `components/admin/EntityTruthSections.js:311` - `components/admin/EntityTruthSections.js:312` | есть у 5 equipment records |
| `slug` | есть | `components/admin/EntityTruthSections.js:303` - `components/admin/EntityTruthSections.js:304` | есть у 5 records |
| `equipmentType` | есть | `components/admin/EntityTruthSections.js:315` - `components/admin/EntityTruthSections.js:316` | есть у 5 records |
| `shortSummary` | есть | `components/admin/EntityTruthSections.js:323` - `components/admin/EntityTruthSections.js:324` | есть у 5 records |
| `capabilitySummary` | есть | `components/admin/EntityTruthSections.js:327` - `components/admin/EntityTruthSections.js:328` | есть у 5 records |
| `keySpecs` | есть | `components/admin/EntityTruthSections.js:337` - `components/admin/EntityTruthSections.js:340` | по 6 specs у каждой карточки |
| `usageScenarios` | есть | `components/admin/EntityTruthSections.js:342` - `components/admin/EntityTruthSections.js:345` | по 3 scenarios у каждой карточки |
| `operatorMode` | есть | `components/admin/EntityTruthSections.js:331` - `components/admin/EntityTruthSections.js:332` | `С экипажем` у 5 records |
| `primaryMediaAssetId` | есть | `components/admin/EntityTruthSections.js:377` - `components/admin/EntityTruthSections.js:381` | заполнен у 5 records |
| `galleryIds` | есть | `components/admin/EntityTruthSections.js:366` - `components/admin/EntityTruthSections.js:370` | сейчас 0 gallery refs |
| `relatedCaseIds` | есть | readonly/relation model | сейчас 0 related case refs |
| `serviceIds` | есть | reverse/usage relation | сейчас 0 service refs |

Live equipment records:

- `zauberg-e370-c`
- `zauberg-wl28`
- `lonking-cdm307`
- `zauberg-ex-210cx`
- `zauberg-ex-210c` - единственная active published Equipment revision на момент проверки.

Вывод: owner hypothesis частично подтверждена. Данные карточек техники реально есть на сервере и хорошо соответствуют `Equipment` / `MediaAsset` contract. Но текущий public site не показывает их из-за `under_construction`, а service/case links пока не заполнены.

## 7. Public Rendering Recheck

Что выводится публичным `ServicePage` по коду:

- service primary media: `components/public/PublicRenderers.js:699` и `components/public/PublicRenderers.js:724`;
- scope/problems/methods: `components/public/PublicRenderers.js:730` - `components/public/PublicRenderers.js:733`;
- related cases: `components/public/PublicRenderers.js:735` - `components/public/PublicRenderers.js:742`;
- related equipment section: `components/public/PublicRenderers.js:746` - `components/public/PublicRenderers.js:755`;
- equipment card fields in service/case renderer: `title` + `capabilitySummary || shortSummary || equipmentType` at `components/public/PublicRenderers.js:751` - `components/public/PublicRenderers.js:752` and `components/public/PublicRenderers.js:850` - `components/public/PublicRenderers.js:851`;
- service gallery by `galleryIds`: `components/public/PublicRenderers.js:757` - `components/public/PublicRenderers.js:763`.

Что есть в contract/live data, но не выводится в current `ServicePage` equipment cards:

- equipment `primaryMediaAssetId`;
- equipment `keySpecs`;
- equipment `usageScenarios`;
- equipment `operatorMode`;
- equipment `galleryIds`;
- equipment `relatedCaseIds`;
- per-equipment CTA/availability/rental terms.

Важно: legacy `Page` rendering умеет выводить equipment summary/specs через `PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY` and `EQUIPMENT_SPECS` (`components/public/PublicRenderers.js:439` - `components/public/PublicRenderers.js:469`), а create-from-equipment payload подтягивает `primaryMediaAssetId`, `capabilitySummary`, `keySpecs`, `galleryIds` (`app/api/admin/entities/[entityType]/save/route.js:131` - `app/api/admin/entities/[entityType]/save/route.js:146`). Но strict launch ownership блокирует legacy `equipment_landing` / `service_landing` page types для launch (`lib/public-launch/ownership.js:39` - `lib/public-launch/ownership.js:65`, `lib/content-ops/readiness.js:316` - `lib/content-ops/readiness.js:324`). Это не нужно превращать в новый `/equipment` domain.

## 8. Service / Case / Media Contract Recheck

Services:

- `Service` schema имеет `slug`, `h1`, `summary`, `serviceScope`, `equipmentIds`, `relatedCaseIds`, `galleryIds`, `primaryMediaAssetId`, `seo`: `lib/content-core/schemas.js:233` - `lib/content-core/schemas.js:246`.
- Service detail владеет `/services/[slug]` и ищет `Service` by slug: `app/services/[slug]/page.js:40`, `app/services/[slug]/page.js:77`.
- Service detail резолвит equipment through refs/reverse compatibility: `app/services/[slug]/page.js:93` - `app/services/[slug]/page.js:100`.
- Live server на момент проверки не содержит `service` rows. Поэтому `/services/arenda-tehniki` пока нельзя считать published Service page, даже если route skeleton отвечает 200 in holding mode.

Cases:

- `Case` schema имеет `slug`, `location`, `task`, `workScope`, `result`, `serviceIds`, `equipmentIds`, `galleryIds`, `primaryMediaAssetId`, `seo`: `lib/content-core/schemas.js:267` - `lib/content-core/schemas.js:279`.
- Case detail владеет `/cases/[slug]`: `app/cases/[slug]/page.js:39`, `app/cases/[slug]/page.js:77`.
- Case renderer показывает task/work/result и linked service/equipment: `components/public/PublicRenderers.js:820` - `components/public/PublicRenderers.js:851`.
- Live server на момент проверки не содержит `case` rows.

Media:

- `MediaAsset` schema имеет `storageKey`, `title`, `alt`, `caption`, `ownershipNote`, `sourceNote`, `status`: `lib/content-core/schemas.js:207` - `lib/content-core/schemas.js:221`.
- `Gallery` schema имеет `primaryAssetId`, `assetIds`, `caption`, `relatedEntityIds`: `lib/content-core/schemas.js:224` - `lib/content-core/schemas.js:230`.
- `buildPublishedLookups` строит `mediaMap`, `galleryMap` и связывает galleries.assets по `assetIds`: `lib/read-side/public-content.js:62` - `lib/read-side/public-content.js:91`.
- Live server имеет 5 published `media_asset` records, все связаны с equipment primary media.
- Direct sample `https://ecostroycontinent.ru/api/media-public/entity_06107869-2e15-43ca-b251-11d7505519e3` вернул `200 image/jpeg`.
- Sample `https://ecostroycontinent.ru/api/media/entity_06107869-2e15-43ca-b251-11d7505519e3` вернул `302` на Selectel CDN URL; following CDN URL из workspace дал `502`. Это отдельный media delivery/CDN check, не доказательство отсутствия media metadata.

## 9. Audit Conclusions That Remain Valid

- Сайт по коду ближе к модели `Home as hub + service pages + case pages`, чем к mega landing.
- Route skeleton правильный: `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`.
- `Service` owns `/services/[slug]`; `Case` owns `/cases/[slug]`; `Page` не должен дублировать route truth.
- `MediaAsset` / `Gallery` являются reusable proof/supporting entities.
- `Equipment` уже существует как supporting entity, связанная с services/cases/media.
- Не нужен отдельный public `/equipment` domain в P0.

## 10. Audit Conclusions To Clarify

- Формулировки про "не подтвержденный published set из-за DB refusal" нужно читать как "не был проверен deployed runtime"; теперь deployed runtime проверен.
- Админ/runtime не нужно считать сломанными из-за workspace `ECONNREFUSED`; production health говорит `databaseConfigured=true`, SQL container healthy.
- Public site сейчас intentionally under construction. Это блокирует визуальную проверку public equipment cards, но не отменяет наличие Equipment/Media data на сервере.
- Для `arenda-tehniki` нужно не "чинить локальную БД", а подтвердить/создать/опубликовать `Service` entity и связать ее с existing Equipment IDs на deployed runtime/admin.
- Самое узкое место после recheck: отсутствие published Service/Case entities and refs на live runtime, плюс current service renderer показывает equipment cards поверхностно.

## 11. Product Interpretation Of Cases / Equipment

- `Case` технически остается отдельной content entity.
- Product-wise кейс не является отдельным коммерческим направлением.
- Кейсы / выполненные работы / портфолио - доказательный слой.
- Кейсы должны присоединяться к услугам через `serviceIds` / related refs.
- Кейсы могут выводиться на главной как proof highlights, внутри service page как proof layer, в `/cases` как портфолио и на `/cases/[slug]` как подробная доказательная страница при достаточной фактуре.
- Services продают.
- Cases доказывают.
- Media подтверждают визуально.
- Equipment является supporting content для услуги аренды, пока отдельно не принято решение делать public equipment domain.

## 12. Updated Remediation Plan

### P0 - launch-core structure

1. Держать runtime context visible для агентов: `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`.
2. Проверять published read-side на deployed runtime/server/admin/API, а не через ожидание локальной БД в workspace.
3. Подтвердить текущий public display mode before any public-content conclusion.
4. Перевести `/services/arenda-tehniki` из route skeleton/holding state в настоящую published `Service` entity, если owner подтверждает этот launch intent.
5. Связать rental Service с existing Equipment через `equipmentIds`; не создавать public `/equipment` domain.
6. Сверить public renderer с реальной rental page: если cards должны показывать specs/photo/operator/scenarios, доработку планировать как service page rendering, а не как смену доменной модели.
7. Подтвердить минимальный `stroitelnye-raboty` / конкретные строительные Services как route-owning Services.
8. Подготовить первые Cases как proof layer и связать их с Services/Equipment only if real evidence exists.

### P1 - после P0

1. Сделать `/services` более понятным directional hub.
2. Добавить grouping/order/featured для услуг, чтобы порядок не зависел от published row order.
3. Добавить контекстную навигацию `Аренда техники` <-> `Строительные работы`.
4. Усилить связанные кейсы/портфолио как proof layer на service pages.
5. Проверить CDN/media redirect path отдельно от media metadata.

### P2 - future

1. Отдельные страницы конкретной техники только при реальном SEO/business case.
2. Video support в Media только если есть реальные видео.
3. Более развитый portfolio filtering позже, после стабилизации Services/Cases/Media inventory.

## 13. Final Recommendation Update

Не переписывать архитектуру сайта из-за local DB refusal. Текущая модель сущностей и routes годится как основа.

Самый маленький следующий шаг: на deployed runtime/admin подтвердить owner-ом service intent `arenda-tehniki`, опубликовать/связать его как `Service -> /services/arenda-tehniki` с existing Equipment records, затем проверить public rendering после выхода из `under_construction` или на разрешенной preview surface.
