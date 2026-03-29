# Повторный фронт-аудит admin UX для SEO/content operations

Дата: 2026-03-29  
Тип: `audit` / `implementation truth` / `docs-vs-code` / `frontend-focused`

## 1. Executive summary

Текущее состояние admin frontend можно описать так:

- как рабочая база для SEO/content operations он уже годится;
- как комфортный, операторски понятный cockpit для SEO-специалиста он еще не идеален;
- как page builder он и не должен развиваться в этом эпике, и это правильно;
- как launch-site-аудит этот документ не задумывался, и это сознательное ограничение scope.

Самые сильные части:

- роль-aware shell и понятная административная грамматика;
- review/publish/history flow с diff, preview и rollback;
- media workspace, который уже похож на мини-DAM и реально помогает в работе;
- readiness panel, который честно показывает blockers/warnings/info;
- entity editor для `service` и `case`, где уже есть связи, media и SEO truth.

Самые заметные UX-проблемы:

- SEO truth спрятана в generic editor flow, а не оформлена как явный операторский режим;
- связи между сущностями работают, но ощущаются как checklist-админка, а не как удобный relation cockpit;
- launch-core inventory и evidence register как отдельная фронтовая поверхность пока не существуют;
- readiness-visible, но не always action-linked: оператор видит проблему, но не всегда получает прямой путь к ее исправлению.

Общий вывод:

**Текущий admin frontend уже является хорошей основой для content operations, но еще не дотягивает до уровня truly comfortable SEO/content operator tool.**

## 2. Audit scope

### Что я прочитал

Промпт-нейминг в вашем задании частично переименован в репозитории, поэтому я свел его к фактическим canonical docs:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_UI_Implementation_Conventions_First_Slice_Экостройконтинент_v0.1.md`
- `docs/product-ux/Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Test_Matrix_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Test_Support_API_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
- `docs/product-ux/Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md`
- `docs/reports/2026-03-29/PRD_vs_Code_Audit_Экостройконтинент_v0.1.report.md`

### Что я проверил в коде

