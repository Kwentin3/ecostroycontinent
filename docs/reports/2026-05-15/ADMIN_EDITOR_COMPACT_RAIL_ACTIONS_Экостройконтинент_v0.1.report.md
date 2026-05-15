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

## Delivery

- Code commit: `314927a56f1cd7e9e2008a8cfe90180724e3cd6e`.
- GitHub Actions build: `build-and-publish` run `25931274738`, success.
- Published image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:8be8f8321efc9821cbd1197a32ffa2152d5e0579e9db2f85dc1c86c4168e23a8`.
- Production deploy: `deploy-phase1` run `25931366347`, success.
- Readiness after deploy: `https://ecostroycontinent.ru/api/readiness` returned `status=ready`, `database.status=ok`, runtime commit `314927a56f1cd7e9e2008a8cfe90180724e3cd6e`.

Launch smoke on the domain:

```powershell
$env:APP_BASE_URL='https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT='true'
$env:EXPECT_MEDIA_URL='https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
```

Result: passed, 23/23 checks; 2 known content blockers remain for `/about` and `/contacts`.

Browser smoke on the domain:

- logged in through `/api/admin/login` as SEO manager;
- looked up service by slug `arenda-tehniki`;
- opened `/admin/entities/service/entity_a380afe4-354f-40f4-a386-b13fee79b954?returnTo=%2Fadmin%2Fentities%2Fservice`;
- verified `Аренда спецтехники` page content, compact status header, `v3`, `Изменений нет`, `Опубликовано`, `готово · Б0 · П0`;
- verified right status card no longer repeats `Аренда спецтехники`;
- verified icon actions `Сохранить черновик`, `История`, `Вернуться к источнику` render as 38x38 controls with `aria-label` and `title`.

## Notes

No code comments were added. The compact rail helpers are small and self-explanatory; extra comments would be noisier than the code.
