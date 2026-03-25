# Admin Implementation Plan First Slice

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: repo-bound implementation planning pass for admin console / content operations first slice

## 0. Execution Environment Note

- This repository may be opened from a Windows operator / IDE machine that is not the canonical runtime target.
- Canonical phase-1 runtime remains the Linux VM with one compose stack containing `app` and `sql`.
- Local workstation limitations must not be misread as permission to introduce a second SQL truth, a second runtime canon, or local-only infra assumptions into admin implementation.
- If DB-backed proof cannot run on the operator machine, prefer server-aligned verification or mark an infra-dependent proof gap explicitly.

## 1. Purpose of this implementation plan

Этот документ переводит уже принятый канон admin first slice в честный план реализации, привязанный к текущему состоянию репозитория.

Он отвечает на четыре практических вопроса:

- с какой фактической стартовой точки мы начинаем;
- какие bounded areas и implementation seams нужны в коде;
- в каком порядке безопасно внедрять admin first slice без canon drift;
- где автономная реализация может идти дальше сама, а где обязана остановиться и эскалировать.

Это не новый PRD, не переписывание контрактов и не попытка спроектировать “всю CMS”. План намеренно держит scope внутри content operations first slice.

## 2. Canon carried into implementation

В реализацию без переоткрытия переносятся следующие правила:

- `Public Web` остается published read-side surface.
- `Admin Console` остается write-side tool.
- `Content Core` в SQL остается source of truth для сущностей, связей, статусов и published revisions.
- `Publish` остается явной доменной операцией, а не status flip при сохранении.
- Published read-side потребляет только validated published revisions.
- `MediaAsset` и `Gallery` остаются first-class supporting entities.
- `Service` и `Case` владеют route truth.
- `Page` не дублирует и не перехватывает route truth `Service` или `Case`.
- AI остается assistive only: не source of truth, не route owner, не publisher.
- Admin first slice остается content operations console, а не visual builder.
- Modular monolith допустим; premature microservices не нужны.
- Contracts выше backlog convenience.

Implementation consequence:

- сначала надо зафиксировать content truth, revision discipline и publish/read-side seam;
- только после этого можно безопасно наращивать admin UI;
- если код подталкивает к shortcut, который ломает один из пунктов выше, работа должна остановиться.

## 3. Current repo state and starting point

### 3.1 Canon inputs actually present in the repo

Для planning pass использованы repo-resident источники:

- `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
- `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
- `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Admin_Implementation_Backlog_First_Slice_Экостройконтинент_v0.2.md`

Repo note:

- В запросе перечислены `v0.1` файлы для admin PRD/contracts/backlog, но в текущем репозитории этих `v0.1` файлов нет.
- В репозитории присутствуют `v0.2` версии; именно они приняты как фактический canonical input для этого implementation plan.

### 3.2 What already exists

| Area | Current repo fact | Planning implication |
| --- | --- | --- |
| Runtime shell | Есть один Next.js App Router runtime | Public и admin могут жить в одном modular monolith |
| Public entry | Есть только baseline home page в `app/page.js` | Public read-side еще не реализован как content consumer |
| Admin entry | Есть только placeholder route в `app/admin/page.js` | Natural URL seam есть, но admin domain как bounded area еще не существует |
| API surface | Есть только `app/api/health/route.js` | Ни admin transport, ни preview, ни publish hooks пока не существуют |
| Runtime config | Есть только `lib/runtime-config.js` | Shared infra seam минимален; доменные модули отсутствуют |
| Dependencies | В `package.json` только `next`, `react`, `react-dom` | Нет DB client, auth stack, storage SDK, validation/test tooling |
| Infra baseline | В `compose.yaml` есть `app + postgres` и `.env.example` с `DATABASE_URL` | SQL runtime seam уже намечен, но schema/migrations/data layer отсутствуют |

### 3.3 What is completely absent

- Нет SQL schema, migrations, ORM или query layer.
- Нет content entities, relation model, typed blocks model, revision model.
- Нет publish pointers, readiness engine, review workflow, owner approval semantics, rollback semantics.
- Нет audit/event trail model.
- Нет auth, users, sessions, role enforcement.
- Нет media metadata model и нет object-storage integration.
- Нет published read-side projection layer для будущих `/services`, `/cases`, `/about`, `/contacts`.
- Нет preview pipeline.
- Нет test harness, test scripts и verification scaffolding.

### 3.4 Real starting point

Реальная стартовая точка не “частично готовая админка”, а infrastructure-and-routing baseline:

