# AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1

Дата аудита: 2026-04-17  
Режим: Audit / Anamnesis only (без переписывания PRD и без расширения scope)

## Verification scope and evidence

Использованные источники истины:

- `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
- `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
- `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`

Фактическая верификация:

- кодовая база (App Router, public/admin routes, content core, publish workflow)
- локальная сборка `next build` и маршрутный срез
- тестовый прогон `npm test` (211/211 pass)
- live runtime HTTP probe на `https://178.72.179.66`
- live DB срез через SSH + SQL (VM `ecostroycontinent-phase1-vm`, контейнер `repo-sql-1`)

Ограничения:

- полноценный браузерный mobile UX smoke не выполнялся (оценка mobile частично по CSS/разметке)
- CWV измерения, Search Console и analytics события вживую не подтверждены

---

## 1. Executive summary

### Общий диагноз

Текущий публичный контур **не готов** к качественному phase-1 launch в канонической модели proof-led service website. Реализация сильнее в admin/workflow-части, чем в публичной launch-архитектуре и контентной фактуре.

### Launch posture today

**NO-GO для SEO/commercial launch**.  
Фактически опубликована только `global_settings`; money pages, proof-layer и trust pages в published состоянии отсутствуют.

### 10 ключевых выводов

1. В live БД опубликована только одна сущность: `global_settings` (1 published revision). `service/case/page/media/gallery/equipment` в published не представлены.
2. Публичный маршрутный каркас неполный относительно канона launch-core: `/blog` отсутствует как route и как сущность (`Article` model отсутствует).
3. `/about` и `/contacts` в live дают `404`; `/services` и `/cases` отдаются `200`, но фактически пустые.
4. Home (`/`) — временная заглушка «В разработке» с ссылкой в админку, без роли витрины/маршрутизатора сервисного сайта.
5. Глобальная публичная навигация не реализована: нет header nav, footer nav, breadcrumbs и внутренней перелинковки по launch-модели.
6. Conversion-механика почти отсутствует: нет click-to-call, нет messenger CTA, нет lead form в публичном контуре.
7. Proof/evidence layer в launch-контуре отсутствует: published кейсов нет, published галерей нет, published медиа нет.
8. Contact/region truth формально хранится в `global_settings`, но `contactTruthConfirmed=false`; контакты выглядят временными/placeholder и не проведены через честный launch-ready контур.
9. Technical SEO baseline не поднят: `robots.txt`, `sitemap.xml`, canonical/meta routing logic, JSON-LD и breadcrumbs markup отсутствуют на public runtime.
10. Publish discipline как доменная механика реализована заметно лучше public launch surface: есть `Draft/Review/Published`, readiness checks, owner actions, obligations.

---

## 2. What is already solid

1. Write/read boundary соблюдён: Public Web читает published truth, Admin остаётся write-side.
2. Publish — отдельная операция, не status flip на save.
3. Есть revision lifecycle (`draft -> review -> published`) и owner approval lane.
4. Readiness checks блокируют публикацию при broken refs и недостающих обязательных полях.
5. Есть slug collision checks для published service/case.
6. Есть publish obligations при slug mutation (redirect/revalidation/sitemap/canonical check) как доменные задачи.
7. Draft leakage в public read-side на уровне кода не подтверждён (public queries идут через `active_published_revision_id`).
8. Есть revalidation path в live-deactivation flow.
9. Тестовый контур по admin/content-ops очень плотный (211 pass), regressions в write-side частично закрыты.

---

## 3. Critical gaps

1. Нет published launch-core (услуги/кейсы/about/contacts отсутствуют как live контент).
2. Нет `/blog` route и нет `Article` route-owning сущности.
3. Home не выполняет функцию launch entry hub (нет маршрутизации на услуги/контакты, нет proof-led композиции).
4. Нет публичной навигационной системы (header nav/footer nav/breadcrumbs/internal linking).
5. Нет conversion path (tel/messenger/form CTA).
6. Нет proof inventory в published (кейсы/галереи/медиа).
7. Contact truth не подтверждён (`contactTruthConfirmed=false`), contacts page не опубликована.
8. Technical SEO baseline критически неполный (`robots`, `sitemap`, schema, canonical/meta logic).
9. Public SEO intent map фактически не существует (нет published service pages).
10. В live контуре доминируют тестовые foundation-сущности вместо launch-комплекта.

---

## 4. Domain-by-domain findings

### 4.1 Information architecture / route model

Факт реализации:

- есть: `/`, `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`
- нет: `/blog`, `/blog/[slug]`
- public route inventory подтверждён локальной сборкой и live probe

Canonical path model as implemented:

- `Service` owns `/services/[slug]` (реализовано)
- `Case` owns `/cases/[slug]` (реализовано)
- `Article` ownership отсутствует (модель/route не реализованы)
- `Page` фактически обслуживает только `/about` и `/contacts` (через `pageType`), generic page routing отсутствует

Отклонения от канона:

- launch map с `/blog` не реализован
- home не связывает пользователя с сервисной архитектурой
- `Page` модель содержит `service_landing/equipment_landing`, создавая параллельный write-path к service-like контенту (архитектурный риск drift)

Risk:

- высокий риск размытого ownership и route intent при дальнейшем расширении page-based landing flow

### 4.2 SEO intent map / page purpose

Published service pages: отсутствуют.

Service candidates (draft):

- `test-foundation-service` (slug test-prefix, test/scaffold сущность)

Main intent coverage:

- не подтверждено для launch-core (нет реальных опубликованных услуг)
- launch services из канона («строительство домов», «монолит», «реконструкция») в БД не найдены

Каннибализация:

- в live published каннибализация отсутствует (нет конкурирующих published money pages)
- потенциальный drift: page `service_landing` c тем же slug, что service (`test-foundation-service`) в draft/review

Решение по launch:

- текущие service candidates не пускать в launch

### 4.3 Home page role / entry logic

Текущее состояние home:

- hero-заглушка «Экостройконтинент / В разработке»
- визуальный коллаж с внешними Unsplash изображениями
- единственный явный action: ссылка `/admin/login`

Missing blocks:

- services hub
- proof blocks (кейсы/FAQ/trust)
- публичные CTA
- контактный next-step

Risky blocks:

- публичная ссылка на админ-вход на первом экране
- home не выполняет роль trust/navigation hub

Вердикт:

- home мешает service architecture и launch conversion

### 4.4 Navigation system

Desktop:

- нет глобального публичного header-nav
- нет active state
- нет dropdown/быстрого доступа к услугам
- нет footer navigation
- breadcrumbs отсутствуют

Mobile:

- responsive CSS есть, но mobile navigation как система отсутствует
- full mobile usability не подтверждён интерактивным браузерным smoke

Где пользователь теряется:

- home не ведёт в `/services`/`/cases`/`/contacts`
- list pages (`/services`, `/cases`) без published карточек превращаются в пустые тупиковые экраны
- detail pages недоступны (404)

### 4.5 Proof / evidence layer

Published proof layer:

- cases: 0
- galleries: 0
- media assets: 0

Money pages proof path:

- не подтверждён (нет published service pages)

Case readiness:

- `task/work_scope/result/location/visual proof` в published контуре отсутствуют (нет case entities)

Матрица «страница -> фактура»:

- `/services`: фактура отсутствует
- `/cases`: фактура отсутствует
- `/about`: 404
- `/contacts`: 404

Surviving pages:

- по proof-критерию сейчас нет честно surviving commercial pages

### 4.6 Contact truth / region truth / local signal consistency

Contact truth audit:

- global settings published: `primaryPhone=+7 (900) 000-00-00`, `publicEmail=info@example.com`
- `contactTruthConfirmed=false`
- contacts page опубликована: нет
- публичные CTA-контакты на home/services/cases: отсутствуют

Region truth audit:

- global settings: `primaryRegion=Сочи`, `serviceArea=Сочи и Большой Сочи`
- в public runtime signals почти не транслируются (из-за отсутствия published about/contacts/service detail)

Inconsistencies:

- canonical docs требуют подтверждённый единый contact set до честного launch, но в runtime truth это не подтверждено
- регион есть в global settings, но нет полноценного публичного распространения по ключевым маршрутам

Local SEO blockers:

- отсутствие подтверждённого контакта
- отсутствие contacts page в publish
- отсутствие schema/local business implementation

### 4.7 Conversion mechanics

Карта conversion entry points (факт):

- home: нет user-facing lead CTA
- services list: нет conversion CTA
- cases list: нет conversion CTA
- service detail: route есть, но published нет
- contacts: route 404

CTA surfaces:

- в коде есть CTA copy/chips, но без реального контактного действия (tel/form/messenger links)

Провалы:

- нет click-to-call
- нет click-to-messenger
- нет публичной lead form
- нет короткого и ясного пути к заявке

### 4.8 Publish / review / revision discipline

Фактическая модель publish:

- Draft/Review/Published реализованы
- publish — отдельная операция с readiness валидацией
- owner action lane реализован
- rollback semantics реализованы

Плюсы:

- state machine и gate discipline присутствуют
- slug obligations создаются

Gap vs canon:

- obligations фиксируются как задачи, но автоматизированной redirect/revalidation/sitemap execution цепочки нет
- `sitemap` runtime route отсутствует
- SEO поля (meta/canonical/indexation) на публичном head фактически не применяются

Риски:

- риск «формальной готовности» publish при неполной SEO-delivery цепочке
- риск ручного «закрытия» obligations без фактической внешней проверки

### 4.9 Technical SEO baseline

Checklist:

- `sitemap.xml`: отсутствует (404)
- `robots.txt`: отсутствует (404)
- canonical tags: отсутствуют
- per-page metadata: не реализовано (везде базовый title/description из root layout)
- indexation controls (`index/noindex`): в модели есть, в public head не применяются
- schema markup (JSON-LD): отсутствует
- breadcrumbs markup: отсутствует
- draft leakage risk: низкий на уровне read-side запроса
- CWV-sensitive patterns: есть риск (force-dynamic на public routes, raw `<img>`, тяжелые внешние изображения)

Вердикт:

- technical SEO baseline не готов к launch

### 4.10 Media layer / image readiness

Модель:

- MediaAsset/Gallery как first-class model есть
- refs по id есть

Фактическая готовность:

- published media/galleries: 0
- draft media: 5 (equipment-ориентированные), ownership note пустой
- gallery entities: 0

SEO/trust risks:

- визуальная доказательная база launch services отсутствует
- часть медиа явно vendor/каталожная, не project proof
- home использует background-image коллаж (контент вне индексируемого semantic image layer)

### 4.11 Launch scope discipline

Факт:

- текущая фактическая реализация смещена в admin/equipment экспериментальный контур
- launch-core (5 сильных service + 2-3 case proof) не собран

Давление на публикацию слабых страниц:

- присутствуют test/foundation сущности (`test__...`, `test-...`) в рабочем контуре

Диагноз scope discipline:

- канон про «узкий сильный core» пока не реализован в published данных
- проекту перед launch нужно не расширение, а жёсткое сужение к реальным proof-ready сущностям

---

## 5. Page-type matrix

| Page type | Purpose | Current state | Key gaps | Launch readiness |
|---|---|---|---|---|
| Home (`/`) | Brand/trust/navigation hub | Заглушка «В разработке», admin login ссылка | Нет service hub, proof, CTA, контактного next-step | Risky |
| Services index (`/services`) | Вход в money pages | 200, но пустой список | Нет published service cards, нет CTA/next-step | Risky |
| Service detail (`/services/[slug]`) | Коммерческий intent + proof + CTA | Route есть, все slug дают 404 (published=0) | Нет published service сущностей | Do not launch yet |
| Cases index (`/cases`) | Proof listing | 200, но пустой список | Нет published cases | Risky |
| Case detail (`/cases/[slug]`) | Task/work_scope/result/visual proof | Route есть, все slug дают 404 | Нет case entities | Do not launch yet |
| Blog (`/blog`) | Supporting SEO/explainer content | Route отсутствует (404) | Нет route, нет article entity model | Do not launch yet |
| About (`/about`) | Trust/legal/позиционирование | Route есть, live 404 | Нет published about page | Do not launch yet |
| Contacts (`/contacts`) | Conversion + local trust | Route есть, live 404 | Contact truth не подтверждён, page не published | Do not launch yet |

---

## 6. Launch readiness matrix

### Ready

- `global_settings` как доменная сущность publish/read-side
- admin publish workflow core (revision/review/publish/rollback)

### Partially ready

- route каркас `/services`, `/cases`, `/about`, `/contacts`
- media/evidence модели в админке

### Risky

- home, `/services`, `/cases` в текущем виде
- page/service dual modeling (`service_landing` в Page + Service entity)
- admin surface indexability risk (`/admin/login` без noindex мета/robots-policy)

### Do not launch yet

- `/about`, `/contacts`, `/blog`
- любые service/case detail pages
- полный SEO launch до поднятия technical baseline

---

## 7. Recommended launch cut

### Recommended launch-core (фактически achievable сейчас)

**Launch marketing contour сейчас лучше не выпускать.**  
Реалистичный честный cut на сегодня: технический holding-state, а не полноценный SEO/commercial launch.

### Что пускать в phase-1 launch сейчас

- По-честному: только временный минимальный public holding page (если нужен технический публичный URL).

### Что отложить обязательно

- `/about`, `/contacts`, `/blog`
- все service/case detail
- claims-heavy surfaces

### Что убрать/сжать перед launch

- test/foundation страницы и slug-и из operator контуров
- scope drift в equipment-heavy ветку как launch-priority

---

## 8. Immediate next actions

### Must do before launch

