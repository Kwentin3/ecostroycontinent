# SITE STRUCTURE ANAMNESIS AUDIT V1

Проект: `Экостройконтинент`
Дата аудита: `2026-04-25`
Режим: audit only, no implementation

## 0. Scope, Sources And Runtime Limits

### Найденные источники истины

Все документы, которые были указаны в задаче, найдены:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`

Дополнительно проверен `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`, потому что PRD v0.3.1 прямо ссылается на него как на public launch canon.

Отсутствующие из заданного списка документы: отсутствующих нет.

### Канонические опорные тезисы

- PRD фиксирует `/services/[slug]` как money pages услуг и `/cases/[slug]` как кейсы/подтверждения: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:78`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:79`.
- Day-1 launch-core: `/`, `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:504`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:505`.
- `Service`, `Case`, `Article` должны быть route-owning сущностями, а `Page` не должен дублировать их route truth: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:284`, `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:510`.
- Media должны идти через `MediaAsset` / `Gallery`, не через raw URL как editorial truth: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:289`, `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md:354`.
- Content Contract формулирует route ownership прямо: `Service` -> `/services/[slug]`, `Case / Project` -> `/cases/[slug]`, `Page` -> standalone pages/composition only: `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:153`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:154`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:156`.
- Public Launch Domain Canon уточняет, что `Home` должен быть trust/navigation hub, а не единственным владельцем коммерческих intent-ов: `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:26`, `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:27`.

### Зафиксированное противоречие в документах

В PRD есть устаревшая/конфликтующая строка schema mapping: `/cases/[slug]` -> `Article with about: Project` (`docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:198`). Более поздние и более конкретные формулировки этого же PRD, Content Contract и Public Launch Domain Canon говорят, что `/cases/[slug]` принадлежит `Case`: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:510`, `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:154`, `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:48`.

Для этого аудита считаю текущим каноном: `Case` owns `/cases/[slug]`. Противоречие нужно убрать в документах отдельно, но это не блокирует оценку текущего кода.

### Runtime/data limit

Попытка прочитать опубликованный read-side из локальной БД через `listPublishedEntities(ENTITY_TYPES.SERVICE)` завершилась `AggregateError [ECONNREFUSED]` в `pg-pool`, вызов из `lib/content-core/repository.js:326`. Поэтому фактический live-набор опубликованных услуг, кейсов, медиа и страниц не подтверждён. Аудит ниже разделяет:

- архитектурно реализовано по коду;
- не подтверждено по live/data из-за недоступной БД;
- слабые места структуры и UX.

Локальный браузерный/mobile smoke не запускался после DB refusal, чтобы не превращать аудит структуры в инфраструктурную отладку.

## 1. Executive Verdict

Вердикт: **частично соответствует**.

Текущая фронтенд-архитектура уже ушла от одной mega landing page: есть отдельные публичные маршруты `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`; главная по коду работает как хаб с ограниченными highlights и переходами. Базовая модель `Media / Services / Cases` в коде есть: `service`, `case`, `media_asset`, `gallery` являются отдельными сущностями.

Главное несоответствие не в отсутствии маршрутов, а в незавершённости launch-структуры как продукта: нет подтверждённого опубликованного набора данных, нет явной навигационной/контентной таксономии для двух крупных направлений `Аренда строительной техники` и `Строительные работы`, нет editorial order/featured/grouping для услуг, а rental-equipment сценарий в публичном рендере пока раскрывается только поверхностными карточками техники.

Самый большой риск: **данные + связи + навигационная таксономия**, усиленные недоступной БД и незавершённой админской поверхностью. Маршрутный каркас в целом правильный.

## 2. Current Route Map

| Route | Назначение | Источник данных | Сущность-владелец | Статус | Проблемы |
|---|---|---|---|---|---|
| `/` | Главная, витрина/хаб | `getPublishedGlobalSettings`, `getPublishedServices`, `getPublishedCases`; fallback fixtures в placeholder mode | App route / home composition | PARTIAL | Структурно хаб, но фактический контент не подтверждён; highlights берут первые 3 услуги/2 кейса без editorial control: `app/page.js:89`, `app/page.js:90`. |
| `/services` | Каталог услуг | `getPublishedServices()` | Service index projection | OK/PARTIAL | Route есть и data-driven: `app/services/page.js:54`, `components/public/PublicRenderers.js:555`; нет grouping/order для аренды vs строительных работ. |
| `/services/[slug]` | Детальная страница услуги | `getPublishedServiceBySlug(slug)`, `buildPublishedLookups()` | `Service` | OK/PARTIAL | Правильный owner и slug: `app/services/[slug]/page.js:40`, `app/services/[slug]/page.js:77`; rental content depth пока слабый: техника выводится краткими карточками. |
| `/cases` | Каталог кейсов | `getPublishedCases()` | Case index projection | OK/PARTIAL | Route есть: `app/cases/page.js:59`, `components/public/PublicRenderers.js:555`; фактический published set не подтверждён. |
| `/cases/[slug]` | Детальная страница кейса | `getPublishedCaseBySlug(slug)`, `buildPublishedLookups()` | `Case` | OK/PARTIAL | Правильный owner и slug: `app/cases/[slug]/page.js:39`, `app/cases/[slug]/page.js:77`; визуальное доказательство зависит от media/galleries. |
| `/about` | Standalone page | `getPublishedAboutPage()` | `Page` with `pageType=about` | OK/PARTIAL | Страница Page-owned, не конкурирует с Service/Case: `app/about/page.js:75`; live data не подтверждены. |
| `/contacts` | Standalone contacts / CTA route | `getPublishedContactsPage()`, Global Settings | `Page` + `Global Settings` | OK/PARTIAL | Есть route: `app/contacts/page.js:75`; publish readiness зависит от confirmed contacts. |
| `/sitemap.xml` | SEO sitemap | published services/cases/about/contacts | Generated read-side | PARTIAL | Sitemap строится из published entities: `app/sitemap.js:26`, `app/sitemap.js:32`; при DB refusal не проверен. |
| `/robots.txt` | Robots policy | display mode state | Generated read-side | PARTIAL | Блокирует индекс при placeholder/under construction: `app/robots.js:8`, `lib/public-launch/display-mode.js:45`. |
| `/api/media/[entityId]` | Public media delivery/redirect | `MediaAsset` + storage | `MediaAsset` | OK/PARTIAL | Delivery URL выводится из entity/storageKey: `app/api/media/[entityId]/route.js:15`, `lib/media/storage.js:203`; actual assets не проверены. |
| `/api/media-public/[entityId]` | Public media binary | `MediaAsset` + storage | `MediaAsset` | OK/PARTIAL | Техническая delivery surface, не content route: `app/api/media-public/[entityId]/route.js:13`. |
| `/api/public/display-mode` | Runtime display mode JSON | persisted display mode | Runtime utility | PARTIAL | Публичная debug/status surface, не контентная страница: `app/api/public/display-mode/route.js:8`. |
| `/api/health` | Health JSON | runtime config | Runtime utility | OK | Не публичный content route: `app/api/health/route.js:3`. |
| `/blog`, `/blog/[slug]` | Blog/article layer | отсутствует в `app` | Article future layer | MISSING / not day-1 blocker | PRD оставляет blog supporting layer после route/entity readiness: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:506`. |