- есть runtime, куда можно встроить admin console;
- есть SQL container seam, куда можно встроить content core;
- есть минимальное conceptual separation между public и admin routes;
- нет ни одного из доменных слоев, на которых держится first slice.

Это значит:

- начинать с UI поверх placeholder routes опасно;
- сначала надо ввести bounded write-side area и read-side adapter seam;
- backlog work packages нужно приземлять на почти пустой кодовый ландшафт, а не на существующую CMS-платформу.

### 3.5 Natural seams already visible

- Natural admin route seam: `app/admin/*`.
- Natural public route seam: будущие `app/services/*`, `app/cases/*`, `app/about`, `app/contacts`.
- Natural infrastructure seam: `compose.yaml` + `DATABASE_URL`.
- Natural shared code seam: текущий `lib/` каталог.

### 3.6 Architectural drift risks already visible

- Так как `app/` почти пуст, есть высокий риск начать складывать truth прямо в page components и server actions.
- Так как data layer отсутствует, есть риск связать будущий public web напрямую с draft/write-side model.
- Так как media layer отсутствует, есть риск быстро уйти в raw URL strings вместо `MediaAsset` / `Gallery`.
- Так как auth отсутствует, есть риск привязать permissions к UI checks вместо domain operations.
- Так как verification tooling отсутствует, есть риск “доказать” реализацию только ручным просмотром страниц.

## 4. Gaps between current repo and target admin first slice

| Target need | Current repo status | Gap type |
| --- | --- | --- |
| Content core in SQL | Absent | Foundational |
| First-slice entities | Absent | Foundational |
| Revisions and published pointers | Absent | Foundational |
| Typed blocks and stable refs | Absent | Foundational |
| Media metadata + gallery model | Absent | Foundational |
| Review / owner approval / publish / rollback | Absent | Foundational |
| Audit/event trail | Absent | Foundational |
| Role model and auth | Absent | Foundational |
| Admin shell and workflows | Placeholder only | Product surface gap |
| Public read-side projection | Absent | Architecture gap |
| Preview semantics | Absent | Architecture gap |
| Redirect / revalidation / sitemap obligations | Absent | Infra-domain seam gap |
| Verification harness | Absent | Delivery gap |

Planning consequence:

- first slice нельзя реализовывать как “добавим admin pages и пару forms”;
- first slice должен начаться с новых bounded layers, а уже потом раскрыться в UI;
- текущий backlog остается полезным, но ему нужен repo-aware order, потому что у репозитория почти нет application layers.

## 5. Target implementation shape by layers/modules

### 5.1 Recommended repo shape

Так как текущий runtime уже организован вокруг `app/` и `lib/`, минимально-разрушительная форма для first slice выглядит так:

| Layer / module | Recommended repo location | Owns | Must not own |
| --- | --- | --- | --- |
| Public routes | `app/services/*`, `app/cases/*`, `app/about`, `app/contacts`, `app/page.js` | Rendering published read-side only | Draft truth, publish logic, raw SQL mutation |
| Admin routes | `app/admin/*` | UI surfaces for write-side workflows | Content truth, publish decisions, hardcoded permissions |
| Admin/API transport | `app/api/admin/*` or thin server actions near admin routes | Transport only | Domain rules |
| Content core | `lib/content-core/*` | Entities, refs, typed blocks, revisions, published pointers | UI concerns, auth/session concerns |
| Content operations | `lib/content-ops/*` | Readiness, review, owner approval, publish, rollback, obligation creation, audit event emission | Rendering concerns |
| Published read-side | `lib/read-side/*` | Queries/projections for public pages and preview basis | Draft editing, approval logic |
| DB adapters | `lib/db/*` | Connection, repositories, transactions | Business rules |
| Auth / roles | `lib/auth/*` | Sessions, fixed roles, action guards | Publish semantics, content validation |
| Media adapters | `lib/media/*` | Metadata access + object-storage integration seam | Page truth, gallery truth |
| Audit persistence | `lib/audit/*` or inside `lib/content-ops/audit/*` | Event storage/read models | Ad hoc UI logging |

### 5.2 Mandatory implementation boundaries

- `app/admin/*` работает только через domain/application modules; не хранит truth в component state как canonical model.
- `app/*public*` работает только через `lib/read-side/*`; не читает draft/review data напрямую.
- `lib/content-core/*` хранит content truth и structural invariants.
- `lib/content-ops/*` исполняет operations contract; audit trail рождается downstream from operations, не из отдельных UI log calls.
- `lib/media/*` не создает вторую media model; `MediaAsset` metadata truth остается в content core, storage остается adapter layer.
- `Page` не получает отдельных route rules для service/case routes; route ownership проверяется до publish.

