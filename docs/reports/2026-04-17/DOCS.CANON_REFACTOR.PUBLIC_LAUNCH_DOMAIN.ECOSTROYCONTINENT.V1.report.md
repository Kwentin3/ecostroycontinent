# DOCS.CANON_REFACTOR.PUBLIC_LAUNCH_DOMAIN.ECOSTROYCONTINENT.V1

Дата: 2026-04-17  
Режим: Documentation / Canon Refactor  
Основание: `AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1`

## 1. Executive summary

### Что было не так

Канон по public launch domain содержал правильные отдельные тезисы, но оставался фрагментированным:

- роль `Home` была описана не как жёсткий hub-контракт, а как общий слой
- service/case/nav/proof/conversion/publish связи были разнесены по разным документам
- оставалась двусмысленность про границы `Page` относительно service-like route truth
- не было одного practically usable документа, который можно дать команде реализации без догадок

### Что сделано

- выполнен минимальный пакет рефакторинга: 1 companion doc + точечные обновления 4 канонических briefing-файлов + addendum в PRD
- зафиксирована цельная public launch модель для phase 1
- явно закреплены: day-1 core, ownership boundaries, navigation contract, proof minimum, contact/region truth gates, publish/SEO coupling

### Что это даёт

- меньше архитектурного drift
- меньше риска page-based landing chaos
- проще ставить реализационные задачи по public refactor без споров о базовых определениях

## 2. What was under-specified

1. Home как hub был не закреплён как обязательный маршрутный контракт.
2. Services index/detail и cases layer были описаны, но не как единая система с conversion и publish gates.
3. Navigation-model отсутствовал как каноническая обязательная часть (header/active/breadcrumbs/footer/related/mobile).
4. Не было чёткого day-1 vs phase-1-later разделения для blog/article.
5. Не хватало explicit связи между publish semantics и technical SEO delivery baseline.
6. Contact/region truth присутствовали как идеи, но не как жёсткие launch gates.

## 3. What was contradictory or drift-prone

1. В PRD присутствовала формулировка, допускающая трактовку `Page` как owner service/equipment route при page-managed подходе.
2. На уровне docs не было явного override этой двусмысленности.
3. В результате implementation drift в сторону page-based service-like surfaces становился архитектурно "оправдываемым".
4. `/blog` одновременно фигурировал как часть phase-1 карты и как недостижимый runtime слой без явного режима "later within phase 1".

## 4. Target canonical model for public launch domain

Закреплённая модель:

- Public launch = не universal landing, а связка:
  - `Home -> Services Index -> Service Detail -> Case/Proof -> Contact Action`
- Day-1 route core:
  - `/`
  - `/services`, `/services/[slug]`
  - `/cases`, `/cases/[slug]`
  - `/about`, `/contacts`
- `/blog` и `Article` = supporting layer phase 1, вводится после readiness
- Ownership:
  - `Service` / `Case` / `Article` владеют route truth
  - `Page` владеет standalone pages + composition only
- Navigation включена в канон как часть SEO/UX/conversion architecture
- Publish и SEO delivery связаны в один launch-ready контракт

## 5. Documentation refactor strategy

Решение: **минимальный и достаточный пакет**.

Почему не полный rewrite PRD:

- задача локальная (public launch domain coherence)
- переписывание PRD создало бы шум и риск случайного изменения других доменов

Почему добавлен companion doc:

- требовался единый operational документ, где все публичные границы и роли видны как система
- это уменьшает дубли и снимает необходимость растягивать PRD

## 6. Files changed

1. `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
2. `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
3. `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
4. `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
5. `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md` (узкий addendum, без переписывания ядра)

## 7. New files added

1. `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`

## 8. Proposal section

### PROPOSAL 1

- Что предлагается:
  - закрепить `/blog` + `Article` как phase-1 supporting layer, но не day-1 mandatory gate.
- Зачем:
  - снимает конфликт между каноном и фактической launch readiness, не размывая phase 1.
- Какую дыру закрывает:
  - убирает pressure на преждевременный запуск слабого/неготового blog contour.
- Почему это не scope creep:
  - это не новый домен и не новая фича; это дисциплина launch cut.
- Почему сейчас:
  - без этого команда продолжит спорить, launch ли блокируется отсутствием `/blog` прямо в day-1.
- К каким docs относится:
  - companion doc, 01/04, PRD addendum.
- Риск если не принять:
  - повторяющийся drift и попытка "закрыть галочку" блогом без готового контента.

Статус: **принято в рефакторе**.

### PROPOSAL 2

- Что предлагается:
  - ввести отдельный companion doc `Public_Launch_Domain_Canon` как нормативный operational слой.
- Зачем:
  - собрать в одном месте home/service/case/nav/ownership/proof/conversion/publish+SEO coupling.
- Какую дыру закрывает:
  - убирает фрагментацию правил между 01/02/03/PRD.
- Почему это не scope creep:
  - это документационная нормализация текущего канона, не расширение продукта.
- Почему сейчас:
  - следующий шаг после этого рефактора — refactor реализации; нужен однозначный reference.
- К каким docs относится:
  - новый companion + ссылки из обновлённых docs.
- Риск если не принять:
  - реализация продолжит идти через локальные интерпретации и drift.

Статус: **принято в рефакторе**.

## 9. Risks / open tensions

1. PRD ядро по-прежнему содержит исторические формулировки; addendum закрывает конфликт, но при будущей минорной ревизии PRD стоит инлайн-обновить соответствующие блоки.
2. Документационный рефактор не заменяет runtime remediation: без published core, proof и SEO baseline launch остаётся no-go.
3. Нужна дисциплина использования companion doc как первичного operational reference для public refactor задач.

## 10. Simple-language summary for owner

- В документации была логика, но она была разбросана и местами двусмысленна.
- Мы не переписывали проект заново.
- Мы аккуратно добавили один главный документ, который объясняет, как должен работать публичный launch как единая система.
- Мы подтянули 4 базовых канонических файла и добавили маленькое уточнение в PRD.
- Теперь команде проще реализовывать публичный refactor без споров, где границы `Home`, `Service`, `Case`, `Page`, навигации и publish.

## FINAL RECOMMENDATION

Рекомендуемый пакет рефакторинга: **1 companion doc + точечные updates в 01/02/03/04 + узкий PRD addendum**.

Почему пакет минимален и достаточен:

- закрывает ключевые двусмысленности без масштабного rewrite
- сохраняет phase-1 дисциплину и существующий канон
- создаёт practically usable reference для следующего этапа реализации

Самые важные решения из рефакторинга:

1. Зафиксирован system-model launch: `Home -> Services -> Service detail -> Case/proof -> Contact action`.
2. Жёстко разделены ownership boundaries: `Page` не дублирует route truth `Service/Case/Article`.
3. Навигация переведена в канон как обязательная часть SEO/conversion architecture.
4. Введён явный day-1 core и отдельно phase-1-later слой для blog/article.
5. Связка publish semantics и technical SEO baseline зафиксирована как единый launch gate.
