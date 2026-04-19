# Removal Quarantine and Sweep Contract Pack Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation-facing companion contract / bounded parallel contour  
Основание: [PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md](./PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md), [Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md](./Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md)

## 1. Purpose

Этот документ фиксирует узкий operational contract для нового removal-контура `mark -> analyze -> sweep`.

Он нужен, чтобы:

- не размазать новую механику между PRD, workflow spec и legacy delete rules;
- дать реализации и тестам один bounded source of truth;
- интегрировать новый cleanup contour в уже существующие publish/read-side and delete-safety contracts без переоткрытия всей lifecycle-модели.

Документ не заменяет PRD и не заменяет publish workflow spec. Он фиксирует только то, что нужно для безопасного внедрения нового параллельного контура удаления.

## 2. What this contract owns

Документ owns:

- meaning of `marked for removal` / removal quarantine;
- removal terminology and derived states;
- relation-blocking rules for marked objects;
- removal component / sweep analyzer contract;
- purge decision rules;
- authority split between mark/unmark and purge;
- coexistence rules with legacy delete and test graph teardown;
- audit expectations for the new contour.

## 3. What this contract does not own

Документ does not own:

- общий publish workflow;
- revision state machine outside removal implications;
- route ownership canon;
- archive platform;
- background retention / cron cleanup;
- UI design details beyond required operator semantics.

## 4. Inherited canon and constraints

Новый removal contour inherits these non-negotiable rules:

- `Publish` remains explicit and revision-based.
- Published read-side consumes only active published revisions.
- Approval and publish remain separate operations.
- Delete safety may not weaken published truth protections.
- Route-owning entities remain governed by existing route ownership canon.
- The system must not silently destroy surviving published contour.
- Legacy delete protections remain valid unless a narrower rule in this contract explicitly adds a safer path.

## 5. Core terms

### 5.1 Marked for removal

`Marked for removal` means the object is placed into removal quarantine.

It does **not** mean:

- the object is already deleted;
- the object is automatically unpublished;
- the object is automatically safe to purge.

It **does** mean:

- the object is an explicit cleanup candidate;
- the object leaves normal write-side circulation;
- new incoming references to it are forbidden;
- the analyzer may include it in a removal component.

### 5.2 Removal component

A `removal component` is a connected set of marked objects that the analyzer considers together for purge readiness.

The component is the unit of purge decision.

### 5.3 External incoming reference

An `external incoming reference` is any incoming reference from an unmarked object into a marked object or marked component.

This is the main graph-level blocker for purge.

### 5.4 State blocker

A `state blocker` is a non-graph condition that still prevents safe purge, including at minimum:

- review revision;
- open publish obligation;
- published lifecycle policy that still forbids hard delete;
- unsupported destructive path for this entity type.

### 5.5 Ready for purge

A component is `ready for purge` only when it is both:

- graph-safe;
- state-safe.

## 6. Persisted fields and derived states

### 6.1 Persisted fields for v0.1

The minimal persisted removal fields are:

- `markedForRemovalAt`
- `markedForRemovalBy`
- `removalNote` (optional)

### 6.2 Derived runtime states

The implementation may derive these states at runtime:

- `not_marked`
- `marked`
- `marked_blocked`
- `marked_ready_for_purge`
- `purged`

In v0.1 `marked_blocked` and `marked_ready_for_purge` do not have to be persisted as source fields if the analyzer calculates them deterministically.

## 7. Authority contract

### 7.1 Mark / unmark authority

Marking and unmarking follow content-edit authority for the entity type.

Baseline rule:

- roles that may edit the entity may mark and unmark it.

### 7.2 Purge authority

Purge authority is narrower than mark authority.

Baseline rule for v0.1:

- only `Superadmin` may execute purge.

This keeps cleanup execution aligned with destructive authority and with publish-grade safety.

## 8. Write-side quarantine rules

### 8.1 New references to marked objects are forbidden

Once an object is marked for removal:

- it must not be offered as a normal selectable target in relation pickers;
- save routes must reject new refs to it even if payload injection bypasses UI;
- readiness / validation must surface this as a blocking condition.

### 8.2 Marked objects leave ordinary operator circulation

Marked objects should:

- disappear from ordinary selection flows; or
- appear only as disabled rows with explicit `Помечен на удаление` status.

### 8.3 Mark does not bypass revision discipline

Marking an object does not change the canonical meaning of:

- draft
- review
- published

Removal quarantine is an additional lifecycle axis, not a replacement for revision semantics.

## 9. Graph rules

### 9.1 Main blocker rule

`unmarked -> marked` is the main graph blocker.

If any unmarked object still points into a marked object or marked component, the component is blocked.

### 9.2 Internal marked graph

`marked -> marked` is normal and belongs to the internal removal component.

### 9.3 Outgoing references to unmarked objects

`marked -> unmarked` is not automatically a blocker.

It is allowed when:

- the unmarked object does not depend back on the marked component;
- deleting the marked component does not invalidate surviving truth of the unmarked object.

### 9.4 Shared nodes

If a marked object is still used by any surviving unmarked object, it is not purge-ready.

The system must not delete shared nodes simply because one neighboring marked graph also references them.

## 10. State-blocking rules

A component is blocked if any member has at least one of the following:

- review revision;
- open publish obligation;
- published-history policy that still prohibits hard delete;
- unsupported destructive path for this type in v0.1;
- another lifecycle blocker that would already block the legacy delete path.

This preserves parity with the existing safety model instead of creating a softer parallel delete engine.

## 11. Relationship to published state

### 11.1 Marked and published are separate axes

`marked_for_removal` does not mean `unpublished`.

### 11.2 v0.1 rule

In v0.1, mark may coexist with published state.

If the object is still retained by live contour, the operator surface must say so explicitly, for example:

- `Помечен на удаление, но ещё удерживается живым контуром`.

### 11.3 Deferred extension

Safe auto-unpublish for eligible marked objects may be added later, but is not part of the required v0.1 baseline.

## 12. Analyzer contract

### 12.1 Inputs

The analyzer takes a set of marked objects and builds removal components.

### 12.2 Required outputs per component

For each component the analyzer must produce at least:

- component members;
- incoming refs from unmarked objects;
- outgoing refs to unmarked objects;
- state blockers;
- purge verdict;
- human-readable blocker reasons;
- operator hrefs to the exact blocking objects when possible.

### 12.3 Allowed verdicts

The analyzer must distinguish at least:

- `ready_for_purge`
- `blocked`

An optional intermediate UI label like `partially ready` is acceptable, but purge eligibility must still collapse to `ready` or `blocked`.

## 13. Purge decision contract

### 13.1 Ready component

A component is purge-ready only if all of the following hold:

- all members of the component are marked;
- there are no incoming refs from unmarked objects;
- there are no state blockers;
- purge order can be determined safely.

### 13.2 Blocked component

A component is blocked if at least one of the following holds:

- any unmarked object points into the component;
- any member has review residue;
- any member has open publish obligations;
- lifecycle policy still forbids delete for at least one member;
- purge order cannot be executed safely in the supported v0.1 contour.

### 13.3 Purge unit

The unit of purge is the component, not the single object viewed in isolation.

## 14. Purge execution contract

### 14.1 No silent destructive sweep

Even for ready components, the system must require one final explicit operator confirmation before executing purge.

### 14.2 Dependency-aware order

Purge must execute in safe dependency-aware order.

It must never rely on arbitrary user order or optimistic deletion retries.

### 14.3 No unmarked collateral deletion

The purge engine must not delete unmarked objects automatically.

### 14.4 Audit trace required

Purge execution must write audit evidence that the component was:

- selected for purge;
- evaluated as safe;
- executed in bounded destructive flow.

## 15. Coexistence with current delete tools

### 15.1 Legacy manual safe delete

Current `Безопасно убрать объект` remains valid as:

- legacy/manual path;
- fallback path;
- bounded escape hatch for scenarios not yet covered by sweep.

The new contour does not invalidate its protections.

### 15.2 Specialized test graph teardown

`Удалить тестовый граф` remains a distinct specialized capability.

For v0.1 it is not automatically folded into quarantine+sweep.

Reason:

- it already encodes a narrower test-only policy;
- it has specific published test teardown semantics;
- premature convergence would create unnecessary scope and risk.

## 16. Operator-facing minimum semantics

The new operator surfaces must always answer three questions clearly:

1. `Что уже помечено на удаление?`
2. `Что можно удалить прямо сейчас?`
3. `Что именно блокирует остальное?`

The operator must not be forced to infer blockers from hidden graph state.

## 17. Minimal audit contract

The new contour must record at least these conceptual events:

- object marked for removal;
- removal mark cleared;
- purge analysis performed;
- purge refused because of blockers;
- purge executed.

Exact event keys may vary in implementation, but the semantics must stay stable.

## 18. Integration with existing workflow obligations

The removal contour must coexist correctly with existing contracts:

- publish obligations remain real blockers, not informational hints;
- review revisions remain real blockers, not bypassable cleanup noise;
- route-owning published entities remain governed by existing live/delete policy;
- read-side truth remains published-only regardless of removal quarantine.

In short:

- quarantine is additive;
- workflow truth remains authoritative.

## 19. Bounded rollout rule

The contract is intentionally narrow.

For v0.1:

- implement only the supported entity types;
- keep legacy/manual delete alive;
- keep test graph teardown separate;
- do not design a broad lifecycle platform around removal yet.

## 20. Final implementation rule

If there is tension between:

- making purge easier; and
- preserving graph/publish safety,

implementation must prefer safety.

If there is tension between:

- preserving safety; and
- forcing the operator to guess hidden blockers,

implementation must preserve safety **and** surface blockers explicitly.

That is the whole purpose of this contract pack.
