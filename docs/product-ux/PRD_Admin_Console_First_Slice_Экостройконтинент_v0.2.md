# PRD Admin Console First Slice

Проект: «Экостройконтинент»  
Версия: v0.2  
Статус: derived product and operations PRD for phase-1 admin console  
Основание: `PRD_Экостройконтинент_v0.3.1.md`, `03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`, `01_Project_Truth_and_Current_Phase_Экостройконтинент.md`, `02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`, `04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`, `00_Context_Map_Экостройконтинент.md`

## Canonical truths extracted from sources

### Что уже зафиксировано

- Phase 1 для проекта остается narrow launch-core, а не широкой платформой.
- Текущая стадия проекта: pre-launch execution / evidence collection.
- Public Web уже зафиксирован как published read-side surface.
- Admin Console уже зафиксирован как write-side tool для content operations.
- `Content Core` в SQL уже зафиксирован как source of truth для сущностей, связей, статусов и published revisions.
- `Publish` уже зафиксирован как явная доменная операция, а не простой status flip.
- `MediaAsset` уже зафиксирован как first-class entity; `Gallery` остается lightweight ordered grouping.
- Бинарные media assets живут в S3-compatible storage; публичная раздача идет через CDN.
- Каноническая content model уже зафиксирована: `Page`, `Service`, `Case`, `Article`, `FAQ Item`, `Review / Testimonial`, `Global Settings`, supporting entities `MediaAsset`, `Gallery`.
- Структурированный контент и typed blocks уже зафиксированы как базовая модель; произвольный page-builder или custom blob model не являются каноном.
- `Service`, `Case`, `Article` уже зафиксированы как route-owning entities; `Page` не должен становиться вторым owner для их route truth.
- AI уже зафиксирован как assistive only: не source of truth, не route owner, не autonomous publisher.
- Modular monolith already acceptable; premature microservices are not required.

### Что нельзя переоткрывать

- Нельзя превращать admin console в visual page builder, no-code CMS-комбайн или enterprise DAM.
- Нельзя переносить operational truth в frontend templates, hardcoded URLs или ручные live edits.
- Нельзя публиковать drafts напрямую в public read-side.
- Нельзя делать slug change у опубликованной сущности тихой правкой без redirect / revalidation / sitemap obligations.
- Нельзя расширять phase 1 до public AI chat, calculator, broad multi-region rollout, CRM-lite или analytics-heavy платформы.
- Нельзя подменять owner review AI-автоматикой или общей editorial flow без явных правил.

### Какие рамки этот PRD принимает из источников

- Админка проектируется как content operations console для малой команды.
- First slice покрывает только `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page`.
- Early-next slice покрывает `FAQ`, `Review`, `Article`.
- Launch scope сайта, который админка должна обслужить в first slice: `/services`, `/cases`, `/blog`, `/about`, `/contacts` и proof-led core вокруг нескольких сильных services и priority cases.
- В phase 1 действует минимальный lifecycle `Draft -> Review -> Published`, но с revision discipline и explicit publish.
- Owner review обязателен для ключевых коммерческих и claims-heavy материалов; Business Owner already fixed as review authority.
- RU-only operational behavior на первом срезе допустим и соответствует текущей фазе.

### Какие реальные open questions остались

- Подтверждение финального public contact truth: основной телефон, messengers, optional public email, точная CTA wording.
- Подтверждение одного primary launch region / service area.
- Подтверждение финального launch service core и того, остается ли «строительство гостевых домов» в phase 1.
- Подтверждение 2-3 priority cases и списка flagship cases.
- Подтверждение owner-approved claim boundaries по срокам, стоимости, гарантиям и чувствительным коммерческим обещаниям.
- Infra-dependent вопрос: точная реализация side effects publish operation для redirect storage, cache revalidation, sitemap refresh и delivery hooks.

## Purpose and scope of admin console

Admin Console first slice нужен как честный content operations tool для phase-1 launch-core проекта «Экостройконтинент». Его задача не в том, чтобы “строить сайт мышкой”, а в том, чтобы помочь малой команде создавать, связывать, проверять, утверждать и публиковать структурированный контент с понятной revision discipline и forensic traceability.

В first slice админка должна:

- позволять вести канонические content entities, нужные для launch-core;
- поддерживать media operations на базовом, но честном уровне;
- давать SEO Manager рабочую среду для подготовки контента и SEO-полей;
- давать Business Owner отдельную owner review surface для быстрых и понятных решений;
- давать Superadmin контроль над publish, rollback, пользователями и audit trails;
- гарантировать, что published read-side потребляет только validated published revisions.

