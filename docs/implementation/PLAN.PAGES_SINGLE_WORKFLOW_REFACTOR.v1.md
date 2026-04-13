# PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1

Статус: proposed implementation/refactor plan  
Дата: 2026-04-10  
Основание: canonical PRD, refined single-workflow docs, audit `ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1`

> Alignment note, 2026-04-13:
> Этот документ нужно читать как переходный refactor plan до принятия unified multi-type canon.
> Актуальное направление теперь фиксирует `Page` как owner multi-type page instances внутри одного editor surface.
> Любая standalone-only трактовка `Page` ниже считается исторической и ограниченной рамкой этого старого плана.

## 1. Goal and Constraints

Цель этого плана - безопасно перевести админку из legacy dual-screen narrative `Страницы + AI-верстка` в один пользовательский домен `Страницы`, не ломая канон `Page` as owner и не затрагивая explicit review/publish/history semantics.

План сознательно не предлагает big-bang rewrite. Он исходит из того, что в коде уже есть рабочий canonical truth flow, а проблема находится в navigation, workflow ownership, duplicate edit narrative, duplicate transformation layers и split preview contract.

### Hard constraints

- `Page` остаётся canonical owner page instances и page-level composition внутри одного editor surface.
- AI остаётся assistive only и не получает отдельный top-level owner flow.
- Publish / review / history остаются существующими explicit downstream operations.
- `Content Core` и revision model не заменяются новым truth store.
- В первой волне нельзя превращать page workspace в свободный page builder.
- В первой волне нельзя плодить новые сущности, если достаточно adapter-based refactor.

## 2. Canon and Contracts to Preserve

### Preserve as-is

- Canonical `Page` persistence contract in `lib/content-core/schemas.js` and `lib/content-core/pure.js`.
- Generic `saveDraft()` / revision lifecycle in `lib/content-core/service.js`.
- Explicit review submission and publish path in `lib/content-ops/workflow.js`.
- Public/read-side rendering contract via `components/public/PublicRenderers.js` and review preview in `app/admin/(console)/review/[revisionId]/page.js`.
- Accepted ownership canon to preserve semantically: `Page` owns multi-type page instances and publication flow inside unified page workspace; `service`, `equipment`, `case`, `media_asset`, and `gallery` remain first-class source domains and do not become a second editor.

### Preserve semantically, but reorganize in UX

- Page metadata fields: `slug`, `pageType`, `seo`, preview-related metadata.
- Page composition inputs: hero/content/CTA/relations/media.
- Existing readiness / publish gates.
- Existing page-derived composition work, but without a second peer surface.

## 3. Current-to-Target Seam Map

### 3.1 Current code seams that conflict with target model

| Seam | Current reality | Evidence | Target posture | Action |
| --- | --- | --- | --- | --- |
| Top-level peer nav | `AI-верстка` sits next to `Страницы` in primary nav | `components/admin/AdminShell.js:9-18`, `lib/admin/nav.js:3-10` | One domain: `Страницы` only | Cut first |
| Peer screen CTA | Page editor links out to separate workspace route | `app/admin/(console)/entities/[entityType]/[entityId]/page.js:82-85` | Open main page workspace inside Pages domain | Cut first |
| Dedicated chooser screen | `/admin/workspace/landing` is a separate landing chooser | `app/admin/(console)/workspace/landing/page.js:21-103` | Registry screen becomes the only first entry | Deprecate with compatibility bridge |
| Second save path | Workspace saves canonical `Page` draft directly | `app/api/admin/workspace/landing/[pageId]/route.js:221-257`, `:424-433` | Single page-owned save narrative | Cut first, then retire legacy path |
| Hidden carry-through | Workspace draft silently carries `slug`, `pageType`, `seo` | `lib/landing-workspace/landing.js:348-377`, `lib/admin/landing-workspace-ui.js:66-95` | Metadata edited explicitly in metadata layer only | Cut first |
| Duplicate projections | Page editor and workspace each project `Page` differently | `lib/admin/entity-ui.js:92-125`, `lib/landing-workspace/landing.js:338-467` | One canonical page edit session + narrow adapters | Cut incrementally |
| Preview split | Workspace uses local preview component; review uses canonical renderer | `components/admin/LandingWorkspaceStageAScreen.js:332-412`, `app/admin/(console)/review/[revisionId]/page.js:178-187` | One preview contract | Freeze temporarily, then unify |
| Left-rail warehouse | Workspace left rail is a long scrolling source stack | `components/admin/LandingWorkspaceStageAScreen.js:537-560` | Compact launcher rail + specialized pickers | Replace in workspace-shell phase |
| Engineering-heavy support rail | Current right rail mixes blockers, helper text, generate, review | `components/admin/LandingWorkspaceStageAScreen.js:909-977` | Pinned AI assistive panel + downstream actions without pseudo-editor semantics | Narrow and reorganize |