Временных/test public pages в `app` не найдено. Admin routes находятся под `/admin` и не являются публичным сайтом.

## 3. Current Homepage Assessment

Текущая главная по структуре ближе к **navigation hub**, а не к лендингу-простыне.

Доказательства:

- Главная берёт опубликованные услуги и кейсы из read-side, а не содержит полный жёстко зашитый список: `app/page.js:78`, `app/page.js:79`.
- На главной выводятся только highlights: `pickHighlights(..., 3)` для услуг и `pickHighlights(..., 2)` для кейсов: `app/page.js:42`, `app/page.js:89`, `app/page.js:90`.
- Hero сразу ведёт в `/services` и `/cases`: `app/page.js:120`, `app/page.js:121`.
- Блок услуг ведёт на `/services/${service.slug}`, а не раскрывает всё внутри home: `app/page.js:146`.
- Блок кейсов ведёт на `/cases/${item.slug}`: `app/page.js:178`.
- Последний блок ведёт к contact action и `/contacts`: `app/page.js:215`, `app/page.js:224`.

Что хорошо:

- Главная не пытается вместить все услуги, технику, кейсы и доказательства.
- Есть быстрые переходы к услугам, кейсам и контакту.
- Важная навигация не спрятана низко: header и hero CTA доступны вверху.

Что частично/слабо:

- Нет явного первого-экрана разделения на два крупных направления: `Аренда строительной техники` и `Строительные работы`. Это появится только если такие `Service` entities опубликованы и попали в первые highlights.
- Нет editorial featured flag/order. Главная берёт первые элементы массива, а массив published entities сортируется по `published_at DESC`: `lib/content-core/repository.js:332`.
- Тексты главной сейчас частично мета-операторские (`Главная служит опорной страницей...`), а не финальная коммерческая подача: `app/page.js:111`, `app/page.js:136`.
- Если DB недоступна, текущие published calls не отрабатывают; placeholder fallback помогает только когда БД доступна и вернула пустые массивы, а не при `ECONNREFUSED`.

## 4. Services Domain Assessment

