# IMPLEMENTATION.OWNER_REVIEW_MODAL_FLOW_REFACTOR.v2

Date: 2026-04-15
Status: implemented
Supersedes: `docs/reports/2026-04-15/IMPLEMENTATION.OWNER_REVIEW_GALLERY_REFACTOR.v1.report.md`

## Goal

Bring `/admin/review` to the owner-first interaction model:

- landing screen is only a compact gallery of materials
- no hero block and no diff-first operator layout
- clicking a card opens a consistent modal instead of a separate detail page
- page materials keep desktop/tablet/mobile preview inside the modal
- service/case/media materials open as compact essence cards with a remark field

## What Changed

### Landing

- `app/admin/(console)/review/page.js`
  - removed the large explanatory review header
  - kept only compact stats, filters, status chips, and gallery cards
  - moved the selected material into URL-driven modal state via `?selected=<revisionId>`
  - preserved attention-first sorting and status-based filtering

### Modal Flow

- `components/admin/OwnerReviewDialog.js`
- `components/admin/OwnerReviewDialog.module.css`
  - introduced a consistent modal shell with focus management, Escape close, and backdrop close

- `components/admin/PreviewViewport.js`
- `components/admin/admin-ui.module.css`
  - added compact preview density for page approval modals
  - reduced preview chrome and kept device switching inside the modal

### Owner-Facing Essence Models

- `lib/admin/owner-review.js`
  - kept gallery card projection
  - added `buildOwnerReviewModalModel()` so UI receives compact owner-facing sections instead of reconstructing service/case/media essence inline

### Routing + Actions

- `app/admin/(console)/review/[revisionId]/page.js`
  - converted the old detail route into a redirect back to gallery modal state

- `app/api/admin/revisions/[revisionId]/owner-action/route.js`
  - added `returnTo` and `errorReturnTo` handling so modal submissions can close on success and reopen on failure without bouncing the owner into a separate screen

## UX Result

### Main Screen

- primary user problem: find the next material that needs owner attention
- primary action: open a card and leave a decision

Visible states:

- success: compact gallery
- empty: no materials for current filter
- error: inline top message
- modal-open: same gallery context preserved underneath

### Modal

- `Page`: compact preview with `desktop / tablet / mobile`
- `Service`: image + compact service essence
- `Case`: image + compact case essence
- `Media`: image + caption/description essence
- all modal variants include the same owner remark field and action hierarchy:
  - primary: approve
  - secondary: send back with remark
  - destructive: reject

## Verification

Shell context:

- PowerShell

Commands:

- `node --test tests/admin/page-registry-ui-compactness.test.js tests/admin/page-workspace-post-remediation-wave.test.js tests/admin/owner-review-gallery.test.js tests/admin/owner-review-ui-refactor.test.js tests/admin/page-publish-discoverability.test.js tests/admin/question-model-hints.test.js`
- `npm run build`

Result:

- tests: `22/22` passing
- build: success

## Notes

- publish discoverability remains available from review modal for eligible roles, but it is now secondary to the owner decision flow
- the old route `/admin/review/[revisionId]` remains valid as an entry point, but now redirects into modal state to preserve one consistent interaction model
