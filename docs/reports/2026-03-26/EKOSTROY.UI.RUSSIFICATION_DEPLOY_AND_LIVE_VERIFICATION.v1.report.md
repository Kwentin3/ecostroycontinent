# EKOSTROY.UI.RUSSIFICATION_DEPLOY_AND_LIVE_VERIFICATION.v1

## 1. Executive Summary
Delivery loop по русификации и friendly-copy remediation закрыт на уровне кода, пуша, деплоя и live browser verification.

Что подтверждено:
- кодовые изменения по RU-only shell, thin copy layer и workflow copy были закоммичены и запушены в `origin/main`;
- canonical delivery path проекта работает через GitHub Actions build-and-publish в GHCR и ручной `deploy-phase1` workflow на self-hosted runner;
- сервер перешёл на новый pinned image, а health probe после деплоя успешно прошёл;
- live public shell и admin shell на сервере стали русскими;
- runtime/content-owned English остатки всё ещё есть в данных и fixture layer, и они теперь отделены от code-fixed scope.

Главный итог:
- code-defined UI локализован;
- live proof показал, что shell-копирайт на сервере RU-only;
- остаточный English теперь в основном относится к seeded proof data, display names, comments, media assets and other runtime-owned content, а не к shell copy.

Оставшийся риск:
- часть live content всё ещё mixed RU/EN;
- некоторые proof/media references дают 404 в browser console;
- не все lower-priority admin subflows были re-opened в этом финальном pass.

## 2. Repo and Commit Actions

Текущее состояние ветки:
- branch: `main`
- tracking: `origin/main`
- HEAD: `9a8c3f2`

Проверенные коммиты delivery chain:
- `b50477e` `feat: rusify UI copy and normalize feedback`
- `07d37bf` `fix: localize admin shell eyebrow`
- `43903c3` `fix: rewrite deploy env pin inside container`
- `3c33747` `chore: log deployed runtime image in deploy workflow`
- `d353bee` `fix: pin deploy image explicitly in compose step`
- `9a8c3f2` `fix: retry deploy health probe`

Что это дало:
- русификация UI попала в репозиторий как осмысленный change set;
- deployment workflow был стабилизирован отдельно от user-facing copy;
- изменения были запушены до live verification.

Примечание по workspace:
- в рабочем дереве остались unrelated docs drift в `docs/product-ux/*` и `docs/out/for chatGpt/*`;
- эти файлы не трогались и не входят в эту delivery wave.

## 3. Push Result

Push result:
- branch changes были отправлены в `origin/main`;
- remote tracking указывает на `main...origin/main`;
- последняя зафиксированная commit-tip в этой delivery chain: `9a8c3f2`.

Operational note:
- push был сделан без broken intermediate state;
- после последнего стабилизирующего change set локальные `npm run build` и `npm test` были зелёные перед деплоем.

## 4. Deployment Path and Execution

Canonical delivery path проекта:
1. push в `main`;
2. GitHub Actions `build-and-publish` собирает image и публикует его в GHCR;
3. manual `deploy-phase1` workflow на self-hosted runner получает pinned `image_ref`;
4. workflow обновляет `/opt/ecostroycontinent/runtime/.env`, поднимает `docker compose`, и затем проверяет health через Traefik.