### Что реализовано

- Есть route index `/services`: `app/services/page.js:63`.
- Есть route detail `/services/[slug]`: `app/services/[slug]/page.js`.
- Service detail ищет сущность по slug: `app/services/[slug]/page.js:40`, `lib/read-side/public-content.js:96`.
- Service payload имеет slug, title, h1, summary, serviceScope, ctaVariant, equipmentIds, relatedCaseIds, galleryIds, primaryMediaAssetId, seo: `lib/content-core/schemas.js:233`, `lib/content-core/schemas.js:242`, `lib/content-core/schemas.js:246`.
- Metadata для service page строится из `service.seo`, `h1`, `title`, `summary`: `app/services/[slug]/page.js:40`, `app/services/[slug]/page.js:42`.
- Service page рендерит hero, scope, related cases, related equipment, gallery и CTA: `components/public/PublicRenderers.js:688`, `components/public/PublicRenderers.js:699`, `components/public/PublicRenderers.js:735`, `components/public/PublicRenderers.js:746`, `components/public/PublicRenderers.js:759`.
- Publish readiness проверяет slug collision и наличие proof path: `lib/content-ops/readiness.js:144`, `lib/content-ops/readiness.js:167`.

### Что отсутствует или слабо

- Нет отдельной модели service category / service group / parent-child для `Аренда техники` vs `Строительные работы`.
- Нет editorial order/featured на уровне Service. Навигация и highlights зависят от порядка published rows.
- Не видно enforcement правила "одна услуга = один intent". Schema позволяет сделать широкую услугу с несколькими коммерческими intent-ами в одном payload.
- Нет подтверждённого опубликованного Service с slug `arenda-tehniki` или `stroitelnye-raboty` из-за DB refusal.
- В текущем Launch SEO Core канон больше сфокусирован на строительных money pages в Сочи (`stroitelstvo-domov-pod-klyuch`, `monolitnye-raboty`, `rekonstrukciya...`) и не фиксирует `arenda-tehniki` как day-1 money page: `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:43`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:54`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:76`.

Вывод: **модель service pages есть и в целом правильная**, но для нового продуктового обсуждения с двумя крупными направлениями нужна контентная таксономия и опубликованные route-owning Service entities. Без этого `/services` останется плоским списком.

## 5. Equipment Rental Readiness

Готовность к `/services/arenda-tehniki`: **частичная**.

### Что уже есть

- В коде уже есть отдельная сущность `equipment`: `lib/content-core/content-types.js:6`.
- Equipment schema поддерживает slug, title, equipmentType, shortSummary, capabilitySummary, keySpecs, usageScenarios, operatorMode, primaryMediaAssetId, galleryIds, relatedCaseIds, serviceIds: `lib/content-core/schemas.js:249`, `lib/content-core/schemas.js:260`, `lib/content-core/schemas.js:263`.
- Service schema поддерживает `equipmentIds`: `lib/content-core/schemas.js:242`.
- Case schema поддерживает `equipmentIds`: `lib/content-core/schemas.js:276`.
- Admin Service relations дают выбирать связанную технику: `components/admin/EntityTruthSections.js:252`, `components/admin/EntityTruthSections.js:254`.
- Admin Case relations дают выбирать технику в кейсе: `components/admin/EntityTruthSections.js:441`, `components/admin/EntityTruthSections.js:451`.
- Public service detail резолвит related equipment: `app/services/[slug]/page.js:93`, `app/services/[slug]/page.js:95`.
- Public service detail выводит related equipment cards: `components/public/PublicRenderers.js:746`, `components/public/PublicRenderers.js:749`.

### Чего не хватает для полноценной страницы аренды техники

- Нет подтверждённой опубликованной service entity `/services/arenda-tehniki`.
- Public rendering техники на service page сейчас показывает только `title` и `capabilitySummary || shortSummary || equipmentType`: `components/public/PublicRenderers.js:749`, `components/public/PublicRenderers.js:752`.
- На странице service не выводятся `keySpecs`, `usageScenarios`, `operatorMode`, primaryMedia/gallery каждой единицы техники, условия аренды, регион работы, availability CTA.
- Нет публичного `/equipment` route. Это не обязательно по текущему видению, но важно: отдельная `equipment` model уже существует как content supporting entity. Её не нужно объявлять обязательным новым публичным доменом без отдельного решения.
- Legacy page type `equipment_landing` существует в schema, но launch ownership guard блокирует такие Page-owned посадки в строгом режиме: `lib/content-core/content-types.js:25`, `lib/public-launch/ownership.js:12`, `lib/public-launch/ownership.js:43`, `lib/public-launch/ownership.js:65`.

