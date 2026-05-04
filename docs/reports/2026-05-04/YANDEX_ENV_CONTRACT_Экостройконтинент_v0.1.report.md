# YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1

Дата: 2026-05-04  
Ветка: `feat/seo-visibility-dashboard`

## Executive verdict

Env-контракт для будущих интеграций Яндекс Метрики, Яндекс Вебмастера и Яндекс OAuth добавлен без подключения API, без миграций и без изменения runtime-логики приложения.

Реальные секреты, OAuth tokens и client secret в репозиторий не добавлялись.

## Изменённые файлы

- `.env.example`
- `compose.yaml`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`

## Добавленные env-переменные

Секция в `.env.example`:

```dotenv
# Yandex integrations / SEO Dashboard
PUBLIC_SITE_URL=
NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false
NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID=
YANDEX_OAUTH_CLIENT_ID=
YANDEX_OAUTH_CLIENT_SECRET=
YANDEX_OAUTH_REDIRECT_URI=
YANDEX_METRICA_COUNTER_ID=
YANDEX_METRICA_OAUTH_TOKEN=
YANDEX_WEBMASTER_OAUTH_TOKEN=
YANDEX_WEBMASTER_HOST_ID=
```

`compose.yaml` обновлён: все переменные проброшены в `app` container через env passthrough. Для новых переменных добавлены пустые/default значения, чтобы обновление compose не ломалось, если server `.env` ещё не заполнен.

## Public vs server-only

Public/browser-safe:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED`
- `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`

Server/runtime only:

- `PUBLIC_SITE_URL`
- `YANDEX_OAUTH_CLIENT_ID`
- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_OAUTH_REDIRECT_URI`
- `YANDEX_METRICA_COUNTER_ID`
- `YANDEX_METRICA_OAUTH_TOKEN`
- `YANDEX_WEBMASTER_OAUTH_TOKEN`
- `YANDEX_WEBMASTER_HOST_ID`

Важно: `NEXT_PUBLIC_*` значения могут попадать в клиентский bundle. Секреты и OAuth tokens не имеют префикса `NEXT_PUBLIC_` и не должны отдаваться в браузер, read model, логи или admin UI.

Для будущего клиентского кода Next.js `NEXT_PUBLIC_*` значения могут потребоваться на build-time. Текущий runtime passthrough в `compose.yaml` не считается подключением счётчика Метрики и не заменяет отдельное решение по build-time env, если оно понадобится.

## Документация по секретам

В deploy/compose contract добавлена секция `Yandex SEO Dashboard integration variables`.

Зафиксировано:

- реальные значения должны жить в server env / Docker secrets / deployment secrets;
- `.env.example` содержит только placeholders;
- OAuth tokens и client secret нельзя логировать;
- analytics read model не должен содержать tokens/secrets;
- admin UI может показывать только status и masked ids, но не secrets.

## Что нужно сделать вручную на сервере

После merge/deploy инфраструктурный оператор должен положить реальные значения в canonical runtime env:

- `/opt/ecostroycontinent/runtime/.env`
- либо другой принятый deployment secret/env механизм, если он будет введён позже.

Минимально для будущего включения:

- `PUBLIC_SITE_URL`
- `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`
- `YANDEX_METRICA_COUNTER_ID`
- `YANDEX_OAUTH_CLIENT_ID`
- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_OAUTH_REDIRECT_URI`
- OAuth tokens для Метрики и Вебмастера, когда будет принят безопасный token provisioning flow.

## Что не реализовывалось

- импорт Яндекс Метрики;
- импорт Яндекс Вебмастера;
- OAuth callback route;
- scripts/yandex;
- подключение счётчика Метрики на public site;
- цели Метрики;
- UI управления интеграциями;
- миграции;
- production secrets changes.

## Проверки

- `git diff -- .env.example compose.yaml docs/selectel/...` — проверен diff, реальные значения не добавлены.
- `rg` по Yandex/env/token-like паттернам — не найдено реальных OAuth tokens/client secret.
- Проверка `.env.example` скриптом:
  - `YANDEX_OAUTH_CLIENT_SECRET`: empty
  - `YANDEX_METRICA_OAUTH_TOKEN`: empty
  - `YANDEX_WEBMASTER_OAUTH_TOKEN`: empty
- `git diff --check` — ошибок whitespace не найдено; PowerShell сообщил только стандартные предупреждения о будущей CRLF-нормализации.
- `compose.yaml` разобран через Python/YAML: `YAML_OK`, services: `app,sql`.

Локальная команда `docker compose --env-file .env.example -f compose.yaml config --quiet` не выполнена: установленный Docker CLI на этой Windows-машине не содержит compose v2 subcommand. Это не меняет контракт, но полноценную compose-config проверку лучше выполнить на canonical VM/runner.

## Git status

На момент подготовки отчёта ожидаемые изменения:

- modified: `.env.example`
- modified: `compose.yaml`
- modified: `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- added: `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`

Pre-existing `docs/out/*` deletions не трогались.
