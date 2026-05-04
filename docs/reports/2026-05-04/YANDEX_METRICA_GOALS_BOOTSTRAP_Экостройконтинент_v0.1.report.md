# YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1

Дата: 2026-05-04  
Проект: Экостройконтинент  
Ветка: `feat/seo-visibility-dashboard`  
Canonical runtime: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`  
Runtime image state: deployed app container `repo-app-1`

## 1. Executive Verdict

**Успешно.**

Bootstrap Яндекс Метрики для SEO Dashboard MVP закрыт на canonical server runtime:

- OAuth token для Метрики присутствует в server env;
- счётчик Метрики `109037342` доступен через API;
- счётчик принадлежит проекту `Экостройконтинент`;
- все 11 required JavaScript/action goals для SEO Dashboard events уже существуют;
- повторный `bootstrap-metrica-goals` отработал идемпотентно;
- новые дубли целей не созданы;
- `missing: []`;
- `needs_review: []`;
- `failed: []`;
- Яндекс Вебмастер после проверки остался `VERIFIED`.

Реальные OAuth tokens, refresh token, client secret и authorization code в отчёт не включались.

## 2. Scope

Эта приёмка закрывает только bootstrap Метрики:

- server env readiness;
- API-доступ к счётчику;
- проверка списка целей;
- создание недостающих целей, если бы они отсутствовали;
- итоговая проверка целей;
- sanity-check Вебмастера.

Не реализовывалось:

- импорт Метрики в analytics read model;
- подключение счётчика Метрики на public site;
- изменение `/admin/visibility`;
- изменение UI;
- OAuth callback route;
- миграции;
- LLM;
- visual heatmap;
- изменение runtime-кода.

## 3. Documents Reviewed

Перед серверной проверкой перечитаны/проверены релевантные локальные документы:

- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_OAUTH_SERVER_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`

Ключевые подтверждённые ограничения:

- Метрика — Yandex-first внешний aggregate layer, но не замена first-party events.
- First-party events остаются обязательным project-owned слоем для `Content Core` mapping.
- UI/read model не должны ходить напрямую в Яндекс API.
- На этом этапе не включается публичный счётчик Метрики и не делается импорт данных.

## 4. Branch And Commit Context

Локальная ветка перед отчётом:

```text
feat/seo-visibility-dashboard
```

Последние релевантные commits:

```text
c524f4c docs: report Yandex Webmaster verification
6b248d0 feat: add Yandex Webmaster verification file
392adcd docs: record completed Yandex OAuth bootstrap
f2bf8ac fix: align Yandex Metrica JS goal conditions
e70354b docs: report Yandex OAuth server bootstrap readiness
```

Для текущей задачи runtime-код не менялся. Использовались уже задеплоенные `scripts/yandex/*` внутри `repo-app-1`.

## 5. Server Env Readiness

Команда:

```text
docker exec repo-app-1 npm run yandex:check-env
```

Результат:

```text
status: ok
missing_required: []
missing_oauth_tokens: []
```

Required env:

```text
YANDEX_METRICA_COUNTER_ID: present, value 109037342
YANDEX_OAUTH_CLIENT_ID: present
YANDEX_OAUTH_CLIENT_SECRET: present
YANDEX_OAUTH_REDIRECT_URI: present
```

Optional/server env:

```text
YANDEX_METRICA_OAUTH_TOKEN: present
YANDEX_WEBMASTER_OAUTH_TOKEN: present
YANDEX_WEBMASTER_HOST_ID: present, value https:ecostroycontinent.ru:443
YANDEX_OAUTH_REFRESH_TOKEN: present
PUBLIC_SITE_URL: present, value https://ecostroycontinent.ru/
```

Security note:

- token/secret значения tooling выводит только как `present`;
- реальные token/client secret/refresh token в stdout не печатались.

## 6. Metrica Check Before Bootstrap

Команда:

```text
docker exec repo-app-1 npm run yandex:check-metrica
```

Результат:

```text
status: ok
counter_id: 109037342
counter.name: Экостройконтинент
counter.status: Active
counter.permission: own
counter.site: ecostroycontinent.ru
existing_goals_count: 11
needs_review: []
missing: []
```

Required goals already existed:

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

Вывод: доступ к API Метрики работает, счётчик доступен, все цели уже присутствуют до повторного bootstrap.

## 7. Metrica Goals Bootstrap

Команда:

```text
docker exec repo-app-1 npm run yandex:bootstrap-metrica-goals
```

Результат:

```text
status: ok
counter_id: 109037342
before.existing_goals_count: 11
before.missing: []
created: []
failed: []
after.existing_goals_count: 11
after.missing: []
after.needs_review: []
```

Already existed before bootstrap:

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

Created during this run:

- none

Needs review:

- none

Failed:

- none

Вывод: bootstrap идемпотентен. Поскольку все нужные цели уже существовали по condition/action, дубли не создавались.

## 8. Final Metrica Check

Повторная команда:

```text
docker exec repo-app-1 npm run yandex:check-metrica
```

Финальный результат:

```text
status: ok
counter_id: 109037342
existing_goals_count: 11
already_existed: all 11 required goals
needs_review: []
missing: []
```

Итоговое покрытие required goals:

| Goal | State |
| --- | --- |
| `click_to_call` | exists |
| `click_to_telegram` | exists |
| `click_to_whatsapp` | exists |
| `form_start` | exists |
| `form_submit` | exists |
| `cta_click` | exists |
| `contact_link_click` | exists |
| `gallery_open` | exists |
| `faq_expand` | exists |
| `case_card_click` | exists |
| `service_link_click` | exists |

## 9. Webmaster Sanity Check

Команда:

```text
docker exec repo-app-1 npm run yandex:check-webmaster
```

Результат:

```text
status: ok
hosts_count: 1
configured_host_id_status: found
host_id: https:ecostroycontinent.ru:443
verified: true
verification_state: VERIFIED
verification_type: HTML_FILE
latest_verification_time: 2026-05-04T21:35:47.234+03:00
next_actions: []
```

Вывод: bootstrap Метрики не сломал Вебмастер env/token state.

## 10. Security And Privacy Checks

Проверено:

- `YANDEX_METRICA_OAUTH_TOKEN` не выводился полностью;
- `YANDEX_WEBMASTER_OAUTH_TOKEN` не выводился полностью;
- `YANDEX_OAUTH_REFRESH_TOKEN` не выводился полностью;
- `YANDEX_OAUTH_CLIENT_SECRET` не выводился;
- authorization code не выводился;
- `.env` не добавлялся в git;
- report не содержит реальных secrets;
- read model/UI не менялись;
- публичный счётчик Метрики на сайт не подключался;
- импорты Метрики в read model не подключались.

Security scan отчёта:

```text
No real OAuth token, refresh token, client secret or authorization code included.
```

## 11. Tests And Build

Код в этой задаче не менялся.

Поэтому не запускались:

- `npm test`
- `npm run build`

Вместо этого выполнены runtime tooling commands на canonical app container:

- `npm run yandex:check-env`
- `npm run yandex:check-metrica`
- `npm run yandex:bootstrap-metrica-goals`
- повторный `npm run yandex:check-metrica`
- `npm run yandex:check-webmaster`

Все команды завершились успешно.

## 12. What Remains Next

Следующие задачи должны быть отдельными:

1. Решить privacy/cookie posture для включения клиентского счётчика Метрики на public site.
2. Реализовать scheduled/idempotent imports Метрики в project DB/read model, если это будет утверждено.
3. Не давать UI или LLM прямой доступ к Яндекс API.
4. Сохранить first-party events как обязательный внутренний слой, даже после подключения Метрики.

## 13. Git Status

До создания этого отчёта рабочее дерево содержало только pre-existing `docs/out` deletions:

```text
## feat/seo-visibility-dashboard...origin/feat/seo-visibility-dashboard
 D docs/out/...
```

Эти удаления не исправлялись и не трогались.

После добавления отчёта ожидается новый tracked report:

```text
docs/reports/2026-05-04/YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1.report.md
```