Вывод: `/services/arenda-tehniki` можно сделать как `Service` с `equipmentIds`, media/galleries и cases, не создавая новый публичный `Equipment` domain. Но текущий public renderer пока недостаточно раскрывает rental intent.

## 6. Construction Works Readiness

Готовность к `/services/stroitelnye-raboty`: **частичная**.

Что уже есть:

- Любое направление строительных работ может быть route-owning `Service` с собственным slug/H1/SEO.
- Service detail раскрывает `serviceScope`, `problemsSolved`, `methods`, related cases, galleries и CTA: `components/public/PublicRenderers.js:725`, `components/public/PublicRenderers.js:730`, `components/public/PublicRenderers.js:735`, `components/public/PublicRenderers.js:759`, `components/public/PublicRenderers.js:764`.
- Launch SEO Core уже описывает строительные service pages: строительство домов, монолит, реконструкция, фасады: `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:43`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:54`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:76`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:87`.

Что слабо:

- Нет фактической проверки опубликованного `/services/stroitelnye-raboty`.
- Нет модели "umbrella direction" vs "specific service" внутри Services. Если одновременно добавить `stroitelnye-raboty`, `monolitnye-raboty`, `stroitelstvo-domov`, система не знает, что одно направление зонтичное, а другие дочерние/соседние.
- Нет явных переходов между `Аренда техники` и `Строительные работы`, кроме общего верхнего меню и quick service access.

Вывод: строительные работы хорошо ложатся на `Service`, но плоский список услуг не даст пользователю ясной ориентации между крупным направлением и подуслугами без дополнительной таксономии/навигационной логики.

## 7. Cases Domain Assessment

### Что реализовано

- Есть `/cases` и `/cases/[slug]`: `app/cases/page.js`, `app/cases/[slug]/page.js`.
- Detail route ищет Case по slug: `app/cases/[slug]/page.js:39`, `lib/read-side/public-content.js:110`.
- Case schema содержит slug, title, location, projectType, task, workScope, result, serviceIds, equipmentIds, galleryIds, primaryMediaAssetId, seo: `lib/content-core/schemas.js:267`, `lib/content-core/schemas.js:275`, `lib/content-core/schemas.js:279`.
- Case page рендерит location, task, workScope, result как отдельные доказательные блоки: `components/public/PublicRenderers.js:813`, `components/public/PublicRenderers.js:818`, `components/public/PublicRenderers.js:822`, `components/public/PublicRenderers.js:826`.
- Case page выводит related services и linked equipment: `components/public/PublicRenderers.js:834`, `components/public/PublicRenderers.js:845`.
- Service page выводит related cases: `components/public/PublicRenderers.js:735`.
- Publish readiness блокирует кейс без visual proof: `lib/content-ops/readiness.js:263`.

### Что частично

- Нет проверки реального published case inventory из-за DB refusal.
- Нет отдельных полей before/after, dates, client quote/testimonial, measurable result, но базовый minimum factual structure есть.
- Case cards на index page используют общий `PublicListPage`, где summary берётся из `summary || result || location || intro`: `components/public/PublicRenderers.js:583`. Для кейсов это нормально как старт, но не показывает доказательную структуру на list level.

Вывод: Cases уже являются самостоятельными сущностями, а не фрагментом лендинга. Слабое место - не route model, а готовность реального evidence inventory.

## 8. Media Domain Assessment

### Что реализовано хорошо

- Есть `MediaAsset` и `Gallery` entity types: `lib/content-core/content-types.js:3`, `lib/content-core/content-types.js:4`.
- MediaAsset schema содержит `storageKey`, `originalFilename`, `title`, `alt`, `caption`, `ownershipNote`, `sourceNote`, status/lifecycle: `lib/content-core/schemas.js:207`, `lib/content-core/schemas.js:209`, `lib/content-core/schemas.js:213`, `lib/content-core/schemas.js:216`.
- Gallery schema содержит `primaryAssetId`, `assetIds`, `caption`, `relatedEntityIds`: `lib/content-core/schemas.js:224`, `lib/content-core/schemas.js:227`, `lib/content-core/schemas.js:229`.
- Public read-side строит `mediaMap` и `galleryMap`, а gallery assets собираются по `assetIds`: `lib/read-side/public-content.js:50`, `lib/read-side/public-content.js:69`.
- Service/Case/Page используют `primaryMediaAssetId` и `galleryIds`, а renderer резолвит ID в media/galleries: `components/public/PublicRenderers.js:699`, `components/public/PublicRenderers.js:759`, `components/public/PublicRenderers.js:797`, `components/public/PublicRenderers.js:858`.
- Media delivery URL выводится из storage config, а не хранится как редакционный raw URL: `lib/media/storage.js:203`, `lib/media/storage.js:209`, `lib/media/storage.js:213`.
- Admin media workspace отслеживает where-used, missing alt, source/ownership notes: `lib/admin/media-gallery.js:271`, `lib/admin/media-gallery.js:303`, `lib/admin/media-gallery.js:406`, `components/admin/MediaGalleryWorkspace.js:512`.

### Риски и ограничения

- `assetType` сейчас только `image`: `lib/content-core/schemas.js:208`. Видео как Media domain не поддержано в текущей schema.
- Under construction mosaic использует hardcoded Unsplash URLs: `components/public/PublicRenderers.js:61`, `components/public/PublicRenderers.js:65`, `components/public/PublicRenderers.js:70`, `components/public/PublicRenderers.js:75`. Это не основная media model, но raw URL exception есть.
- Placeholder fixtures имеют московский регион, что конфликтует с launch-region каноном `Сочи / Большой Сочи`, если placeholder mode попадёт наружу: `lib/public-launch/placeholder-fixtures.js:54`, `lib/public-launch/placeholder-fixtures.js:66`, `lib/public-launch/placeholder-fixtures.js:91`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:17`.
- Content Inventory прямо фиксирует, что launch-core media status = `Asset collection required`, и usable visual evidence base в доступном workspace отсутствует: `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md:308`, `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md:321`.

