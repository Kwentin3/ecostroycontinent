# SEO Test Matrix

## Purpose
Определить, что именно нужно тестировать для текущей SEO-учётки `Экостройконтинент`, с разделением на positive, negative, boundary и validation scenarios.

## Scope
Этот документ покрывает:
- SEO role surface as-is;
- current UI/runtime behavior;
- what can be tested immediately;
- what needs probe support;
- what is blocked by runtime reality.

Он не покрывает:
- broad QA platform;
- approval/publish redesign;
- raw admin access;
- full automation infrastructure.

## Canon Assumptions
- SEO Manager edits drafts and prepares review.
- SEO Manager does not publish.
- Publish remains explicit and superadmin-only.
- Owner review remains separate.
- Current production SEO user is inactive, so prod runtime testing is not a valid default fixture.

## Matrix Legend
- `UI-as-is` means the current interface can be tested without new code.
- `Support needed` means a minimal helper or probe makes the test repeatable.
- `Blocked` means the scenario is not currently safe or available.

## Test Families

### 1. Authentication And Session
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| SEO login success | session created and redirected to `/admin` | UI-as-is on an active test fixture | no new API | Production is blocked if the user remains inactive.
| SEO login failure | redirect back to login with readable error | UI-as-is | no new API | Must not leak credentials.
| Session expiry | redirect to login | UI-as-is | no new API | Negative path should remain readable.
| Logout | session removed and redirected | UI-as-is | no new API | Silent logout is not acceptable.

### 2. Dashboard And Navigation
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| SEO dashboard loads | dashboard sections render | UI-as-is | no new API | Should show review queue and next-step list.
| Review queue link visible | review queue accessible | UI-as-is | no new API | Role-safe navigation.
| Users link visible but forbidden | link exists, route blocks | UI-as-is | no new API | Important negative RBAC case.
| Entity list nav visible | list pages available for all SEO entity types | UI-as-is | no new API | Covers all launch-core entity types.

### 3. Entity List And Editor
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| List `global_settings` | redirects to singleton editor or new form | UI-as-is | no new API | Singleton behavior.
| List `service` | table shows existing services and new button | UI-as-is | no new API | Can test list and editor entry.
| List `case` | table shows existing cases and new button | UI-as-is | no new API | Same as service.
| List `page` | table shows pages and new button | UI-as-is | no new API | About/contacts only in current model.
| New draft form loads | editor renders empty/default fields | UI-as-is | no new API | Should work for SEO role.
| Draft save | redirect to entity detail with draft saved message | UI-as-is | no new API | Positive SEO write path.
| SEO fields render | hidden SEO group is present in form | UI-as-is | no new API | Important for surface inventory.
| Readiness panel renders | blocking/warning/info states visible | UI-as-is | no new API | Useful for claim safety.
| Audit timeline renders | timeline visible on edit/history pages | UI-as-is | no new API | Important for forensic traceability.

### 4. Review Workflow
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| Submit draft for review | revision moves to review state | UI-as-is | no new API | SEO can do this.
| Review queue detail | preview and diff are visible | UI-as-is | no new API | Review-as-editor, not owner.
| Owner action absent for SEO | approval controls hidden or blocked | UI-as-is | no new API | Negative RBAC boundary.
| Publish page blocked for SEO | route redirects to no-access | UI-as-is | no new API | Explicit publish boundary.
| Review readiness warnings visible | blocking readiness messages show | UI-as-is | no new API | Important for launch-critical pages.

### 5. Media Surface
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| Inline media upload works | draft media asset created | UI-as-is | optional probe helper | Positive SEO action.
| Upload does not publish | upload stays draft-side | UI-as-is | no new API | Hidden publish must not return.
| Media picker search works | filtered list changes deterministically | UI-as-is | no new API | Semantic labels are already usable.
| Media picker shows published media | published assets selectable | UI-as-is | fixture support may be needed | Draft upload does not populate picker immediately.
| Attach media to entity | selected media persists in draft | UI-as-is | optional probe helper | Needs existing selectable media fixtures.

### 6. History And Rollback
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| History page visible | revision history and audit timeline render | UI-as-is | no new API | SEO can inspect history.
| Rollback button hidden for SEO | no rollback action for SEO role | UI-as-is | no new API | Superadmin-only boundary.
| Rollback route blocked for SEO | route denies access | UI-as-is | no new API | Negative RBAC case.

### 7. Forbidden And Boundary Scenarios
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| `/admin/users` blocked | no-access page or redirect | UI-as-is | no new API | Nav link exists, access must still fail closed.
| Publish route blocked | no-access page or redirect | UI-as-is | no new API | SEO must never publish.
| Owner-action route blocked | no-access page or redirect | UI-as-is | no new API | Business Owner path must not leak.
| Raw admin backend unavailable | no DB shell, no storage shell | UI-as-is | no new API | Must remain true in test support too.
| SEO cannot manage roles/users | forbidden | UI-as-is | no new API | Permission boundary.

### 8. Validation And Error Scenarios
| Scenario | Expected result | Current coverage | Support needed | Notes |
| --- | --- | --- | --- | --- |
| Missing required content field | readable validation error | UI-as-is | no new API | Must remain human-readable.
| Invalid slug or duplicate route field | readable error / readiness block | UI-as-is | no new API | Boundary against unsafe publish.
| Broken relation refs | blocked on save/submit readiness | UI-as-is | no new API | Structural validation.
| Missing proof path | publish readiness block | UI-as-is | no new API | Launch-critical for services/cases.
| No active SEO fixture | login failure or access blocked | runtime blocked | stage/dev seed needed | Current production reality.

## Testing Gaps
| Gap | Impact | Minimal support needed |
| --- | --- | --- |
| Production SEO user inactive | cannot use prod as default SEO fixture | stage/dev seed or test fixture user.
| No stable probe harness | hard to run deterministic full-role checks repeatedly | small CLI probe script.
| No cleanup helper for scratch drafts | repeated mutation tests may accumulate drafts | optional stage/dev-only cleanup policy or disposable test DB.
| Media picker uses published assets only | upload-positive and attach-positive tests need fixture strategy | published media fixture or seeded asset.

## Recommended Coverage Order
1. Auth/session.
2. Dashboard and navigation.
3. Entity list and editor.
4. Review workflow.
5. Media upload and media attach.
6. Forbidden surfaces.
7. Validation/error cases.
8. History and rollback boundaries.

## Decisions Not Reopened By Default
- Do not add a broad QA platform.
- Do not widen SEO permissions to make tests easier.
- Do not use raw DB/storage access for testing.
- Do not restore hidden publish to satisfy media tests.
- Do not convert the test matrix into a product roadmap.
