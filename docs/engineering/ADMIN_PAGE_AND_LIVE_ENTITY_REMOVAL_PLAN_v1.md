# ADMIN_PAGE_AND_LIVE_ENTITY_REMOVAL_PLAN_v1

## 1. Why Ordinary Delete + Test Teardown Are Still Not Enough

Two mechanisms already exist and should remain intact:

- ordinary safe delete for the narrow non-live safe subset;
- test-marked published graph teardown for pure test graphs only.

Those mechanisms solve real problems, but they do not solve the ordinary live-product case:

- a published `Service`, `Case`, or `Page` may later be wrong, obsolete, or no longer meant to stay live;
- ordinary delete correctly refuses once active published truth exists;
- test teardown correctly refuses non-test objects;
- therefore the system still lacks a product-safe path for ordinary live entities to leave the live contour.

The missing mechanism is not broader delete.

The missing mechanism is:

- a narrow ordinary live-entity deactivation flow for route-owning and live-contour entities.

That flow must stay distinct from both delete and test teardown.

## 2. Taxonomy Of Removal / Deactivation Scenarios

### Case 1 - Draft / unpublished / unused object

Mechanism:

- ordinary safe delete.

Examples:

- unused draft `media_asset`;
- unpublished draft `service`;
- unpublished draft `page` that never became live truth.

Position:

- keep as-is;
- do not weaken it;
- do not merge it with live removal.

### Case 2 - Test-marked published graph

Mechanism:

- test graph teardown.

Examples:

- test `Page + Service + Case + MediaAsset` graph created to exercise real publish flow;
- graph is fully test-marked and can be dismantled safely.

Position:

- keep as-is;
- do not turn it into general product removal.

### Case 3 - Ordinary published but incorrect object

Mechanism:

- replacement or rollback, not removal.

Examples:

- published `Service` has wrong copy;
- published `Case` has wrong result text;
- published `Page` has wrong landing composition.

Position:

- the first answer is to publish corrected truth or roll back to another published revision;
- delete is the wrong primitive;
- live deactivation is also usually the wrong primitive unless the route itself should disappear.

### Case 4 - Ordinary published but no longer intended to remain live

Mechanism:

- separate ordinary live deactivation, operator-facing as `remove from live contour`.

Examples:

- a `Service` route should no longer exist publicly;
- a `Case` should be removed from public listing and route access;
- a `Page` should no longer resolve publicly and must stop owning live page truth.

Position:

- this is the real missing ordinary-product mechanism;
- it should not be called ordinary delete;
- it should not reuse test teardown.

### Case 5 - Object still required for surviving live non-test truth

Mechanism:

- refusal.

Examples:

- a published `Service` is still referenced by a surviving published `Page`;
- a published `Case` is still referenced by a surviving published `Service`;
- a `MediaAsset` is still used by surviving published pages or cards.

Position:

- refuse explicitly;
- do not partially dismantle by default;
- require operator to replace or detach the surviving references first.

## 3. Recommended Mechanism Per Scenario

| Scenario | Correct mechanism now | Why |
| --- | --- | --- |
| Draft / unpublished / unused | Ordinary safe delete | No live truth is being dismantled. |
| Pure test-marked published graph | Test graph teardown | Special bounded cleanup for test-only published truth. |
| Ordinary published but incorrect | Replacement / republish / rollback | The route should usually stay live; only the content is wrong. |
| Ordinary published but no longer needed live | Remove from live contour | The live pointer must be removed explicitly before any later delete. |
| Still needed by surviving live truth | Refusal | Removing it would break public truth or protected admin truth. |

## 4. Ordinary Live-Entity Deactivation Position

The correct new primitive is:

- `remove from live contour`

Internal meaning:

- deactivate the active published truth pointer for one ordinary non-test entity after explicit checks and operator confirmation.
- this is an admin-only live deactivation operation.

This operation is explicitly **not**:

- delete;
- rollback;
- ordinary editorial unpublish;
- unpublish-to-null as a casual toggle;
- a reusable lifecycle primitive for every future case.

Why this naming is better than `delete`:

- it does not pretend the row disappears immediately;
- it reflects that public truth is what changes first;
- it makes later delete a separate concern.

Why this naming is better than raw `unpublish`:

- `unpublish` is too easy to read as a casual editorial toggle;
- the system needs a guarded operational action, not a lightweight content button.

Recommended distinction:

- operator-facing term: `Вывести из живого контура`
- internal term: ordinary live-truth deactivation

This mechanism should:

