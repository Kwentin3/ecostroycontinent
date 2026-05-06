# PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.V1

Дата: 2026-04-25

## 1. Executive verdict

DONE_WITH_WARNINGS.

Канон локальной географии сначала зафиксирован в документации, затем реализован минимальный P0-рефакторинг: Service теперь поддерживает собственную `serviceArea`/`serviceAreaNote`, наследует глобальную зону при пустом поле, а Case продолжает использовать `location` как доказательную географию. Код протестирован, образ собран и доставлен на deployed runtime.

Главное ограничение проверки: публичный сайт остаётся в `under_construction`, поэтому полный live-визуал ServicePage закрыт holding page. Это ожидаемо; display mode не переключался.

## 2. Docs updated

Обновлён канон:

- `docs/product-ux/Local_Geography_Model_Addendum_Экостройконтинент_v0.1.md`

Docs-first commit:

- `543ca3d docs: document local geography model`

Документ фиксирует:

- Company / Organization address: owner-approved physical/public/legal address, если подтверждён.
- Service coverage: коммерческая зона оказания конкретной услуги.
- Case location: факт выполненной работы, не обещание покрытия.
- P0 effective rule: `effectiveServiceArea = service.serviceArea || global.defaultServiceArea`.
- В текущем P0 `global_settings.serviceArea` является runtime-полем для `global.defaultServiceArea`.
- Service publish readiness должен принимать наследование глобальной зоны.
- SEO/schema использует `areaServed` из effective service area и не генерирует `PostalAddress` без подтверждённого адреса.

## 3. Canon decision

Выбрана модель:

- Global Settings = company/contact/local-business truth + default service area fallback.
- Service = route-owning commercial landing page with optional service-level coverage.
- Case = proof geography through `location`.

Адрес и регион не выдумывались. В P0 не вводилась отдельная ServiceArea entity/ref system, не создавались multi-region SEO pages, не использовался Page.targeting как владелец service route truth.

## 4. Implementation summary

Implementation commit:

- `773872c feat: support service-level geography fallback`

Сделано:

- Добавлен helper `lib/content-core/geography.js` для нормализации и вычисления `effectiveServiceArea`.
- Service schema/normalization/admin form получили optional `serviceArea` и `serviceAreaNote`.
- Service editor получил секцию "География услуги" с подсказкой о наследовании Global Settings.
- Service readiness теперь блокирует отсутствие effective geography и показывает info, если Service наследует глобальную зону.
- Public ServicePage показывает geography block из `service.serviceArea || global.serviceArea || global.primaryRegion`.
- `serviceAreaNote` выводится только при заполненном значении.
- Service structured data получает `areaServed` из effective service area.
- LocalBusiness schema не получила `PostalAddress`.
- Case cards/detail показывают `Локация: ...` только при заполненном `case.location`.

## 5. Files changed

Docs:

- `docs/product-ux/Local_Geography_Model_Addendum_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-25/PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.V1.report.md`
- `docs/reports/2026-04-25/assets/PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.service-arenda-snapshot.md`
- `docs/reports/2026-04-25/assets/PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.service-arenda-under-construction.png`

Code:

- `lib/content-core/geography.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/admin/entity-form-data.js`
- `lib/ui-copy.js`
- `lib/admin/editor-anchors.js`
- `lib/admin/entity-ui.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/EntityTruthSections.js`
- `lib/content-ops/readiness.js`
- `lib/public-launch/seo-structured-data.js`
- `components/public/PublicRenderers.js`
- `app/services/[slug]/page.js`
- `app/page.js`
- `lib/landing-factory/service.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/entities/[entityType]/new/page.js`

Tests:

- `tests/local-geography-model.test.js`

## 6. Service geography behavior

| Scenario | Result |
|---|---|
| `service.serviceArea` заполнена | ServicePage, metadata/schema и readiness используют service override. |
| `service.serviceArea` пустая, `global.serviceArea` заполнена | Service inherits global fallback; readiness даёт info, не blocker. |
| `service.serviceArea` пустая, global fallback отсутствует | Публичный block не рендерится, readiness фиксирует blocker `missing_effective_service_area`. |
| `serviceAreaNote` заполнена | Показывается под зоной оказания. |
| `serviceAreaNote` пустая/whitespace | Не рендерится. |

Фактический live content snapshot после deploy, read-only:

| Scope | serviceArea | defaultServiceArea | primaryRegion |
|---|---|---|---|
| global | Сочи и Большой Сочи |  | Сочи |
| service:arenda-tehniki |  |  |  |

Текущая `Аренда строительной техники` наследует глобальную зону. Production data через GUI/SQL/API не менялась.

## 7. Case location behavior

`case.location` трактуется только как proof geography.

Изменение в renderer:

- если `case.location` есть, карточка/detail page показывает подпись `Локация: ...`;
- если `case.location` пустая, подпись не появляется;
- `case.location` не участвует в `Service.areaServed`;
- `case.location` не превращается в promise, что услуга доступна в этой зоне всегда.