Этот PRD намеренно остается узким и operationally grounded. Он описывает admin console как инструмент content operations для запуска, а не как универсальную CMS-платформу будущего.

## Non-goals / anti-scope

- Не visual page builder.
- Не no-code layout composer с произвольным canvas editing.
- Не enterprise DAM с правами на asset collections, advanced transformations и media workflows.
- Не общий PRD публичного сайта.
- Не infra blueprint, не DB schema spec и не API contract.
- Не workflow engine с множеством кастомных состояний, SLA и сложной оркестрацией.
- Не SEO dashboard platform.
- Не CRM, не lead-management suite и не analytics stack.
- Не AI-autonomous editing or publishing system.
- Не multilingual authoring suite beyond RU-first operational behavior.

## Canon assumptions carried into this PRD

- `Content Core` in SQL остается единственным operational source of truth.
- Public site не хранит и не редактирует editorial truth.
- Route truth живет в route-owning entities, а не в page shells.
- Published read-side строится только из validated published revisions.
- Structured entities, typed blocks, stable refs и media IDs обязательны; raw media URLs не являются source of truth.
- AI может предлагать drafts, rewrites, SEO suggestions и alt text, но не утверждает и не публикует.
- Human review остается центром процесса, особенно там, где есть claims, positioning и чувствительные public promises.

## Operational definitions

### `claims-heavy`

Изменение или материал считается `claims-heavy`, если он вводит или меняет публично значимые обещания, сравнения или формулировки, чувствительные для доверия и коммерческого смысла. Типовые признаки:

- сроки;
- стоимость или pricing logic;
- гарантии;
- superiority claims;
- обещания результата;
- чувствительные формулировки про scope компании.

### `flagship case`

`Flagship case` означает priority case, который используется как один из главных proof assets launch-core и заметно влияет на доверие, позиционирование или доказательную базу ключевых service pages.

### `launch-core service`

`Launch-core service` означает service entity, которая входит в подтвержденное phase-1 service ядро и является одной из основных коммерческих страниц запуска.

### `commercial presentation change`

`Commercial presentation change` означает изменение, которое меняет не только редактуру текста, а то, как публично подается ценность, scope, promise, CTA or trust meaning сущности. Сюда не относятся чисто технические SEO tweaks и minor editorial cleanup.

## User roles and permission model

### Operational actors

#### Superadmin

Superadmin отвечает за operational integrity системы. Это не просто “самый главный редактор”, а role-holder, который контролирует пользователей, publish operations, rollback и forensic visibility. В phase 1 именно Superadmin является publish authority по умолчанию.

#### SEO Manager

SEO Manager работает в editor / content operations mode. Он создает и нормализует сущности, заполняет SEO-поля, связывает контент и media, запускает AI-assistive actions, подготавливает материалы к review и устраняет readiness blockers.

#### Business Owner

Business Owner работает в owner review mode. Его роль не в повседневном редактировании CMS, а в утверждении коммерчески значимых, claims-heavy и launch-critical изменений. Owner surface должен позволять быстро понять, что именно поменялось, зачем это предлагается и что требуется решить.

### Permission matrix

| Action | Superadmin | SEO Manager | Business Owner |
| --- | --- | --- | --- |
| Login to admin console | Yes | Yes | Yes |
| View dashboard / work queue | Yes | Yes | Yes |
| Create first-slice entities | Yes | Yes | No |
| Edit draft revisions | Yes | Yes | Limited in review mode comments only |
| Edit published revision directly | No; must create new revision | No | No |
| Upload media | Yes | Yes | No |
| Edit media metadata | Yes | Yes | No |
| Link relations between entities | Yes | Yes | No |
| Submit revision to review | Yes | Yes | No |
| See review inbox | Yes | Yes | Yes, owner-filtered |
| Approve review-required revision | Optional backup | No | Yes |
| Reject / send back with comment | Yes | Yes for editorial review | Yes for owner-required review |
| Publish approved revision | Yes | `Page` only after required owner approval | No |
| Publish revision not requiring owner review | Yes | `Page` only | No |
| Roll back to previous published revision | Yes | No | No |
| Manage redirects generated by slug change | Yes | No | No |
| Manage users and roles | Yes | No | No |
| Deactivate users | Yes | No | No |
| View full audit / forensic trail | Yes | Limited entity-level visibility | Review-related visibility only |
| Use AI-assistive actions | Yes | Yes | Limited to review explanations/summaries if enabled |
| View AI involvement history | Yes | Yes | Yes for reviewed revisions |

