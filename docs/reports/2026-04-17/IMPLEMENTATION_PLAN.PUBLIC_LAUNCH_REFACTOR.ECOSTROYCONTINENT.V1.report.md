# IMPLEMENTATION_PLAN.PUBLIC_LAUNCH_REFACTOR.ECOSTROYCONTINENT.V1

Дата: 2026-04-17  
Режим: Implementation planning only (без немедленных code changes)

## 1. Executive summary

Рекомендуемый порядок: **инкрементальный route-by-route refactor с жёсткой валидацией после каждого stage и без ломки write-side**.

Ключевой принцип:
- сначала стабилизируем guardrails и проверочный контур;
- затем рефакторим public read-side слоями (ownership -> navigation -> placeholder verification layer -> home/index role -> conversion -> SEO);
- только после этого делаем publish-to-SEO coupling hardening;
- выход в launch только после content readiness gates.

Почему такой порядок:
1. Канон требует чистые ownership boundaries (`Service/Case/Article` route owners, `Page` без second route truth).
2. Самый высокий риск поломки находится в write-side/publish workflow, поэтому early stages должны быть максимально read-side.
3. Текущий runtime уже содержит working admin/publish механику; её нельзя трогать до момента, когда public слой стабилен и проверяем.
4. Из-за дефицита published launch-core нужен **временный безопасный placeholder-layer** для проверки архитектуры переходов, но без подмены content truth.

## 2. Planning assumptions

### 2.1 Источники истины (использованы)

1. `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
2. `docs/reports/2026-04-17/DOCS.CANON_REFACTOR.PUBLIC_LAUNCH_DOMAIN.ECOSTROYCONTINENT.V1.report.md`
3. `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
4. `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
5. `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
6. `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
7. `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
8. `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md` (включая addendum)

### 2.2 Фактические исходные условия по коду

- Public routes существуют: `/`, `/services`, `/services/[slug]`, `/cases`, `/cases/[slug]`, `/about`, `/contacts`.
- `/blog` и article route/model как live-ready слой отсутствуют.
- Home сейчас временная заглушка.
- Public routes читают published read-side (`lib/read-side/public-content.js`).
- Publish workflow и readiness checks уже реализованы (`lib/content-ops/workflow.js`, `lib/content-ops/readiness.js`).
- В модели `Page` всё ещё есть `service_landing/equipment_landing`, что создаёт drift-риск.
- В `package.json` доступны проверочные команды: `npm test`, `npm run build`, `npm run proof:admin:first-slice`, `npm run proof:seo:surface`.

### 2.3 Операционные ограничения

- Live DB snapshot в этой сессии не подтверждён: `DATABASE_URL` указывает на `localhost:5433`, текущее состояние — `ECONNREFUSED`.
- Поэтому stage-валидация, требующая live/stage DB, помечается как **runtime-dependent**.
- Базовый принцип безопасности: **никаких schema upheaval и никаких big-bang rewrites**.

## 3. Target implementation streams

### Stream A: Route/Domain alignment (public read-side)

Цель:
- привести public surface к канону: home hub + services/cases/about/contacts как связанная система.

Область:
- `app/*` public routes
- `components/public/*`
- `lib/read-side/*` projection

### Stream B: Ownership cleanup (`Page` vs `Service/Case`)

Цель:
- изолировать/устранить route-truth drift и исключить расширение page-based service route ownership.

Область:
- `lib/content-core/*` (типизация/validation guardrails)
- admin create/save guards для page
- readiness/publish guard extensions без ломки existing published data

### Stream C: Navigation system

Цель:
- каноничная навигация: header, active state, services quick access, breadcrumbs, footer, contextual links.

Область:
- `components/public/*`
- public layout integration

### Stream D: Safe temporary placeholder layer (test architecture surface)

Цель:
- обеспечить realistic route surface для проверки навигации/переходов/CTA-path до появления полного real published core.

Область:
- placeholder projection adapter в read-side
- fixture-backed stub payloads
- feature-flag gating + noindex/sitemap exclusion

### Stream E: Conversion surfaces

Цель:
- явный next step на home/service/contacts и консистентный contact path.

Область:
- public CTA components
- contact projection из global settings

### Stream F: Technical SEO baseline

