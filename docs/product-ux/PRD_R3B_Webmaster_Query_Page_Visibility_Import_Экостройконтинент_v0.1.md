# PRD R3B. Webmaster Query / Page Visibility Import

Дата: 2026-05-19

Проект: Экостройконтинент

Домен: SEO Dashboard / Visibility / Analytics Foundation

Русское название: R3B. Импорт поисковой видимости Яндекс Вебмастера по запросам и страницам

Статус: draft for review. Implementation not started.

## 1. Purpose

R3B нужен, чтобы получить из Яндекс Вебмастера aggregate search visibility данные по запросам и страницам, если API и доступы это позволяют.

R3B закрывает главный пробел после R3A/R4-lite: сейчас проект знает, что Webmaster host verified, indexation summary импортируется, источник свежий, но `external_webmaster_query_visibility_daily` пока не содержит query/page visibility rows.

Ожидаемый продуктовый результат R3B:

- поисковые запросы, по которым сайт виден в Яндексе;
- страницы/URL, которые получают показы и клики;
- агрегаты показов, кликов, CTR и позиции;
- ограничение по дате/периоду и устройству, если API отдаёт или позволяет запросить;
- URL mapping к Content Core routes where possible;
- unmapped URL diagnostics for routes that do not map cleanly;
- source freshness and safe failure states for `yandex_webmaster`;
- основа для будущего full R4/R5 evidence, без преждевременных recommendations.

## 2. Problem Statement

R3A доказал server-side доступ к Webmaster API, host verification, site/indexation summary, in-search URL samples and source sync state. Но R3A не дал полезных query visibility rows for the accepted period.

R4-lite теперь честно показывает `yandex_webmaster` readiness and limitation `webmaster_query_visibility_no_rows_for_period`, но SEO Manager всё ещё не видит:

- какие запросы создают поисковую поверхность;
- какие страницы видны в Яндексе;
- какие страницы получают показы без кликов;
- какие query/page пары потенциально подходят для later low CTR или content mismatch evidence.

Без R3B full R4 будет слабым: read model сможет показывать source health and indexation readiness, but not meaningful query/page SEO evidence.

## 3. Product Goal

R3B должен спроектировать и позже реализовать ограниченный import foundation для query/page visibility:

- проверить официальный endpoint/shape на canonical host;
- импортировать только aggregate query/page visibility rows;
- хранить строки в project-owned storage;
- нормализовать URL and resolve route/entity where possible;
- сохранять unmapped diagnostics instead of mutating Content Core;
- обновлять `analytics_source_sync_state` truthfully;
- честно фиксировать zero rows, unavailable endpoints, quota/date limitations and beta export delays;
- подготовить данные для future full R4/R5, without UI/read model/recommendations inside R3B.

## 4. Users / Stakeholders

- SEO Manager: needs query/page evidence later, not only source readiness.
- Superadmin: needs import status, freshness and safe errors.
- Content/editorial operator: later needs page-level query opportunity evidence.
- Future read model consumers: need compact external aggregates after R4.
- Business Owner: indirect consumer through future SEO reporting.

## 5. Scope

In scope:

- server-side import design only;
- Yandex Webmaster query/page visibility aggregate data;
- endpoint capability dry-run before write mode;
- date window selection and fallback strategy;
- device dimension if available or if importer runs separate device-specific requests;
- region dimension if selected endpoint returns it or if beta export is used;
- URL normalization;
- mapping to Content Core route/entity where possible;
- unmapped URL diagnostics;
- `analytics_source_sync_state` update for `source_system = yandex_webmaster`;
- idempotency;
- safe error mapping;
- query text safety/redaction;
- no secrets in stdout/logs/reports/UI/read model;
- no user/session/lead attribution.

Required concepts:

- query;
- URL / normalized URL / page_path;
- date or bounded period;
- device, if API returns or selected request partitions by device;
- region, if API returns or beta export is selected;
- impressions / shows;
- clicks;
- CTR, imported if available or computed if safe;
- average position / ranking;
- import period;
- source freshness;
- row count;
- unmapped URL count.

## 6. Non-goals

Out of scope:

- host/indexation snapshots already covered by R3A;
- important URLs, unless later context proves they are needed as a separate R3C slice;
- search event samples, unless deferred to a separate slice;
- full Webmaster endpoint sweep;
- scheduled imports;
- UI redesign;
- full R4 read model integration;
- recommendations;
- low CTR / query opportunity rules;
- LLM;
- lead/intake;
- user/session attribution;
- query-to-lead attribution;
- direct UI -> Webmaster API;
- browser-side Webmaster API;
- Content Core mutation;
- claiming that a specific user/session/contact/lead came from query X.

## 7. Source-of-Truth Position

Content Core remains the source of truth for:

- published pages;
- route ownership;
- active published revisions;
- content lifecycle.