### Permission notes

- Business Owner не должен быть вынужден редактировать сложные формы CMS, чтобы принять решение.
- SEO Manager может довести revision до reviewable состояния, но не публикует самостоятельно.
- Superadmin может выступать backup reviewer только в operational exception cases, но это не должно подменять owner review там, где оно требуется по change class.

## Operational lifecycle model

Для first slice принимается единый lifecycle для content entities и supporting entities, где это применимо:

`Draft -> Review -> Published`

### Draft

Рабочее состояние для создания, редактирования, нормализации и связывания контента. Draft может содержать AI-generated suggestions, незавершенные SEO-поля, media gaps и незакрытые readiness warnings.

### Review

Состояние reviewable revision. Это не просто “контент почти готов”, а конкретная revision candidate, у которой:

- заполнены обязательные поля;
- разрешены обязательные refs;
- есть intent of change;
- видны readiness checks;
- понятно, требуется ли owner review;
- доступен preview candidate state;
- зафиксировано, кто и зачем отправил revision на review.

### Published

Состояние active public revision. Переход возможен только через explicit publish operation после всех обязательных checks и approvals для данной change class.

### Lifecycle discipline

- У опубликованной сущности не редактируется live copy напрямую.
- Любое последующее изменение создает новую draft revision поверх published baseline.
- Review и publish должны быть понятными отдельными доменными шагами даже там, где пользовательский поток короткий.

## Revision model

First slice должен иметь минимальную, но честную revision model.

### Revision types

- `Draft revision`: текущая рабочая версия.
- `Reviewable revision`: зафиксированный candidate snapshot, отправленный на review.
- `Published revision`: конкретная revision, которую читает public read-side.

### Required revision capabilities

- История revisions по каждой сущности.
- Видимость автора, времени и intent of change для каждой revision.
- Явное сравнение reviewable revision с current published revision или с предыдущим draft baseline.
- Rollback как выбор предыдущей published revision, а не ручное переписывание.
- Возможность видеть AI involvement на уровне revision.
- Возможность видеть publish checks, которые прошли или не прошли для конкретной revision.

### Reviewable revision edit rule

Для first slice принимается следующее правило: `reviewable revision` считается frozen snapshot for decision-making.

Допускаются только non-meaningful fixes без повторной отправки на review:

- исправление опечатки;
- formatting cleanup;
- исправление очевидной технической ошибки preview metadata, не меняющей public meaning.

Любое meaningful change после отправки в review требует resubmission. К meaningful change относятся:

- изменение claims;
- изменение CTA wording;
- изменение SEO intent, влияющего на public meaning;
- изменение relations, proof basis или route truth;
- изменение `Global Settings` dependency, влияющее на то, что реально видит пользователь.

### Change comment / intent of change

При отправке на review автор revision обязан добавить короткий human-readable intent:

- что изменилось;
- почему это меняется;
- нужны ли owner decision или publish side effects.

Этот комментарий нужен не как формальность, а как часть review clarity, audit trail и future forensic reading.

### Diff visibility

Diff для first slice должен быть human-readable, а не low-level JSON comparison. Минимум:

- changed fields;
- added/removed relations;
- SEO field changes;
- CTA changes;
- slug / route changes;
- media replacement;
- readiness impact;
- AI-assisted content markers.

## Review / approval model

### Core decision

В этом PRD approval и publish разделяются как две разные операции.

### Why approval and publish are separate

- Это дает operational clarity: Business Owner утверждает business meaning, а не исполняет публикацию.
- Это улучшает forensic traceability: можно отдельно видеть, кто одобрил содержание и кто инициировал publish.
- Это снижает риск случайной live publication во время owner review.
- Это соответствует small-team posture без превращения процесса в сложный workflow engine.

### Review lanes

#### Editorial review lane

Используется для обычной content/SEO проверки и readiness контроля. В этой lane SEO Manager и Superadmin видят blockers, diff и candidate preview.

#### Owner review lane

Используется для change classes, где требуется owner authority. Именно здесь Business Owner работает в отдельном mode с review inbox, human-readable diff и action set: approve, reject, send back with comment.

### Owner review authority

Business Owner обязателен как review authority для:

- первой публикации launch service pages;
- flagship cases;
- `/about`;
- home page, если она входит в queue;
- claims-heavy wording;
- route-affecting changes на уже опубликованных коммерческих сущностях;
- global settings changes, влияющих на public business truth, service area, core CTA или contact truth.