Цель:
- `robots`, `sitemap`, metadata/canonical/indexation/schema/breadcrumbs минимум.

Область:
- app-level SEO runtime files
- route metadata logic

### Stream G: Publish-SEO coupling hardening

Цель:
- сделать publish obligations operationally enforceable (slug/revalidation/sitemap/canonical follow-up).

Область:
- publish workflow orchestration
- obligations execution/verification surfaces

### Stream H: Validation and regression safety

Цель:
- stage-by-stage доказательство, что runtime/admin/publish не сломан.

Область:
- test/build/proof scripts
- route smoke harness
- risky-stage regression checks

## 4. Recommended staged rollout

## Stage 0 - Baseline Freeze and Safety Harness

Цель:
- зафиксировать baseline и подготовить обязательный verification protocol до функциональных изменений.

Что меняется:
- только валидационный контур (smoke/checklist/harness), без изменения доменной логики.

Что не меняется:
- runtime поведение public/admin/publish.

Dependencies:
- нет.

Риск уровня stage:
- Low.

Deliverables:
1. Зафиксированный baseline report: текущие route statuses + текущие known gaps.
2. Скрипт/чеклист public route smoke (минимум `/`, `/services`, `/cases`, `/about`, `/contacts`, выборочно detail routes).
3. Единый набор обязательных команд для пост-stage проверки.

Validation after stage:
1. `npm test`
2. `npm run build`
3. `npm run proof:seo:surface` (read-only)
4. `npm run proof:admin:first-slice` (runtime-dependent)
5. Public route smoke checklist (manual/auto)

Rollback strategy:
- откат одного PR/commit с harness-only изменениями.

Exit criteria:
- baseline фиксирован, проверки повторяемы, все команды/чеклисты документированы.

## Stage 1 - Ownership Guardrails (No Public UX Rewrite Yet)

Цель:
- остановить дальнейший drift `Page` в сторону service/case route truth.

Что меняется:
1. Guardrails в page create/save flow: launch-mode ограничение pageType на `about/contacts`.
2. Явная маркировка legacy `service_landing/equipment_landing` как non-launch path.
3. Дополнительные readiness/validation запреты на конфликт route truth между `Page` и `Service/Case`.

Что не меняется:
- существующая publish state machine.
- существующие service/case route owners.
- production DB schema.

Dependencies:
- Stage 0 completed.

Риск уровня stage:
- Medium (затрагивает admin/write-side guards).

Deliverables:
1. Ownership guard matrix (что разрешено/запрещено для `Page`).
2. Непротиворечивый create/save behavior для page routes.
3. Regression tests для ownership boundaries.

Validation after stage:
1. `npm test`
2. `npm run build`
3. `npm run proof:admin:first-slice`
4. `node scripts/proof-contacts-hard-stop.mjs` (runtime-dependent)
5. Targeted admin smoke: create/edit page, create/edit service, submit/review/publish.

Rollback strategy:
- отдельный rollback PR по guardrails файлам.

Exit criteria:
- `Page` не может расширять service/case route ownership в launch режиме.
- existing admin publish happy-path не деградировал.

## Stage 2 - Navigation Foundation (Global Public Shell)

Цель:
- внедрить каноничную навигационную систему без пересборки контент-модели.

Что меняется:
1. Global header + active state + services quick access.
2. Footer navigation.
3. Breadcrumbs framework для внутренних страниц.
4. Contextual links slots (`related services/cases`) в деталях.

Что не меняется:
- publish workflow.
- entity schema.

Dependencies:
- Stage 1 completed.

Риск уровня stage:
- Low/Medium (UI + route wiring).

Deliverables:
1. Единый public shell для всех ключевых public routes.
2. Desktop/mobile navigation parity на базовом уровне.

Validation after stage:
1. `npm test`
2. `npm run build`
3. Public route smoke (desktop/mobile viewport manual check)
4. Проверка отсутствия новых 404/loop по навигации

Rollback strategy:
- rollback одного isolated PR с shell/nav компонентами.

Exit criteria:
- пользователь из любой core-страницы видит следующий шаг маршрута и не попадает в тупик.

## Stage 2.5 - Safe Temporary Placeholder / Route Stub Layer (Controlled Mode)

