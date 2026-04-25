# PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0

Дата: 2026-04-25
Контур: deployed runtime/admin `https://ecostroycontinent.ru`
Режим: GUI-first writes через Playwright, read-only диагностика через deployed runtime/server.

## 1. Executive Verdict

**Done with warnings.**

Через web GUI админки создана и опубликована Service-сущность `Аренда строительной техники` со slug `arenda-tehniki`. Услуга связана с 5 существующими Equipment records. Все 5 Equipment records имеют active published revision. Public route `/services/arenda-tehniki` отвечает `200`, но ожидаемо показывает holding page `В разработке`, потому что persisted display mode остался `under_construction`.

Главное предупреждение: контентный контур работает, но текущий публичный `ServicePage` renderer для связанных Equipment cards остаётся **PARTIAL**: по коду он выводит `title` и `capabilitySummary || shortSummary || equipmentType`, но не выводит фото, `keySpecs`, `usageScenarios`, `operatorMode` и per-equipment CTA.

## 2. Source Docs Read

- `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`
- `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.report.md`
- `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.ADDENDUM.RUNTIME_CONTEXT.report.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`

## 3. Runtime Contour

| Check | Result |
| --- | --- |
| Base URL | `https://ecostroycontinent.ru` |
| Health | `200`, `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}` |
| Admin route | `/admin` opened after GUI login |
| Public route | `/services/arenda-tehniki` returned `200 text/html` |
| Display mode before | `under_construction`, reason `не готв`, `2026-04-25T11:39:51.315853+00:00` |
| Display mode after | still `under_construction`, unchanged |
| Local DB as source of truth | not used |
| Runtime data source | deployed admin/runtime; read-only SQL only for verification |

Final deployed inventory snapshot:

| entity_type | total | active published |
| --- | ---: | ---: |
| `equipment` | 5 | 5 |
| `global_settings` | 1 | 1 |
| `media_asset` | 5 | 5 |
| `page` | 1 | 0 |
| `service` | 1 | 1 |

## 4. GUI / Playwright Evidence

Main evidence directory:

`docs/reports/2026-04-25/assets/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0/`

Machine-readable evidence:

`docs/reports/2026-04-25/assets/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0/evidence.json`

Key screenshots:

| Screenshot | Meaning |
| --- | --- |
| `01-admin-login-success.png` | successful admin login/dashboard |
| `02-equipment-list.png` | Equipment registry visible in admin GUI |
| `02-equipment-*-editor.png` | each Equipment editor opened and inspected |
| `03-media-*-*.png` | linked Media inspector opened for each Equipment |
| `08-equipment-*-review.png` | owner review surface where applicable |
| `08-equipment-*-publish-readiness.png` | publish readiness surface |
| `08-equipment-*-published.png` | editor after GUI publish |
| `05-service-editor-filled.png` | Service editor filled and linked to 5 Equipment records |
| `09-service-arenda-tehniki-review.png` | Service owner review surface |
| `09-service-arenda-tehniki-publish-readiness.png` | Service publish readiness surface |
| `09-service-arenda-tehniki-published.png` | Service editor after GUI publish |
| `12-public-service-arenda-tehniki-under-construction.png` | public route holding page |
| `13-public-service-display-override-attempt.png` | query override attempt still held by persisted under_construction |

Browser diagnostics:

- Browser console errors/warnings captured by Playwright: `0`.
- HTTP `5xx` responses captured by Playwright: `0`.
- `requestfailed` events: many `net::ERR_ABORTED` events during Next RSC prefetch/navigation. No HTTP `500` and no visible route breakage were observed.

## 5. Equipment Inventory