### Owner review outcomes

- `Approve`: revision получает owner-approved marker и может быть опубликована `Superadmin`, а для `Page` также `SEO Manager`, если readiness gates пройдены.
- `Reject`: revision закрывается как неутвержденная; автор должен создать или доработать новый candidate.
- `Send back with comment`: revision возвращается в draft с owner comment, не теряя history.

### Operational review map

Эта таблица не заменяет change classes, а дает команде быстрый operational shortcut для типовых спорных случаев.

| Entity type | Change class | Owner review required? | Publish by whom? |
| --- | --- | --- | --- |
| `Service` | Minor editorial | No by default | `Superadmin` |
| `Service` | SEO-only operational | No by default | `Superadmin` |
| `Service` | Commercial presentation | Yes for launch-core services | `Superadmin` after approval |
| `Service` | Route-affecting | Yes | `Superadmin` after approval |
| `Service` | First publish | Yes | `Superadmin` after approval |
| `Case` | Minor editorial | No by default for non-flagship routine proof updates | `Superadmin` |
| `Case` | SEO-only operational | No by default for non-flagship case | `Superadmin` |
| `Case` | Commercial presentation | Yes for flagship or claims-heavy case | `Superadmin` after approval |
| `Case` | Route-affecting | Yes | `Superadmin` after approval |
| `Case` | First publish | Yes for priority or flagship case | `Superadmin` after approval |
| `Page(type=about)` | Minor editorial | Yes by default | `SEO Manager` or `Superadmin` after approval |
| `Page(type=about)` | SEO-only operational | Yes by default | `SEO Manager` or `Superadmin` after approval |
| `Page(type=about)` | Commercial presentation | Yes | `SEO Manager` or `Superadmin` after approval |
| `Page(type=about)` | Route-affecting | Yes | `SEO Manager` or `Superadmin` after approval |
| `Page(type=contacts)` | Minor editorial after confirmed contact truth | No by default | `SEO Manager` or `Superadmin` |
| `Page(type=contacts)` | SEO-only operational after confirmed contact truth | No by default | `SEO Manager` or `Superadmin` |
| `Page(type=contacts)` | Global truth change | Yes | `SEO Manager` or `Superadmin` after approval |
| `Page(type=contacts)` | First publish before confirmed contact truth | Publish blocked | No publish allowed |
| `Page(type=contacts)` | First publish after confirmed contact truth | Yes | `SEO Manager` or `Superadmin` after approval |
| `Global Settings` | Any substantive truth change | Yes | `Superadmin` after approval |

## Change classes

Change classes нужны, чтобы owner review не требовался на каждую мелочь, но и не обходился там, где меняется business meaning.

### Class A: Minor editorial change

Примеры:

- minor text edit без изменения коммерческого смысла;
- исправление опечаток;
- небольшая корректировка читаемости;
- alt text improvement;
- caption cleanup.

Owner review: не требуется по умолчанию.  
Publish authority: Superadmin после readiness checks.

### Class B: SEO-only operational change

Примеры:

- meta title update;
- meta description update;
- canonical intent refinement без route change;
- open graph adjustment;
- internal linking improvement без изменения claims.

Owner review: не требуется по умолчанию, если change не меняет public commercial promise.  
Publish authority: Superadmin.

### Class C: Commercial presentation change

Примеры:

- CTA wording change;
- rewrite of hero promise;
- substantial content rewrite on service or case page;
- change in positioning or service scope emphasis;
- new proof narrative.

Owner review: требуется для launch-core services, flagship cases и claims-sensitive pages.  
Publish authority: Superadmin only after approval when required.

### Class D: Route-affecting change

Примеры:

- slug change;
- canonical route reassignment;
- new route-owning entity publish;
- depublication of currently live route-owning entity.

Owner review: требуется для commercial and proof-led core entities.  
Publish authority: Superadmin with required side effects.

### Class E: Global truth change

Примеры:

- contacts update;
- primary region / service area change;
- default CTA change;
- organization or local business truth change in `Global Settings`.

Owner review: требуется по умолчанию.  
Publish authority: Superadmin.

### Class F: New launch-critical entity publish

Примеры:

- first publication of launch service page;
- first publication of priority case;
- first publication of `/about` or `/contacts`.

Owner review: требуется, кроме routine `/contacts` update after contact truth is already confirmed and change is minor.  
Publish authority: Superadmin.

## Publish model and readiness gates

Publish в first slice должен быть отдельным product surface и отдельной доменной операцией, которая продвигает одну validated revision в active published revision и инициирует обязательные side effects.