Цель:
- получить контролируемый временный route surface для проверки public architecture на сервере до готовности полного published content core.

Что меняется:
1. Вводится feature-flagged placeholder projection adapter (fixture-driven, test-only).
2. Появляются stub payloads для ключевых route surfaces (`/`, `/services`, `2-3 /services/[slug]`, `/cases`, `1-2 /cases/[slug]`, `/about`, `/contacts`).
3. Добавляется строгий anti-leak layer: noindex, sitemap exclusion, visual test marker.
4. Добавляется dual-mode smoke protocol: placeholder mode ON/OFF.

Что не меняется:
- `Service`/`Case`/`Page` ownership boundaries.
- publish/read-side source-of-truth в БД.
- admin/publish workflows.
- launch candidate content set.

Dependencies:
- Stage 2 completed.

Риск уровня stage:
- Medium (риск launch leakage при неправильном gating).

Deliverables:
1. Fixture set для временных stubs в отдельном test-only модуле.
2. Feature flag policy: placeholder mode разрешён только в controlled runtime mode.
3. Route behavior contract:
- если real published truth есть, она приоритетна;
- если real truth отсутствует и placeholder mode ON, рендерится stub projection;
- если placeholder mode OFF, используется обычная логика без stub-подмены.
4. Безопасность индексации:
- noindex на всех placeholder responses;
- исключение stub-слоя из sitemap;
- robots disallow policy в placeholder mode.

Validation after stage:
1. `npm test`
2. `npm run build`
3. Placeholder mode OFF smoke: нет изменения текущего поведения.
4. Placeholder mode ON smoke:
- core routes доступны и связаны переходами;
- breadcrumbs/navigation/CTA-path работают;
- на всех stub routes присутствует marker `TEST PLACEHOLDER`.
5. SEO safety smoke:
- `meta robots=noindex,nofollow` на stub routes;
- `/sitemap.xml` не содержит stub URLs;
- `robots` соответствует placeholder policy.

Rollback strategy:
1. Мгновенный rollback через выключение feature flag.
2. Отдельный rollback PR, удаляющий placeholder adapter/fixtures без затрагивания доменной модели.

Exit criteria:
- архитектурный user-flow можно проверять end-to-end в controlled mode;
- при выключенном placeholder mode runtime совпадает с обычным состоянием;
- нет утечки placeholder слоя в indexable launch contour.

## Stage 3 - Home and Index Role Refactor

Цель:
- привести `Home`, `Services index`, `Cases index` к канонической роли entry/hub/proof-routing.

Что меняется:
1. Home: brand/trust/navigation hub (без admin-centric заглушки).
2. Services index: явный вход в service detail + secondary conversion.
3. Cases index: proof-layer вход + переход к кейсам.

Что не меняется:
- write-side logic.
- publish state machine.

Dependencies:
- Stage 2.5 completed.

Риск уровня stage:
- Medium (критический first impression route).

Deliverables:
1. Home без temporary placeholder semantics.
2. Явный маршрут `Home -> Services -> Service detail -> Contact`.
3. Совместимость с placeholder mode ON/OFF до закрытия content readiness.

Validation after stage:
1. `npm test`
2. `npm run build`
3. Public smoke + UX checklist (home hub role)
4. Проверка, что `/admin/*` не затронут
5. Проверка, что placeholder mode не ломает home/index contracts

Rollback strategy:
- вернуть только home/index route слой, не трогая stage 1/2/2.5.

Exit criteria:
- Home выполняет route-hub роль; индексы не являются тупиками.

## Stage 4 - Conversion and Contact/Region Projection

Цель:
- короткий, явный и консистентный conversion path на ключевых public surfaces.

Что меняется:
1. CTA surfaces на home/service detail/contacts.
2. Click-to-call и messenger path (если канал подтверждён в global settings).
3. Единообразная проекция contact/region truth.

Что не меняется:
- роль AI (assistive only).
- расширение scope за пределы launch-core.

Dependencies:
- Stage 3 completed.

Риск уровня stage:
- Medium (локальный SEO + conversion trust).

Deliverables:
1. Карта entry points и CTA pathways.
2. Консистентный contact set на ключевых surfaces.