### 5.3 Natural admin domain decision

В текущем репо есть natural URL/place seam для admin console, но нет natural code-level bounded area для admin domain.

Рекомендация:

- admin domain вводить как новый bounded area внутри текущего Next.js приложения;
- не раздувать `app/admin` в место, где одновременно живут UI, business rules, persistence и publish logic;
- считать `app/admin` только surface layer, а не новый source of truth.

### 5.4 Transitional adapter decision

Transitional adapter layer нужен.

Причина:

- public read-side еще не реализован, значит дешевле сразу ввести `lib/read-side/*`, чем потом вырезать прямой доступ public routes к write-side storage;
- preview и public read-side должны делить published projection basis, но не write-side rules;
- этот adapter layer не нужен как “временный костыль”, он нужен как постоянная boundary against drift.

## 6. Workstream decomposition

### WS-0. Boundary scaffolding and verification baseline

- Goal: ввести repo-safe layer boundaries до начала feature implementation.
- Touched layers: `package.json`, `app/`, `lib/`.
- Dependencies: none.
- Preconditions: текущий Next.js runtime должен собираться как baseline.
- Expected artifacts: agreed folder structure, minimal verification command set, empty-but-real bounded module seams.
- Acceptance criteria: admin/public routes по-прежнему собираются; domain code больше не планируется складывать в page components; verification path перестает быть “manual only”.
- Proof package: updated repo tree, baseline build, first boundary smoke check.
- Stop triggers: попытка обойтись без отдельного content core; попытка встроить publish/readiness прямо в UI routes.

### WS-1. Content core and revision backbone

- Goal: реализовать минимальный write-side content core для `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page`.
- Touched layers: `lib/content-core/*`, `lib/db/*`.
- Dependencies: WS-0.
- Preconditions: выбран SQL-backed storage path внутри текущего `postgres` seam.
- Expected artifacts: entity model, stable refs, revision model, published revision pointer model.
- Acceptance criteria: каждая first-slice entity создается и versioned; live content не редактируется напрямую; published pointer существует отдельно от draft revision.
- Proof package: domain tests for create/update/version/published-pointer flows, repo-layer diagram, sample seeded entities.
- Stop triggers: появление live-edit shortcut; смешивание revision data с public projection; попытка хранить truth вне SQL content core.

### WS-2. Typed blocks, relations, media metadata, and route integrity

- Goal: реализовать structural content contract и relation discipline.
- Touched layers: `lib/content-core/*`, `lib/media/*`.
- Dependencies: WS-1.
- Preconditions: stable IDs and revision backbone уже существуют.
- Expected artifacts: finite typed-block schemas, relation validation, `Gallery -> MediaAsset` linkage, route ownership guardrails.
- Acceptance criteria: `Page` принимает только bounded phase-1 blocks; `gallery` block работает только через `Gallery` refs; broken refs и route ownership collisions блокируются.
- Proof package: tests for block validation, relation resolution, route ownership rejection, gallery/media reuse.
- Stop triggers: raw media URLs становятся canonical refs; `Page` начинает хранить service/case route truth; появляется второй media model.

### WS-3. Operations engine: readiness, review, owner approval, publish, rollback, audit

- Goal: реализовать operations contract как отдельный слой поверх content core.
- Touched layers: `lib/content-ops/*`, `lib/audit/*` or adjacent module, `lib/content-core/*`.
- Dependencies: WS-1, WS-2.
- Preconditions: reviewable revision и candidate projection могут быть адресованы по revision ID.
- Expected artifacts: readiness evaluator, review submission flow, owner approval markers, publish service, rollback service, obligation registry, canonical event emission.
- Acceptance criteria: publish и approval разделены; `SEO Manager` не публикует; `Business Owner` не редактирует raw entity truth; rollback восстанавливает предыдущую published revision; slug-change создает traceable obligations.
- Proof package: workflow tests, readiness result snapshots, audit event records, publish/rollback traces.
- Stop triggers: approval и publish сливаются; preview_unavailable разрешает owner approval или publish; audit начинает писаться ad hoc из UI.

### WS-4. Published read-side and preview seam

