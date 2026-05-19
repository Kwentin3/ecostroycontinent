# R3B Webmaster Query / Page Visibility PRD/Blueprint Design Report

Дата: 2026-05-19

Проект: Экостройконтинент

Домен: SEO Dashboard / Visibility / Analytics Foundation

Slice: R3B. Webmaster Query / Page Visibility Import

## Executive Verdict

R3B design is prepared as a documentation-only planning artifact.

Created:

- PRD R3B;
- Blueprint R3B.

R3B is scoped as a narrow query/page visibility import domain after R4-lite. It does not implement code, migrations, UI, scheduler, read model changes or production imports.

The design preserves the core strategy:

- Content Core remains truth for pages and route ownership;
- internal first-party telemetry remains operational truth for user actions;
- Yandex Webmaster query/page data is external aggregate SEO evidence only;
- no user/session/contact/lead attribution is allowed.

## Documents Reviewed

- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`

Read-only code/schema context checked:

- `scripts/yandex/import-webmaster-data.mjs`
- `scripts/yandex/webmaster-import-lib.mjs`
- `db/migrations/011_external_webmaster_import_foundation.sql`
- R4-lite report evidence for current `external_source_readiness`

## Documents Created

- `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`

## Documents Updated

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`

Updates state:

- R4-lite is closed/accepted;
- R3B PRD/Blueprint drafts are created;
- R3B implementation is not started;
- next step is review R3B docs, then implement R3B if approved.

## Official API Capabilities Checked

Official Yandex docs checked:

- Query analytics: https://yandex.com/dev/webmaster/doc/ru/reference/host-query-analytics
- Popular search queries: https://yandex.com/dev/webmaster/doc/en/reference/host-search-queries-popular
- Advanced query analytics by URL beta: https://yandex.ru/dev/webmaster/doc/ru/reference/enhanced-export
- API resources overview: https://yandex.com/dev/webmaster/doc/ru/concepts/getting-started
- In-search samples context: https://yandex.com/dev/webmaster/doc/en/reference/hosts-indexing-insearch-samples

Findings:

- `POST /v4/user/{user-id}/hosts/{host-id}/query-analytics/list` supports query/URL monitoring, two-week data window, `text_indicator=QUERY|URL`, `device_type_indicator`, filters, sorting, pagination and fields such as `IMPRESSIONS`, `CLICKS`, `CTR`, `POSITION`, `DEMAND`.
- `query-analytics/list` response has `text_indicator` and `popular_complementary_indicator`; this is useful but should not be treated as a complete query-URL pair universe.
- `GET /search-queries/popular` provides query-level indicators and query ids, but it is not page-level evidence by itself.
- Advanced query analytics by URL beta is the closest official fit for R3B because it is designed for date/host/URL/query/region/clicks/impressions/position rows.
- Beta export is asynchronous, quota-limited, URL-list based, and can take from 20 minutes to 2 hours, sometimes up to 24 hours.
- Beta export supports up to 100 URLs per request under basic access and data for the last 550 days.

## Chosen Endpoint Hypothesis

Recommended R3B endpoint strategy:

1. Primary candidate: advanced query analytics by URL beta.
2. Fallback: synchronous `query-analytics/list` in `text_indicator=URL` mode with explicit limitation.
3. Discovery/fallback only: `search-queries/popular`.

Reason:

R3B requires query/page visibility rows. The beta export is the official shape that explicitly includes URL + query + region + date + clicks + impressions + position. The synchronous query analytics endpoint is simpler and already probed in R3A, but it exposes a popular complementary indicator and should not be overclaimed as full query/page coverage.

## Storage Direction

Existing table `external_webmaster_query_visibility_daily` appears suitable for R3B if implementation normalizes rows into:

- `source_system = yandex_webmaster`;
- `host_id`;
- `date`;
- `search_engine = yandex`;
- `query`;
- `normalized_url`;
- `page_path`;
- route/entity nullable fields;
- `device`;
- country/region;
- `impressions`;
- `clicks`;
- `ctr`;
- `average_position`;
- import metadata.

Current unique key remains appropriate:

```text
source_system + host_id + date + query + normalized_url + device + country + region
```

Potential future migration is only noted, not implemented:

- add `query_hash` if raw query privacy needs stronger handling;
- add explicit `source_endpoint` / `report_shape` if beta and sync rows need stricter provenance.

## Key Limitations

- R3B data is aggregate-only.
- No user/session/contact/lead attribution.
- Query text can contain unexpected personal data; redaction/normalization is required.
- Beta export may be unavailable, quota-limited or delayed.
- Synchronous `query-analytics/list` is useful but limited to recent data and popular complementary indicators.
- Zero-row valid API results must be represented as limitations, not fabricated rows.
- R3B must not wire data into read model/UI; that belongs to later R4/full evidence work.

## Open Questions

- Should implementation use beta export first, or start with synchronous fallback for lower operational complexity?
- Does canonical host have beta export access and enough quota?
- Which URL set should seed the beta export: sitemap, published public routes, R3A in-search samples, or a bounded mixed list?
- What exact date range should implementation choose after `/pro/serp/dates` or validation response?
- Is raw query storage acceptable after regex redaction, or should implementation add query hashing first?
- Should device-specific imports be R3B initial scope or a later R3B-deepening slice?

## What Was Not Implemented

- No code.
- No migrations.
- No runtime changes.
- No UI changes.
- No read model changes.
- No production imports.
- No scheduler.
- No LLM.
- No lead/intake.
- No docs/out changes.

## Checks

Completed checks:

- `git diff --check`: passed.
- Changed file review: docs only.
- `docs/out` diff: empty.
- Secret/token scan over changed docs: no token/secret value matches.
- Runtime/code files: not changed.

Tests/build are not required because only docs are changed.

## Git Status

Branch:

```text
docs/r3b-webmaster-query-page-visibility-design
```

Commit:

```text
docs: design r3b webmaster query visibility import
```

Final status:

```text
clean after commit
```

Changed files:

- `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
