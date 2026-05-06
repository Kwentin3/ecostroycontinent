# SEO Dashboard Implementation Report — Экостройконтинент v0.1

Дата: 2026-05-04
Branch: `feat/seo-visibility-dashboard`
Commit: `feat: add SEO visibility dashboard MVP` (final hash: see `git log -1 --oneline`)

## Executive Verdict

MVP фичи “Дашборд видимости, трафика и конверсии” реализован как production-oriented first slice:

- `/admin/visibility` создан и защищён admin-auth контуром.
- UI action-first: сначала “Что делать сейчас”, затем метрики, страницы, detail, semantic click map, рекомендации и диагностика источников.
- UI читает подготовленный analytics read model, а не сырые Яндекс/Google/raw events.
- First-party event endpoint и validation слой добавлены.
- Lead domain показан как `not_ready` / unavailable, не как `0`.
- GSC/Yandex external contours безопасно работают без credentials через `not_configured`.
- LLM не подключался; добавлен только task-specific context packet builder поверх read model.

## Files Changed

Runtime / UI:

- `app/admin/(console)/visibility/page.js`
- `app/api/admin/visibility/read-model/route.js`
- `app/api/analytics/events/route.js`
- `components/admin/SeoVisibilityDashboard.js`
- `components/admin/SeoVisibilityDashboard.module.css`
- `components/admin/AdminShell.js`
- `components/public/AnalyticsTracker.js`
- `components/public/PublicRenderers.js`
- `lib/admin/nav.js`

Analytics layer:

- `lib/analytics/constants.js`
- `lib/analytics/event-schema.js`
- `lib/analytics/route-resolver.js`
- `lib/analytics/repository.js`
- `lib/analytics/aggregate.js`
- `lib/analytics/read-model.js`
- `lib/analytics/issues.js`
- `lib/analytics/content-change.js`
- `lib/analytics/llm-context.js`

DB:

- `db/migrations/008_seo_visibility_analytics.sql`

Tests:

- `tests/analytics-event-schema.test.js`
- `tests/analytics-event-route.test.js`
- `tests/analytics-route-resolver.test.js`
- `tests/analytics-issues-attribution.test.js`
- `tests/analytics-read-model.test.js`
- `tests/admin-visibility-ui.test.js`
- `tests/admin-shell.test.js`

Docs used / kept as contract package:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- `docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json`
- related reports in `docs/reports/2026-04-30/`

## Implemented

1. Minimal first-party analytics foundation:
   - allowed events from taxonomy;
   - safe payload validation;
   - sensitive metadata rejection;
   - sanitized referrer/source classification;
   - admin/bot/QA/preview exclusion;
   - route/entity resolver.

2. Event endpoint:
   - `POST /api/analytics/events`;
   - validates payload and metadata allowlist;
   - resolves route to Content Core entity where possible;
   - stores events via `analytics_event`;
   - records unmapped URL diagnostics;
   - returns safe terminal JSON errors.

3. Analytics markup and tracker:
   - `AnalyticsTracker` sends page view, semantic clicks, CTA views, gallery view/open signal and scroll depth;
   - public links/buttons now expose `data-analytics-*`;
   - no form field values are collected.

4. Daily aggregates foundation:
   - `analytics_page_daily`;
   - pure summarizer for tests;
   - SQL aggregation function excluding `is_excluded = true`.

5. Analytics read model MVP:
   - envelope, periods, source health, warnings, limitations;
   - overview metrics;
   - Yandex-first traffic source ordering;
   - search visibility placeholder/aggregate support;
   - page list;
   - selected page detail;
   - semantic click map;
   - recommendations;
   - evidence items;
   - analytics history;
   - classified content changes / attribution safety;
   - tracking change history.

6. Deterministic issue detector:
   - `low_ctr`;
   - `traffic_no_intent`;
   - `published_service_no_case`;
   - `published_service_no_media`;
   - `mobile_low_conversion`;
   - `gallery_engagement_no_conversion`;
   - `published_missing_sitemap`;
   - `published_noindexed`;
   - `weak_proof_path`;
   - `unmapped_analytics_url`.

7. Admin UI:
   - `/admin/visibility`;
   - navigation label `Видимость`;
   - Russian UI;
   - period tabs 7/28/90;
   - source badges;
   - action-first recommendations;
   - overview cards;
   - pages table;
   - selected page diagnostics;
   - semantic click map;
   - recommendations backlog;
   - source diagnostics and unmapped URL warning.

8. LLM boundary:
   - no LLM provider integration;
   - no autonomous agent;
   - `buildSeoDashboardLlmContextPacket` only builds task-specific packet from read model and excludes raw events/secrets/form values/direct SQL.

## DB Migrations

Added `008_seo_visibility_analytics.sql` with:

- `analytics_event`;
- `analytics_page_daily`;
- `external_search_visibility_daily`;
- `analytics_source_sync_state`;
- `analytics_unmapped_url_diagnostic`;
- `seo_recommendation_state`;
- `analytics_classified_content_change`;
- `analytics_tracking_change_history`.

No existing migrations were changed.

## Source Status Behavior

- `first_party_events`: defaults to `ok` when table/read model layer is available.
- `content_core`: defaults to `ok`.
- `yandex_metrica`: `not_configured` unless sync state exists.
- `yandex_webmaster`: `not_configured` unless sync state exists.
- `google_search_console`: `not_configured`.
- `lead_domain`: `not_ready`; leads are unavailable, not zero.

The UI and read model expose these states consistently.

## Security / Privacy Checks

- Event metadata uses allowlist.
- Form values are rejected.
- Token/secret-like root fields and metadata keys are rejected.
- Admin-authenticated public browsing is marked excluded.
- Bot/QA/preview/internal route traffic is marked excluded.
- Business aggregates exclude `is_excluded = true`.
- Read model does not expose raw events, raw sessions, IP, raw user agent, tokens, secrets, form values or direct SQL.
- External API credentials are not added, not logged and not stored.

## Content Change Attribution Safety

Implemented minimal classified content change layer:

- detects changed scopes and change types;
- marks mixed changes;
- sets `attribution_safety`;
- flags tracking changes near publication;
- flags insufficient after-period;
- generates monitoring windows;
- never claims causality automatically.

Allowed UI/LLM phrasing remains “после изменения”, “на фоне изменений”, “есть сигнал к проверке”, not “из-за title/CTA/FAQ”.

## Tests Run

Targeted:

```text
node --experimental-specifier-resolution=node --test tests/analytics-*.test.js tests/admin-visibility-ui.test.js tests/admin-shell.test.js
Result: 26 passed, 0 failed
```

Full:

```text
npm test
Result: 440 passed, 0 failed
```

Build:

```text
npm run build
Result: success
Routes include /admin/visibility, /api/admin/visibility/read-model, /api/analytics/events
```

Runtime smoke:

```text
GET http://localhost:3000/admin/visibility
Result: 307 -> /admin/login

POST http://localhost:3000/api/analytics/events with unknown event_type
Result: 400 INVALID_EVENT
```

Dev server started for review:

```text
http://localhost:3000
```

## Intentionally Deferred

- Real Yandex API imports: no credentials/config contract was present; UI/read model show safe `not_configured`.
- Google Search Console integration: second contour, safe `not_configured`.
- Lead/intake domain: not designed here; leads remain unavailable.
- Visual pixel heatmap: explicitly out of MVP; semantic click map implemented.
- Autonomous LLM agent/provider calls: explicitly not implemented.
- Content generation/autopublish from dashboard: not implemented.
- Multi-touch attribution / BI query builder: not implemented.

## Known Limitations

- Without migrated DB tables, event writes/read model storage require migration `008`.
- With no first-party events yet, metrics will be empty and recommendations mostly content/proof-path based.
- External search visibility is ready as storage/read model shape but needs a future import job.
- Current public site has no full public lead form; `form_start/form_submit` are supported by taxonomy and endpoint but not broadly emitted.

## Git Status Notes

Pre-existing unrelated working tree state remains:

- `docs/out/*` deletions were already present before this implementation route.
- They were not touched, restored or included in implementation scope.

Scoped implementation status before final commit:

```text
M components/admin/AdminShell.js
M components/public/PublicRenderers.js
M lib/admin/nav.js
M tests/admin-shell.test.js
?? app/admin/(console)/visibility/
?? app/api/admin/visibility/
?? app/api/analytics/
?? components/admin/SeoVisibilityDashboard.js
?? components/admin/SeoVisibilityDashboard.module.css
?? components/public/AnalyticsTracker.js
?? db/migrations/008_seo_visibility_analytics.sql
?? lib/analytics/
?? tests/admin-visibility-ui.test.js
?? tests/analytics-event-route.test.js
?? tests/analytics-event-schema.test.js
?? tests/analytics-issues-attribution.test.js
?? tests/analytics-read-model.test.js
?? tests/analytics-route-resolver.test.js
```

Final status after commit:

```text
git status -sb
## feat/seo-visibility-dashboard
D docs/out/* (pre-existing unrelated deletions only)
```

Runtime code outside the requested feature surface was not changed.

## Next Steps

1. Apply migration `008` in target environment.
2. Let first-party events collect for at least one full period.
3. Implement Yandex Metrica/Webmaster import adapters with env/secret-backed credentials.
4. Design lead/intake domain before showing lead conversion.
5. Add monitoring job for after-period recommendation checks.