- Goal: ввести один честный read-side path для public routes и candidate preview.
- Touched layers: `lib/read-side/*`, public `app/*`, preview transport.
- Dependencies: WS-1, WS-3.
- Preconditions: published revisions и operations engine уже существуют.
- Expected artifacts: published projection queries, preview basis resolver, public loaders consuming only published truth.
- Acceptance criteria: public routes не читают drafts; preview явно помечает basis; transient preview failure не ломает editorial review semantics.
- Proof package: read-side integration tests, preview basis tests, public projection smoke checks.
- Stop triggers: public route начинает читать write-side tables без published filter; preview строится отдельной “approximation” логикой, а не candidate state.

### WS-5. Access control and admin shell baseline

- Goal: добавить минимальный auth/role layer и admin navigation shell, не позволяя им стать владельцем domain logic.
- Touched layers: `lib/auth/*`, `app/admin/*`, thin transport layer.
- Dependencies: WS-3.
- Preconditions: fixed role model принят как `Superadmin`, `SEO Manager`, `Business Owner`.
- Expected artifacts: login/session path, role guards, admin shell, minimal user management seam.
- Acceptance criteria: role checks совпадают с operations contract; `SEO Manager` не может публиковать; `Business Owner` не может bypass editor flow; `Superadmin` может управлять publish и users.
- Proof package: permission tests, route guard tests, screen access matrix.
- Stop triggers: permissions реализуются только на уровне hidden buttons; auth choice заставляет ломать fixed-role model.

### WS-6. First validating vertical slice: media/gallery -> case -> service -> review -> publish -> public projection

- Goal: получить первую сквозную проверку домена на launch-relevant entity set.
- Touched layers: все слои first slice.
- Dependencies: WS-1 through WS-5.
- Preconditions: есть verification dataset с подтвержденной test-safe global/contact basis для проверки workflow mechanics.
- Expected artifacts: one `MediaAsset`, one `Gallery`, one `Case`, one `Service`, review submission, owner approval, publish, public read-side rendering, rollback trace.
- Acceptance criteria: service/case route truth живет в entity layer; service не публикуется без proof path; published public page потребляет только published revisions; rollback возвращает предыдущее published state.
- Proof package: end-to-end script or test, screenshots of review/publish flow, public route output, audit timeline for the slice.
- Stop triggers: vertical slice требует временного hardcode в public templates; service page начинает жить как page shell owner; publish нужен раньше readiness/approval gates.

### WS-7. Global Settings and Page surfaces

- Goal: расширить first slice до standalone pages и global truth handling после первой сквозной доменной проверки.
- Touched layers: `lib/content-core/*`, `lib/content-ops/*`, `lib/read-side/*`, `app/admin/*`, public pages.
- Dependencies: WS-6.
- Preconditions: verifying slice доказал revision/publish/read-side discipline.
- Expected artifacts: `Global Settings` management, `Page(type=about)` flow, `Page(type=contacts)` flow with special blocking rules.
- Acceptance criteria: `about` идет через owner review path; `contacts` не publishable без confirmed contact truth; page composition не перехватывает service/case route ownership.
- Proof package: page-specific tests, contacts hard-stop proof, owner review proof for `about`.
- Stop triggers: отсутствие owner confirmation по contact truth маскируется фейковым launch-ready data; `Page` начинает дублировать service/case content.

### WS-8. Hardening for autonomous continuation

- Goal: подготовить slice к безопасному масштабированию без drift в FAQ/Review/Article и без расползания по repo.
- Touched layers: cross-cutting.
- Dependencies: WS-7.
- Preconditions: first-slice domain rules уже доказаны.
- Expected artifacts: explicit extension seams, verification checklist, documented stop map for later workstreams.
- Acceptance criteria: поздние сущности добавляются как продолжение тех же contracts; backlog expansion не переопределяет current rules.
- Proof package: extension checklist, conformance matrix, proof bundle index.
- Stop triggers: попытка “обобщить” first slice в builder-first CMS; перенос future-slice scope в текущий delivery plan.

## 7. Recommended execution order

Рекомендуемый порядок:

1. `WS-0` because repo currently lacks bounded areas and verification seams.
2. `WS-1` because no other first-slice behavior makes sense without content core and revision backbone.
3. `WS-2` because route ownership, typed blocks and media relations must be fixed before UI makes them de facto truth.
4. `WS-3` because readiness/review/publish/audit are the domain spine of admin first slice.
5. `WS-4` because public read-side must be protected before public pages start consuming content.
6. `WS-5` because auth and role checks should wrap already-defined operations, not define them.
7. `WS-6` because the first real proof of correctness should be a narrow end-to-end domain slice, not a broad admin shell.
8. `WS-7` because `Global Settings` and `Page(type=contacts)` pull in owner-dependent truth and should land after the core publish/read-side path is proven.
9. `WS-8` because only after that is the slice safe to hand over for broader autonomous continuation.