Validation after stage:
1. `npm test`
2. `npm run build`
3. Route smoke + click-path smoke (mobile first)
4. Contacts hard-stop proof (`node scripts/proof-contacts-hard-stop.mjs`)
5. Placeholder mode CTA-path smoke (пока real content core не готов)

Rollback strategy:
- rollback CTA/contact projection PR отдельно от навигации/SEO stages.

Exit criteria:
- с каждой money surface есть естественный следующий шаг к контакту.

## Stage 5 - Technical SEO Baseline Delivery

Цель:
- закрыть launch minimum по индексации и head signals.

Что меняется:
1. `robots` runtime.
2. `sitemap` runtime.
3. Per-route metadata/canonical/indexation.
4. Structured data и breadcrumbs markup где есть factual content.
5. Placeholder-safe SEO behavior (noindex/disallow/exclusion) в controlled mode.

Что не меняется:
- доменная publish модель как state machine.
- расширение на blog/article, если они не готовы.

Dependencies:
- Stage 4 completed.

Риск уровня stage:
- Medium/High (indexation behavior).

Deliverables:
1. Working `robots`/`sitemap`.
2. Metadata projection logic по route owners.
3. No-draft leakage controls в public SEO layer.
4. No-placeholder-leakage controls в public SEO layer.

Validation after stage:
1. `npm test`
2. `npm run build`
3. HTTP checks: `/robots.txt`, `/sitemap.xml`
4. Public route head checks (title/meta/canonical/index/noindex)
5. Проверка breadcrumbs/schema на detail pages
6. Placeholder mode SEO checks:
- noindex активен;
- sitemap stubs не включает;
- canonical не указывает на placeholder-only URLs.

Rollback strategy:
- отдельный rollback PR для SEO runtime files.

Exit criteria:
- технический SEO baseline присутствует и не противоречит publish truth.
- placeholder mode не создаёт индексируемую поверхность.

## Stage 6 - Publish-to-SEO Coupling Hardening

Цель:
- связать publish obligations с реальным post-publish execution контуром.

Что меняется:
1. Явный execution path для `revalidation_required` и `sitemap_update_required`.
2. Контроль `canonical_url_check_required` как обязательной post-publish проверки.
3. Редиректная дисциплина при slug mutation (минимум: операторский gate + проверяемый follow-up).

Что не меняется:
- фундаментальная роль publish (explicit operation).
- роли доступа и owner-review semantics.

Dependencies:
- Stage 5 completed.

Риск уровня stage:
- High (затрагивает write-side/public delivery coupling).

Deliverables:
1. Operationally executable obligation flow.
2. Проверяемый post-publish checklist для slug change.
3. Граница с placeholder mode: obligation flow не опирается на stubs как на launch truth.

Validation after stage:
1. `npm test`
2. `npm run build`
3. `npm run proof:admin:first-slice`
4. `npm run proof:seo:surface` (read-only + controlled mutation on stage only)
5. Slug mutation drill на stage: publish -> obligation resolution -> route/sitemap/canonical sanity

Rollback strategy:
- rollback этого stage должен быть полностью отдельным (не смешивать с UI/SEO layout changes).

Exit criteria:
- нет silent publish drift между publish state и SEO delivery фактом.

## Stage 7 - Launch-Cut Activation (Content-Coupled)

Цель:
- включить только proof-ready narrow core в public launch.

Что меняется:
1. Публикация минимального launch-core контента (services/cases/about/contacts).
2. Исключение weak/test surfaces из launch cut.
3. Деактивация placeholder mode для launch contour.

Что не меняется:
- расширение scope на broad blog/feature domains.

Dependencies:
- Stages 1-6 completed.
- **Blocked by content readiness**: owner-approved factual content + proof media.

Риск уровня stage:
- High (реальный go/no-go launch gate).

Deliverables:
1. Final launch-core entity set.
2. Go/No-Go checklist with evidence.
3. Placeholder retirement evidence (feature flag off + exclusion checks).

Validation after stage:
1. Final full protocol (см. раздел 5)
2. Manual acceptance on desktop/mobile
3. Owner sign-off for claims-heavy surfaces
4. Проверка, что placeholder layer выключен на launch runtime

