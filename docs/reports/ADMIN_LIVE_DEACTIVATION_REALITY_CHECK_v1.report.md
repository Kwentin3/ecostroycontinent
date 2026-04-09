# ADMIN_LIVE_DEACTIVATION_REALITY_CHECK_v1

## Runtime Reality

The new mechanism is real, deployed, and reachable in ordinary admin entity surfaces.

New live seams:

- preview page:
  - `/admin/entities/[entityType]/[entityId]/live-deactivation`
- execution route:
  - `/api/admin/entities/[entityType]/[entityId]/live-deactivation`

Supported entity families in this first slice:

- `Page`
- `Service`
- `Case`

## What Is Fully Aligned

### 1. Ordinary live deactivation is real

The deployed system now supports:

- dry-run evaluation before any mutation;
- explicit route/public-side impact preview;
- execution only after confirmation;
- active published-pointer clearing without hard delete;
- preserved admin/history truth.

### 2. `Page`, `Service`, and `Case` are covered

The mechanism now handles:

- ordinary published `Page`
- ordinary published `Service`
- ordinary published `Case`

with family-specific route and listing consequences surfaced honestly before execution.

### 3. Ordinary delete stayed strict

Ordinary delete is still limited to its original safe subset:

- it still refuses published/live truth;
- it still does not cover `Page`;
- it still does not behave like unpublish.

### 4. Test teardown stayed separate

Test-marked published objects are still explicitly refused by ordinary live deactivation and must go through:

- `Удалить тестовый граф`

That keeps the three mechanisms separate:

- ordinary safe delete;
- test graph teardown;
- ordinary live deactivation.

### 5. Route/public consequences are visible

The preview now makes the consequence visible before execution:

- `Page`
  - `/about` or `/contacts` may become `404`
- `Service`
  - `/services/[slug]` leaves the live contour
- `Case`
  - `/cases/[slug]` leaves the live contour

Revalidation paths are also shown and executed after successful deactivation.

## What Remains Partial

- There is still no hard-delete follow-up for deactivated ordinary live entities.
- `MediaAsset` and `Gallery` are intentionally out of scope.
- Redirect policy is not part of this slice.
- The codebase still has no dedicated sitemap runtime route, so sitemap consequences remain descriptive rather than endpoint-driven.
- The deploy workflow still does not reliably persist the new image pin in `/opt/ecostroycontinent/runtime/.env`; this rollout needed one manual correction after a successful deploy run.

## Deployment Check

- `build-and-publish` run `24210419740` succeeded
- `deploy-phase1` run `24210494826` succeeded
- deployed image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:e35d13cab3f41cfedf00214177086561e64b6e517dadc1426a47b1a024d255a8`
- host env pin after manual correction:
  - `APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:e35d13cab3f41cfedf00214177086561e64b6e517dadc1426a47b1a024d255a8`
- running container image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:e35d13cab3f41cfedf00214177086561e64b6e517dadc1426a47b1a024d255a8`
- public health:
  - `https://ecostroycontinent.ru/api/health` returned `200 OK`

## Verdict

The first slice is honest enough for operator testing now:

- ordinary live deactivation exists;
- `Page`, `Service`, and `Case` are covered;
- delete stayed strict;
- test teardown stayed separate;
- route/public impact is previewed explicitly before execution.

## Smallest Safe Next Step

Do not broaden into general unpublish.

The smallest safe next step is:

1. operator-test one allowed deactivation for each family:
   - `Page`
   - `Service`
   - `Case`
2. operator-test one refusal with a surviving published ref;
3. only after that decide whether a later post-deactivation hard-delete slice is truly needed.
