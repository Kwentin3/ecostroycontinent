# YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1

Статус: tooling/bootstrap note  
Дата: 2026-05-04  
Область: будущая интеграция SEO Dashboard с Яндекс Метрикой и Яндекс Вебмастером

## 1. Назначение

Этот документ описывает безопасный bootstrap/check tooling для Яндекс Метрики и Яндекс Вебмастера.

Tooling нужен только для подготовки интеграций:

- проверить env;
- получить ссылку авторизации OAuth;
- проверить доступ к счетчику Метрики;
- создать недостающие JavaScript-цели Метрики;
- проверить доступ к Вебмастеру и найти `host_id`.

Tooling не подключает реальные импорты в analytics read model, не меняет `/admin/visibility`, не добавляет OAuth callback route и не публикует счетчик Метрики на public site.

## 2. Env contract

Уже известное значение:

```dotenv
YANDEX_METRICA_COUNTER_ID=109037342
NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID=109037342
```

Обязательные переменные для текущего bootstrap-этапа:

```dotenv
YANDEX_METRICA_COUNTER_ID=
YANDEX_OAUTH_CLIENT_ID=
YANDEX_OAUTH_CLIENT_SECRET=
YANDEX_OAUTH_REDIRECT_URI=
```

Опциональные переменные:

```dotenv
PUBLIC_SITE_URL=
YANDEX_OAUTH_REFRESH_TOKEN=
YANDEX_METRICA_OAUTH_TOKEN=
YANDEX_WEBMASTER_OAUTH_TOKEN=
YANDEX_WEBMASTER_HOST_ID=
```

`NEXT_PUBLIC_*` значения могут попасть в браузер. Не помещайте туда secrets или OAuth tokens.

Server-only secrets:

- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_OAUTH_REFRESH_TOKEN`
- `YANDEX_METRICA_OAUTH_TOKEN`
- `YANDEX_WEBMASTER_OAUTH_TOKEN`

Они не должны попадать в git diff, отчеты, логи, read model или UI.

## 3. Команды

Проверить env:

```bash
npm run yandex:check-env
```

Сгенерировать OAuth authorization URL:

```bash
npm run yandex:oauth-url
```

Обменять одноразовый authorization code на OAuth token:

```bash
# Рекомендуемый операторский путь: code передается через stdin,
# а token пишется только в server env.
printf '%s' "$YANDEX_OAUTH_AUTH_CODE" | npm run yandex:exchange-oauth-code -- \
  --write-env-file=/opt/ecostroycontinent/runtime/.env \
  --write-token-keys=YANDEX_METRICA_OAUTH_TOKEN,YANDEX_WEBMASTER_OAUTH_TOKEN \
  --write-refresh-token
```

`--code=...` поддерживается только как аварийный режим и не рекомендуется, потому что shell history может сохранить одноразовый code.

Проверить Метрику:

```bash
npm run yandex:check-metrica
```

R2A Metrica aggregate import commands:

```bash
# Dry-run: validates env, counter, goals and Reporting API plan; writes nothing.
npm run yandex:metrica-import:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD

# Write import: server-only aggregate import into project storage and analytics_source_sync_state.
npm run yandex:metrica-import:r2a -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD
```

R2A importer rules:

- uses only server-side `YANDEX_METRICA_OAUTH_TOKEN`;
- writes external aggregate enrichment into `external_metrica_daily_aggregate`;
- updates `analytics_source_sync_state` for `source_system = yandex_metrica`;
- imports only minimal daily traffic/goals in R2A: `visits`, `pageviews`, `users` if supported, and reaches for the 11 configured goals;
- if Reporting API returns empty rows with zero totals, writes explicit zero-valued daily rows with safe metadata instead of treating internal telemetry as zero;
- does not schedule imports, change `/admin/visibility`, or wire imported rows into the analytics read model.

R2B Metrica source/device/country/landing import commands:

```bash
# Dry-run: validates env and bounded Reporting API plans; writes nothing.
npm run yandex:metrica-import:r2b:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD

