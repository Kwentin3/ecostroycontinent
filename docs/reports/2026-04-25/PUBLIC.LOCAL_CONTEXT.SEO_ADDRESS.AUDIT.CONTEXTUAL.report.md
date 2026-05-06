# PUBLIC.LOCAL_CONTEXT.SEO_ADDRESS.AUDIT.CONTEXTUAL

Дата: 2026-04-25  
Контур: repo code + deployed runtime `https://ecostroycontinent.ru`  
Итоговый runtime commit: `70dc92553980158159cd7f3dc6412c48a07ea401`  
Deployed image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:2d4ae05c5e14129a4c6c9a3e901bbb94fe5287747855c6518f898629ddf7c141`

## 1. Executive verdict

DONE_WITH_WARNINGS.

Выбрана модель **B — физический адрес не подтверждён, публично используем service area**.

Причина: live `Global Settings` содержит подтверждаемую рабочую географию `Сочи и Большой Сочи` / `Сочи`, но не содержит отдельного публичного physical address / street address / coordinates contract. Поэтому адрес не добавлялся и не был придуман. Кодовый renderer и schema приведены к модели: показывать service area, не генерировать ложный `PostalAddress`.

Главное ограничение: production display mode остаётся `under_construction`, поэтому реальные публичные маршруты сейчас показывают holding page. Полный визуальный render географии на service/contact pages станет виден после owner-approved снятия holding mode или появления безопасной preview surface.

## 2. Current state

Прочитанные документы:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
- `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`
- `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.report.md`
- `docs/reports/2026-04-25/SITE.STRUCTURE.ANAMNESIS.AUDIT.V1.ADDENDUM.RUNTIME_CONTEXT.report.md`
- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.GUI_PLAYWRIGHT.P0.report.md`
- `docs/reports/2026-04-25/PUBLIC.SERVICE.RENTAL.RENDERER.EQUIPMENT_CARDS.P0.report.md`

Канон:

- PRD требует `/contacts` как страницу контактов, service area и lead capture: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:82`.
- PRD показывает пример региона работы: `Сочи и Большой Сочи`: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:155` - `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:158`.
- `Global Settings` является source of truth для service area и organization/local business data: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:205`.
- Content Contract требует хранить phase-1 launch region / primary service area в `Global Settings`: `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:104` - `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md:109`.
- Launch SEO Core рекомендует `Сочи / Большой Сочи` и запрещает географическое расползание: `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:17`, `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md:33`.
- Public Launch Domain Canon фиксирует: `Global Settings` хранит единый contact/region truth, а `contactTruthConfirmed=true` является launch gate для contacts/conversion surfaces: `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:187` - `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md:192`.

Live read-only runtime truth:

| Field | Live value |
| --- | --- |
| `publicBrandName` | `Экостройконтинент` |
| `legalName` | `ООО "ЭКОСТРОЙКОНТИНЕНТ"` |
| `serviceArea` | `Сочи и Большой Сочи` |
| `primaryRegion` | `Сочи` |
| `organization.city` | `Сочи` |
| `organization.country` | `RU` |
| `contactTruthConfirmed` | `false` |
| physical address field | absent |
| coordinates field | absent |

Source: read-only server SQL query against active published `global_settings`, not local workspace DB.

## 3. Found issues

1. `lib/public-launch/seo-structured-data.js` generated `PostalAddress` from `organization.city` / `organization.country` alone. Without a confirmed physical address field this could become a false address signal.
2. Public renderers used `contactProjection.displayRegion`, whose fallback is `Зона обслуживания ожидает подтверждения.`. That fallback is useful as readiness text, but it should not be rendered as public geography.
3. Service detail had no explicit service-area section; the user had to infer geography from shell/contact context.
4. Footer did not expose region at all, even when `serviceArea` exists.
5. `lib/public-launch/placeholder-fixtures.js` still contained Moscow/Moscow-region placeholder geography, conflicting with the Sochi launch cluster if placeholder mode is ever used.
6. Current public site is in `under_construction`, so Playwright can verify route/holding behavior but cannot visually inspect full service/contact page geography on production.

## 4. Canon-based decision (A/B/C)

Selected: **B — address is not confirmed, render service area only.**

Rationale:

- Canon wants one primary region cluster, not multi-region.
- Live `Global Settings` already stores service area and primary region.
- No physical address / street address / coordinates contract exists in live `Global Settings`.
- Content Inventory mentions legal address in public registries, but also says public contact/service-area phrasing still needed owner confirmation: `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md:288` - `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md:304`.
- Inventing or deriving a public address from registry/city data would violate the task and canon.

## 5. Changes made

Code/runtime:

- `lib/public-launch/contact-projection.js:166` - `lib/public-launch/contact-projection.js:185` now exposes `publicRegion` and `hasPublicRegion` from actual `serviceArea || primaryRegion`, while preserving internal readiness fallback separately.
- `components/public/PublicRenderers.js:253` - `components/public/PublicRenderers.js:281` adds `ServiceAreaNote`, which renders only when real region data exists.
- `components/public/PublicRenderers.js:453`, `components/public/PublicRenderers.js:487`, `components/public/PublicRenderers.js:534`, `components/public/PublicRenderers.js:869`, `components/public/PublicRenderers.js:1095` render region only through `hasPublicRegion/publicRegion`.
- `app/page.js:111` renders home hero geography only when actual region data exists.
- `lib/public-launch/seo-structured-data.js:119` keeps `areaServed`; the previous `PostalAddress` generation was removed.
- `lib/public-launch/placeholder-fixtures.js` now uses `Сочи`, `Большой Сочи`, `Сочи и Большой Сочи` instead of Moscow placeholder geography.

Tests:

- `tests/public-contact-projection.test.js:46` - `tests/public-contact-projection.test.js:56` covers service area without physical address.
- `tests/public-seo-structured-data.test.js:71` - `tests/public-seo-structured-data.test.js:72` asserts `areaServed` exists and `address` is not emitted.
- `tests/public-placeholder-layer.test.js:70` - `tests/public-placeholder-layer.test.js:76` asserts placeholder local signals stay in the Sochi launch cluster.

No production content data was edited.

## 6. Before/after

| Surface | Before | After |
| --- | --- | --- |
| Global Settings | Live data already had `serviceArea=Сочи и Большой Сочи`, `primaryRegion=Сочи`; no address field | unchanged |
| Header | rendered `displayRegion`, including fallback text if no region | renders region only when `hasPublicRegion=true` |
| Footer | email/phone only | also renders region when `hasPublicRegion=true` |
| Home | rendered `displayRegion`, including fallback | renders only actual `publicRegion` |
| ServicePage | no explicit geography block | renders `География работ / Зона оказания услуг` when actual region exists |
| Contacts | contact request rendered `displayRegion`, including fallback | renders only actual `publicRegion` |
| Schema | `LocalBusiness.address` could be generated from city/country only | no `address` without physical address contract; `areaServed` remains |
| Placeholder fixtures | Moscow/Moscow region | Sochi/Big Sochi |

## 7. SEO/schema state

Current live holding pages contain no JSON-LD because display mode is `under_construction`.

Code-level schema decision:

- `LocalBusiness` remains gated by confirmed contact truth in `buildLocalBusinessStructuredData`.
- When schema is emitted, it uses `areaServed` from `serviceArea || primaryRegion`.
- It no longer emits `PostalAddress` from city/country alone.

This is intentionally conservative: no false street/local address signal is generated. Follow-up after owner confirms contact truth can decide whether schema should emit `LocalBusiness` with service-area-only data before a full physical address is known.

## 8. Playwright verification

Evidence directory:

`docs/reports/2026-04-25/assets/PUBLIC.LOCAL_CONTEXT.SEO_ADDRESS.AUDIT.CONTEXTUAL/`

Screenshots:

- `contacts-under-construction.png`
- `service-arenda-tehniki-under-construction-mobile.png`
- `post-deploy-service-arenda-tehniki-under-construction.png`

Route checks after deploy:

| URL | Status | Result |
| --- | --- | --- |
| `/` | 200 | holding page `В разработке` |
| `/services` | 200 | holding page `В разработке` |
| `/services/arenda-tehniki` | 200 | holding page `В разработке` |
| `/contacts` | 200 | holding page `В разработке` |
| `/cases` | 200 | holding page `В разработке` |
| `/api/health` | 200 | `status=ok`, `databaseConfigured=true` |
| `/api/public/display-mode` | 200 | `mode=under_construction` |
| `/equipment` | 404 | expected; no public equipment domain |

Console: no application JS errors observed. Browser reported `favicon.ico` 404 only.

Display mode was not changed.

## 9. Risks

- Full visual verification of the new service-area block is blocked by `under_construction`.
- `contactTruthConfirmed=false`, so conversion/contact schema remains intentionally gated.
- There is still no explicit physical address field in the public content contract. If owner later wants model A or C, a separate owner-confirmed address field and schema decision are needed.
- The live holding page itself does not show service area; this is expected for the current under-construction mode.

## 10. Final recommendation

Keep model **B** for launch-core until owner explicitly confirms a public physical address.

Next smallest step before public unlock:

1. Owner confirms whether `Сочи и Большой Сочи` is final public service-area wording.
2. Owner confirms public phone/messenger/email and sets `contactTruthConfirmed=true` through admin flow.
3. In owner-approved visible mode, browser-check `/`, `/services/arenda-tehniki`, `/contacts`, footer/header and schema JSON-LD for consistent service area.

Safety confirmation:

- Address invented: no.
- Production SQL writes: no.
- Direct production write API calls: no.
- Public display mode changed: no.
- Routes changed: no.
- `/equipment` domain created: no.
- Runtime behavior changed only for public rendering/schema code and placeholder fixtures; production content data unchanged.
