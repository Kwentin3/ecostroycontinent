# Agent Start Here

- Do not infer project state from chat history; read repo docs first.
- Current launch-hardening handoff: `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Runtime/project context: `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`.
- SEO Dashboard handoff: `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Before touching analytics code, read the SEO PRD, taxonomy, read model contract and LLM context contract.
- Launch-hardening P1s are closed: Next high advisory, DB-backed readiness, launch smoke matrix, runtime commit marker, branch/worktree cleanup, and media delivery `auto`.
- `/about` and `/contacts` are owner/content blockers; do not add hardcoded fallback content. The fix is approved Content Core pages plus explicit publish.
- Lead/intake is a separate future epic. Do not treat analytics intent events as lead records.
- Before deploy acceptance, use `APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true npm run smoke:launch`; add `EXPECT_MEDIA_URL` from the Selectel runbook when checking media.
- Keep `docs/out` as a neutral delivery buffer; do not commit buffer drift unless a task explicitly asks for `docs/out` delivery.