Rollback strategy:
- route/entity-level rollback через existing published revision/rollback semantics.

Exit criteria:
- launch-core соответствует канону и проходит финальную валидацию без критических дефектов.
- placeholder layer не участвует в launch contour.

## 5. Verification protocol

### 5.1 Baseline checks before any code changes

1. `npm test`
2. `npm run build`
3. `npm run proof:seo:surface`
4. `npm run proof:admin:first-slice` (если runtime доступен)
5. Public route smoke snapshot (status + ключевые текстовые маркеры)

### 5.2 Mandatory checks after each stage

1. Unit/integration: `npm test`
2. Build: `npm run build`
3. Route smoke:
- `/`
- `/services`
- `/cases`
- `/about`
- `/contacts`
- минимум по одному detail route (если published или если placeholder mode ON)
4. Admin sanity:
- `/admin`
- `/admin/review`
- `/admin/entities/service`
- `/admin/entities/case`
- `/admin/entities/page`

### 5.3 Placeholder-specific checks (for Stage 2.5+)

1. Dual-run smoke:
- `placeholder mode OFF` — поведение как в обычном runtime;
- `placeholder mode ON` — маршрутная связность и клики проходят без тупиков.
2. Navigation checks on stubs:
- header
- active state
- services quick access
- breadcrumbs
- footer
- related links
3. Conversion checks on stubs:
- CTA visibility
- path to contacts
- path service <-> case
4. SEO anti-leak checks on stubs:
- `meta robots=noindex,nofollow`
- `X-Robots-Tag=noindex, nofollow`
- stub URLs отсутствуют в sitemap

### 5.4 Extra checks after risky stages (1, 5, 6, 7)

1. `npm run proof:admin:first-slice`
2. `npm run proof:seo:surface`
3. `node scripts/proof-contacts-hard-stop.mjs`
4. Slug mutation drill на stage (для Stage 6/7)
5. Проверка отсутствия незапланированных 404 на launch-core маршрутах
6. Проверка, что placeholder mode не активен на launch candidate runtime

### 5.5 Final acceptance checks

1. Full test + build pass.
2. Public launch-core route matrix pass.
3. Navigation contract pass (header/active/breadcrumb/footer/related/mobile).
4. Conversion contract pass (CTA visibility + click paths).
5. Technical SEO pass (`robots`, `sitemap`, metadata/canonical/indexation/schema where applicable).
6. Publish-read-side sanity pass (publish changes отражаются в public без drift).
7. Owner approval evidence for claims-heavy surfaces.
8. Placeholder retirement pass: флаг выключен, stubs не рендерятся, индексационных следов нет.

## 6. Blockers and sequencing constraints

1. Stage 7 blocked by реальный content readiness (proof media + owner-approved copy).
2. Stage 6 нельзя делать до Stage 5, иначе obligation execution нечему обновлять (нет стабильного SEO runtime слоя).
3. Stage 2.5 нельзя делать раньше Stage 2: сначала нужен каноничный nav shell, потом архитектурные stubs.
4. Stage 3 зависит от Stage 2.5: home/index рефактор нужно валидировать на realistic route surface.
5. Stage 2.5 нельзя использовать как launch content surrogate; это только controlled verification layer.
6. `/blog` и article layer не входят в day-1 gate; можно вести как отдельный post-core поток в пределах phase 1.
7. Любые изменения write-side должны идти отдельными PR от public UI changes.

## 7. Risk register

1. Risk: повторный drift `Page` в service-like route ownership.  
Mitigation: Stage 1 guardrails + tests + launch-mode ограничения pageType.

2. Risk: регресс publish workflow при ownership cleanup.  
Mitigation: write-side изменения изолировать; обязательный `proof:admin:first-slice` после stage.

3. Risk: навигация создаст новые тупики/404.  
Mitigation: route smoke matrix + manual mobile checks после Stage 2/2.5/3.

4. Risk: placeholder layer случайно попадёт в launch/indexation contour.  
Mitigation: feature-flag gating + runtime deny policy + noindex + sitemap exclusion + release check.

5. Risk: placeholder layer станет permanent костылём.  
Mitigation: explicit retirement criteria в Stage 7 + cleanup checklist + owner sign-off на отключение.