### 3.2 Seams to cut first

1. Primary navigation and route ownership narrative.
2. Dual save narrative into `Page` draft.
3. Hidden metadata carry-through inside workspace payload JSON.
4. Separate chooser-first entry into page composition.

### 3.3 Seams to freeze temporarily

1. Canonical `Page` payload schema and revision persistence.
2. Publish / review / rollback mechanics.
3. Existing readiness checks.
4. Existing underlying source entities: `Service`, `Case`, `MediaAsset`.
5. LLM / memory-card infrastructure internals, except where they leak into first-layer UX.

### 3.4 Seams to defer

1. Deep rename of legacy filenames like `landing-workspace` / `landing-factory`.
2. Any broad block-system redesign beyond what is needed for page-owned connective copy.
3. Any expansion into generic page-builder semantics.
4. Any cleanup inside low-level AI infra docs/modules that does not affect screen ownership or save path.

## 4. Proposed Refactor Phases

### Phase A. Navigation and IA Alignment

**Goal**  
Убрать peer-narrative двух экранов и зафиксировать `Страницы` как единый UI domain.

**Why this phase exists**  
Пока в shell и CTA живёт отдельная `AI-верстка`, любой следующий refactor будет визуально противоречить target model.

**User-visible changes**

- В primary nav остаётся один домен `Страницы`.
- Legacy `AI-верстка` исчезает из top-level navigation.
- Deep links в legacy route пока работают через redirect/compatibility wrapper.

**Internal seams cut**

- `components/admin/AdminShell.js`
- `lib/admin/nav.js`
- CTA out-link из page editor в отдельный peer surface
- Breadcrumb model for legacy workspace routes

**Contracts to preserve**

- Existing page URLs and deep links must not 404 during transition.
- Existing review permissions and route guards remain unchanged.

**Likely touched code zones**

- `components/admin/AdminShell.js`
- `lib/admin/nav.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`

**Risks**

- Users lose discoverability if legacy route is removed too early.
- Old bookmarks break.

**Acceptance criteria**

- There is no top-level primary nav item `AI-верстка`.
- From the shell, page composition is discoverable only through `Страницы`.
- Legacy workspace URLs still resolve safely.

**Rollback / fallback**

- Keep legacy routes alive as redirects or wrappers back into the new page workspace route until subsequent phases land.

### Phase B. Registry Screen Refactor

**Goal**  
Сделать экран `Страницы` единственным first-entry screen: cards by default, list as secondary mode, search, filters, minimal cards, three-dots menu.

**Why this phase exists**  
Это заменяет chooser narrative и закрепляет one-domain posture до глубокой перестройки workspace.

**User-visible changes**

- Default view becomes `Карточки`.
- Secondary toggle `Карточки / Список` appears.
- Search and filters become first-class controls.
- Each page card is minimal: title, preview, status, three dots.
- Card click opens page work.

**Internal seams cut**

- Separate chooser mental model in `/admin/workspace/landing`
- Old table-first pages registry assumptions

**Contracts to preserve**

- Existing page creation flow and entity loading.
- Existing page status/readiness signals.

**Likely touched code zones**

- `app/admin/(console)/entities/[entityType]/page.js`
- registry/list/card components under `components/admin/*`
- page card actions / metadata entry wiring
- legacy chooser route now redirects or reuses registry

**Risks**

- Overloading cards with metadata would recreate dashboard drift.
- Search/filter design could accidentally reintroduce engineering-heavy first layer.

**Acceptance criteria**

- `Страницы` works as the only first entry for page operations.
- Card click and three-dots action model are both implemented.
- Legacy chooser is no longer needed for ordinary work.

