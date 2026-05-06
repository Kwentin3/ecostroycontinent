# IMPLEMENTATION_PLAN.UPDATE.NEXT_STAGES.AFTER_STAGE3.ECOSTROYCONTINENT.V1

Дата: 2026-04-17  
Режим: Implementation planning update (после server-verified Stage 3)

## 1. Executive summary

После успешного Stage 3 следующий безопасный ход — **Stage 4 в split-режиме (4A + 4B)**:

1. `Stage 4A`: CTA wiring и контактно-регионная проекция как архитектурный каркас без подмены боевой truth.
2. `Stage 4B`: привязка owner-confirmed contact/region truth и закрытие consistency gate.

Дальше:

1. `Stage 5` обновляется на остаточный technical SEO baseline (с учётом уже работающего placeholder-safe noindex).
2. Перед финальным закрытием `Stage 6` нужен **preparatory mini-stage по parser gap**, иначе publish-to-SEO coupling нельзя честно доказать с нужной надёжностью.
3. `Stage 7` остаётся строго content-gated: это не “следующий технический шаг”, а go/no-go после выполнения implementation readiness + content/proof readiness.

## 2. What changed after Stage 3

Серверно подтверждено:

1. `Home` больше не admin-centric заглушка и работает как route/trust hub.
2. `/services` и `/cases` усилены как index entry surfaces с next-step логикой.
3. Placeholder ON/OFF не сломан; marker/noindex/X-Robots/sitemap safety сохранены.
4. Runtime health и public/admin smoke зелёные.
5. `proof:admin:first-slice` и `proof-contacts-hard-stop` продолжают падать на pre-existing parser gap (`Could not parse revision id from editor HTML`), без ухудшения от Stage 3.
6. OFF-mode ограничен published content readiness (это не route regression и не Stage 3 дефект).

Вывод: базовая public architecture теперь server-verifiable; главный следующий риск сместился в **contact truth binding + верификационную надёжность publish/proof scripts**.

## 3. Recommended next execution slice

Рекомендуемый следующий slice: **Stage 4A**.

Почему:

1. Даёт полезный результат сам по себе: рабочий CTA path, единая проекционная схема, проверяемый user-flow.
2. Не требует форсировать неподтверждённые контактные значения в публичный контур.
3. Не трогает risky publish coupling (Stage 6 зона).

Рекомендованная sequencing logic после Stage 3:

1. `Stage 4A` — CTA wiring / projection framework.
2. `Stage 4B` — confirmed contact/region truth binding.
3. `Stage 5A` — technical SEO core (robots/sitemap/canonical/indexation).
4. `Stage 5B` — local signals/schema hardening + placeholder safety regression.
5. `Stage 5.5 (mini-stage)` — parser harness stabilization.
6. `Stage 6` — publish-to-SEO coupling hardening (после 5.5).
7. `Stage 7` — launch-cut activation only after implementation + content gates.

## 4. Stage 4 detailed plan

## 4.1 Stage 4 scope (точный)

Stage 4 = `Conversion and Contact/Region Projection`:

1. Явные CTA entry points на Home / Service detail / Contacts.
2. Единый projection слой contact truth и region truth для public surfaces.
3. Консистентные next-step переходы к contact action.
4. Проверяемость в OFF/ON режимах без превращения placeholders в launch content.

Что не входит:

1. Technical SEO baseline rewrite (Stage 5).
2. Publish obligation semantics (Stage 6).
3. Launch activation и content cut (Stage 7).

## 4.2 Stage 4 split (рекомендуется)

### Stage 4A — CTA wiring + projection framework (safe pre-truth)

Цель:

1. Сделать архитектурно корректный conversion path.
2. Подготовить слой проекции контактов/региона без фиксации неподтверждённых боевых значений.

Изменения:

1. Ввести единый helper/adapter для чтения contact/region projection из published global truth.
2. Нормализовать CTA placement:
   - Home: primary contact action + вторичный переход к services/cases.
   - Service detail: next-step к contacts + related proof link.
   - Contacts: явный primary action (телефон/форма/мессенджер — только если truth подтверждён).
3. Ввести safe fallback copy для неполной truth (“контактный канал уточняется”), без фейковых номеров.
4. Сохранить real truth priority над stubs в placeholder mode.

Что сознательно не менять:

1. Owner-confirmed контактные значения.
2. Claims-heavy copy.
3. Schema/local SEO assertions.

Validation exit (Stage 4A):

1. User-flow проходит в OFF/ON: `home -> services -> service detail -> contacts`.
2. Нет новых тупиков.
3. Нет admin/publish regressions.
4. Placeholder safety не нарушена.

### Stage 4B — confirmed truth binding + consistency gate

