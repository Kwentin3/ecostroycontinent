# ADMIN_PAGE_AND_LIVE_ENTITY_REMOVAL_PLAN_V1

## What Ordinary Delete Should Still Handle

Ordinary delete should remain narrow and unchanged in spirit.

It should still handle:

- draft/unpublished/unused entities;
- isolated non-live cleanup;
- the current safe subset already covered by strict delete rules.

It should **not** become the answer for ordinary published truth.

## What Test Teardown Should Still Handle

Test teardown should remain responsible only for:

- pure test-marked published graphs;
- graph preview/dry-run;
- mixed-graph refusal;
- teardown-only published-truth deactivation for pure test graphs.

It should **not** become the path for non-test published entities.

## What New Mechanism Is Still Needed

The still-missing mechanism is:

- ordinary live deactivation, operator-facing as `remove from live contour`.

This is needed because:

- ordinary published `Page`, `Service`, and `Case` can be validly no longer wanted in the live contour;
- neither ordinary delete nor test teardown should be stretched to solve that.

This mechanism is explicitly:

- admin-only;
- not delete;
- not rollback;
- not ordinary editorial unpublish.

## How `Page` Should Be Handled

- draft/unpublished `Page`:
  - safe delete if it has no live published truth, no review/publish blockers, and any workspace session can be invalidated.
- test-marked published `Page`:
  - only through test graph teardown.
- ordinary published `Page`:
  - not by direct hard delete;
  - first by ordinary live deactivation;
  - only later, if ever needed, by separate safe hard delete after deactivation.

`Page` cannot be treated like `media_asset` because it is owner truth for page-level composition and its published pointer directly controls public route behavior.

## Recommended First Implementation Slice

The first safe implementation slice should be:

1. admin-only dry-run + execution for `remove from live contour`;
2. scope limited to ordinary published `Page`, `Service`, and `Case`;
3. explicit preview of route outcome, sitemap/list removal, and revalidation side effects;
4. explicit refusal when surviving published or non-test draft refs would break or dangle;
5. no hard delete in the same slice;
6. no `MediaAsset` / `Gallery` expansion yet.

## What Is Explicitly Postponed

- later hard delete after ordinary deactivation;
- any broader archive/retire platform;
- ordinary live-removal support for `MediaAsset` and `Gallery`;
- any universal removal console.

## Additional Notes / My View

- The biggest risk now is unsafe simplification: turning `remove from live contour` into casual delete.
- A second real risk is hidden drift into general unpublish language; the first implementation should stay visibly narrower than that.
- The second biggest risk is overengineering: jumping to a general lifecycle platform before route-owning entities are solved.
- The clean next move is smaller: ordinary live deactivation for `Page`, `Service`, and `Case`, then only later consider post-deactivation delete.
