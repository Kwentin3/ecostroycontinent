# SEO Dashboard Roadmap Refinement Report

Дата: 2026-05-19
Проект: Экостройконтинент
Тип задачи: documentation-only roadmap refinement
Branch: `main`
Local HEAD: `4bdf44d11f32e4a9971dd8d874ab17448eed69e7`

## Executive verdict

Roadmap сохранен как основной управляющий артефакт, но усилен governance-gate перед реализацией новых доменных slice.

Главное изменение: ближайшее действие теперь не direct R1 implementation. Правильный следующий шаг:

1. Подготовить `PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`.
2. Подготовить `BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`.
3. Review privacy/cookie posture and technical bridge design.
4. Только после этого переходить к implementation.

## Documents changed

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`

## Refinements made

Roadmap governance:

- Added the required delivery flow:

```text
Roadmap
-> Domain slice
-> PRD
-> Blueprint
-> Implementation
-> Server acceptance
-> Conformity audit
-> Docs / sticky comments / closure
-> Next domain
```

- Added the rule that a new implementation domain must not start without at least a short PRD and technical Blueprint.
- Added domain isolation rules: implementation must stay inside reviewed PRD/Blueprint scope; adjacent domains become handoff/future slices.
- Added acceptance/conformity/closure expectations for every domain.

R1 gate:

- Added explicit requirement to create/review:
  - `PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
  - `BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- Clarified that R1 cannot be implemented directly from roadmap notes.

R1 technical design questions:

- Added a Blueprint question block for client-side, server-side or hybrid bridge design.
- Explicitly noted that `ym()` is a browser function and cannot be directly called from a server-side adapter after `/api/telemetry/events`.
- Required the Blueprint to decide how to preserve telemetry boundary, avoid arbitrary UI `ym()` calls, prevent duplicate goals, handle internal/test/admin events, implement env-off mode and verify disabled-Metrica behavior.
- Clarified that the roadmap does not choose the final R1 technical scheme.

Privacy/cookie gate:

- Made privacy/cookie posture approved a prerequisite before R1 implementation.
- Added required decisions for Metrica init options, policy/banner requirement, Webvisor/clickmap/session replay posture and allowed telemetry-to-goal mapping.
- Added default R1 posture: minimal counter plus approved reachGoal events; no automatic Webvisor, clickmap or ecommerce.
- Clarified that semantic telemetry already exists, so visual clickmap/session replay is not required for MVP.

Next-step wording:

- Updated `Current Next Slice Recommendation` to say R1 remains the next domain slice, but the immediate next action is R1 PRD + Blueprint.
- Updated Roadmap Status Table so R1 output artifact is `R1 PRD; R1 Blueprint; then implementation report and updated handoff`.
- Updated `AGENT_START_HERE` and SEO handoff so they do not imply direct R1 implementation.

## Mandatory gates before R1 implementation

- R1 PRD reviewed.
- R1 Blueprint reviewed.
- Privacy/cookie posture approved.
- Metrica init options approved.
- Webvisor/clickmap/session replay explicitly approved or disabled.
- Policy copy/banner requirement decided.
- Allowed telemetry-to-goal mapping approved.
- Technical bridge design chosen and justified in Blueprint.

## What was not implemented

No implementation was done.

Not changed:

- application/runtime code;
- migrations;
- runtime env;
- secrets;
- UI;
- Yandex Metrica state;
- scheduled imports;
- LLM;
- lead/intake;
- `docs/out`.

## Verification

Documentation-only checks completed:

- `git diff --check`: pass. Git printed LF/CRLF warnings for existing docs, no whitespace errors.
- Runtime/code diff scope check: pass, changed/untracked files are under `docs/`.
- Secret-pattern scan over updated docs: pass, no token/client-secret value patterns found.
- UTF-8 spot check: pass. Roadmap is UTF-8 BOM; this report was rewritten as UTF-8 BOM for Windows safety.

Tests/build are not required because only documentation changed.

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
