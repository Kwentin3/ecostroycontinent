# Agent Start Here

- Do not infer project state from chat history; read repo docs first.
- Current launch-hardening handoff: `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Runtime/project context: `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`.
- SEO Dashboard handoff: `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Current roadmap for SEO Dashboard domain: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`.
- R1 public Metrica enablement is deployed: internal telemetry remains primary; optional Metrica mirror is enabled as an external layer with conservative options. Browser/network mirror proof passed; delayed Yandex Reporting API stats visibility still needs optional recheck.
- R2A Metrica import foundation and R3A Webmaster import foundation are implemented and accepted on canonical runtime. R2A stores minimal daily Metrica traffic/goals in `external_metrica_daily_aggregate`; R3A stores host/indexation/URL sample rows in dedicated `external_webmaster_*` tables. Both update `analytics_source_sync_state`.
- R4-lite source readiness integration is implemented and accepted on canonical runtime at code commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`. The read model exposes `external_source_readiness` for Metrica/Webmaster, keeps internal telemetry as operational truth, and does not generate recommendations from Metrica zeros or absent Webmaster query rows. Full R4 is not started.
- R3B Webmaster query/page visibility import is implemented and accepted on canonical runtime at code commit `d7d35d7f4df60f57443372e664d37a79b0ceb92f`. It adds server-only dry-run/write commands, uses `query-analytics/list` synchronous fallback after beta capability checks, writes to `external_webmaster_query_visibility_daily` when rows exist, updates `analytics_source_sync_state`, and keeps query data aggregate-only. Accepted period `2026-05-04..2026-05-17` returned a valid zero-row result; beta capability was available but async export was deferred.
- R2B Metrica source/device/region/landing importer is implemented and accepted on canonical runtime at deployed commit `d008b4bb5dc3ebf9d075b83194fba422f42181f3`. It adds server-only dry-run/write commands, bounded source/device/country/landing reports, optional source detail/region safe-skip and landing unmapped diagnostics. Accepted period `2026-05-17..2026-05-19` imported `30` rows, source state `yandex_metrica` is `ok`, unmapped diagnostics `0`, and same-period rerun is idempotent. No scheduler, read model/UI integration or full R4 semantics were added.
- Before touching analytics code, read the SEO PRD, taxonomy, read model contract and LLM context contract.
- Launch-hardening P1s are closed: Next high advisory, DB-backed readiness, launch smoke matrix, runtime commit marker, branch/worktree cleanup, and media delivery `auto`.
- `/about` and `/contacts` are now published on production (verified 2026-05-19) and should be expected as `200`; keep them Content Core sourced and do not add hardcoded fallback content.
- Lead/intake is a separate future epic. Do not treat analytics intent events as lead records.
- Before deploy acceptance, use `APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch`; add `EXPECT_MEDIA_URL` from the Selectel runbook when checking media.
- Keep `docs/out` as a neutral delivery buffer; do not commit buffer drift unless a task explicitly asks for `docs/out` delivery.
