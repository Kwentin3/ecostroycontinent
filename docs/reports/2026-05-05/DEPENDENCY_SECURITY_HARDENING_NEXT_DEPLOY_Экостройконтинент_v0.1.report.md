# Dependency/security hardening Next.js deploy report - Экостройконтинент v0.1

Дата: 2026-05-05  
Scope: узкое закрытие Next.js high severity advisory и доставка обновленного runtime на сервер.  
Delivery branch: `chore/next-security-hardening`  
Dependency commit: `cf0e952e202d2978749f05f178ba229f10a9255c` (`chore: harden Next.js dependency advisory`)

## Executive verdict

**NEXT_JS_HIGH_ADVISORY_CLOSED_AND_DEPLOYED**

Next.js обновлен с `16.2.1` до `16.2.4`. Локальный `npm audit --audit-level=high` больше не падает по high severity advisory. Обновленный образ опубликован в GHCR и выкачен на production compose stack `repo`. Production smoke после deploy проходит по основным launch routes; `/about` и `/contacts` остаются 404 как отдельный owner/content blocker.

## Advisory and dependency change

- Source version: `next@16.2.1`
- Target version: `next@16.2.4`
- Advisory from baseline `npm audit`: `GHSA-q4gf-8mx6-v5v3` - Next.js Denial of Service with Server Components.
- Patched version source: `npm audit` recommended `next@16.2.4`.
- Changed files in dependency commit:
  - `package.json`
  - `package-lock.json`
- No React/ESLint/TypeScript migration was required.
- Remaining audit items after update: 4 moderate advisories remain (`postcss`, `fast-xml-parser` via transitive paths). No high advisory remains under `npm audit --audit-level=high`.

## Baseline before dependency change

Local baseline in original working tree:

- Branch: `feat/seo-visibility-dashboard`
- HEAD: `804214d`
- Node: `v22.19.0`
- npm: `11.6.2`
- `npm audit --audit-level=high`: failed with 1 high Next.js advisory and moderate transitives.
- `npm test`: passed, 454/454.
- `npm run build`: passed on Next.js `16.2.1`.

Dirty-tree note:

- Original repo folder had pre-existing unrelated dirty state and docs/out deletions.
- Dependency work was isolated into a clean delivery worktree from the deployed production revision `6b248d0`.

## Local verification after update

Delivery worktree:

- Path: `D:\Users\Roman\Desktop\Проекты\сайт Армен next-hardening`
- Branch: `chore/next-security-hardening`
- Base commit: `6b248d0` (`feat: add Yandex Webmaster verification file`)

Commands:

| Command | Result |
| --- | --- |
| `npm install next@16.2.4 --save-exact` | updated only Next.js and lockfile Next packages |
| `npm ls next --depth=0` | `next@16.2.4` |
| `npm audit --audit-level=high` | exit 0, no high advisories |
| `npm test` | passed, 454/454 |
| `npm run build` | passed, Next.js `16.2.4`, no blocking App Router warnings |
| `git diff --check` | passed |
| `.next/standalone/node_modules/next/package.json` | `16.2.4` present in build artifact |

## Git and GHCR delivery

- Dependency commit: `cf0e952e202d2978749f05f178ba229f10a9255c`
- Push: `origin/chore/next-security-hardening`
- PR: https://github.com/Kwentin3/ecostroycontinent/pull/4
- Merge: not performed during this task.
- GH Actions build workflow: `build-and-publish.yml`
- Build run: `25364459184`
- Build result: passed.
- Published tags:
  - `ghcr.io/kwentin3/ecostroycontinent-app:chore-next-security-hardening`
  - `ghcr.io/kwentin3/ecostroycontinent-app:sha-cf0e952`
