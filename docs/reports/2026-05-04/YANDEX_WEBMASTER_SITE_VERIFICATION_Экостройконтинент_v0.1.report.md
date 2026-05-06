# YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1

Дата: 2026-05-04  
Проект: Экостройконтинент  
Ветка: `feat/seo-visibility-dashboard`  
Итоговый commit: `6b248d0 feat: add Yandex Webmaster verification file`

## 1. Executive Verdict

**Успешно.**

Сайт `https://ecostroycontinent.ru/` добавлен в Яндекс Вебмастер через API и права на управление сайтом подтверждены через способ `HTML_FILE`.

Итоговое состояние на canonical server runtime:

- `hosts_count`: `1`
- `host_id`: `https:ecostroycontinent.ru:443`
- `verified`: `true`
- `verification_state`: `VERIFIED`
- `verification_type`: `HTML_FILE`
- `latest_verification_time`: `2026-05-04T21:35:47.234+03:00`

Секреты, OAuth token, refresh token, client secret и authorization code в отчёт, git diff, UI или логи намеренно не выводились.

## 2. Scope

Задача была узкой операционной задачей:

1. добавить `https://ecostroycontinent.ru/` в Яндекс Вебмастер;
2. получить способ подтверждения прав;
3. разместить подтверждающий артефакт на публичном сайте;
4. запустить проверку прав через API Яндекс Вебмастера;
5. подтвердить итоговое состояние на canonical server runtime.

Не входило в scope:

- подключение реального импорта данных Вебмастера в read model;
- изменение SEO Dashboard UI;
- подключение LLM;
- изменение Яндекс Метрики;
- изменение DNS;
- миграции БД;
- работа с production secrets вне уже принятого server env workflow.

## 3. Sources Used

Официальные документы Яндекса:

- Добавление сайта: `https://yandex.ru/dev/webmaster/doc/ru/reference/hosts-add-site`
- Пример подтверждения прав: `https://yandex.ru/dev/webmaster/doc/ru/concepts/verification`
- Запуск процедуры подтверждения прав: `https://yandex.ru/dev/webmaster/doc/ru/reference/host-verification-post`

Инфраструктурный канон проекта:

- `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- `compose.yaml`

## 4. Initial State

Перед добавлением сайта server-side tooling уже был готов:

- OAuth token для Вебмастера присутствовал в canonical server env;
- `npm run yandex:check-webmaster` выполнялся на `repo-app-1`;
- OAuth token имел нужные scopes для Webmaster API;
- `YANDEX_WEBMASTER_HOST_ID` ещё не был задан;
- Вебмастер возвращал `hosts_count: 0`.

Проверка до добавления:

```text
docker exec repo-app-1 npm run yandex:check-webmaster

status: ok
user_id: 236342411
hosts_count: 0
configured_host_id_status: missing
public_site_match: null
selected_host: null
verification: null
```

Вывод: сайт ещё не был добавлен в список сайтов пользователя Вебмастера. Одного OAuth token было недостаточно.

## 5. Site Add Operation

Сайт был добавлен через официальный API:

```text
POST https://api.webmaster.yandex.net/v4/user/{user-id}/hosts
body: { "host_url": "https://ecostroycontinent.ru/" }
```

Результат:

```json
{
  "status": "ok",
  "user_id": 236342411,
  "host_url": "https://ecostroycontinent.ru/",
  "added": {
    "host_id": "https:ecostroycontinent.ru:443"
  }
}
```

После добавления:

```text
hosts_count: 1
host_id: https:ecostroycontinent.ru:443
verified: false
verification_uin: 26aab3d248d69ec2
verification_state: NONE
applicable_verifiers: META_TAG, HTML_FILE, DNS
```

Вывод: сайт был добавлен, но права ещё не были подтверждены. Это ожидаемое поведение Яндекс Вебмастера.

## 6. Verification Method Decision

Яндекс предложил три способа:

- `META_TAG`
- `HTML_FILE`
- `DNS`

Выбран `HTML_FILE`, потому что:

- не требует доступа к DNS provider;
- не меняет layout/head всех страниц;
- проверочный код публичный и не является секретом;
- можно реализовать точечно как Next route handler;
- route handler попадает в standalone runtime image, в отличие от простой папки `public`, которая текущим `Dockerfile` не копируется в runner image.

Важная runtime-деталь:

```text
Dockerfile runner stage copies:
- .next/standalone
- .next/static
- node_modules
- package.json
- db
- scripts
- lib

public/ is not copied.
```

Поэтому вариант "просто положить файл в public" для текущего canonical runtime был бы ненадёжным.

## 7. Code Change

Добавлен route handler:

```text
app/yandex_26aab3d248d69ec2.html/route.js
```

Он отдаёт HTML-файл в формате, ожидаемом Яндексом:

```html
<!doctype html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>Verification: 26aab3d248d69ec2</body>
</html>
```

Проверочный код `26aab3d248d69ec2` является публичным verification code для сайта и не является OAuth secret.

Commit:

```text
6b248d0 feat: add Yandex Webmaster verification file
```

## 8. Build And Deploy

Локальная сборка:

```text
npm run build
```

Результат:

```text
Compiled successfully
Route present:
/yandex_26aab3d248d69ec2.html
```

GitHub Actions build:

```text
workflow: build-and-publish
run: 25336215432
status: success
headSha: 6b248d0f62b134b4bc0eb927dbc82653a31f15e4
url: https://github.com/Kwentin3/ecostroycontinent/actions/runs/25336215432
```

Published image:

```text
ghcr.io/kwentin3/ecostroycontinent-app@sha256:9f319a5bd353ab5a4611106b5405bb98b9d5292e61702510e4c3af8aa6c0c46e
```

Deploy:

```text
workflow: deploy-phase1
run: 25336319267
status: success
headSha: 6b248d0f62b134b4bc0eb927dbc82653a31f15e4
url: https://github.com/Kwentin3/ecostroycontinent/actions/runs/25336319267
```

Deployed container image id:

```text
sha256:88e52d81663cc855baaaa32292b6d1fc6d17ee6fec5d755985a9013095fd3916
```

## 9. Public Verification File Proof

Публичная проверка:

```text
curl -k -i https://ecostroycontinent.ru/yandex_26aab3d248d69ec2.html
```

Результат:

```text
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Cache-Control: public, max-age=300

