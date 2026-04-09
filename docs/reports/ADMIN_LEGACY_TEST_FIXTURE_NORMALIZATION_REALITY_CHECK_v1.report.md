# ADMIN_LEGACY_TEST_FIXTURE_NORMALIZATION_REALITY_CHECK_v1

## Is The Mechanism Real And Deployed

Yes.

The normalization bridge is:

- implemented in code;
- reachable in deployed admin UI;
- wired into the real persisted marker path;
- deployed to production.

## Runtime-Verified Operator Reality

Verified in live admin UI with a real authenticated superadmin session.

### Verified `Page`

Entity used:

- `Landing workspace test page`
- `/admin/entities/page/entity_63414045-7e3e-424a-9165-912057aeb698`

Observed:

- editor showed `Пометить как тестовые`;
- dry-run page was reachable and understandable;
- normalization executed successfully;
- editor returned with success message;
- editor now shows:
  - `Тестовые`
  - `Удалить тестовый граф`
- the old normalization button disappeared.

This confirms that legacy `Page` fixtures can now be brought into the existing teardown path through UI.

### Verified `Service`

Entity used:

- `Pilot Service mnlslpw0`
- `/admin/entities/service/entity_27589a74-d2c2-48bc-8df1-11be8e587256`

Observed:

- editor showed `Пометить как тестовые`;
- dry-run page was reachable and understandable;
- normalization executed successfully;
- editor returned with success message;
- editor now shows:
  - `Тестовые`
  - `Удалить тестовый граф`
- `Вывести из живого контура` is no longer shown for this now-test-marked entity, preserving mechanism separation.

This confirms that legacy `Service` fixtures can also be normalized into the teardown path through UI.

### Verified Teardown Integration

For the normalized `Service`, opening `Удалить тестовый граф` now reaches the existing teardown dry-run.

Observed result:

- teardown is available;
- teardown remains blocked honestly by existing rules.

Operator-visible blockers shown in live UI:

- `Один из объектов графа участвует в review/publish-потоке и не может быть разобран автоматически.`
- `Тестовый граф зависит от нетестовой медиафайл.`

This is the desired behavior for the bridge:

- normalization changes eligibility;
- it does not bypass teardown safety.

## Coverage By Entity Family

### `Page`

- `WORKING AS INTENDED`
- runtime-verified

Legacy non-test page fixtures can now be explicitly normalized into test-marked state through UI.

### `Service`

- `WORKING AS INTENDED`
- runtime-verified

Legacy non-test service fixtures can now be normalized into test-marked state through UI.

### `Case`

- `NOT VERIFIED`
- code-verified only

`Case` is included in the implementation and UI scope, but no live `Case` fixture was available in the current admin data for runtime verification.

## Did Delete And Live Deactivation Stay Separate

Yes.

Observed separation after normalization:

- ordinary delete remains its own action where supported;
- test teardown remains its own action;
- live deactivation does not silently run;
- normalization does not delete anything by itself.

The bridge changes only teardown eligibility.

## Is Legacy Test Fixture Handling Now Practical

Partially yes.

What is now practical:

- old unmarked `Page` and `Service` test fixtures can be brought into the same machine-readable test path as newer fixtures;
- operators no longer depend only on the original creation flow to make teardown available.

What still remains blocked in practice:

- teardown still refuses review-state members;
- teardown still refuses mixed graphs;
- first-slice normalization does not include `MediaAsset`, so some real service/case graphs can still stop on non-test media dependencies.

So the bridge solves the marker mismatch, but not every downstream graph impurity.

## Smallest Next Step

The smallest next step is **operator testing**, not a new platform round.

Specifically:

1. verify one real `Case` normalization in UI;
2. decide whether first-slice teardown remains useful enough with media still out of scope;
3. only then consider a narrow follow-up for media-related mixed-graph friction if it proves to be the dominant blocker.
