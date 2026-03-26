# EKOSTROY.UI.VERSTKA_AUTONOMOUS_EXECUTION_PLAN_Экостройконтинент_v0.1

Статус: autonomous execution plan
Дата: 2026-03-26

Этот план собран на основе:
- [EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md](./EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md)
- [Admin_UI_Implementation_Conventions_First_Slice_Экостройконтинент_v0.1.md](./Admin_UI_Implementation_Conventions_First_Slice_Экостройконтинент_v0.1.md)
- [Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md](./Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md)
- [Content_Contract_Экостройконтинент_v0.2.md](./Content_Contract_Экостройконтинент_v0.2.md)
- [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md)
- [PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md](./PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md)

План не переоткрывает product canon и не вводит новую UI-архитектуру. Его задача - убрать повторяющиеся layout-ошибки и сделать nested admin surfaces более понятными, спокойными и последовательными без изменения domain semantics, publish/readiness truth или route ownership.

## 1. Executive decision

Рекомендуемая стратегия - не точечная правка каждого экрана по отдельности, а введение общего `nested editor shell` для всего семейства похожих поверхностей.

Почему именно так:
- замечания из notes повторяются почти один в один на `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги` и частично на `Настройках` / `Проверке`;
- проблема системная: пользователь каждый раз заново учится, где искать контекст, как вернуться назад и где находится служебная информация;
- docs already expect a consistent editor grammar: header -> basics -> content -> relations -> SEO -> media -> status/revision context, with readiness/publish/review kept visible and distinct;
- individual screen-only fixes will drift and recreate the same confusion on the next surface.

What we are not doing:
- not a redesign;
- not a new design system;
- not a new CMS/page-builder;
- not a new localization platform;
- not a rewrite of content model or workflow semantics.

Primary UX recommendation:
- keep the global left navigation sticky/static;
- add a visible top depth/breadcrumb bar for nested screens;
- make the right support rail compact and mostly static;
- keep the main editor column as the only primary long scroll;
- reuse one shell grammar across all repeated nested editor surfaces.
- above that shell, role-aware landing packets should differ by role so `SEO Manager`, `Business Owner`, and `Superadmin` do not all land on the same information density.

For `Пользователи`, do not force the same heavy nested-editor pattern if a lighter CRUD split works better. Use the same shell grammar and tokens, but allow a separate CRUD variant.

## 2. Execution doctrine

### Canonical execution unit

The canonical execution unit is a `surface family pack`, not a single page.

Recommended families:
- `shell/workflow pack`: admin shell, dashboard, `Проверка`, `Настройки`;
- `nested editor pack`: `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги`;
- `CRUD pack`: `Пользователи`.

Each pack must have:
- bounded surface scope;
- bounded write set;
- one layout hypothesis;
- one proof package;
- one regression checklist.

### Autonomy boundary

Agent may decide autonomously:
- sticky/static behavior for global sidebar;
- breadcrumb/depth bar placement and content, if it does not change workflow meaning;
- right rail compactness and scroll threshold;
- section spacing, density, and grouping;
- order of sections when it only affects readability, not semantics;
- reuse of existing media/gallery picker flows instead of duplicate upload paths;
- making field labels more contextual when meaning is already clear from the content model;
- moving repeated surface chrome into shared shell primitives.

Agent must escalate:
- any field renaming that could alter business meaning;
- any choice between free text and reference/select when the field represents a taxonomy or dictionary;
- any wording that could change publish/review/readiness semantics;
- any decision that would make `Пользователи` behave like a nested content editor if that hurts CRUD clarity;
- any decision about whether a screen is a shell page, a nested detail page, or a separate management surface if the source of truth is unclear;
- any tradeoff that would duplicate or hide media upload logic.

### Approval budget

Keep approvals narrow:
- Gate 1: shell grammar and navigation pattern;
- Gate 2: ambiguous field semantics / terminology;
- Gate 3: `Пользователи` layout choice if it materially changes the CRUD model;
- Gate 4: final sign-off after cross-surface QA.

Do not request approval for every minor spacing or panel tweak.

### Stop triggers

