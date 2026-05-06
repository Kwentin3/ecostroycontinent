# SEO Dashboard Current State and Agent Handoff Экостройконтинент v0.1

## 1. Назначение документа

Этот документ - entry point для будущих агентов по текущему состоянию SEO Dashboard / Yandex analytics foundation. Он не заменяет PRD и контракты; он помогает быстро понять границы реализации без истории старых чатов.

## 2. Executive current state

- SEO Dashboard MVP backend/foundation реализован.
- `/admin/visibility` существует как первичная техническая визуализация analytics read model.
- First-party event endpoint `/api/analytics/events` реализован.
- Analytics read model MVP реализован.
- Yandex Webmaster подключен и verified.
- Yandex Metrica counter `109037342` доступен, 11 required goals созданы.
- Scheduled imports Яндекс Метрики/Вебмастера еще не реализованы.
- Public Metrica counter script еще не включен на public site.
- LLM provider/UI не подключались.
- `/about` и `/contacts` сейчас 404 по content-state: нет опубликованных Content Core pages `Page(type=about)` и `Page(type=contacts)`.

## 3. Architecture snapshot

Цепочка слоев:

```text
sources
-> adapters
-> normalization
-> aggregates
-> analytics read model
-> UI dashboard / LLM context builders / reports
```

UI не должен собирать метрики напрямую из Яндекса, raw events или Content Core. LLM не должен собирать метрики напрямую. Analytics read model - consumer boundary для UI/LLM/reports, но не source of truth.

## 4. Source of truth boundaries

- Content Core - истина для контента и published revisions.
- `analytics_event` / aggregates - истина для first-party behavior events и производных business metrics.
- External imports - будущий слой для Яндекс/Google агрегатов.
- Analytics read model - view model / DTO для потребителей.
- Recommendation state - work-management signal, не публикация и не Content Core mutation.
- Яндекс Метрика - внешний aggregate layer, не замена first-party events.
- Яндекс Вебмастер - внешний visibility/indexation layer.
- LLM - advisory/draft-only layer, не source of truth.

## 5. What is implemented

- DB migration `008_seo_visibility_analytics.sql`.
- `analytics_event`.
- `analytics_page_daily`.
- `external_search_visibility_daily`.
- `analytics_source_sync_state`.
- `analytics_unmapped_url_diagnostic`.
- `seo_recommendation_state`.
- `analytics_classified_content_change`.
- `analytics_tracking_change_history`.
- First-party event endpoint.
- Route/entity resolver.
- Admin/bot/QA/preview exclusion.
- Read model endpoint.
- `/admin/visibility`.
- Semantic click map.
- Deterministic issue detector.
- Attribution safety.
- Yandex bootstrap tooling.
- Webmaster verification.
- Metrica goals.

## 6. What is intentionally not implemented yet

- Yandex Metrica public counter injection.
- First-party event -> `ym(..., "reachGoal", ...)` bridge.
- Scheduled Yandex Metrica imports.
- Scheduled Yandex Webmaster imports.
- Real external aggregates in read model.
- Lead/intake domain.
- LLM provider integration.
- LLM UI.
- Visual pixel heatmap.
- Owner reduced DTO.
- Full UX/UI design of `/admin/visibility`.

## 7. Critical known content-state blocker

`/about` и `/contacts` сейчас 404. Это не route-code bug.

Причина: в `published_only` режиме нет опубликованных `Page(type=about)` и `Page(type=contacts)`. `app/about/page.js` и `app/contacts/page.js` корректно вызывают `notFound()` при отсутствии published Content Core page. `app/sitemap.js` корректно не публикует эти URL, пока они разрешаются в 404.

Не создавать fake content и не добавлять fallback content без Content Core решения. Правильный следующий шаг - создать, review и publish approved Content Core pages через Admin Console / Content Core workflow.

## 8. Yandex state

- Metrica counter id: `109037342`.
- Metrica API доступен.
- 11 required goals exist.
- Webmaster host id: `https:ecostroycontinent.ru:443`.
- Webmaster verification: `VERIFIED` / `HTML_FILE`.
- Verification route exists: `/yandex_26aab3d248d69ec2.html`.
- OAuth tokens живут только в server env.
- Не логировать и не коммитить secrets, tokens, client secret или authorization code.

## 9. LLM boundary

- LLM не подключен.
- Есть context packet builder.
- Context packet строится из analytics read model.
- В packet не должны попадать raw events, SQL, secrets, form values, IP или unrestricted user agent history.
- LLM не публикует и не меняет Content Core.
- LLM обязан учитывать `attribution_safety`.
- LLM outputs advisory/draft-only и не являются canonical content.

## 10. Next recommended steps

1. Publish Content Core pages for `/about` and `/contacts`.
2. Enable Yandex Metrica counter on public site via env flag after privacy/cookie decision.
3. Add first-party event -> `ym` reachGoal bridge.
4. Live smoke: first-party event + Metrica goal.
5. Implement scheduled Metrica imports.
6. Implement scheduled Webmaster imports.
7. Integrate imported aggregates into read model.
8. UX/UI refine `/admin/visibility`.
9. Later LLM Copilot Safety Gate and UI.

## 11. Do-not-do list

- Не хардкодить secrets.
- Не коммитить `.env`.
- Не отдавать tokens в UI/read model.
- Не давать UI прямой Яндекс API.
- Не давать LLM direct SQL/raw events.
- Не считать `not_ready` leads как `0`.
- Не смешивать contact actions и leads.
- Не утверждать причинность before/after.
- Не делать visual heatmap в MVP.
- Не делать fake `/about` / `/contacts` content.
- Не коммитить случайный `docs/out` buffer drift; `docs/out` должен оставаться нейтральным delivery buffer, если задача явно не просит delivery туда.

## 12. Pointers

Primary product docs:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- `docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json`

Fresh reports:

- `docs/reports/2026-05-04/SEO_DASHBOARD_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/SEO_DASHBOARD_POST_IMPLEMENTATION_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/SEO_DASHBOARD_SERVER_ACCEPTANCE_AND_PUBLIC_ROUTES_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_OAUTH_SERVER_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1.report.md`

Key code:

- `lib/analytics/read-model.js`
- `app/api/admin/visibility/read-model/route.js`
- `app/api/analytics/events/route.js`
- `lib/analytics/aggregate.js`
- `lib/analytics/route-resolver.js`
- `lib/analytics/issues.js`
- `lib/analytics/content-change.js`
- `lib/analytics/llm-context.js`
- `scripts/yandex/*`
- `db/migrations/008_seo_visibility_analytics.sql`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/sitemap.js`
- `lib/read-side/public-content.js`