**Rollback / fallback**

- List mode stays available; card mode can be feature-flagged if needed, while still keeping `Страницы` as the only domain entry.

### Phase C. Main Page Workspace Shell

**Goal**  
Собрать единый главный рабочий экран страницы: center canvas, left launcher rail, right pinned AI panel.

**Why this phase exists**  
Это structural core of the target model. Without it, metadata modal and AI integration remain bolted onto the old split architecture.

**User-visible changes**

- Opening a page leads to one page workspace shell.
- The page screen reads as one workspace, not as source editor + external AI hop.

**Internal seams cut**

- Separate workspace shell in `app/admin/(console)/workspace/landing/[pageId]/page.js`
- Header CTAs `Открыть редактор страницы` / `К выбору лендинга`
- Split between page editor screen and page composition screen

**Contracts to preserve**

- The screen still edits canonical `Page` draft.
- No change to publish/review/history invariants.

**Likely touched code zones**

- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `components/admin/LandingWorkspaceStageAScreen.js`
- shared admin layout/components

**Risks**

- Accidentally moving too much metadata into the main shell.
- Accidentally rebuilding a freeform page builder.

**Acceptance criteria**

- There is one page workspace shell under the Pages domain.
- The user does not need to hop to a peer screen for composition work.
- Page composition and page metadata are clearly separated.

**Rollback / fallback**

- The old workspace component can be temporarily embedded behind the new route shell while legacy save/preview adapters are still active.

### Phase D. Metadata Management Layer

**Goal**  
Вынести route/type/SEO and other rare/service fields into tabbed movable metadata modal.

**Why this phase exists**  
Это cuts hidden carry-through risk and separates frequent composition work from rare management fields.

**User-visible changes**

- Metadata opens from card three-dots and from page workspace three-dots.
- Tabs separate frequent/rare concerns.
- Modal is movable, allowing context peeking.

**Internal seams cut**

- Hidden `slug` / `pageType` / `seo` inside workspace draft state.
- Full-form clutter in canonical page editor surface.

**Contracts to preserve**

- Metadata remains page-owned.
- Save still resolves into canonical `Page` payload.

**Likely touched code zones**

- `components/admin/EntityTruthSections.js`
- page form assembly components
- metadata modal state and adapters
- any workspace state that currently serializes metadata implicitly

**Risks**

- Moving too many frequent fields into metadata hides necessary work.
- Leaving metadata partially duplicated in the main canvas reintroduces stale overwrite.

**Acceptance criteria**

- `slug`, `pageType`, SEO and other rare/service fields are no longer silently serialized through the composition workspace.
- Metadata edits are explicit and page-owned.

**Rollback / fallback**

- Keep legacy metadata form sections available behind disclosure until the modal contract stabilizes, but do not allow both modal and hidden workspace payload to write the same fields.

### Phase E. Source Launchers and Specialized Pickers

**Goal**  
Заменить длинный левый склад карточек на launcher-based rail with specialized pickers for `Медиа`, `Кейсы`, `Услуги`.

**Why this phase exists**  
This removes warehouse UX and keeps the page screen light for SEO operators.

**User-visible changes**

- Left rail shows compact launchers only.
- Clicking a launcher opens a specialized selection modal/gallery.
- Selecting sources returns the operator to the canvas.

**Internal seams cut**

- Long list rendering in `LandingWorkspaceStageAScreen`
- Per-family source-card interactions living permanently on the rail

**Contracts to preserve**

- Canonical selected IDs still live on the page draft.
- Ordering remains meaningful and page-owned.

**Likely touched code zones**

- `components/admin/LandingWorkspaceStageAScreen.js`
- source picker components
- relation/media lookup loaders
- client state around selected source ids and ordering

**Risks**

- Picker contract becomes too generic and rebuilds a hidden mini-builder.
- Left rail shrinks visually, but modal payloads still duplicate truth.

**Acceptance criteria**

- The left rail no longer contains a scrolling warehouse of source cards.
- `Media`, `Cases`, `Services` can be selected via specialized pickers.
- Picker results map directly to page-owned ids/order.

**Rollback / fallback**

- Source launchers can initially open legacy lists inside modal wrappers before fully specialized picker UX lands.

