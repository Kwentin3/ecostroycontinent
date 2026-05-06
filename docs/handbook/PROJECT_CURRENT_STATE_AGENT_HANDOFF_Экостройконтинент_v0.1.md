# Project Current State Agent Handoff - Экостройконтинент v0.1

Date: 2026-05-06  
Purpose: fast current-state entrypoint for future agents after the launch-hardening tech debt epic.

This document is intentionally compact. It does not replace PRDs or domain contracts; it tells a new agent what is already closed, what is current production truth, and which old decisions must not be reopened by accident.

## Current Production Truth

- Canonical repo state is `main` / `origin/main`; the branch/worktree cleanup collapsed old delivery branches and temporary worktrees.
- The project runs as a Next.js app behind Traefik with PostgreSQL and S3-compatible media storage.
- Next.js high advisory is closed: committed runtime uses `next@16.2.4`; `npm audit --audit-level=high` passes. Moderate advisories remain a separate backlog, not this closed P1.
- `/api/health` is lightweight liveness.
- `/api/readiness` is the strict production readiness endpoint. It performs DB-backed PostgreSQL connectivity via a safe read-only probe and returns `503` if DB readiness fails.
- `/api/readiness` returns a safe runtime marker: `node`, `version`, `commit`, `buildTime`. It must not expose secrets, connection strings, hostnames, tokens, users, or stack traces.
- The deployed runtime commit is evidence for the app image currently running, not necessarily the latest docs-only repo commit. Always verify it from live `/api/readiness` after deploy.
- Required launch acceptance command is `npm run smoke:launch` through `scripts/smoke-launch-readonly.mjs`.
- Production media launch posture is S3 + CDN-first safe delivery:
  - `MEDIA_STORAGE_MODE=s3`
  - `MEDIA_DELIVERY_MODE=auto`
  - `MEDIA_PUBLIC_BASE_URL` points to the Selectel CDN in server env
  - CDN is the normal successful path when probing succeeds
  - app proxy remains fallback if CDN probing fails
