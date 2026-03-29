# ADMIN UI Post-Deploy Systemic Review for Экостройконтинент v0.1

## Executive Summary

Post-deploy live review confirms four real systemic UX defects in the admin console:

1. shared entity list CTA text is corrupted on live routes;
2. the desktop editor right rail overflows because the rail is narrower than the evidence table and readiness stats it contains;
3. the center `Рабочая карточка` block is oversized and low-utility relative to the operator tasks around it;
4. editor surfaces now have unresolved role duplication between the center column and the right rail.

The issues are real, visible on live runtime, and reproducible.  
At the same time, the problem is not “the whole admin is broken”. Media and review queue surfaces are materially cleaner and should be treated as contrast examples, not dragged into a broad redesign.

Final review status: `READY FOR PATCH EPIC`

## Review Scope

Reviewed live routes:

- `/admin`
- `/admin/entities/service`
- `/admin/entities/case`
- `/admin/entities/page`
- `/admin/entities/global_settings/entity_239e7235-c1de-42aa-85de-e974d848be05`
- `/admin/entities/service/new`
- `/admin/entities/case/new`
- `/admin/entities/page/new`
- `/admin/review`
- `/admin/entities/global_settings/entity_239e7235-c1de-42aa-85de-e974d848be05/history`
- `/admin/entities/media_asset`
- `/admin/entities/media_asset?compose=collections`

Viewport checks executed:

- `1440`
- `1280`
- `1024`
- `768`

Evidence pack:

- [metrics.json](assets/post-deploy-review/metrics.json)
- [page-list-1440.png](assets/post-deploy-review/page-list-1440.png)
- [service-list-1440.png](assets/post-deploy-review/service-list-1440.png)
- [global-settings-1440.png](assets/post-deploy-review/global-settings-1440.png)
- [global-settings-1280.png](assets/post-deploy-review/global-settings-1280.png)
- [global-settings-1024.png](assets/post-deploy-review/global-settings-1024.png)
- [global-settings-768.png](assets/post-deploy-review/global-settings-768.png)
- [service-new-1440.png](assets/post-deploy-review/service-new-1440.png)
- [case-new-1440.png](assets/post-deploy-review/case-new-1440.png)
- [page-new-1440.png](assets/post-deploy-review/page-new-1440.png)
- [review-queue-1440.png](assets/post-deploy-review/review-queue-1440.png)
- [media-list-1440.png](assets/post-deploy-review/media-list-1440.png)

Scope note:

- `publish` surface was not independently exercised in live runtime during this pass because there was no active publish candidate after cleanup of proof data.

## Systemic Findings

### 1. Corrupted primary CTA on shared entity list routes

- Severity: `serious`
- Surface: `service`, `case`, `page` list routes
- Symptom: the primary `new` CTA renders as `РќРѕРІС‹Р№` instead of normal Russian text
- Why this matters: this is a first-glance trust failure on core operator entry routes
- Local or systemic: `systemic`
- Proof:
  - live DOM extraction returned `newLinkText: "РќРѕРІС‹Р№"` on `/admin/entities/page` at `1440`, `1280`, `1024`, `768`
  - live DOM extraction returned `newLinkText: "РќРѕРІС‹Р№"` on `/admin/entities/service` at `1440`
  - screenshots: [page-list-1440.png](assets/post-deploy-review/page-list-1440.png), [service-list-1440.png](assets/post-deploy-review/service-list-1440.png)
- Likely impact zone:
  - `app/admin/(console)/entities/[entityType]/page.js:194`
- Interpretation:
  - this is not a broad UTF-8 collapse across the app
  - this is a shared list-route defect because the same route template serves multiple entity types

### 2. Desktop editor right rail is physically too narrow for its own content

- Severity: `serious`
- Surface: editor screens with split layout, confirmed on `global_settings`, `service`, `case`, `page`
- Symptom: the right rail clips chips, readiness summary pills, and especially the evidence table
- Why this matters: the operator loses readable diagnostics exactly where the system expects them to act
- Local or systemic: `systemic`
- Proof:
  - on `global_settings` at `1440`: sticky rail width `380`, evidence table width `398.56`, sticky scroll width `449`
  - on `global_settings` at `1280`: evidence table right edge `1291.56` with viewport width `1280`
  - on `service/new` at `1440`: sticky rail width `380`, evidence table width `411.84`, sticky scroll width `462`
  - screenshots: [global-settings-1440.png](assets/post-deploy-review/global-settings-1440.png), [global-settings-1280.png](assets/post-deploy-review/global-settings-1280.png), [service-new-1440.png](assets/post-deploy-review/service-new-1440.png), [case-new-1440.png](assets/post-deploy-review/case-new-1440.png), [page-new-1440.png](assets/post-deploy-review/page-new-1440.png)
