# AUDIT.VERIFY.PAGES_CREATE_MODAL_STATE_PRESERVE.V1.report

## 1. Executive Summary

Verdict: **PASS WITH MINOR NOTES**

Фича client-side сохранности полей create modal после server-side validation error действительно реализована и работает в живом сценарии. После validation error registry modal:

- переоткрывается внутри домена `Страницы`;
- сохраняет `pageType` и `title`;
- показывает operator-facing ошибку;
- позволяет исправить данные и повторно отправить форму;
- не ломает redirect в unified page workspace на happy path.

Проверка по коду и по live WebGUI не выявила разрастания решения в wizard, отдельный draft-flow или второй truth-store. Решение осталось bounded: короткий query-contract на failure path плюс client rehydration в рамках уже существующего registry flow.

Низкорисковые заметки:

- `title` временно эхоится в query string на failure redirect;
- server-side validation path в текущем UI пришлось провоцировать диагностически через hidden `h1`, потому что обычный пустой submit блокируется клиентом раньше. Это не ломает фичу и не противоречит scope, но означает, что наиболее частый операторский путь ошибки уже гасится на клиенте.

## 2. Source Docs Used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_SINGLE_WORKFLOW_EPIC.V1.report.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_FOLLOWUP_CLEANUP_AND_POLISH.V1.report.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_CREATE_MODAL_STATE_PRESERVE.V1.report.md`

Все заявленные пути найдены без поиска эквивалента.

## 3. Claimed Feature Scope

Claimed baseline из implementation report:

- registry-native create flow остаётся primary narrative;
- при server-side validation error page registry получает короткий failure redirect;
- modal открывается повторно внутри `/admin/entities/page`;
- поля `pageType` и `title` не теряются;
- create contract остаётся bounded и не затрагивает page workspace / metadata / AI / preview architecture.

## 4. Code Paths Audited

Основные проверенные зоны:

- `app/admin/(console)/entities/[entityType]/page.js`
  - page registry собирает `createState` через `buildRegistryCreateState(query)` и прокидывает его в `PageRegistryClient`.
- `components/admin/PageRegistryClient.js:31-62`
  - хранит только локальное modal-state для `createOpen`, `createTitle`, `createType`, `createError`;
  - синхронизирует его с server-provided initial state через `useEffect`.
- `components/admin/PageRegistryClient.js:156-159`
  - primary entry `Новая страница` остаётся внутри registry.
- `components/admin/PageRegistryClient.js:271-316`
  - create form по-прежнему узкая: hidden `redirectMode=page_workspace`, `failureRedirectTo=/admin/entities/page?create=1`, hidden `h1`, visible `pageType` и `title`.
- `app/api/admin/entities/[entityType]/save/route.js:46-63`
  - success path ведёт в `/admin/entities/page/[pageId]`;
  - failure path для page create возвращает `error`, `createPageType`, `createTitle`.
- `lib/admin/page-registry-create.js:3-11`
  - bounded parser query-contract; никаких дополнительных stores или draft artifacts.
- `lib/admin/operation-feedback.js:33-114`
  - human-friendly operator message для Zod-like validation payload.
- `tests/admin/page-registry-create.test.js`
- `tests/admin/entity-save.route.test.js`
- `tests/operation-feedback.test.js`

Дополнительная code audit проверка:

- поиск по `app`, `components`, `lib`, `tests` не выявил использования `localStorage` / `sessionStorage` для этой фичи;
- не выявлен новый create-domain или отдельный client persistence layer.

## 5. Functional Verification Scenarios

Проверка проведена на живом сервере `https://ecostroycontinent.ru` под реальным operator login.

### Scenario A — Happy path

Шаги:

1. Открыт `/admin/entities/page`.
2. Create modal открыт кнопкой `Новая страница` из registry.
3. Выбраны `pageType=about` и уникальный `title`.
4. Форма отправлена обычным submit.
5. Получен redirect в `/admin/entities/page/[pageId]?message=...`.

Факт:

- success redirect работает;
- страница реально создаётся;
- пользователь попадает в unified page workspace, а не в отдельный create-domain.

Evidence:

- `components/admin/PageRegistryClient.js:271-316`
- `app/api/admin/entities/[entityType]/save/route.js:46-52`
- live result: redirect в `https://ecostroycontinent.ru/admin/entities/page/entity_5448e2f7-377d-4b31-9fcf-f6dfeb9b6c19?...`

### Scenario B — Validation error path

Шаги:

1. Открыт create modal.
2. Заданы `pageType=contacts` и `title`.
3. Server-side validation error спровоцирован диагностически через очистку hidden `h1`, чтобы пройти именно через серверный failure redirect contract.
4. Сервер вернул redirect обратно в `/admin/entities/page?create=1...`.
5. Modal автоматически переоткрылся.
6. Поля сохранены.
7. Ошибка показана.
8. Повторный submit с исправленным состоянием успешно открыл page workspace.

Факт:

- failure return path работает;
- `title` и `pageType` не теряются;
- human-friendly error показывается внутри modal;
- повторная отправка успешна.

Evidence:

- `app/api/admin/entities/[entityType]/save/route.js:54-59`
- `lib/admin/page-registry-create.js:3-11`
- `components/admin/PageRegistryClient.js:57-62`
- `components/admin/PageRegistryClient.js:276-316`
- live result URL:
  - `/admin/entities/page?create=1&error=Основной+заголовок+(H1)...&createPageType=contacts&createTitle=...`
- live dialog text:
  - `Основной заголовок (H1): поле обязательно для заполнения.`

### Scenario C — Repeat / reopen stability

Шаги:

1. Modal открыт.
2. Закрыт кнопкой `Отмена`.
3. Открыт снова из registry.
4. Повторно вызван server-side validation error.
5. Проверено сохранение полей и дружелюбное сообщение.
6. После успешного create и возврата в registry проверено отсутствие stale auto-open.

Факт:

- modal открывается/закрывается стабильно;
- повторный validation path не деградирует в хаотичное состояние;
- после успешного submit modal не всплывает снова сам по себе.

Evidence:

- live audit result:
  - `closedCleanly = true`
  - `reopenNotChaotic = true`
  - `secondValidationFriendly = true`
  - `staleModalAfterSuccess = false`

### Scenario D — Fallback safety

Шаги:

1. Открыт `/admin/entities/page/new`.
2. Проверено, что маршрут грузится.
3. Проверено, что это по-прежнему отдельный fallback editor, а не primary flow.

Факт:

- fallback route не сломан;
- primary narrative по-прежнему остаётся в registry modal.

Evidence:

- `components/admin/PageRegistryClient.js:308-310`
- live body sample `/admin/entities/page/new` содержит `Новый черновик`

### Scenario E — Regression sweep

Проверено:

- `Карточки / Список` toggle работает;
- filters `missing` / `inactive` не ломают экран;
- metadata modal открывается из card menu;
- открытие page workspace по create redirect работает.

Факт:

- регрессий в затронутом operator shell не обнаружено.

Evidence:

- live audit result:
  - `listModeHasOpenLinks = true`
  - `cardsModeHasPreviewFallback = true`
  - `metadataModalOpened = true`
  - `missingFilterCount = 4`
  - `inactiveFilterCount = 0`

## 6. Findings

### 6.1 Feature existence

**Fact:** Фича реализована полностью, не частично.

Почему:

- failure redirect действительно возвращает bounded create values;
- registry route действительно их подхватывает;
- client modal действительно ре-гидрирует и показывает ошибку;
- повторный submit действительно приводит к success redirect.

### 6.2 Preserved fields

**Fact:** После validation error сохраняются:

- `pageType`
- `title`
- operator-facing `error`

Evidence:

- `app/api/admin/entities/[entityType]/save/route.js:55-58`
- `lib/admin/page-registry-create.js:6-10`
- `components/admin/PageRegistryClient.js:57-62`

