# R1 Public Metrica Telemetry Bridge PRD / Blueprint Refinement Report

Дата: 2026-05-19
Проект: Экостройконтинент
Тип задачи: documentation-only design refinement
Branch: `main`
Local HEAD: `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`

## Executive verdict

Замечания перед реализацией внесены в R1 PRD и Blueprint. R1 remains design-only; implementation still not started.

Ключевое уточнение: для обычных non-navigation events reachGoal должен ждать успешный `202` от `/api/telemetry/events`. Для navigation/beacon scenarios допускается только explicitly scoped fallback after local eligibility + dedupe.

## Documents changed

- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R1_PUBLIC_METRICA_TELEMETRY_BRIDGE_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`

## Refinements made

POST ordering:

- Ordinary non-navigation events: telemetry POST first; reachGoal only after successful `202`.
- Navigation/beacon events: controlled fallback allowed only if explicitly scoped and tested.

Dedupe:

- Added client-side dedupe requirement.
- Preferred shape: `client_event_id = crypto.randomUUID()` and dedupe key `${client_event_id}:${goalName}`.
- Short in-memory TTL, for example 5-10 seconds.

Tracking eligibility:

- Chosen recommended mechanism: server-rendered public-safe `trackingAllowed` config passed to public tracker.
- `trackingAllowed=false` must hard-disable Metrica bridge.
- Browser code must not depend on reading the existing httpOnly internal traffic cookie.

Privacy/cookie gate:

- Production Metrica flag must not be enabled until privacy/cookie posture and any required policy/banner copy are approved.

`ym()` allowlist:

- Added explicit allowlist concept.
- Draft allowlist examples:
  - `components/public/MetricaCounter.js`
  - `components/public/telemetry-metrica-adapter.js`
- Tests must forbid `ym(` outside approved bootstrap/adapter files.

Counter options:

- `trackLinks` and `accurateTrackBounce` are explicit product/privacy decisions.
- `accurateTrackBounce: true` remains a candidate, not an approved setting.

Live smoke:

- Added staged smoke:
  - Stage 1: telemetry storage plus controlled browser-level `ym(..., "reachGoal", ...)` proof.
  - Stage 2: delayed Metrica goal verification.
- Missing immediate Metrica UI visibility is not an automatic failure if Stage 1 passes and delayed verification is scheduled.

## What was not implemented

No runtime/code implementation was done.

Not changed:

- application code;
- UI;
- runtime env;
- secrets;
- Metrica production flag;
- scheduled imports;
- migrations;
- LLM;
- lead/intake;
- `docs/out`.

## Verification

Documentation-only checks completed:

- `git diff --check`: pass. Git printed LF/CRLF warnings for existing docs, no whitespace errors.
- Docs-only scope check: pass, changed/untracked files are under `docs/`.
- Secret-pattern scan: pass, no token/client-secret value patterns found.
- UTF-8 spot check: pass; this report was rewritten as UTF-8 BOM for Windows safety.

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
