# STAGE 6 EXECUTION REPORT

## Executive Summary
Stage 6 closed the last operator-facing gap of the cockpit epic: list-level visibility. The admin list surfaces for first-slice entities now show explicit row-level signals before the operator opens a card, so it is possible to prioritize blocked, missing, and healthy work directly from the list.

The stage stayed inside the playbook boundary:
- no new canon
- no schema or workflow changes
- no new readiness semantics
- no new evidence taxonomy
- no new product surface

The implementation is intentionally narrow: row-level signals are derived from the frozen Stage 1 projection layer, then rendered on the existing entity list route. Final hardening was verified against Stages 1-5.

## Scope
In scope for Stage 6:
- row-level visibility on first-slice list pages
- compact signal rendering: ready, blocked, proof gap, partial, missing/neutral fallback
- explicit prioritization support by sorting blockers first
- final regression checks across the cockpit, editor actionability, evidence, relations, and review/publish flows

Out of scope:
- cockpit redesign
- editor redesign
- relation redesign
- evidence redesign
- schema changes
- new workflow or readiness semantics
- broad dashboard expansion

## What Changed
### 1) `lib/admin/list-visibility.js`
New pure helper for list-level projections.
- builds row DTOs from Stage 1 readiness/evidence helpers
- keeps missing-version rows honest
- produces compact list surface summaries
- sorts rows by operator priority: blocked, proof gap, partial, missing, ready

### 2) `app/admin/(console)/entities/[entityType]/page.js`
The generic first-slice entity list now renders the signal column and uses the new list surface view model.
- summary packet is shown above the table
- row signal is visible before opening a detail page
- action links preserve `returnTo`
- the existing media workspace route is left intact

### 3) `tests/admin/list-visibility.test.js`
Adds coverage for:
- blocked rows
- proof gap rows
- partial rows
- missing rows
- stable prioritization order
- compact summary output

## What Did Not Change
- no schema changes
- no readiness engine changes
- no workflow engine changes
- no evidence taxonomy changes
- no relation model changes
- no new canonical states
- no editor field grouping changes
- no cockpit semantics changes

## Runtime Proof
A temporary runtime fixture was added only for proof capture:
- `Stage 6 Warning Asset`

It exists to demonstrate an honest non-ready card state in the existing media workspace without inventing a new surface or semantics.

## Screenshots
Captured under `docs/reports/2026-03-29/assets/stage6/`.

- [Service list](assets/stage6/01-service-list.png)
- [Case list](assets/stage6/02-case-list.png)
- [Page list](assets/stage6/03-page-list.png)
- [Media workspace](assets/stage6/04-media-workspace.png)
- [Media warning selected](assets/stage6/05-media-warning-selected.png)
- [Service detail after click](assets/stage6/06-service-detail-after-click.png)
- [Page detail after click](assets/stage6/07-page-detail-after-click.png)

## Verification
### Tests
- `npm test` -> `57/57` passed

### Build
- `npm run build` -> passed

Note: the first build attempt failed because the local proof server was still holding `.next/standalone` open. After stopping the proof server, the production build completed successfully. This was an environment lock, not a code defect.

## Manual Flows Verified
1. Open `/admin/entities/service`
2. Identify a blocked row from the list signal
3. Click the row action and land on the editor route
4. Open `/admin/entities/page`
5. Identify a ready row from the list signal
6. Click the row action and land on the editor route
7. Open `/admin/entities/media_asset`
8. Select the warning proof asset and confirm the workspace shows an explicit non-healthy state instead of pretending the item is fine

## Final Hardening Notes
Stage 6 did not disturb earlier stages:
- Stage 2 cockpit still shows state / what to do / coverage
- Stage 3 editor actionability still routes blocker clicks to exact anchors or labelled fallback sections
- Stage 4 evidence register still remains projection-only
- Stage 5 relation UX still preserves context and quick-open flow

The added list layer is therefore a finishing layer, not a semantic rewrite.

## Changed Files
- `lib/admin/list-visibility.js`
- `app/admin/(console)/entities/[entityType]/page.js`
- `tests/admin/list-visibility.test.js`

## Definition of Done
- first-slice list pages show honest row-level signals
- blocked work is visible before card open
- missing-version work is visible before card open
- list ordering helps prioritization
- cockpit/editor/evidence/relation/review flows remain intact
- tests and build are green

## Git / Deploy Reminder
- ready to commit
- ready to push
- manual deploy only if you want the running server to pick up the new build