### Phase F. Composition and Connective Copy

**Goal**  
Встроить page-owned connective copy into the main composition workflow without creating a detached bridge entity.

**Why this phase exists**  
The new model explicitly says `Page` owns transitions and connective text. This seam becomes expensive if left ambiguous.

**User-visible changes**

- Bridge text is edited inline in the page canvas/story rail.
- The user can adjust transitions between blocks without leaving the page workflow.

**Internal seams cut**

- Externalized bridge-text mental model
- Reliance on one big rich-text body for all inter-block narrative

**Contracts to preserve**

- Composition still resolves into canonical page-owned payload.
- No detached bridge-text entity is introduced by default.

**Likely touched code zones**

- page composition adapter(s)
- `lib/content-core/pure.js`
- `lib/landing-workspace/landing.js`
- workspace canvas components

**Risks**

- Overextending `blocks[]` into a mini page-builder schema.
- Breaking typed block contract just to add bridge UX.

**Acceptance criteria**

- Connective copy is explicitly page-owned and editable in context.
- The chosen representation remains bounded and contract-preserving.

**Rollback / fallback**

- First slice may use a narrow adapter onto existing block fields if a clean dedicated slot model is not yet agreed.

### Phase G. AI Panel Integration

**Goal**  
Встроить pinned AI panel as assistive tool inside page workspace and remove its pseudo-editor posture.

**Why this phase exists**  
The old workspace gives AI its own screen and save path semantics. The new model must not keep AI as a shadow owner.

**User-visible changes**

- AI lives in the right panel of the page workspace.
- First-slice actions are constrained to page assistance, not alternate page ownership.

**Allowed first-slice AI actions**

- Suggest rewrite for selected block.
- Suggest connective copy before/after selected block.
- Strengthen CTA phrasing.
- Offer compact SEO-friendly wording variants for page-owned copy.

**Internal seams cut**

- `generate_candidate` as an alternate surface-level editor flow
- AI saving full hidden workspace payload including metadata

**Contracts to preserve**

- Accepted AI output still goes through canonical page-owned save flow.
- AI does not publish autonomously.

**Likely touched code zones**

- `components/admin/LandingWorkspaceStageAScreen.js`
- `app/api/admin/workspace/landing/[pageId]/route.js`
- AI prompt/result adapters
- page workspace state application logic

**Risks**

- AI panel becomes a pseudo-editor again if it can rewrite full page truth blindly.
- If AI applies full-payload saves, ownership drift survives under a new UI.

**Acceptance criteria**

- AI suggestions apply through the same page-owned edit session, not through a competing save path.
- AI cannot silently modify `slug`, `pageType`, SEO or publish state.

**Rollback / fallback**

- Keep AI generation behind a feature flag or disclosure until patch-application semantics are stable.

### Phase H. Preview and Downstream Contract Unification

**Goal**  
Привести page workspace preview к тому же canonical projection, что review/public preview.

**Why this phase exists**  
If preview stays split, the operator still works against a divergent representation even after the UI is unified.

**User-visible changes**

- What the user previews in the page workspace matches review/public much more closely.

**Internal seams cut**

- `LandingWorkspacePreviewPage` as a separate preview implementation
- `buildLandingWorkspacePreviewPayload()` as a divergent preview-only branch if it differs semantically from canonical page preview

**Contracts to preserve**

- Review/public rendering remains canonical.
- Preview still works on draft state before publish.

**Likely touched code zones**

