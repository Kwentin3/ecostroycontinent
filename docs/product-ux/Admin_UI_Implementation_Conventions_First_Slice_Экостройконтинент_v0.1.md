# Admin UI Implementation Conventions First Slice

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation-facing appendix for admin console first slice

## 1. Purpose and non-goals

Этот appendix задает короткие повторяемые UI conventions для admin first slice, чтобы реализация не расползалась по локальным импровизациям.

Этот документ:

- не является новым PRD;
- не является вторым источником продуктовой истины;
- не переоткрывает owner review, readiness, dashboard, media picker или publish semantics;
- не является design system или pixel-perfect GUI spec;
- не определяет product scope beyond first slice.

Если этот appendix расходится с PRD или contracts, PRD и contracts выше.

## 2. Modal / drawer / full-page policy

### Preferred patterns

- Modal используется для короткого confirm action, small select action или quick metadata action.
- Drawer / side panel используется для picker flows, supporting details, diff details, where-used context и secondary inspection.
- Dedicated full-page surface используется для entity editing, owner review, publish readiness, revision history, audit timeline и user management.
- Preview внутри owner review открывается внутри той же owner review surface как embedded panel, tab или side-by-side split, а не как отдельная full-page навигация.

### Hard rules

- Modal не используется для длинного многошагового редактирования.
- Drawer не используется как замена full editor surface.
- Owner review всегда живет на отдельной dedicated surface, не в modal и не в inline block внутри editor.
- Publish readiness живет на dedicated surface; modal допустим только для финального confirm после already-visible readiness state.

## 3. Form and section layout conventions

### Preferred patterns

- Базовый порядок editor surface: header with title/status/actions -> basics -> content -> relations -> SEO -> media -> status/revision context.
- Для `Global Settings` порядок секций адаптируется к структуре entity и не навязывается механически, если у сущности нет обычных `content` или `relations` sections.
- Required fields маркируются единообразно и видны до submit, а не только после failed action.
- Primary actions идут в одном action area и читаются как `Save draft` -> `Submit for review` -> `Publish` according to role and state.
- Destructive actions визуально отделяются от primary workflow и никогда не группируются вплотную с save/review actions.
- Readiness summary остается видимым внутри editing flow как persistent panel или persistent section, а не только в финальном publish step.

### Hard rules

- Нельзя прятать critical required fields в collapsed sections by default.
- Нельзя смешивать editor actions и owner actions в одной перегруженной action bar.
- Нельзя делать publish как визуально равный сосед обычного save без state/permission distinction.

## 4. Readiness / status rendering conventions

### Preferred patterns

- `blocking` показывается как high-contrast panel на page level, blocking badge в lists/cards и inline field hint рядом с локальной проблемой.
- `warning` показывается как non-blocking warning panel/badge/hint, но не маскируется под info.
- `info` показывается как нейтральное explanatory message без ложной тревоги.
- Readiness переоценивается на save или по явному `re-check` action, но не на каждом keystroke.
- Disabled action всегда сопровождается видимой причиной рядом с action area.
- Невозможность `submit for review`, `approve` или `publish` объясняется двумя слоями:
  - short reason near the disabled action;
  - full reason in readiness panel.

### Hard rules

- Нельзя использовать разные meaning mappings для `blocking`, `warning`, `info` на разных экранах.
- Нельзя отключать action без readable reason.
- Нельзя показывать publish-blocking issue только как badge без объяснения.

## 5. Dashboard conventions

### Preferred patterns

- Dashboard строится вокруг actionability, не вокруг общей свалки статусов.
- Базовые группы: `requires your action`, `waiting on others`, `ready for next step`.
- Допустим компактный блок `recent publish / rollback`, если он не вытесняет action queues.
- Каждый dashboard item должен отвечать на вопрос “что делать дальше”.
- Empty dashboard показывает onboarding-oriented empty state с первым рекомендуемым действием, а не blank screen.

### Hard rules

- Dashboard не превращается в dump всех entities со статусами.
- Dashboard не становится analytics screen, audit table или generic CMS homepage.
- Dashboard не должен требовать открытия нескольких экранов, чтобы понять next action.

## 6. Revision history / audit timeline conventions

### Preferred patterns