Stop and escalate if:
- a proposed fix would change route ownership;
- a layout fix starts behaving like a product redesign;
- a label change would become a content-model change;
- a screen is actually a different surface class than expected;
- there is no clean way to separate user-facing UI from dev/test fixtures;
- runtime/content-owned data is the real source of confusion and not the layout itself.

## 3. Target end-state

After this epic, the interface should feel like one family of screens rather than a set of unrelated forms.

### Admin shell

- left navigation stays available on long pages;
- nested screens show where the user is in the hierarchy;
- the right rail is a support area, not a second main scroll;
- header/actions/status are consistent across screens;
- no screen feels like a one-off layout experiment.

### Nested editor surfaces

- `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги` share one layout grammar;
- `Пользователи` can return one level up without hunting through the sidebar;
- related entities, status, and workflow context remain visible but not noisy;
- the main editor column reads like one stable working area.

### Semantic clarity

- ambiguous fields are either contextualized or converted into clear reference/select controls;
- `Смысл изменения`, `Тип проекта`, `Короткий адрес`, `Название`, `Подпись` stop feeling like internal jargon;
- duplicate media upload paths are removed or clearly re-routed through the shared media engine;
- the UI explains what a field is for, not just what the backend calls it.

### Пользователи

- `Пользователи` feels like a proper CRUD surface, not a squeezed split;
- list and form relationship is clearer;
- if a separate split-view layout is better, it should be used here without forcing the heavier nested-editor pattern;
- the screen should feel calmer and more operationally obvious.

### Role-facing layer

- `SEO Manager` should land on a task queue or next-actions view, not on a generic dump of all content.
- `Business Owner` should land on a compact decision packet: summary, real preview, risks, and a small set of decisions.
- `Superadmin` should land on operational control: publish / rollback consequences, audit context, and access management.
- The same shell can be reused across roles, but the first view and information density must differ by role.

### Decision and evidence packets

- review comments must jump back to the concrete field or block they refer to;
- audit timeline should read like a human story first and a technical payload second;
- publish side effects should appear as a short checklist of consequences and obligations, not as hidden technical trivia;
- role-specific screens should surface the minimum evidence needed for the next human decision.

## 4. Surface family map

| Family | Screens | Core problem | Intended pattern |
| --- | --- | --- | --- |
| Shell / workflow | `Админка`, `Проверка`, `Настройки` | sticky nav, right rail, dense work area | shared shell with breadcrumb/depth bar |
| Role-facing packet | dashboard landing, review detail, publish screen, audit timeline | different first-view density by role | summary / decision / ops packet |
| Nested editor | `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги` | repeated density, nested depth, long scroll, duplicate media logic | shared nested editor shell |
| CRUD management | `Пользователи` | cramped layout, unclear list/form split | lighter CRUD variant with same shell grammar |

This map is the main guardrail against drift. If a screen does not fit a family, it should be reconsidered before implementation, not patched blindly.

## 5. Recommended execution waves

### Wave 0. Normalize the shell contract

Goal:
- turn the notes into a concrete layout contract for the repeated screen families.

Scope:
- shell behavior;
- layout primitives;
- sidebar stickiness;
- breadcrumb/depth bar;
- right rail behavior;
- section spacing rules;
- screen family mapping.

Rationale:
- the observed issues are all variations of the same grammar problem;
- once the grammar is fixed, per-screen work becomes simpler and less risky.

Allowed changes:
- shared panel/section spacing;
- sticky or fixed behavior for the global sidebar;
- depth bar placement;
- rail width/scroll threshold;
- screen configuration objects.

Disallowed changes:
- content model changes;
- workflow semantics changes;
- route ownership changes;
- new platform abstractions.

Dependencies:
- `Admin_UI_Implementation_Conventions_First_Slice`;
- `Content_Operations_Admin_Console_MVP_Spec`;
- the notes file.

Success criteria:
- one written shell contract;
- one surface family map;
- no ambiguity about which screens belong to which family.

Proof package:
- shell contract summary;
- family map;
- acceptance checklist for sticky nav, depth bar, right rail and section order.

Risks:
- overfitting the shell into a monolith;
- introducing a second navigation system by mistake.

### Wave 1. Pilot the shell on the simplest representative screens

