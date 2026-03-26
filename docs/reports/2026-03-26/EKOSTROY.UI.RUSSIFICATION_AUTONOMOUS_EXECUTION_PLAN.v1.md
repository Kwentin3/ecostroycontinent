# EKOSTROY.UI.RUSSIFICATION_AUTONOMOUS_EXECUTION_PLAN.v1

Основано на аудите: `docs/reports/2026-03-26/EKOSTROY.UI.RUSSIFICATION_AND_FRIENDLY_COPY.AUDIT.v1.report.md`

Цель этого документа: превратить результаты аудита в автономный, phase-1-safe план внедрения русификации и friendly-copy remediation, без переоткрытия product canon, без новой i18n-платформы и без редизайна.

## 1. Executive decision

### Рекомендуемая стратегия

Рекомендуем staged transition, а не большой bang и не full localization platform.

Порядок исполнения должен быть таким:

1. Сначала зафиксировать тонкий канон: glossary, forbidden variants, status and entity mappings, surface allowlist.
2. В том же execution band сразу убрать самые видимые английские остатки и технический шум на user-facing поверхностях.
3. Затем нормализовать терминологию и статусы.
4. После этого зачистить copy architecture и raw-key leaks.
5. Только затем довести friendly-copy, empty/error states и destructive confirms до человеческого уровня.
6. Финальным шагом провести verification и runtime content sweep.

### Почему именно так

- Если начать с массовой замены строк без канона, терминологический хаос закрепится быстрее, чем русификация.
- Если долго строить foundation без visible cleanup, проект уйдёт в архитектурную инерцию и не даст пользователю заметного результата.
- Если пытаться решить всё через full i18n framework, phase 1 расползётся за пределы current operating model.
- Если игнорировать live content, код можно сделать русским, а пользователь всё равно увидит English из данных.

### Короткий вывод

Первым должен быть не blind cleanup, а минимальный glossary + mappings scaffold. Но он не должен идти отдельным долгим этапом. Канон нужно поднять быстро и тут же использовать для wave 1 cleanup.

### Прямые ответы на ключевые вопросы

| Вопрос | Решение | Почему |
| --- | --- | --- |
| Что должно быть первым: быстрый RU cleanup или glossary + mappings layer? | Сначала glossary + mappings scaffold, затем сразу quick wins в том же wave | Это закрывает риск терминологического дрейфа и raw-key leaks |
| Нужен ли один unified copy layer сейчас? | Нет full platform. Нужен staged thin copy layer с мапперами и surface namespaces | Это phase-1-safe и не создаёт platform sprawl |
| Как избежать raw keys в UI? | Не рендерить raw enum/status keys напрямую, всегда идти через mapping helpers и protected scan gates | Leakage нужно блокировать на уровне рендера и на уровне QA |
| Как не звучать как backend? | Переписывать copy в формате: что произошло, почему, что делать дальше | Это снижает когнитивную нагрузку без изменения процессов |
| Как не пропустить live content in DB? | Отдельный runtime content sweep track, не маскировать это под code-only fix | Код и данные должны проверяться раздельно |
| Как не смешать user-facing и dev-only? | Жёсткий surface allowlist для user UI, dev fixtures и scripts держать вне copy scope | Это убирает ложные попадания из proof set |
| Как QA должен доказать human-friendly результат? | Text QA, screenshot QA, workflow regression QA, glossary consistency QA, runtime sweep | Одного grep недостаточно |
| Где граница между implementation и review? | Implementation может делать literal translation и safe copy cleanup. Public claims, workflow semantics и sensitive wording идут на review | Это защищает operational truth |

### Confirmed ground and uncertain ground

- Confirmed ground: code-defined public, admin, shared, system and dev-only surfaces уже видны и их можно адресно чистить.
- Confirmed ground: English leftovers, raw keys, mixed RU/EN, technical-speak и mojibake действительно есть на user-facing поверхностях.
- Uncertain ground: часть live content может жить в data/runtime layer, а не в коде.
- Fallback model: если runtime sweep найдёт смешанный контент, это отдельный content track, а не повод ломать execution plan.

## 2. Execution doctrine

### Canonical execution unit

Canonical unit для этой работы - surface pack.

Surface pack - это один ограниченный набор поверхностей с одним write set, одним glossary subset и одним review packet.

Подходящие packs:

