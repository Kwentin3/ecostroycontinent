# Owner Confirmation Pack v0.1

Проект: «Экостройконтинент»  
Статус: owner-facing launch decision pack  
Основание: [PRD v0.3.1](./PRD_Экостройконтинент_v0.3.1.md), [Content Contract v0.2](./Content_Contract_Экостройконтинент_v0.2.md), [Launch SEO Core Spec v0.1](./Launch_SEO_Core_Экостройконтинент_v0.1.md), [Content Inventory & Evidence Register v0.1](./Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md), [Content Operations / Admin Console MVP Spec v0.1](./Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md)

## 1. Purpose of This Pack

Этот документ нужен, чтобы быстро закрыть owner-level launch decisions, без которых launch-core остаётся подвешенным.

Он не заменяет PRD и не пересказывает весь канон. Его задача: свести в одно место только те решения, которые владелец бизнеса должен подтвердить, скорректировать или отложить.

## 2. Public Business Truth

### Canonical public business name

- Recommendation: использовать `Экостройконтинент` как публичное имя бренда, а `ООО "ЭКОСТРОЙКОНТИНЕНТ"` держать как юридическое имя в реквизитах, footer и trust blocks.
- Why this is recommended: это уже соответствует текущему канону и не заставляет публичный сайт звучать как реестровая карточка.
- Decision needed: подтвердить, что публичное имя на сайте = `Экостройконтинент`.

### Who we are / what we do

- Recommendation: `Строительная компания в Сочи, которая выполняет строительство домов, монолитные и связанные строительные работы под проект заказчика.`
- Why this is recommended: формулировка достаточно широкая для launch-core, но не обещает лишнего и не уходит в неподтверждённые специализации.
- Decision needed: подтвердить или скорректировать эту базовую публичную формулировку.

### Public contact truth

| Item | Current state | Recommendation | Decision needed |
| --- | --- | --- | --- |
| Main phone | Owner input required | зафиксировать один основной публичный номер | подтвердить номер |
| Messengers | Owner input required | выбрать 1-2 канала: `Telegram` и/или `WhatsApp` | подтвердить каналы |
| Public email | Owner input required | либо подтвердить один публичный email, либо сознательно не выводить email как primary CTA | подтвердить |
| Primary CTA truth | Partial | `Получить консультацию и обсудить проект` | подтвердить wording |
| Service area truth | Partial | привязать к одному launch region и не расползаться географически | подтвердить wording |

## 3. Launch Region / Service Area Confirmation

- Recommendation: `Сочи / Большой Сочи`
- Backup option: `Адлер / Сириус`
- Why this is recommended: этот вариант уже согласован текущим launch-core и лучше всего удерживает локальный SEO-фокус phase 1.
- Decision needed: выбрать один вариант как канонический launch region / primary service area.

Recommended public wording after confirmation:

- `Работаем в Сочи и Большом Сочи.`

Если выбран backup, wording должен быть переписан под него и не смешиваться с более широким регионом.

## 4. Final Launch Service Core

Recommended default: запускать ядро из `5` service pages и не тянуть шестую коммерческую страницу в phase 1 без доказательной базы.

| Service page | Why it is in launch-core | Owner review | Status |
| --- | --- | --- | --- |
| `Строительство домов под ключ` | anchor money page и главный коммерческий маршрут | Yes | `confirmed` |
| `Монолитные работы` | сильный локальный intent и proof-led технологическая страница | Yes | `confirmed` |
| `Реконструкция и капитальный ремонт зданий` | отдельный intent, не сводимый к новому строительству | Yes | `confirmed` |
| `Фасадные работы` | practical service intent с потенциально более короткой конверсией | Yes | `needs owner confirmation` |
| `Строительство гостевых домов` | локально релевантная страница для сочинского контекста, но только если это реальный scope компании | Yes | `needs owner confirmation` |
| `Строительство коммерческих объектов` | optional B2B slot, но доказательная база пока слишком слабая | Yes | `exclude from phase 1` |

### What is explicitly not in phase 1 service core