Фактическая проверка deployment path:
- build run: `23586807622`
- deploy run: `23586863689`
- deployed image ref: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f3f9abc5e5867ec9a6b45e6b77b1d7d9b8b9a2073f32cc923d7115906b982e52`
- running container digest: `sha256:085f844c1957f2055705ba2620fc4796ee0c3fce5200d214ce876f84495d8e16`

Что было важно по ходу деплоя:
- host runtime env initially contained stale `APP_IMAGE`, поэтому workflow был доработан так, чтобы compose всегда получал explicit override from dispatched image ref;
- health probe ранее падал на transient 502, поэтому добавлен retry loop;
- после этой стабилизации deploy завершился успешно и health endpoint вернул `ok`.

Health confirmation:
- `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`

## 5. Live Browser Verification

### Proof package
- [live-public-home.png](./live-public-home.png)
- [live-public-services.png](./live-public-services.png)
- [live-admin-no-access.png](./live-admin-no-access.png)
- [live-admin-dashboard.png](./live-admin-dashboard.png)
- [live-admin-review-queue.png](./live-admin-review-queue.png)
- [live-admin-review-detail.png](./live-admin-review-detail.png)
- [live-admin-users.png](./live-admin-users.png)
- [live-admin-service-list.png](./live-admin-service-list.png)
- [live-admin-entity-detail.png](./live-admin-entity-detail.png)
- [live-admin-history.png](./live-admin-history.png)

### Route checklist
| Surface | Route | Status | Evidence | Notes |
|---|---|---:|---|---|
| Public shell | `/` | pass | `[live-public-home.png](./live-public-home.png)` | RU title and hero text; shell is clean. |
| Public list | `/services` | partial | `[live-public-services.png](./live-public-services.png)` | Shell is RU, but content cards still render proof data in English. |
| Admin login | `/admin/login` | pass | browser snapshot during verification | RU login copy; seeded bootstrap admin account worked. No durable screenshot stored because the password field was prefilled in-session. |
| No access | `/admin/no-access` | pass | `[live-admin-no-access.png](./live-admin-no-access.png)` | RU forbidden page with clear fallback action. |
| Admin landing | `/admin` | pass | `[live-admin-dashboard.png](./live-admin-dashboard.png)` | RU shell; cards still contain proof fixture data in English. |
| Review queue | `/admin/review` | pass | `[live-admin-review-queue.png](./live-admin-review-queue.png)` | RU shell and workflow labels; data rows still include proof names. |
| Review detail | `/admin/review/rev_ec990634-3e1e-43d9-9ace-478390d74c44` | partial | `[live-admin-review-detail.png](./live-admin-review-detail.png)` | RU process copy, but proof data and a comment field still contain English/mixed content. |
| Users | `/admin/users` | partial | `[live-admin-users.png](./live-admin-users.png)` | Shell is RU, but display names are mixed and user data remains owner/runtime-owned. |
| Entity list | `/admin/entities/service` | partial | `[live-admin-service-list.png](./live-admin-service-list.png)` | Shell is RU, but entity titles and statuses reflect proof fixture data. |
| Entity detail | `/admin/entities/service/entity_05c6d1ba-bb24-41ca-a588-23f0d51b790d` | partial | `[live-admin-entity-detail.png](./live-admin-entity-detail.png)` | RU shell and helpers; multiple proof strings remain English, and media refs produced 404 console errors. |
| History / timeline | `/admin/entities/service/entity_05c6d1ba-bb24-41ca-a588-23f0d51b790d/history` | partial | `[live-admin-history.png](./live-admin-history.png)` | RU shell, but version titles and audit comments still expose proof content in English. |

### What browser verification confirmed
- public shell is genuinely RU-only on the live server;
- admin shell is genuinely RU-only on the live server;
- workflow labels around review/readiness/publish are Russian and preserve operational semantics;
- mixed content now comes from data/fixture/runtime ownership, not from shell copy in the code paths checked here.

### What was not re-opened in this final pass
- publish screen;
- bootstrap/superadmin surface;
- media upload flow as a separate browser run.

These are not flagged as regressions; they were simply not needed to confirm the live closure after the stronger public/admin checks above.

## 6. Runtime Content Findings

Runtime/content-owned English and mixed strings still exist.

Observed examples on live pages:
- `Proof Service mn5zv50d`
- `Proof service summary`
- `Create proof service`
- `Approved for proof slice.`
- `System Superadmin`
- `Proof Asset mn5zv50d`

Where they appeared:
- public `/services` cards;
- admin dashboard cards;
- review queue;
- review detail;
- entity detail;
- history/timeline;
- users page display names.

Classification:
- shell copy: fixed in code and confirmed live;
- seeded proof data / display names / comments / media refs: still runtime-owned;
- missing proof media requests: show up as 404s in console and should be treated as content/fixture hygiene, not shell localization regression.

Console note:
- entity detail page emitted several 404s for proof media URLs;
- the UI rendered successfully, but the asset ownership problem remains visible in runtime content.

## 7. Live-only Fixes Applied

No additional code fix was required during this final live pass.

The only meaningful live-facing changes already landed before deployment were:
- admin shell eyebrow localization;
- deploy workflow stabilization for env pin and health probe retry.

Everything observed after live verification fits into one of these buckets:
- code-fixed shell copy;
- runtime/content-owned residue;
- lower-priority surfaces not reopened in this pass.

## 8. Remaining Blockers and Risks

Open risks that remain after deployment:
- runtime content sweep is still needed for proof fixtures and display names;
- some live data still carries English or mixed language values;
- media asset ownership/availability for proof fixtures is incomplete;
- any future new enum/label without mappings can still fall back to a neutral Russian fallback, so glossary maintenance is still required.

Not a blocker, but a scope note:
- publish/readiness/review semantics are preserved and should not be broadened by further copy cleanup;
- no redesign or localization platform work was introduced;
- no autonomous content publication was attempted.

## 9. Exact Next Narrow Step

Recommended next narrow step:
1. Run a read-only runtime/content sweep against the live seeded dataset or a safe export from the DB.
2. Classify each remaining English/mixed string as either:
   - content-owned and safe to rewrite in data, or
   - professional term that should remain as-is with a documented canonical mapping.
3. Re-open the proof-heavy public/admin routes only after the data layer is cleaned, so browser verification can become fully RU-only without fixture noise.

If the team wants to finish the loop completely, the next pass should focus on content hygiene, not code shell localization.

## Final Note
This delivery closure is operationally credible because it contains all four layers:
- code commit;
- push to remote;
- deployed server revision confirmation;
- live browser proof with honest runtime residue boundaries.
