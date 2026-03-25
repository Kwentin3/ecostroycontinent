# Acceptance Review Closing Batch, Экостройконтинент

## 1. Executive summary

Вердикт: `ACCEPT WITH CONDITIONS`.

Последний closing batch заметно продвинул first slice к финальной приемке. Он закрыл rollback UI surface, сделал blocked actions operator-safe, добавил Russian-first admin/auth/public shell baseline и усилил proof scripts.

При этом batch не перевел проект в состояние `READY FOR FULL ACCEPTANCE`.

Оставшиеся условия касаются трех зон:

- diff еще не полностью semantic для nested content;
- preview еще не fully faithful candidate-public-state для всех supported shapes;
- proof/reproducibility еще не productized как самодостаточный runnable package из clean checkout.

Итог по главному вопросу: нет, последний closing batch не довел проект до `READY FOR FULL ACCEPTANCE`. Он улучшил состояние, но оставил реальные acceptance conditions.

## 2. Scope of this acceptance review

Это verification / reconciliation pass, а не новый implementation run и не новый planning pass.

Использованные canonical sources:

1. `docs/out/PRD_Экостройконтинент_v0.3.1.md`
2. `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
3. `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
4. `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
5. `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
6. `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
7. `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
8. `docs/product-ux/Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md`
9. `docs/product-ux/Admin_Implementation_Backlog_First_Slice_Экостройконтинент_v0.2.md`
10. `docs/product-ux/Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md`
11. `docs/product-ux/Admin_UI_Implementation_Conventions_First_Slice_Экостройконтинент_v0.1.md`
12. `docs/reports/2026-03-25/Admin_First_Slice_Acceptance_Report_Экостройконтинент_v0.1.md`
13. `docs/reports/2026-03-25/Admin_Closing_Plan_With_Owner_Wishes_Экостройконтинент_v0.1.md`

Примечание: в prompt часть admin-документов названа как `v0.1`, но в репозитории canonical файлы лежат как `v0.2`. Для приемки использованы именно фактически присутствующие canonical files.

Reviewed closing batch commits:

- `789043d` `Close admin first slice gaps and owner wishes`
- `d31da98` `Harden admin review proof and preview basis`
- `da2b3e2` `Make review basis proof tolerant`
- `7b3c00a` `Remove stale database status from homepage`

## 3. Baseline: what had to be closed

Исходная точка перед closing batch была `ACCEPT WITH CONDITIONS`.

Band A acceptance-closing gaps, которые должны были закрыться:

- human-readable diff для owner review и revision history;
- faithful preview candidate public state;
- rollback UI surface для Superadmin;
- operator-safe blocked actions вместо raw `500`;
- proof / reproducibility hardening.

Band B owner wishes:

- Russian-first UI baseline;
- usable login / auth entry для `superadmin`, `seo_manager`, `business_owner`;
- temporary public homepage shell с Unsplash mosaic, site title, `В разработке` и icon login entry.

Canon / contract guardrails:

- Public Web остается read-side only;
- Admin Console остается write-side only;
- Content Core остается source of truth;
- Publish остается explicit operation;
- Published read-side читает только published truth;
- AI остается assistive only;
- MediaAsset / Gallery остаются first-class supporting entities.

## 4. What was actually delivered in the closing batch

Batch delivered несколько реальных closes:

- review detail page now shows human-readable diff, owner action controls, readiness panel, and explicit preview basis;
- history page now exposes a real rollback UI surface for superadmin;
- admin routes for submit, owner-action, publish, rollback, save and user actions now use friendly error redirects for expected blocked states;
- public homepage is now an explicit temporary shell with Unsplash mosaic, site title, `В разработке`, and login icon;
- auth/login/no-access/admin shell/dashboard were localized to a Russian-first first-slice baseline;
- proof scripts were hardened and now cover the main vertical admin flow plus the contacts publish hard-stop;
- `npm test` and `npm run build` both pass on the current HEAD.

## 5. Band A acceptance-closing review

### 5.1 Human-readable diff

Status: `partially implemented`.

Evidence:

- `lib/content-core/diff.js:47-102`
- `components/admin/RevisionDiffPanel.js:3-22`
- `app/admin/(console)/review/[revisionId]/page.js:74-104`
- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:33-51`

Assessment:

- diff is now human-readable at the top level and is visibly surfaced in both review and history;
- block arrays are summarized in a readable form;
- however, the implementation still collapses nested object values through `JSON.stringify`, and `rich_text` bodies are intentionally skipped in block summaries;
- that makes the diff useful for owner review, but not yet fully semantic for all content shapes.

Classification:

- `acceptable temporary solution` for first slice;
- `partially implemented` as a closure of the full Band A requirement.

### 5.2 Faithful preview

Status: `partially implemented`.

Evidence:

- `app/admin/(console)/review/[revisionId]/page.js:15-25`
- `app/admin/(console)/review/[revisionId]/page.js:30-60`
- `app/admin/(console)/review/[revisionId]/page.js:74-125`
- `lib/read-side/public-content.js:49-77`
- `lib/read-side/public-content.js:80-160`

Assessment:

- review preview now uses published lookups and published global settings;
- `SERVICE`, `CASE`, and `PAGE` previews render through public renderers, not through an ad hoc editor mock;
- linked services, cases, galleries, and media are hydrated from published projections where those projections exist;
- preview basis is explicit and visible to the reviewer;
- but unsupported entity types still fall back to raw JSON;
- more importantly, the preview is not yet a fully faithful candidate-public-state for every supported shape, because it is still scoped to the published lookup model rather than a fully generalized candidate hydration seam.

Classification:

- `acceptable temporary solution` only if the preview scope remains clearly limited;
- `partially implemented` as a full Band A closure.

### 5.3 Rollback UI surface

Status: `fully implemented`.

Evidence:

- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:52-61`
- `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js`
- `lib/content-ops/workflow.js:276-299`

Assessment:

- rollback is available as a real admin UI surface;
- it is visible to superadmin in the history page;
- it uses a confirm flow;
- it can only target a published revision of the same entity;
- this matches the PRD / operations expectation that rollback is a system surface, not a hidden API trick.

Classification:

- `fully implemented`.

### 5.4 Operator-safe blocked actions

Status: `fully implemented` for expected blocked paths.

Evidence:

- `lib/admin/operation-feedback.js:3-49`
- `app/api/admin/revisions/[revisionId]/submit/route.js`
- `app/api/admin/revisions/[revisionId]/owner-action/route.js`
- `app/api/admin/revisions/[revisionId]/publish/route.js`
- `app/api/admin/entities/[entityType]/[entityId]/rollback/route.js`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js:33-43`

Assessment:

- expected blocked states now map to readable operator messages;
- the API routes redirect back to a useful admin surface instead of surfacing raw `500` for ordinary block conditions;
- the publish readiness page also disables the publish button when blocking issues remain;
- unknown/unhandled exceptions may still fail normally, which is acceptable and not a regression.

Classification:

- `fully implemented`.

### 5.5 Proof / reproducibility hardening

Status: `partially implemented`.

Evidence:

- `scripts/proof-admin-first-slice.mjs:252-396`
- `scripts/proof-contacts-hard-stop.mjs:116-145`
- `package.json:8-13`

Assessment:

- proof coverage is materially better than before;
- the main proof script now checks login, media upload/publish, gallery/case/service vertical flow, review diff and preview basis, rollback, and audit timeline;
- the contacts proof checks blocked publish and readable error semantics;
- however, `npm run proof:admin:first-slice` failed here with `fetch failed` against `http://localhost:3000` because no canonical runtime was running in this workstation;
- `package.json` wires only `proof:admin:first-slice`, so the contacts proof is still not part of the runnable proof entrypoint;
- that means the batch improved proof quality, but not yet the fully reproducible, clean-checkout acceptance proof package.

Classification:

- `partially implemented`.

## 6. Band B owner-wishes review

### 6.1 Russian-first UI baseline

Status: `fully implemented` at first-slice level.

Evidence:

- `app/admin/login/page.js:11-30`
- `app/admin/no-access/page.js:5-13`
- `components/admin/AdminShell.js:6-38`
- `app/admin/(console)/page.js:29-80`
- `app/admin/(console)/review/[revisionId]/page.js:83-125`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js:24-46`
- `app/page.js:34-69`

Assessment:

- login, no-access, shell, dashboard, review, publish and homepage shell all carry Russian-first copy in a reasonable first-slice baseline;
- this does not become a full i18n project, which is good because the wish was for a baseline, not an enterprise localization program.

Classification:

- `fully implemented`.

### 6.2 Authorized entry for 3 roles

Status: `fully implemented` in code, with live runtime proof not reproduced in this workstation.

Evidence:

- `lib/auth/session.js:107-130`
- `app/admin/login/page.js:15-20`
- `app/admin/(console)/review/[revisionId]/page.js:105-118`
- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:52-61`

Assessment:

- role semantics are preserved: `superadmin` can publish and manage users, `seo_manager` can edit content and review, `business_owner` can owner-approve;
- the login page explicitly advertises the three roles;
- this is consistent with the first-slice role model and does not break access semantics.

Classification:

- `fully implemented` as a code-state outcome.

### 6.3 Public homepage temporary shell

Status: `acceptable temporary solution`.

Evidence:

- `app/page.js:32-69`
- especially `app/page.js:39-50`

Assessment:

- homepage contains a строительная Unsplash mosaic;
- it shows the site title;
- it shows `В разработке`;
- the top-right login icon links to `/admin/login`;
- the page explicitly says it is a temporary public shell and that the public витрина remains read-side only;
- this is a decorative layer, not a second content/media truth.

Classification:

- `acceptable temporary solution`;
- not a drift / not a second truth.

## 7. Canon conformance review

Assessment: canon conformance is strong and no major drift was found.

Evidence and conclusions:

- Public Web remained read-side only: public pages consume `lib/read-side/public-content.js`.
- Admin Console remained write-side only: editing, review, publish and rollback live in admin surfaces and admin APIs.
- Content Core remained the source of truth: SQL migration still owns entities, revisions, publish obligations and audit events.
- Publish remained explicit: `lib/content-ops/workflow.js:172-267` still gates publish through readiness, approval, preview renderability and slug collision checks.
- Published read-side still reads published truth only: `lib/read-side/public-content.js:21-160`.
- Service / Case route truth stayed intact: slug-based public routes still resolve from published projections.
- Page route truth stayed fixed: about / contacts remain fixed page types and contacts still has explicit truth gating.
- MediaAsset / Gallery remained first-class supporting entities, not raw URLs as truth.
- AI remained assistive only; there is no autonomous publish path or AI-owned route truth.

Classification:

- `fully implemented` on canonical boundaries.

## 8. PRD / contracts conformance review

Assessment: the batch is broadly contract-safe.

What stayed aligned:

- review / approval / publish / rollback remain distinct operations;
- readiness severity remains blocking / warning / info;
- event / audit behavior remains present for publish, slug-change obligation creation and rollback;
- preview / rollback additions did not introduce a second workflow;
- role semantics still match the contract split.

What remains only partially closed:

- diff semantics are still shallower than a fully semantic contract-level change view;
- preview fidelity is still more limited than a true candidate-public-state projection for every supported entity shape.

Classification:

- `fully implemented` for core contract semantics;
- `partially implemented` for the preview/diff depth requested by the closing plan.

## 9. UI conventions conformance review

Assessment: UI conventions are preserved.

What I checked:

- owner review does not masquerade as editor-mode;
- dashboard remains action-centered;
- readiness is visible inside editing / publish flow;
- timeline is human-readable;
- media and supporting entity surfaces stay preview-first / grid-first rather than collapsing into a chaotic drawer forest;
- modal / page / confirm usage remains coherent;
- no forbidden builder-first or DAM-first patterns appeared.

Evidence:

- `components/admin/AdminShell.js:6-38`
- `app/admin/(console)/page.js:29-80`
- `components/admin/ReadinessPanel.js`
- `components/admin/TimelineList.js`
- `components/admin/ConfirmActionForm.js`
- `app/admin/(console)/review/[revisionId]/page.js:83-125`
- `app/admin/(console)/revisions/[revisionId]/publish/page.js:24-46`

Classification:

- `fully implemented` from a UI-conventions standpoint.

## 10. Tests / verification / reproducibility review

What passed:

- `npm test` passed: 8 tests, 8 pass, 0 fail.
- `npm run build` passed.

What the unit tests cover:

- password hashing / verification round-trip;
- content-shaping invariants for fixed page route truth;
- service/case relation discipline;
- owner-review rules;
- change summary behavior;
- global settings normalization.