- Pinned image deployed:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:22b6c7b31d39873d52dba4b9762160fdaec7a216a944d38800ba56116ab6a218`

## Server baseline before deploy

Read-only server baseline:

- Host: `178.72.179.66`
- Compose project: `repo`
- App container before: `74cc9c2f9ca6d87c5517a175a182201f0b79825b922db3d1efae24b6854a672c`
- App image before: `sha256:88e52d81663cc855baaaa32292b6d1fc6d17ee6fec5d755985a9013095fd3916`
- App image label before:
  - `org.opencontainers.image.revision=6b248d0f62b134b4bc0eb927dbc82653a31f15e4`
  - `org.opencontainers.image.version=feat-seo-visibility-dashboard`
- App container status before: running.
- SQL container before: `repo-sql-1`, healthy.
- Traefik container before: `ecostroycontinent-traefik`, running.
- Server checkout note: `/opt/ecostroycontinent/repo` was on `main` at `19935e9`, but the running app image was the source of truth for deployed app revision.

Pre-deploy public route state:

- Same-day production audit before this deploy showed `/`, `/services`, `/cases` as 200; `/about` and `/contacts` as 404; admin routes redirecting to login.
- Immediate pre-deploy container/image baseline was captured. A second immediate HTTP pre-smoke was not repeated before the container swap; post-deploy smoke is recorded below.

## Deploy method

Deploy was performed manually through the documented compose runtime path because `deploy-phase1.yml` always runs `npm run db:migrate`, while this dependency-only update did not require DB migrations.

Actions performed on server:

1. Wrote only the runner-managed image pin:
   - `/opt/ecostroycontinent/runtime/app-image.env`
   - `APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:22b6c7b31d39873d52dba4b9762160fdaec7a216a944d38800ba56116ab6a218`
2. Ran compose from the current runner workspace:
   - `docker compose --env-file /opt/ecostroycontinent/runtime/.env --env-file /opt/ecostroycontinent/runtime/app-image.env --project-name repo -f compose.yaml pull app`
   - `docker compose --env-file /opt/ecostroycontinent/runtime/.env --env-file /opt/ecostroycontinent/runtime/app-image.env --project-name repo -f compose.yaml up -d app`

Not changed:

- No Content Core data.
- No publish workflow.
- No DB schema.
- No migrations.
- No Postgres restart beyond existing dependency health wait.
- No Traefik changes.
- No env/secrets changes except the image pin.
- No media delivery mode change.
- No Yandex/Metrica change.
- No fallback content for `/about` or `/contacts`.

## Server status after deploy

- App container after: `9d655a0cdf42d0616d4e3b6cd100411a6e08c0e4e1e3e5986834410189d0dd91`
- App image after: `sha256:20a585f6cb9f1c04d04b062edab4899e19d09689bd0484619be271fdb34aeb1f`
- App status after: running.
- Restart count: `0`
- Started at: `2026-05-05T07:56:58.003933189Z`
- Image label after:
  - `org.opencontainers.image.revision=cf0e952e202d2978749f05f178ba229f10a9255c`
  - `org.opencontainers.image.version=chore-next-security-hardening`
- App startup logs:
  - `Next.js 16.2.4`
  - `Ready in 0ms`
- Runtime package check:
  - `docker exec repo-app-1 npm ls next --depth=0 --omit=dev`
  - Result: `next@16.2.4`

Container-side `npm audit --audit-level=high --omit=dev` was attempted but is not supported by the standalone runtime artifact because the lockfile is not present in the container (`ENOLOCK`). The security evidence is therefore the committed lockfile audit plus runtime `npm ls next`.

## Production smoke after deploy

Smoke command:

- `APP_BASE_URL=https://ecostroycontinent.ru npm run smoke:public-admin`

Result:

- Public summary:
  - ok: `3`
  - missing_or_unpublished: `2`
  - failed: `0`
- Admin summary:
  - redirect: `5`
  - failed: `0`

Route probes:

| Route | Status | Notes |
| --- | ---: | --- |
| `/api/health` | 200 | health payload returned |
| `/` | 200 | public home OK |
| `/services` | 200 | public services OK |
| `/cases` | 200 | public cases OK |
| `/robots.txt` | 200 | robots served |
| `/sitemap.xml` | 200 | sitemap served |
| `/admin` | 307 | redirects to `/admin/login`, not public |
| `/about` | 404 | known content-state blocker |
| `/contacts` | 404 | known content-state blocker |

Sitemap check:

- `<loc>` count: `4`
- Contains `/about`: `false`
- Contains `/contacts`: `false`

## Known non-regressions

- `/about` and `/contacts` remain 404 because no approved/published Content Core pages exist for those route types.
- This task did not create fallback content and did not mutate production content.
- Sitemap correctly does not publish `/about` or `/contacts` while those routes resolve to 404.

## Remaining open items

- Moderate advisories remain:
  - `postcss <8.5.10`
  - `fast-xml-parser <5.7.0` through AWS SDK XML builder path.
- `/about` and `/contacts` still need owner-approved content and contact truth before publish.
- Lead/intake domain remains not implemented.
- CDN media delivery remains on the existing operational path and was not touched.
- The dependency branch was pushed and deployed; it was not merged during this task.

## Final git status

Delivery worktree after committing this report is expected to be clean on branch `chore/next-security-hardening`.

Original worktree remains dirty with unrelated pre-existing docs/comment changes and `docs/out` deletions. Those were intentionally not included in this dependency/security hardening delivery.
