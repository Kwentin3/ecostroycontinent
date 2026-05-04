# YANDEX_OAUTH_SERVER_BOOTSTRAP_Экостройконтинент_v0.1

Дата: 2026-05-04  
Ветка: `feat/seo-visibility-dashboard`  
Commit: `88ec436a8d71f6c532a9ffa941025b42e4aff35b`  
Canonical runtime target: Selectel VM `ecostroycontinent-phase1-vm`, compose stack `repo-app-1` + `repo-sql-1`

## Executive Verdict

OAuth bootstrap tooling доведён до server-ready состояния и задеплоен на canonical runtime.

Текущий статус: `ready_for_owner_authorization_code`.

Что уже готово:

- `yandex:exchange-oauth-code` добавлен и доступен в runtime image;
- server env содержит required OAuth client/counter поля без вывода секретов;
- OAuth authorization URL на сервере генерируется успешно;
- `check-metrica`, `bootstrap-metrica-goals`, `check-webmaster` корректно возвращают `not_configured`, потому что OAuth token ещё не предоставлен;
- реальные OAuth tokens, refresh token и authorization code не записывались в git, report или UI.

Что не завершено:

- token exchange не выполнялся, потому что одноразовый authorization code от владельца ещё не предоставлен;
- цели Метрики не создавались, потому что `YANDEX_METRICA_OAUTH_TOKEN` отсутствует;
- Webmaster host-id не найден, потому что `YANDEX_WEBMASTER_OAUTH_TOKEN` отсутствует.

## Sources / API References

Использованы официальные документы Яндекса:

- Yandex ID authorization code URL and token exchange: https://yandex.ru/dev/id/doc/ru/codes/code-url
- Yandex ID OAuth token response / refresh token semantics: https://yandex.ru/dev/id/doc/en/codes/code-url
- Yandex Metrica authorization: https://yandex.ru/dev/metrika/en/intro/authorization
- Yandex Metrica goals API: https://yandex.com/dev/metrika/en/management/openapi/goal/goals
- Yandex Webmaster OAuth: https://yandex.ru/dev/webmaster/doc/ru/tasks/how-to-get-oauth
- Yandex Webmaster user/hosts API: https://yandex.ru/dev/webmaster/doc/en/reference/user and https://yandex.ru/dev/webmaster/doc/en/reference/hosts

## Files Added / Changed

- `.env.example`
- `compose.yaml`
- `package.json`
- `scripts/yandex/bootstrap-lib.mjs`
- `scripts/yandex/bootstrap.mjs`
- `scripts/yandex/check-env.mjs`
- `scripts/yandex/generate-oauth-url.mjs`
- `scripts/yandex/check-metrica.mjs`
- `scripts/yandex/bootstrap-metrica-goals.mjs`
- `scripts/yandex/check-webmaster.mjs`
- `scripts/yandex/exchange-oauth-code.mjs`
- `tests/yandex-bootstrap-tooling.test.js`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`

## Commands / Results

Local validation:

- `npm test` -> pass, `454/454`
- `npm run build` -> pass
- `npm run yandex:exchange-oauth-code` without code -> expected safe failure, no secret output

Build/publish:

- `gh workflow run build-and-publish.yml --ref feat/seo-visibility-dashboard`
- Run: https://github.com/Kwentin3/ecostroycontinent/actions/runs/25332433586
- Result: success
- Image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:ed5caf3f85560abe7647988dd38276ca0cbb3f1f68f24cb8763dd5798d313ec2`

Deploy:

- `gh workflow run deploy-phase1.yml --ref feat/seo-visibility-dashboard`
- Run: https://github.com/Kwentin3/ecostroycontinent/actions/runs/25332546231
- Result: success
- Health probe: `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`

Server env readiness:

- `docker exec repo-app-1 npm run yandex:check-env`
- Result: `status=ok`
- Present: `PUBLIC_SITE_URL`, `YANDEX_METRICA_COUNTER_ID=109037342`, `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID=109037342`, `YANDEX_OAUTH_CLIENT_ID`, `YANDEX_OAUTH_CLIENT_SECRET`, `YANDEX_OAUTH_REDIRECT_URI`
- Missing by design until owner authorizes: `YANDEX_METRICA_OAUTH_TOKEN`, `YANDEX_WEBMASTER_OAUTH_TOKEN`, `YANDEX_OAUTH_REFRESH_TOKEN`, `YANDEX_WEBMASTER_HOST_ID`

OAuth URL:

- `docker exec repo-app-1 npm run yandex:oauth-url`
- Result: `status=ok`, `response_type=code`, `auth_url_generated=true`
- Requested scopes: `metrika:read`, `metrika:write`, `webmaster:hostinfo`, `webmaster:verify`
- Full URL intentionally not included in this report.

Metrica / Webmaster checks before token:

- `docker exec repo-app-1 npm run yandex:check-metrica` -> `not_configured`, counter id `109037342`, all required goals listed as missing
- `docker exec repo-app-1 npm run yandex:bootstrap-metrica-goals` -> `not_configured`, no goals created
- `docker exec repo-app-1 npm run yandex:check-webmaster` -> `not_configured`

## Server Env Operations

Updated canonical server env file:

- Path: `/opt/ecostroycontinent/runtime/.env`
- Mode preserved/restored: root-owned server env file, no values printed
- Backups created before edits:
  - `/opt/ecostroycontinent/runtime/.env.bak-yandex-20260504171834`
  - `/opt/ecostroycontinent/runtime/.env.bak-yandex-force-20260504171937`
  - `/opt/ecostroycontinent/runtime/.env.bak-yandex-clean-1777915248`

During env merge, a Windows/BOM/CRLF issue was detected before final acceptance: one malformed BOM-prefixed Yandex line made Docker Compose reject `.env`. It was corrected by a LF-only clean pass that:

- removed BOM/CR from Yandex env lines;
- removed duplicate Yandex keys;
- restored empty token fields to truly empty values;
- confirmed Docker Compose can read the env file again.

Important runtime note:

- Manual compose recreation must use the same runner workspace compose that contains Yandex env passthrough: `/opt/ecostroycontinent/runner/_work/ecostroycontinent/ecostroycontinent/compose.yaml`.
- A one-off recreate from old `/opt/ecostroycontinent/repo` stripped Yandex env because that checkout is still on `main`; it was corrected immediately by recreating `repo-app-1` from the runner checkout.

## Token Exchange Status

Status: `not_completed_waiting_for_owner_code`.

Reason:

- OAuth consent requires the owner to open the generated Yandex authorization URL in a browser and provide the short-lived authorization code.
- No authorization code has been provided yet.

Safe next owner action:

1. Open the generated OAuth authorization URL under the Yandex account that owns Metrica counter `109037342` and the Webmaster host.
2. Grant requested scopes.
3. Put the one-time code into an ignored/local secret channel, preferably local `.env` as `YANDEX_OAUTH_AUTH_CODE=...`, or a root-only server temp file.
4. Tell the agent the code is ready. Do not commit it and do not place it in docs/reports.

Expected exchange command after code is available:

```bash
printf '%s' "$YANDEX_OAUTH_AUTH_CODE" | npm run yandex:exchange-oauth-code -- \
  --write-env-file=/opt/ecostroycontinent/runtime/.env \
  --write-token-keys=YANDEX_METRICA_OAUTH_TOKEN,YANDEX_WEBMASTER_OAUTH_TOKEN \
  --write-refresh-token
```

After token storage, `repo-app-1` must be recreated from the canonical deployed compose surface so runtime env picks up the token.

## Security Checks

- Full OAuth URL not written to report.
- Full `YANDEX_OAUTH_CLIENT_SECRET` not printed.
- Authorization code not received, not printed and not stored.
- OAuth token not received, not printed and not stored.
- Refresh token not received, not printed and not stored.
- `.env.example` contains placeholders only.
- `git diff --cached` secret scan showed no real Yandex secret/token values; only placeholder names, regex code and fake test strings were present.
- Read model/UI were not changed and do not receive tokens.

## Metrica Goals

Required goals:

- `click_to_call`
- `click_to_telegram`
- `click_to_whatsapp`
- `form_start`
- `form_submit`
- `cta_click`
- `contact_link_click`
- `gallery_open`
- `faq_expand`
- `case_card_click`
- `service_link_click`

Current result:

- `already_existed`: unknown until token is available
- `created`: none
- `needs_review`: none yet
- `failed`: none
- `missing`: all listed as not yet checked/created because Metrica token is missing

## Webmaster

Current result:

- `check-webmaster`: `not_configured`
- `host-id found`: no
- `host-id stored`: no

Next action after token:

- rerun `npm run yandex:check-webmaster`;
- if `suggested_env.YANDEX_WEBMASTER_HOST_ID` is returned, add it to `/opt/ecostroycontinent/runtime/.env` and recreate `repo-app-1`.

## Git Status

Local working tree after committed tooling:

- clean for tracked implementation scope;
- pre-existing `docs/out/*` deletions remain and were not touched.

Latest committed/pushed tooling commit:

- `88ec436 feat: add Yandex SEO bootstrap tooling`

## Open Items

1. Owner must complete browser consent and provide one-time authorization code through an ignored/secure channel.
2. Exchange code to token on server.
3. Store token in server env only.
4. Rerun:
   - `npm run yandex:check-env`
   - `npm run yandex:check-metrica`
   - `npm run yandex:bootstrap-metrica-goals`
   - `npm run yandex:check-webmaster`
5. Store `YANDEX_WEBMASTER_HOST_ID` if Webmaster returns a host match.
6. Create/update this report with final token exchange, goals and Webmaster result.