Why this order is safer than “build admin UI first”:

- оно раньше дает проверяемый domain outcome;
- оно уменьшает риск, что UI станет владельцем truth;
- оно заставляет public read-side появиться как consumer published revisions, а не как second CMS;
- оно отделяет non-blocking owner unknowns от действительно фундаментальной реализации.

## 8. First validating vertical slice

### 8.1 Recommended slice

Рекомендуемый первый validating slice:

`MediaAsset upload metadata -> Gallery assembly -> Case draft -> Service draft linked to Case/Gallery -> readiness -> submit for review -> owner approval -> publish -> public /cases/[slug] and /services/[slug] projection -> rollback`

### 8.2 Why this slice first

- Он проверяет route truth у `Case` и `Service`.
- Он проверяет `MediaAsset` / `Gallery` как first-class supporting entities.
- Он проверяет proof-led publish gate для service page.
- Он проверяет разделение review, approval и publish.
- Он проверяет published read-side projection.
- Он проверяет rollback without live patching.
- Он не зависит от полного Page surface и не заставляет рано строить `/contacts`, который уже известен как owner-dependent stop point.

### 8.3 Preconditions for the slice

- Есть minimal published `Global Settings` basis для verification dataset.
- Есть test-safe CTA/contact basis, подтвержденный как пригодный для механической проверки workflow.
- Есть хотя бы один media asset и один gallery candidate.

### 8.4 What this slice should prove

- write-side truth живет в content core, а не в UI;
- public routes читают только published revisions;
- service page cannot go live as thin promise page without proof path;
- owner-required approval не bypass-ится;
- publish side effects и audit trail являются отдельными доменными следствиями операции publish.

### 8.5 What this slice should not try to prove yet

- полный admin UI for every entity;
- launch-readiness of real `/contacts`;
- full article/FAQ/review coverage;
- enterprise-grade media workflow;
- final infra implementation for every publish side effect.

## 9. Verification and proof strategy

Проверка должна идти по workstream cadence, а не только “в конце”.

### 9.1 Contract conformance checks

- Entity and block validation matches `Admin_Content_Contract_First_Slice`.
- Workflow and permission checks match `Admin_Operations_Contract_First_Slice`.
- Backlog task execution never overrides contract invariants.

### 9.2 Workflow conformance checks

- `Draft -> Review -> Published` works without live editing.
- Reviewable revision is frozen for decision-making.
- Resubmission is required for meaning-changing edits after review submission.
- Owner approval and publish remain separate operations.

### 9.3 Role and permission checks

- `SEO Manager` can create, edit, link, submit.
- `Business Owner` can approve/reject/send back from review surface only.
- `Superadmin` alone can publish and rollback.

### 9.4 Publish/read-side correctness checks

- Public route consumes only active published revision.
- Draft and review revisions are invisible to public routes.
- Preview basis is explicit and matches candidate state.
- Slug-changing publish creates obligations and records them.

### 9.5 Rollback sanity checks

- Rollback targets a previous published revision.
- Rollback does not erase newer drafts.
- Rollback generates its own audit event and, where relevant, route obligations.

### 9.6 Audit trail sanity checks

- Core events match canonical taxonomy.
- Event payload captures actor, entity, revision, action, intent, approval state, readiness summary, preview status, AI markers, side effects.
- Timeline reads as operational narrative, not as developer noise.

### 9.7 Route ownership checks

- `Service` alone owns `/services/[slug]`.
- `Case` alone owns `/cases/[slug]`.
- `Page` can project but not override route truth.
- Public templates do not reintroduce route truth through local constants.

### 9.8 Contacts hard-stop checks

- `Page(type=contacts)` can exist as draft before owner confirmation.
- Publish stays blocked until public contact truth is confirmed.
- After contact truth confirmation, minor editorial updates may flow normally; truth changes still require owner review.

### 9.9 Proof artifact types expected during implementation

- domain-level automated tests;
- integration tests for publish/read-side/rollback;
- permission checks;
- sample seeded data and published-pointer evidence;
- preview/read-side screenshots for validating slice;
- audit timeline evidence for key workflows.

## 10. Stop-and-escalate map

### 10.1 Owner-dependent points

