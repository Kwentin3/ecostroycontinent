# PRD R3. Webmaster Import Foundation

Русское название: Импорт данных Яндекс Вебмастера.

Проект: Экостройконтинент.
Домен: SEO Dashboard / Visibility / Analytics Foundation.
Статус: draft for review; implementation not started.
Дата: 2026-05-19.

## 1. Purpose

R3 задает продуктовые границы импорта данных Яндекс Вебмастера в project-owned storage.

Документ нужен, чтобы команда могла отдельно реализовать внешний search/indexation layer без смешивания с Метрикой R2, read model R4, UX/UI, LLM или lead/intake.

## 2. Problem Statement

Yandex Webmaster host уже verified, но данные Вебмастера пока не импортируются в проектное хранилище.

Текущий разрыв:

- проект не хранит indexation/search visibility состояние от Яндекса;
- `/admin/visibility` не должен обращаться напрямую к Webmaster API;
- source freshness/stale/failed состояния для Вебмастера пока не появляются из реального import flow;
- Content Core знает, какие страницы опубликованы, но не знает, как Яндекс видит их в поиске;
- без import foundation нельзя надежно строить будущие page-level SEO evidence и unmapped URL diagnostics.

## 3. Product Goal

R3 должен подготовить проект к импорту данных Яндекс Вебмастера как external search/indexation enrichment layer.

Цель фазы:

- импортировать host/verification/indexation/search visibility данные, которые реально доступны через Webmaster API;
- хранить source state для `yandex_webmaster`;
- сопоставлять URL из Вебмастера с Content Core routes where possible;
- фиксировать unmapped URLs instead of silently dropping them;
- подготовить данные для будущего R4 read model integration.

## 4. Users / Stakeholders

- SEO Manager: видит, какие страницы индексируются, участвуют в поиске и имеют внешнюю поисковую поверхность.
- Superadmin: видит состояние host verification, import freshness and failures.
- Content/editorial operators: получают будущие signals about pages missing or problematic in search.
- Business Owner: косвенно видит поисковую видимость и технические blockers.

## 5. Scope

Входит в продуктовый scope R3:

- server-side importer for Yandex Webmaster API;
- host status and verification state refresh;
- general site/indexation summary where API supports it;
- indexed URL samples and in-search URL samples where API supports them;
- appeared/removed-in-search URL samples where API supports them;
- important URLs monitoring data where API supports it;
- search query and/or URL aggregate visibility data where API supports it;
- URL normalization and route/entity mapping diagnostics;
- shared source sync state for `yandex_webmaster`;
- safe error handling and no-secret reporting.

## 5.1 Implementation Sub-slices

R3 must be implemented in small sub-slices, not as a broad sweep over all Webmaster endpoints.

Recommended first slice:

### R3A. Webmaster Host / Indexation / Query Visibility Dry Run

R3A should prove API capability and storage shape before broad import:

- check `host_id` against the real verified host;
- confirm verified state;
- run dry-run endpoint capability checks before writes;
- choose a minimal endpoint set;
- import one bounded snapshot/period only after dry-run succeeds;
- write `analytics_source_sync_state` for `yandex_webmaster`;
- write only rows whose storage shape is understood;
- write unmapped URL diagnostics where URL data is imported;
- avoid read model wiring;
- avoid UI changes;
- avoid scheduler-first implementation.

Minimal R3A concepts:

- host status / verification state snapshot;
- site summary, if API returns it for the host;
- in-search URL samples, if API returns them;
- query analytics limited dry-run, if API returns page/query rows;
- `safe_error_message`;
- `rows_imported`;
- `imported_period_start` / `imported_period_end`;
- unmapped URL diagnostics where applicable.

Later R3 sub-slices:

- R3B: query/page visibility import after endpoint shape and storage are accepted.
- R3C: important URLs and search event samples.
- R3D: scheduled cadence, retention and broader URL diagnostics.

Webmaster API is heterogeneous. R3A must not assume that every desired signal is available or complete.

## 6. Non-goals

R3 не включает:

- Google Search Console parity;
- direct UI -> Webmaster API;
- replacing Content Core as truth for published pages;
- claiming a specific user/session/lead came from query X;
- lead/intake attribution;
- R2 Metrica import;
- R4 read model integration except, at most, safe source state if explicitly scoped in implementation;
- `/admin/visibility` UX redesign;
- LLM provider/UI;
- unsupported API fields invented to satisfy the PRD;
- mutating Content Core from Webmaster data.

