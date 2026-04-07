# UI Russification Implementation Plan v1

Основание для этого плана: `docs/reports/UI_RUSSIFICATION_AUDIT_v1.report.md`.

## 1. Objective

Сделать текущую админку и операторские экраны последовательно русскими, понятными и одинаковыми по терминологии.

План не вводит полноценную платформу i18n и не меняет продуктовую семантику. Его задача - быстро убрать англоязычную и разработческую интонацию из реально используемых поверхностей.

## 2. Scope Boundaries

- Только admin / internal operator UI.
- Без публичного сайта и без стратегии многоязычности.
- Без переписывания бизнес-логики, маршрутов и публикационного процесса.
- Без нового языка интерфейса и без переключателя локалей.
- Без отдельной терминологической системы ради системы.
- Без изменения кодовых имен там, где они не видны оператору.

## 3. Recommended Terminology Baseline

Рекомендуемая база терминов для UI:

| Смысл | Рекомендуемая форма в UI | Комментарий |
|---|---|---|
| Landing workspace | Рабочая зона лендингов | `workspace` не оставлять в пользовательских надписях |
| Workspace chooser | Выбор рабочей зоны | Коротко и понятно |
| Page truth | Каноническая страница | Допустимо `страница-источник` там, где нужен акцент на редакторе |
| Candidate / draft | Черновик | `candidate` не показывать как термин |
| Memory Card | Рабочая память | Внутреннее имя может остаться в коде |
| Intent composer | Постановка задачи | Не превращать в `конструктор промпта` |
| Turn log | Журнал хода | Если контекст только про действия, допустимо `Журнал действий` |
| Preview | Предпросмотр | Не использовать `Превью` как базовую форму |
| Verification | Проверка | Для статусов - `проверка пройдена` / `не пройдена` |
| Review handoff | Передать на проверку | В русской UI-лексике лучше не держать `review` |
| Publish | Опубликовать | Базовый глагол для кнопок и статусов |
| Generate | Сгенерировать | Базовая форма для AI-операций |
| Regenerate | Сгенерировать заново | Более естественно, чем `перегенерировать` |
| Blocking issue | Блокирующая проблема | Для предупреждений и верификации |
| Trace | Трассировка | Только там, где это реально технически нужно |

Технические сокращения, которые можно оставить без перевода, если они не торчат в повседневных кнопках и заголовках:

- `LLM`
- `SEO`
- `API`
- `JSON`
- `URL`

`Prompt` лучше не оставлять как английское слово в UI. В зависимости от места оно должно быть либо `промпт`, либо `постановка задачи`.

## 4. Priority Order of Screens / Surfaces

1. Landing workspace chooser and the dedicated landing workspace screen.
2. Source editor CTA and handoff into workspace / review.
3. Memory Card panel and verification panel.
4. Review page and publish handoff copy.
5. Legacy service-prefixed panels that are still visible to operators.
6. Media workspace and technical diagnostics screens.
7. Shared copy helpers and repeated empty / status / toast strings.

## 5. Phase 1 Copy Cleanup Targets

Первая волна должна убрать самый заметный английский след там, где оператор работает каждый день.

- `app/admin/(console)/workspace/landing/page.js`
  - перевести chooser-экран и все заголовки, пустые состояния, подсказки, CTA;
  - заменить `Landing workspace`, `Workspace chooser`, `Resume current workspace`, `Choose the Page owner first` и похожие формы на нормальный русский;
  - убрать смешанные строки типа `Открыть workspace`.
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
  - перевести `Page truth`, `Turn log`, `Recent turn`, `Intent composer`, `Bounded landing instruction`, `Open source editor`, `Open review`, `Refresh workspace anchor`;
  - унифицировать `Preview` / `Превью` в одну форму `Предпросмотр`;
  - привести текст textarea и fallback copy к русскому.
- `components/admin/LandingWorkspaceMemoryPanel.js`
  - заменить `Memory Card`, `Session identity`, `Editorial intent`, `Proof selection`, `Artifact state`, `Trace`, `Decisions`, `Derived slice` на русский операторский язык.
- `components/admin/LandingWorkspaceVerificationPanel.js`
  - перевести `Landing report`, `Landing candidate report`, `Approval-eligible`, `Render compatible`, `Publish-ready`, `Blocking issues`, `Verification classes`;
  - сделать формулировки короткими и статусными.
- `lib/landing-workspace/landing.js`
  - перевести summary strings, которые сейчас возвращаются в English fallback copy;
  - держать единый словарь для warning / blocking / success.
- `app/api/admin/workspace/landing/[pageId]/route.js`
  - заменить английские error / fallback messages на русские operator-facing формулировки.
- `components/admin/EntityEditorForm.js`
  - заменить developer-facing CTA вроде `Сгенерировать candidate/spec` на понятную оператору форму, например `Сгенерировать черновик` или `Сформировать черновик и спецификацию` в зависимости от контекста.
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
  - перевести CTA, который ведет в landing workspace, на русский без смешения языков.

## 6. Phase 2 Consistency Cleanup Targets

Когда самые заметные экраны будут чистыми, нужно выровнять терминологию по всей админке.

- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
  - убрать английский из видимых заголовков и статусов;
  - оставить кодовые имена как transitional substrate, но не показывать их пользователю.
- `components/admin/RevisionDiffPanel.js`
- `components/admin/PreviewViewport.js`
  - зафиксировать одну форму `предпросмотр` во всех местах.
- `components/admin/MediaGalleryWorkspace.js`
- `components/admin/MediaCollectionOverlay.js`
- `components/admin/MediaImageEditorPanel.js`
  - вычистить `inspector`, `usage`, `draft asset`, `variant flow`, `binary overwrite` и похожие developer-формулировки;
  - заменить на русский, но не делать из медиа-экрана бюрократический документ.
- `components/admin/LlmDiagnosticsPanel.js`
  - оставить технический характер экрана, но перевести явные пользовательские подписи и статусы на русский.
- `lib/ui-copy.js`
- `lib/admin/screen-copy.js`
- `lib/admin/operation-feedback.js`
  - собрать повторяющиеся формулировки в один короткий набор русских копи-блоков, чтобы не плодить расхождения.

## 7. Optional Later Improvements

- Добавить короткий глоссарий в shared copy module, чтобы будущие правки не расползались.
- Добавить узкие copy regression tests на самые важные пользовательские строки.
- По мере касания соседнего кода заменить transitional service-prefixed имена на landing-neutral названия.
- Сделать отдельный проход по toast / confirm / empty-state текстам после основного копирайт-паса.

## 8. Risks / Gray Zones

- `LLM`, `SEO`, `API`, `JSON`, `URL` лучше оставить как технические сокращения, если рядом есть русское объяснение.
- `Memory Card` как внутреннее имя можно сохранить в коде, но в UI лучше показывать `Рабочая память`.
- `Prompt` лучше переводить или транслитерировать, а не оставлять английским словом.
- `Trace` допустим только как технический термин; если экран операторский, его лучше объяснять по-русски.
- `Preview` и `Превью` не стоит смешивать, иначе пользовательский язык снова распадается.
- Некоторые transitional service-prefixed названия могут остаться в коде временно, но они не должны определять пользовательскую семантику.

## 9. Explicit Non-Goals

- Не строить full i18n framework.
- Не вводить переключатель языков.
- Не трогать public-site локализацию.
- Не переписывать publish flow и review architecture.
- Не превращать админку в page builder.
- Не вводить новую терминологию, если уже есть простой русский вариант.
- Не менять бизнес-смысл экранов ради красивой формулировки.

