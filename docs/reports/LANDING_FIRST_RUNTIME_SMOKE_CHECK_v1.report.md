# LANDING_FIRST_RUNTIME_SMOKE_CHECK_v1

Date: 2026-04-08

## 1. Scope

Narrow live smoke-check of the deployed landing-first workspace after the latest runtime contract alignment.

This smoke covered:

- live auth and admin entry;
- chooser route;
- one concrete page-anchored workspace route;
- one real generate attempt;
- one real review handoff;
- one session continuity check;
- one narrow second-session conflict check.

This did not attempt:

- broad QA;
- visual design review;
- code changes;
- deep concurrency testing.

## 2. Runtime Environment Checked

- Runtime contour: `https://ecostroycontinent.ru`
- Domain resolved during smoke to: `178.72.179.66`
- Health probe: `GET /api/health` returned `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`
- Auth role used for live smoke: `SEO Manager / SEO-специалист`
- Browser evidence: real authenticated browser session on the deployed domain

## 3. Auth / Entry Result

Status: PASS

- Route checked: `/admin/login` and `/admin`
- Evidence observed:
  - login page opened on the live domain with title `Вход в админку`
  - copy was Russian and operator-facing
  - live login succeeded and landed on `/admin`
  - sidebar contained `AI-верстка`
- Interpretation:
  - live admin auth is working
  - the landing-first entry is exposed in the real operator shell

## 4. Chooser Route Result

Status: PASS

- Route checked: `/admin/workspace/landing`
- Evidence observed:
  - chooser loaded successfully
  - heading `Рабочая зона лендинга`
  - operator copy explained that the workspace attaches to an existing source page and does not create a page
  - real page rows were listed with `Открыть AI-верстку`
- Interpretation:
  - the landing-first chooser is alive on the real contour
  - the route is Russian/operator-facing and not obviously broken

## 5. Workspace Route Result

Status: PASS

- Route checked: `/admin/workspace/landing/entity_5537b3a0-c96a-466d-9f3a-d46098d9402c`
- Evidence observed:
  - workspace route resolved for a real `Page` owner
  - header showed `Рабочая зона лендинга · Landing workspace test page`
  - source anchor was explicit: `Страница-источник: entity_5537b3a0-c96a-466d-9f3a-d46098d9402c`
  - source-editor CTA was present: `Открыть редактор страницы`
  - chooser back-link was present: `К выбору лендинга`
- Interpretation:
  - the live screen is page-anchored
  - the owner truth is still visibly `Page`, not another entity type

## 6. Core Screen Shape

Status: PASS

- Route checked: same workspace route
- Evidence observed:
  - page identity and top bar are present
  - left-side surfaces include source context, session/memory state, and recent step
  - center area shows preview and bounded interaction (`Что хотим изменить`, generate/review actions)
  - right-side surfaces include verification report, blockers, and review handoff
- Interpretation:
  - the live screen matches the intended MVP shell shape
  - it reads like a bounded operator workspace, not a page builder or prompt lab

## 7. Generate Path Result

Status: FAIL

- Route / action checked:
  - workspace route for `entity_5537b3a0-c96a-466d-9f3a-d46098d9402c`
  - button: `Сгенерировать заново`
- Evidence observed:
  - no browser crash and no raw `500` page
  - after submit, the workspace returned to the same route with:
    - `?error=new+row+for+relation+"content_revisions"+violates+check+constraint+"content_revisions_ai_source_basis_check"`
  - preview remained coherent and the page stayed usable
- Interpretation:
  - the request fails honestly at runtime, but the core generate path is not healthy
- Likely layer of failure:
  - persistence / content revision save path
  - specifically the DB check constraint `content_revisions_ai_source_basis_check`

### Exact Repro