Вывод: модель Media сильная и переиспользуемая, но фактический evidence corpus не подтверждён, видео не входит в текущую реализацию, а placeholder/raw URLs должны оставаться только техническим режимом.

## 9. Navigation And User Orientation

Что реализовано:

- Верхняя навигация содержит Home, Services, Cases, About, Contacts: `lib/public-launch/navigation.js:1`, `lib/public-launch/navigation.js:3`, `lib/public-launch/navigation.js:6`.
- Active section определяется по pathname для `/services/*` и `/cases/*`: `lib/public-launch/navigation.js:32`, `lib/public-launch/navigation.js:39`, `lib/public-launch/navigation.js:43`.
- Breadcrumbs строятся для services/cases detail: `lib/public-launch/navigation.js:96`, `lib/public-launch/navigation.js:110`, `lib/public-launch/navigation.js:118`.
- Public shell выводит breadcrumbs и quick service access: `components/public/PublicRenderers.js:282`, `components/public/PublicRenderers.js:331`.
- Quick service access строится из published services и ведёт на `/services/${slug}`: `lib/public-launch/navigation.js:62`, `lib/public-launch/navigation.js:75`.
- Case detail возвращает к related services, `/services` и `/contacts`: `components/public/PublicRenderers.js:834`, `components/public/PublicRenderers.js:867`, `components/public/PublicRenderers.js:868`.

Что слабо:

- Top nav не различает `Аренда техники` и `Строительные работы`; это будет только внутри списка services.
- `servicesQuickAccess` ограничен 8 услугами и без группировки: `components/public/PublicRenderers.js:283`, `lib/public-launch/navigation.js:62`.
- Нет блока "Другие услуги" на service detail, кроме глобального quick access.
- Нет явного соседнего перехода между rental/construction directions.
- Case -> Service возврат работает только если `serviceIds` заполнены.
- Mobile nav не является отдельным меню; CSS просто складывает header/footer в колонку и даёт wrap: `components/public/public-ui.module.css:1141`, `components/public/public-ui.module.css:1146`, `components/public/public-ui.module.css:1159`.

Вывод: базовая ориентация есть: пользователь понимает раздел и может перейти в соседний top-level route. Но для продуктового видения с двумя крупными направлениями навигации не хватает структурированного service taxonomy layer.

## 10. SEO And Route Ownership Risks

### Соответствие

- `/services/[slug]` принадлежит Service route и ищет `ENTITY_TYPES.SERVICE` по slug: `app/services/[slug]/page.js:40`, `lib/read-side/public-content.js:96`.
- `/cases/[slug]` принадлежит Case route и ищет `ENTITY_TYPES.CASE` по slug: `app/cases/[slug]/page.js:39`, `lib/read-side/public-content.js:110`.
- `/about` и `/contacts` получают Page by pageType, а не конкурируют со services/cases: `app/about/page.js:75`, `app/contacts/page.js:75`.
- Launch ownership guard разрешает Page types только `about` и `contacts`, а `service_landing` / `equipment_landing` считает legacy non-launch: `lib/public-launch/ownership.js:7`, `lib/public-launch/ownership.js:12`, `lib/public-launch/ownership.js:43`.
- Metadata per route строится через canonical, robots, OpenGraph/Twitter и entity seo fields: `lib/public-launch/seo-metadata.js:81`, `lib/public-launch/seo-metadata.js:95`, `lib/public-launch/seo-metadata.js:119`.
- Sitemap строит `/services/${slug}` и `/cases/${slug}` из published entities: `lib/public-launch/seo-runtime.js:71`, `lib/public-launch/seo-runtime.js:105`, `lib/public-launch/seo-runtime.js:119`.