## 8. SEO/schema behavior

Service structured data:

- добавлен `Service` schema node для service pages;
- `areaServed` берётся из effective service area;
- `provider` ссылается на organization node;
- description берётся из service content.

LocalBusiness:

- physical `PostalAddress` не генерируется;
- false address не добавлялся;
- global contact/local signal остаётся отдельным от service coverage.

Metadata:

- service description получает фразу про effective zone только если она не дублирует уже имеющийся текст.

## 9. Empty-field behavior

Пустые значения не создают UI-блоки:

- whitespace-only `serviceArea` нормализуется в отсутствие значения;
- пустая effective geography не рендерит geography block;
- пустой `serviceAreaNote` не рендерится;
- пустой `case.location` не рендерит label;
- `undefined/null` не должны попадать в публичный текст.

## 10. Tests

Targeted geography tests:

- Command: `node --experimental-specifier-resolution=node --test tests/local-geography-model.test.js`
- Result: passed, 5/5.

Targeted regression set:

- Command: `node --experimental-specifier-resolution=node --test tests/public-seo-structured-data.test.js tests/public-contact-projection.test.js tests/public-equipment-cards.test.js tests/content-core.service.test.js tests/admin/entity-editor-refactor-ui.test.js tests/admin/editor-anchors.test.js`
- Result: passed, 36/36.

Service landing factory regression:

- Command: `node --experimental-specifier-resolution=node --test tests/service-landing-factory.test.js tests/service-landing-factory.route.test.js`
- Result: passed, 10/10.

Full suite:

- Command: `npm test`
- Result: passed, 371/371.

Build:

- Command: `npm run build`
- Result: passed; Next.js production build completed.

## 11. Build / CI

GitHub Actions build-and-publish:

- Run: `24938077494`
- URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/24938077494`
- Branch: `feat/local-geo-canon-then-refactor`
- SHA: `773872cd0ebc7bab3ba5d78a072151f10f70a353`
- Result: success.
- Image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f9085f45194602cf5a5257679164235c752b5834d0170e4afc2795017920e96f`

## 12. Deploy

GitHub Actions deploy-phase1:

- Run: `24938158539`
- URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/24938158539`
- Branch: `feat/local-geo-canon-then-refactor`
- SHA: `773872cd0ebc7bab3ba5d78a072151f10f70a353`
- Result: success.
- Deploy image ref: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f9085f45194602cf5a5257679164235c752b5834d0170e4afc2795017920e96f`

Server pin verification:

- `/opt/ecostroycontinent/runtime/app-image.env` contains the same pinned image ref.
- `repo-app-1` is up.
- `repo-sql-1` remains healthy.
- `ecostroycontinent-traefik` remains up.

## 13. Playwright / server verification

HTTP/server checks after deploy:

| URL | Status |
|---|---:|
| `/api/health` | 200 |
| `/api/public/display-mode` | 200 |
| `/` | 200 |
| `/services` | 200 |
| `/services/arenda-tehniki` | 200 |
| `/contacts` | 200 |
| `/cases` | 200 |
| `/equipment` | 404 |

Health response:

- `status: ok`
- `service: next-app`
- `nodeEnv: production`
- `databaseConfigured: true`

Display mode:

- `mode: under_construction`
- `underConstruction: true`
- `indexingSuppressed: true`

Playwright evidence:

- Opened: `https://ecostroycontinent.ru/services/arenda-tehniki`
- Page title: `Услуга — в режиме подготовки`
- Console errors: 0
- Snapshot: `docs/reports/2026-04-25/assets/PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.service-arenda-snapshot.md`
- Screenshot: `docs/reports/2026-04-25/assets/PUBLIC.LOCAL_GEO.CANON_THEN_REFACTOR.service-arenda-under-construction.png`

Full ServicePage render was not visible on public URL because the site intentionally remains in `under_construction`.

## 14. Remaining warnings

- Full visual verification of the service geography block on deployed public URL is blocked by `under_construction`.
- Current live `service:arenda-tehniki` has no service-specific `serviceArea`; it inherits `global.serviceArea = "Сочи и Большой Сочи"`.
- No production content data was changed in this epic. If owner wants a separate coverage phrase for rental, it should be entered through admin GUI in a follow-up content task.
- No cases are required for this change; case.location rendering is ready for future published cases.

## 15. Safety confirmation

- physical address invented: no
- regions invented: no
- public display mode changed: no
- production SQL writes: no
- direct production write API calls: no
- `/equipment` route created: no
- Page-owned service landing created: no
- Page-owned equipment landing created: no
- destructive operations: no
- secrets exposed: no

## 16. Final recommendation

Текущая P0-модель готова для launch-core: глобальная зона остаётся fallback, service pages могут получать собственную зону оказания, а кейсы показывают локацию как доказательство. Перед снятием `under_construction` стоит через админку решить, оставлять ли `Аренду строительной техники` на inherited global area или задать ей отдельную owner-approved service area.
