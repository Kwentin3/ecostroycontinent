# ADMIN UI Shared Patch Wave Execution Report for Экостройконтинент v0.1

Дата: 2026-03-29  
Тип: `execution report` / `shared-component patch wave` / `post-deploy UX fixes`

## 1. Executive summary

Patch wave выполнен целиком в узком shared-scope без нового UX-эпика.

Что закрыто:

- битый CTA `Новый` на shared entity list routes;
- desktop overflow правого rail на editor surfaces;
- раздутая `Рабочая карточка` в first-slice editor flows;
- смысловой дубль между верхним actionability block, центром и правой панелью.

Что сознательно не трогалось:

- `review`
- `publish`
- `history`
- `media workspace`
- `readiness / evidence / relation semantics`

Итог: patch wave прошёл узко и безопасно. Shared UX стал чище, а healthy zones не были втянуты в общий redesign.

## 2. Changed files

- [page.js](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/page.js)
- [EntityEditorForm.js](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js)
- [EvidenceRegisterPanel.js](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EvidenceRegisterPanel.js)
- [admin-ui.module.css](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/admin-ui.module.css)

## 3. What was implemented

### 3.1 Shared list CTA

- список `service / case / page` теперь использует нормальный shared label `Новый`;
- mojibake `РќРѕРІС‹Р№` удалён из shared route.

### 3.2 Desktop right-rail containment

- editor right rail получил отдельный `editorRail` contract;
- readiness summary в rail складывается компактнее и не распирает колонку;
- evidence inside rail переведён из table-heavy rendering в stacked card list;
- rail panels теперь живут внутри своей ширины и не создают horizontal overflow.

### 3.3 Working card reduction

- для `global_settings / service / case / page` блок `Рабочая карточка` больше не доминирует центр;
- вместо большого summary block он стал компактной disclosure-памяткой;
- основная рабочая форма снова стала главным центральным слоем.

### 3.4 Role split

Зафиксирован реальный role split:

- top = immediate actionability;
- center = editing work;
- right = compact diagnostics and evidence navigation.

Дополнительно:

- убран лишний jump-button к реестру доказательств из rail, потому что сам реестр уже видим в rail;
- центр больше не повторяет state/blockers/published summary длинным блоком перед формой.

## 4. Verification

### Automated

- `npm test` -> `57/57 passed`
- `npm run build` -> passed

### Local GUI smoke

Проверка шла на локальном production runtime.

Shared CTA:

- `service` list -> найден `Новый`
- `case` list -> найден `Новый`
- `page` list -> найден `Новый`

Viewport metrics for `global_settings` editor:

- `1440`: `hasHorizontalOverflow = false`, `railWidth = 360`, `evidenceWidth = 345`
- `1280`: `hasHorizontalOverflow = false`, `railWidth = 360`, `evidenceWidth = 345`
- `1024`: `hasHorizontalOverflow = false`, `railWidth = 360`, `evidenceWidth = 345`
- `768`: `hasHorizontalOverflow = false`, `railWidth = 360`, `evidenceWidth = 345`

Operator checks:

- `Рабочая карточка` стала компактной и не забирает центр;
- right rail больше не выглядит как вторая страница;
- evidence в rail читается как компактная диагностика, а не как таблица, втиснутая в узкую колонку;
- top block, center and right rail больше не повторяют один и тот же смысл одинаковым весом.

## 5. Proof assets

- [page-list-cta-fixed-1440.png](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-03-29/assets/patch-wave/page-list-cta-fixed-1440.png)
- [editor-global-settings-1440.png](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-03-29/assets/patch-wave/editor-global-settings-1440.png)
- [editor-global-settings-768.png](D:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-03-29/assets/patch-wave/editor-global-settings-768.png)

## 6. Scope discipline

В patch wave не вносились:

- schema changes;
- readiness changes;
- evidence taxonomy changes;
- relation model changes;
- media workspace redesign;
- review/publish redesign.

## 7. Notes

Во время локального smoke на альтернативном порту `3001` форма логина редиректила на `localhost:3000`. Это не часть текущего shared UI patch wave и не потребовало кодовых изменений в рамках узкого scope. В production verification это место нужно оценивать отдельно, если появится отдельная инфраструктурная задача.

## 8. Status

`READY FOR COMMIT / PUSH / DEPLOY VERIFICATION`