# Write import: server-only external aggregate enrichment with landing diagnostics.
npm run yandex:metrica-import:r2b -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD
```

R2B importer rules:

- uses only server-side `YANDEX_METRICA_OAUTH_TOKEN`;
- imports bounded external aggregate reports for traffic source, device, country and landing URL/path;
- may safe-skip optional source detail or region reports when cardinality is too high;
- normalizes landing URLs and writes unmapped paths as diagnostics only;
- does not import raw sessions/logs, city reports, dimensioned goals or source-device-region-landing cross-products;
- does not schedule imports, change `/admin/visibility`, or wire imported rows into the analytics read model.

Создать недостающие цели Метрики:

```bash
npm run yandex:bootstrap-metrica-goals
```

Проверить Вебмастер:

```bash
npm run yandex:check-webmaster
```

R3A Webmaster import commands:

```bash
# Dry-run: validates env, host, verification and selected endpoint capability; writes nothing.
npm run yandex:webmaster-import:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --observed-date=YYYY-MM-DD --limit=10

# Write import: server-only Webmaster enrichment import into dedicated storage and analytics_source_sync_state.
npm run yandex:webmaster-import:r3a -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --observed-date=YYYY-MM-DD --limit=10
```

R3A importer rules:

- uses only server-side `YANDEX_WEBMASTER_OAUTH_TOKEN`;
- checks `YANDEX_WEBMASTER_HOST_ID` and host verification before import;
- writes accepted external search/indexation enrichment into dedicated `external_webmaster_*` tables;
- updates `analytics_source_sync_state` for `source_system = yandex_webmaster`;
- normalizes Webmaster URLs and writes unmapped URLs to diagnostics when applicable;
- treats query data as aggregate page-level evidence only, never as user/session/lead attribution;
- does not schedule imports, change `/admin/visibility`, mutate Content Core, or wire imported rows into the analytics read model.
R3B Webmaster query/page visibility import commands:

```bash
# Dry-run: checks beta export capabilities and synchronous query analytics fallback; writes nothing.
npm run yandex:webmaster-query-import:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --limit=100 --max-pages=2

