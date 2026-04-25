# PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0

Дата: 2026-04-25
Контур: code implementation -> GitHub Actions image build -> deploy-phase1 -> deployed runtime verification
Target route: `/services/arenda-tehniki`

## 1. Executive Verdict

**DONE_WITH_WARNINGS.**

Renderer gap закрыт на уровне code/rendering layer: `ServicePage` теперь строит расширенные карточки связанной техники через published `Equipment` + `MediaAsset` refs. Карточки поддерживают фото, тип техники, описание, режим работы, характеристики, сценарии применения, gallery assets и CTA. Empty-field rule вынесен в pure model и покрыт targeted tests.

Главное ограничение проверки: deployed site всё ещё находится в `under_construction`, поэтому полный публичный визуальный render `/services/arenda-tehniki` намеренно закрыт holding page. Display mode не переключался.

## 2. What Changed

- В `components/public/PublicRenderers.js:253` добавлен `EquipmentCardsSection` для service detail.
- В `components/public/PublicRenderers.js:794` `ServicePage` собирает `equipmentCardsModel` из `relatedEquipment`, `resolveMedia`, `galleries` и service-level CTA.
- В `lib/public-launch/equipment-card-model.js:93` добавлена pure-модель `buildEquipmentCardModel`, которая очищает строки/массивы и отсекает пустые UI-блоки до JSX.
- В `lib/public-launch/equipment-card-model.js:137` добавлена `buildEquipmentCardsSectionModel`, которая не рендерит секцию, если usable cards нет.
- В `components/public/public-ui.module.css:757` добавлены responsive styles для equipment cards.
- В `tests/public-equipment-cards.test.js` добавлены targeted tests для full/partial/minimal/empty scenarios и guard, что `/equipment` route не появился.

Теперь карточка техники умеет показывать:

- `primaryMediaAssetId` -> resolved `MediaAsset.previewUrl`;
- `title`;
- `equipmentType`;
- `capabilitySummary`, fallback `shortSummary`, fallback `equipmentType`;
- `operatorMode`;
- `keySpecs`;
- `usageScenarios`;
- resolved gallery assets;
- service-level CTA/action.

## 3. Files Changed

Code:

- `components/public/PublicRenderers.js`
- `components/public/public-ui.module.css`
- `lib/public-launch/equipment-card-model.js`

Tests:

- `tests/public-equipment-cards.test.js`

Docs/evidence:

- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0.report.md`
- `docs/reports/2026-04-25/assets/PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0/*`

No route files were added. `app/equipment` remains absent.

## 4. Equipment Card Rendering Behavior

| Field | Rendered when | Hidden when empty | Fallback | Test coverage |
| --- | --- | --- | --- | --- |
| `primaryMediaAssetId` / photo | ID resolves through `resolveMedia` to asset with `previewUrl` | no ID, missing asset, missing `previewUrl` | `alt` falls back to media title, equipment title, equipment type | full data, partial data, whitespace |
| `title` | non-empty after trim | empty | card may still render from summary/type; card skipped if no title and no summary | full, partial, minimal, section model |
| `equipmentType` | non-empty after trim | empty | used as summary fallback | full, minimal, whitespace |
| `capabilitySummary` | non-empty after trim | empty | preferred summary | full |
| `shortSummary` | non-empty and no capability summary | empty | second summary fallback | partial |
| `keySpecs` | cleaned list has items | empty array / whitespace-only items | none | full, partial, minimal, empty arrays |
| `usageScenarios` | cleaned list has items | empty array / whitespace-only items | none | full, partial, minimal, empty arrays |
| `operatorMode` | non-empty after trim | whitespace / missing | none | full, partial, empty whitespace |
| `CTA` | contact action has `href` and label | missing href or label | service `ctaVariant`, then contact projection label | full, partial, minimal, whitespace |
| `galleryIds` | galleries resolve and contain assets with `previewUrl` | no galleries or no resolved assets | primary media is de-duplicated out of gallery strip | full data |

## 5. Empty Field Rendering Proof

Targeted tests validate:

- full data card shows media, title, summary, operator mode, specs, scenarios, gallery and CTA;
- partial card omits image, usage scenarios and operator mode while keeping title, summary and specs;
- minimal card renders title/type without empty media, details or CTA;
- empty arrays and whitespace-only fields do not produce section headings, buttons, operator rows or image slots;
- section model returns `null` when equipment list is empty or unusable;
- renderer source still targets service-related equipment and no public `/equipment` route exists.

Commands:

- `node --experimental-specifier-resolution=node --test tests/public-equipment-cards.test.js`
- Result: `6 passed, 0 failed`.

## 6. Tests

Local shell context: Windows PowerShell in repo root.

| Command | Result |
| --- | --- |
| `node --experimental-specifier-resolution=node --test tests/public-equipment-cards.test.js` | pass, 6/6 |
| `npm test` | pass, 364/364 |
| `npm run build` | pass, Next.js production build OK |

No tests required local production/stage DB as source of truth. No local DB conclusions were made.

## 7. Build / CI

GitHub Actions image build:

- Workflow: `build-and-publish.yml`
- Run: `24933140010`
- Status: success
- Commit: `b43041c01ef2fabc4057f7f63c25f8ff086f2191`
- Image tags:
  - `ghcr.io/kwentin3/ecostroycontinent-app:feat-rental-equipment-cards-renderer-p0`
  - `ghcr.io/kwentin3/ecostroycontinent-app:sha-b43041c`
- Digest:
  - `sha256:a1d7e86967412b19a6005612f7f6de4025f2c18ce22f609b0a3296fe847abd0e`

No PR was opened for this stacked branch. Deploy was performed from the feature ref through the existing manual image-pinning pipeline; opening a PR to `main` directly would include prior stacked branch history.

## 8. Deploy

Deploy workflow:

- Workflow: `deploy-phase1.yml`
- Run: `24933188205`
- Status: success
- Branch/ref: `feat/rental-equipment-cards-renderer-p0`
- Image ref:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:a1d7e86967412b19a6005612f7f6de4025f2c18ce22f609b0a3296fe847abd0e`

Read-only server verification:

- `/opt/ecostroycontinent/runtime/app-image.env` contains the pinned image ref above.
- `repo-app-1` is up after deploy.
- `repo-sql-1` remains up and healthy.
- `ecostroycontinent-traefik` remains up.

## 9. Playwright / Browser Verification

Evidence directory:

`docs/reports/2026-04-25/assets/PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0/`

Screenshots:

- `services-index-desktop.png`
- `service-arenda-tehniki-desktop.png`
- `service-arenda-tehniki-display-override-desktop.png`
- `service-arenda-tehniki-mobile.png`
- `cases-desktop.png`
- `contacts-desktop.png`
- `equipment-404-desktop.png`

Machine-readable evidence:

- `evidence.json`

Playwright checks:

| URL | Status | Result |
| --- | ---: | --- |
| `/api/health` | 200 | JSON health OK |
| `/api/public/display-mode` | 200 | `mode=under_construction`, `underConstruction=true` |
| `/services` | 200 | holding page |
| `/services/arenda-tehniki` | 200 | holding page |
| `/services/arenda-tehniki?__display_mode=published_only` | 200 | still holding page |
| `/cases` | 200 | holding page |
| `/contacts` | 200 | holding page |
| `/equipment` | 404 | expected; no public equipment domain |

Browser diagnostics:

- HTTP `5xx`: `0`.
- Console errors: `1`, expected from explicit `/equipment` 404 verification.
- Request failures: `8`, all `net::ERR_ABORTED` from `/admin/login?_rsc=...` prefetch/navigation artifacts on holding pages.

## 10. Public Route Result

`/services/arenda-tehniki` after deploy:

- responds `200`;
- renders holding page because `display mode = under_construction`;
- does not expose full `ServicePage` renderer publicly;
- query override `?__display_mode=published_only` did not bypass persisted `under_construction`;
- no browser `5xx` was observed.

Full public visual verification of the new equipment cards remains blocked by the intentional under-construction guard. The renderer itself is verified by code-level tests and production build.

## 11. Safety Confirmation

| Safety item | Result |
| --- | --- |
| public display mode changed | no |
| direct production SQL writes | no |
| direct production write API calls | no |
| `/equipment` route created | no |
| `app/equipment` created | no |
| Page-owned `service_landing` created | no |
| Page-owned `equipment_landing` created | no |
| destructive operations | no |
| secrets exposed | no |
| prices/deadlines/guarantees added | no |
| unconfirmed region added | no |

## 12. Remaining Warnings

- Full visual public render is still blocked by `under_construction`; owner must explicitly allow public/preview mode before the real service page can be inspected in production.
- Previous content warning remains: 4 of 5 media assets lacked `ownershipNote`; this renderer does not change production content.
- `galleryIds` and `relatedCaseIds` are supported by renderer/model, but live rental Service currently has no galleries/cases.
- `/equipment` returns 404 as intended; the Playwright console recorded that 404 as a browser resource error during the explicit negative-route check.
- RSC prefetch request aborts appeared during Playwright holding-page navigation; no HTTP 500 or visible breakage was observed.

## 13. Final Recommendation

Renderer is ready for the rental service page after owner-approved visibility mode is available. Before removing `under_construction`, do one browser pass on `/services/arenda-tehniki` in the real public mode and confirm:

- all 5 equipment cards are visible;
- images load from MediaAsset refs;
- specs/scenarios/operator mode render without empty sections;
- CTA goes to the expected contact path;
- mobile layout has no horizontal scroll.

No new public `/equipment` domain is needed for this launch-core step.
