# TECH_DEBT_EPIC_CLOSEOUT_DOCS_STICKY_COMMENTS v0.1

Date: 2026-05-06  
Project: Экостройконтинент  
Scope: documentation and sticky-comment closeout after launch-hardening tech debt epic

## Executive Verdict

`TECH_DEBT_EPIC_HANDOFF_HARDENED`

The launch-hardening epic is now easier for the next agent to enter without reopening closed architecture decisions. A compact current-state handoff was added, stale entrypoint/runbook/env notes were corrected, and short sticky comments were placed only near code boundaries where accidental drift is likely.

No product behavior, Content Core model, publish workflow, lead domain, media mode, readiness behavior, dependency version, migration, secret, or production data was changed.

## Baseline

- `git status --short --branch`: `## main...origin/main`
- `git branch --show-current`: `main`
- `git rev-parse --short HEAD`: `152336c`
- Canonical worktree: one repo worktree on `main`

Reports reviewed:

- `docs/reports/2026-05-05/TECH_DEBT_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-05/DEPENDENCY_SECURITY_HARDENING_NEXT_DEPLOY_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-05/HEALTH_READINESS_HARDENING_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-05/LAUNCH_SMOKE_MATRIX_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/RUNTIME_COMMIT_MARKER_READINESS_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/BRANCH_WORKTREE_COLLAPSE_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-06/MEDIA_DELIVERY_LAUNCH_POSTURE_Экостройконтинент_v0.1.report.md`

## Documents Updated

- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
  - New compact handoff for future agents.
  - Covers current production truth, closed P1 items, known blockers, do-not-reopen guidance, required checks, architecture boundaries, media/readiness/smoke truth, dangerous files, reports, and next epics.
- `docs/AGENT_START_HERE.md`
  - Points first to the new handoff.
  - States closed launch-hardening P1s and the required `smoke:launch` posture.
  - Warns against `/about`/`/contacts` fallback content and analytics intent-to-lead drift.
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
  - Corrected stale media posture from `app_proxy until stable` to `MEDIA_DELIVERY_MODE=auto` with CDN normal path and app proxy fallback.
- `.env.example`
  - Added safe commented runtime marker variable names.
  - Added media comments explaining local `app_proxy` default vs production S3 + `auto` posture without committing production values.
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
  - Cross-linked the new launch-hardening handoff.
  - Clarified that lead/intake remains a separate epic and intent events are not lead records.
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
  - Added current-state note: `/about` and `/contacts` are canonical route goals but remain 404 until owner-approved Content Core pages are published.
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
  - Added current-state note to prevent treating future PRD scope as current launch-hardening scope.

## Sticky Comments Added

- `/about` and `/contacts`
  - `app/about/page.js`
  - `app/contacts/page.js`
  - Purpose: preserve honest 404 until owner-approved `Page(type=about|contacts)` exists and is explicitly published; no hardcoded fallback content.
- Sitemap
  - `app/sitemap.js`
  - Purpose: sitemap must stay honest and not list `/about` or `/contacts` while they resolve to 404.
- Readiness and health
  - `app/api/readiness/route.js`
  - `lib/health/readiness.js`
  - `app/api/health/route.js`
  - Purpose: keep `/api/readiness` strict, DB-backed, read-only and secret-free; keep `/api/health` lightweight liveness.
- Launch smoke
  - `scripts/smoke-launch-readonly.mjs`
  - Purpose: keep launch smoke read-only, with `/about` and `/contacts` as `known_missing` owner blockers and media URL as operational evidence only.
- Media delivery
  - `lib/media/public-delivery.js`
  - `app/api/media-public/[entityId]/route.js`
  - `lib/read-side/public-media-url.js`
  - Purpose: SQL metadata truth, S3 binary truth, CDN delivery, app proxy fallback, no raw CDN URLs as editorial truth.
- Analytics / lead boundary
  - `app/api/analytics/events/route.js`
  - `lib/analytics/read-model.js`
  - `lib/analytics/route-resolver.js`
  - Purpose: intent events are not leads; route ownership stays bound to Content Core owners.
- AI boundary
  - `lib/analytics/llm-context.js`
  - Purpose: future LLM context stays read-model-only, advisory/draft-only, no publish or invented facts.

## Architecture Risks Now Highlighted

- Closed readiness work must not regress to shallow `/api/health` checks.
- Runtime deploy acceptance must verify `runtime.commit`.
- `/about` and `/contacts` must not be faked with fallback content.
- Lead/intake must not be implemented inside analytics intent events.
- Media delivery must not become raw CDN URL content truth.
- `MEDIA_DELIVERY_MODE=auto` is current production posture; neither app-proxy-only nor hard-cdn-only is the documented launch truth.
- Sitemap honesty must remain tied to resolvable published routes.
- Old branch/worktree delivery state must not be resurrected casually.

## Known Blockers Fixed In Docs

- `/about`: owner-approved Content Core page missing.
- `/contacts`: owner-approved contact truth/page missing.
- Lead/intake: separate product/domain epic.
- Yandex Metrica public counter and scheduled imports: separate SEO/analytics follow-up.
- Moderate dependency advisories: separate dependency-security backlog.

## Checks

Commands run:

```powershell
git status --short --branch
git branch --show-current
git rev-parse --short HEAD
git worktree list
npm test
npm run build
APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_MEDIA_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg npm run smoke:launch
git diff --check
```

Results:

- `npm test`: passed, `464` tests, `0` failed.
- `npm run build`: passed on Next.js `16.2.4`; `/api/health`, `/api/readiness`, public routes, sitemap and media route remain in the App Router build output.
- Production `smoke:launch`: passed, `passed=23`, `failed=0`, `known_content_blocker=2`, `skipped=0`.
  - runtime marker: `version=0.1.0`, `commit=fa6d3042c31f891b34e3e6c898fb536f81a0b677`, `node=v22.22.2`, `buildTime=2026-05-06T09:10:53Z`
  - `/about` and `/contacts`: expected known content blockers
  - sitemap: does not list `/about` or `/contacts`
  - media URL: `200`
- `git diff --check`: passed after report creation before commit.

## Deploy

No deploy was performed for this closeout task. The changes are docs and comments only; they do not change runtime behavior, env, Dockerfile, compose, migrations, Content Core, media delivery mode, readiness semantics, or production data.

Production launch posture was verified read-only with `smoke:launch` against `https://ecostroycontinent.ru`.

## Drift Review

No intentional docs/code drift remains in the touched current-state surfaces:

- Current docs do not claim `/about` or `/contacts` should be 200 today.
- Current docs do not claim hard CDN mode is enabled.
- Current docs do not claim app proxy is removed; it remains fallback.
- Current docs do not claim lead domain is implemented.
- Current docs do not treat intent events as leads.
- Current docs do not treat `/api/health` as strict readiness.

Historical reports remain historical and were not rewritten. The new handoff points out which historical findings have been superseded.

## Open Items

- Owner-approved `/about` and `/contacts` Content Core pages.
- Lead/intake domain epic.
- Yandex Metrica public counter and scheduled imports after privacy/cookie decision.
- Remaining moderate dependency advisories.
- Backup restore drill / operational restore evidence.

## Git Status

Final status is recorded in the closeout response after commit.