- Likely impact zone:
  - `components/admin/admin-ui.module.css:1752`
  - `components/admin/admin-ui.module.css:1829`
  - `components/admin/admin-ui.module.css:1836`
  - `components/admin/admin-ui.module.css:330`
  - `components/admin/admin-ui.module.css:388`
  - `components/admin/EvidenceRegisterPanel.js`
  - `components/admin/ReadinessPanel.js`
- Interpretation:
  - this is not just “one panel too big”
  - the rail contract and the evidence/readiness rendering contract do not match
  - below `1040px` the layout stacks into one column and the overflow mostly disappears; this is specifically a desktop split-layout defect

### 3. `Рабочая карточка` is oversized and low-utility

- Severity: `serious`
- Surface: entity editors, confirmed on `global_settings`, `service/new`, `case/new`, `page/new`
- Symptom: the center block consumes a large amount of vertical space but mostly repeats high-level state, version, and narrative copy already available elsewhere
- Why this matters: the operator loses central workspace to summary prose instead of fields, actions, or direct progress cues
- Local or systemic: `systemic`
- Proof:
  - screenshots: [global-settings-1440.png](assets/post-deploy-review/global-settings-1440.png), [service-new-1440.png](assets/post-deploy-review/service-new-1440.png), [case-new-1440.png](assets/post-deploy-review/case-new-1440.png), [page-new-1440.png](assets/post-deploy-review/page-new-1440.png)
  - the same block appears on all editor screens in the same position and with the same packet structure
- Likely impact zone:
  - `components/admin/EntityEditorForm.js:126`
  - `components/admin/EntityEditorForm.js:131`
  - `components/admin/EntityEditorForm.js:151`
  - `components/admin/SurfacePacket.js`
  - `lib/admin/screen-copy.js:22`
- Interpretation:
  - this is not just a copy-length issue
  - the block currently behaves like a second summary layer, not like working context

### 4. Center and right rail roles are not clearly separated on editor screens

- Severity: `important`
- Surface: entity editors
- Symptom: the editor shows three summary layers at once:
  - top actionability block;
  - center `Рабочая карточка`;
  - right rail readiness and evidence
- Why this matters: the operator reads the same entity state multiple times through different presentations before reaching the actual edit form
- Local or systemic: `systemic`
- Proof:
  - `global_settings`, `service/new`, `case/new`, `page/new` all show the same stacked pattern
  - screenshots: [global-settings-1440.png](assets/post-deploy-review/global-settings-1440.png), [service-new-1440.png](assets/post-deploy-review/service-new-1440.png)
- Likely impact zone:
  - `components/admin/EntityEditorForm.js:139`
  - `components/admin/EntityEditorForm.js:143`
  - `components/admin/EntityEditorForm.js:151`
  - `components/admin/EntityEditorForm.js:517`
  - `components/admin/EntityActionabilityPanel.js`
  - `components/admin/ReadinessPanel.js`
  - `components/admin/EvidenceRegisterPanel.js`
- Interpretation:
  - this is the one finding that likely needs a small owner decision
  - the problem is not a bug in one component, but unclear responsibility split between center and rail

## Screen-by-Screen Notes

### `/admin/entities/service`, `/admin/entities/case`, `/admin/entities/page`

- Shared list route is the confirmed source of the corrupted primary CTA.
- Empty list state itself is readable and structurally fine.
- This is a targeted fix, not a list-surface redesign.

### `global_settings`, `service/new`, `case/new`, `page/new`

- These routes share the same desktop split problem.
- The right rail becomes content-heavier than its allocated width.
- The center column loses density because `Рабочая карточка` occupies too much space.
- The duplication pattern is strongest here, not on the dashboard or review queue.

### `/admin/review`

