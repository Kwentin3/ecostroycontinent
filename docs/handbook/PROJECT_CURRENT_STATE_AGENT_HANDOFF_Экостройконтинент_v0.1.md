# Project Current State Agent Handoff - Экостройконтинент v0.1

Date: 2026-06-03
Purpose: fast current-state entrypoint for future agents after the launch-hardening tech debt epic.

This document is intentionally compact. It does not replace PRDs or domain contracts; it tells a new agent what is already closed, what is current production truth, and which old decisions must not be reopened by accident.

## Current Production Truth

- Do not infer deployed truth from branch name alone. Verify the running SHA from live `/api/readiness` and the GitHub Actions deploy run; recent delivery has used `feat/minimal-seo-admin-panel` with pinned GHCR image digests.
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
  - published public markup resolves media `previewUrl` directly to the Selectel CDN when a storage key and CDN base URL are available
  - `/api/media-public/:entityId` remains a fallback/handoff route; it can redirect to CDN or stream from storage, but public HTML should not require that app hop in CDN-capable modes
- Stable media smoke evidence currently uses:
  - `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- `/about` and `/contacts` are published on production as of 2026-05-19. They are no longer owner/content blockers; both should resolve to `200` and be present in sitemap.

## Closed Tech Debt Items

- Next.js dependency/security hardening: high advisory closed by updating Next.js to `16.2.4`.
- DB-backed readiness: `/api/readiness` added and verified with real PostgreSQL connectivity.
- Launch smoke matrix: read-only script checks runtime, public routes, SEO honesty, admin protection, known content blockers, runtime commit marker, and optional media URL.
- Runtime commit marker: image build injects `APP_COMMIT_SHA`, `APP_VERSION`, and `BUILD_TIME`; readiness exposes only safe marker fields.
- Branch/worktree cleanup: one canonical repo tree; verify the active branch and deploy SHA before delivery.
- Media delivery launch posture: production runs `MEDIA_DELIVERY_MODE=auto`; public read-side markup uses direct CDN URLs, while app routes remain fallback/handoff delivery boundaries.

## Known Blockers

- `/about`: published Content Core `Page(type=about)` exists. Keep the route Content Core sourced; do not hardcode fallback content.
- `/contacts`: published Content Core `Page(type=contacts)` exists and contact truth is confirmed. Keep the route Content Core sourced; do not hardcode fallback content.
- Lead/intake: important P1 product/domain epic, but intentionally not implemented in launch-hardening closeout.
- Yandex Metrica public counter and scheduled imports remain separate SEO/analytics follow-up work.
- Moderate dependency advisories remain separate dependency-security backlog.

## Do Not Reopen By Default

- Do not "fix" `/about` or `/contacts` with fallback text, placeholder launch copy, or hardcoded contacts.
- Do not treat `/api/health` as strict readiness. Use `/api/readiness` for DB-backed acceptance.
- Do not remove `runtime.commit` acceptance from deploy/smoke without replacing it with equally strong deployed-image evidence.
- Do not turn contact intent events into leads. Lead records require a dedicated lead/intake domain.
- Do not store raw CDN URLs as editorial media truth. CDN URLs may appear in rendered public HTML as delivery outputs only.
- Do not switch media to hard `cdn` or back to `app_proxy` without a narrow media delivery decision, browser/resource evidence, and a fallback plan.
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
$env:EXPECT_ABOUT = 'published'
$env:EXPECT_CONTACTS = 'published'
$env:EXPECT_MEDIA_URL = 'https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
Remove-Item Env:APP_BASE_URL
Remove-Item Env:EXPECT_RUNTIME_COMMIT
Remove-Item Env:EXPECT_ABOUT
Remove-Item Env:EXPECT_CONTACTS
Remove-Item Env:EXPECT_MEDIA_URL
```

Expected current production state:

- `/api/health`: 200 lightweight liveness
- `/api/readiness`: 200, `status=ready`, `database.status=ok`, non-null `runtime.commit`
- `/`, `/services`, `/cases`: 200
- `/robots.txt`, `/sitemap.xml`: 200
- `/admin` routes: auth redirect, 401, or 403; never public open or 500
- `/about`, `/contacts`: `passed` with `EXPECT_ABOUT=published` and `EXPECT_CONTACTS=published`
- sitemap must list `/about` and `/contacts` while both resolve to 200
- media URL check passes when `EXPECT_MEDIA_URL` is supplied

## Architecture Boundaries

- Content Core is write-side truth for content entities and published revisions.
- Public Web consumes published read-side data only.
- `Service` owns `/services/[slug]`; `Case` owns `/cases/[slug]`; future `Article` owns `/blog/[slug]`; `Page` owns standalone pages only.
- Admin owns draft/review/publish operations; publish is explicit and revision-based.
- Analytics read model is a consumer DTO for UI/LLM/reports, not raw source truth.
- First-party intent events are behavior signals, not leads.
- AI/LLM is assistive and draft-only: no autonomous publish, no silent source-of-truth mutation, no invented commercial facts.
- Media truth boundary: SQL metadata, S3 binaries, CDN delivery. Public read-side may render CDN URLs as delivery outputs; app proxy is fallback delivery, not source truth.

## Dangerous Files And Areas

- `app/about/page.js`, `app/contacts/page.js`: Content Core sourced; still honest 404 if published pages are ever removed.
- `app/sitemap.js`: lists `/about` and `/contacts` only while published projections exist.
- `app/api/readiness/route.js`, `lib/health/readiness.js`: strict secret-free DB-backed readiness.
- `app/api/health/route.js`: lightweight liveness only.
- `scripts/smoke-launch-readonly.mjs`: read-only launch acceptance; no auth or production mutation.
- `lib/media/public-delivery.js`, `app/api/media-public/[entityId]/route.js`, `lib/read-side/public-media-url.js`: media delivery boundary. Keep CDN-vs-app route decisions centralized here, not in JSX renderers.
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

- Keep `/about` and `/contacts` production state monitored as published Content Core pages; do not replace with fallback content.
- Lead/intake domain as its own product/domain epic.
- Yandex Metrica public counter and scheduled imports after privacy/cookie decision.
- CDN hardening now means object metadata/browser cache and derivative sizes (`thumb/card/gallery/hero`) unless direct-CDN rendering regresses.
- Remaining moderate dependency advisories.
- Backup restore drill / operational restore evidence.