1. Подготовить и опубликовать минимум 2-3 реальные service pages (не test), каждая с отдельным intent и proof-path.
2. Подготовить и опубликовать минимум 2 реальные case pages с `task/work_scope/result/location/visual proof`.
3. Подтвердить contact truth (phone/messenger/email), переключить `contactTruthConfirmed=true`, опубликовать `contacts`.
4. Опубликовать `about` с owner-approved trust copy.
5. Поднять `robots.txt` и `sitemap.xml`.
6. Реализовать фактический SEO head-layer: per-page title/description/canonical/indexation.
7. Удалить/архивировать test/foundation сущности из launch-кандидатного контура.
8. Убрать ссылку на админ-вход с публичного home первого экрана.
9. Сделать явную public навигацию: home -> services -> service detail -> contact action.
10. Добавить хотя бы один рабочий conversion action (tel или messenger или форма) на money pages.

### Should do soon after

1. Ввести `/blog` + `Article` route-owning сущность для supporting SEO слоя.
2. Добавить JSON-LD по page type (`LocalBusiness`, `Service`, `Article`, `FAQPage`, `BreadcrumbList`).
3. Добавить footer navigation и контекстную перелинковку related services/cases.
4. Закрыть publish obligations execution chain (не только запись задачи).

### Optional later

1. AI discoverability routes (`/llms.txt`, `/llms-full.txt`) после базовой launch стабилизации.
2. Расширение equipment публичного контура только после закрытия service/case core.

---

## Дополнительные артефакты

### A. Short launch checklist

- [ ] Есть published `/about`, `/contacts`, `/services` + минимум 2 service detail + минимум 2 case detail
- [ ] Contact truth подтвержден (`contactTruthConfirmed=true`)
- [ ] На money pages есть явный conversion action
- [ ] Есть `robots.txt`, `sitemap.xml`, canonical/meta layer
- [ ] Нет test/foundation сущностей в launch candidate set
- [ ] Есть внутренняя навигация и перелинковка по сервисному пути
- [ ] Есть proof-layer (кейсы/медиа/фактура), а не только promises

### B. Service/page audit matrix

| Entity/Page | State | Fact status | Launch decision |
|---|---|---|---|
| Service `test-foundation-service` | draft | test scaffold, без кейсов/галерей, blocked readiness по media publish ref | Do not launch |
| Page `test__Страница услуги foundation` (`service_landing`) | review | test scaffold, blocked readiness по media publish ref | Do not launch |
| Page `test__О нас foundation` (`about`) | draft | readiness формально pass, но test content и не published | Do not launch |
| Page `test__Контакты foundation` (`contacts`) | draft | blocked: `contacts_truth_unconfirmed` | Do not launch |

### C. Route/navigation inconsistencies

1. Канон ожидает `/blog`, фактически route отсутствует.
2. Канон ожидает home как hub, фактически home — заглушка без service routing.
3. На public страницах нет глобального nav/footer/breadcrumbs.
4. `/about` и `/contacts` формально в route map, но фактически 404.
5. `Page` содержит service-like landing type, создавая параллельную модель рядом с `Service`.

### D. Publish/slug/sitemap risks

1. Slug obligations создаются, но нет end-to-end automated execution для redirect/sitemap.
2. `sitemap.xml` route отсутствует полностью.
3. `robots.txt` отсутствует.
4. SEO поля (`metaTitle/metaDescription/indexationFlag/canonicalIntent`) не проецируются в public head.
5. Revalidation на publish не встроена (есть только в live-deactivation flow).

### E. Contact/region inconsistencies

1. Global settings содержит контактный набор, но `contactTruthConfirmed=false`.
2. Contacts page не опубликована.
3. Home/services/cases не дают явного контактного действия.
4. Region truth есть в global settings, но отсутствует как системная public SEO projection (schema/meta/local page coverage).

---

## FINAL DIAGNOSIS

1. Текущий публичный контур в состоянии pre-launch scaffold, не phase-1 launch-ready site.
2. В live published truth есть только `global_settings`; ключевых публичных сущностей нет.
3. Money-page архитектура формально есть в коде, но пуста в данных.
4. Home не выполняет launch роль и не ведёт пользователя по сервисному пути.
5. `/about` и `/contacts` в 404, `/blog` отсутствует.
6. Conversion path практически отсутствует: нет tel/messenger/form CTA.
7. Proof-layer отсутствует в published виде: кейсы/галереи/медиа не опубликованы.
8. Contact truth не подтверждён; local SEO launch в текущем состоянии нечестный.
9. Technical SEO baseline (robots/sitemap/canonical/schema) не реализован.
10. Publish discipline и read-side boundary реализованы хорошо, но это не компенсирует пустой public слой.
11. В data-контуре преобладают test/foundation сущности, а не owner-approved launch content.
12. Есть scope drift в equipment/admin направлении при недостроенном service/case core.
13. Перед launch проект нужно **сузить**, а не расширять: собрать минимальный реальный proof-led core и только его выпускать.
14. Решение на сегодня: **marketing launch отложить**, пройти must-do блок до публикации.