<body>Verification: 26aab3d248d69ec2</body>
```

Вывод: Яндекс может получить verification file с корня публичного сайта.

## 10. Webmaster Verification API Run

Запущена процедура подтверждения прав:

```text
POST https://api.webmaster.yandex.net/v4/user/236342411/hosts/https%3Aecostroycontinent.ru%3A443/verification?verification_type=HTML_FILE
```

Ответ:

```json
{
  "status": "ok",
  "result": {
    "verification_uin": "26aab3d248d69ec2",
    "verification_state": "IN_PROGRESS",
    "verification_type": "HTML_FILE",
    "latest_verification_time": null,
    "fail_info": null,
    "applicable_verifiers": [
      "META_TAG",
      "HTML_FILE",
      "DNS"
    ]
  }
}
```

Повторная проверка после ожидания:

```text
docker exec repo-app-1 npm run yandex:check-webmaster
```

Результат:

```json
{
  "status": "ok",
  "user_id": 236342411,
  "hosts_count": 1,
  "configured_host_id_status": "found",
  "public_site_match": {
    "host_id": "https:ecostroycontinent.ru:443",
    "ascii_host_url": "https://ecostroycontinent.ru/",
    "unicode_host_url": "https://ecostroycontinent.ru/",
    "verified": true,
    "main_mirror_host_id": null
  },
  "selected_host": {
    "host_id": "https:ecostroycontinent.ru:443",
    "ascii_host_url": "https://ecostroycontinent.ru/",
    "unicode_host_url": "https://ecostroycontinent.ru/",
    "verified": true,
    "main_mirror_host_id": null
  },
  "verification": {
    "verification_uin": "26aab3d248d69ec2",
    "verification_state": "VERIFIED",
    "verification_type": "HTML_FILE",
    "latest_verification_time": "2026-05-04T21:35:47.234+03:00",
    "fail_info": null,
    "applicable_verifiers": [
      "META_TAG",
      "HTML_FILE",
      "DNS"
    ]
  },
  "next_actions": []
}
```

Вывод: права подтверждены.

## 11. Server Env Update

В canonical server env добавлено значение:

```text
YANDEX_WEBMASTER_HOST_ID=https:ecostroycontinent.ru:443
```

Контроль:

```text
docker exec repo-app-1 npm run yandex:check-env
```

Итоговые non-secret поля:

```text
YANDEX_METRICA_COUNTER_ID: 109037342
PUBLIC_SITE_URL: https://ecostroycontinent.ru/
YANDEX_WEBMASTER_HOST_ID: https:ecostroycontinent.ru:443
```

Secret-поля выводились только как `present`:

- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_METRICA_OAUTH_TOKEN`
- `YANDEX_WEBMASTER_OAUTH_TOKEN`
- `YANDEX_OAUTH_REFRESH_TOKEN`

## 12. Public Route Smoke

Smoke через canonical server ingress:

```text
200 /
200 /services
200 /cases
404 /about
404 /contacts
200 /yandex_26aab3d248d69ec2.html
```

Важно:

- verification route работает и отдаёт `200`;
- `/`, `/services`, `/cases` доступны;
- `/about` и `/contacts` возвращали `404` на момент проверки. Это зафиксировано как текущее runtime/content состояние вне scope текущей задачи; подтверждение Вебмастера не меняло эти маршруты.

## 13. Security Notes

Соблюдено:

- OAuth token не печатался полностью;
- refresh token не печатался полностью;
- client secret не печатался;
- authorization code не печатался;
- реальные secrets не добавлялись в git;
- реальные secrets не добавлялись в report;
- реальные secrets не добавлялись в UI;
- `YANDEX_WEBMASTER_HOST_ID` не является secret и может отображаться как operational identifier;
- `verification_uin` является публичным кодом проверки владения сайтом и должен быть доступен поисковику.

## 14. Runtime Boundary

Работа выполнялась против canonical server runtime:

- server: Selectel VM;
- runtime stack: compose `repo-app-1` + `repo-sql-1`;
- app container: `repo-app-1`;
- env source: `/opt/ecostroycontinent/runtime/.env`;
- deploy path: GitHub Actions `build-and-publish` + `deploy-phase1`;
- no local Windows DB used.

Не создавалась вторая SQL truth.

## 15. Remaining Notes

Готово для следующих шагов:

- `npm run yandex:check-webmaster` теперь может использовать `YANDEX_WEBMASTER_HOST_ID`;
- будущий importer/read model foundation может различать Webmaster state как configured/verified;
- можно переходить к отдельной задаче импорта данных Вебмастера, если она будет запланирована.

Открытые, но не блокирующие вопросы:

- Нужно отдельно решить, оставлять ли verification route навсегда. Практически лучше оставить: Яндекс может периодически перепроверять права.
- `/about` и `/contacts` сейчас дают `404` на live smoke; если это не ожидаемое content-state поведение, нужна отдельная public routes task.

## 16. Git Status

После изменений:

```text
## feat/seo-visibility-dashboard...origin/feat/seo-visibility-dashboard
 D docs/out/...
```

Ветка синхронизирована с origin по последнему code commit `6b248d0`.

`docs/out` deletions были pre-existing и намеренно не трогались.