- clear live published participation for one entity;
- record an explicit audit event;
- keep revision history;
- avoid becoming a general lifecycle platform in the first slice.

Implementation guardrail:

- any future execution language must preserve this as a narrow admin-only live deactivation action;
- if the implementation starts to look like a generic `Unpublish` button, it is drifting away from this plan.

## 4.1 Public-Side Side Effects Of Live Deactivation

Live deactivation must have explicit public-side semantics.

It cannot remain an internal pointer mutation with implied consequences.

### `Page`

Operational effect:

- the active published `Page` pointer is cleared;
- the public route backed by that page leaves the live contour;
- under the current read-side, `/about` or `/contacts` will resolve to `404` if no published replacement exists;
- the page must stop participating in sitemap generation if the sitemap reads from published truth;
- public caches and route content must be revalidated immediately after deactivation.

Position on redirects:

- redirect obligations are not part of the first slice by default;
- if a specific page family later needs redirect policy, that should be an explicit later addition rather than hidden inside first-slice deactivation.

### `Service`

Operational effect:

- the active published `Service` pointer is cleared;
- `/services/[slug]` must leave the live contour and resolve as non-live under the published read-side;
- the service must stop participating in service listings and sitemap outputs derived from published services;
- service route and list caches must be revalidated.

### `Case`

Operational effect:

- the active published `Case` pointer is cleared;
- `/cases/[slug]` must leave the live contour and resolve as non-live under the published read-side;
- the case must stop participating in case listings and sitemap outputs derived from published cases;
- case route and list caches must be revalidated.

### Shared first-slice rule

- live deactivation changes public visibility first;
- it does not immediately remove admin history;
- it does not imply hard delete in the same step.

## 5. Page Handling Model

`Page` must not be treated like `media_asset`.

Why:

- `Page` is canonical owner truth for page-level composition;
- the landing workspace is anchored to `Page`;
- the public read-side for `/about` and `/contacts` resolves through the active published `Page` pointer and returns `notFound()` when no published page exists;
- deleting a `Page` can therefore affect both live route resolution and admin workspace anchoring.

### A. Draft / unpublished `Page`

Recommended handling:

- safe delete is allowed only if:
  - there is no active published revision;
  - there is no `review` revision;
  - there are no open publish obligations;
  - there is no surviving non-test truth depending on the page as a workspace owner.

Position on landing workspace session state:

- an active page-anchored workspace session is not durable product truth;
- it should be cleared or invalidated as part of page deletion rather than treated as a permanent blocker.

### B. Test-marked published `Page`

Recommended handling:

- only through test graph teardown.

Position:

- do not add a second delete/deactivate path for test pages;
- keep all published test `Page` removal inside the existing test teardown mechanism.

### C. Ordinary published `Page`

Recommended handling:

- do not allow direct hard delete;
- do not route it through test teardown;
- use ordinary live deactivation as the first action;
- allow later hard delete only after deactivation and only if the remaining state becomes safely removable.

Special note for current `Page` family:

- current public page routes are singleton-like (`about`, `contacts`);
- removing a published `Page` from live contour will make the route return `404` under the current read-side;
- this is acceptable only as an explicit operator-confirmed consequence, not as a side effect hidden behind delete.

## 6. Entity-Scope Analysis

### `Page`

Needs broader live-removal model now:

- yes.

Why:

- current draft delete is not enough;
- test teardown is not enough for non-test pages;
- pages are owner truth and must have a path to leave the live contour safely.

Recommended first-slice support:

- yes, but only for `remove from live contour`, not direct hard delete.

### `Service`

Needs broader live-removal model now:

- yes.

Why:

- service is route-owning published truth;
- `wrong content` should still be corrected via replacement/rollback;
- but `this service should no longer be live` needs a real path.

Recommended first-slice support:

- yes, route-aware live deactivation.

### `Case`

Needs broader live-removal model now:

- yes.

Why:

- case is also route-owning published truth;
- same reasoning as service.

Recommended first-slice support:

- yes, route-aware live deactivation.

### `MediaAsset`

Needs broader live-removal model now:

- not in the first slice.

Why:

- media is not route-owning truth;
- the immediate ordinary-live problem is more urgent for `Page`, `Service`, and `Case`;
- published media should remain protected until upstream published refs are detached or replaced.

Recommended first-slice support:

- no;
- keep strict delete + explicit refusal for now.

### `Gallery`

Needs broader live-removal model now:

- not in the first slice.

Why:

- gallery is a support container, not a route-owning public truth family;
- current blocking operator cases are better solved by page/service/case live deactivation first.

Recommended first-slice support:

- no;
- revisit only after route-owning entities prove the model.

## 7. Safety Boundaries And Refusal Logic

### Hard blockers for ordinary live deactivation

- entity has an active `review` revision;
- entity has open publish obligations that must remain inspectable;
- removing the entity from live contour would leave surviving published refs broken;
- removing the entity would break surviving route-owning non-test truth;
- surviving non-test drafts still reference the entity and would be left dangling in editorial flows;
- the current entity family is outside the first-slice scope.

### Warnings, not immediate blockers

- page-anchored workspace session exists and will be invalidated;
- live route will become `404` after deactivation;
- later hard delete is not yet available even after successful deactivation.

Position on draft refs:

- after re-checking the current editorial model, surviving non-test draft refs should block ordinary live deactivation in the first slice;
- although they do not break public truth immediately, they do leave confusing dangling references in operator flows;
- the current system does not yet provide strong draft-ref repair ergonomics, so the safer first-slice rule is explicit refusal;
- if later tooling makes draft-ref cleanup obvious and safe, this blocker may be reconsidered, but it should start strict.

### Conditions for later hard delete after deactivation

Hard delete may be considered only later, and only if:

- active published truth is already removed;
- no `review` revision remains;
- no open publish obligations remain;
- no surviving published refs remain;
- no surviving non-test draft refs remain;
- no page/workspace ownership state remains that should survive.

## 8. Difference Between The Three Mechanisms

### Ordinary delete

- for draft/unpublished/non-live safe subset only;
- never removes active live truth;
- remains strict.

### Test graph teardown

- for pure test-marked published graphs only;
- may deactivate published truth, but only as teardown-only internal behavior;
- refuses mixed graphs;
- stays separate from ordinary product removal.

### Ordinary live deactivation

- for ordinary non-test live entities that should stop being live;
- affects only one ordinary entity flow at a time;
- is route-aware and public-truth-aware;
- clears live participation but preserves admin history;
- does not pretend to be delete;
- does not become rollback;
- does not become a hidden general unpublish-to-null toggle for every situation.

## 9. First Implementation Slice

The smallest safe next slice after this plan should be:

1. add a narrow admin-only `remove from live contour` dry-run for ordinary published `Page`, `Service`, and `Case`;
2. show route impact, public read-side outcome, and surviving incoming refs before execution;
3. refuse if any surviving published or non-test draft truth would break or dangle;
4. on success, clear active published participation and record audit evidence;
5. trigger route/list/sitemap revalidation appropriate to the entity family;
6. keep the deactivated entity present in admin as non-live historical truth;
7. leave later hard delete out of this slice.

Why this is the smallest safe slice:

- it solves the real ordinary live problem;
- it does not weaken delete;
- it does not broaden test teardown;
- it preserves stronger `Page` protection than ordinary support assets;
- it avoids prematurely solving media/gallery removal before route-owning entities.

## 10. Later Slices

### Later slice L2 - Post-deactivation hard delete

After the deactivation slice proves stable:

- allow later hard delete of already deactivated entities if all non-live safety checks pass.

### Later slice L3 - Support assets if a real operator case appears

Only if a concrete operator case appears:

- evaluate whether `MediaAsset` and `Gallery` need their own bounded live-removal path beyond strict delete + refusal.

These later slices should not be bundled into the first implementation step.

## 11. Explicit Non-Goals

This plan does **not** propose:

- one universal delete vision;
- a giant lifecycle platform;
- archive-first everywhere;
- broader retire/deactivate for every family at once;
- casual hard delete for ordinary published `Page`;
- turning test teardown into ordinary removal;
- merging every removal problem into one UI button.

## 12. Smallest Safe Next Step

The smallest safe step after this plan is:

- implement ordinary live deactivation only for published `Page`, `Service`, and `Case`, with dry-run preview, explicit refusal on surviving published refs, and no hard delete in the same slice.

## 13. Additional Notes / My View

- The current system is already right to keep ordinary delete strict.
- The current system is also right not to let test teardown become the answer for live product truth.
- The real hole is narrower than “full lifecycle management”: ordinary live route-owning truth can enter the system, but has no honest way to leave the live contour.
- `Page` deserves extra caution because current `/about` and `/contacts` routes resolve directly from published page truth and already fall back to `404` when that truth is absent.
- Because of that, the next move should focus on deactivation first and delete later. Trying to combine both in one first slice would make the feature riskier than it needs to be.
