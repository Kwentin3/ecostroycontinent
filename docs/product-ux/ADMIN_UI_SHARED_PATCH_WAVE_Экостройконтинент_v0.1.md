# ADMIN UI Shared Patch Wave for Экостройконтинент v0.1

Дата: 2026-03-29  
Тип: `patch wave` / `shared-component bugfix plan` / `post-deploy UX cleanup`  
Назначение: узкий план исправлений по итогам live systemic review без нового UX-эпика

## 1. Executive summary

Нужен не новый redesign и не новый большой UX-эпик.  
Нужна одна узкая волна shared-component правок по уже подтверждённым системным дефектам.

Эта patch wave опирается на:

- [ADMIN_UI_POST_DEPLOY_SYSTEMIC_REVIEW_Экостройконтинент_v0.1.report.md](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-03-29/ADMIN_UI_POST_DEPLOY_SYSTEMIC_REVIEW_Экостройконтинент_v0.1.report.md)
- [ADMIN_UI_POST_DEPLOY_AUTONOMOUS_REVIEW_PLAN_Экостройконтинент_v0.1.md](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/ADMIN_UI_POST_DEPLOY_AUTONOMOUS_REVIEW_PLAN_Экостройконтинент_v0.1.md)

## 2. Scope

In scope:

- shared entity list CTA copy
- desktop editor right-rail containment
- `Рабочая карточка` density reduction
- center vs right-rail role separation
- narrow verification matrix after patch

Out of scope:

- новый page builder
- новый dashboard
- redesign media workspace
- redesign review queue
- новые readiness semantics
- новые evidence semantics
- новые relation semantics
- schema/workflow changes

## 3. Patch laws

These rules are fixed for the whole patch wave.

### UI grammar law

Top = what is wrong and what to do now.  
Center = editing work.  
Right = compact diagnostics.

Do not blur this grammar during patching.

### Duplication law

If the operator reads the same meaning twice across:

- top block
- center
- right rail

that is a defect, not a UX flourish.

### Right-rail law

The right rail is not a second page.

It must stay:

- short
- compact
- supportive

If the rail needs table density or long narrative copy to work, the rail contract is already broken.

### Healthy-zone law

Do not touch healthy zones just to “unify style”.

Explicitly protected zones:

- `review`
- `publish`
- `history`
- `media workspace`

### Thin-patch law

Each fix in this wave should be a thin shared patch, not a local redesign and not a new product surface.

## 4. Priority order

### P1. Shared list CTA copy

Исправить битую подпись `Новый` на shared entity list routes.

Почему first:

- маленький объём;
- мгновенно заметный дефект доверия;
- уже локализован в одном shared route.

Expected impact zone:

- `app/admin/(console)/entities/[entityType]/page.js`
- `lib/ui-copy.js`

### P2. Desktop right-rail containment

Исправить правую панель на editor surfaces как desktop rail contract problem.

Обязательные принципы:

- не расширять scope до общего redesign;
- не тащить в rail табличную плотность, которую он не выдерживает;
- сделать rail честно компактным.

Required direction:

- убрать table-heavy rendering из узкой правой панели;
- перевести evidence/readiness в stacked or card-like format;
- зафиксировать внутренний overflow contract;
- убедиться, что chips, pills и CTA помещаются в rail без клиппинга.

Expected impact zone:

- `components/admin/EvidenceRegisterPanel.js`
- `components/admin/ReadinessPanel.js`
- `components/admin/admin-ui.module.css`

### P3. `Рабочая карточка`

Нужен owner-aligned выбор одного из трёх вариантов:

1. сделать сильно компактнее;
2. сделать сворачиваемой;
3. частично слить в верхний actionability block.

Правило:

- не сохранять текущий размерный вес блока без доказанной operator utility.

Expected impact zone:

- `components/admin/EntityEditorForm.js`
- `components/admin/SurfacePacket.js`
- `lib/admin/screen-copy.js`

### P4. Role split between top block, center, and right rail

Зафиксировать одну грамматику и больше её не размывать:

- верхний блок = что не так и что делать сейчас;
- центр = редактирование;
- правая панель = компактная диагностика, доказательства и вспомогательная навигация.

