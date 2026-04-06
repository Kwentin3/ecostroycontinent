# AI_WORKSPACE_UI_PRESENCE_AUDIT_v1

## 1. Audit scope
Reality check for the actual UI presence, reachability, and rollout status of the AI-assisted service landing workspace.

This audit compares:
- the stated UX expectation: sidebar entry -> dedicated workspace screen -> chat-like LLM interaction + landing assembly + preview;
- the code that actually exists;
- the live admin/runtime behavior I could verify from this session.

Evidence is separated into:
- `code-verified`
- `runtime-verified`
- `report-asserted only`

## 2. Expected UX baseline
The expected UX was explicitly:
- a left sidebar button / screen entry for AI-assisted landing workspace;
- a dedicated screen when that entry is opened;
- chat-like interaction with the LLM;
- landing assembly / layout generation workflow;
- a visible preview area;
- the feature visible/reachable in the deployed UI.

## 3. What exists in code

### Overall verdict for code reality
**IMPLEMENTED DIFFERENTLY**

The code does not implement a dedicated AI workspace screen or sidebar entry. It implements an embedded service-editor workspace panel on the right rail of the service editor surface.

| Area | Verdict | Evidence | Notes |
|---|---|---|---|
| Left sidebar AI workspace entry | NOT IMPLEMENTED | `components/admin/AdminShell.js:9-25` | The sidebar nav contains Home, Review, Settings, Media, Services, Cases, Pages, Users, and LLM diagnostics for superadmin. No AI workspace entry exists. |
| Dedicated AI workspace route/page | NOT IMPLEMENTED | repo-wide route search; `rg --files app/admin components/admin lib \| rg "workspace|ai-workspace|memory-card|landing-factory"` | No `app/admin/...workspace...` page or route was found. Only `lib/ai-workspace/*.js` modules exist. |
| Embedded service-editor workspace panel | FULLY PRESENT | `components/admin/ServiceLandingWorkspacePanel.js:14-105`, `components/admin/EntityEditorForm.js:560-572` | The implemented surface is a Memory Card panel in the editor right rail, not a dedicated workspace screen. |
| Service-only editor wiring for Memory Card | FULLY PRESENT | `lib/admin/entity-ui.js:54-88`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js:63-95`, `app/admin/(console)/entities/[entityType]/new/page.js:61-88` | The service editor loads `workspaceMemoryCard` only for service entities and passes it into `EntityEditorForm`. |
| Review / preview surface | PARTIALLY PRESENT | `app/admin/(console)/review/[revisionId]/page.js:124-180` | The preview exists on the review page, not inside a dedicated AI workspace screen. |
| Chat-like interaction UI | NOT IMPLEMENTED | `components/admin/ServiceLandingWorkspacePanel.js:14-105`, `components/admin/EntityEditorForm.js:511` | The UI offers a generate button and state panels, but not a chat thread or conversational workspace. |

### What the panel actually is
`ServiceLandingWorkspacePanel` is a state summary panel:
- session identity;
- editorial intent;
- proof selection;
- artifact state;
- trace;
- decisions;
- recent turn;
- derived slice summary.

It is not a chat UI and not a separate screen.

## 4. What is reachable in UI

### Code-verified reachability
- The workspace panel is reachable from the normal service editor flow on `/admin/entities/service/[entityId]` and `/admin/entities/service/new`.
- The review page is reachable on `/admin/review/[revisionId]` and includes preview plus the factory panel.
- There is no sidebar route entry for AI workspace, so normal navigation does not surface it as a first-class destination.

### Runtime-verified reachability
- `GET https://ecostroycontinent.ru/admin` returned `307` to `/admin/login`.
- `GET https://ecostroycontinent.ru/admin/entities/service` returned `307` to `/admin/login`.
- `GET https://ecostroycontinent.ru/admin/entities/service/new` returned `307` to `/admin/login`.
- `GET https://ecostroycontinent.ru/admin/login` returned `200` and served the login page.

### Verdicts
| Area | Verdict | Why |
|---|---|---|
| Reachable from normal operator service-editor flow | PARTIALLY PRESENT | The code path exists, but I did not complete an authenticated browser session in this audit. |
| Reachable from left sidebar | NOT IMPLEMENTED | No nav item exists in `AdminShell`. |
| Reachable as a dedicated AI workspace screen | NOT IMPLEMENTED | No such route/page exists. |
| Reachable on live admin without auth | NOT REACHABLE | Live admin routes redirect to login. |

## 5. What is deployed/live

### Runtime status
The admin application is deployed and responding on the public domain, but the admin area is auth-gated.

Observed live behavior:
- admin routes redirect to `/admin/login`;
- the login page exists and is served successfully;
- I did not verify the post-login service editor surface in this session.

### What this means
The missing UI is not explained by a dead deployment:
- the site is live;
- the admin shell exists;
- the expected AI workspace is simply not exposed as a dedicated screen or sidebar item in code.

## 6. Gap between expectation and reality

### Product expectation
- left sidebar AI workspace entry;
- dedicated workspace screen;
- chat-like LLM interaction;
- landing assembly workflow;
- visible preview area;
- easy reachability in deployed UI.

### Code reality
- service editor right-rail panel only;
- generate button in the service editor;
- preview lives on the review page;
- no dedicated workspace route;
- no sidebar entry.

### Deployed reality
- admin routes are live;
- unauthenticated access redirects to login;
- authenticated visibility of the panel was not independently verified in this session.

## 7. Root cause of missing visibility
The missing visibility is caused by a wiring mismatch, not by a failed deploy.

Concrete root causes:
- `AdminShell` never received an AI workspace nav item (`components/admin/AdminShell.js:9-25`);
- no dedicated workspace route/page was created under `app/admin`;
- the implemented UI was embedded into the service editor right rail instead of being introduced as a standalone screen;
- the preview was placed on the review page rather than inside the workspace screen;
- no feature flag or hidden route mechanism was found in the inspected code.

## 8. Overall verdict
**IMPLEMENTED DIFFERENTLY**

The AI workspace exists in code, but it exists as an embedded service-editor panel plus review-page preview, not as the user expected dedicated AI workspace screen with sidebar entry.

Live/admin visibility is **NOT VERIFIED** in an authenticated browser session for this audit, but the code gap alone already explains why the expected UX is absent.

## 9. Smallest correct next step
If the original UX expectation still stands, the smallest correct next step is:

1. add a dedicated AI workspace route/page and sidebar entry, or
2. explicitly rebaseline product expectations to the current embedded service-editor panel v1.

From the current code reality, the dedicated route + sidebar entry is the minimal missing piece.

## 10. Source classification summary

| Source class | What I used |
|---|---|
| Code-verified | `components/admin/AdminShell.js`, `components/admin/EntityEditorForm.js`, `components/admin/ServiceLandingWorkspacePanel.js`, `lib/admin/entity-ui.js`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js`, `app/admin/(console)/review/[revisionId]/page.js` |
| Runtime-verified | `curl.exe -k -I https://ecostroycontinent.ru/admin`, `curl.exe -k -I https://ecostroycontinent.ru/admin/entities/service`, `curl.exe -k -I https://ecostroycontinent.ru/admin/entities/service/new`, `curl.exe -k -I https://ecostroycontinent.ru/admin/login`, `curl.exe -k -L https://ecostroycontinent.ru/admin/login` |
| Report-asserted only | Prior AI workspace execution/conformance reports that claimed live browser verification of the panel |