- public pack: public web pages, published renderers, metadata, fallback states.
- admin feedback pack: login/logout, operation feedback, toasts, banners, API-returned messages.
- workflow pack: review, readiness, publish, rollback, history, timeline, revision status labels.
- shared widget pack: checklist, media picker, diff panels, entity labels, table headers.
- bootstrapping pack: superadmin bootstrap and other launch-time admin utilities.

Правила surface pack:

- один pack = один primary owner и один bounded write set;
- изменения между pack'ами допускаются только через shared helper, glossary или mapping layer;
- если pack touches shared helper, это отдельный review packet, а не скрытый side effect;
- нельзя одновременно править user-facing copy и менять domain semantics в том же непрозрачном bundle.

### Autonomy boundary

Агент может автономно:

- заменять очевидные английские строки на approved Russian equivalents;
- чинить mojibake и encoding damage в user-facing messages;
- выносить повторяющиеся статусы, роли, entity labels и feedback messages в mappings;
- удалять direct raw-key rendering из user-facing components;
- упрощать технически сухой copy, если semantics остаётся прежней;
- добавлять tests, scans, snapshots и proof artifacts;
- разводить user-facing, system и dev-only text paths;
- фиксить metadata, titles, placeholders, helper text, empty states и safe confirm text в пределах канона.

Агент должен эскалировать:

- любой ambiguous business term;
- любую фразу, которая может трактоваться как commercial claim, guarantee, SLA or promise;
- любой workflow label, который меняет смысл review, publish, readiness или rollback;
- любой текст, где непонятно, пользовательский это surface или internal/dev-only surface;
- любой runtime content finding, если источник текста находится вне текущего code scope;
- любую попытку превратить cleanup в redesign, new platform or domain change.

### Approval budget

Рекомендуемый budget на весь эпик, чтобы не уйти в owner ping-pong:

1. Gate 1: glossary seed и forbidden variants.
2. Gate 2: sensitive wording and workflow semantics packet.
3. Gate 3: final sign-off после verification.

Это означает:

- не согласовывать каждый label отдельно;
- присылать consolidated packets, а не поток мелких вопросов;
- эскалировать только спорные или owner-sensitive узлы.

### Review gates

Обязательные review gates:

- Canonical glossary gate: термины, forbidden variants, short label policy.
- Sensitive copy gate: public-facing and Business Owner-facing wording, особенно там, где есть claims or obligations.
- Workflow semantics gate: review, readiness, publish, rollback, owner action semantics.
- Final QA gate: все критические поверхности, включая runtime content sweep, если он нашёл data-layer copy.

### Stop triggers

Исполнение нужно останавливать и отдельно фиксировать blocker, если:

- обнаружено несколько конкурирующих UI layers, и непонятно, какой из них real surface;
- значимая часть текста приходит из runtime/data слоя, который не контролируется текущим репозиторием;
- raw keys продолжают протекать в UI даже после введения mapping layer;
- конкретный label меняет operational truth, а не только wording;
- работа начинает уходить в full multilingual platform или redesign;
- невозможно отделить user-facing text от dev-only fixture text;
- glossary не может быть согласован без product-owner decision.

### Non-goals

- Не строить full multilingual localization platform.
- Не переопределять domain boundaries или route ownership.
- Не менять publish semantics.
- Не делать AI owner of terminology truth.
- Не вводить autonomous publishing.
- Не расширять scope beyond current phase 1.

## 3. Target end-state

### Public UI

- Public web честно RU-only.
- Никаких visible English titles, CTAs, fallbacks, metadata или empty/error states.
- Никаких raw keys, system identifiers или mixed RU/EN fragments.
- Тон copy дружелюбный, понятный и task-oriented.

### Admin UI

- Admin shell и workflow surfaces русские по умолчанию.
- Технические термины либо переведены, либо объяснены кратко и последовательно.
- Statuses, roles, entity labels и action verbs использованы через один канон.
- Destructive actions и publish flow звучат спокойно и ясно.

### System messages

- Все user-visible system messages идут из одного controlled слоя.
- Нет English leftovers из API responses, login/logout handlers или operation feedback.
- Нет mojibake, сломанных кодировок и несогласованных формулировок.

### Terminology discipline

- Один concept = одна canonical Russian form, если нет явной продуктовой причины иначе.
- Forbidden variants задокументированы.
- Raw keys остаются внутренними и не выходят в UI.
- Если профессиональный термин нужен, это фиксируется явно, а не прячется.

### QA posture