### Publish readiness gates

Минимальный набор publish gates:

- required fields completed;
- valid refs only;
- route uniqueness and slug validity;
- SEO basics completed: slug, H1, meta title, meta description;
- visible CTA where entity type expects it;
- minimum factual completeness;
- no unresolved critical media gaps;
- owner approval where change class requires it;
- explicit indexation intent;
- explicit note on route side effects for slug-affecting changes.

### Readiness severity model

Чтобы readiness surface оставался practically usable, каждый check должен иметь severity:

- `blocking`: publish невозможен, пока check не закрыт;
- `warning`: publish допустим, но качество или trust posture ухудшены;
- `info`: не блокирует publish и не сигнализирует о дефекте, но объясняет состояние или рекомендуемое улучшение.

### Default blocking checks

В first slice по умолчанию относятся к `blocking`:

- missing required fields;
- invalid or broken refs;
- duplicate or invalid route truth;
- missing owner approval where required;
- missing required CTA on money page;
- missing minimum factual completeness for `Service` and `Case`;
- unresolved slug-change obligations for already published route-owning entity;
- `Page(type=contacts)` without confirmed public contact truth.

### Default warning checks

В first slice по умолчанию относятся к `warning`:

- weak or incomplete SEO basics where entity is otherwise publishable;
- missing optional but desirable media metadata;
- internal linking opportunity not yet used;
- non-critical content quality gaps that do not invalidate factual truth.

### Contacts page rule

`Page(type=contacts)` имеет отдельное правило publish readiness: until public contact truth is confirmed, такая страница не считается честно publishable as conversion page.

Для `Page(type=contacts)` publish должен быть `blocked`, если не подтверждены:

- primary public phone or an explicitly approved alternative primary contact channel;
- active messenger set if messengers are presented as CTA;
- primary CTA wording;
- service area / contact wording from `Global Settings`.

После подтверждения contact truth routine updates на `contacts` могут идти по standard editorial flow только если change class остается minor or SEO-only и не меняет саму contact truth.

### Evidence-aware readiness expectations

#### Service

Не публикуется как thin promise page. Должен иметь:

- real service scope;
- CTA truth;
- как минимум один proof path: case, gallery/media, FAQ-backed factual support или другой подтверждающий связанный элемент.

#### Case

Не публикуется без:

- task;
- work scope;
- result;
- location context;
- minimum visual proof.

#### Page

Не публикуется как empty shell. Должна иметь:

- понятную page purpose;
- осмысленные blocks;
- валидные refs;
- согласованные global truth dependencies там, где они используются.

### Slug change obligations

Если меняется slug уже опубликованной сущности, publish operation обязан создать и зафиксировать obligations:

- redirect required;
- revalidation required;
- sitemap update required;
- canonical URL check required.

Точная техническая реализация этих obligations infra-dependent, но сама обязанность уже является частью product behavior.

## Entity model coverage for first slice

### Global Settings

#### Зачем нужна

`Global Settings` хранит launch-wide business truth, контакты, launch region, default SEO intent и reusable CTA truth. Это не системная “панель настроек ради настроек”, а публично значимый operational source.

#### Минимум полей и связей

- public brand name;
- legal name for requisites/trust blocks;
- primary phone;
- active messengers;
- optional public email;
- address or service area wording;
- primary launch region;
- default CTA variants;
- default SEO fields;
- organization / local business data.

#### Lifecycle и readiness

- Lifecycle: `Draft -> Review -> Published`.
- Почти все substantive changes относятся к Class E и требуют owner review.
- Readiness: значения должны быть internally consistent и пригодны для reuse across pages, schema and contacts.

### MediaAsset

#### Зачем нужна

`MediaAsset` является канонической metadata record для binary asset и базовой operational единицей media reuse.

#### Минимум полей и связей

- asset type;
- original filename;
- storage key;
- mime type;
- alt;
- caption;
- ownership note;
- source note;
- uploaded by;
- uploaded at;
- operational status.

#### Lifecycle и readiness

- Lifecycle: create -> metadata complete -> linked/reusable.
- Для publish-facing usage asset должен иметь валидный storage binding и базовую metadata completeness.
- Where-used visibility обязательна.

### Gallery

#### Зачем нужна

`Gallery` дает lightweight ordered grouping для cases и page blocks, не превращаясь в альбомную подсистему DAM.

#### Минимум полей и связей

- title;
- ordered asset refs;
- primary asset;
- optional caption;
- related entity refs.

#### Lifecycle и readiness