Internal first-party telemetry remains operational source of truth for:

- user actions;
- contact intent;
- future operational page engagement.

Yandex Webmaster query/page data is:

- external search visibility evidence;
- aggregate only;
- delayed and API-limited;
- useful for page-level SEO analysis later;
- not user-level, not session-level and not lead attribution.

R3B rows may later support read model evidence such as "page has impressions and low CTR", but only after full R4/R5 designs define sample-size, freshness and confidence rules.

## 8. Official API Capability Baseline

Official docs checked for R3B design:

- Query analytics: `POST /v4/user/{user-id}/hosts/{host-id}/query-analytics/list`
  - Source: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics
  - It returns search query or URL statistics for the last two weeks.
  - It supports `text_indicator = QUERY | URL`, `device_type_indicator`, `search_location`, filters, sort and pagination.
  - It returns `text_indicator`, `popular_complementary_indicator`, and `statistics` rows with fields such as `IMPRESSIONS`, `CLICKS`, `CTR`, `POSITION`.
  - Important limitation: complementary indicator is the most frequent matching query for a URL or URL for a query, not a guaranteed complete query-URL pair universe.

- Popular search queries: `GET /v4/user/{user-id}/hosts/{host-id}/search-queries/popular`
  - Source: https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular
  - It returns top search queries and indicators such as `TOTAL_SHOWS`, `TOTAL_CLICKS`, `AVG_SHOW_POSITION`, `AVG_CLICK_POSITION`.
  - It is useful as a fallback/query discovery endpoint but does not provide page URL mapping.

- Advanced query analytics by URL beta:
  - Source: https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export
  - It is designed for URL/query/date/region rows with clicks, impressions and position.
  - It is async/offline, quota-limited and can take 20 minutes to 2 hours, sometimes up to 24 hours.
  - It allows data for the last 550 days, but requires a URL list and date/region parameters.

R3B implementation must verify actual access and response shape by dry-run before storing rows.

## 9. Acceptance Criteria

R3B can be considered complete only after a later implementation proves:

- selected official endpoint/shape is verified by dry-run on canonical runtime;
- query/page visibility rows import server-side, or a valid zero-row/unavailable result is recorded without fabricating rows;
- rows are stored in an appropriate project-owned table;
- `analytics_source_sync_state` is updated for `yandex_webmaster`;
- URL normalization and route/entity mapping work;
- unmapped URL diagnostics are written when URL rows cannot be mapped;
- same period/URL set rerun is idempotent;
- no unsupported API fields are fabricated;
- query text safety/redaction is applied where needed;
- no raw Authorization headers, tokens, raw request dumps or raw API responses are stored;
- no query/user/session/contact/lead joins are introduced;
- no read model/UI integration is added unless explicitly scoped as a later R4 task;
- implementation report documents endpoint choice, rows, date window, limitations, source state and acceptance result.

## 10. Risks

- The site is young and may still return zero query/page rows for valid periods.
- R3A already showed that too-fresh dates can be rejected; R3B must handle date windows conservatively.
- `query-analytics/list` may not provide a complete query-URL pair universe because it returns popular complementary indicators.
- The beta advanced export may be unavailable, delayed, quota-limited or require a multi-step async workflow.
- Query text can contain unexpected personal data; raw query storage needs safety handling.
- URL canonicalization can produce false unmapped diagnostics if scheme, host, trailing slash or tracking params are not normalized.
- CTR and position semantics differ from internal telemetry and must not be treated as conversion or engagement truth.
- Future agents may overinterpret aggregate query rows as user/session attribution.

## 11. Open Questions

- Should R3B implementation use beta advanced export as primary path, with `query-analytics/list` as fallback, or start with synchronous `query-analytics/list` because it is simpler and already probed in R3A?
- Does the project have sufficient beta export quota/access for canonical host?
- Which Content Core/public URL set should seed beta export if that path is selected: sitemap URLs, published public routes, in-search samples, or a manually bounded URL list?
- What exact date window should implementation use after checking `/pro/serp/dates` or `query-analytics/list` validation?
- Should query text be stored raw after regex redaction, or should storage add a `query_hash` / normalized query field before broader use?
- Should CTR be stored as returned by API or computed from clicks/impressions for consistency?
- Which device partitions are worth importing first: `ALL` only, or `ALL` plus `DESKTOP` / `MOBILE_AND_TABLET` later?
- What freshness threshold should future R4/R5 use for query/page visibility evidence?

## 12. References

- R4-lite implementation report: `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- R4-lite conformity audit: `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- R4 readiness audit: `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- R3 PRD: `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- R3 Blueprint: `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- Storage addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- Official Webmaster query analytics: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics
- Official Webmaster popular queries: https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular
- Official Webmaster advanced query analytics by URL beta: https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export