Goal:
- prove the shell grammar on a small, low-risk set before migrating the whole family.

Recommended pilot screens:
- `Настройки`;
- `Проверка`;
- one nested editor list surface, preferably `Медиа` list, so the shared shell is validated on the family that actually needs it;
- `Админка` / dashboard shell state.

Rationale:
- these surfaces expose the shell behavior without the complexity of media-heavy or relation-heavy editors;
- they are good for validating sticky nav, density, and depth cues.
- including one nested editor list transition in Wave 1 reduces the risk that the pilot only proves the shell on atypical surfaces.

Allowed changes:
- layout tightening;
- right rail compactness;
- top depth/breadcrumb bar;
- consistent header/actions/status order;
- spacing cleanup.

Disallowed changes:
- business copy rewrites;
- workflow behavior changes;
- deep content restructuring.

Success criteria:
- the sidebar stays available on long scroll;
- the user can see where they are in the hierarchy;
- the support rail no longer feels like a second main page;
- the page feels calmer without losing operational clarity.
- the pilot proves distinct first-view packets for `SEO Manager`, `Business Owner`, and `Superadmin` on the shell/workflow surfaces.

Proof package:
- before/after screenshots;
- scroll behavior notes;
- screenshot of top depth bar and compact right rail.
- role landing screenshots for the workflow surfaces.

Risks:
- treating the pilot as a one-off and not rolling the pattern forward.

### Wave 2. Apply the shell to `Медиа` and `Галереи`

Goal:
- reduce density and remove duplicated media-flow complexity in the media family.

Scope:
- media detail editor;
- gallery list/detail;
- related cards and file blocks;
- media picker / upload entry points.

Rationale:
- these screens are the clearest examples of nested depth + dense cards + noisy support blocks;
- they also expose the duplication problem most clearly.

Allowed changes:
- use the shared shell;
- compress top forms;
- make the right rail compact and mostly static;
- reuse the existing media engine / gallery picker;
- remove or re-route duplicate quick-upload paths where they create a parallel flow.

Disallowed changes:
- building a new DAM-like media subsystem;
- inventing a second upload architecture;
- changing media truth or storage model.

Success criteria:
- gallery and media detail stop feeling like overloaded file dumps;
- one obvious path for upload/linking exists;
- the user can still understand what is primary, what is supporting, and what is related.

Proof package:
- list/detail screenshots for both screens;
- evidence that the shared media flow is reused rather than duplicated;
- before/after notes on density and rail behavior.

Risks:
- hiding duplication instead of removing it;
- making the media surface too abstract for non-technical users.

### Wave 3. Apply the shell to `Кейсы`, `Страницы`, `Услуги`

Goal:
- align the main nested content editors around one grammar and clean up the worst field semantics.

Scope:
- case detail;
- page detail;
- service detail;
- relation blocks;
- media blocks inside those editors;
- ambiguous field labels.

Rationale:
- these are the most important business-owner-facing surfaces;
- they currently share the same pattern-level UX problems and should be treated as one family.

Allowed changes:
- same shell grammar as Wave 1;
- consistent section order;
- clearer field labels;
- select/reference treatment for taxonomy-like fields;
- clearer helper text where meaning is stable;
- reuse of gallery/media engine in case flows.

Disallowed changes:
- changing route ownership;
- changing workflow truth;
- expanding the content model just to avoid naming work;
- inventing a new content-builder pattern.

Field semantics that likely belong here:
- before renaming `Смысл изменения`, decide whether the field belongs in the user-facing form at all; if it is purely an internal audit/workflow field, the right fix may be to remove it from the visible editor rather than rename it.
- `Тип проекта`;
- `Короткий адрес`;
- `Смысл изменения`;
- `Название` vs `Подпись`;
- similar internal-sounding labels that should become context-first.

Success criteria:
- the screens stop sounding like backend forms;
- a non-technical user can infer what each field does from the label and placement;
- there is no separate “quick upload” branch that competes with the gallery flow.

Proof package:
- field-label delta list;
- screenshots before/after for the edited screens;
- terminology notes for any field that had to stay professional rather than fully plain-language.

Risks:
- drifting into a data-model rewrite;
- over-simplifying taxonomy fields until the business meaning is lost.