- Review queue surface is comparatively clean.
- No major overflow or duplication issue was observed here in the empty-state runtime.
- This route should be used as a contrast example when trimming editor summary layers.

### `/admin/entities/media_asset`

- Media workspace is materially healthier than the entity editor pattern.
- The right-side inspector has a distinct role and does not duplicate a central summary in the same way.
- Do not apply a broad “kill the right rail everywhere” reaction.

## Shared Component Findings

### Shared list CTA defect

- Rooted in the shared entity list route template, not in each entity type separately.
- Impact zone:
  - `app/admin/(console)/entities/[entityType]/page.js:194`

### Shared editor duplication

- Rooted in the fact that `EntityEditorForm` composes:
  - `EntityActionabilityPanel`
  - `SurfacePacket`
  - right rail `ReadinessPanel`
  - right rail `EvidenceRegisterPanel`
- Impact zone:
  - `components/admin/EntityEditorForm.js:139`
  - `components/admin/EntityEditorForm.js:151`
  - `components/admin/EntityEditorForm.js:517`

### Shared right-rail overflow

- Rooted in mismatch between:
  - `.split` rail width
  - `.stickyPanel` rail contract
  - `.table` evidence rendering
  - readiness summary stats width
- Impact zone:
  - `components/admin/admin-ui.module.css:330`
  - `components/admin/admin-ui.module.css:388`
  - `components/admin/admin-ui.module.css:1752`
  - `components/admin/admin-ui.module.css:1829`
  - `components/admin/admin-ui.module.css:1836`

## Severity Split

### Serious

- Corrupted shared list CTA on entity list routes.
- Desktop editor right rail overflow and clipping.
- Oversized low-utility `Рабочая карточка`.

### Important

- Unclear role split between center summary and right-rail summaries.

### Minor

- No additional systemic minor findings worth opening separately in this pass.
- Existing healthy surfaces suggest the next patch should stay narrow and component-focused.

## Fix Strategy

### Patch-only, no owner decision needed

1. Replace the corrupted hardcoded `new` CTA in the shared entity list route with normal Russian copy from the shared copy layer.
2. Rework right-rail content rendering for desktop editor screens:
   - remove table-based evidence rendering inside the narrow rail;
   - collapse wide status stats more aggressively;
   - keep rail width/content contract truthful.
3. Reduce or collapse the `Рабочая карточка` packet so it stops competing with the form and the top actionability block.

### Needs owner confirmation before implementation

1. Decide the final role split:
   - top block = immediate action
   - center = edit workspace
   - right rail = compact diagnostics and history
2. Decide whether `Рабочая карточка` should survive as:
   - a compact context block;
   - a collapsible helper block;
   - or be folded into the top block/history layer.

## Recommended Patch Wave

The next step should not be a new broad UX epic.

It should be a narrow shared-component patch wave with this order:

1. Fix the corrupted `Новый` CTA on shared entity list routes.
2. Fix desktop right-rail containment and move narrow-rail content away from table-heavy rendering.
3. Resolve the fate of `Рабочая карточка` as a compact, collapsible, or partially folded block.
4. Lock the role grammar:
   - top block = what is wrong and what to do now;
   - center = editing;
   - right rail = compact diagnostics, evidence, and helper navigation.

Boundary note:

- `review` and `media` surfaces should stay out of this patch wave unless a concrete regression is found there.
- They currently behave as healthier contrast examples, not as primary defect zones.

Quality gate for the patch wave:

1. Check `1440`, `1280`, `1024`, `768`.
2. Check Russian CTA and heading copy.
3. Check that the right rail stays inside the viewport.
4. Check that the same meaning is not repeated across top block, center summary, and right rail.

## Stop Triggers

- If fixing center/right duplication requires new readiness semantics, stop.
- If fixing evidence overflow requires changing evidence meaning instead of presentation, stop.
- If the patch starts touching media workspace behavior, stop and split the scope.
- If the team decides to redesign all admin surfaces uniformly, stop and reframe as a new UX epic instead of a cleanup patch.

## Final Verdict

The admin does not need another broad redesign pass.  
It needs a narrow shared-component bugfix wave focused on:

- shared list CTA copy;
- desktop editor right rail containment;
- trimming the low-utility center summary block;
- clarifying center vs right-rail responsibilities.