What the proof scripts cover:

- `scripts/proof-admin-first-slice.mjs` covers login, media upload/publish, gallery/case/service vertical flow, review diff, preview basis, rollback, and history audit visibility;
- `scripts/proof-contacts-hard-stop.mjs` covers blocked contacts publish and readable error handling.

What is still weak:

- proof is not yet fully reproducible from clean checkout in this workstation;
- `npm run proof:admin:first-slice` failed with `fetch failed` because there was no running app at `http://localhost:3000`;
- the contacts proof is not wired into `package.json`, so it is discoverable in source but not yet part of the standard proof entrypoint.

Classification:

- `partially implemented` for reproducibility hardening;
- `fully implemented` for basic build/test health.

## 11. Drift / scope creep / unresolved issues

No major drift or scope creep found.

What I explicitly did not see:

- no second content/media truth;
- no public AI publishing path;
- no page-builder creep;
- no DAM-first creep;
- no broad localization epic disguised as owner-wish work;
- no hidden second media path outside Content Core;
- no takeover of route truth by the homepage shell.

Remaining unresolved issues are narrow and real:

- diff fidelity for nested content still needs a stronger semantic layer;
- preview fidelity still needs a clearer candidate-public-state contract for all supported entity shapes;
- proof hardening still needs a durable runnable entrypoint and, ideally, CI-grade reproducibility.

Classification:

- no `drift / defect` severe enough to reject the batch;
- current gaps are `partially implemented`, not scope creep.

## 12. Planned vs delivered matrix

| Area | Planned expectation | Delivered state | Classification | Acceptance impact |
|---|---|---|---|---|
| Human-readable diff | owner review and revision history need readable diff | top-level diff cards now exist, with block summaries | `partially implemented` | condition remains |
| Faithful preview | candidate public state preview with hydration | review page renders public-ish previews from published lookups and shows preview basis | `partially implemented` | condition remains |
| Rollback UI surface | superadmin must be able to rollback in admin UI | history page exposes confirm rollback surface | `fully implemented` | closes gap |
| Operator-safe blocked actions | blocked submit/review/publish paths should not show raw `500` | expected block states now redirect with readable messages | `fully implemented` | closes gap |
| Proof / reproducibility hardening | reviewable, reproducible proof package from clean checkout | proof scripts improved, but live runtime still required and one proof is not package-wired | `partially implemented` | condition remains |
| Russian-first UI baseline | RU-first first slice on auth/admin/review/publish | login, shell, dashboard, review, publish, no-access are Russian-first | `fully implemented` | closes wish |
| Authorized entry for 3 roles | usable entry for `superadmin`, `seo_manager`, `business_owner` | role model and login surface support the three roles | `fully implemented` | closes wish |
| Public homepage shell | temporary decorative shell with Unsplash, title, `В разработке`, login icon | present and explicitly labeled temporary/read-side only | `acceptable temporary solution` | acceptable |
| Broad i18n program | not required for first slice | intentionally not expanded into a full i18n epic | `deferred by design` | no blocker |
| Canon / contracts | preserve read-side/write-side, explicit publish, published truth | preserved | `fully implemented` | no blocker |

## 13. Final verdict

`ACCEPT WITH CONDITIONS`

Why this is not `FULL ACCEPT`:

- preview fidelity is still partial;
- diff fidelity is readable but not yet fully semantic for all nested content;
- proof/reproducibility is improved but not yet self-contained and fully wired.

Why this is not `NOT ACCEPTED`:

- rollback UI is real;
- blocked actions are operator-safe;
- Russian-first owner-wish baseline is in place;
- canon and contracts were not broken;
- tests and build pass.

## 14. Required follow-up actions

1. Upgrade preview to a clearer candidate-public-state contract for all supported entity shapes.
2. Improve diff fidelity for nested block bodies and object-rich payloads.
3. Productize proof/reproducibility:
   - make the proof path runnable from a documented clean checkout;
   - wire the contacts hard-stop proof into the standard package entrypoint or CI-equivalent script;
   - keep the proof package reviewable and not dependent on hidden local steps.
4. Keep the public homepage shell temporary and decorative only.

After those conditions are met, this slice can be reconsidered for `READY FOR FULL ACCEPTANCE`.
