# Agent Start Here

- Do not infer project state from chat history; read repo docs first.
- Current launch-hardening handoff: `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Runtime/project context: `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`.
- SEO Dashboard handoff: `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Current roadmap for SEO Dashboard domain: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`.
- R1 public Metrica enablement is deployed: internal telemetry remains primary; optional Metrica mirror is enabled as an external layer with conservative options. Browser/network mirror proof passed; delayed Yandex Reporting API stats visibility still needs optional recheck.
- R2A Metrica import foundation and R3A Webmaster import foundation are implemented and accepted on canonical runtime. R2A stores minimal daily Metrica traffic/goals in `external_metrica_daily_aggregate`; R3A stores host/indexation/URL sample rows in dedicated `external_webmaster_*` tables. Both update `analytics_source_sync_state`; read model integration remains R4.
- R4 Readiness Audit recommends R4-lite next, not full R4: integrate external source state/readiness into the read model, keep internal telemetry as operational truth, and do not generate recommendations from Metrica zeros or absent Webmaster query rows. R4-lite PRD/Blueprint: `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`, `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`.
- Before touching analytics code, read the SEO PRD, taxonomy, read model contract and LLM context contract.
- Launch-hardening P1s are closed: Next high advisory, DB-backed readiness, launch smoke matrix, runtime commit marker, branch/worktree cleanup, and media delivery `auto`.
- `/about` and `/contacts` are now published on production (verified 2026-05-19) and should be expected as `200`; keep them Content Core sourced and do not add hardcoded fallback content.
- Lead/intake is a separate future epic. Do not treat analytics intent events as lead records.
- Before deploy acceptance, use `APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch`; add `EXPECT_MEDIA_URL` from the Selectel runbook when checking media.
- Keep `docs/out` as a neutral delivery buffer; do not commit buffer drift unless a task explicitly asks for `docs/out` delivery.