## 7. Source-of-truth Position

Yandex Webmaster is an external search visibility/indexation layer.

Content Core remains the source of truth for:

- published pages;
- page types;
- active published revisions;
- route ownership;
- content lifecycle.

Webmaster query/search data is aggregate evidence only. It can support page-level inference, but it cannot prove user-level attribution and cannot be used as lead attribution truth.

## 8. Required Imported Concepts

R3 should import these concepts if official Webmaster API supports the selected endpoints for the verified host:

| Concept | Requirement | Notes |
| --- | --- | --- |
| Host status | Required | Host id, verified flag, host data status. |
| Verification status | Required | Must remain true for imports to be trusted. |
| Indexation summary | Required if endpoint available | General indexed/search availability state. |
| Indexed URL samples | Required if endpoint available | Sample pages indexed by Yandex. |
| In-search URL samples | Required if endpoint available | Sample pages participating in search results. |
| Search event samples | Optional | Appeared/removed in search, if endpoint available. |
| Important URLs | Optional | Only if configured/available in Webmaster. |
| Search query aggregates | Required if endpoint available | Impressions, clicks and average positions by query/page/device/date where available. |
| Sitemap/diagnostics | Optional | Only if API exposes the needed fields. |
| Unmapped URL diagnostics | Required when URL import runs | Do not silently drop unmatched URLs. |

If an expected product signal is not available through the API, implementation must mark it `unavailable` or `future`, not fabricate it.

## 9. Sync State

R3 must use shared source state vocabulary:

- `ok`: latest import completed and freshness threshold is satisfied.
- `stale`: last success exists, but imported period or host state is older than threshold.
- `failed`: latest attempt failed without usable new rows.
- `partial`: at least one endpoint succeeded and at least one required endpoint failed.
- `not_configured`: host id/token/import cadence absent or disabled.

Minimum sync state fields:

- `source_system = yandex_webmaster`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `status`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count`.

## 10. Privacy / Security

Rules:

- OAuth token stays server-side only.
- No token, refresh token or client secret in UI, browser, read model or reports.
- Webmaster imported data is aggregate/search/indexation data, not user-level attribution.
- Query data must not be joined to individual sessions/leads.
- URL diagnostics must avoid leaking secrets from query strings; tracking parameters should be normalized/stripped before storage where possible.
- Error messages must be safe.

## 11. Acceptance Criteria

R3 can be considered complete only when a later implementation proves:

- Webmaster importer runs server-side only.
- Verified host id is used without printing secrets.
- Selected endpoints are backed by official docs or a verified safe dry run.
- Imports are idempotent for the same period/endpoint.
- Source state is updated for `yandex_webmaster`.
- URL samples/query URL rows are normalized and mapped where possible.
- Unmapped URLs are diagnosed and counted.
- Unsupported endpoints/fields are reported as unavailable, not fabricated.
- UI does not call Webmaster API directly.
- Content Core remains the source of truth for published pages.
- Query data remains aggregate and is not used for user/session/lead attribution.
- Read model integration is deferred to R4 unless explicitly limited to safe source state.

## 12. Risks

- API may provide samples rather than complete page universe for some indexation views.
- Query/search data can be delayed and incomplete.
- Search query history may be limited by date range and availability.
- Some desired diagnostics may exist in the Webmaster UI but not in API form.
- URL canonicalization can produce false unmapped rows if mirrors/trailing slashes/query strings are not normalized carefully.
- Existing `external_search_visibility_daily` may fit query visibility rows but not host/indexation snapshots.

## 13. Open Questions

- Which endpoint set should be mandatory for the first R3 implementation?
- Should R3 import only query/URL search visibility first, or host/indexation summary first?
- What freshness threshold should apply to Webmaster data?
- Are important URLs configured in the Yandex Webmaster account?
- Which URL normalization rules should be shared with sitemap/public route code?
- Does implementation need new tables for host/indexation snapshots and URL samples?

## 14. References

- Roadmap: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- Current handoff: `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- Read model contract: `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- Storage direction addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- Yandex Webmaster API overview: `https://yandex.com/dev/webmaster/doc/en/`
- Host information: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-id`
- Site summary: `https://yandex.com/dev/webmaster/doc/dg/reference/host-id-summary.html`
- In-search URL samples: `https://yandex.com/dev/webmaster/doc/en/reference/hosts-indexing-insearch-samples`
- Popular search queries: `https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular`
- Query analytics: `https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics`
