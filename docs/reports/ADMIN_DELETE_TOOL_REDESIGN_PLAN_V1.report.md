# ADMIN_DELETE_TOOL_REDESIGN_PLAN_V1

## What Was Removed From The Broader Plan

The redesigned plan cuts the parts that were too platform-like for the current phase:

- broad archive-first lifecycle rollout;
- grouped cleanup by page bundle;
- wider provenance model;
- `Page` deletion in the first slice;
- large cleanup subsystem language.

## What Remains In The Narrowed Plan

The plan keeps only the parts that are operationally necessary now:

- one persisted marker for explicit agent-created test data;
- fast filter + bulk delete path for those marked objects;
- entity-level delete action for ordinary human cleanup attempts;
- safe-delete refusal logic with explicit reasons;
- first-slice focus on `media`, `service`, and `case`.

## Recommended Marker

Recommended minimal marker:

- `creationOrigin = "agent_test"`

Reason:

- machine-readable;
- explicit;
- future-safe enough without becoming a provenance platform.

## Recommended First Implementation Slice

Implement immediately:

1. persisted agent-test marker;
2. `Только тестовые` filter in `media`, `service`, `case` lists;
3. bulk delete for test-marked entities;
4. entity-level delete action for `media`, `service`, `case`;
5. safe-delete refusal with concrete reasons.

## Archive-First Decision

Archive-first is deferred.

Reason:

- it is not the main current problem;
- it would broaden the work into lifecycle-platform territory;
- direct safe delete plus explicit refusal is enough for the current operational phase.

## Final Position

The redesigned plan is intentionally smaller:

- delete test junk fast when it is clearly marked and safe;
- let operators attempt deletion of ordinary entities;
- refuse honestly when deletion would break live or reused truth;
- do not build a platform before the basic delete path exists.