### Wave 4. Rework `Пользователи` as a lighter CRUD variant

Goal:
- make `Пользователи` feel like a complete management surface instead of a cramped split.

Scope:
- `Пользователи` list;
- `Пользователи` form;
- roles / state presentation;
- list/detail relationship.
- list should expose role, last activity, and access state so the surface works as an operational control panel, not only as an edit form.
- add and deactivate actions should stay explicit and low-friction.

Rationale:
- the `Пользователи` screen is structurally different from nested content editors;
- it should share the same shell grammar, but not the same heavy editor composition.

Recommended direction:
- use a lighter split-view CRUD layout;
- keep the list clearly visible, either in a secondary panel or a stable list column;
- keep the form readable and less crowded;
- preserve simple list-to-detail navigation.

Allowed changes:
- layout split;
- form spacing;
- list placement;
- action hierarchy.

Disallowed changes:
- turning `Пользователи` into a pseudo-nested content editor;
- redesigning the role model;
- introducing unnecessary complexity because other screens have relations.

Success criteria:
- the screen reads as a proper CRUD control surface;
- the user can move between list and form without visual strain;
- the list no longer feels bolted onto a cramped form.

Proof package:
- `Пользователи` list/detail screenshots;
- evidence that the chosen layout is more readable than the current one;
- notes on why the final split direction was chosen.
- evidence that the list still supports Superadmin access management cleanly.

Risks:
- trying to force `Пользователи` into the same pattern as media/gallery/case screens;
- overcomplicating the screen with extra hierarchy.

### Wave 5. Consistency QA and polish

Goal:
- prove that the pattern holds across all touched surfaces and that no new confusion was introduced.

Scope:
- all screens touched in Waves 1-4;
- route transitions;
- scroll behavior;
- empty/loading/error states if visible in the same surfaces;
- keyboard navigation, focus visibility, and Escape behavior for drawers/modals that appear on these surfaces.
- role transitions, review packet states, field/block jump anchors, audit timeline narrative, and publish side-effect checklist visibility.

Rationale:
- the plan only succeeds if the user experiences a stable grammar across screen switches.

Success criteria:
- no overlaps or obvious density regressions;
- breadcrumb/depth cues are consistent;
- right rail behavior is consistent;
- list/detail and nested/editor patterns feel coherent;
- `Пользователи` is the intended lighter variant, not an accidental exception.

Proof package:
- final screenshot matrix;
- route checklist;
- keyboard/focus notes for any modal or drawer interactions;
- role-by-role screenshot matrix for the landing surfaces and decision packets;
- notes on any residual oddities;
- final decision summary for any unresolved layout preference.

## 6. Owner-review map

### Can be done autonomously

- sticky sidebar / static shell behavior;
- breadcrumb/depth bar placement;
- right rail compaction and scroll threshold;
- spacing and section grouping;
- shell reuse across `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги`;
- list/detail split adjustments that do not alter process semantics;
- layout cleanup in `Настройки` and `Проверка`.

### Requires editorial or owner review

- any field rename that changes meaning rather than clarifying it;
- any switch from free text to select/reference for a business taxonomy field;
- any claim-sensitive wording around business truth, proof, or context;
- any wording that might blur `publish`, `review`, `readiness` or `rollback` meaning;
- the final choice for `Пользователи` if the layout starts to imply a different operation model.
- terminology decisions should be reviewed as one consolidated batch before Wave 3, not as one ticket per field. The working owner can collect the packet and approve it once.
- `Business Owner` decision packet structure and first-view ordering should be approved as a single layout packet, because it defines what the owner sees first and what they do not see.

### Requires final sign-off

- the shared shell grammar after it has been applied to all nested editor families;
- the `Пользователи` variant;
- the final terminology list for the ambiguous fields.

## 7. Suggested implementation architecture

This is intentionally a light architecture, not a new platform.

### Shell layer

- introduce one shared `nested editor shell` concept;
- make it a composable frame, not a monolithic universal component;
- keep the shell as a composition of independent primitives. If a single wrapper starts hiding different layouts behind many props, treat that as a smell rather than a success.
- split it into:
  - global sidebar;
  - top depth/breadcrumb bar;
  - main editor column;
  - compact support/status rail;
  - optional local subnavigation or section anchors if a screen family needs them.