6. Risk: SEO baseline формально добавлен, но конфликтует с indexation truth.  
Mitigation: Stage 5 head checks + no-draft/no-placeholder leakage audit.

7. Risk: slug mutation ломает индексацию.  
Mitigation: Stage 6 obligation execution flow + slug drill.

8. Risk: conversion CTA непоследовательны с global contact truth.  
Mitigation: Stage 4 единый projection helper + contacts hard-stop checks.

9. Risk: hidden regression в admin/runtime при public refactor.  
Mitigation: обязательные admin sanity checks после каждого stage.

10. Risk: отсутствие доступной stage DB и ложное чувство готовности.  
Mitigation: явно разделить local checks и runtime-dependent checks; без runtime evidence no-go.

## 8. Recommended first execution slice

**Safest first slice:** `Stage 0 + Stage 1 (Ownership Guardrails)` в минимальном объёме.

Почему именно он:
1. Не требует немедленного большого UI refactor.
2. Сразу закрывает главный архитектурный риск (`Page` vs `Service` drift).
3. Формирует проверочную дисциплину до изменений home/nav/placeholder/SEO.
4. Даёт чистую базу для последующих public stages без накопления противоречий.

## 9. Simple-language summary for owner

Как идти:
- маленькими безопасными кусками, каждый кусок отдельно проверяем и только потом идём дальше.

Почему это безопаснее:
- мы сначала ставим страховки и границы, потом собираем навигационный каркас, затем временно включаем безопасный тестовый слой маршрутов, и только после этого доводим контентные и SEO-слои.

Где самые опасные места:
- смешение `Page` и `Service` ownership;
- утечка placeholder pages в индексацию;
- stage с publish/slug obligations;
- финальный запуск без подтверждённого контента и proof.

Почему нельзя делать всё одним махом:
- слишком высокий риск незаметно сломать admin/publish контур и получить нестабильный launch.

## 10. Addendum - Safe Temporary Placeholder / Route Stub Layer

### 10.1 Why temporary placeholder layer is justified

Вывод: **нужен**.

Почему в этом проекте это оправдано:
1. Канон требует проверяемую public architecture (`Home -> Services -> Service detail -> Case/Proof -> Contact`), а published core пока почти пуст.
2. Без контролируемого stub-слоя невозможно адекватно проверить клики, навигацию, breadcrumbs и CTA-path на сервере.
3. Публикация фейковых сущностей в truth-модель противоречит launch discipline и повышает SEO/ownership риски.
4. Поэтому требуется именно технический временный слой, а не контентный суррогат.

### 10.2 Recommended placeholder strategy

Рекомендуемая стратегия:
- **feature-flagged, fixture-driven, test-only projection layer** (local + stage controlled mode).

Почему этот вариант:
1. Не создаёт вторую truth-модель в БД.
2. Не требует publish fake entities.
3. Легко выключается флагом.
4. Поддерживает route-level проверку на реальных URL.

Что отвергается:
1. Seed-based published fake content как основной путь (слишком высокий risk leakage/drift).
2. Постоянные production stubs без gating (недопустимо).

### 10.3 Scope of placeholder surfaces

Минимальный placeholder scope:
1. `Home` (`/`)
2. `Services index` (`/services`)
3. `Service detail` stubs (`2-3` slug)
4. `Cases index` (`/cases`)
5. `Case detail` stubs (`1-2` slug)
6. `About` (`/about`)
7. `Contacts` (`/contacts`)

Внутри каждой поверхности должно быть только необходимое для архитектурной проверки:
1. layout и nav shell
2. breadcrumbs
3. CTA placement
4. related/contextual links
5. route-to-route wiring
6. metadata hooks

### 10.4 Safety boundaries

Обязательные границы безопасности:
1. Placeholder mode только в controlled runtime mode (local/stage), never-by-default.
2. Визуальный marker на каждой placeholder surface: `TEST PLACEHOLDER - NOT LAUNCH CONTENT`.
3. Noindex strategy:
- `meta robots=noindex,nofollow`
- `X-Robots-Tag: noindex, nofollow`
4. Sitemap strategy:
- placeholder URLs не включаются в sitemap.
5. Ownership strategy:
- stubs живут в projection layer и не записываются в `content_entities/content_revisions`.
6. Priority strategy:
- real published truth всегда выше placeholder projection.
7. Kill switch:
- один feature flag выключает весь слой.

