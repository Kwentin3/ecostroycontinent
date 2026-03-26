# EKOSTROY.UI.RUSSIFICATION_AND_FRIENDLY_COPY.AUDIT.v1

## 1. Executive summary

Состояние русификации сейчас смешанное.

Public web в текущем коде не соответствует posture `RU-only`: на списковых и детальных страницах есть английские заголовки, CTA, fallback-тексты и метки. Админский контур в целом уже русифицирован, но там остались крупные английские островки, технический жаргон, raw keys статусов и сообщения, которые выглядят как перевод для разработчика, а не для пользователя.

Главный риск для user-friendliness не в одном-двух английских словах, а в отсутствии единого канона. Один и тот же смысловой шаг в разных местах называется по-разному: `review`, `approval`, `preview`, `readiness`, `publish`, `rollback`, `asset`, `slug`, `first slice`, raw enum keys. Для Business Owner и нетехнического пользователя это создаёт ощущение системы, а не понятной рабочей панели.

Самые быстрые улучшения:
- перевести public list/detail copy и layout metadata;
- исправить query-message flow и `operation-feedback`;
- убрать английский из bootstrap superadmin surface;
- заменить английские labels в shared picker-ах и readiness/diff/timeline компонентах;
- перестать выводить raw `state`, `eventKey`, `previewStatus`, `ownerApprovalStatus` и `changeClass` без маппинга.

Что требует системной зачистки:
- единый слой RU copy/messages;
- единые маппинги статусов, событий, ролей и entity types;
- разделение copy по `public`, `admin`, `system`, `dev-only`;
- канонический glossary в docs и коде;
- отдельный runtime content sweep, если нужно проверить уже сохранённые записи БД. В этом аудите я видел код и документацию, но не выгрузку живого контента из базы.

## 2. Surface map

| Surface | Route / screen | Status | Problem level | Comment |
|---|---|---:|---:|---|
| Public web | `/`, `/services`, `/cases`, `/about`, `/contacts` | mixed, not RU-only | critical | Home screen is RU, but list/detail rendering and defaults are English-heavy. |
| Public renderers | `components/public/PublicRenderers.js` | English-heavy | critical | Main source of public-facing English labels, CTAs, empty states and fallback copy. |
| Public page generator | `lib/content-core/pure.js` | mixed | high | Injects English block titles and CTA defaults into CMS pages. |
| Layout metadata | `app/layout.js`, `app/admin/layout.js`, `app/admin/bootstrap/superadmin/page.js` | mixed | medium | Browser title/description surface is still English in places. |
| Admin shell | `/admin` | mixed RU/EN | high | Russian shell, but dashboard copy still uses internal jargon and English nouns. |
| Review / publish | `/admin/review`, `/admin/review/[revisionId]`, `/admin/revisions/[revisionId]/publish` | mixed, technical | high | Review, preview, readiness and approval text are not yet human-first. |
| Entity editor | `/admin/entities/[entityType]`, `/admin/entities/[entityType]/[entityId]`, `/admin/entities/[entityType]/new` | mixed, technical | high | Most visible admin form labels and helper text remain English or dev-speak. |
| History / timeline | `/admin/entities/[entityType]/[entityId]/history` | mixed, technical | high | Diff, timeline and audit text leak raw keys and English labels. |
| User admin | `/admin/users` | mostly RU | medium | Page copy is okay, but feedback messages come from English route responses. |
| Security bootstrap | `/admin/bootstrap/superadmin` | English | high | Dedicated operator flow is almost entirely English and over-technical. |
| Shared UI | `components/admin/*` | mixed, hardcoded | high | The copy problem is centralized here, but not standardized. |
| Copy / feedback layer | `lib/admin/*`, `lib/content-ops/*`, `lib/content-core/*` | mixed + raw keys | critical | This is where user-facing text is generated, mapped, or leaked. |
| Docs canon | `docs/product-ux/*` | mixed RU/EN, implementation-facing | medium | Not user-facing copy, but it currently seeds the same terminology drift. |
| Dev-only scripts | `scripts/*.mjs` | English fixture text | low / excluded | These are non-user surfaces and should stay separate from the main audit. |

