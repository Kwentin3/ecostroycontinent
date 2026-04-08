# LANDING_FIRST_RUNTIME_BLOCKER_FIX_EXECUTION_v1

Date: 2026-04-08

## 1. Scope

Focused runtime blocker fix for the deployed landing-first workspace generate path, followed by deploy and live recheck.

This pass stayed narrow:

- root-cause the live `content_revisions_ai_source_basis_check` failure;
- fix the landing workspace revision write shape;
- add a focused regression assertion;
- deploy through the canonical GHCR + `deploy-phase1` path;
- re-run a narrow live smoke.

## 2. Exact Root Cause

The live blocker was caused by a bad `content_revisions.ai_source_basis` value written by the landing-first workspace generate route.

Exact mismatch:

- runtime write path: `app/api/admin/workspace/landing/[pageId]/route.js`
- invalid value being written: `from_current_page_only`
- DB truth: `db/migrations/001_admin_first_slice.sql`
- allowed check values:
  - `from_current_entity_only`
  - `from_linked_entities`
  - `from_published_content`
  - `manual_prompt_only`

Because the landing-first workspace saves drafts into the same `content_revisions` truth used by the rest of the content flow, the invalid enum-like string violated the database check constraint:

- `content_revisions_ai_source_basis_check`

This was not an auth issue, not an LLM transport issue, and not a review-route issue.

## 3. Why The Fix Is Canon-Safe

The landing-first workspace is still anchored to a single `Page` owner.

The fix does not soften the DB rule and does not introduce a second publishable truth. It only aligns the landing workspace revision write with the already-existing persistence canon:

- owner truth remains `Page`
- saved draft still goes into `content_revisions`
- `pageId` remains the owner anchor
- `landingDraftId` remains an internal draft handle
- review/publish flow stays unchanged

Using `from_current_entity_only` is the correct current-truth value for a page-anchored workspace save into the shared revision table.

## 4. Changed Files

- `app/api/admin/workspace/landing/[pageId]/route.js`
  - changed `aiSourceBasis` from invalid `from_current_page_only` to valid `from_current_entity_only`
- `tests/landing-workspace.route.test.js`
  - added an explicit regression assertion that the landing workspace save path now writes `from_current_entity_only`
- `docs/reports/LANDING_FIRST_RUNTIME_SMOKE_CHECK_v1.report.md`
  - committed the prior live blocker evidence report produced before this fix

## 5. Tests And Checks Run

Local verification:

- `node --test tests/landing-workspace.route.test.js`
- `npm test`
- `npm run build`

Result:

- all targeted and repo tests passed
- production build passed
- existing Next.js NFT warning remained unchanged and unrelated to this fix

## 6. Git / Push / Rollout

Git:

- commit: `2afdc88`
- message: `Fix landing workspace revision ai source basis`

Push:

- pushed to `origin/main`: yes

Build/publish:

- GitHub Actions workflow: `build-and-publish`
- run: `24145755325`
- status: `success`
- image digest:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:64799272424f9dba1c898d07b20de6d43c7229ca0cbffad4aa7b92f2742ee876`

Deploy:

- GitHub Actions workflow: `deploy-phase1`
- run: `24145884255`
- status: `success`
- deploy used pinned image ref:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:64799272424f9dba1c898d07b20de6d43c7229ca0cbffad4aa7b92f2742ee876`

## 7. Live Recheck Summary

After deploy, the original blocker did not reproduce.

The same live generate path no longer returned:

- `new row for relation "content_revisions" violates check constraint "content_revisions_ai_source_basis_check"`

Instead, the deployed workspace completed the generate attempt and surfaced honest domain-level validation feedback on the tested page:

- `Не указан основной медиафайл страницы.`

The workspace state updated coherently after generate:

- session state persisted
- current projection pointer was updated
- last result stayed explicit

## 8. Session Conflict Recheck

The earlier live smoke showed weak active-session behavior.

After the fix and redeploy, a second independent browser session opening the same `pageId` did surface the intended guard text:

- `Another active landing workspace session is already anchored to this page. Resume that session before generating or sending this draft to review.`

In that second session:

- generate button was not present
- review button was not present

This is materially better than the previous live smoke and is acceptable as the current MVP-strength guard.

It is still an application-level active-session guard, not a distributed transactional lock.

## 9. Remaining Known Risks

- On the tested live page, `Передать на проверку` after the new generate attempt returned an explicit operator-facing error:
  - `Сломанные связи не позволяют отправить версию на проверку.`
- This appears as a secondary review/data validation issue on the tested page, not the original revision-save blocker.
- The session uniqueness guard is now visibly surfaced in live behavior, but it remains a practical app-session guard rather than a global lock.

## 10. Conclusion

The exact runtime blocker was an invalid `ai_source_basis` value in the landing workspace revision save path.

That blocker was fixed narrowly, tested locally, deployed through the canonical artifact path, and removed from the live generate path.