- Lifecycle: draft grouping -> reviewable grouping -> published grouping when referenced by published entity.
- Readiness: валидные asset refs, минимум один asset, понятный primary asset when required.

### Service

#### Зачем нужна

`Service` является route-owning entity для `/services/[slug]` и главным commercial content unit launch-core.

#### Минимум полей, блоков и связей

- slug;
- title;
- H1;
- summary;
- service scope;
- steps or methods;
- CTA variant;
- SEO basics;
- related cases;
- related FAQs or supporting proof;
- linked media or galleries where relevant.

#### Lifecycle и readiness

- Lifecycle: draft authoring -> review -> owner approval where required -> publish.
- Readiness: unique route, clear intent, CTA present, proof path present, no unresolved commercial ambiguity.

### Case

#### Зачем нужна

`Case` является route-owning proof entity для `/cases/[slug]` и ключевым evidence carrier для trust and conversion.

#### Минимум полей, блоков и связей

- slug;
- title;
- location;
- project type;
- task;
- work scope;
- result;
- service refs;
- gallery refs;
- optional testimonial ref;
- SEO basics.

#### Lifecycle и readiness

- Lifecycle: evidence assembly -> editorial shaping -> owner review when flagship or claims-heavy -> publish.
- Readiness: minimum factual completeness and minimum visual proof are mandatory.

### Page

#### Зачем нужна

`Page` покрывает standalone pages и page-level composition. В first slice прежде всего это `/about` и `/contacts`, а также page shells, не перехватывающие route truth у route-owning entities.

#### Минимум полей, блоков и связей

- slug;
- page type;
- title;
- H1;
- intro;
- typed blocks;
- primary image where needed;
- SEO basics;
- refs to services, cases, galleries, contact/global truth.

#### Lifecycle и readiness

- Lifecycle: draft composition -> review -> publish.
- Readiness: blocks must be structured, ordered, valid and semantically coherent.

## Screens / surfaces / primary workflows

### Login

Минимальный secure login surface для трех ролей. No enterprise IAM scope in first slice.

### Dashboard / work queue

Главный landing surface после login. Должен показывать:

- requires your action;
- waiting on others;
- ready for next step / ready to publish;
- recent publish and rollback actions.

Dashboard first slice should be action-centered, not a passive status dump of all entities.

### Entity lists

Отдельные list views для first-slice entity types с фильтрами:

- status;
- updated recently;
- review required;
- owner review required;
- readiness blocked;
- published.

### Entity create / edit

Карточно-формовый editor с секциями:

- Basics;
- Content;
- Relations;
- SEO;
- Media;
- Status / Revision.

Readiness should remain visible inside editing flow as persistent blockers / warnings / info surface, not only as a final pre-publish gate.

### Relation management

Searchable relation picker для services, cases, galleries and media. Важна не сложность UI, а прозрачность valid refs и reuse.

### Media selection / link

Media picker должен позволять:

- upload new asset;
- select existing asset;
- inspect metadata;
- see where-used;
- link asset to entity or gallery.

For visual construction assets the picker should be grid-first with preview thumbnails. Where-used and alt visibility should remain practical inside the selection flow, not hidden behind a second screen.

### Review inbox

Общая review surface для SEO Manager и Superadmin с очередью reviewable revisions, сортировкой по urgency, owner-review-needed и readiness state.

### Owner review card

Отдельная surface для Business Owner с focus mode:

- что изменилось;
- почему это предложено;
- что было раньше;
- candidate preview;
- readiness summary;
- actions approve / reject / send back with comment.

### Publish readiness view

Перед publish Superadmin видит отдельную readiness surface:

- checklist status;
- blocking issues;
- owner approval status;
- side effects summary;
- publish confirmation.

### Revision history

Хронологическая история revisions по сущности с diff access, author, comments, AI markers, approval state и publish state.

Revision history should read as human-readable timeline first, not as raw developer log table.

### User management

Minimal user admin surface для Superadmin:

- create account;
- assign role;
- deactivate account;
- view recent basic activity.

### Audit timeline

Human-readable operational timeline по сущности и глобально по системе.

## Owner review surface

Owner review surface должен быть отдельным product surface, а не одной кнопкой внутри тяжелого редактора.

### Goals

- сократить cognitive load для Business Owner;
- сделать review decision быстрым и безопасным;
- отделить editorial preparation от owner judgment;
- сохранить traceability по business approvals.

### Owner review inbox

Должен показывать только релевантные owner decisions:

- entity type and title;
- change class;
- who submitted;
- why review is needed;
- current live state vs candidate state;
- days waiting;
- approval urgency.

### Owner review card content

- краткое purpose summary;
- human-readable change intent;
- highlighted diff by meaning, а не по сырым полям;
- preview / candidate state;
- flagged claims or route changes;
- readiness summary;
- AI involvement summary if present;
- comment thread limited to decision-relevant discussion.

### Preview semantics

Preview в owner review и editorial review означает не “примерный будущий экран”, а candidate public state that is being reviewed for approval or publish.

Preview должен показывать:

- candidate revision для текущей сущности;
- с применением current published `Global Settings`, если сама reviewable revision не меняет `Global Settings`;
- с применением candidate `Global Settings`, если reviewable revision относится к `Global Settings` или если review bundle явно включает зависимое глобальное изменение;
- явную пометку, какая global truth basis использована в preview.

Это правило нужно для того, чтобы owner понимал, что именно он согласовывает, и чтобы approved candidate не расходился по смыслу с тем, что затем увидит public read-side.

### Owner actions

- `Approve`
- `Reject`
- `Send back with comment`

Owner не должен:

- править raw block data;
- разбираться в relation internals;
- управлять publish side effects;
- работать с media storage details.

## SEO operations surface

SEO Manager в first slice отвечает не только за текст, но и за SEO operational readiness.

### Minimum SEO fields

- slug;
- H1;
- meta title;
- meta description;
- canonical intent;
- indexation basic flag;
- open graph title;
- open graph description;
- open graph image source;
- internal linking support refs.

### SEO support behaviors

- preview snippet for search result intent;
- preview snippet for social share basics;
- readiness warnings for missing or weak SEO fields;
- warnings for duplicate or conflicting route intent within entity type;
- visibility into related entities that can improve internal linking.

### SEO posture rules

- one service page = one main intent;
- filters are not indexable pages by default;
- local business signals must stay consistent with `Global Settings`;
- SEO fields are editable operational truth, not frontend hardcode;
- canonical and indexation choices must be explicit, not accidental defaults.

## Media operations surface

Media workflow в first slice должен быть minimal but honest.

### Required media actions

- upload;
- asset preview;
- metadata edit;
- alt text;
- caption;
- ownership/source note;
- link to entity;
- link to gallery;
- reuse existing asset;
- see where-used;
- see uploaded by / uploaded at;
- see basic operational status.

### Validation expectations

- unsupported or broken asset state must be visible;
- missing alt should warn when asset is used in public-facing contexts where alt is expected;
- missing ownership/source note should warn, but not always hard-block if entity is still draft;
- media usage should never depend on pasted raw CDN URL as canonical reference.

### Out of scope

- bulk asset workflow automation;
- rights management matrix;
- advanced image editing;
- AI tagging at DAM scale;
- folders-as-truth media system.

## User management surface

First slice user management intentionally stays small.

### Superadmin capabilities

- authorize into admin console;
- create user account;
- assign one of the fixed roles;
- deactivate user;
- reactivate user if needed;
- view basic activity summary per user.

### Explicit non-goals

- enterprise IAM;
- SSO rollout;
- fine-grained custom RBAC designer;
- team hierarchy modeling;
- delegated admin trees.

## Audit / forensic / logging model

Admin first slice должен быть forensic-friendly не только для developers, но и для human operators.

### What every meaningful event should capture

- who performed action;
- when;
- entity type and entity ID;
- revision ID;
- action type;
- before / after summary;
- change comment / intent;
- AI involvement yes/no;
- AI input context class / source basis;
- approval state;
- publish checks passed/failed;
- side effects triggered;
- result status.

### Human-readable operational timeline

Внутри admin console должна существовать readable timeline, где доменные события описаны понятным языком:

- revision created;
- revision updated;
- review requested;
- owner review requested;
- owner approved;
- owner rejected;
- sent back with comment;
- publish blocked by gate;
- published;
- rollback executed;
- slug change created redirect obligation.

### Operational event taxonomy

Ниже минимальный канонический event set, который система должна логировать одинаково.

| Event key | Meaning |
| --- | --- |
| `revision_created` | Создана новая draft revision |
| `revision_updated` | Draft revision изменена |
| `review_requested` | Revision отправлена в review |
| `owner_review_requested` | Revision отправлена в owner review lane |
| `owner_approved` | Business Owner утвердил revision |
| `owner_rejected` | Business Owner отклонил revision |
| `sent_back_with_comment` | Revision возвращена в draft с комментарием |
| `publish_blocked` | Publish attempt остановлен readiness gate |
| `published` | Revision promoted to active published revision |
| `rollback_executed` | Active published revision заменена предыдущей published revision |
| `slug_change_obligation_created` | Для slug-affecting publish зафиксированы redirect / revalidation / sitemap obligations |