| slug | title | publish status | media status | keySpecs | usageScenarios | operatorMode | linked to Service | notes |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| `zauberg-e370-c` | Гусеничный экскаватор ZAUBERG E370-C | active published | primary media reachable | 6 | 3 | С экипажем | yes | published via GUI after prior approved review |
| `zauberg-wl28` | Фронтальный погрузчик ZAUBERG WL28 | active published | primary media reachable | 6 | 3 | С экипажем | yes | submitted, approved, published via GUI in first pass |
| `lonking-cdm307` | Мини-погрузчик Lonking CDM307 | active published | primary media reachable | 6 | 3 | С экипажем | yes | submitted, approved, published via GUI in first pass |
| `zauberg-ex-210cx` | Гусеничный экскаватор ZAUBERG EX-210CX | active published | primary media reachable | 6 | 3 | С экипажем | yes | submitted, approved, published via GUI in first pass |
| `zauberg-ex-210c` | Гусеничный экскаватор ZAUBERG EX-210C | active published | primary media reachable | 6 | 3 | С экипажем | yes | latest draft revision published via GUI |

Final active revisions:

- `zauberg-e370-c` -> `rev_7dddf19a-b057-4b5f-a69c-86f754d63dda`
- `zauberg-wl28` -> `rev_cb6f043f-c1a7-4acc-a149-0309cfad7e4f`
- `lonking-cdm307` -> `rev_9e1e6998-3a73-4bce-b1c5-5822ddd16d48`
- `zauberg-ex-210cx` -> `rev_925083dd-b004-430a-855b-37ecae49edb5`
- `zauberg-ex-210c` -> `rev_8b4390c2-fbfe-40a0-8f9f-46f5f3d28cd3`

## 6. Media Inventory

| equipment slug | media asset | image reachable | alt | caption | source | ownership | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `zauberg-e370-c` | `entity_193254fe-2ef2-4dba-b10a-c16c694e7557` | yes, `200` | yes | yes | yes | missing | non-blocking warning |
| `zauberg-wl28` | `entity_1fbc176c-467e-46bd-8a52-95391b12ecfb` | yes, `200` | yes | yes | yes | missing | non-blocking warning |
| `lonking-cdm307` | `entity_dd72e28d-36eb-4638-93b1-bb99590a6800` | yes, `200` | yes | yes | yes | missing | non-blocking warning |
| `zauberg-ex-210cx` | `entity_b70746e6-13cc-49ba-9198-bcd0cf1101ab` | yes, `200` | yes | yes | yes | missing | non-blocking warning |
| `zauberg-ex-210c` | `entity_06107869-2e15-43ca-b251-11d7505519e3` | yes, `200` | yes | yes | yes | yes | ok |

Media are represented as stable `media_asset` entities and linked by IDs from Equipment. No raw URL chaos was introduced. No media files were replaced or deleted.

## 7. Service Entity

| Field | Value |
| --- | --- |
| title | `Аренда строительной техники` |
| slug | `arenda-tehniki` |
| route | `/services/arenda-tehniki` |
| entity id | `entity_a380afe4-354f-40f4-a386-b13fee79b954` |
| active published revision | `rev_4e385216-7ed5-4b41-a986-62c274a81ad2` |
| h1 | `Аренда строительной техники` |
| CTA | `Уточнить наличие техники` |
| SEO title | `Аренда строительной техники` |
| SEO description | `Аренда строительной техники с экипажем для строительных, земляных и погрузочных работ. Подбор техники под задачу, фото и характеристики машин.` |
| primary media | empty |
| related cases | none |
| galleries | none |
| publish status | active published |

Linked Equipment:

- `zauberg-e370-c` / `entity_7ae65a36-0b71-42c1-8663-788598f2bb51`
- `zauberg-wl28` / `entity_4aea6ed9-8e5a-494b-95a1-bff9fa10cf93`
- `lonking-cdm307` / `entity_4f702f45-5b81-42c1-8663-788598f2bb51`
- `zauberg-ex-210cx` / `entity_6e587cac-da12-4911-8955-fd301f2cc6e5`
- `zauberg-ex-210c` / `entity_85793a87-4d33-4f3b-9da2-0af0ba8ee612`

No prices, deadlines, guarantees, or unconfirmed region promises were added.

## 8. Public Route Check

| Route | Status | Observed behavior |
| --- | ---: | --- |
| `/services` | 200 | holding page, `В разработке` |
| `/services/arenda-tehniki` | 200 | holding page, title `Услуга — в режиме подготовки` |
| `/services/arenda-tehniki?__display_mode=published_only` | 200 | still holding page because persisted `under_construction` has priority |
| `/cases` | 200 | holding page |
| `/contacts` | 200 | holding page |
| `/api/health` | 200 | JSON health ok |

