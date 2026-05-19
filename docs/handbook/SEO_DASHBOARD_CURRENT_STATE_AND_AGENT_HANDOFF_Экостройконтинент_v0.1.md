# SEO Dashboard Current State and Agent Handoff Экостройконтинент v0.1

## 1. Назначение документа

Этот документ - entry point для будущих агентов по текущему состоянию SEO Dashboard / Yandex analytics foundation. Он не заменяет PRD и контракты; он помогает быстро понять границы реализации без истории старых чатов.

Launch-hardening current state now lives in `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`. Read it first for readiness, smoke, media delivery and known owner/content blockers.

Current roadmap for this domain: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`.

## 2. Executive current state

- SEO Dashboard MVP backend/foundation реализован.
- `/admin/visibility` существует как первичная техническая визуализация analytics read model.
- First-party event endpoint `/api/analytics/events` реализован.
- Analytics read model MVP реализован.
- Yandex Webmaster подключен и verified.
- Yandex Metrica counter `109037342` доступен, 11 required goals созданы.
- Scheduled imports Яндекс Метрики/Вебмастера еще не реализованы.
- Public Metrica counter script реализован и включен в production после owner prototype-stage approval; enablement остается env-controlled and reversible.
- LLM provider/UI не подключались.
- `/about` и `/contacts` опубликованы в production и отдают `200` (verified 2026-05-19): есть published Content Core pages `Page(type=about)` и `Page(type=contacts)` с `active_published_revision_id`; sitemap включает оба URL.
- R1 implementation deployed on 2026-05-19 at commit `64599542d2da214378298356f5afe1002b1ff5f5`: internal telemetry remains operational truth; optional Metrica mirror is implemented as env-gated external mirror.
- R1 public Metrica enablement deployed on canonical runtime at commit `90896a9e4015864f15fb633cfc2259af8cce99cb`: `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true`, counter `109037342`, conservative init options, browser/network reachGoal proof passed. Yandex Reporting API stats visibility for visits/goals was still delayed/pending as of `2026-05-19T10:19:00Z`.
- R2/R3 PRD and Blueprint drafts are created and refined for external imports. R2A is implemented and accepted on canonical runtime at commit `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`: dry-run/write commands exist, `external_metrica_daily_aggregate` stores minimal daily traffic/goals, `analytics_source_sync_state` for `yandex_metrica` is `ok`, and same-period rerun is idempotent.
- R3A `Webmaster Host / Indexation / Query Visibility Dry Run` is implemented and accepted on canonical runtime at commit `8a8e2e5ea6668375637fc4fdd16ea3b2e77a22c8`: dry-run/write commands exist, dedicated `external_webmaster_*` tables store host/indexation/URL sample rows, `analytics_source_sync_state` for `yandex_webmaster` is `ok`, and same snapshot/period rerun is idempotent. Query analytics was capability-checked but returned `0` rows for the accepted period.
- R4 Readiness Audit is complete. Full R4 is not recommended yet.
- R4-lite PRD/Blueprint are created: `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md` and `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`.
- R4-lite `External Source State and Readiness Integration` is implemented and accepted on canonical runtime at code commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`. The read model exposes `external_source_readiness` for `yandex_metrica` and `yandex_webmaster`; `/admin/visibility` renders compact source readiness diagnostics; Metrica zeros and absent Webmaster query rows remain limitations, not primary metrics or recommendation triggers.
- R3B PRD/Blueprint drafts are created: `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md` and `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`. Implementation is not started. Next step is review R3B design, then implement R3B if approved.

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
- Яндекс Метрика - optional external mirror/aggregate layer, не замена first-party events и не operational source of truth.
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
- R2A server-side Metrica aggregate importer.
- `external_metrica_daily_aggregate`.
- `analytics_source_sync_state` row for `yandex_metrica` from accepted R2A import.
- R3A server-side Webmaster import foundation.
- `external_webmaster_host_snapshot`, `external_webmaster_indexation_snapshot`, `external_webmaster_url_sample`, `external_webmaster_query_visibility_daily`.
- `analytics_source_sync_state` row for `yandex_webmaster` from accepted R3A import.
- R4-lite `external_source_readiness` block in analytics read model.
- Compact `/admin/visibility` source readiness diagnostics for Metrica/Webmaster.

## 6. What is intentionally not implemented yet

- Delayed external Yandex Reporting API visibility for the live Metrica goal smoke; browser/network proof already passed.
- Scheduled Yandex Metrica imports beyond operator-triggered R2A.
- Scheduled Yandex Webmaster imports beyond operator-triggered R3A.
- Full real external aggregate/evidence integration in read model.
- Lead/intake domain as a separate future epic; intent events are not lead records.
- LLM provider integration.
- LLM UI.
- Visual pixel heatmap.
- Owner reduced DTO.
- Full UX/UI design of `/admin/visibility`.

## 7. Public about/contacts current state

`/about` и `/contacts` больше не являются content-state blocker.

Факт на 2026-05-19: в `published_only` режиме оба маршрута отдают `200`, потому что существуют опубликованные Content Core pages `Page(type=about)` и `Page(type=contacts)` с `active_published_revision_id`. `app/about/page.js` и `app/contacts/page.js` остаются честными: при отсутствии published page они вызывают `notFound()` и не должны получать hardcoded fallback content. `app/sitemap.js` теперь корректно публикует `/about` и `/contacts`, так как live routes разрешаются в `200`.

Не создавать fake content и не добавлять fallback content без Content Core решения. Если эти pages когда-либо пропадут из published state, правильный repair path остается через Admin Console / Content Core workflow, а не через route fallback.

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

1. Review R1 implementation/conformity/final enablement reports:
   `docs/reports/2026-05-19/R1_PUBLIC_TELEMETRY_METRICA_MIRROR_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   `docs/reports/2026-05-19/R1_PUBLIC_TELEMETRY_METRICA_MIRROR_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R1_METRICA_PUBLIC_ENABLEMENT_AND_FINAL_SMOKE_Экостройконтинент_v0.1.report.md`.
2. Review R2/R3 design docs:
   `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`,
   `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`,
   `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`,
   `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`,
   `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.
3. Optionally rerun delayed Yandex Reporting API stats visibility check for `click_to_call` after processing delay.
4. Review R2A implementation/conformity reports:
   `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
5. Review R3A implementation/conformity reports:
   `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
6. Review R4-lite implementation/conformity reports:
   `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
7. Review R4 readiness/design docs:
   `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`,
   `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`,
   and `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`.
8. Review R3B design docs:
   `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
   and `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`.
9. Recommended next implementation slice after review: R3B query/page visibility import, unless the team explicitly chooses R2B Metrica source/device/region/landing dimensions first.
10. Implement only the chosen sub-slice; no direct UI -> Yandex API and no read model request-path external API calls.
11. UX/UI refine `/admin/visibility` only after real data shapes the workflow.
12. Later LLM Copilot Safety Gate and UI.

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
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
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