### Forensic design principles

- доменные события важнее технического шума;
- explanation first, raw detail second;
- AI participation должна быть видна и отделима от human-authored changes;
- publish and approval должны читаться как отдельные traceable decisions.

### AI input context class

Если в revision использовался AI assist, audit trail по возможности должен фиксировать хотя бы грубый source basis:

- `from current entity only`
- `from linked entities`
- `from published content`
- `manual prompt only`

Это не превращает admin console в prompt observability platform, но дает полезный forensic clue о том, откуда могла появиться спорная формулировка или suggestion.

## LLM-friendly posture and AI assistive boundaries

### LLM-friendly posture

Admin console должна быть LLM-friendly не за счет “магии”, а за счет дисциплины модели:

- structured entities instead of text chaos;
- explicit domain operations instead of silent state mutation;
- machine-readable readiness and human-readable explanations;
- stable refs and typed blocks instead of brittle page-specific hacks;
- auditability and revision history instead of hidden edits.

### AI assistive workflows allowed in first slice

- draft generation from structured prompts;
- rewrite suggestion;
- SEO field suggestion;
- alt text suggestion;
- summary generation for owner review;
- content normalization help;
- checklist assistance for readiness.

### AI boundaries

- AI is not source of truth.
- AI cannot approve.
- AI cannot publish.
- AI cannot silently overwrite current published truth.
- AI must not invent commercial facts, guarantees, pricing or timelines.
- AI output stays draft until human-reviewed.

### Traceability of AI contribution

Для каждой revision, где использовался AI assist, система должна по минимуму хранить:

- AI-assisted action type;
- who invoked it;
- when;
- AI input context class / source basis;
- where output was inserted or proposed;
- whether human accepted, edited or discarded it.

## First slice vs later slice

### In first slice

- `Global Settings`
- `MediaAsset`
- `Gallery`
- `Service`
- `Case`
- `Page`
- review inbox
- owner review surface
- publish readiness surface
- revision history
- rollback
- user management for fixed roles
- audit timeline
- AI assistive actions with traceability

### Early-next slice

- `FAQ Item`
- `Review / Testimonial`
- `Article`
- richer internal linking support across supporting content
- more mature owner review heuristics if first-slice evidence shows need

### Explicitly deferred

- visual builder
- arbitrary custom blocks
- enterprise DAM
- advanced workflow engine
- SEO dashboard
- analytics stack
- public AI chat
- calculator / estimate tool
- broad multi-region CMS behavior
- autonomous AI publishing

## Open questions / infra-dependent decisions

### Owner decision required

- final public contact truth;
- final primary launch region wording;
- final launch service core and whether guest-house service stays in scope;
- final set of priority and flagship cases;
- exact allowed public claim boundaries for pricing, timelines and guarantees;
- final owner review map if any additional page types must always require owner approval.

### Infra-dependent

- exact implementation of redirect persistence for slug changes;
- exact cache revalidation mechanism after publish;
- exact sitemap refresh mechanism;
- exact preview rendering path for candidate state;
- exact auth mechanism behind the fixed role model.

### Product ambiguities to resolve later, not inside this PRD

- whether Business Owner gets read-only access to full audit history or a narrowed review-focused subset only;
- whether Superadmin can publish non-owner-reviewed minor changes in batch or only one-by-one;
- reviewable revision edit discipline is settled by `Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`; this PRD does not reopen it.

## Acceptance criteria for admin first slice

- Маленькая команда может без hardcode в templates завести и поддерживать `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case` и `Page`.
- SEO Manager может создать draft revision, заполнить SEO fields, связать entities и media, увидеть readiness blockers и отправить revision на review.
- Business Owner может из отдельной owner review surface понять change intent, увидеть diff и preview, затем approve / reject / send back with comment без работы в full editor mode.
- Superadmin может опубликовать только validated revision, увидеть publish checks, выполнить rollback и управлять пользователями fixed-role model.
- Published read-side потребляет только active published revisions.
- Slug change у опубликованной сущности создает traceable redirect / revalidation / sitemap obligations.
- Audit timeline показывает, кто, что и когда изменил, включая AI involvement и publish side effects.
- First slice остается launch-disciplined и не требует visual builder, enterprise DAM или broad CMS features для работы с launch-core.