| Item | Can implementation proceed without it? | Stop rule |
| --- | --- | --- |
| Final public contact truth | Partially | Stop before treating `/contacts` as publishable launch surface |
| Final primary launch region wording | Mostly yes | Stop before locking launch-facing global truth defaults |
| Final launch service core | Mostly yes | Stop before hard-wiring launch-only inclusion rules |
| Final priority / flagship cases | Mostly yes | Stop before coding owner-review automation tied to exact case classification |
| Claim boundaries for pricing / timelines / guarantees | Partially | Stop before allowing publish of claims-heavy real content |
| Final owner review map | Mostly yes | Stop before broadening or narrowing auto-required owner review rules beyond current canon |

### 10.2 Infra-dependent points

| Item | Can implementation proceed without it? | Stop rule |
| --- | --- | --- |
| Exact auth/session mechanism | Partially | Stop before finalizing production login path if repo context does not constrain the choice |
| S3-compatible storage + CDN details | Partially | Stop before production-like media delivery; do not introduce filesystem media truth as fallback canon |
| Redirect persistence mechanism | Partially | Stop before marking slug-change publish fully production-ready |
| Cache revalidation hook | Partially | Stop before claiming publish side effects are complete |
| Sitemap refresh hook | Partially | Stop before claiming route-affecting publish is complete |
| Candidate preview rendering path | Partially | Stop before owner approval/publish if preview basis cannot be rendered honestly |

### 10.3 Canon-break stop points

- Any attempt to let public web read draft or review revisions.
- Any attempt to let save action implicitly publish.
- Any attempt to make `Page` a second route owner for `Service` or `Case`.
- Any attempt to represent media truth by pasted CDN URLs.
- Any attempt to log audit trail only from UI events instead of operations.
- Any attempt to treat backlog convenience as higher authority than contracts.

### 10.4 Repo-state stop points

- Required admin docs are currently present in working tree, but some are not committed; autonomous work should not silently assume repo cleanliness.
- If the implementation branch does not carry the current `v0.2` admin docs, canonical input must be re-synced before coding continues.

## 11. Risks and anti-drift notes

### 11.1 Highest near-term risks

- UI-first implementation drift because the repo currently exposes `app/admin` before any domain layer exists.
- Public drift because the repo currently has no read-side adapter and future pages could reach directly into write-side storage.
- Media drift because storage integration is absent and raw URL shortcuts will look tempting.
- Workflow drift because review/approval/publish can be collapsed accidentally if implemented from screens backward.
- Proof drift because there is no existing verification harness.

### 11.2 Anti-drift responses

- Introduce content core before admin forms.
- Introduce published read-side before public content routes.
- Make readiness/review/publish/audit services callable without UI.
- Treat `MediaAsset` metadata and object storage integration as one model with two layers, not two models.
- Make audit events an output of domain operations, never a substitute for them.
- Keep `Page` composition intentionally narrow and structurally typed.

### 11.3 Public layer leak check

Current verdict:

- existing public layer does not yet leak write-side concerns because it is only a placeholder shell;
- however, because no read-side layer exists yet, the future risk is high and must be addressed before real public routes land.

### 11.4 Minimal technical seams required

Для safe implementation first slice минимально нужны:

- revision store seam;
- published pointer seam;
- typed-block and relation validation seam;
- readiness evaluation seam;
- review snapshot seam;
- publish/rollback service seam;
- obligation registry seam for slug-changing publish;
- published read-side projection seam;
- audit event persistence seam.

### 11.5 Can implementation start from one vertical slice?

Да.

Но только если этот slice:

- проходит через content core, operations and read-side boundaries;
- не начинает с broad admin shell;
- не пытается раньше времени закрыть owner-dependent `/contacts` launch truth.

## 12. Final recommendation: ready / not ready for autonomous implementation

### Verdict

Ready for autonomous implementation of a bounded first slice, with explicit stop points.

### What this verdict means

- Репозиторий не готов к prompt-у вида “сделай админку целиком”.
- Репозиторий готов к автономной реализации, если работа идет в recommended order из этого документа.
- Автономная реализация должна стартовать с content core, operations engine and read-side seam, а не с screen-heavy admin UI.
- `/contacts`, final claim boundaries и production-complete publish side effects должны оставаться stop-and-escalate points, а не замазываться временными shortcut-ами.

### Recommended handoff framing for the next execution prompt

Следующий execution prompt должен:

- ссылаться на этот implementation plan как на operating order;
- выбирать конкретный workstream или contiguous pair of workstreams;
- требовать proof artifacts по ходу, а не только в финале;
- явно запрещать canon-breaking shortcuts.