- Есть surface inventory по public, admin, shared, system и dev-only.
- Есть grep/scan check по protected user surfaces.
- Есть screenshot pack по критическим routes.
- Есть regression checklist по publish, review, readiness, rollback, media upload, auth и no-access.
- Есть runtime content sweep track, если данные живут отдельно от кода.

## 4. Recommended execution waves

### Wave 1. Foundation plus quick wins

Goal:

- Сначала поднять минимальный glossary + mappings scaffold, затем сразу убрать самые заметные английские остатки.

Scope:

- Public leftovers в `app/services/page.js`, `app/cases/page.js`, `components/public/PublicRenderers.js`, `lib/content-core/pure.js`.
- Metadata и title surfaces в `app/layout.js`, `app/admin/layout.js`, `app/admin/bootstrap/superadmin/page.js`.
- High-frequency feedback и API-returned messages в `lib/admin/operation-feedback.js`, `app/api/admin/*`.
- Obvious shared widgets в `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`.

Rationale:

- Это самый быстрый way to restore trust на public web и убрать самый заметный noise.
- Эти изменения low-risk, если glossary scaffold уже существует.
- Это даёт visible progress без ожидания большой архитектурной чистки.

Dependencies:

- Approved seed glossary.
- Surface allowlist.
- Exclusion list for dev-only scripts and fixtures.

Allowed changes:

- Literal translation of obvious user-facing text.
- Metadata localization.
- Safe helper extraction for repeated labels.
- Encoding fixes.
- Fallback copy cleanup.

Disallowed changes:

- Workflow semantics changes.
- Route ownership changes.
- New UI patterns or redesign.
- Full platform/i18n abstraction.

Success criteria:

- No visible English on targeted public and obvious admin surfaces.
- No mojibake in user-facing messages.
- Shared widgets no longer expose developer-speak by default.
- Quick wins land without semantic regressions.

Proof package:

- Before/after screenshots for targeted routes.
- Grep or scan report for remaining English in protected surfaces.
- Changed file list.
- Glossary delta for any new term.

Risks:

- Перевести слово, но оставить плохую терминологию.
- Не заметить, что raw key всё ещё торчит в соседнем helper.

### Wave 2. Terminology consolidation

Goal:

- Сделать единый канон для статусов, ролей, entity labels, action verbs и workflow terms.

Scope:

- `lib/content-core/content-types.js`
- `lib/content-core/diff.js`
- `lib/content-ops/workflow.js`
- `lib/content-ops/readiness.js`
- `lib/admin/entity-ui.js`
- review, publish, history, timeline, table headers and status chips

Rationale:

- Wave 1 убирает наиболее заметный English, но без wave 2 система всё ещё будет говорить разными словами об одном и том же.
- Терминологический канон нужен до широкой зачистки copy architecture.

Dependencies:

- Glossary seed, already approved in Gate 1.
- Confirmation of sensitive workflow terms.

Allowed changes:

- Canonical Russian labels.
- Forbidden variants list.
- Short label variants for buttons, table cells and status chips.
- Mapping helpers for status, role, entity type, lifecycle state.

Disallowed changes:

- Changing what publish or review means operationally.
- Renaming internal domain objects just ради UI.

Success criteria:

- Один канон на один concept.
- Нет raw keys в table/history/diff UI.
- Review, readiness, publish и rollback читаются одинаково across surfaces.

Proof package:

- Glossary table with approved, short and forbidden variants.
- Mapping diff for all touched terms.
- Screenshot pack for review, publish and history surfaces.

Risks:

- Semantic drift if a term is made softer than the actual process.
- Over-normalization that hides important professional distinctions.

### Wave 3. Copy architecture cleanup

Goal:

- Убрать scattered strings и сделать thin, explicit copy layer for phase 1.

Scope:

- Public/admin/system separation.
- Validation messages.
- Error and toast helpers.
- Empty states.
- Destructive confirms.
- Table and action menu labels.

Rationale:

- После канонизации терминов можно централизовать copy without building a full i18n platform.
- Это закрывает класс багов, где строка исправлена в одном месте, но дубли живут elsewhere.

Dependencies:

- Stable terminology canon.
- Surface allowlist and dev-only exclusion policy.

Allowed changes:

- Introduce small namespace-based copy registry.
- Replace direct raw keys with mapping helpers.
- Centralize validation and feedback messages where it reduces duplication.
- Keep fallback behavior controlled and Russian.

