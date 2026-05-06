# TECH DEBT AUDIT - Экостройконтинент v0.1

Дата: 2026-05-05  
Ветка: `feat/seo-visibility-dashboard`  
Commit: `804214d` (`docs: report SEO dashboard server acceptance`)  
Режим: audit-only, без runtime/refactor изменений.

## 1. Executive Verdict

**LAUNCH_BLOCKING_TECH_DEBT_FOUND**

Кодовая база в целом уже ближе к launch-core, чем к хаотичному прототипу: Content Core, publish workflow, media foundation, admin auth, SEO runtime и analytics foundation имеют реальные контуры и тесты. Главный честный blocker сейчас не архитектурный, а content-state/product readiness: day-1 страницы `/about` и `/contacts` существуют как route-code, но в production отвечают 404, потому что нет опубликованных Content Core pages.

Дополнительно есть P1-риск по базовой лидогенерации: contact intent events есть, но lead/intake domain, form submit as lead и Telegram notification path не реализованы. Это не ломает route truth, но бьет по launch goal "базовая лидогенерация".

## 2. Scope Audited

Проверено:

- Git state: `git status --short --branch`, текущая ветка и commit.
- Project scripts: `package.json`, `.github/workflows/*`.
- App routes: `app/*`, `app/admin/*`, `app/api/*`, public route files, SEO routes.
- Content Core / publish: `lib/content-core/*`, `lib/content-ops/*`, `db/migrations/*`.
- Public read-side: `lib/read-side/*`, `components/public/*`.
- Admin/CMS: `components/admin/*`, admin routes and API routes.
- Media/S3/CDN: `lib/media/*`, media API routes, env/config.
- Analytics / SEO Dashboard / Yandex foundation: `lib/analytics/*`, `components/admin/SeoVisibilityDashboard.js`, `components/public/AnalyticsTracker.js`, `scripts/yandex/*`, SEO dashboard docs/reports.
- Infra/deploy docs: `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `.github/workflows/*`, `docs/selectel/*`.
- Canon docs: PRD, Public Launch Domain Canon, Content Contract, Workflow Publish Revision Spec, RBAC matrix, SEO Dashboard handoff/contracts/reports.
- Tests inventory: `tests/**`.
- Production read-only smoke against `https://ecostroycontinent.ru`: public routes, admin redirect surface, health, robots, sitemap.

Не выполнялось:

- `npm run db:migrate`: mutates DB.
- `proof:*` scripts: require auth and can create/publish test entities.
- Authenticated production admin actions: no production data mutation in audit.
- Live media upload/delete and live lead submit: either mutative or domain not implemented.

## 3. Findings By Severity

### P0 - Launch Blocker

#### TD-P0-001 - `/about` and `/contacts` are day-1 public routes but currently 404

- Severity: P0
- Где найдено:
  - Production smoke: `/about` -> 404, `/contacts` -> 404.
  - `app/about/page.js:82`
  - `app/contacts/page.js:82`
  - `app/sitemap.js:32`
  - `lib/public-launch/seo-runtime.js:103`, `lib/public-launch/seo-runtime.js:112`
  - `lib/content-ops/readiness.js:333`, `lib/content-ops/readiness.js:337`, `lib/content-ops/readiness.js:458`
- Почему это долг:
  - Launch-core canon expects standalone company/contact pages as public route surface.
  - Code intentionally does not fake fallback content in `published_only`.
  - Sitemap correctly excludes routes that would resolve to 404, so SEO output is honest, but launch surface is incomplete.
- Boundary / risk:
  - Content Core must remain source of truth. Public Web must not invent company/contact truth.
  - Fix must go through Admin Console / Content Core workflow, not hardcoded route fallback.
- Impact:
  - Corporate site cannot be considered fully launch-ready.
  - Contact/search trust and local SEO are weakened.
- Recommended fix:
  - Create/review/publish approved `Page(type=about)` and `Page(type=contacts)`.
  - Confirm global contact truth before contacts publish.
  - Re-run production smoke and sitemap check after publish.
- Estimated effort: S/M, depending on content readiness.
- Confidence: high.
- Evidence:
  - `npm run smoke:public-admin` with `APP_BASE_URL=https://ecostroycontinent.ru`: public summary ok=3, missing_or_unpublished=2; `/about` and `/contacts` 404.
  - Sitemap production parse: 4 `<loc>`, no `/about`, no `/contacts`.

### P1 - Serious Launch Risk

#### TD-P1-001 - Lead/intake domain is not implemented beyond intent analytics

- Severity: P1
- Где найдено:
  - `lib/analytics/read-model.js:95`
  - `lib/analytics/read-model.js:499`
  - `lib/analytics/read-model.js:832`
  - `components/public/PublicRenderers.js:90`
  - `components/public/AnalyticsTracker.js:5`
  - `db/migrations/008_seo_visibility_analytics.sql:13`
- Почему это долг:
  - Contact actions are tracked as intent events, but lead domain is explicitly `not_ready`.
  - `form_submit` exists as an analytics event type, not as a persisted lead/intake record.
  - No Telegram notification path was found, only Telegram contact intent detection.
- Boundary / risk:
  - Intent events must not be counted as leads.
  - Lead/intake domain must stay separate from Content Core.
- Impact:
  - Launch can capture phone/messenger intent, but cannot honestly claim form-based lead intake with notification/persistence.
  - SEO Dashboard correctly shows leads as unavailable, but business launch goal "базовая лидогенерация" remains incomplete.
- Recommended fix:
  - Separate small PRD/implementation for minimal lead/intake domain.
  - Persist form submits as leads with spam protection and minimal sensitive data.
  - Add Telegram notification path if approved.
  - Keep click-to-call / click-to-Telegram as intent events, not leads.
- Estimated effort: M.
- Confidence: high.
- Evidence:
  - Read model states: "Lead domain missing/not_ready не означает 0 лидов."
  - `rg telegram` found UI/contact intent references, no server-side bot notification path.

#### TD-P1-002 - `npm audit` reports a high severity Next.js advisory

- Severity: P1
- Где найдено:
  - `package.json:27` pins `next` to `16.2.1`.
  - `npm audit --audit-level=high` reports high severity Next.js Server Components DoS advisory.
- Почему это долг:
  - Launching public/admin app with known high severity framework advisory is a production readiness risk.
- Boundary / risk:
  - Security / production readiness.
- Impact:
  - Potential DoS exposure on the public/admin runtime.
- Recommended fix:
  - Separate dependency-hardening PR: update Next to patched version indicated by audit, regenerate lockfile, run `npm test`, `npm run build`, production smoke.
  - Do not mix with domain refactors.
- Estimated effort: S/M.
- Confidence: high.
- Evidence:
  - Audit output: 4 vulnerabilities total, 1 high (`next`), 3 moderate (`postcss`, `fast-xml-parser` via AWS XML builder path).

#### TD-P1-003 - Public analytics measurement is only partially launch-ready

- Severity: P1
- Где найдено:
  - `components/public/AnalyticsTracker.js:5`
  - `components/public/PublicRenderers.js:117`
  - `scripts/yandex/bootstrap-lib.mjs:37`
  - `.env.example:23`
  - `lib/analytics/read-model.js:112`
  - `lib/analytics/read-model.js:126`
- Почему это долг:
  - First-party event endpoint/tracker exists.
  - Yandex Metrica/Webmaster bootstrap tooling exists, and prior reports say production-side Metrica/Webmaster setup was verified.
  - Public Metrica counter injection and first-party event -> `ym reachGoal` bridge are not active.
  - Scheduled Metrica/Webmaster imports are not implemented.
- Boundary / risk:
  - UI must consume analytics read model, not call Yandex directly.
  - Metrica is an external aggregate layer, not replacement for first-party events.
- Impact:
  - Launch can collect first-party intent events, but external visibility/goal data will be incomplete until imports and public counter bridge are enabled.
- Recommended fix:
  - Decide privacy/cookie posture.
  - Enable public Metrica counter via env flag.
  - Add first-party event -> `ym reachGoal` bridge.
  - Add scheduled imports and wire imported aggregates into read model.
- Estimated effort: M.
- Confidence: high.
- Evidence:
  - `npm run yandex:check-env`: required Yandex OAuth/client/counter values present locally, optional OAuth token env keys missing locally.
  - Prior reports under `docs/reports/2026-05-04/*YANDEX*` record server-side Webmaster/Metrica bootstrap.

#### TD-P1-004 - Media CDN branch is not the active production delivery path

- Severity: P1
- Где найдено:
  - `.env.example:43`
  - `lib/media/public-delivery.js:78`
  - `lib/media/public-delivery.js:89`
  - `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md:48`
  - `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md:216`
  - `docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:23`
- Почему это долг:
  - Canon wants binary delivery through S3-compatible storage and CDN.
  - Current operational runbook says production delivery stays `app_proxy` until CDN edge probes are stable.
- Boundary / risk:
  - SQL metadata remains media truth, but public delivery/performance still has CDN hardening debt.
- Impact:
  - Launch can work with app proxy, but media performance/cache behavior and CDN readiness remain a serious production risk.
- Recommended fix:
  - Either explicitly accept `app_proxy` for launch, or close CDN edge probe issue before flipping `MEDIA_DELIVERY_MODE`.
  - Add one media delivery smoke with a known published media asset.
- Estimated effort: M.
- Confidence: medium/high.
- Evidence:
  - Runbook states current production delivery mode is `app_proxy` and CDN edge nodes may return cached 403.

#### TD-P1-005 - App health/readiness check is shallow

- Severity: P1
- Где найдено:
  - `app/api/health/route.js:7`
  - `app/api/health/route.js:10`
  - `compose.yaml:64`
  - `.github/workflows/deploy-phase1.yml:106`
- Почему это долг:
  - `/api/health` returns `status: ok` and `databaseConfigured`, but does not prove DB connectivity or migration readiness.
  - Compose healthcheck exists for Postgres, not for the app service.
  - Deploy workflow checks `/api/health`, so it may pass when config exists but DB/runtime path is unhealthy.
- Boundary / risk:
  - Infra / production readiness.
- Impact:
  - Risk of "locally/build green, production not actually ready".
- Recommended fix:
  - Add a non-destructive readiness endpoint or extend health check with a tiny DB query and app build/runtime marker.
  - Keep secrets out of response.
  - Add app healthcheck or deploy smoke step that verifies DB-backed public route.
- Estimated effort: S.
- Confidence: high.
- Evidence:
  - Production `/api/health`: `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`.

### P2 - Important Debt

#### TD-P2-001 - Article/blog canonical route owner is not implemented

- Severity: P2
- Где найдено:
  - `lib/content-core/content-types.js:3`
  - `lib/analytics/route-resolver.js:159`
  - `app/` route inventory: no `app/blog`.
- Почему это долг:
  - Canon names Article as owner of `/blog/[slug]`, but Content Core has no `ARTICLE` type and no public blog routes.
  - Public Launch Canon treats blog/articles as supporting SEO layer, not day-1 gate.
- Boundary / risk:
  - Do not let Page become a second owner of article/blog route truth.
- Impact:
  - Not a blocker for narrow launch-core, but important before content SEO expansion.
- Recommended fix:
  - Keep blog out of launch acceptance, or create explicit Article PRD/model before adding `/blog`.
- Estimated effort: M.
- Confidence: high.
- Evidence:
  - Entity types include media/gallery/service/equipment/case/page, not article.

#### TD-P2-002 - End-to-end acceptance coverage is not yet a compact launch matrix

- Severity: P2
- Где найдено:
  - `tests/**`: 101 files, 454 tests passed.
  - `scripts/smoke-public-admin.mjs`
  - `scripts/proof-admin-first-slice.mjs`
  - `scripts/proof-seo-surface.mjs`
- Почему это долг:
  - Unit/source tests are strong, but launch still needs a small repeatable matrix for production-like flows.
  - Existing proof scripts can mutate data, so they are not always safe for casual audit runs.
- Boundary / risk:
  - Test debt / production readiness.
- Impact:
  - Future agents can over-trust green tests while missing `/about`/`/contacts`, lead form, media delivery, and authenticated publish smoke.
- Recommended fix:
  - Add a documented launch smoke checklist and one safe read-only production smoke script.
  - Keep mutative proof scripts explicitly opt-in.
- Estimated effort: S/M.
- Confidence: high.
- Evidence:
  - `npm test` passed 454 tests; production smoke still found launch blocker routes.

#### TD-P2-003 - Backup/restore hardening still has open ops work

- Severity: P2
- Где найдено:
  - `docs/selectel/INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2.md:51`
  - `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md:133`
- Почему это долг:
  - Backup upload/logging baseline is documented, but restore drill, remote lifecycle/retention, and optional integrity check remain open.
- Boundary / risk:
  - Production readiness / recovery.
- Impact:
  - A backup that has not been restore-tested is not enough for confident launch operations.
- Recommended fix:
  - Run one restore-oriented backup drill against a non-production target.
  - Record cadence, retention, and integrity check outcome.
- Estimated effort: M.
- Confidence: high.
- Evidence:
  - Selectel post-provision gaps explicitly list restore drill and retention as remaining work.

#### TD-P2-004 - Local and server Yandex env state can confuse future agents

- Severity: P2
- Где найдено:
  - `npm run yandex:check-env`
  - `.env.example:23`
  - `compose.yaml:18`
  - `docs/reports/2026-05-04/YANDEX_*`
- Почему это долг:
  - Local check-env reports required counter/client values present, but optional server OAuth token env keys missing locally.
  - Fresh reports indicate server-side Yandex setup was completed/verified.
- Boundary / risk:
  - Secrets must remain server-only; agents must not infer production state from local `.env`.
- Impact:
  - A future agent may incorrectly "fix" Yandex by adding tokens locally/docs or by exposing them to UI.
- Recommended fix:
  - Keep SEO Dashboard handoff as entry point.
  - Add any future Yandex changes only through server env/runbook flow, no committed tokens.
- Estimated effort: S.
- Confidence: high.
- Evidence:
  - `check-env` output masks client secret and shows missing local OAuth token envs.

#### TD-P2-005 - Public display mode needs an explicit launch assertion

- Severity: P2
- Где найдено:
  - `db/migrations/005_public_display_mode_control.sql:22`
  - `lib/public-launch/display-mode.js:68`
  - `lib/public-launch/seo-metadata.js:97`
- Почему это долг:
  - Placeholder/mixed/under-construction modes are useful operationally and correctly suppress indexing.
  - Before launch, production mode must be explicitly checked so no placeholder/noindex state leaks into launch.
- Boundary / risk:
  - Public Web read-side / SEO readiness.
- Impact:
  - Wrong display mode can suppress indexation or show placeholders despite code being healthy.
- Recommended fix:
  - Add display mode to launch checklist and production smoke.
- Estimated effort: S.
- Confidence: medium/high.
- Evidence:
  - Production smoke showed public routes 200/404, but display-mode endpoint/auth state was not deeply audited.

### P3 - Cleanup / Polish

#### TD-P3-001 - Documentation has layered canon and older broad PRD language

- Severity: P3
- Где найдено:
  - `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
  - `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
  - `docs/AGENT_START_HERE.md`
  - `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- Почему это долг:
  - Older docs include broader product aspirations, while current phase is narrow launch-core.
  - Fresh SEO handoff helps, but agents still need to read canon docs before making assumptions.
- Boundary / risk:
  - Scope control; avoid accidental phase expansion.
- Impact:
  - Future agents may reopen blog/AI/CRM/calculator/filter work as if launch-blocking.
- Recommended fix:
  - Keep `docs/AGENT_START_HERE.md` and public launch canon as first-read docs.
  - Do not rewrite PRD during launch hardening unless owner asks.
- Estimated effort: S.
- Confidence: high.
- Evidence:
  - Current code has launch-core routes and SEO dashboard foundation; broad areas remain deferred.

#### TD-P3-002 - Working tree has pre-existing docs/out deletions and prior docs/comment edits

- Severity: P3
- Где найдено:
  - `git status --short --branch`
- Почему это долг:
  - Audit started from a dirty tree, including many `docs/out/...` deletions and earlier docs/sticky-comment changes.
- Boundary / risk:
  - Process / delivery hygiene.
- Impact:
  - Reviewers must separate this audit report from pre-existing cleanup/deletion drift.
- Recommended fix:
  - Do not touch `docs/out` deletions in launch audit PR.
  - Commit or stash unrelated docs/comment work separately before a focused launch fix PR.
- Estimated effort: S.
- Confidence: high.
- Evidence:
  - Dirty status existed before this report was added.

## 4. Launch Blocker Summary

Confirmed P0:

- `/about` and `/contacts` are 404 in production because no published Content Core pages exist for those standalone page types. This is not a route-code bug. The correct fix is content creation/review/publish through Content Core/Admin workflow.

No other confirmed P0 was found in code structure during this audit. The P1 items are serious launch risks but have workarounds or can be handled in narrow follow-up PRs.

## 5. Recommended Remediation Plan

1. First PR / content operation: publish `/about` and `/contacts`
   - Create/review/publish approved `Page(type=about)` and `Page(type=contacts)`.
   - Confirm Global Settings contact truth.
   - Re-run production smoke and sitemap.

2. Second PR: dependency/security hardening
   - Update Next to patched version.
   - Run `npm audit --audit-level=high`, `npm test`, `npm run build`, production smoke.

3. Third PR / owner decision: minimal lead/intake
   - Decide whether launch requires form lead + Telegram now, or phone/messenger intent is enough for launch.
   - If form is required, implement tiny lead domain separately from Content Core.

4. Fourth PR: health/readiness
   - Add DB-backed readiness check without exposing secrets.
   - Add this to deploy smoke.

5. Before or just after launch: media/CDN decision
   - Either explicitly accept `app_proxy` for launch or close CDN edge 403 issue.
   - Add known-media delivery smoke.

6. Post-launch / SEO dashboard continuation
   - Enable Metrica public counter after privacy/cookie decision.
   - Add `ym reachGoal` bridge.
   - Implement scheduled imports and read model integration.

Owner decisions needed:

- Is launch acceptable without form-based lead intake if click-to-call / Telegram links work?
- Is launch acceptable with `MEDIA_DELIVERY_MODE=app_proxy` while CDN edge hardening remains open?
- Is `/blog` explicitly out of launch acceptance?
- When to enable Yandex Metrica public counter under privacy/cookie policy?

## 6. Test And Verification Matrix

| Area | Цель | Команда / сценарий | Expected result | Current status |
| --- | --- | --- | --- | --- |
| Git state | Зафиксировать branch/commit/dirty tree | `git status --short --branch`; `git branch --show-current`; `git rev-parse --short HEAD` | Понятный baseline | Passed |
| Package scripts | Понять доступные проверки | `Get-Content package.json -Raw` | Scripts known | Passed |
| Unit/source tests | Проверить существующие contracts | `npm test` | All tests pass | Passed: 454/454 |
| Production build | Проверить Next syntax/build/runtime bundle | `npm run build` | Build succeeds | Passed |
| Dependency audit | Security signal | `npm audit --audit-level=high` | No high vulnerabilities | Failed: 1 high Next advisory, 3 moderate |
| Public routes | Launch public shell | `APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:public-admin` | `/`, `/services`, `/cases`, `/about`, `/contacts` 200 | Failed/partial: first 3 are 200, `/about` and `/contacts` 404 |
| Admin unauth surface | Admin routes protected | Same smoke script | Admin routes redirect to login/no-access, no 500 | Passed |
| Health | Production health responds | `Invoke-WebRequest /api/health` | 200 and useful readiness | Passed shallow: 200, config-only |
| Robots | SEO crawl control | `Invoke-WebRequest /robots.txt` | 200, sitemap present, admin disallowed | Passed |
| Sitemap | SEO URL truth | `Invoke-WebRequest /sitemap.xml` and parse | 200, only resolvable public URLs | Passed with known gap: 4 URLs, no `/about`, no `/contacts` |
| Content create/edit/publish | Admin workflow actually works | Mutative proof script or manual admin flow | Draft -> review -> owner decision -> publish | Not run in production; unit tests passed |
| Service/case/page route ownership | No Page-as-second-owner drift | Tests + code review | Service/case/page ownership guarded | Passed by tests/code review |
| Media upload/delivery | SQL metadata + storage + public URL | Unit tests + live known asset smoke | Upload, preview, public delivery work | Unit tests passed; live known asset smoke not run |
| Lead form | Form submit persists lead | Manual form submit / API test | Lead saved and safely handled | Blocked: domain not implemented |
| Telegram notification | Lead notification path | Manual form submit with test recipient | Notification delivered | Blocked: path not implemented |
| SEO metadata/canonical/schema | Route SEO correctness | Tests + route smoke | Canonicals/robots/schema only when truth exists | Tests passed; live page-specific visual smoke not run |
| Auth/admin roles | RBAC | Unit tests + unauth smoke | Admin protected, roles respected | Unit tests/unauth smoke passed; authenticated prod not run |
| Migrations/schema | Migration safety | Inspect `scripts/migrate.mjs` and migrations | Safe migration list known | Inspected; not run because mutative |
| Yandex env | Check safe env contract | `npm run yandex:check-env` | Required values present, secrets masked | Passed locally for required values; optional tokens missing locally |
| Production deploy smoke | Server read-only | Public/admin/health/robots/sitemap probes | No 500; launch routes ready | Passed no-500; launch blocker confirmed |

## 7. Documentation Drift

### Docs Say, Code Does

- Docs/canon expect `/about` and `/contacts` in launch public surface; code has routes, but production content-state has no published pages, so both 404.
- Canon says Article owns `/blog/[slug]`; code does not currently implement Article entity or `/blog` routes.
- Broad PRD/launch goals mention basic lead capture/form and Telegram notification; code currently tracks intent events and marks lead domain `not_ready`.
- Media canon wants CDN delivery; operational docs/code currently keep production delivery on app proxy until CDN edge behavior is stable.

### Code Does, Docs Do Not Always Surface First

- SEO Dashboard/Yandex analytics foundation is now implemented enough to need its own handoff. Use `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`.
- Removal quarantine/safe deletion, display-mode controls, equipment-related surfaces, and service landing factory exist and are tested; they are not all launch blockers.
- The analytics read model deliberately reports lead domain as `not_ready` rather than zero.

### Unclear / Needs Owner Decision

- Whether launch may proceed with click-to-call / messenger as conversion path before form-based lead domain.
- Whether launch may proceed with `app_proxy` media delivery while CDN branch remains open.
- Whether `/blog` remains explicitly post-launch for this release.
- Privacy/cookie decision before enabling public Yandex Metrica counter.

## 8. Agent Handoff Notes

Read first:

- `docs/AGENT_START_HERE.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`

Do not reopen without owner decision:

- Page as owner of Service/Case/Article route truth.
- Public Web as editor/source of truth.
- AI autonomous publish or silent Content Core mutation.
- Contact actions counted as leads.
- Fake fallback content for `/about` or `/contacts`.
- Direct UI/LLM calls to Yandex/raw events/SQL.

Dangerous files/areas:

- `lib/content-core/service.js`
- `lib/content-ops/workflow.js`
- `lib/content-ops/readiness.js`
- `lib/read-side/public-content.js`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/sitemap.js`
- `lib/media/*`
- `lib/analytics/read-model.js`
- `app/api/analytics/events/route.js`
- `scripts/yandex/*`
- `compose.yaml`, `.env.example`, `.github/workflows/*`

Checks before PR:

- `npm test`
- `npm run build`
- `git diff --check`
- For public route/content changes: production or local smoke of `/`, `/services`, `/cases`, `/about`, `/contacts`, `/robots.txt`, `/sitemap.xml`.
- For security/deps: `npm audit --audit-level=high`.
- For Yandex: use only server/local env, never commit tokens.

## 9. Final Recommendation

Можно идти дальше к launch hardening, но не к большому refactor epic.

Самые полезные следующие задачи:

1. Publish `/about` and `/contacts` through Content Core workflow.
2. Patch dependency advisory around Next and re-run build/test/smoke.
3. Decide and implement minimal lead/intake if form-based capture is required for launch.
4. Add DB-backed readiness smoke.
5. Decide media launch mode: explicitly accept app proxy or finish CDN edge hardening.

No broad architecture rewrite is recommended now. The launch-core shape is mostly coherent; the next work should close concrete launch gaps.