# Write import: imports accepted aggregate query/page rows if the endpoint returns rows, then updates analytics_source_sync_state.
npm run yandex:webmaster-query-import:r3b -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD --limit=100 --max-pages=2
```

R3B importer rules:

- uses only server-side `YANDEX_WEBMASTER_OAUTH_TOKEN`;
- checks advanced export beta capability endpoints, but defaults to synchronous `query-analytics/list` fallback when beta export is async/deferred;
- writes only aggregate query/page visibility rows to `external_webmaster_query_visibility_daily` when rows exist;
- treats a successful zero-row API response as a truthful zero-row external result, not fabricated data and not proof of zero demand;
- updates `analytics_source_sync_state` for `source_system = yandex_webmaster`;
- normalizes Webmaster URLs and writes unmapped URLs to diagnostics when applicable;
- keeps query data aggregate-only and never joins it to users, sessions, contact journeys or leads;
- does not schedule imports, change `/admin/visibility`, mutate Content Core, or wire imported rows into the analytics read model.

Скрипты автоматически читают локальный `.env`, если он есть, и не перезаписывают уже экспортированные переменные окружения.

## 4. OAuth

Tooling генерирует URL для authorization code flow:

```text
https://oauth.yandex.ru/authorize?response_type=code&client_id=...
```

Запрашиваемые scope:

- `metrika:read`
- `metrika:write`
- `webmaster:hostinfo`
- `webmaster:verify`

После авторизации код нужно обменять на OAuth token через безопасный operator flow. Скрипты не печатают authorization code, access token или client secret.

Для обмена используется `npm run yandex:exchange-oauth-code`. Скрипт читает code из `YANDEX_OAUTH_AUTH_CODE`, stdin или `--code=...`, но в stdout выводит только masked token. Если Яндекс вернул `refresh_token`, его можно сохранить только в server-only `YANDEX_OAUTH_REFRESH_TOKEN`; реальное значение нельзя коммитить и нельзя передавать в UI/read model.

Если один OAuth token выдан с правами и Метрики, и Вебмастера, его можно положить в оба server-only env поля:

```dotenv
YANDEX_METRICA_OAUTH_TOKEN=
YANDEX_WEBMASTER_OAUTH_TOKEN=
```

Реальные значения должны жить в local/server env или deployment secrets, а не в репозитории.

## 5. Яндекс Метрика

`check-metrica` делает следующее:

- проверяет наличие `YANDEX_METRICA_COUNTER_ID`;
- если `YANDEX_METRICA_OAUTH_TOKEN` отсутствует, возвращает `not_configured` и next action;
- если token есть, вызывает Management API;
- проверяет доступность счетчика;
- получает список целей;
- показывает количество целей, уже существующие цели из нужного набора и недостающие цели.

`bootstrap-metrica-goals` создает только недостающие цели. Перед созданием он получает список существующих целей и не создает дубль, если:

- уже есть цель с condition `type=action` и `url=<event_id>`;
- или уже есть цель с таким же name, даже если condition требует ручной проверки.

Нужные JavaScript goals:

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

Создаваемая форма цели:

```json
{
  "goal": {
    "name": "click_to_call",
    "type": "action",
    "conditions": [
      {
        "type": "exact",
        "url": "click_to_call"
      }
    ]
  }
}
```

### 5.1. R1 public runtime mirror

R1 public runtime behavior is separate from bootstrap tooling:

- internal first-party telemetry remains the operational source of truth;
- public actions continue to be ingested through `/api/telemetry/events`;
- Yandex Metrica is an optional external mirror, not the source of truth for Content Core mapping, operational dashboard decisions or lead/contact distinction;
- public counter loading is controlled only by browser-safe `NEXT_PUBLIC_YANDEX_METRICA_ENABLED` and `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`;
- OAuth tokens, Webmaster tokens, client secret and refresh tokens must never be exposed through public config or browser bundles;
- default R1 init posture is conservative: `webvisor=false`, `clickmap=false`, `ecommerce=false`, `trackLinks=false`, `accurateTrackBounce=false`;
- `reachGoal` calls are allowed only through the approved centralized Metrica bootstrap/adapter boundary.

Production enablement of the public counter remains gated by privacy/cookie approval. If the flag stays disabled, internal telemetry is still valid and operational.

## 6. Яндекс Вебмастер

`check-webmaster` делает следующее:

- если `YANDEX_WEBMASTER_OAUTH_TOKEN` отсутствует, возвращает `not_configured`;
- если token есть, получает `user_id`;
- получает список hosts;
- если задан `PUBLIC_SITE_URL`, ищет соответствующий host;
- если задан `YANDEX_WEBMASTER_HOST_ID`, проверяет, есть ли такой host в списке;
- если host найден, запрашивает verification summary;
- если host найден по `PUBLIC_SITE_URL`, подсказывает safe значение для `YANDEX_WEBMASTER_HOST_ID`.

Tooling не добавляет сайт в Вебмастер и не запускает verification flow. Если host не найден, нужно вручную добавить сайт в Яндекс Вебмастер, подтвердить права и повторить проверку.

## 7. Статусы

- `ok` — проверка прошла.
- `not_configured` — не хватает OAuth token или host id; это не runtime failure.
- `partial` — часть целей создана, часть не удалось создать.
- `failed` — API отказал, сеть недоступна, token истек или нет прав.

Для `401/403` tooling выводит safe error: token lacks required permissions or expired. Полный token, client secret и authorization code никогда не печатаются.

## 8. Источники API

Официальные документы:

- Yandex Metrica authorization: https://yandex.ru/dev/metrika/en/intro/authorization
- Yandex Metrica counter info: https://yandex.ru/dev/metrika/ru/management/openapi/counter/counter
- Yandex Metrica goals list/create: https://yandex.com/dev/metrika/en/management/openapi/goal/goals
- Yandex OAuth code URL: https://yandex.ru/dev/id/doc/en/codes/code-url
- Yandex Webmaster authorization: https://yandex.ru/dev/webmaster/doc/ru/tasks/how-to-get-oauth
- Yandex Webmaster user: https://yandex.ru/dev/webmaster/doc/en/reference/user
- Yandex Webmaster hosts: https://yandex.ru/dev/webmaster/doc/en/reference/hosts
