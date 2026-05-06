# YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1

Дата: 2026-05-04  
Ветка: `feat/seo-visibility-dashboard`  
Тип задачи: tooling/bootstrap, documentation, tests

## Executive verdict

Безопасный bootstrap/check tooling для Яндекс Метрики и Яндекс Вебмастера реализован.

Текущий локальный env готов к генерации OAuth URL и следующему ручному шагу владельца, но реальные OAuth tokens пока отсутствуют. Поэтому live API checks для Метрики и Вебмастера корректно возвращают `not_configured`; цели Метрики не создавались.

## Добавлено / изменено

Добавлено:

- `scripts/yandex/bootstrap-lib.mjs`
- `scripts/yandex/bootstrap.mjs`
- `scripts/yandex/check-env.mjs`
- `scripts/yandex/generate-oauth-url.mjs`
- `scripts/yandex/check-metrica.mjs`
- `scripts/yandex/bootstrap-metrica-goals.mjs`
- `scripts/yandex/check-webmaster.mjs`
- `tests/yandex-bootstrap-tooling.test.js`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`

Изменено:

- `package.json` — добавлены npm scripts для Yandex tooling.

Также в ignored local `.env` был заполнен только non-secret `YANDEX_METRICA_COUNTER_ID=109037342`, потому что после merge секции это поле было пустым. OAuth secrets/tokens в `.env` не менялись и не попадают в git.

## Доступные команды

```bash
npm run yandex:check-env
npm run yandex:oauth-url
npm run yandex:check-metrica
npm run yandex:bootstrap-metrica-goals
npm run yandex:check-webmaster
```

Также доступны прямые wrapper scripts:

```bash
node scripts/yandex/check-env.mjs
node scripts/yandex/generate-oauth-url.mjs
node scripts/yandex/check-metrica.mjs
node scripts/yandex/bootstrap-metrica-goals.mjs
node scripts/yandex/check-webmaster.mjs
```

Скрипты автоматически читают `.env`, если он есть, и не перезаписывают уже экспортированные env-переменные.

## Env check result

Команда:

```bash
npm run yandex:check-env
```

Результат:

- `status`: `ok`
- `YANDEX_METRICA_COUNTER_ID`: present, value `109037342`
- `YANDEX_OAUTH_CLIENT_ID`: present
- `YANDEX_OAUTH_CLIENT_SECRET`: present, value not printed
- `YANDEX_OAUTH_REDIRECT_URI`: present
- `PUBLIC_SITE_URL`: present
- `YANDEX_METRICA_OAUTH_TOKEN`: missing
- `YANDEX_WEBMASTER_OAUTH_TOKEN`: missing
- `YANDEX_WEBMASTER_HOST_ID`: missing

Next action: получить OAuth token через generated authorization URL и положить token только в local/server env.

## OAuth URL generation

Команда:

```bash
npm run yandex:oauth-url
```

Результат:

- `status`: `ok`
- `response_type`: `code`
- OAuth URL generated successfully.

URL в отчёт не включён, чтобы не разносить OAuth application identifiers по документам. Скрипт печатает URL локально для оператора.

Запрашиваемые scope:

- `metrika:read`
- `metrika:write`
- `webmaster:hostinfo`
- `webmaster:verify`

Client secret не печатается.

## Metrica check result

Команда:

```bash
npm run yandex:check-metrica
```

Результат:

- `status`: `not_configured`
- `counter_id`: `109037342`
- причина: `YANDEX_METRICA_OAUTH_TOKEN` отсутствует.

API Метрики не вызывался, потому что token отсутствует.

## Metrica goals bootstrap result

Команда:

```bash
npm run yandex:bootstrap-metrica-goals
```

Результат:

- `status`: `not_configured`
- `created`: none
- `failed`: none
- причина: `YANDEX_METRICA_OAUTH_TOKEN` отсутствует.

Цели, которые будут проверяться/создаваться после появления token:

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

Логика защиты от дублей:

- цель считается существующей, если найден condition `type=action` + `url=<event_id>`;
- если найдено совпадение только по имени, новая цель не создаётся, а запись попадает в `needs_review`;
- создаются только отсутствующие цели.

## Webmaster check result

Команда:

```bash
npm run yandex:check-webmaster
```

Результат:

- `status`: `not_configured`
- причина: `YANDEX_WEBMASTER_OAUTH_TOKEN` отсутствует.

API Вебмастера не вызывался, `host_id` не найден.

## Security / privacy checks

Проверено:

- `YANDEX_OAUTH_CLIENT_SECRET` не печатается;
- OAuth tokens не печатаются;
- authorization code не принимается и не печатается;
- `.env` не коммитится;
- `.env.example` содержит только placeholders;
- generated docs/report не содержат OAuth token, client secret или authorization code;
- `git diff` проверен на token/secret-like паттерны.

В tracked файлах есть только синтетические test sentinel значения вида `*-must-not-leak`, которые используются для проверки redaction. Реальный OAuth ClientID из локального `.env` и non-empty secret assignments в tracked diff не найдены.

Отдельно исправлен дефект redaction: HTTP `403` больше не перетирает доменный `status=failed`, а сохраняется как `http_status=403`.

## Тесты

Targeted:

```bash
node --experimental-specifier-resolution=node --test tests/yandex-bootstrap-tooling.test.js
```

Результат:

- 7/7 pass.

Full test suite:

```bash
npm test
```

Результат:

- 449/449 pass.

Build:

```bash
npm run build
```

Результат:

- pass.

## Использованные API документы

- Yandex Metrica authorization: https://yandex.ru/dev/metrika/en/intro/authorization
- Yandex Metrica counter info: https://yandex.ru/dev/metrika/ru/management/openapi/counter/counter
- Yandex Metrica goals list/create: https://yandex.com/dev/metrika/en/management/openapi/goal/goals
- Yandex OAuth code URL: https://yandex.ru/dev/id/doc/en/codes/code-url
- Yandex Webmaster authorization: https://yandex.ru/dev/webmaster/doc/ru/tasks/how-to-get-oauth
- Yandex Webmaster user: https://yandex.ru/dev/webmaster/doc/en/reference/user
- Yandex Webmaster hosts: https://yandex.ru/dev/webmaster/doc/en/reference/hosts

## Что нужно сделать владельцу вручную

1. Запустить `npm run yandex:oauth-url`.
2. Открыть authorization URL в браузере.
3. Авторизоваться под аккаунтом, у которого есть доступ к счетчику Метрики `109037342` и сайту в Вебмастере.
4. Безопасно обменять authorization code на OAuth token через operator flow.
5. Положить token в local/server env:
   - `YANDEX_METRICA_OAUTH_TOKEN`
   - `YANDEX_WEBMASTER_OAUTH_TOKEN`, если token имеет Webmaster scopes.
6. Повторить:
   - `npm run yandex:check-metrica`
   - `npm run yandex:bootstrap-metrica-goals`
   - `npm run yandex:check-webmaster`
7. Если `check-webmaster` найдёт host id, положить suggested `YANDEX_WEBMASTER_HOST_ID` в server env.

## Не реализовывалось

- реальные импорты Метрики в analytics read model;
- реальные импорты Вебмастера в analytics read model;
- OAuth callback route;
- обмен authorization code на token внутри production app;
- подключение счётчика Метрики на public site;
- UI управления интеграциями;
- миграции.

## Git status

Ожидаемые изменения текущей задачи:

- modified: `package.json`
- added: `scripts/yandex/*`
- added: `tests/yandex-bootstrap-tooling.test.js`
- added: `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- added: `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`

Также в рабочем дереве остаются изменения предыдущей env-contract задачи:

- modified: `.env.example`
- modified: `compose.yaml`
- modified: `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- untracked: `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`

Pre-existing `docs/out/*` deletions не трогались.
