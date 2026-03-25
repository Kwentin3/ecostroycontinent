# План автономной доработки админки с новыми owner wishes

Статус: planning pass for autonomous closing work after acceptance review  
Дата: 2026-03-25

## 1. Executive summary

Текущий admin first slice уже materially implemented и canon-safe, но по acceptance report остается несколько узких gap-ов до full acceptance:

- human-readable diff в owner review / revision history;
- faithful preview candidate public state;
- rollback как реальная admin UI surface;
- operator-safe blocked actions вместо raw `500`;
- proof/reproducibility hardening.

Новые owner wishes частично ложатся в тот же closing contour, но не все из них являются blocking для full acceptance.

Рекомендуемый closing plan:

1. закрыть acceptance-blocking gaps как обязательный `Band A`;
2. затем выполнить owner wishes, разделив их на:
   - `include now` для Russian-first admin/auth usability;
   - `temporary public shell` для homepage mosaic / “В разработке” / login icon;
   - `do not expand` для всего, что могло бы разрастись в широкую public/media/i18n архитектуру.

Рекомендация по режиму исполнения:

- запускать не одним бесформенным “finish everything” run;
- а одним автономным execution batch, внутри которого есть два последовательных band-а:
  - `Band A = full acceptance closing`
  - `Band B = owner wishes safe layer`

Такой порядок минимизирует drift:

- сначала закрываются обязательные acceptance conditions;
- затем owner wishes встраиваются без подмены content/media truth и без расширения scope.

## 2. Current acceptance baseline

По текущему acceptance report статус first slice: `ACCEPT WITH CONDITIONS`.

### 2.1 Что уже считается materially done

- SQL content core и revision backbone;
- fixed-role auth baseline;
- entity coverage first slice:
  - `Global Settings`
  - `MediaAsset`
  - `Gallery`
  - `Service`
  - `Case`
  - `Page`
- operations spine:
  - draft
  - review
  - owner approval
  - publish
  - rollback
  - audit
  - slug-change obligations
- public read-side routes;
- admin shell, entity editors, review inbox, publish readiness, user management;
- canonical runtime proof against accepted Linux VM `app + sql`.

### 2.2 Что остается blocking до full acceptance

1. human-readable diff отсутствует в owner review и revision history;
2. preview не дотягивает до honest candidate public state;
3. rollback не выведен в реальную admin UI surface;
4. blocked submit/publish paths могут отдавать raw `500`;
5. proof/reproducibility hardening недостаточен.

### 2.3 Что НЕ является blocking acceptance condition само по себе

- русский язык на public homepage;
- мозаика из Unsplash;
- “В разработке” на homepage;
- иконка входа в правом верхнем углу.

Это owner wishes и launch-shell/public-placeholder enhancements, но не acceptance blockers admin first slice per se.

## 3. New owner wishes

Новые owner wishes:

1. интерфейс должен быть на русском языке;
2. авторизованный вход в админку для трех ролей:
   - `Superadmin`
   - `SEO`
   - `Business Owner`
3. на домашней странице нужна мозаика строительных изображений;
4. источник изображений: Unsplash;
5. на домашней странице нужно добавить:
   - название сайта;
   - надпись `В разработке`;
6. иконка входа должна быть в верхнем правом углу.

## 4. Canon compatibility review

### 4.1 Русский интерфейс

Совместимость с каноном: `compatible`

Комментарий:

- это не ломает content truth, publish semantics или route ownership;
- но не нужно превращать задачу в широкую i18n-платформу;
- для current closing phase достаточно Russian-first UI baseline.

Вывод:

- делать как `Russian-first UI baseline`, а не как full localization system.

### 4.2 Авторизованный вход для трех ролей

Совместимость с каноном: `already aligned`

Комментарий:

- fixed-role auth baseline уже реализован;
- роли `superadmin`, `seo_manager`, `business_owner` уже есть в коде и proof;
- значит это не новый функциональный эпик, а closing/usability pass.

Вывод:

- включать сейчас;
- scope держать узким: labels, copy, login affordance, role usability, но не redesign auth architecture.

### 4.3 Homepage mosaic на Unsplash

Совместимость с каноном: `compatible only as temporary decorative shell`

Комментарий:

- public homepage может содержать временный decorative shell;
- но Unsplash нельзя превращать во вторую media truth вне `Content Core`;
- эти изображения не должны становиться canonical content assets first slice.

Вывод:

- допустимо только как temporary non-canonical decorative layer;
- явно не заводить их в `MediaAsset` / `Gallery` domain;
- не подменять ими content/media source of truth.

### 4.4 Название сайта, “В разработке”, иконка входа

Совместимость с каноном: `compatible`

Комментарий:

- это launch-shell/public-placeholder and auth-entry tweaks;
- не конфликтуют с read-side posture;
- при узкой реализации не требуют product reopening.

Вывод:

- можно включать в closing band после acceptance blockers;
- не расширять в отдельный marketing/public redesign.

## 5. Classification of work items

| Item | Classification | Canon impact | Implementation impact | Scope risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Human-readable diff in owner review/history | acceptance-closing | required for PRD/acceptance | admin UI + diff helper + audit/history rendering | low | include now |
| Faithful candidate preview | acceptance-closing | required for approval truth | read-side preview seam + review UI | medium | include now |
| Rollback UI surface | acceptance-closing | required for superadmin usability | admin history/publish/history UI + confirm | low | include now |
| Operator-safe blocked actions | acceptance-closing | required for safe operations | route handlers + readiness messaging | low | include now |
| Proof hardening | acceptance-closing | required for reproducibility | scripts/tests/docs sync | low-medium | include now |
| Russian admin/login copy | auth baseline + UI-only tweak | canon-safe | admin UI copy + login surface + labels/errors | low | include now |
| Russian public shell copy | public placeholder | canon-safe | homepage copy only | low | include now |
| Fixed-role login usability for 3 roles | auth baseline | already aligned | login copy / role wording / maybe seed-facing hints | low | include now |
| Homepage mosaic from Unsplash | public placeholder | safe only as decorative temporary shell | homepage component + styling | medium if overgrown | include later in same batch, after blockers |
| Site title + “В разработке” | public placeholder | canon-safe | homepage copy | low | include later in same batch |
| Login icon top-right | launch-shell enhancement | canon-safe | homepage header/auth entry affordance | low | include later in same batch |
| Full i18n framework | out-of-scope risk | unnecessary widening | broad cross-app infra | high | do not include |
| Unsplash-based media architecture | out-of-scope risk | creates second media truth | public/media/domain confusion | high | do not include |
| Broad homepage redesign | out-of-scope risk | scope creep | marketing/public redesign | high | do not include |

## 6. Recommended autonomous closing plan

### 6.1 Recommended shape

Рекомендую один autonomous closing batch с двумя strict bands.

#### Band A. Acceptance closing

Цель:

- закрыть все explicit acceptance conditions до full acceptance;
- не мешать их с public placeholder work;
- не размывать execution proof.

Состав:

1. diff access in owner review / history;
2. faithful preview hydration and preview basis rendering;
3. rollback surface with confirm;
4. operator-safe blocked-action handling;
5. proof hardening and reproducibility artifacts.

#### Band B. Owner wishes safe integration

Цель:

- встроить новые owner wishes в текущий contour без scope creep.

Состав:

1. Russian-first admin/auth/public shell copy;
2. role-login usability polishing for `Superadmin` / `SEO` / `Business Owner`;
3. homepage temporary mosaic from Unsplash;
4. site title + `В разработке`;
5. top-right login icon.

### 6.2 Почему именно такой порядок

- acceptance blockers являются conditions for full acceptance и должны быть закрыты первыми;
- owner wishes по homepage не должны задерживать closure of admin acceptance;
- Russian-first admin/auth baseline можно делать рядом с Band A, потому что это улучшает operability, но homepage placeholder всё равно вторичен относительно acceptance closure.

## 7. Execution order by batch

## Band A. Acceptance closing

### A1. Review evidence layer

Goal:

- добавить human-readable diff и decision context в owner review / revision history.

Touched layers:

- `lib/content-core/*`
- `lib/content-ops/*`
- `lib/admin/*`
- `app/admin/(console)/review/*`
- `app/admin/(console)/entities/*/history/*`
- `components/admin/*`

Preconditions:

- текущий revision payload и audit data доступны;
- review/history surfaces уже существуют.

Expected artifacts:

- diff helper, показывающий semantic/top-level changes;
- review card context:
  - change intent
  - change class
  - why review needed
  - candidate vs current published markers
- history/detail access without full editor collapse.

Acceptance gate:

- owner может понять “что изменилось по смыслу” без raw JSON.

Proof obligations:

- screenshots owner review + history;
- short contract drift-check;
- local build/test pass.

Stop triggers:

- если реализация потребует reopen of change-class canon or rewrite contracts.

### A2. Preview truth closing

Goal:

- сделать preview честным candidate public state для review/publish decisions.

Touched layers:

- `lib/read-side/*`
- `lib/admin/*`
- `app/admin/(console)/review/[revisionId]/page.js`
- possibly preview helper modules
- `components/public/*`

Preconditions:

- A1 completed or at least preview surface stable enough.

Expected artifacts:

- review preview hydrates linked services/cases/galleries/media where relevant;
- explicit preview basis marker:
  - current published global settings
  - candidate global settings, when applicable.

Acceptance gate:

- owner approves what the system is actually going to publish, not an approximate shell.

Proof obligations:

- screenshot of review surface with preview basis;
- targeted proof for service/case/page review preview.

Stop triggers:

- если потребуется ввести second preview model separate from published/read-side semantics.

### A3. Rollback surface and safe confirms

Goal:

- вывести rollback в реальную superadmin-operable surface.

Touched layers:

- `app/admin/(console)/entities/*/history/*`
- maybe `app/admin/(console)/revisions/*`
- `components/admin/*`
- existing rollback API route

Preconditions:

- A1 history improvements available.

Expected artifacts:

- visible rollback action from history/publish-related surface;
- explicit confirm step;
- readable success/failure feedback.

Acceptance gate:

- superadmin can execute rollback from UI, not only hidden endpoint/proof script.

Proof obligations:

- UI screenshot;
- targeted rollback smoke;
- no regression of existing vertical slice.

Stop triggers:

- если UI path starts to mutate revision truth outside existing rollback operation.

### A4. Operator-safe blocked action handling

Goal:

- убрать raw `500` from expected operational block paths.

Touched layers:

- `app/api/admin/revisions/*`
- maybe `app/api/admin/entities/*`
- shared route helpers / error mapping
- readiness messaging surfaces

Preconditions:

- A1-A3 not strictly required.

Expected artifacts:

- blocked submit/publish returns operator-facing redirect/message;
- disabled reasons and readable messages stay consistent with readiness.

Acceptance gate:

- expected business/operational blocks no longer behave like transport/server errors.

Proof obligations:

- targeted proof for contacts hard-stop and broken-reference submit path.

Stop triggers:

- если для “beautifying” errors потребуется bypass of readiness or publish contract.

### A5. Proof and reproducibility hardening

Goal:

- сделать acceptance proof reproducible from a cleaner execution path.

Touched layers:

- `scripts/*`
- `tests/*`
- minimal docs sync only if needed

Preconditions:

- A1-A4 completed.

Expected artifacts:

- stable proof commands for closing batch;
- at least one targeted route-level or DB-backed integration proof path;
- updated acceptance evidence note if command surface changed.

Acceptance gate:

- closing batch can be rerun without relying on ad hoc manual memory.

Proof obligations:

- command list;
- pass/fail outputs;
- explicit note on canonical VM proof path.

Stop triggers:

- если задача начинает превращаться в broad CI platform redesign.

## Band B. Owner wishes safe integration

### B1. Russian-first admin/auth baseline

Goal:

- сделать admin/login surfaces Russian-first and usable for owner team.

Touched layers:

- `app/admin/**/*`
- `components/admin/*`
- maybe selected public shell copy

Preconditions:

- acceptance blockers preferably closed or near-closed.

Expected artifacts:

- navigation, buttons, labels, empty states, blocked-action copy, login labels, review/publish copy на русском;
- role wording normalized:
  - `Суперадмин`
  - `SEO`
  - `Владелец бизнеса`

Acceptance gate:

- admin first slice usable in Russian without introducing broad i18n framework.

Proof obligations:

- screenshots of login/dashboard/review/editor in Russian.

Stop triggers:

- если работа начинает тянуть full locale infrastructure, translation dictionaries, runtime language switching.

### B2. Auth entry usability polish

Goal:

- довести login entry до clearly usable state for the three roles.

Touched layers:

- `app/admin/login/page.js`
- `app/api/admin/login/route.js`
- maybe homepage auth entry affordance

Preconditions:

- existing auth baseline preserved.

Expected artifacts:

- Russian login copy;
- clear role wording;
- readable invalid credential message;
- clear path into admin from public/home shell.

Acceptance gate:

- all three roles can realistically enter and orient themselves in first slice.

Proof obligations:

- role login smoke.

Stop triggers:

- если решение начинает менять auth architecture instead of UI/usability.

### B3. Public homepage temporary shell

Goal:

- внедрить owner-requested public placeholder shell without creating second media/content truth.

Touched layers:

- `app/page.js`
- `components/public/*` or home-specific component
- `components/public/public-ui.module.css`
- maybe small icon asset

Preconditions:

- explicit note in implementation: Unsplash mosaic is temporary decorative shell, not canonical content/media truth.

Expected artifacts:

- site title;
- `В разработке`;
- mosaic of construction-themed Unsplash images;
- login icon in top-right linking to admin login.

Acceptance gate:

- homepage clearly reads as temporary public placeholder, not as new CMS/media architecture.

Proof obligations:

- desktop/mobile screenshots;
- note on temporary decorative status.

Stop triggers:

- если mosaic implementation tries to introduce persistent media model outside `Content Core`;
- если homepage work starts expanding into broad marketing layout or content strategy.

## 8. Repo/layer impact map

### Admin/domain layers

Primary impact:

- `lib/content-core/*`
- `lib/content-ops/*`
- `lib/admin/*`
- `app/admin/(console)/*`
- `components/admin/*`

This is where acceptance blockers live.

### Auth layers

Primary impact:

- `lib/auth/*`
- `app/api/admin/login/route.js`
- `app/admin/login/page.js`
- `app/admin/(console)/layout.js`

Most likely changes here are copy/usability, not auth architecture.

### Public shell layers

Primary impact:

- `app/page.js`
- maybe one home-specific public component
- `components/public/public-ui.module.css`

This should remain thin and explicitly decorative where Unsplash is involved.

### Proof / verification layers

Primary impact:

- `scripts/*`
- `tests/*`

Goal is proof hardening, not platform rewrite.

## 9. Stop-and-escalate map

### Real stop triggers

1. if any new wish would require a second media truth outside `Content Core`;
2. if homepage mosaic pressures the codebase into a parallel media architecture;
3. if Russian UI work starts requiring broad i18n platform decisions beyond current slice;
4. if acceptance closing of preview/diff would require reopening PRD/contracts rather than implementing them;
5. if auth usability requests turn into new role model or IAM redesign;
6. if public shell changes start to override published read-side posture.

### What is NOT a stop trigger

- translating labels/buttons/messages to Russian;
- adding a login icon/link on homepage;
- using Unsplash images as explicitly temporary decorative shell;
- adding diff helper and preview basis UI;
- adding rollback UI over existing rollback operation;
- mapping expected blocked domain errors to readable operator feedback.

## 10. Acceptance path after execution

### After Band A

Ожидаемый status:

- `ACCEPT WITH CONDITIONS` should be eligible to move to `ACCEPT`, if:
  - diff is present;
  - preview is faithful;
  - rollback surface exists;
  - blocked actions are operator-safe;
  - proof path is hardened enough.

### After Band B

Ожидаемый status:

- owner wishes are integrated without changing core acceptance verdict;
- public shell becomes more owner-friendly and Russian-first;
- admin becomes more immediately usable for real operators.

Important distinction:

- `Band A` closes acceptance;
- `Band B` closes owner wishes that are compatible and phase-appropriate;
- homepage placeholder work should not be allowed to delay acceptance-closing.

## 11. Final recommendation

### Recommended plan

Запускать следующий execution prompt как autonomous closing batch with two ordered bands:

1. `Band A: acceptance closing`
2. `Band B: owner wishes safe integration`

### What is blocking

Blocking for full acceptance:

- human-readable diff;
- faithful preview;
- rollback UI surface;
- operator-safe blocked actions;
- proof/reproducibility hardening.

### What is optional or temporary

Optional/temporary relative to full acceptance:

- homepage mosaic from Unsplash;
- site title and `В разработке` on homepage;
- login icon in top-right;
- Russian public shell copy.

### What should still be treated carefully

- Russian UI should be Russian-first baseline, not full i18n platform;
- Unsplash mosaic should be temporary decorative shell, not domain media truth;
- auth work should remain usability polish over existing fixed-role baseline.

### Can the next autonomous closing batch be launched after this?

Yes.

Рекомендуемый следующий prompt можно уже давать в автономную работу, если он:

- explicitly preserves canon;
- treats `Band A` as acceptance-closing priority;
- treats `Band B` as secondary but included;
- keeps homepage mosaic as temporary decorative shell only;
- forbids broad redesign, i18n-platform expansion and second media truth.