Цель:

1. Привязать owner-confirmed contact set и region truth.
2. Закрыть риск рассинхронизации между Home/Services/Contacts/global projection.

Изменения:

1. Подключить подтверждённый единый набор:
   - phone
   - email
   - messenger channel(s)
   - primary region/service area wording
2. Ввести consistency checks между ключевыми поверхностями (минимум smoke/assert).
3. Ужесточить fallback поведение: если truth неполная, не показывать неподтверждённый CTA.

Validation exit (Stage 4B):

1. Contact/region wording консистентна на Home/Services/Contacts.
2. Primary conversion channel работает end-to-end на сервере.
3. Нет placeholder leakage в боевой truth.

## 4.3 Ответы на критические вопросы Stage 4

Можно ли выполнить Stage 4 полностью до confirmed contact truth?  
**Нет.** Полностью — нельзя.

Что можно реализовать заранее безопасно?  
**Stage 4A** можно реализовать полностью: wiring, projection framework, CTA slots, fallback policy.

Что блокируется до owner confirmation?  
**Stage 4B**: боевые значения телефонов/мессенджеров/email, финальная region phrasing, “жёсткие” CTA claims.

Граница между архитектурой и truth:

1. Архитектура = маршруты, места CTA, wiring, приоритет источников, fallback поведение.
2. Боевая truth = фактические контактные данные, региональные утверждения, launch copy обещаний.

Роль placeholder mode в Stage 4:

1. Помогает тестировать кликабельность и связность маршрутов.
2. Не должен быть источником боевой contact truth.
3. OFF mode остаётся референсом launch contour.

## 5. Stage 5 updated plan

## 5.1 Что уже частично закрыто

После Stage 2.5+3 уже есть:

1. Placeholder-safe `noindex`/`X-Robots-Tag`.
2. Исключение placeholder URL из sitemap.
3. Базовый route shell и breadcrumbs UX-слой.

## 5.2 Что остаётся сделать в Stage 5

### Stage 5A — SEO core delivery

1. Полный `robots.txt` для боевого и placeholder режимов.
2. `sitemap.xml` как published-truth projection (services/cases/standalone pages).
3. Канонические URL и indexation policy на Home/Services/Cases/detail surfaces.
4. No-draft leakage guard в публичном delivery.

### Stage 5B — SEO hardening и local signals

1. Metadata completeness (title/description consistency).
2. Breadcrumb structured markup там, где есть фактическая структура.
3. Schema только на factual surfaces и только с подтверждённым truth.
4. Контроль, что placeholder safety не деградировала после SEO изменений.

## 5.3 Главные риски Stage 5

1. Случайная индексация test/placeholder контента.
2. Canonical drift между route owners.
3. Включение schema с неподтверждёнными local signals.
4. Sitemap-дрейф при пустом/частичном published core.

## 5.4 Обязательные server checks после Stage 5

1. `/robots.txt` проверка правил.
2. `/sitemap.xml`:
   - содержит только допустимые published routes
   - не содержит placeholder URLs
3. Head checks:
   - title/meta/canonical/indexation для `/`, `/services`, `/cases`, detail routes
4. Placeholder ON:
   - `noindex` и `X-Robots-Tag` сохранены
5. Placeholder OFF:
   - нет noindex leakage на launch-candidate routes.

## 6. Stage 6 updated plan

## 6.1 Обновлённый scope Stage 6

`Publish-to-SEO coupling hardening`:

1. Явная post-publish обработка revalidation/sitemap obligations.
2. Canonical follow-up при slug mutation.
3. Проверяемый workflow “publish -> public SEO delivery”.

## 6.2 Parser gap impact на Stage 6

Текущее состояние:

1. `proof:admin:first-slice` и `proof-contacts-hard-stop` падают на parsing revision id.
2. Эти скрипты сейчас ненадёжны как доказательство корректности publish flow.

Можно ли идти в Stage 6 без исправления parser gap?

1. **Начинать реализацию можно** (soft no-block для кодинга).
2. **Закрывать Stage 6 как “доказанный” нельзя** (hard block для sign-off).

Причина:

1. Stage 6 требует надёжного evidence про publish/revision/obligation path.
2. Текущий parser хвост делает автоматический proof неполным.

## 6.3 Рекомендуемый preparatory mini-stage (Stage 5.5)

`Parser harness stabilization` перед Stage 6 sign-off:

1. Починить извлечение revision id в proof scripts (устойчиво к актуальной HTML форме).
2. Добавить fallback стратегию (например, через redirect/location или API lookup).
3. Добавить regression test на parser contract.
4. Повторно подтвердить оба скрипта на сервере.

Exit criteria:

1. `proof:admin:first-slice` проходит или падает только по доменной причине, но не по parser.
2. `proof-contacts-hard-stop` проходит parser-этап без parsing exceptions.

## 7. Stage 7 go/no-go framing

## 7.1 Разделение readiness

### Implementation readiness (код/платформа)

1. Stage 4, 5, 6 завершены и server-verified.
2. Parser harness стабилизирован (или есть эквивалентный проверяемый fallback-proof path).
3. Placeholder mode OFF для launch contour, leakage checks зелёные.
4. Technical SEO baseline зелёный.

### Content readiness (owner/content/proof)

1. Подтверждён единый contact truth и region truth.
2. У launch service pages есть:
   - scope
   - CTA truth
   - минимум один proof path
3. У launch case pages есть:
   - task
   - work_scope
   - result
   - location context
   - visual proof
4. Claims-heavy surfaces прошли owner review.

Stage 7 разрешён только когда **обе** readiness группы зелёные.

## 7.2 No-go сигналы для Stage 7

1. Неподтверждённые контакты/регион.
2. Thin service pages без proof.
3. Неустойчивый publish-to-SEO verification.
4. Placeholder traces в launch contour.

## 8. Verification protocol update

## 8.1 После Stage 4 (4A/4B)

Локально:

1. `npm test`
2. `npm run build`
3. smoke скрипт (если локальная DB доступна)

Сервер:

1. `smoke:public-admin`
2. Route checks `/`, `/services`, `/cases`, `/contacts`
3. OFF/ON placeholder CTA-path walkthrough
4. Contact/region consistency checks (для 4B обязательны)

## 8.2 После Stage 5

Локально:

1. `npm test`
2. `npm run build`
3. статические проверки metadata generators / sitemap builders

Сервер:

1. `/robots.txt`
2. `/sitemap.xml`
3. canonical/indexation checks на core routes
4. placeholder noindex/leakage checks

## 8.3 После Stage 6

Локально:

1. `npm test`
2. `npm run build`
3. targeted obligation logic tests

Сервер:

1. publish workflow sanity
2. slug mutation drill
3. sitemap/canonical/revalidation follow-up
4. `proof:admin:first-slice`
5. `proof-contacts-hard-stop`

## 8.4 Перед Stage 7

1. Full implementation verification pass (Stage 4-6 checks).
2. Full content/proof gate checklist.
3. Placeholder OFF confirmation on launch contour.
4. Final launch-cut matrix: ready/partially-ready/risky/do-not-launch.

## 9. Parser gap impact assessment

## 9.1 Что сейчас можно считать надёжным

1. `proof:seo:surface` как ограниченный surface-check (RBAC/routes).
2. Public/admin smoke и HTTP-level route checks.
3. Placeholder safety checks (`marker/noindex/X-Robots/sitemap exclusion`).

## 9.2 Что сейчас ненадёжно без parser fix

1. Автоматическое подтверждение revision-driven publish path в admin proof scripts.
2. Доказательство contacts hard-stop через текущий parser path.
3. Полноценный confidence для Stage 6 sign-off.

## 9.3 Confidence by stage (без parser fix)

1. Stage 4: `High`
2. Stage 5: `Medium-High`
3. Stage 6: `Low-Medium` (нельзя закрывать как fully verified)
4. Stage 7: `No-Go` пока Stage 6 не доказан и content gates не закрыты

Вывод: parser gap — **не блокер для Stage 4/5 coding**, но **блокер для честного Stage 6 completion**.

## 10. Simple-language summary for owner

1. После Stage 3 лучше идти не “вперёд любой ценой”, а аккуратно split-нуть Stage 4.
2. Сначала сделать каркас CTA и контактной проекции (4A), потом привязать подтверждённые контакты и регион (4B).
3. Затем закрыть технический SEO минимум (Stage 5).
4. Перед Stage 6 нужно починить parser хвост в proof scripts, иначе publish-SEO нельзя доказать с нужной уверенностью.
5. До Stage 7 можно дойти честно только когда готовы и кодовые проверки, и реальный контент с доказательной базой.

## FINAL RECOMMENDATION

1. Следующий stage: **Stage 4A**.
2. Stage 4 нужно split-нуть: **да, на 4A/4B**.
3. Parser gap blocker для Stage 6: **да, для sign-off; нет, для начального кодинга**.
4. Следующие 2-3 правильные execution slices:
   - Stage 4A
   - Stage 4B
   - Stage 5A (затем 5B)
5. До Stage 7 можно честно доходить только при условиях:
   - Stage 4-6 server-verified
   - parser harness стабилизирован
   - confirmed contact/region truth есть
   - proof-ready content core собран
   - placeholder leakage отсутствует и launch contour работает в OFF mode.