### 6.3 Intentionally not preserved

**Fact:** Не сохраняются:

- metadata;
- SEO;
- route/service fields beyond current create contract;
- page composition / workspace state;
- publish/review/history state.

**Inference:** Это правильно и соответствует bounded scope. Для этой фичи отсутствие их сохранения не является багом.

Почему:

- create contract в modal по-прежнему ограничен `pageType + title` plus derived `h1`;
- любая более широкая rehydration уже была бы scope drift.

Evidence:

- `components/admin/PageRegistryClient.js:271-316`

### 6.4 UX boundedness

**Fact:** Wizard, отдельный create-domain и второй truth-store не появились.

Почему:

- create modal живёт внутри registry surface;
- сохранение построено на коротком redirect/query contract;
- отдельного persistence слоя нет;
- fallback `/admin/entities/page/new` не стал primary flow обратно.

Evidence:

- `components/admin/PageRegistryClient.js:156-159`
- `lib/admin/page-registry-create.js:3-11`
- repo search: отсутствуют `localStorage` / `sessionStorage` additions для этой фичи

### 6.5 Contract safety

**Fact:** Canonical `Page` ownership и existing save/create lifecycle не сломаны.

Почему:

- success path по-прежнему идёт через canonical `saveDraft()` narrative;
- create success redirect ведёт в `/admin/entities/page/[pageId]`;
- failure path только возвращает operator обратно в registry, не создавая второй owner workflow.

Evidence:

- `app/api/admin/entities/[entityType]/save/route.js:36-52`
- `app/api/admin/entities/[entityType]/save/route.js:54-63`

### 6.6 Implementation quality

**Fact:** Выбранный механизм минимально достаточен.

Почему:

- он решает именно reopen + rehydrate problem;
- не тащит сложный flash-store;
- не вводит отдельную форму состояния поверх текущего registry UX;
- допускает обычный refresh/redirect cycle, что соответствует server-driven create flow.

**Minor note:** `title` попадает в query string при failure redirect.

Оценка:

- acceptable limitation;
- не выглядит как security defect для текущего поля;
- не требует отдельного fix-cycle для принятия фичи.

## 7. Regressions Check

Проверено и не сломано:

- single-workflow model `Страницы` как primary domain entry;
- registry-native create flow;
- redirect into `/admin/entities/page/[pageId]` on success;
- fallback `/admin/entities/page/new`;
- cards/list registry modes;
- filters `missing` / `inactive`;
- metadata modal open flow;
- page workspace open flow after create;
- тесты и build.

Не проверялось глубоко в рамках этого audit:

- review / publish / history end-to-end;
- AI panel detailed behavior;
- preview parity beyond confirming, что page workspace create redirect жив.

**Inference:** Эти зоны не выглядят затронутыми данным change set и честно оставлены вне узкого verification scope.

## 8. Verdict

**PASS WITH MINOR NOTES**

Обоснование:

- основная фича реализована и работает в живом пользовательском сценарии;
- bounded create contract не распух;
- второй state-store / draft narrative не появился;
- single-workflow model не деградировала;
- regressions в ближайших связанных flows не обнаружены.

Почему не просто PASS:

- failure redirect всё ещё эхоирует `title` в URL;
- полноценный server-side validation path для аудита пришлось воспроизводить диагностически через hidden `h1`, потому что типичный пустой submit уже блокируется клиентом.

Это low-level notes, а не blockers.

## 9. If Failed — Required Fixes

Не применимо. Verdict не `FAIL`.

## 10. Remaining Open Questions

- Нужно ли когда-либо убирать `create` / `error` / `createTitle` / `createPageType` из URL сразу после reopen, или текущий redirect-safe contract достаточно хорош для bounded admin flow.
- Нужно ли со временем унифицировать этот же lightweight error-return pattern для других небольших modal actions.
- Нужно ли отдельно делать operator-visible success feedback в page workspace после create, если текущий `?message=` redirect уже считается достаточным на уровне существующего UX.