Правило:

- правая панель не должна второй раз пересказывать то, что уже сказано в центре;
- центр не должен повторять rail diagnostics длинным summary block.

Expected impact zone:

- `components/admin/EntityEditorForm.js`
- `components/admin/EntityActionabilityPanel.js`
- `components/admin/ReadinessPanel.js`
- `components/admin/EvidenceRegisterPanel.js`

## 5. Execution chain

The patch wave is executed as a chain of small shared fixes, not as one broad cleanup PR.

### Step 1. Shared list CTA copy

Goal:

- replace corrupted `Новый` on shared entity list routes;
- keep the fix isolated to the shared list route and shared copy source.

Acceptance:

- `service`, `case`, and `page` list routes show normal Russian CTA text;
- no new copy regressions appear in surrounding list headers.

### Step 2. Desktop right-rail containment

Goal:

- make the editor right rail readable and contained at desktop widths;
- stop putting rail content into shapes that exceed the rail contract.

Acceptance:

- no clipping or overflow at `1440` and `1280`;
- rail content remains readable at `1024`;
- no table-heavy evidence rendering remains inside the narrow rail if it still causes overflow.

### Step 3. `Рабочая карточка`

Goal:

- reduce its size and competition with the edit form.

Acceptance:

- the block is either compact, collapsible, or materially reduced;
- it no longer dominates the center column before the actual work area.

Owner boundary:

- if the choice between compact / collapsible / folded changes the meaning of the editor flow, stop for owner confirmation.

### Step 4. Role split cleanup

Goal:

- remove repeated meaning between top block, center, and right rail;
- preserve one clear role for each layer.

Acceptance:

- top block = immediate operator action;
- center = edit surface;
- right rail = compact diagnostics/evidence/helper navigation;
- one meaning is not repeated across all three.

### Step 5. Narrow regression pass

Goal:

- verify that the patch wave stayed thin and did not damage healthy zones.

Acceptance:

- list routes healthy;
- editor routes healthy;
- `review` and `media workspace` still look unchanged unless they were directly affected by a shared CSS/copy fix.

## 6. Explicit non-goals

Do not touch these surfaces in this patch wave without a separate reason:

- `review`
- `publish`
- `history`
- `media workspace`

Reason:

- systemic review showed these areas as comparatively healthier;
- they should serve as contrast examples, not as accidental victims of broad cleanup.

## 7. Execution order

1. Patch shared list CTA copy.
2. Patch desktop right-rail containment.
3. Apply owner-approved treatment to `Рабочая карточка`.
4. Trim duplicated roles between center and right rail.
5. Run narrow regression matrix.

Hard rule:

- do not mix “copy fix” and “role redesign” into one unfocused pass unless they touch the same shared component naturally.

## 8. Micro gate before every PR

Before merging any patch in this wave, answer four binary questions:

1. Are there any mojibake or broken Russian CTA/heading labels?
2. Does the right rail remain inside the viewport?
3. Is the same meaning repeated across top, center, and right?
4. Did the flow become harder or click-heavier?

If any answer is `yes`, do not merge.

## 9. Quality gate

Every patch in this wave must pass:

1. viewport checks at `1440`, `1280`, `1024`, `768`
2. Russian CTA and heading check
3. right-rail containment check
4. duplication check:
   - top block
   - center summary
   - right rail

Binary gate:

- if one meaning is repeated across all three layers without clear role separation, the patch is not done.

## 10. Stop triggers

Stop and reframe if:

- fixing the rail requires new evidence semantics;
- fixing duplication requires new readiness semantics;
- the patch starts dragging `media` or `review` into a general cleanup;
- the team cannot decide the role of `Рабочая карточка`.

## 11. Definition of done

Patch wave is done when:

1. shared list CTA renders normal Russian text on all entity list routes;
2. editor right rail no longer clips or overflows on desktop;
3. `Рабочая карточка` no longer dominates the center with low utility;
4. top block, center, and right rail have clearly different roles;
5. `media` and `review` remain untouched unless an explicit regression is found;
6. the narrow viewport/copy/duplication quality gate passes.