- `components/admin/LandingWorkspaceStageAScreen.js`
- `lib/landing-workspace/landing.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `components/public/PublicRenderers.js`

**Risks**

- Preview unification could accidentally couple draft view too tightly to published-only data assumptions.
- If delayed too long, preview mismatch survives behind a prettier shell.

**Acceptance criteria**

- Page workspace preview uses the same canonical renderer or the same canonical preview projection contract.
- There is no materially different preview-only representation for page composition.

**Rollback / fallback**

- Start with adapter-based reuse of canonical preview projection before deleting the old local preview component.

### Phase I. Legacy Decommission and Cleanup

**Goal**  
Удалить или задепрекейтить legacy dual-screen leftovers only after the new single-workflow path is stable.

**Why this phase exists**  
Removing too early increases rollout risk; removing too late leaves ownership drift latent.

**Decommission candidates**

- `/admin/workspace/landing` chooser surface
- peer-nav references to `AI-верстка`
- legacy page-editor CTA to peer workspace
- duplicate workspace-only save/apply pathways
- legacy preview component

**Can stay temporarily**

- Legacy filenames (`landing-workspace`, `landing-factory`) if their contents are already aligned.
- Compatibility wrappers/redirects.
- Adapter modules bridging old workspace draft into new page workspace shell.

**Must eventually be removed**

- Any surviving second save path writing canonical `Page` truth outside the unified page workflow.
- Any user-visible top-level `AI-верстка` entry.
- Any hidden metadata carry-through in composition saves.

**Acceptance criteria**

- No dual-screen narrative remains in runtime navigation or primary workflows.
- Legacy routes are either removed or reduced to safe redirects.
- Duplicate save/preview logic is decommissioned.

## 5. Contract Impact Matrix

| Contract | Impact | Notes |
| --- | --- | --- |
| Page payload contract | Stays unchanged initially | Prefer preserving `Page` truth shape; only allow narrow extension if connective-copy UX cannot fit existing bounded model. |
| Metadata handling contract | Needs adapter | Metadata moves into modal layer; explicit edit/apply path replaces hidden carry-through. |
| `saveDraft` / revision flow | Stays unchanged | The lifecycle survives; only competing callers and payload semantics are unified. |
| Preview contract | Needs adapter, then unification | Workspace preview should adopt canonical preview projection/renderer. |
| Source picker contract | Needs narrow extension | Introduce modal selection contract returning page-owned refs/order, not a new truth artifact. |
| AI action contract | Needs adapter | AI should return suggestions or bounded patches applied through page-owned session. |
| Composition / connective copy contract | Needs narrow extension or bounded adapter | Do not create detached entity by default; keep page-owned. |
| Nav / route contract | Needs deprecation plan | Legacy workspace routes survive temporarily as redirects/wrappers. |
| Publish / review / history invariants | Stays unchanged | Preserve explicit downstream semantics. |

## 6. Navigation / Route Refactor Strategy

### Target rule

The user-visible domain is `Страницы`. Any route used for page composition must be under that domain, even if implementation temporarily reuses legacy internals.

### Recommended route posture

- Preserve `registry`: `/admin/entities/page`
- Preserve `create`: `/admin/entities/page/new`
- Choose one canonical page-work route under Pages domain:
  - preferred options to decide separately: `/admin/entities/page/[pageId]` as the unified workspace, or `/admin/entities/page/[pageId]/workspace` as a nested technical route.
- Treat `/admin/workspace/landing` and `/admin/workspace/landing/[pageId]` as temporary compatibility routes only.

### Migration pattern

1. Remove top-level nav entry first.
2. Introduce canonical Pages-domain page-work route.
3. Redirect legacy workspace routes into the new route.
4. Remove user-facing chooser semantics.
5. Delete compatibility route only after new workflow is stable and links/bookmarks are migrated.

## 7. Page Workspace Refactor Strategy

### Core principle

Do not “merge” screens by stacking old page form and old workspace side by side. Build one page workspace shell and pull needed capabilities into it.

### Recommended internal strategy

1. Create a new page-work shell under the Pages domain.
2. Initially reuse legacy workspace composition internals only behind the new shell if needed.
3. Move page-owned frequent editing into the center canvas/story rail.
4. Move rare/service fields into metadata modal.
5. Converge save/apply semantics onto one page-owned session.

### What not to do

- Do not keep both old editor and old workspace as equal tabs.
- Do not expose both “save page” and “save workspace draft” as separate narratives long-term.
- Do not turn the center into a general block-builder free canvas.

## 8. Metadata Modal Strategy

### Target behavior

- Open from page card three-dots and page workspace three-dots.
- Tabbed.
- Movable.
- Explicit apply/save semantics.
- Page-owned.

### Field partition guidance

**Keep in metadata layer**

- `slug`
- `pageType`
- SEO fields
- preview-adjacent metadata
- rare/service fields tied to route/status discipline

**Keep in main page workflow**

- visible page composition
- hero/copy/CTA that operators change frequently
- source attachments and order
- connective copy

### Anti-stale-overwrite rule

Composition saves must not carry hidden metadata fields. Metadata saves must either:
- patch only metadata fields, or
- operate on a canonical merged page state with explicit freshness check.

## 9. Source Launcher / Picker Strategy

### First-slice launcher families

- `Медиа`
- `Кейсы`
- `Услуги`

### Picker contract

Each picker should return only what the page workspace needs:
- selected ids
- order if applicable
- primary item if applicable
- lightweight source context for operator clarity

It should not create a parallel draft object or persist a separate source-composition truth.

### Transitional implementation option

Wrap existing source lists into modal shells first, then evolve them into more specialized gallery/filter UX without changing the page-owned contract.

## 10. Connective Copy Strategy

### Ownership rule

Connective copy is page-owned composition text.

### Recommended first implementation posture

- Keep the representation narrow and bounded.
- Prefer inline editing around explicit composition seams.
- Reuse existing canonical page payload where possible.
- If new slots are required, introduce them as a narrow extension to page composition, not as a detached entity.

### Explicitly avoid in first iteration

- Generic “insert anything anywhere” semantics.
- Independent bridge-text library.
- New standalone content type for transitions.

## 11. AI Panel Strategy

### AI must behave like an embedded assistant

The right panel can help the operator, but it cannot own the page. Therefore:

- no top-level AI route as canonical user entry;
- no blind full-page overwrite flow;
- no metadata mutation by default;
- no publish authority;
- no prompt-lab-first UX.

### Recommended technical application posture

- AI outputs suggestion payloads or bounded patches.
- The page workspace applies accepted changes into the same canonical page edit session.
- Audit trail still marks AI involvement where appropriate.

### Guardrails

- AI actions are always scoped to selected page context.
- AI cannot mutate route/type/SEO without explicit metadata flow.
- AI cannot bypass review/publish.
- Dirty local edits must be reconciled before AI apply/generate actions.

## 12. Preview Unification Strategy

### Target

One preview contract for:
- page workspace preview,
- review preview,
- public render semantics.

### Recommended rollout

1. Introduce a canonical draft-to-preview projection that matches review/public semantics.
2. Swap page workspace preview to that canonical projection/renderer.
3. Remove `LandingWorkspacePreviewPage` only after parity is verified.

### Verification signals

- Same block order.
- Same media and relation rendering assumptions.
- Same copy placement and connective-copy behavior.
- Same readiness blockers affecting preview availability.

## 13. Legacy Compatibility / Decommission Strategy

### Temporary compatibility is acceptable for

- legacy workspace route aliases;
- legacy filenames;
- adapter modules translating workspace draft state into unified page-work state;
- source-picker wrappers around old list components.

### Temporary compatibility is not acceptable for

- two user-visible owner workflows for the same page;
- two save paths that both write canonical `Page` truth long-term;
- hidden metadata serialization through composition saves;
- separate preview semantics that survive past the unification phase.

### Decommission order

1. Hide/deprecate peer nav.
2. Redirect chooser.
3. Move canonical page-work route under Pages domain.
4. Converge save path.
5. Converge preview.
6. Remove legacy screen-specific components/routes.

## 14. Risks and Mitigations

| Risk | Severity | Trigger | Mitigation | Detection signal |
| --- | --- | --- | --- | --- |
| Ownership drift reintroduced | Critical | New page workspace still preserves separate AI save/apply path | Make page-owned save session the only canonical write path | Two different UI actions still call `saveDraft` with overlapping full `Page` payloads |
| Hidden stale overwrite | High | Composition saves still carry `slug` / `pageType` / `seo` invisibly | Separate metadata save/apply path; add freshness checks | Changing metadata in modal, then saving composition overwrites it |
| Dual save path survives | High | Legacy workspace POST and new page-work POST coexist as peers | Introduce adapter first, then remove old route semantics | Audit shows both routes writing canonical `Page` drafts |
| Preview mismatch survives | High | New shell still embeds local legacy preview | Reuse canonical preview projection/renderer | Operators see differences between page screen and review |
| AI panel becomes pseudo-editor | High | AI still generates full-page overwrite flows | Limit AI to suggestions/bounded patches and explicit apply | AI action mutates metadata or replaces entire draft silently |
| Metadata modal overhides or oversurfaces | Medium | Wrong partition of frequent vs rare fields | Validate with operator flows before freezing tabs | Frequent edits require repeated modal hopping or clutter returns to main shell |
| Left launcher panel degenerates back into warehouse | Medium | Launchers become embedded scroll lists again | Keep rail launcher-only; open full selection in modals | Left rail regains long card stacks |
| Connective copy breaks typed block contract | High | Team introduces generic bridge entity or freeform block graph | Keep bounded representation; require explicit decision before schema expansion | New detached bridge model appears in payload/contracts |
| Route/nav cleanup harms discoverability | Medium | Legacy entry removed before registry/workspace is clear | Sequence IA changes before route deletion; keep redirects | Users cannot find composition flow from `Страницы` |
| Scope drifts into page-builder product | High | Refactor starts adding arbitrary layout freedom | Freeze bounded page composition scope in acceptance criteria | PRs begin introducing generic canvas/layout abstractions |

## 15. Recommended Delivery Order

### Recommended epic structure

Use several epics, not one big epic.

1. **Epic 1: IA and route ownership alignment**  
   Nav cleanup, Pages-first entry, compatibility redirects.
2. **Epic 2: Pages registry refactor**  
   Cards/list toggle, search/filters, card actions.
3. **Epic 3: Unified page workspace shell**  
   One route, one page shell, temporary reuse of legacy internals allowed.
4. **Epic 4: Metadata modal and hidden-field elimination**  
   Cut stale-overwrite risk early.
5. **Epic 5: Source launchers and specialized pickers**  
   Replace left-rail warehouse.
6. **Epic 6: AI panel embed and save-path convergence**  
   AI becomes assistive panel only.
7. **Epic 7: Preview unification**  
   Align page-work preview with review/public contract.
8. **Epic 8: Legacy decommission**  
   Delete chooser, peer route semantics, duplicate preview/save logic.

### Recommended PR batch order

1. Nav + route alias PR.
2. Registry/cards PR.
3. Unified page-work shell PR behind feature flag if needed.
4. Metadata modal + explicit metadata save PR.
5. Source picker modal PR.
6. AI panel patch-apply PR.
7. Preview unification PR.
8. Legacy cleanup PR.

### What can run in parallel

- Registry UI work and metadata modal design can overlap after route ownership is fixed.
- Source picker UX can overlap with workspace-shell scaffolding once the selection contract is frozen.
- AI panel UI can overlap with preview work, but not with save-path semantics if both touch apply logic.

### What should not run in parallel

- Route ownership refactor and route deletion.
- AI apply semantics and metadata save semantics if both still mutate full-page payloads.
- Preview unification and payload-schema changes for connective copy.

### Recommended feature flags / compatibility bridges

- `pagesSingleWorkflowShell` feature flag for the new page workspace shell if rollout needs to be staged.
- Redirect bridge for legacy `/admin/workspace/landing*` routes.
- Adapter bridge from legacy landing-workspace draft into unified page-work state while duplicate projections are being retired.

## 16. What not to do in the first iteration

- Do not redesign `Page` persistence from scratch.
- Do not add a generic page-builder canvas.
- Do not make AI a second workflow owner.
- Do not broad-refactor LLM infra and memory-card internals without a direct screen-ownership reason.
- Do not remove legacy routes before the new Pages-domain route is live and discoverable.
- Do not introduce detached connective-copy entity without a separate decision.

## 17. Gating Decisions Before Code Starts

1. **Canonical page-work route shape**  
   Choose whether the unified page workspace lives directly at `/admin/entities/page/[pageId]` or at a nested technical route under it.
2. **Metadata field partition**  
   Freeze which fields are frequent enough to stay in the main workspace and which must move into metadata modal in first slice.
3. **Connective-copy representation**  
   Decide whether first slice can reuse existing bounded page fields or needs a narrow extension to page composition contract.
4. **AI apply semantics**  
   Decide whether first slice applies suggestion patches block-by-block or via a bounded candidate-accept model, but not via full hidden-page overwrite.
5. **Preview unification mechanism**  
   Decide whether the new page workspace reuses the exact review renderer directly or goes through a canonical preview adapter first.