- `app/admin/(console)/page.js`
- `app/admin/(console)/review/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js`
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`
- `app/admin/(console)/users/page.js`
- `components/admin/AdminShell.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/FilterableChecklist.js`
- `components/admin/MediaPicker.js`
- `components/admin/MediaGalleryWorkspace.js`
- `components/admin/MediaCollectionOverlay.js`
- `components/admin/MediaImageEditorPanel.js`
- `components/admin/ReadinessPanel.js`
- `components/admin/SurfacePacket.js`
- `components/admin/TimelineList.js`
- `lib/admin/entity-ui.js`
- `lib/content-ops/readiness.js`
- `lib/content-ops/workflow.js`
- `lib/content-core/service.js`
- `lib/content-core/schemas.js`
- `lib/read-side/public-content.js`

### Чего я сознательно не оценивал

- красоту интерфейса ради красоты;
- public launch-site как целое;
- page builder / visual composition tooling;
- broad SEO indexing strategy на стороне публичного сайта;
- multi-region rollout, broad analytics и другие explicitly deferred темы;
- later-slice content types как `blog`, `FAQ`, `review/testimonial` в качестве текущего обязательного фронтового scope.

## 3. Canon vs actual focus

### Релевантный канон для этого аудита

В этом эпике релевантен не "сайт вообще", а именно:

- content operations admin console;
- SEO/content operator workflow;
- entity creation / editing / linking;
- media as content asset;
- review / publish readiness;
- launch content inventory and evidence collection.

### Что low priority и не должно считаться missing feature

- page builder;
- visual block composer;
- сложная верстка публичных страниц;
- public chat / calculator / advanced lead-gen toys;
- broad analytics platform;
- later-slice сущности, если они сознательно вынесены из first slice;
- extra dashboards, которые не помогают оператору завести и связать правильные данные быстрее.

### Какой вывод из canon для frontend

Frontend должен помогать оператору думать в терминах:

- что создать;
- что связать;
- что еще не хватает;
- что блокирует review/publish;
- что уже готово к выпуску;
- где лежит доказательная база.

Он не должен заставлять SEO-специалиста помнить внутреннюю схему и архитектуру.

## 4. Persona-based view: SEO/content operator

SEO/content operator в этой системе обычно делает не "дизайн", а последовательную операционную работу:

1. заводит новую сущность `service`, `case`, `page`, `global_settings`, `media_asset` или `gallery`;
2. заполняет базовые поля;
3. добавляет SEO truth и фактологию;
4. привязывает связанные сущности;
5. подтягивает media;
6. проверяет readiness;
7. отправляет draft на review;
8. читает замечания;
9. исправляет материал;
10. доводит версию до publish-ready;
11. при необходимости возвращается по истории и делает rollback.

Для такого пользователя хороший UI - это не "красивый редактор", а:

- понятные поля;
- понятные связи;
- понятные блокеры;
- понятное состояние готовности;
- понятный следующий шаг;
- минимум прыжков между экранами.

## 5. Admin frontend surface map

| Surface | Назначение | Workflow step | Maturity | Notes |
| --- | --- | --- | --- | --- |
| `/admin` | роль-aware стартовая панель | triage / next action | 4 | хороший task cockpit, но он пока больше про queue, чем про launch inventory |
| `/admin/review` | очередь проверок | review routing | 4 | ясно показывает, что ждет владельца и что ждет редакцию |
| `/admin/review/[revisionId]` | review detail + diff + preview | review / owner decision | 4 | сильная поверхность: diff, readiness, preview, owner actions в одном месте |
| `/admin/revisions/[revisionId]/publish` | финальная проверка перед выпуском | publish gate | 4 | publish disabled при blocking, side effects объяснены |
| `/admin/entities/[type]` | список сущностей | locate / open / create | 3 | работает, но не дает launch-core coverage view по умолчанию |
| `/admin/entities/[type]/new` | создание сущности | create | 3 | простой и понятный вход, но без guided setup |
| `/admin/entities/[type]/[id]` | detail editor | edit / link / readiness | 3 | сильный core editor, но SEO truth и relations все еще требуют усилия |
| `/admin/entities/[type]/[id]/history` | версии и rollback | audit / rollback | 4 | хороший history loop, это уже рабочий инструмент |
| `/admin/entities/media_asset` | media workspace | upload / inspect / edit | 4 | одна из лучших поверхностей во всем admin |
| gallery mode внутри media workspace | collection management | link / organize media | 4 | gallery не живет отдельным тяжелым экраном и это полезно |
| `/admin/users` | управление ролями | support/admin sidecar | 3 | рабочая, но не core content-ops surface |

## 6. Entity operations audit

### `global_settings`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| public truth for brand, contacts, service area, default CTA, SEO baseline | единая карточка настроек с контактной truth и значимыми бизнес-полями | 3 | поля полезные, но hidden SEO и контактная truth не оформлены как отдельный операторский сценарий |

Что хорошо:

- это действительно единый источник публичной бизнес-правды;
- readiness связывает контакты с реальной публикацией;
- карточка не перегружена визуально.

Что неудобно:

- оператору не очевидно, что это фактически "launch truth" для всего сайта;
- SEO-составляющая спрятана среди generic полей;
- нет наглядного "что сломается, если я это поменяю".

### `service`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| canonical route-owning content object для money pages, с SEO, proof и relations | slug, title, H1, CTA, summary, scope, problems, methods, related cases, galleries, primary media, hidden SEO, readiness, audit | 4 | checklist relations и hidden SEO пока требуют лишнего когнитивного шага |

Это лучшая SEO/content-ops сущность в текущем фронте.

Почему:

- поля читаются в правильном порядке;
- есть связи на кейсы и media;
- есть понятная readiness-грамматика;
- есть history.

Что мешает:

- SEO truth не выделена визуально;
- relation selection выглядит как список флажков, а не как дружелюбный relation cockpit;
- нет явного блока "вот почему эта услуга пока не готова".

### `case`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| proof-led project object с фактологией и медиа | slug, title, location, projectType, task, workScope, result, services, galleries, primary media, hidden SEO, readiness | 4 | тип проекта берется из datalist, proof flow не совсем объяснен явно |

Что хорошо:

- структура кейса хорошо совпадает с реальной контент-работой;
- видно, что тут важны объект, результат и связь с услугами;
- media и gallery действительно встроены.

Что неудобно:

- `projectType` как datalist выглядит скорее как компромисс, чем как полноценная taxonomy UX;
- не хватает наглядного блока "доказательства" и "что надо добавить".

### `page`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| standalone pages вроде about/contacts, без page-builder театра | pageType limited to `about` / `contacts`, title, H1, intro, body, contact note, CTA, linked services/cases/galleries/media | 3 | блоки скрыты за простой формой, что хорошо для first slice, но не очень прозрачно для контент-оператора |

Что хорошо:

- это не page builder и не пытается им быть;
- оператор не тонет в блок-канве;
- для `about` и `contacts` этого достаточно.

Что неудобно:

- model-to-UI mapping не очень очевиден;
- блоковая структура не видна как first-class concept;
- если в будущем страниц станет больше, этот экран начнет просить более явную контентную грамматику.

### `media_asset`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| first-class media asset with metadata, lifecycle, relations, safe editing | полноценный media workspace, inspector, usage, collections, archive/restore, upload, edit overlay, crop/rotate/flip/reset | 4 | сложность UX растет, но это уже профессиональная сложность, а не отсутствие функциональности |

Это один из лучших экранов в админке.

Сильные стороны:

- поиск, фильтры, сортировка, счетчики;
- orphan / used / broken / archived сигналы;
- inspector с usage и коллекциями;
- drag-and-drop upload;
- image editing прямо в overlay;
- контекст не теряется даже при фильтрации;
- V1 ограничен image-only, и это честно написано в UI.

### `gallery`

| Что хотел канон | Что есть во frontend | UX-оценка | Friction |
| --- | --- | --- | --- |
| collection / grouping surface для media | коллекции редактируются внутри media workspace, assetIds + primaryAssetId + SEO metadata | 4 | коллекция тяжелее, чем базовый SEO-операторский сценарий, но интеграция сделана хорошо |

Что хорошо:

- gallery не утащен в отдельный остров;
- коллекция собирается из уже загруженных ассетов;
- primary asset и membership редактируются в одном контексте.

Что неудобно:

- SEO metadata коллекции может быть лишней нагрузкой для простого контент-оператора;
- без знания доменной грамматики легко перепутать `gallery`, `media_asset` и collection mode.

## 7. Relationship management audit

### Что уже есть

- `FilterableChecklist` для service/case/page relations;
- `MediaPicker` для выбора уже загруженных медиа;
- `MediaCollectionOverlay` для сборки коллекций и выбора primary asset;
- `MediaInspector` с where-used / usage / collection links;
- preloaded relation options from `loadEditorPageData`.

### Что хорошо

- поиск есть;
- отношения строятся по стабильным ids;
- labels, subtitles и status meta помогают не перепутать сущности;
- media показывает usage и collections лучше, чем обычный CRUD-экран;
- контекст selected item в media не теряется при фильтрации.

### Что трется о UX

- relation UI все еще выглядит как список чекбоксов, а не как живой relation cockpit;
- нет rich chips с быстрым открытием related entity;
- нет полноценного relation summary в шапке editor;
- directionality отношений читается из полей, а не из самого UI;
- массовая работа со связями пока не первый-class сценарий.

### Оценка по основным связям

| Relation | Current UI | Verdict |
| --- | --- | --- |
| service ↔ case | searchable checklist | usable, but list-like |
| service ↔ media/gallery | checklist + media picker | good enough for first slice |
| case ↔ service/gallery/media | checklist + media picker | good enough for first slice |
| page ↔ service/case/gallery/media | same pattern, but hidden block structure adds ambiguity | partial |
| media ↔ collection | dedicated overlay + inspector | strong |

## 8. Media workflow audit

Media flow в текущем фронте - это не "склад файлов", а уже почти operational DAM-light.

### Что уже хорошо

- быстрый поиск;
- status filters;
- collection filters;
- сортировка;
- summary counters;
- pinned selected item, даже если он скрыт текущим фильтром;
- inspector with preview;
- where-used / usage summary;
- collection membership;
- archive / restore;
- drag-and-drop upload;
- modal editor with metadata/image tabs;
- local crop / rotate / flip / reset;
- keyboard navigation по карточкам.

### Что это дает SEO/content operator

- медиа не живет отдельно от контента;
- видно, где ассет используется;
- видно, не потерян ли файл;
- видно, сирота он или встроен в коллекции;
- можно быстро довести изображение до publish-ready состояния без похода в отдельный инструмент.

### Где остается friction

- overlay-depth достаточно высокая;
- create/edit flow местами кажется тяжелее, чем должен быть для простых задач;
- V1 image-only честен, но ограничивает future scope;
- collection SEO metadata и asset editing могут быть перегружены для базового оператора;
- все еще нужно помнить, где заканчивается metadata и начинается binary truth.

### Оценка

**Уровень: 4**

Это один из самых зрелых участков admin frontend.

## 9. Publish-readiness UX audit

### Что уже работает

- `ReadinessPanel` показывает `blocking`, `warning`, `info`;
- editor page держит readiness рядом с основной формой;
- publish page запрещает кнопку publish, если есть blocking;
- review detail показывает readiness, diff и preview;
- history page дает rollback;
- owner actions разделены на approve / reject / send back.

### Почему это хорошо

- оператор не узнает о проблеме слишком поздно;
- publish не выглядит как скрытая магия;
- review и publish видны как разные шаги;
- status feedback не спрятан только в toast-ах.

### Где фронт еще не достаточно помогает

- blocker messages хороши, но иногда звучат как system diagnostics, а не как task guidance;
- нет гарантированного jump-to-field UX из readiness к месту исправления;
- нет визуального "fix list" вверху editor;
- не всегда очевидно, что именно надо изменить, чтобы снять blocking.

### Оценка

**Уровень: 4 по visibility, 3 по actionability**

## 10. Workflow audit

### Сценарий 1: создать новую услугу

1. открыть `/admin/entities/service`;
2. нажать `Новый`;
3. заполнить slug/title/H1/summary/scope/CTA;
4. добавить related cases и gallery/media;
5. проверить readiness;
6. сохранить draft;
7. отправить на review.

**Вердикт:** workflow есть и понятен, но relation step все еще checklist-driven.

### Сценарий 2: связать кейс с услугой и медиа

1. открыть case editor;
2. заполнить фактуру;
3. выбрать services и media;
4. проверить preview/status;
5. сохранить;
6. послать на review.

**Вердикт:** поддерживается хорошо, но relation intent читается не мгновенно.

### Сценарий 3: пройти review loop

1. review queue;
2. review detail;
3. diff + preview;
4. owner action;
5. return to editor if needed.

**Вердикт:** очень сильный участок фронта.

### Сценарий 4: publish

1. открыть publish readiness page;
2. прочитать blockers;
3. убедиться в side effects;
4. publish.

**Вердикт:** строгий и понятный gate.

### Сценарий 5: rollback

1. открыть history;
2. выбрать опубликованную версию;
3. rollback через confirm action.

**Вердикт:** хороший safety loop.

### Главная проблема workflow

Workflow рабочий, но распределен по нескольким экранам.

Для SEO/content operator это означает:

- нужно помнить, где находится следующий шаг;
- приходится прыгать между list/detail/history/review/publish/media;
- не хватает одной общей content-ops cockpit поверхности, которая бы собрала inventory, next actions и blockers вместе.

## 11. Gaps by severity

| Severity | Gaps | Why it matters |
| --- | --- | --- |
| Critical for current priority | отсутствует явная launch-core inventory / evidence register surface; SEO truth не оформлена как отдельный видимый operator flow; readiness blockers не всегда ведут к полям | оператору трудно быстро понять, что уже собрано, чего не хватает и куда идти чинить |
| Important but not blocking | relation widgets list-based; page editor скрывает block structure; media overlay тяжеловат; projectType taxonomy выглядит полу-автоматической | friction накапливается, но не ломает работу |
| Nice-to-have | relation chips, saved filters, keyboard shortcuts, quick-open related entity links, entity list readiness badges | ускоряет рутину и снижает когнитивную нагрузку |
| Intentionally deferred / low priority | page builder, visual canvas, blog/FAQ/review/testimonial expansion, multi-locale UI, broad analytics, public launch polish | это не нужно смешивать с текущим content-ops приоритетом |

## 12. Recommendations

### Что усиливать прямо сейчас

- сделать launch-core inventory / evidence register visible surface;
- вывести SEO truth и readiness reasons на уровень, где оператор не ищет их внутри generic form;
- добавить jump links от blockers к полям;
- сохранить текущую admin shell grammar, потому что она уже работает;
- оставить media workspace как сильную опорную поверхность.

### Что добивать следующим фронтовым эпиком

- relation chips и quick-open для связанных сущностей;
- content-completeness badges в list views;
- operator-oriented dashboard cards: `what is missing`, `what is ready`, `what needs review`;
- field anchors для `service`, `case`, `page`, `global_settings`.

### Что не трогать сейчас

- page builder;
- сложную block composition систему;
- лишнюю визуальную театральность;
- broad dashboard platforms, которые не помогают контент-оператору прямо сейчас;
- public-site redesign ради красоты.

### Что не надо prematurely overengineer

- full graph-like relation editor;
- DAM enterprise масштаба;
- multi-role generalized workflow engine в frontend;
- advanced visual builder до того, как inventory и readiness станут прозрачными.

## 13. Prioritized next UI backlog

| Priority | Task | Why now |
| --- | --- | --- |
| P0 | Add a launch-core coverage panel to `/admin` with counts for services, cases, pages, media and readiness gaps. | Gives the operator a single answer to "что уже есть и чего не хватает". |
| P0 | Add jump links from `ReadinessPanel` blockers to the exact field anchors. | Turns blockers into fixable actions instead of just diagnostics. |
| P0 | Add a visible `SEO` / `truth` section in `service`, `case`, `page` and `global_settings` editors. | Makes operator-facing truth explicit instead of hidden inside generic forms. |
| P0 | Add an `evidence register` surface or drawer linked from dashboard and entity editors. | Closes the biggest gap: proof inventory is not visible as a working surface. |
| P1 | Add a single `content ops cockpit` card that merges pending drafts, review queue and launch inventory gaps. | Reduces jumping between screens and supports the actual working loop. |
| P1 | Add readiness badges to entity list rows so the operator sees missing proof immediately. | Surfaces risk earlier, before opening every detail page. |
| P1 | Add relation chips with `open related` actions for linked cases, services, galleries and media. | Makes linking feel more like navigation and less like checkbox management. |
| P1 | Add a compact `where used` summary inside `service` and `case` editors, similar to the media inspector. | Helps the operator understand impact and avoid blind edits. |
| P1 | Add empty-state guidance for new `service` / `case` / `page` drafts with concrete next actions. | Reduces first-screen hesitation for new content work. |
| P1 | Add quick-open links from relation pickers to the target entity detail page. | Preserves context during linking and reduces back-and-forth. |
| P2 | Reduce overlay depth in media by making the create/edit path slightly more linear. | Good optimization, but not blocking current workflow. |
| P2 | Add saved filters or quick presets in entity lists and media workspace. | Speeds up repeat operations without changing core UX. |
| P2 | Add a more operator-friendly explanation of `projectType`, `canonicalIntent`, `indexationFlag` and related SEO fields. | Useful, but only after visibility and navigation gaps are fixed. |
| P2 | Add a compact publish-readiness summary on the editor top rail, not only in the sticky side panel. | Nice refinement once the main operator loop is easier to navigate. |

## Final verdict

Если смотреть строго глазами SEO/content operator, то:

- admin frontend уже умеет основную работу;
- media workflow и review/publish flow уже сильные;
- entity editors для service/case/page/global settings пригодны;
- но UI еще требует слишком много внутренней схемной памяти;
- не хватает явного launch-core inventory / evidence surface;
- SEO truth и readiness должны быть более action-oriented.

**Текущий frontend - хорошая база, но еще не окончательно удобный инструмент контент-оператора.**