### Риски

- В schema всё ещё есть legacy Page types `service_landing` и `equipment_landing`: `lib/content-core/content-types.js:24`, `lib/content-core/content-types.js:25`, `lib/content-core/schemas.js:287`, `lib/content-core/schemas.js:288`. Guard снижает риск, но legacy code path остаётся.
- Page create API всё ещё содержит ветки `FROM_SERVICE` и `FROM_EQUIPMENT`, которые в строгом launch mode должны блокироваться guard: `app/api/admin/entities/[entityType]/save/route.js:69`, `app/api/admin/entities/[entityType]/save/route.js:102`.
- Старое противоречие PRD `/cases/[slug] -> Article with about: Project` нужно вычистить из канона, чтобы не провоцировать будущий split ownership.
- DB refusal означает, что sitemap/robots/live metadata не проверены на фактическом опубликованном наборе.

Вывод: route ownership сейчас в коде в целом соответствует видению. Основная угроза - не текущий public route, а legacy Page landing paths и документальная неоднозначность вокруг Case/Article.

## 10A. Admin And Data State

Админская/content модель частично готова:

- `content_entities` и `content_revisions` хранят entity type, payload, publish state и active published revision: `db/migrations/001_admin_first_slice.sql:14`, `db/migrations/001_admin_first_slice.sql:27`, `db/migrations/001_admin_first_slice.sql:61`.
- Equipment добавлен в allowed entity types: `db/migrations/004_content_entities_equipment_type.sql:4`.
- Admin nav включает Media, Services, Equipment, Cases, Pages: `lib/admin/nav.js:5`, `lib/admin/nav.js:8`, `lib/admin/nav.js:9`, `lib/admin/nav.js:10`.
- Entity editor содержит relation/media controls для Service, Equipment, Case, Page: `components/admin/EntityTruthSections.js:252`, `components/admin/EntityTruthSections.js:349`, `components/admin/EntityTruthSections.js:441`, `components/admin/EntityTruthSections.js:540`.
- Publish flow есть через `publishRevision` route и revalidation paths: `app/api/admin/revisions/[revisionId]/publish/route.js:31`, `app/api/admin/revisions/[revisionId]/publish/route.js:37`.

Но есть критичные audit findings:

- Локальная БД недоступна (`ECONNREFUSED`), поэтому фактическое создание/редактирование/publish flow не проверено.
- `EntityEditorForm` рендерит `EntityTruthSections`, а затем ещё legacy conditionals для `service`, `case`, `page`, `gallery`, что создаёт риск дублирующихся полей с теми же именами: `components/admin/EntityEditorForm.js:335`, `components/admin/EntityEditorForm.js:496`, `components/admin/EntityEditorForm.js:538`, `components/admin/EntityEditorForm.js:584`.
- `EntityEditorForm` ссылается на `HiddenSeoFields`, но определения компонента в репозитории не найдено: `components/admin/EntityEditorForm.js:634`. Это может ломать admin rendering для non-media entities.

Вывод: админская модель сущностей правильная по направлению, но её runtime надёжность перед использованием для launch-core нужно перепроверить отдельно.

## 11. Hardcoded Content And Scalability Risks

1. Homepage highlights зависят от первых элементов массива, а не от редакторского `featured/order`: `app/page.js:42`, `app/page.js:89`, `app/page.js:90`.

2. Published entity ordering идёт по `published_at DESC`, что делает навигацию чувствительной к времени публикации: `lib/content-core/repository.js:332`.

3. Public nav top-level статичен. Новые top-level sections требуют правки кода: `lib/public-launch/navigation.js:1`.

4. Quick service links берут максимум 8 услуг без grouping: `components/public/PublicRenderers.js:283`, `lib/public-launch/navigation.js:62`.

5. Placeholder services/cases hardcoded и регионально конфликтуют с Sochi launch canon: `lib/public-launch/placeholder-fixtures.js:54`, `lib/public-launch/placeholder-fixtures.js:66`, `lib/public-launch/placeholder-fixtures.js:91`.

6. Under construction mosaic содержит hardcoded raw image URLs: `components/public/PublicRenderers.js:61`, `components/public/PublicRenderers.js:65`, `components/public/PublicRenderers.js:70`, `components/public/PublicRenderers.js:75`.

7. Нет service group/category/parent relation для крупных метадоменов услуг. В schema есть поля связей, но нет `serviceGroup`, `parentServiceId`, `displayOrder`, `featuredOnHome`: `lib/content-core/schemas.js:233`, `lib/content-core/schemas.js:343`.

