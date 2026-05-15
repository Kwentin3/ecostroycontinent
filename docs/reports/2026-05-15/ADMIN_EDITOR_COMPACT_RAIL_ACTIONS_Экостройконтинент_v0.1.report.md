# Admin Editor Compact Rail Actions - Экостройконтинент v0.1

Дата: 2026-05-15
Branch: `ui/compact-editor-rail-actions`

## Executive Verdict

Правая панель редактора карточки уплотнена без изменения workflow: повтор названия и описания убран, статусные поля сведены в компактную строку, основные действия заменены на icon-only toolbar с `aria-label` и `title`.

## Implemented

- `components/admin/EntityEditorForm.js`
  - удалён повтор крупного `surfaceTitle` и `surfaceSummary` из right rail;
  - `Версия`, `Рабочий статус`, `Публикация`, `Готовность` заменены на компактные pills;
  - `Сохранить`, `Отправить`, `Проверка`, `Публикация`, `История`, `Вернуться к источнику` стали компактными icon actions;
  - у icon actions есть доступные подписи и native tooltip.
- `components/admin/admin-ui.module.css`
  - добавлены `.editorStatusPills`, `.editorRailIconActions`, `.editorRailIconAction`;
  - задана стабильная кнопка 38x38px и `focus-visible`;
  - старый крупный `.editorStatusList` удалён.
- `tests/admin/entity-editor-refactor-ui.test.js`
  - обновлён structural guard на компактный right rail.

## UI Integrity

- Primary user action: сохранить черновик из редактора.
- Visible states: status pills показывают версию, рабочий статус, публикацию и готовность; подробные readiness/history панели сохранены ниже.
- Interaction clarity: icon-only actions имеют `aria-label`, `title`, keyboard focus state и остаются кнопками/ссылками по семантике.
- Feedback boundary: submit/navigation feedback остаётся в существующих route redirects и message/error panels.
- UI-domain boundary: бизнес-правила публикации, проверки и slug не менялись.

## Verification

Targeted tests:

```powershell
node --test tests/admin/entity-editor-refactor-ui.test.js tests/content-core.service.test.js tests/slug-normalization.test.js
```

Result: passed, 25/25.

Full suite:

```powershell
npm test
```

Result: passed, 492/492.

Build:

```powershell
npm run build
```

Result: passed.

Closed-world evidence:

- `.next/standalone` produced `server.js`, `.next`, `node_modules`, `.env`, `package.json`.
- `.next/standalone/package.json` dependencies unchanged.
- `package.json` and `package-lock.json` have no diff.
- `rg "editorRailIconActions|editorStatusPills|Действия карточки|готово · Б0 · П0" .next/standalone/.next/server -g "*.js"` finds the compact rail in the build artifact.

## Notes

No code comments were added. The compact rail helpers are small and self-explanatory; extra comments would be noisier than the code.