## 3. Findings register

| ID | Surface | Route / component | Current text | Issue type | Severity | Explanation | Proposed replacement | Source location |
|---|---|---|---|---|---|---|---|---|
| F-001 | Public web | `app/services/page.js`, `app/cases/page.js`, `components/public/PublicRenderers.js` | `Published read-side`, `Services`, `Cases`, `Open`, `Service`, `Case`, `Task`, `Work scope`, `Result` | English UI | critical | Public surface is not RU-only and still reads like staging/internal tooling. This is the most visible launch risk. | `Публичный раздел`, `Услуги`, `Кейсы`, `Открыть`, `Услуга`, `Кейс`, `Задача`, `Объем работ`, `Результат` | `app/services/page.js:11`; `app/cases/page.js:11`; `components/public/PublicRenderers.js:57`; `components/public/PublicRenderers.js:71`; `components/public/PublicRenderers.js:105`; `components/public/PublicRenderers.js:112`; `components/public/PublicRenderers.js:116`; `components/public/PublicRenderers.js:120` |
| F-002 | Public web | `lib/content-core/pure.js`, `components/public/PublicRenderers.js` | `Related services`, `Related cases`, `Gallery`, `Contacts`, `Contact us`, `Get in touch` | English fallback copy | high | CMS-generated pages fall back to English block titles and CTA text when editors leave fields empty. This leaks into public content. | `Связанные услуги`, `Связанные кейсы`, `Галерея`, `Контакты`, `Свяжитесь с нами`, `Связаться с нами` | `lib/content-core/pure.js:64`; `lib/content-core/pure.js:73`; `lib/content-core/pure.js:82`; `lib/content-core/pure.js:91`; `lib/content-core/pure.js:98`; `lib/content-core/pure.js:100` |
| F-003 | Layout metadata | `app/layout.js`, `app/admin/layout.js`, `app/admin/bootstrap/superadmin/page.js` | `Phase-1 Next.js app baseline...`, `Ekostroykontinent Admin`, `Bootstrap superadmin` | English metadata | medium | Browser titles and crawl metadata still announce the app in English. Это не page copy, но это видимая поверхность. | `Экостройконтинент`, `Экостройконтинент — админка`, `Инициализация суперадмина` | `app/layout.js:2`; `app/layout.js:3`; `app/admin/layout.js:2`; `app/admin/bootstrap/superadmin/page.js:5` |
| F-004 | Admin dashboard / review entry | `app/admin/(console)/page.js`, `app/admin/(console)/review/page.js`, `app/admin/(console)/review/[revisionId]/page.js` | `revision`, `review`, `approval владельца`, `first slice`, `not required`, `owner review`, `Readiness` | Mixed RU/EN + technical jargon | high | The dashboard uses Russian shell labels, but the working language inside the flow is still developer language. Business Owner sees workflow terms, not task terms. | `Черновик`, `Проверка`, `Согласование владельца`, `стартовый набор`, `не требуется`, `Согласование владельца`, `Проверка готовности` | `app/admin/(console)/page.js:36`; `app/admin/(console)/page.js:40`; `app/admin/(console)/page.js:48`; `app/admin/(console)/page.js:62`; `app/admin/(console)/review/page.js:26`; `app/admin/(console)/review/page.js:36`; `app/admin/(console)/review/[revisionId]/page.js:90`; `app/admin/(console)/review/[revisionId]/page.js:96`; `app/admin/(console)/review/[revisionId]/page.js:118`; `app/admin/(console)/review/[revisionId]/page.js:120` |
| F-005 | Review queue / publish prep | `app/admin/(console)/review/page.js`, `app/admin/(console)/revisions/[revisionId]/publish/page.js` | `Approval владельца`, `previewStatus`, `Статус preview`, `blocking issues`, `Опубликовать` | Mixed status labels | high | Raw technical status terms are shown where a human label should be. A user sees `previewStatus` and `not required`, not a sentence. | `Согласование владельца`, `Статус предпросмотра`, `Блокирующие замечания`, `Опубликовать` | `app/admin/(console)/review/page.js:26`; `app/admin/(console)/review/page.js:36`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:32`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:34`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:39`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:41` |
| F-006 | Entity list / history | `app/admin/(console)/entities/[entityType]/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`, `components/admin/RevisionDiffPanel.js`, `components/admin/TimelineList.js` | `no revisions`, `Open`, `AI involved`, `Human-readable diff`, `Before`, `After`, `Timeline is empty.` | Raw state + English UI | high | Revision and audit views leak internal keys and English labels. History should read as an action log, not a debug panel. | `Версий нет`, `Открыть`, `С участием AI`, `Понятные изменения`, `До`, `После`, `Лента пуста` | `app/admin/(console)/entities/[entityType]/page.js:63`; `app/admin/(console)/entities/[entityType]/page.js:65`; `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:41`; `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:47`; `components/admin/RevisionDiffPanel.js:3`; `components/admin/RevisionDiffPanel.js:17`; `components/admin/RevisionDiffPanel.js:21`; `components/admin/TimelineList.js:3`; `components/admin/TimelineList.js:18` |
| F-007 | Entity editor | `components/admin/EntityEditorForm.js`, `lib/content-core/diff.js` | `Meta title`, `OpenGraph title`, `Public brand name`, `Slug`, `CTA variant`, `Service scope`, `Problems solved`, `Work scope`, `Default block CTA label`, `Сохранить черновик`, `Отправить на review` | English labels + dev jargon | high | The main editor is where most operator copy lives, and it still speaks English/SEO-ese instead of business language. | `SEO-заголовок`, `Заголовок для соцсетей`, `Название бренда`, `Адрес страницы`, `Вариант кнопки`, `Что входит в услугу`, `Какие задачи решаем`, `Объем работ`, `Текст кнопки по умолчанию`, `Сохранить черновик`, `Отправить на проверку` | `components/admin/EntityEditorForm.js:13`; `components/admin/EntityEditorForm.js:32`; `components/admin/EntityEditorForm.js:112`; `components/admin/EntityEditorForm.js:235`; `components/admin/EntityEditorForm.js:247`; `components/admin/EntityEditorForm.js:256`; `components/admin/EntityEditorForm.js:260`; `components/admin/EntityEditorForm.js:298`; `components/admin/EntityEditorForm.js:351`; `components/admin/EntityEditorForm.js:364`; `components/admin/EntityEditorForm.js:371`; `lib/content-core/diff.js:4`; `lib/content-core/diff.js:11`; `lib/content-core/diff.js:14`; `lib/content-core/diff.js:28` |
| F-008 | Shared picker widgets | `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`, `lib/admin/entity-ui.js` | `Search`, `Filter by title`, `No matching items.`, `No matching media assets.`, `No preview`, `Untitled asset`, `Where used`, `published usage visible after relation save` | English helper copy | medium | Shared widgets are reused everywhere, so one bad label multiplies across admin flows. The tone is also cold and placeholder-like. | `Поиск`, `Фильтр по названию`, `Ничего не найдено`, `Подходящих медиафайлов нет`, `Нет предпросмотра`, `Без названия`, `Где используется`, `Покажем после сохранения связи` | `components/admin/FilterableChecklist.js:13`; `components/admin/FilterableChecklist.js:34`; `components/admin/FilterableChecklist.js:40`; `components/admin/MediaPicker.js:33`; `components/admin/MediaPicker.js:39`; `components/admin/MediaPicker.js:44`; `components/admin/MediaPicker.js:59`; `components/admin/MediaPicker.js:63`; `components/admin/MediaPicker.js:65`; `lib/admin/entity-ui.js:8`; `lib/admin/entity-ui.js:16`; `lib/admin/entity-ui.js:51`; `lib/admin/entity-ui.js:57`; `lib/admin/entity-ui.js:60` |
| F-009 | Readiness copy | `lib/content-ops/readiness.js`, `components/admin/ReadinessPanel.js`, `app/admin/(console)/revisions/[revisionId]/publish/page.js` | `Public brand name is required.`, `proof path`, `renderable`, `blocking issues`, `Blocking checks remain.`, `Ready with warnings.`, `Ready.`, `Blocking`, `Warnings`, `Info` | Technical/admin-speak | high | Readiness is a user-facing gate, but its wording sounds like a validator log. It explains the machine state, not the next human step. | `Требуется название бренда`, `нужен подтверждающий материал`, `предпросмотр доступен`, `есть блокирующие замечания`, `Проверки не пройдены`, `Готово с предупреждениями`, `Готово`, `Блокирующие`, `Предупреждения`, `Подсказки` | `lib/content-ops/readiness.js:69`; `lib/content-ops/readiness.js:95`; `lib/content-ops/readiness.js:155`; `lib/content-ops/readiness.js:327`; `lib/content-ops/readiness.js:329`; `lib/content-ops/readiness.js:330`; `components/admin/ReadinessPanel.js:3`; `components/admin/ReadinessPanel.js:18`; `components/admin/ReadinessPanel.js:19`; `components/admin/ReadinessPanel.js:20`; `components/admin/ReadinessPanel.js:25`; `components/admin/ReadinessPanel.js:35`; `components/admin/ReadinessPanel.js:45`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:25`; `app/admin/(console)/revisions/[revisionId]/publish/page.js:34` |
| F-010 | Feedback / redirects | `lib/admin/operation-feedback.js`, `app/api/admin/*` route handlers, `app/admin/*` query-message consumers | garbled Russian in `operation-feedback`, plus `Invalid credentials`, `Logged out`, `Submitted for review`, `Owner action saved`, `Published`, `Rollback executed`, `Obligation completed`, `User created`, `User updated`, `Choose a file`, `Media uploaded` | Encoding + English feedback | critical | This layer feeds banners and error blocks. Сейчас часть текста выглядит как mojibake, а часть остаётся английской, so the user gets either unreadable or foreign feedback. | Proper UTF-8 Russian messages only: `Неверный логин или пароль`, `Вы вышли из системы`, `Отправлено на проверку`, `Решение владельца сохранено`, `Опубликовано`, `Откат выполнен`, `Обязательство выполнено`, `Пользователь создан`, `Пользователь обновлён`, `Выберите файл`, `Медиафайл загружен` | `lib/admin/operation-feedback.js:6`; `lib/admin/operation-feedback.js:7`; `lib/admin/operation-feedback.js:8`; `lib/admin/operation-feedback.js:10`; `lib/admin/operation-feedback.js:11`; `lib/admin/operation-feedback.js:14`; `lib/admin/operation-feedback.js:15`; `lib/admin/operation-feedback.js:19`; `lib/admin/operation-feedback.js:24`; `app/api/admin/login/route.js:12`; `app/api/admin/logout/route.js:6`; `app/api/admin/revisions/[revisionId]/submit/route.js:25`; `app/api/admin/revisions/[revisionId]/owner-action/route.js:31`; `app/api/admin/revisions/[revisionId]/publish/route.js:25`; `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js:30`; `app/api/admin/obligations/[obligationId]/complete/route.js:24`; `app/api/admin/users/create/route.js:45`; `app/api/admin/users/[userId]/toggle/route.js:36`; `app/api/admin/media/upload/route.js:30`; `app/api/admin/media/upload/route.js:62` |
| F-011 | Workflow audit / timeline | `lib/content-ops/workflow.js`, `lib/content-core/service.js`, `components/admin/TimelineList.js`, `lib/content-core/content-types.js` | `Revision submitted for review.`, `Preview for candidate state was unavailable.`, `Revision entered owner review lane.`, `Business Owner approved the revision.`, `Publish was blocked by readiness checks.`, `Revision was published.`, `Draft revision created.`, `Draft revision updated.`, raw `eventKey` | English system narration | high | Audit and timeline copy is the story the admin sees after actions. Right now it tells the story in English and with internal event keys. | `Черновик отправлен на проверку`, `Предпросмотр кандидата недоступен`, `Запущено согласование владельца`, `Владелец одобрил версию`, `Публикация заблокирована проверками`, `Версия опубликована`, `Черновик создан`, `Черновик обновлён`, with mapped event labels | `lib/content-ops/workflow.js:66`; `lib/content-ops/workflow.js:79`; `lib/content-ops/workflow.js:92`; `lib/content-ops/workflow.js:129`; `lib/content-ops/workflow.js:191`; `lib/content-ops/workflow.js:263`; `lib/content-core/service.js:96`; `components/admin/TimelineList.js:17`; `components/admin/TimelineList.js:18`; `lib/content-core/content-types.js:43` |
| F-012 | Security bootstrap | `app/admin/bootstrap/superadmin/page.js`, `lib/auth/superadmin-bootstrap.js`, `app/api/admin/bootstrap/superadmin/route.js` | `Security bootstrap`, `Bootstrap superadmin credentials`, `Bootstrap authority token`, `Confirmation`, `I understand the password will be shown once.`, `One-time secure reveal`, `Target login`, `Trace ID` | English security/ops UI | high | This flow is operator-only, but it is still an app surface. It should be Russian and calmer, because it is already a high-stakes operation. | `Безопасная инициализация`, `Инициализация учётки суперадмина`, `Токен инициализации`, `Подтверждение`, `Я понимаю, что пароль будет показан только один раз.`, `Одноразовый безопасный показ`, `Логин цели`, `Идентификатор трассировки` | `app/admin/bootstrap/superadmin/page.js:5`; `app/admin/bootstrap/superadmin/page.js:19`; `app/admin/bootstrap/superadmin/page.js:20`; `app/admin/bootstrap/superadmin/page.js:33`; `app/admin/bootstrap/superadmin/page.js:40`; `app/admin/bootstrap/superadmin/page.js:44`; `lib/auth/superadmin-bootstrap.js:226`; `lib/auth/superadmin-bootstrap.js:227`; `lib/auth/superadmin-bootstrap.js:228`; `lib/auth/superadmin-bootstrap.js:230`; `lib/auth/superadmin-bootstrap.js:233`; `lib/auth/superadmin-bootstrap.js:234`; `app/api/admin/bootstrap/superadmin/route.js:55` |
| F-013 | Localization discipline | `lib/content-core/content-types.js`, `lib/content-core/repository.js`, `lib/admin/entity-ui.js`, `lib/content-core/diff.js`, `lib/content-ops/readiness.js`, `lib/content-ops/workflow.js`, `lib/admin/operation-feedback.js`, `components/admin/*` | raw enums and mixed labels across `state`, `previewStatus`, `ownerApprovalStatus`, `changeClass`, `eventKey`, `slug`, `asset`, `review`, `publish` | Missing centralized copy layer | critical | The same concept is rendered from many layers with no single Russian source of truth. That is why English, raw keys and admin-speak keep reappearing. | A small RU copy/messages layer with explicit mappers for `entityType`, `revision state`, `previewStatus`, `ownerApprovalStatus`, `changeClass`, `audit event`, `role`, and `publish obligation` | `lib/content-core/content-types.js:1`; `lib/content-core/content-types.js:34`; `lib/content-core/content-types.js:43`; `lib/content-core/repository.js:32`; `lib/content-core/repository.js:35`; `lib/content-core/repository.js:39`; `lib/content-core/repository.js:397`; `lib/content-core/repository.js:446`; `lib/admin/entity-ui.js:8`; `lib/content-core/diff.js:4`; `lib/content-ops/readiness.js:12`; `lib/content-ops/workflow.js:31`; `lib/admin/operation-feedback.js:6`; `components/admin/EntityEditorForm.js:13`; `components/admin/ReadinessPanel.js:3`; `components/admin/RevisionDiffPanel.js:3`; `components/admin/TimelineList.js:3` |
| D-001 | Docs canon | `docs/product-ux/*` | `write-side`, `read-side`, `Draft -> Review -> Published`, `Service`, `Case / Project`, `Public AI chat`, `SEO Manager`, `Superadmin`, `publish`, `rollback` | Mixed RU/EN implementation canon | medium | The docs are not end-user copy, but they are the current source of vocabulary. They still mix Russian prose with English canon and code-first naming. | Add a canonical Russian glossary, a short forbidden-terms list, and one source-of-truth mapping table for UI terms | `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`; `docs/product-ux/PRD_Экостройконтинент_v0.3.md`; `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md` |

## 4. Terminology canon draft

| Current / English | Canonical Russian | Short label | Note / context | Prohibited or undesirable variants |
|---|---|---|---|---|
| `draft` | Черновик | Черновик | Revision state for work-in-progress content. | `draft`, `draft state`, `черновая версия` where a stable noun is needed. |
| `review` | Проверка | Проверка | Editorial review lane. | `review`, `ревью` in user-facing copy. |
| `published` | Опубликовано | Опубликовано | Live/public state. | `published`, `лайв`, `live`. |
| `publish` | Опубликовать / Публикация | Опубликовать | User action / button. | `publish`, `publication` as button label. |
| `rollback` | Откатить | Откат | Return to a previous published revision. | `rollback` in visible copy. |
| `preview` | Предпросмотр | Предпросмотр | Rendered candidate state. | `preview` alone, `renderable preview` in user copy. |
| `readiness` | Проверка готовности | Готовность | Gate before review/publish. | `readiness` as a raw noun in UI. |
| `blocking issue` | Блокирующее замечание | Блокер | Something that stops publish/review. | `blocking issues` untranslated. |
| `owner review` | Согласование владельца | Согласование | Approval by Business Owner. | `owner review` in user-facing labels. |
| `Business Owner` | Владелец бизнеса | Владелец | Role label. | `owner` alone when role context matters. |
| `Service` | Услуга | Услуга | Public/admin entity. | `service` in visible Russian UI unless it is a code key. |
| `Case` | Кейс | Кейс | Public/admin entity. | `case` in visible Russian UI. |
| `Page` | Страница | Страница | Standalone page. | `page` as a visible noun. |
| `Media asset` | Медиафайл | Медиа | Media object / picker item. | `asset` without explanation. |
| `Gallery` | Галерея | Галерея | Ordered media collection. | `gallery` in user-facing Russian labels is okay only if translated. |
| `slug` | Короткий адрес | Адрес | SEO / route field. | `slug` in labels shown to non-technical users. |
| `H1` | Основной заголовок (H1) | H1 | Technical SEO field. | `H1` without context for non-technical users. |
| `Summary` | Краткое описание | Кратко | Short description field. | `summary` as a visible label. |
| `CTA` | Призыв к действию | Кнопка | Marketing/button text. | `CTA` by itself for non-technical users. |
| `Service scope` | Что входит в услугу | Что входит | User-facing scope description. | `service scope` in visible copy. |
| `Work scope` | Объем работ | Объем работ | Case/project description. | `work scope` in visible copy. |
| `Problems solved` | Какие задачи решаем | Задачи | Service benefit field. | `problems solved` as a visible label. |
| `OpenGraph` | Превью для соцсетей | Для соцсетей | Social preview metadata. | `OpenGraph` without explanation in user copy. |
| `Meta title` | SEO-заголовок | SEO-заголовок | Search metadata. | `meta title` as a visible label. |
| `Meta description` | SEO-описание | SEO-описание | Search metadata. | `meta description` as a visible label. |
| `Where used` | Где используется | Где используется | Media picker metadata. | `where used` left in English. |
| `No matching items` | Ничего не найдено | Ничего не найдено | Empty search state. | `no matching items` in Russian UI. |
| `Open` | Открыть | Открыть | Generic action label. | `Open` in a Russian flow. |

## 5. Tone of voice / friendly UX-copy audit

- Слишком системно звучат readiness и publish flows. Пользователь видит `blocking`, `preview_renderable`, `readiness`, `publish blocked`, а не короткое объяснение: что случилось и что делать дальше.
- Слишком холодно звучит audit/history слой. `Human-readable diff`, `Timeline is empty`, `AI involved` и raw event keys читаются как разработческий лог.
- Слишком технично звучат SEO и entity labels. `Slug`, `H1`, `OpenGraph`, `asset`, `preview`, `service scope` можно оставить как внутренние термины, но в UI их лучше объяснять по-русски.
- Не хватает следующего шага в empty/error states. Многим экранам нужен формат `что не так + как исправить + куда нажать`.
- Деструктивные действия в целом понятны, но им не хватает мягкости. `Откатить`, `Вернуть`, `Отклонить` нормальны, но рядом нужен короткий пояснитель, чтобы пользователь не боялся нажать.
- Public web звучит не как живой сайт, а как витрина CMS. Для business owner это снижает доверие: вместо спокойного, понятного сайта он видит набор внутренних терминов.

## 6. Priority plan

### Wave 1 — быстрые правки с максимальным эффектом

1. Перевести public web list/detail strings и defaults.
2. Исправить layout metadata на русском.
3. Перевести bootstrap superadmin page.
4. Починить `operation-feedback` и все query-message banners.
5. Заменить `Search / Filter / No preview / Open` в shared widgets.

### Wave 2 — унификация терминологии и статусов

1. Ввести canonical Russian glossary для `draft`, `review`, `publish`, `rollback`, `preview`, `readiness`, `owner review`, `slug`, `asset`, `CTA`.
2. Добавить label mappers для `revision.state`, `previewStatus`, `ownerApprovalStatus`, `changeClass`, `eventKey`, `obligationType`, `role`.
3. Перевести admin dashboard, review, publish, history, timeline и diff views на одни и те же термины.

### Wave 3 — системная локализационная чистка и вынос строк

1. Вынести hardcoded strings из `components/admin/*`, `components/public/*`, `lib/content-core/*`, `lib/content-ops/*`, `lib/admin/*`.
2. Разделить copy по поверхностям: `public`, `admin`, `system`, `dev-only`.
3. Оставить raw keys в данных, но никогда не рендерить их напрямую.
4. Разнести validation/help/error messages по словарям, а не держать их в route handlers и helper-ах.

### Wave 4 — polishing / consistency / QA

1. Пройтись по docs/product-ux и зафиксировать canonical glossary.
2. Проверить, что одинаковые термины звучат одинаково в public и admin.
3. Прогнать screenshot/text QA по ключевым сценариям.
4. Убедиться, что dev-only scripts и seed fixtures не смешиваются с main UI copy.

## 7. Implementation recommendations

- Завести лёгкий RU copy слой, а не полноценную платформу i18n. Для phase 1 достаточно одного набора словарей и helper-ов.
- Разделить словари по типам текста:
  - `public.copy`
  - `admin.copy`
  - `system.messages`
  - `status.labels`
  - `validation.messages`
  - `terminology.glossary`
- Использовать helper-ы для маппинга raw keys в человекочитаемые labels. Не рендерить `state`, `eventKey`, `previewStatus`, `ownerApprovalStatus`, `changeClass` и `obligationType` напрямую.
- Перевести `operation-feedback` с regex-match по тексту ошибки на map by code, где это возможно. Сейчас слишком много логики завязано на raw English messages.
- Для public page defaults и CMS-generated blocks держать русский канон в `lib/content-core/pure.js`, чтобы пустые поля не возвращали English fallback.
- Для admin forms оставлять технические поля только там, где это реально нужно. Если поле профессиональное, давать короткое русское объяснение в label или helper text.
- Не менять domain boundaries и route structure. Терминологическая чистка здесь не требует архитектурного расползания.

## 8. Appendices

### Appendix A — найденные English / mixed surfaces

- Public: `app/services/page.js`, `app/cases/page.js`, `components/public/PublicRenderers.js`, `lib/content-core/pure.js`.
- Admin shell and workflows: `app/admin/(console)/page.js`, `app/admin/(console)/review/page.js`, `app/admin/(console)/review/[revisionId]/page.js`, `app/admin/(console)/entities/[entityType]/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`, `app/admin/(console)/revisions/[revisionId]/publish/page.js`.
- Shared widgets: `components/admin/EntityEditorForm.js`, `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`, `components/admin/ReadinessPanel.js`, `components/admin/RevisionDiffPanel.js`, `components/admin/TimelineList.js`.
- Copy / feedback layer: `lib/admin/operation-feedback.js`, `lib/content-ops/readiness.js`, `lib/content-ops/workflow.js`, `lib/content-core/diff.js`, `lib/content-core/service.js`, `lib/admin/entity-ui.js`.
- Security bootstrap: `app/admin/bootstrap/superadmin/page.js`, `lib/auth/superadmin-bootstrap.js`.
- Metadata: `app/layout.js`, `app/admin/layout.js`.

### Appendix B — mixed RU/EN places

- `review`, `preview`, `readiness`, `approval`, `first slice` in `app/admin/(console)/page.js`.
- `Approval владельца`, `not required`, raw `previewStatus` in `app/admin/(console)/review/page.js`.
- `База preview`, `Readiness для проверки`, `AI involved`, `Human-readable diff` in history/review detail.
- `Сохранить черновик`, `Отправить на review`, `Готовность к публикации`, `Audit timeline` in `components/admin/EntityEditorForm.js`.
- `Security bootstrap`, `Bootstrap authority token`, `One-time secure reveal` in bootstrap surface.

### Appendix C — сложные / неюзерфрендли русские тексты

- `Сейчас ничего не требует вашего действия.`
- `Сейчас ничто не ждёт другую роль.`
- `Проверьте readiness и preview, затем ждите решения owner, если оно требуется.`
- `Публикация недоступна, пока не закрыты blocking issues.`
- `Контакты ещё не подтверждены.` is acceptable, but it should explain what to do next if shown to a business owner.

### Appendix D — where localization discipline is missing

- Hardcoded user copy lives in `components/admin/*`, `components/public/*`, and route handlers instead of one copy layer.
- Raw status keys are rendered in UI (`state`, `eventKey`, `previewStatus`, `ownerApprovalStatus`, `changeClass`).
- Validation and feedback strings are split across `readiness`, `workflow`, `operation-feedback`, and API routes.
- The same term is translated differently across screens: `review`, `approval`, `check`, `preview`, `readiness`, `publish`.
- Docs/product-ux already act as a canonical vocabulary source, but they are not yet paired with a practical Russian glossary for UI copy.

### Appendix E — dev-only / excluded surfaces

- `scripts/proof-admin-first-slice.mjs`
- `scripts/proof-seo-surface.mjs`
- `scripts/proof-contacts-hard-stop.mjs`
- `scripts/seed-data.mjs`

These files contain English fixture text and internal probe wording. They are useful to keep separate, but they are not part of the main user-facing contour and should not be treated as public UI copy.