8. Service renderer показывает related equipment слишком кратко для rental intent: `components/public/PublicRenderers.js:746`, `components/public/PublicRenderers.js:752`.

9. Legacy Page landing types всё ещё существуют в schema/pure/page create path, хотя guard их блокирует: `lib/content-core/content-types.js:24`, `lib/content-core/content-types.js:25`, `lib/content-core/pure.js:125`, `lib/content-core/pure.js:136`.

10. Admin editor содержит признаки drift/duplication и undefined component: `components/admin/EntityEditorForm.js:335`, `components/admin/EntityEditorForm.js:634`.

## 12. Alignment Matrix

| Требование видения | Текущее состояние | Статус | Доказательство из кода | Комментарий |
|---|---|---|---|---|
| Главная как хаб, не mega landing | Главная выводит hero, limited services, limited cases, next step | OK/PARTIAL | `app/page.js:89`, `app/page.js:90`, `app/page.js:146`, `app/page.js:178` | Структура верная, но тексты пока служебные/placeholder-like. |
| Day-1 routes `/`, `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts` | Все route files есть | OK | `app/services/page.js`, `app/services/[slug]/page.js`, `app/cases/page.js`, `app/cases/[slug]/page.js` | Live data не подтверждены. |
| Service owns `/services/[slug]` | Detail route ищет Service by slug | OK | `app/services/[slug]/page.js:40`, `lib/read-side/public-content.js:96` | Соответствует Content Contract. |
| Case owns `/cases/[slug]` | Detail route ищет Case by slug | OK | `app/cases/[slug]/page.js:39`, `lib/read-side/public-content.js:110` | Есть doc conflict в PRD line 198, но code/latest canon за Case. |
| Page не дублирует service/case route truth | About/Contacts Page-owned, service/case отдельные | OK/PARTIAL | `lib/public-launch/ownership.js:7`, `lib/public-launch/ownership.js:12`, `lib/public-launch/ownership.js:65` | Legacy Page landing code остаётся, но guard блокирует. |
| Services расширяемы без route refactor | Новая Service entity со slug попадёт в `/services/[slug]` | PARTIAL | `lib/content-core/schemas.js:233`, `app/services/[slug]/page.js:77` | Нет order/group/featured; админ runtime не проверен. |
| Одна service page = один intent | H1/SEO/slug есть | PARTIAL | `lib/content-core/schemas.js:233`, `app/services/[slug]/page.js:42` | Нет enforcement против смешения intent-ов в одном serviceScope. |
| `/services/arenda-tehniki` как service direction | Поддерживается теоретически через Service slug + equipmentIds | PARTIAL | `lib/content-core/schemas.js:242`, `app/services/[slug]/page.js:93` | Нет confirmed entity; equipment cards поверхностные. |
| `/services/stroitelnye-raboty` как service direction | Поддерживается как Service slug | PARTIAL | `app/services/[slug]/page.js:108`, `components/public/PublicRenderers.js:725` | Нет umbrella taxonomy и data confirmation. |
| Cases как доказательные сущности | Case route/schema/render есть | OK/PARTIAL | `lib/content-core/schemas.js:267`, `components/public/PublicRenderers.js:818`, `components/public/PublicRenderers.js:822`, `components/public/PublicRenderers.js:826` | Фактический evidence pack не подтверждён. |
| Media reusable by refs/IDs | MediaAsset/Gallery refs есть | OK/PARTIAL | `lib/content-core/entity-references.js:84`, `lib/content-core/entity-references.js:87`, `lib/read-side/public-content.js:69` | Видео отсутствует; raw URLs только в holding page. |
| Навигация между разделами | Static nav, active state, breadcrumbs, quick service access | PARTIAL | `lib/public-launch/navigation.js:32`, `components/public/PublicRenderers.js:331` | Нет разделения rental/construction, нет "другие услуги" как контекстный блок. |
| SEO не завязан только на home | Sitemap/metadata строятся по service/case | OK/PARTIAL | `lib/public-launch/seo-runtime.js:105`, `lib/public-launch/seo-runtime.js:119`, `lib/public-launch/seo-metadata.js:81` | Runtime не проверен из-за DB refusal. |
| Admin can create/link/publish Service/Case/Media | Entity model/forms/publish route есть | PARTIAL | `components/admin/EntityTruthSections.js:252`, `components/admin/EntityTruthSections.js:441`, `app/api/admin/revisions/[revisionId]/publish/route.js:31` | Есть undefined `HiddenSeoFields`; DB недоступна. |
| Mobile-first UX | CSS responsive rules есть | PARTIAL | `components/public/public-ui.module.css:1141`, `components/public/public-ui.module.css:1146`, `components/public/public-ui.module.css:1159` | Не проверено визуально; nav просто wrap/column без mobile menu. |