Disallowed changes:

- Full locale framework.
- Multilingual dispatch.
- Storage model changes for copy unless absolutely needed for runtime content tracking.

Success criteria:

- User-facing text has a discoverable source.
- Raw keys are no longer rendered directly.
- Public/admin/system/dev-only paths are separated in code and in QA.

Proof package:

- Copy layer map.
- Helper coverage notes.
- Scan report proving no protected surface still renders raw keys.
- Snapshot set for the most reused shared widgets.

Risks:

- Over-centralization into a brittle framework.
- Accidentally coupling docs text to runtime text.

### Wave 4. Friendly-copy refinement

Goal:

- Сделать интерфейс не только русским, но и человеческим, calm, task-oriented and low-friction.

Scope:

- Readiness, review, publish, rollback, empty states, error states, destructive confirms, admin shell prompts, public CTA.

Rationale:

- Literal translation is not enough on Business Owner and non-technical surfaces.
- This is where the interface stops sounding like a backend and starts sounding like a tool for a real person.

Dependencies:

- Approved terminology canon.
- Sensitive copy gate.

Allowed changes:

- Rewrite harsh or bureaucratic phrasing.
- Add next-step guidance.
- Reduce syntactic load.
- Keep professional terms where they are operationally necessary, but explain them.

Disallowed changes:

- Softening warnings so far that critical operations look harmless.
- Inventing marketing language or claims.
- Changing process truth.

Success criteria:

- Text answers what happened, why it matters, and what the user should do next.
- Destructive actions are calm, explicit and reversible where appropriate.
- Business Owner-facing surfaces feel supported, not interrogated.

Proof package:

- Editorial before/after samples for key copy blocks.
- Scenario notes for empty/error/destructive states.
- Approval log for any wording that could affect process understanding.

Risks:

- Friendly-copy can become vague if over-softened.
- A better tone can accidentally blur a necessary warning.

### Wave 5. Verification and rollout

Goal:

- Доказать, что UI is RU-clean, human-friendly, and workflow-safe.

Scope:

- Text QA.
- Screenshot QA.
- Workflow regression checks.
- Glossary consistency checks.
- Runtime content sweep.

Rationale:

- Quick wins are not enough if the last mile still leaks English or changes workflow semantics.
- Runtime content can only be validated by checking runtime content.

Dependencies:

- All prior waves.
- Access to the routes or exports that represent live content, if that content is not code-owned.

Allowed changes:

- Final cleanup of leftovers found by QA.
- Content-track triage if live data is mixed.

Disallowed changes:

- New scope.
- Late terminology redesign.
- Structural product changes.

Success criteria:

- Protected routes pass text scan.
- Screenshot pack matches approved Russian copy.
- Workflow regressions stay green.
- Runtime content is either clean or explicitly triaged.

Proof package:

- QA matrix.
- Route-by-route screenshot pack.
- Final grep/scan output.
- Runtime content sweep note.
- Sign-off record.

Risks:

- False sense of completion after code-only cleanup.
- Hidden English in persisted content.

## 5. Owner-review map

| Decision class | Can be approved autonomously | Needs editorial approval | Needs owner approval | Needs final sign-off |
| --- | --- | --- | --- | --- |
| Obvious literal RU replacement within approved glossary | Yes | No | No | No |
| Metadata, labels, placeholders, helper text without semantic change | Yes | Sometimes, if tone is delicate | No | No |
| Shared widget copy cleanup with approved terminology | Yes | Sometimes | No | No |
| Friendly-copy rewrites on Business Owner-facing screens | No | Yes | Sometimes, if it affects process meaning | No |
| Public commercial claims, guarantees, pricing-like language, obligations | No | No | Yes | Yes |
| Review, readiness, publish, rollback semantics | No | No | Yes | Yes |
| Canonical glossary decisions for ambiguous business terms | No | No | Yes | Yes |
| Runtime content mixed-language findings | No | No | Yes, if source owns content | Yes |

Practical rule:

- If the change only improves wording inside an already-approved meaning, it can usually be done autonomously.
- If the change could alter what the user believes will happen, it must be reviewed.

## 6. Suggested implementation architecture

### Thin copy layer, not full i18n platform

Use a small, explicit copy layer with surface namespaces, for example:

- `public`
- `admin`
- `system`
- `workflow`
- `validation`
- `glossary`

This layer should do three things only:

1. Hold canonical Russian copy for repeated user-facing concepts.
2. Map raw status, role, entity and lifecycle keys to approved labels.
3. Provide controlled fallbacks that stay Russian on protected surfaces.

It should not try to become:

- a full multilingual framework;
- a content management system;
- a domain model replacement;
- a route ownership system.

### Mapping helpers

The highest-value helpers are:

- status label mapping;
- role label mapping;
- entity type label mapping;
- operation feedback mapping;
- readiness and publish wording mapping;
- confirmation dialog wording mapping;
- empty/error state wording mapping.

Rule: the domain can keep raw keys internally, but the UI must never render them directly.

### Surface separation

Separate text paths by surface class:

- Public UI.
- Admin UI.
- System messages.
- Dev-only tooling and fixtures.

This separation needs to exist both in code and in QA. If a string is from a script, seed, or probe, it must not be treated as user-facing copy.

### Staged migration path

Use a staged migration instead of a big refactor:

1. Introduce the copy and mapping shell.
2. Replace high-frequency shared strings first.
3. Replace public surface leftovers.
4. Replace workflow and admin semantics copy.
5. Clean friendly-copy on top.
6. Run verification and runtime sweep.

### Runtime content sweep

If live content is stored outside the code, handle it as a separate read-only sweep:

- export or inspect rendered live content;
- compare it against the canonical Russian glossary;
- flag English or mixed fragments as content tasks;
- do not mask data issues as code-only fixes.

### Docs boundary

Docs and product UX references are useful as canon references and term inventory, but they should not become the runtime source of UI text by default.

The runtime source of truth should be the copy layer and the data/runtime content path, not prose documentation.

### AI boundary

AI can propose copy candidates and highlight inconsistencies, but it is not the owner of terminology truth.

## 7. Verification strategy

### Text QA

- Run scans on protected user-facing routes.
- Check for English leftovers, raw keys, mixed RU/EN and mojibake.
- Keep dev-only and fixture paths out of the scan set.

### Screenshot and surface QA

- Verify public pages, admin shell, review, publish, history, readiness, login, logout, and bootstrap flows.
- Compare approved copy against actual rendered text.
- Check that no fallback or loading state reintroduces English.

### Terminology consistency checks

- Verify canonical term usage across tables, chips, history, diff, timeline, review and publish screens.
- Check that forbidden variants do not reappear in helper text, empty states or toasts.

### Regression checks

- Auth flow.
- Save draft.
- Submit for review.
- Owner action.
- Publish.
- Rollback.
- Media upload.
- Forbidden and no-access states.

### Sensitive wording review

- Public commercial claims.
- Business Owner-facing wording.
- Destructive confirms.
- Review, readiness, publish and rollback descriptions.

### Runtime sweep

- If user-visible content is coming from stored data, add a runtime sweep checkpoint.
- Treat mixed content there as a separate content remediation backlog.

## 8. Risks and anti-patterns

- Overengineering into a new localization platform before phase 1 needs it.
- Mass replace without a glossary.
- Semantic drift in workflow labels, especially around review and publish.
- Public, admin and dev-only surfaces getting mixed in one proof set.
- Blind spot for runtime content stored outside code.
- False sense of completion after quick public cleanup.
- Friendly-copy that becomes vague or weakens critical warnings.
- Treating docs as the live UI source instead of a boundary reference.

## 9. Ready-for-implementation handoff

### Concise downstream brief

Implement the plan in this order:

1. Seed the glossary and forbidden variants.
2. Add or formalize mapping helpers for the highest-frequency workflow and status labels.
3. Execute Wave 1 quick wins on public leftovers, metadata, operation feedback and obvious shared widgets.
4. Consolidate terminology for workflow, status, role and entity labels.
5. Clean the copy architecture and remove direct raw-key rendering.
6. Rewrite harsh or backend-sounding copy into friendly, task-oriented Russian.
7. Run verification, including runtime content sweep if data is involved.

### What the next agent prompt should focus on first

Start with a bounded surface pack, not the whole app:

- `lib/admin/operation-feedback.js`
- public metadata and fallback copy
- shared widgets that leak English by default
- then the workflow/readiness surfaces

The next agent should be told explicitly:

- use the approved glossary only;
- do not change workflow semantics without review;
- do not touch dev-only fixtures unless they leak into user-facing surfaces;
- produce proof artifacts with before/after evidence;
- surface any runtime content finding separately instead of hiding it in code cleanup.

