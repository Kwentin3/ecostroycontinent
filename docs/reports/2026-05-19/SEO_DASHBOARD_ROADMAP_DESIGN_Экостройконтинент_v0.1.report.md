# SEO Dashboard / Visibility / Analytics Foundation Roadmap Design Report

Дата: 2026-05-19
Проект: Экостройконтинент
Тип задачи: documentation / planning only
Branch: `main`
Local HEAD: `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`

## Executive verdict

Создан рабочий roadmap-документ для домена SEO Dashboard / Visibility / Analytics Foundation:

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`

Roadmap опирается на текущий factual baseline от 2026-05-19, а не на старые 2026-05-04 blockers. Главный вывод сохранен: ближайший безопасный implementation slice - `R1. Public Metrica Counter + Telemetry reachGoal Bridge`.

Ключевая архитектурная позиция roadmap:

- public tracker остается клиентом `/api/telemetry/events`;
- direct public tracker -> `/api/analytics/events` не возвращать;
- direct `ym()` из произвольных UI components не добавлять;
- external analytics bridge размещать на telemetry adapter layer;
- scheduled imports делать после public counter/goal smoke;
- UX/UI refine делать после появления live data;
- LLM откладывать до safety gate;
- lead/intake держать отдельным соседним доменом.

## Документы изучены

Product/contract docs:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`

Current state / handoff docs:

- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

Reports:

- `docs/reports/2026-05-04/SEO_DASHBOARD_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/SEO_DASHBOARD_POST_IMPLEMENTATION_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/SEO_DASHBOARD_SERVER_ACCEPTANCE_AND_PUBLIC_ROUTES_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_OAUTH_SERVER_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`

Code areas checked read-only for boundary facts:

- `components/public/AnalyticsTracker.js`
- `app/api/telemetry/events/route.js`
- `lib/telemetry/adapters.js`
- `lib/telemetry/events.js`
- `lib/telemetry/journey.js`
- `tests/telemetry-no-direct-adapters.test.js`
- `app/api/analytics/events/route.js`
- `app/api/admin/visibility/read-model/route.js`
- `app/admin/(console)/visibility/page.js`
- `components/admin/SeoVisibilityDashboard.js`
- `lib/analytics/read-model.js`
- `db/migrations/008_seo_visibility_analytics.sql`
- `db/migrations/009_contact_intent_telemetry.sql`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/sitemap.js`
- `app/robots.js`
- `lib/read-side/public-content.js`

## Roadmap created

Created:

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`

Roadmap contents:

- purpose and scope;
- current state summary;
- finish levels `Finish 1` through `Finish 7`;
- phases `R0` through `R8`;
- dependency graph;
- decision points;
- domain boundaries;
- do-not-do list;
- current next slice recommendation;
- roadmap status table;
- artifact pointers.

## Фазы roadmap

| Phase | Status | Intent |
| --- | --- | --- |
| R0. Current State Baseline | Done | Preserve factual state and stop stale-memory work. |
| R1. Public Metrica Counter + Telemetry reachGoal Bridge | Next | Start real public measurement without breaking telemetry boundary. |
| R2. Metrica Import Foundation | Later, after R1 | Import aggregated Metrica data into project storage. |
| R3. Webmaster Import Foundation | Later, after R1 | Import verified Webmaster visibility/indexation data. |
| R4. Read Model With Real External Aggregates | After R2/R3 | Make read model consume imported external aggregates. |
| R5. Operational Recommendations Refinement | After R4 | Tune deterministic recommendations against real data. |
| R6. UX/UI Product Refinement | Later | Refine `/admin/visibility` after live workflow is known. |
| R7. LLM Copilot Safety Gate and First UI | Future | Enable advisory LLM only after read model, evals and safety posture. |
| R8. Lead / Intake Attribution | Adjacent domain | Design lead records and attribution separately from contact intent. |

Dependency graph:

```text
R0 -> R1 -> R2/R3 -> R4 -> R5 -> R6 -> R7
R8 lead/intake runs separately and should not block R1-R6 unless lead conversion is required.
```

## Recommended next slice

Recommended implementation slice:

```text
R1. Public Metrica Counter + Telemetry reachGoal Bridge
```

Why:

- Metrica counter and 11 goals are ready;
- Webmaster is verified;
- public telemetry already stores behavior/contact intent;
- public Metrica script is still disabled;
- `reachGoal` bridge is absent;
- scheduled imports before live public signals would be empty or weak.

## Decisions needed before R1

Required before implementation:

- privacy/cookie posture for public Yandex Metrica counter;
- exact Metrica counter init options;
- explicit decision to keep Webvisor/clickmap/session replay off unless separately approved;
- exact allowed telemetry events for `reachGoal`;
- mapping from current telemetry event names to existing 11 Metrica goal names;
- double-counting policy for contact actions vs generic CTA/contact-link goals;
- live smoke method and expected Metrica propagation delay.

Critical R1 boundary:

- Do not call `ym()` directly from arbitrary public components.
- Do not rewire public tracker to `/api/analytics/events`.
- Do not expose OAuth tokens, client secret or server env values in browser.
- Do not treat contact intent events as leads.

## Documents updated

Updated:

- `docs/AGENT_START_HERE.md`
  - Added roadmap pointer.
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
  - Added roadmap pointer in the opening section and primary pointers.

Existing modified docs from the immediately preceding current-state audit remain in the working tree and were not reverted.

## What was not implemented

No runtime or product implementation was done.

Not changed:

- application code;
- migrations;
- runtime env;
- secrets;
- Yandex counter state;
- scheduled imports;
- UI/UX;
- LLM;
- lead/intake;
- `docs/out`.

## Verification

Documentation-only verification completed:

- `git diff --check`: pass. Git printed LF/CRLF warnings for existing docs, no whitespace errors.
- Trailing-whitespace scan on the new roadmap/report files: pass.
- Code/runtime diff scope check: pass, changed/untracked paths are under `docs/`.
- Secret-pattern scan over new/updated roadmap/report docs: pass, no token/client-secret value patterns found.
- UTF-8 spot check: pass; new roadmap/report files read correctly as UTF-8 and were written with UTF-8 BOM for Windows safety.

No tests/build were run because runtime code was not changed.

## Security notes

- No token/client secret values were added.
- Roadmap references env variable names only.
- Roadmap explicitly forbids sending OAuth tokens/client secret to browser, UI, read model, reports or LLM.

## Git status at report creation

```text
## main...origin/main
 M docs/AGENT_START_HERE.md
 M docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md
 M docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md
?? docs/reports/2026-05-19/
?? docs/roadmaps/
```
