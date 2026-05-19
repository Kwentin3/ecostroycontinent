# R1 Public Metrica Telemetry Bridge PRD / Blueprint Design Report

Дата: 2026-05-19
Проект: Экостройконтинент
Тип задачи: documentation / architecture / planning only
Branch: `main`
Local HEAD: `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`

## Executive verdict

R1 design gate выполнен: создан PRD и Blueprint для `Public Metrica Counter + Telemetry reachGoal Bridge`.

Implementation не начинался. Следующий шаг: review PRD/Blueprint, approve privacy/cookie posture, approve R1 bridge architecture, then implement in a separate task.

Recommended architecture in Blueprint:

- controlled client-side / hybrid telemetry adapter;
- public tracker stays on `/api/telemetry/events`;
- `ym()` is called only from approved centralized browser-side adapter/bootstrap files;
- arbitrary public UI components do not call `ym()`;
- server-side `/api/telemetry/events` remains canonical for telemetry storage/validation;
- pure server-side `ym()` bridge is rejected because `ym()` is a browser JavaScript API for JavaScript event goals.

## Documents created

- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`

## Documents updated

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
  - R1 PRD draft and Blueprint draft linked.
  - R1 status updated to design drafts created / implementation not started.
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
  - Added R1 PRD/Blueprint draft state.
  - Next step changed to review/approve privacy and bridge architecture.
- `docs/AGENT_START_HERE.md`
  - Next step changed to R1 PRD/Blueprint review, not direct implementation.

## Docs and code reviewed

Docs/reports:

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/SEO_DASHBOARD_SERVER_ACCEPTANCE_AND_PUBLIC_ROUTES_Экостройконтинент_v0.1.report.md`

Code read-only:

- `components/public/AnalyticsTracker.js`
- `app/api/telemetry/events/route.js`
- `lib/telemetry/adapters.js`
- `lib/telemetry/events.js`
- `lib/telemetry/validation.js`
- `lib/telemetry/internal-marker.js`
- `app/api/analytics/events/route.js`
- `lib/analytics/read-model.js`
- `components/admin/SeoVisibilityDashboard.js`
- `app/admin/(console)/visibility/page.js`
- `scripts/yandex/*`
- `compose.yaml`
- `.env.example`
- `tests/telemetry-no-direct-adapters.test.js`

Official Yandex references checked:

- Tag initialization: https://yandex.com/support/metrica/en/code/counter-initialize
- `reachGoal`: https://yandex.com/support/metrica/ru/objects/reachgoal
- JavaScript event goal: https://yandex.com/support/metrica/en/general/goal-js-event
- Goal API shape: https://yandex.com/dev/metrika/en/management/openapi/goal/goal

## Architecture options

Option A. Client-side bridge:

- Viable because `ym()` exists in browser.
- Rejected as an unrestricted pattern because it risks arbitrary UI `ym()` calls and boundary drift.

Option B. Server-side bridge:

- Rejected for R1 as primary architecture.
- Reason: JavaScript event goals are sent through browser JavaScript `reachGoal`; server-side code after `/api/telemetry/events` cannot directly call `ym()`.

Option C. Controlled client-side / hybrid telemetry adapter:

- Selected.
- Public tracker remains the single capture surface.
- Mapping and `reachGoal` calls are centralized in approved browser-side adapter/bootstrap files.
- Server telemetry storage remains canonical.
- Tests must forbid direct `ym()` outside approved adapter files and direct tracker calls to `/api/analytics/events`.
- Refinement applied after review: ordinary non-navigation events should call reachGoal only after telemetry `202`; navigation/beacon events may use explicitly scoped fallback.
- Refinement applied after review: implementation needs `client_event_id`/dedupe key with short in-memory TTL.
- Refinement applied after review: recommended internal/admin/test suppression mechanism is server-rendered public-safe `trackingAllowed` config.

## Privacy/cookie decisions still required

Before implementation:

- approve cookie/banner/policy copy posture;
- approve exact counter init options;
- explicitly keep Webvisor/clickmap/session replay/ecommerce disabled or approve them separately;
- approve whether `trackLinks` stays off;
- approve whether `accurateTrackBounce` is acceptable;
- approve browser-visible tracking eligibility design for internal/admin/test suppression.
- approve the `ym()` allowlist files before coding.

Default recommended posture:

- minimal counter;
- approved `reachGoal` events only;
- `webvisor: false`;
- `clickmap: false`;
- `ecommerce: false`;
- `trackLinks: false` until approved;
- no session replay by default.

## Open questions

- Exact Metrica counter init options.
- Whether policy/cookie banner change is required before production enablement.
- Exact tracking eligibility design for internal/admin/test suppression in browser.
- Final `ym()` allowlist filenames if implementation differs from draft examples.
- Whether safe local diagnostics should record reachGoal sent/skipped/failed.
- Whether `email_clicked` should get a future Metrica goal.
- Whether `contact_link_click`, FAQ and form goals need new telemetry events in later slices.

## Why implementation was not done

This task was explicitly documentation / architecture / planning only.

No changes were made to:

- runtime code;
- UI;
- migrations;
- env/secrets;
- Yandex Metrica runtime state;
- scheduled imports;
- LLM;
- lead/intake;
- `docs/out`.

## Verification

Documentation-only checks completed:

- `git diff --check`: pass. Git printed LF/CRLF warnings for existing docs, no whitespace errors.
- Docs-only scope check: pass, changed/untracked files are under `docs/`.
- Secret-pattern scan over created/updated docs: pass, no token/client-secret value patterns found.
- UTF-8 spot check: pass; new PRD/Blueprint/report were rewritten as UTF-8 BOM for Windows safety.

Tests/build are not required because runtime code was not changed.

## Git status at report creation

```text
## main...origin/main
 M docs/AGENT_START_HERE.md
 M docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md
?? docs/blueprints/
?? docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md
?? docs/reports/2026-05-19/
?? docs/roadmaps/
```