1. Log into `https://ecostroycontinent.ru/admin/login` as a review-capable operator.
2. Open `/admin/workspace/landing/entity_5537b3a0-c96a-466d-9f3a-d46098d9402c`.
3. Click `Сгенерировать заново`.
4. Observe redirect back to the workspace with:
   - `error=new row for relation "content_revisions" violates check constraint "content_revisions_ai_source_basis_check"`

### Blocking Impact

Yes.

This blocks confidence in the core landing-first operator path because a real generate attempt cannot complete successfully on the deployed contour.

## 8. Review Handoff Result

Status: PASS

- Route / action checked:
  - workspace route for `entity_5537b3a0-c96a-466d-9f3a-d46098d9402c`
  - button: `Передать на проверку`
- Evidence observed:
  - real transition to `/admin/review/rev_dbbdb57a-0b15-4b52-af66-43f3ea61f654?message=Отправлено+на+проверку.`
  - review page loaded with heading `Проверка и согласование`
  - explicit review message appeared: `Отправлено на проверку.`
- Interpretation:
  - review handoff is alive
  - handoff remains explicit and human-controlled
  - no silent publish occurred

## 9. Session Continuity Result

Status: PASS

- Route / action checked:
  - reopen the same workspace route after review handoff
- Evidence observed:
  - reopening `/admin/workspace/landing/entity_5537b3a0-c96a-466d-9f3a-d46098d9402c` kept session-backed state
  - the page still showed the same session id
  - workspace state reflected review continuity:
    - `Статус последней версии: На проверке`
    - `Проверка: На проверке`
    - `Открыть проверку` link was present
- Interpretation:
  - basic happy-path session continuity is alive
  - the workspace does not obviously lose state on reopen

## 10. Session Conflict Result

Status: FAIL

- Route / action checked:
  - second independent browser context
  - same operator role
  - same `pageId`
  - live tests on `entity_5537b3a0-c96a-466d-9f3a-d46098d9402c` and `entity_2bb9ffa1-94b9-464f-a003-5fc17471d303`
- Evidence observed:
  - second session could open the same workspace route without an explicit active-session conflict message
  - second session did not show the expected guard text:
    - `Another active landing workspace session is already anchored to this page.`
  - on `entity_2bb9ffa1-94b9-464f-a003-5fc17471d303`, second-session generate did not block on session conflict
  - instead it proceeded and failed later with the same persistence constraint symptom:
    - `content_revisions_ai_source_basis_check`
- Interpretation:
  - the active-session guard was not observably enforcing an honest block/resume/conflict path in this live smoke
- Likely layer of failure:
  - session uniqueness / active-session guard behavior on the live runtime

### Exact Repro

1. In session A, log in and open `/admin/workspace/landing/entity_2bb9ffa1-94b9-464f-a003-5fc17471d303`.
2. In a separate browser context, log in again as a separate session.
3. Open the same workspace route in session B.
4. Observe that no explicit conflict/resume block appears.
5. Click `Сгенерировать заново` in session B.
6. Observe that the request proceeds past the expected conflict seam and fails later on:
   - `content_revisions_ai_source_basis_check`

### Blocking Impact

This is not the primary blocker for the next step, but it is a real live gap relative to the intended one-active-session-per-pageId behavior.

## 11. What Is Confirmed Alive

- deployed domain and health endpoint
- live admin auth
- admin shell entry for `AI-верстка`
- chooser route
- page-anchored workspace route
- source editor CTA and back-link
- bounded MVP workspace screen shape
- explicit review handoff path
- basic session continuity on reopen

## 12. What Is Still Unverified

- successful end-to-end candidate generation on the deployed contour
- whether the active-session guard is working for any live route/state combination outside this smoke
- broader multi-user or multi-tab contention behavior

## 13. Overall Verdict

BLOCKED BY RUNTIME ISSUE

## 14. Recommendation

Stop for fix before moving to the next UX/workflow step.

Reason:

- the core live generate path is failing on a real persistence constraint
- the active-session guard did not surface honest conflict behavior in the tested second-session path
