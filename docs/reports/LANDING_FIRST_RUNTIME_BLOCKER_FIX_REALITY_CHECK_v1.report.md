# LANDING_FIRST_RUNTIME_BLOCKER_FIX_REALITY_CHECK_v1

Date: 2026-04-08

## 1. Scope

Post-fix live runtime recheck of the deployed landing-first workspace after the `content_revisions_ai_source_basis_check` blocker fix.

This recheck covered:

- login
- chooser
- concrete workspace route
- one real generate path
- one review handoff attempt
- refresh / reopen continuity
- one second-session conflict path

Runtime contour checked:

- `https://ecostroycontinent.ru`

## 2. Login / Entry

Status: PASS

- Route checked: `/admin/login` and `/admin`
- Evidence:
  - live login succeeded
  - admin shell loaded
  - `AI-верстка` entry is present in the sidebar
- Interpretation:
  - live admin access is working on the deployed contour

## 3. Chooser Route

Status: PASS

- Route checked: `/admin/workspace/landing`
- Evidence:
  - chooser loaded
  - Russian operator-facing copy is present
  - real `Page` rows are listed with `Открыть AI-верстку`
- Interpretation:
  - landing-first chooser is alive and operator-facing

## 4. Workspace Route

Status: PASS

- Route checked:
  - `/admin/workspace/landing/entity_63414045-7e3e-424a-9165-912057aeb698`
- Evidence:
  - workspace resolves for a real `Page` owner
  - source editor CTA is present
  - chooser back-link is present
  - screen still shows left session context, center preview + prompt area, and right verification / handoff column
- Interpretation:
  - page-anchored landing workspace is alive after deploy

## 5. Real Generate Path

Status: PASS

- Route / action checked:
  - `/admin/workspace/landing/entity_63414045-7e3e-424a-9165-912057aeb698`
  - button: `Сгенерировать заново`
- Evidence:
  - the previous DB constraint error did not recur
  - no raw 500 page appeared
  - the route returned with an explicit operator-facing message:
    - `Не указан основной медиафайл страницы.`
  - workspace state updated coherently after generate:
    - `Есть блокирующие проблемы в кандидате лендинга.`
    - `Последний блокер: Не указан основной медиафайл страницы.`
    - `Результат: ok`
    - `Текущая проекция: landing_candidate_a9ec124d-3da3-47d9-b3c8-e3ca3c11f49c · Черновик`
- Interpretation:
  - the live generate path is no longer blocked by the revision-save constraint
  - the request now completes through the save path and surfaces honest domain validation instead of crashing

## 6. Review Handoff

Status: PARTIAL

- Route / action checked:
  - same workspace route
  - button: `Передать на проверку`
- Evidence:
  - no silent publish occurred
  - no raw 500 page occurred
  - the route returned an explicit operator-facing error:
    - `Сломанные связи не позволяют отправить версию на проверку.`
- Interpretation:
  - review handoff path is alive and remains explicit / human-controlled
  - however, on the tested generated draft it did not complete successfully because review validation blocked the candidate
- Likely layer:
  - review/data validation for the tested draft, not the original revision-save blocker

## 7. Session Continuity

Status: PASS

- Route / action checked:
  - reopen the same `pageId` after generate
- Evidence:
  - workspace state was retained on reopen
  - draft pointer and last-step state remained visible
  - the same page remained anchored as owner
- Interpretation:
  - basic session continuity is working on the deployed contour

## 8. Session Conflict

Status: PASS

- Route / action checked:
  - second independent browser session
  - same operator role
  - same `pageId`
- Evidence:
  - second session showed explicit guard text:
    - `Another active landing workspace session is already anchored to this page. Resume that session before generating or sending this draft to review.`
  - second session did not show generate button
  - second session did not show review button
- Interpretation:
  - active-session guard is now surfacing honestly in live behavior
  - this is acceptable for current MVP session discipline

## 9. What Is Confirmed Fixed

- the original live blocker is removed
- landing workspace generate no longer fails on:
  - `content_revisions_ai_source_basis_check`
- workspace state remains coherent after generate
- second-session conflict now surfaces explicitly on the deployed contour

## 10. What Remains Secondary

- the tested generated draft could not be handed off to review because the runtime returned:
  - `Сломанные связи не позволяют отправить версию на проверку.`
- the tested page also surfaced a content/readiness blocker during generate:
  - `Не указан основной медиафайл страницы.`

These are real follow-up issues for the tested content path, but they are not the same as the fixed revision-save blocker.

## 11. Overall Verdict

MOSTLY FIXED / SECONDARY ISSUE REMAINS

## 12. Recommendation

Proceed to the next UX/workflow step.

Reason:

- the primary live runtime blocker is fixed
- the deployed generate path is alive again
- session conflict behavior is now acceptable for MVP

Keep the secondary review/data validation issue visible for the tested page and do not treat review success on that page as already verified.