### Screen configuration

- drive the shell by per-screen config rather than per-screen ad hoc layout hacks;
- let each family declare:
  - title;
  - section order;
  - which actions are primary;
  - which support blocks are always visible;
  - whether a depth bar is shown.
- configuration may only choose among existing primitives and their order/visibility; it must not become a place where new one-off layout modes are invented.

### Role-aware surface layer

- role-aware config may change landing content, summary ordering, and packet density, but not core shell primitives or workflow meaning;
- `SEO Manager` landing should privilege queue and next action;
- `Business Owner` landing should privilege decision packet, preview, and risk notes;
- `Superadmin` landing should privilege operational control, publish consequences, and access management;
- comments, validation hints, and timeline items should carry anchors so users can jump back to the exact field or block.

### Reuse rules

- reuse the same panel, section, action-bar and spacing tokens everywhere;
- do not invent a second spacing language for `Пользователи`;
- do not invent a second media flow for cases/pages;
- do not split gallery/media truth into parallel upload concepts.

### Media and relation behavior

- keep picker interactions in drawers / panels where possible;
- prefer reuse and linking over raw upload duplication;
- if a screen needs a shortcut into media, make sure it routes through the same media engine.

### Copy / semantics handling

- when a label is ambiguous, clarify it in place;
- when a field is actually a reference or taxonomy, show it as such;
- avoid `developer-speak` labels unless the professional term is genuinely necessary;
- do not hide operational truth to make the form look simpler.

## 8. Verification strategy

Verify by screen family, not by isolated components.

### What to check

- sidebar remains available on long pages;
- depth / breadcrumb is visible on nested surfaces;
- right rail behaves as a support area, not a runaway scroll companion;
- there is no visual crowding in the top form zone;
- `Пользователи` reads as a proper CRUD surface;
- media and gallery reuse one flow;
- case/page/service details use the same grammar and section order.
- `SEO Manager`, `Business Owner`, and `Superadmin` land on the right first-view packet for their role.
- review comments, validation messages, and field-level notes jump back to the exact field or block instead of leaving the user to search.
- audit timeline reads as a human story, and publish side effects are visible before confirmation.

### Route checklist

- `Админка` shell / dashboard;
- `Настройки`;
- `Проверка`;
- `Медиа`;
- `Галереи`;
- `Кейсы`;
- `Страницы`;
- `Услуги`;
- `Пользователи`.

### Evidence to capture

- screenshots before/after;
- scroll behavior notes;
- route-by-route pass/fail notes;
- terminology diffs for any ambiguous field labels;
- notes on any residual content/data-owned oddities that are not a layout bug.

### Regression guardrails

- no overlap of controls;
- no accidental hiding of workflow or status context;
- no loss of route ownership clarity;
- no new duplicated upload path;
- no change in publish/review/readiness semantics.

## 9. Risks and anti-patterns

- fixing each screen independently and reintroducing drift on the next one;
- turning the shared shell into a giant universal editor;
- forcing `Пользователи` into a nested-editor pattern that hurts CRUD clarity;
- changing content-model meaning to dodge a label problem;
- adding a second navigation logic in the sidebar instead of using a clear depth bar;
- hiding media duplication instead of reusing the existing media engine;
- leaving proof-data noise mixed with layout judgment, which makes the UI harder to assess honestly.

## 10. Ready-for-implementation handoff

Concise brief for the next implementation pass:

1. Build the shared shell grammar first.
2. Pilot it on `Настройки` and `Проверка`.
3. Roll it through `Медиа` and `Галереи`.
4. Apply the same grammar to `Кейсы`, `Страницы`, `Услуги`.
5. Rework `Пользователи` as a lighter CRUD variant.
6. Keep field semantics review-gated only where meaning could change.
7. Verify every family with screenshots and route-by-route notes.

The next agent prompt should focus first on Wave 0 and Wave 1:
- define the shared shell contract;
- make the sticky sidebar / depth bar / right rail behavior consistent;
- prove it on two representative screens before touching the rest.