### 10.5 Verification usage

Через placeholder layer проверяется:
1. user flow:
- home -> services -> service detail -> contacts
- home -> cases -> case detail -> related service/contact
2. navigation contract:
- header
- active state
- quick access
- breadcrumbs
- footer
- related links
3. route integrity:
- отсутствие тупиков
- отсутствие лишних 404
4. conversion wiring:
- CTA visibility
- next-step клики
5. runtime SEO shape:
- metadata routing
- breadcrumbs markup
- noindex/sitemap exclusion

### 10.6 Placement in staged rollout

Рекомендуемое место:
- **Stage 2.5** (между Stage 2 и Stage 3).

Почему именно там:
1. Не раньше Stage 2: сначала нужен реальный навигационный каркас.
2. Не позже Stage 3: home/index роль и conversion path нужно валидировать сразу на связном route surface.
3. Это минимизирует риск делать home/conversion «вслепую» до появления real published core.

### 10.7 Removal/replacement strategy

Путь замены placeholders на real content:
1. По мере появления published service/case/about/contacts real truth автоматически вытесняет stubs (по приоритету).
2. Когда launch-core готов, placeholder mode выключается.
3. После стабилизации launch-core слой удаляется отдельным cleanup PR.

Критерии удаления:
1. Все launch-core routes покрыты реальным published content.
2. Smoke-прогоны проходят при placeholder mode OFF.
3. В sitemap/indexation нет placeholder следов.
4. Owner подтверждает, что stubs больше не нужны.

### 10.8 Risks and mitigations

1. Риск: placeholder утечёт в публичную индексацию.  
Mitigation: noindex + robots disallow + sitemap exclusion + release checklist.

2. Риск: placeholder будет принят командой как launch-ready content.  
Mitigation: визуальный marker + явная non-launch маркировка в docs/checklists.

3. Риск: возникнет второй owner layer.  
Mitigation: запрет DB persistence для stubs + сохранение route ownership за `Service/Case/Page`.

4. Риск: технический долг после запуска.  
Mitigation: Stage 7 retirement gate + отдельный cleanup stage/PR.

### 10.9 Final recommendation (addendum scope)

- Placeholder layer нужен как временный архитектурный тестовый инструмент.
- Рекомендуемый тип: feature-flagged fixture-driven test-only projection.
- Внедрение: Stage 2.5 между navigation foundation и home/index refactor.
- Защита: strict gating + noindex + sitemap exclusion + visual marker + no DB truth writes.
- Удаление: после готовности real published launch-core, с обязательным retirement checklist.

## FINAL RECOMMENDATION

Рекомендуемый порядок рефакторинга:
1. Baseline/harness
2. Ownership guardrails
3. Navigation foundation
4. **Safe placeholder layer (Stage 2.5)**
5. Home/index role refactor
6. Conversion/contact projection
7. Technical SEO baseline
8. Publish-SEO coupling hardening
9. Launch-cut activation (content-gated, placeholder off)

Первый stage для старта реализации:
- `Stage 0 + минимальный Stage 1`.

Нужен ли placeholder layer:
- **Да, нужен** как временный controlled verification layer.

Какой тип рекомендуется:
- **feature-flagged fixture-driven test-only projection layer** (local/stage).

На каком этапе вводить:
- **между Stage 2 и Stage 3 (Stage 2.5)**.

Как защитить от индексации и launch leakage:
1. placeholder mode только в controlled runtime mode
2. `meta robots` + `X-Robots-Tag` noindex
3. исключение из sitemap
4. visual marker `TEST PLACEHOLDER`
5. real truth priority над stubs
6. release gate: placeholder mode OFF для launch contour

Как потом убрать безболезненно:
1. по мере готовности real published core stubs вытесняются автоматически
2. на Stage 7 placeholder mode отключается
3. отдельным cleanup PR удаляется adapter/fixtures после прохождения retirement checklist

Главный риск поломки:
- нарушение существующего publish/write-side контура и/или утечка placeholder surface в индексируемый контур при отсутствии строгого gating и post-stage валидации.