- Stable media smoke evidence currently uses:
  - `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- `/about` and `/contacts` are known owner/content blockers while approved Content Core pages are missing. 404 is honest in this state.

## Closed Tech Debt Items

- Next.js dependency/security hardening: high advisory closed by updating Next.js to `16.2.4`.
- DB-backed readiness: `/api/readiness` added and verified with real PostgreSQL connectivity.
- Launch smoke matrix: read-only script checks runtime, public routes, SEO honesty, admin protection, known content blockers, runtime commit marker, and optional media URL.
- Runtime commit marker: image build injects `APP_COMMIT_SHA`, `APP_VERSION`, and `BUILD_TIME`; readiness exposes only safe marker fields.
- Branch/worktree cleanup: one canonical repo tree on `main`.
- Media delivery launch posture: production switched to `MEDIA_DELIVERY_MODE=auto` with CDN normal path and app proxy fallback.

## Known Blockers

- `/about`: missing owner-approved `Page(type=about)` content. Do not hardcode fallback content.
- `/contacts`: missing confirmed public contact truth and owner-approved `Page(type=contacts)` content. Do not hardcode fallback content.
- Lead/intake: important P1 product/domain epic, but intentionally not implemented in launch-hardening closeout.
- Yandex Metrica public counter and scheduled imports remain separate SEO/analytics follow-up work.
- Moderate dependency advisories remain separate dependency-security backlog.

## Do Not Reopen By Default

- Do not "fix" `/about` or `/contacts` with fallback text, placeholder launch copy, or hardcoded contacts.
- Do not treat `/api/health` as strict readiness. Use `/api/readiness` for DB-backed acceptance.
- Do not remove `runtime.commit` acceptance from deploy/smoke without replacing it with equally strong deployed-image evidence.
- Do not turn contact intent events into leads. Lead records require a dedicated lead/intake domain.
- Do not store raw CDN URLs as editorial media truth.
- Do not switch media to hard `cdn` or back to `app_proxy` without a narrow media delivery decision and smoke evidence.
- Do not resurrect old delivery branches or temporary worktrees unless a concrete rollback plan requires it.
- Do not broaden launch-hardening into Content Core model changes, publish workflow changes, CRM-lite, Yandex rollout, or media refactor.

## Required Checks Before PR

- `git status --short --branch`
- `git diff --check`
- `npm test`
- `npm run build` when JS/routes/config changed
- `npm audit --audit-level=high` when dependencies changed
- Targeted smoke only when the task changes runtime/public acceptance behavior

## Required Checks After Deploy

Use production/stage URL explicitly:

```powershell
$env:APP_BASE_URL = 'https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT = 'true'
$env:EXPECT_MEDIA_URL = 'https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
Remove-Item Env:EXPECT_MEDIA_URL
```

Expected while owner content is missing:

- `/api/health`: 200 lightweight liveness
- `/api/readiness`: 200, `status=ready`, `database.status=ok`, non-null `runtime.commit`
- `/`, `/services`, `/cases`: 200
- `/robots.txt`, `/sitemap.xml`: 200
- `/admin` routes: auth redirect, 401, or 403; never public open or 500
- `/about`, `/contacts`: `known_content_blocker` if `EXPECT_*` remains `known_missing`
- sitemap must not list `/about` or `/contacts` while they resolve to 404
- media URL check passes when `EXPECT_MEDIA_URL` is supplied

## Architecture Boundaries

- Content Core is write-side truth for content entities and published revisions.
- Public Web consumes published read-side data only.
- `Service` owns `/services/[slug]`; `Case` owns `/cases/[slug]`; future `Article` owns `/blog/[slug]`; `Page` owns standalone pages only.
- Admin owns draft/review/publish operations; publish is explicit and revision-based.
- Analytics read model is a consumer DTO for UI/LLM/reports, not raw source truth.
- First-party intent events are behavior signals, not leads.
- AI/LLM is assistive and draft-only: no autonomous publish, no silent source-of-truth mutation, no invented commercial facts.
- Media truth boundary: SQL metadata, S3 binaries, CDN delivery. App proxy is fallback delivery, not source truth.

## Dangerous Files And Areas

- `app/about/page.js`, `app/contacts/page.js`: honest 404 until published Content Core pages exist.
- `app/sitemap.js`: must not list routes that resolve to 404.
- `app/api/readiness/route.js`, `lib/health/readiness.js`: strict secret-free DB-backed readiness.
- `app/api/health/route.js`: lightweight liveness only.
- `scripts/smoke-launch-readonly.mjs`: read-only launch acceptance; no auth or production mutation.
- `lib/media/public-delivery.js`, `app/api/media-public/[entityId]/route.js`, `lib/read-side/public-media-url.js`: media delivery boundary.
- `app/api/analytics/events/route.js`, `lib/analytics/read-model.js`, `lib/analytics/route-resolver.js`: analytics/lead and route-owner boundaries.
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`: production acceptance/runbook truth.
- `.env.example`: variable names only; no production values or secrets.

## Reports To Read

Read these before reopening launch-hardening decisions:

- `docs/reports/2026-05-05/TECH_DEBT_AUDIT_Экостройконтинент_v0.1.report.md` - historical baseline; several P1 items are now closed.
- `docs/reports/2026-05-05/DEPENDENCY_SECURITY_HARDENING_NEXT_DEPLOY_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-05/HEALTH_READINESS_HARDENING_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-05/LAUNCH_SMOKE_MATRIX_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/RUNTIME_COMMIT_MARKER_READINESS_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/BRANCH_WORKTREE_COLLAPSE_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/MEDIA_DELIVERY_LAUNCH_POSTURE_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/TECH_DEBT_EPIC_CLOSEOUT_DOCS_STICKY_COMMENTS_Экостройконтинент_v0.1.report.md`

## Next Epics

- Owner-approved `/about` and `/contacts` content through Content Core/Admin and explicit publish.
- Lead/intake domain as its own product/domain epic.
- Yandex Metrica public counter and scheduled imports after privacy/cookie decision.
- CDN hardening only if `auto` mode shows regressions or the team decides to move to hard CDN mode.
- Remaining moderate dependency advisories.
- Backup restore drill / operational restore evidence.
