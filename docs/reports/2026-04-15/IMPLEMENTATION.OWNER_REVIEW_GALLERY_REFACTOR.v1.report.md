# IMPLEMENTATION.OWNER_REVIEW_GALLERY_REFACTOR.v1

Date: 2026-04-15
Repo: `ecostroycontinent`

## Scope

Refactor the owner-review surface from a queue-first workflow page into a gallery-first approval surface.

Delivered in the same rollout bundle:
- owner-review landing refactor at `/admin/review`
- owner-review detail simplification at `/admin/review/[revisionId]`
- pending page-registry fit-preview changes that were already green locally and shipped together in the same release bundle

## Product outcome

### Review landing

- Removed the queue hero/table pattern from the review landing.
- Replaced it with a compact gallery of entity cards for `service`, `case`, `page`, and `media_asset`.
- Added search, status filter, type filter, and quick status chips.
- Cards that still need the business owner decision are sorted to the top and marked with an explicit attention indicator.
- Cards now present the essence of the material instead of workflow mechanics or SEO-oriented metadata.

### Review detail

- Removed the old split layout with preview living in a narrow sticky right rail.
- Moved preview into the central reading flow.
- Kept the decision form explicit and compact.
- Reordered actions to match owner intent:
  - `Одобрить`
  - `Вернуть с замечанием`
  - `Отклонить`
- Moved readiness/verification into a collapsed technical section so they remain available without overwhelming the owner.
- Added a dedicated media detail rendering path so media approval shows the image and its description instead of raw JSON.

## Code areas

- `lib/admin/owner-review.js`
- `app/admin/(console)/review/page.js`
- `app/admin/(console)/review/[revisionId]/page.js`
- `components/admin/admin-ui.module.css`
- `tests/admin/owner-review-gallery.test.js`
- `tests/admin/owner-review-ui-refactor.test.js`

## Verification

### Tests

- `node --test tests/admin/page-registry-ui-compactness.test.js tests/admin/page-workspace-post-remediation-wave.test.js tests/admin/owner-review-gallery.test.js tests/admin/owner-review-ui-refactor.test.js tests/admin/page-publish-discoverability.test.js tests/admin/question-model-hints.test.js`
- `npm run build`

Result:
- tests passed
- production build passed

## Delivery

Pending at report creation:
- git commit and push
- deploy workflow run
- production smoke verification

These delivery details are appended after rollout completes.