- `Строительство коммерческих объектов` без реального подтверждённого кейса и owner-approved public scope.
- Любые дополнительные service pages beyond launch-core.
- Географические дубль-страницы под разные города и посёлки.
- Узкие sub-service clones вроде отдельных страниц только под `фундамент`, `подпорные стены`, `каркас` и similar fragments до тех пор, пока не собран proof-led core.

## 5. Final Launch Case Core

Ниже не переизлагается весь inventory. Здесь только owner-priority по кейсам, которые стоит считать launch-важными.

| Working case label | Recommendation | Why this is recommended | Current state |
| --- | --- | --- | --- |
| `Частный дом на участке со сложным рельефом` | include as priority case | лучше всего подтверждает локальную сочинскую специфику | `provisional` |
| `Монолитный каркас и конструктив частного объекта` | include as priority case | усиливает монолит и техническую доказательность | `provisional` |
| `Реконструкция существующего здания` | include as priority case | поддерживает reconstruction service page и снимает risk of one-dimensional profile | `provisional` |
| `Гостевой или небольшой коммерческий объект` | keep only as reserve | нужен только если реально существует publishable объект | `blocked by missing evidence` |

Decision needed:

- подтвердить, какие 2-3 кейса реально приоритетны для сбора и публикации на запуск;
- подтвердить, существует ли вообще publishable guest/commercial case;
- определить, какой из кейсов считать `flagship` и всегда отправлять на owner review.

## 6. Public Claim Boundaries

Это не legal policy. Это практические границы для публичного контента и AI-assisted drafting.

### Allowed

- factual descriptions of services, этапов работ, материалов и процесса
- wording like `предварительный расчёт`, `предварительная оценка`, `обсудить проект`, `получить консультацию`
- verified company facts: legal identity, SRO membership, confirmed service area
- case-based statements that are directly supported by real project evidence

### Restricted / Requires Careful Wording

- сроки: только как ориентиры, диапазоны или зависящие от объёма и исходных данных
- стоимость: только как предварительная оценка после понимания задачи, без имитации точного прайса
- гарантии: только в той мере, в какой owner готов дать точную публичную формулировку
- comparative result claims: только если они опираются на конкретный кейс или проверяемый факт
- guest-house / commercial wording: только после подтверждения реального scope и допустимых формулировок

### Prohibited Without Explicit Owner Approval

- fixed completion promises on public pages
- `от X` pricing without a defendable pricing logic
- blanket guarantee promises without exact approved wording
- `лучшие`, `№1`, `самые надёжные` and similar superiority claims
- investment-return promises for guest-house or commercial scenarios
- invented facts, hidden assumptions or AI-generated commercial certainty

Decision needed:

- подтвердить, что именно компания готова публично говорить про сроки;
- подтвердить, допустимо ли вообще использовать `от X` pricing language;
- утвердить точную публичную формулировку про гарантии или запретить её до отдельного согласования.

## 7. Mandatory Owner Review Map

### Always goes to owner review

- `/`
- `/about`
- все launch service pages при первой публикации
- flagship cases
- любые страницы с формулировками про цены, сроки, гарантии, окупаемость, чувствительные коммерческие обещания
- guest-house / commercial content, если он остаётся в launch scope

### Can go through standard editorial flow

- `/contacts` после подтверждения contact truth
- supporting articles без новых коммерческих claims
- FAQ updates
- routine proof-led updates on pages, если они не меняют коммерческий смысл

Decision needed:

- подтвердить, что этот review map достаточен и не требует расширения.

## 8. Open Decisions Blocking Launch

1. Подтвердить публичное имя бизнеса на сайте.
2. Подтвердить основной публичный телефон, мессенджеры и при необходимости email.
3. Подтвердить один primary launch region / service area.
4. Подтвердить финальный launch service core из `5` страниц и исключение commercial page из phase 1 по умолчанию.
5. Подтвердить, остаётся ли `Строительство гостевых домов` в phase 1.
6. Подтвердить, какие 2-3 кейса действительно собираются в launch priority.
7. Утвердить boundaries по срокам, стоимости и гарантиям.
8. Подтвердить список page types, которые всегда требуют owner review.

После этих решений следующий шаг уже не новый spec, а evidence pack и production queue.