## 13. Recommended Remediation Plan

### P0 - нужно для нормальной структуры launch-core

1. Поднять/проверить локальную БД и published read-side, затем снять фактический inventory: опубликованные services, cases, media, galleries, pages, equipment.

2. Зафиксировать launch service taxonomy для новой реальности:
   - минимум `Аренда строительной техники` как route-owning Service, если это действительно launch intent;
   - минимум `Строительные работы` или набор конкретных строительных Service pages, если umbrella не нужен;
   - не считать примерный список закрытым.

3. Для первых service pages заполнить slug, H1, SEO intent, serviceScope, CTA, proof path:
   - `relatedCaseIds` или `galleryIds` или `primaryMediaAssetId`;
   - для rental service - `equipmentIds`.

4. Создать/подтвердить минимум самостоятельный `/cases` corpus: 2-3 case entities с task/workScope/result/location/media/gallery/serviceIds.

5. Наполнить MediaAsset/Gallery реальными доказательными материалами и убрать риск placeholder leakage:
   - не выпускать московские placeholder fixtures в live;
   - проверить alt/caption/ownership/source.

6. Починить/проверить admin entity editor до использования в content ops:
   - `HiddenSeoFields` undefined;
   - дублирующиеся поля после `EntityTruthSections`;
   - сохранить/опубликовать тестовую Service/Case/Media entity только в отдельной проверке, не в этом аудите.

7. Добавить или зафиксировать data-level способ управлять порядком и featured status услуг/кейсов. Без этого home и quick access будут зависеть от времени публикации.

### P1 - желательно после P0

1. Улучшить `/services` как directional hub: группы `Аренда техники`, `Строительные работы`, возможно `Другие направления`, без превращения home в mega landing.

2. Расширить Service detail rendering для rental intent:
   - equipment cards с фото, specs, operatorMode, usage scenarios;
   - CTA уровня аренды: наличие, смена, звонок;
   - linked cases/photos.

3. Добавить контекстные блоки:
   - `Другие услуги`;
   - `Связанные кейсы`;
   - возврат из case к service;
   - соседний переход rental <-> construction.

4. Провести mobile visual check после появления реального content volume: services list, equipment cards, case gallery, CTA reachability.

5. Уточнить SEO canonical conflict в PRD вокруг `/cases/[slug]`.

### P2 - future, не блокирует launch-core

1. Blog/Article layer после стабилизации Services/Cases/Media route ownership.

2. Video support в MediaAsset, если появится реальная потребность и материалы.

3. Отдельные public equipment pages только если появится подтверждённый SEO/business case; по текущему видению техника может оставаться содержимым service-направления.

4. Более развитая DAM/media search, dashboards, CRM, calculators - вне текущего launch-core.

## 14. Open Questions For Owner

- Финальный регион: `Сочи / Большой Сочи` остаётся каноном или меняется?
- Два крупных направления действительно должны быть первыми публичными service routes: `Аренда строительной техники` и `Строительные работы`?
- Какие единицы техники реально публикуем на launch: типы, фото, характеристики, условия, оператор, минимальная смена?
- Какие строительные направления реально подтверждены: монолит, дома, реконструкция, фасады, земляные работы, другое?
- Какие 2-3 кейса можно публиковать с реальными фото и фактами?
- Какие фото можно использовать публично, у каких есть rights/ownership/source confirmation?
- Какие контакты и CTA подтверждены: телефон, WhatsApp/Telegram, email, регион, форма?
- Должна ли `Строительные работы` быть отдельной umbrella service page или только группой конкретных service pages?
- Должна ли `Аренда техники` быть umbrella service page, а конкретная техника - карточками внутри неё, или позже нужны отдельные service pages типа `/services/arenda-ekskavatora`?

## 15. Final Recommendation

Текущий route skeleton **оставлять как основу**: он уже ближе к правильной модели `главная как хаб + service pages + case pages`, чем к mega landing.

Переделывать нужно не весь сайт, а P0-слой:

- подтвердить и опубликовать route-owning Service entities для ключевых направлений;
- наполнить Cases и Media как доказательные сущности;
- сделать `/services` понятным directional hub, а не плоской лентой;
- проверить/починить admin runtime, потому что без него обещанная расширяемость останется только в schema;
- не вводить отдельный публичный Equipment domain без отдельного решения.

Самый маленький следующий шаг: **поднять DB/read-side и провести content inventory опубликованных entities**, затем создать/подтвердить две первые service directions (`arenda-tehniki`, `stroitelnye-raboty` или утверждённые owner-ом аналоги) как настоящие `Service` records с proof refs.