The public route exists and responds, but current public HTML intentionally does not render the published Service because the global display mode is still `under_construction`. This is expected and was not changed.

Relevant code evidence:

- `app/services/[slug]/page.js:59` returns `PublicHoldingPage` while `runtimeDisplayMode.underConstruction` is true.
- `app/services/[slug]/page.js:77` uses `getPublishedServiceBySlug(slug)` when the public mode allows detail rendering.
- `app/services/[slug]/page.js:95` resolves Equipment via `resolveEquipmentRecordsForEntity`.
- `components/public/PublicRenderers.js:747` renders related Equipment section.
- `components/public/PublicRenderers.js:752` currently renders only `capabilitySummary || shortSummary || equipmentType` for each Equipment card.

## 9. Findings

OK:

- Admin GUI login works with project credentials.
- Equipment records can be opened and inspected through GUI.
- Equipment publish flow works through GUI: submit/review/approve/publish.
- Service can be created through GUI as a real `service` entity, not as `page` or ad hoc landing.
- Service can link to all 5 Equipment records through GUI checkboxes.
- Service publish flow works through GUI.
- `/services/arenda-tehniki` route exists and returns `200`.
- Global display mode stayed `under_construction`.
- No `/equipment` public domain was created; repo path `app/equipment` is absent.
- Local unit suite passed: `npm test` -> 358 passed, 0 failed.

Warnings:

- Public visual render of the actual published Service is blocked by intentional `under_construction`; Playwright verified the holding page, not the full ServicePage UI.
- Current ServicePage renderer is thin for rental intent: related Equipment cards omit photos, specs, usage scenarios, operator mode, galleries, and per-card CTA.
- 4 of 5 media assets have empty `ownershipNote`; publish gate treats this as warning, not blocker.
- Playwright captured many `net::ERR_ABORTED` requestfailed events from route transitions/RSC prefetches; no HTTP 500 responses were captured.

Blockers:

- None for the content contour.
- For public/live launch of this service page, the renderer gap should be treated as a P0/P1 follow-up depending on owner tolerance for a thin first public page.

Follow-up:

- Improve ServicePage Equipment card rendering for rental intent.
- Add contextual CTA around rental availability/request.
- Consider setting a Service-level `primaryMediaAssetId` or rendering Equipment primary images directly.
- Add media ownership notes for the 4 assets that currently lack them.

## 10. Renderer Gap Decision

**PARTIAL.**

The current ServicePage renderer is enough to prove that Service -> Equipment linking works, but it is not rich enough for a strong public rental page. It can show the Service hero/scope and related Equipment titles plus a short capability/summary line. It does not show the Equipment evidence users expect for rental evaluation.

Missing from public Equipment cards:

- photo / `primaryMediaAssetId`;
- `keySpecs`;
- `usageScenarios`;
- `operatorMode`;
- media gallery;
- per-equipment CTA / availability action.

Recommended separate code epic:

`Improve service page equipment cards rendering for rental intent`.

## 11. Safety Confirmation

| Safety item | Result |
| --- | --- |
| direct SQL writes | no |
| direct write API calls | no |
| write operations through GUI only | yes |
| public display mode changed | no |
| `/equipment` domain created | no |
| Page-owned `service_landing` created | no |
| Page-owned `equipment_landing` created | no |
| destructive operations | no |
| secrets exposed in report | no |
| runtime code changed | no |

Read-only SQL was used only to verify runtime state before/after GUI actions.

## 12. Files And Data Changed

Repository files:

- This report.
- Playwright evidence assets under `docs/reports/2026-04-25/assets/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0/`.

Runtime/deployed data changed through GUI:

- Published Equipment revisions for the 5 target Equipment records.
- Created and published Service `arenda-tehniki`.
- Linked Service `arenda-tehniki` to the 5 target Equipment records.

Runtime code unchanged.

## 13. Commit / Push

Report and evidence artifacts should be committed and pushed after report creation. Runtime/admin data changes already happened through deployed GUI and are not represented as code changes.
