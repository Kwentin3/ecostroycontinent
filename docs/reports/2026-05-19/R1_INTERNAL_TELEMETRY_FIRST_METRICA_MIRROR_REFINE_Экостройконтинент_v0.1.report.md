# R1 Internal Telemetry First / Metrica Mirror Refine Report

Дата: 2026-05-19
Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Тип работ: documentation / architecture refine only

## Executive Verdict

R1 documents refined to the new strategic position:

- internal first-party telemetry is the operational source of truth for public user actions;
- Yandex Metrica is an optional external mirror/enrichment layer;
- R1 should strengthen and prove internal operational telemetry first;
- Metrica `reachGoal` mirror remains useful, but best-effort and secondary.

No code, runtime, UI, env, migrations, scheduled imports or LLM work was performed.

## Documents Checked

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

## Documents Changed

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

## Strategic Position Change

Old reading risk:

- R1 could be interpreted as “turn on Metrica first, then import it back to power the dashboard.”

Refined position:

- user action -> `/api/telemetry/events` -> internal telemetry storage -> future internal aggregates/read model -> SEO Dashboard operational decisions;
- optional external mirror: user action -> approved Metrica `reachGoal` mirror -> Yandex Metrica -> external analytics/reconciliation/future Yandex ecosystem.

Metrica imports remain future external aggregate enrichment. They are not the path that makes internal telemetry operational.

## Key Formulation Fixes

- Roadmap Finish 2 renamed from `Public Measurement Live` to `Public Operational Measurement Live`.
- R1 semantic name changed in text to `Public Telemetry Operational Measurement + Optional Metrica Goal Mirror`.
- File names were not renamed to avoid breaking existing links.
- R1 scope now says internal telemetry remains canonical for operational dashboard decisions.
- PRD problem/product goal now says internal telemetry first, Metrica mirror second.
- Blueprint now explicitly separates:
  - Layer A: internal operational telemetry;
  - Layer B: optional Metrica mirror.
- Blueprint data flow now proves telemetry storage first and optional reachGoal mirror second.
- Do-not-do list now forbids making Metrica operational source of truth.

## Source Of Truth

Operational source of truth:

- internal first-party telemetry through `/api/telemetry/events` and internal telemetry storage.

Why:

- it is first-party;
- it can carry page/entity/revision context;
- it is not blocked by external script/adblock/API limits;
- it can support operational dashboard, recommendation lifecycle and future attribution safety.

## Metrica Role

Yandex Metrica is now documented as:

- optional external mirror;
- external analytics/Yandex ecosystem layer;
- future aggregate enrichment source;
- not the primary operational source for user actions;
- not more authoritative than first-party telemetry for Content Core mapping.

## Remaining Open Questions

- Final privacy/cookie posture before production flag enablement.
- Exact Metrica init options, especially `trackLinks` and `accurateTrackBounce`.
- Final browser-visible tracking eligibility mechanism for admin/internal/test exclusion.
- Exact implementation file allowlist for direct `ym()` calls.
- Exact dedupe id shape and TTL.
- Whether a local diagnostic for `reachGoal` sent/skipped/failed is needed.
- Which later internal aggregate/read-model slice will consume operational telemetry data.

## What Was Not Done

- No runtime changes.
- No code changes.
- No UI changes.
- No Yandex Metrica counter enablement.
- No scheduled imports.
- No env/secrets changes.
- No migrations.
- No LLM work.
- No docs/out deletions.

## Checks

Completed checks:

- `git diff --check` - pass; only line-ending warnings for existing docs were printed.
- Runtime file scope check via git changed-file list - pass; changed/untracked files are under `docs/`.
- Secret scan over touched docs for token/client-secret patterns - pass; no matches.

Tests/build were not run because only documentation was changed.

## Git Status

Branch:

- `main...origin/main`

Working tree after this refine includes documentation changes/untracked documentation artifacts only:

- `docs/AGENT_START_HERE.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/blueprints/`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/`
- `docs/roadmaps/`

Some listed files/directories include earlier documentation work from the same sequence. No runtime/code files were changed by this refine.