- Revision history и audit по умолчанию отображаются как timeline-first surface.
- Event summaries пишутся human-readable language first: что изменилось, кем, когда, в каком состоянии.
- Summary view показывает chronological narrative; detail view открывает full payload, diff, comments и side effects.
- Timeline detail по умолчанию открывается в drawer / side panel из timeline surface, а не уводит пользователя на отдельную full-page навигацию без причины.
- AI involvement виден прямо в summary row, а не спрятан в deep detail.
- Publish, approval, rollback и send-back читаются как разные типы событий.

### Hard rules

- Нельзя по умолчанию рендерить историю как raw technical table.
- Нельзя скрывать AI involvement в detail-only mode.
- Нельзя смешивать revision history и low-level debug log в одном default view.

## 7. Picker conventions

### Relation picker

- По умолчанию relation picker является searchable selection surface, а не набором embedded inline controls по всей форме.
- В relation picker видны entity type, human label, status и enough context to avoid wrong linking.
- Picker должен помогать reuse valid refs, а не стимулировать ручной ввод pseudo-links.

### Media picker

- Для visual assets media picker по умолчанию grid-first.
- Thumbnail-first presentation обязательна; filename-first flat list не является default.
- Upload внутри picker остается inline flow; после успешного upload новый asset сразу доступен для выбора без навигации на отдельную media page.
- В selection flow должны быть practically visible:
  - preview thumbnail;
  - alt;
  - where-used;
  - basic asset status.
- Secondary details открываются в drawer / side panel, а не уводят пользователя на unrelated full page без причины.

### Hard rules

- Для visual assets нельзя использовать flat file-list as default.
- Critical metadata нельзя прятать слишком глубоко.
- Raw URL paste не должен становиться UI shortcut для media truth.

## 8. CSS / styling discipline

### Preferred patterns

- Для admin first slice используется один styling approach across admin surfaces.
- Preferred default: CSS Modules + shared admin tokens/variables for spacing, radius, shadow, colors and panel shells.
- Admin console использует одну фиксированную тему в first slice; theme switching для admin вне текущего scope.
- Shared panel, section and action-bar patterns переиспользуются между screens.
- Unique layout pattern на screen допускается только при explicit functional reason.

### Hard rules

- Нельзя бесконтрольно смешивать inline styles, CSS Modules, utility-style ad hoc classes и screen-specific one-offs на одной и той же поверхности.
- Нельзя оставлять ad hoc inline styles без явного исключения.
- Нельзя придумывать новый spacing/radius/shadow language на каждом экране.

## 9. States and accessibility minimum

### Minimum states

- Каждая surface имеет явные states: loading, empty, error, no-access, not-found.
- Modal и drawer закрываются клавишей `Escape`, если нет explicit blocking reason.
- Focus visibility обязательна для actionable elements.
- Destructive actions требуют explicit confirm step.
- Disabled reasons должны быть readable without hover-only dependency.

### Hard rules

- Нельзя оставлять user в blank state без объяснения.
- Нельзя делать destructive confirm неотличимым от обычного confirm.
- Нельзя прятать error state только в console.

## 10. Forbidden patterns

- Не превращать owner review в обычный editor.
- Не смешивать owner review mode и editor mode в перегруженном universal screen.
- Не делать dashboard как dump всего со статусами.
- Не прятать readiness только в финальном publish flow.
- Не использовать modal для длинного многошагового редактирования.
- Не использовать full-page surface для коротких confirm/select actions без причины.
- Не скрывать причину disabled action.
- Не делать destructive actions без явного confirm.
- Не делать media picker как плоский список файлов без preview-first presentation.
- Не прятать critical metadata слишком глубоко.
- Не смешивать разные patterns status/readiness rendering на разных поверхностях.
- Не превращать timeline в raw technical table by default.
- Не скрывать AI involvement.
- Не уводить пользователя прочь из owner review flow при открытии preview или diff.
- Не плодить ad hoc styling patterns по экранам.

## 11. Escalate instead of inventing

Эскалировать вместо локальной UI-импровизации нужно, если:

- непонятно `modal` vs `drawer` vs `full-page`;
- непонятно owner action vs editor action;
- непонятно `blocking` vs `warning`;
- непонятно picker vs embedded inline control;
- локальное UI-решение начинает конфликтовать с PRD или contracts;
- хочется “временно упростить” flow ценой owner review, readiness visibility, publish discipline или route/media canon;
- screen просит новый pattern, который потом придется копировать на другие surfaces без уже принятого правила.
