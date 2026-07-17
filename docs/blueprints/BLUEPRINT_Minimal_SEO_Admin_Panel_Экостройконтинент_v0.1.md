# Blueprint: Minimal SEO Admin Panel

Дата: 2026-05-20
Проект: Экостройконтинент
Статус: technical design / implementation not started

## 1. Current Architecture

Existing pieces:

- `/admin/visibility` exists as the current technical dashboard surface.
- `/api/admin/visibility/read-model` exists and requires admin auth.
- `buildSeoDashboardReadModel` builds a prepared DTO.
- `external_source_readiness` exists in the read model.
- `external_evidence` exists in the read model.
- `components/admin/SeoVisibilityDashboard.js` exists and already renders overview, pages, semantic click map, recommendations, traffic sources, external evidence and diagnostics.
- First-party telemetry enters through `/api/telemetry/events`.
- Public UI does not call Yandex Reporting/Webmaster APIs directly.
- R2B/R3A/R3B imports write to project-owned storage.

Important current boundaries:

- internal telemetry is operational truth for public user actions;
- Yandex Metrica is external aggregate enrichment;
- Yandex Webmaster is external search/indexation evidence;
- Content Core is route/page/publication truth;
- recommendations are not part of this domain.

## 2. Proposed Architecture

The Minimal SEO Admin Panel should be a UI-only domain over the existing read model.

Rules:

- UI consumes `/api/admin/visibility/read-model` only.
- UI does not query SQL directly.
- UI does not call live Yandex APIs.
- UI does not add new backend imports.
- UI does not add scheduled jobs.
- UI does not require migrations.
- UI does not need new read model fields unless a small contract gap is found and explicitly documented.
- Any small read model addition must remain additive, compact and safe.

Preferred implementation route later:

```text
admin auth
-> /api/admin/visibility/read-model
-> SeoVisibilityDashboard or small child components
-> cards/tables/limitations
```

## 3. UI Data Contract

Use existing DTO as much as possible.

### Top Summary

Read from:

- `period`;
- `overview.visits`;
- `overview.contact_actions`;
- `overview.organic_visits`;
- `overview.data_warnings`;
- `external_source_readiness`;
- `warnings`;
- `limitations`.

Display:

- selected period;
- first-party visits/actions;
- source states;
- freshness/actionability labels;
- limitation count.

### Traffic Composition

Read from:

- `external_evidence.yandex_metrica.traffic_sources`;
- `external_evidence.yandex_metrica.source_details`;
- `external_evidence.yandex_metrica.devices`;
- `external_evidence.yandex_metrica.geography`;
- `external_evidence.yandex_metrica.limitations`.

Display:

- top sources;
- optional source details;
- devices;
- countries/regions;
- visits/users/pageviews as external evidence.

### Landing Pages

Read from:

- `external_evidence.yandex_metrica.landings`;
- `source_diagnostics.unmapped_urls`;
- `page_list` for Content Core route/page context when useful.

Display:

- landing path;
- normalized URL when safe and useful;
- mapped `page_path`, `entity_type`, `entity_id`;
- visits/users/pageviews;
- mapped/unmapped count;
- unmapped diagnostics.

### Internal Actions

Read from:

- `overview.contact_actions`;
- `page_list`;
- `selected_page_detail.intent_events_summary`;
- `selected_page_detail.behavior_summary`;
- `semantic_click_map`;
- `traffic_sources` for first-party source rollup if still useful.

Display:

- contact actions;
- CTA views/clicks;
- click-to-call/messenger/form signals;
- gallery/FAQ/case/service interactions where present;
- semantic click map.

### Search / Webmaster

Read from:

- `external_source_readiness.yandex_webmaster`;
- `external_evidence.yandex_webmaster.host_indexation`;
- `external_evidence.yandex_webmaster.url_samples`;
- `external_evidence.yandex_webmaster.query_visibility`;
- `external_evidence.yandex_webmaster.limitations`.

Display:

- host verification/status;
- searchable/excluded pages;
- site problem counts;
- URL samples summary and compact rows;
- query rows if present;
- query zero-row limitation when absent.

### Data Limitations

Read from:

- root `warnings`;
- root `limitations`;
- `external_source_readiness.*.limitations`;
- `external_evidence.*.limitations`;
- section-level limitations.

Display:

- visible limitation list grouped by source;
- stale/failed/not_configured states;
- low sample size;
- zero values;
- absent query rows;
- missing lead domain.

### Existing Recommendations

`recommendations` may already exist in the read model from earlier deterministic issue detection.

For this domain:

- do not create new recommendations;
- do not add new recommendation rules;
- keep existing recommendations separated from the minimal panel body or label them as existing system notes;
- do not make external thin/zero data feed recommendation output.

## 4. Component Plan

Implementation may keep the current `SeoVisibilityDashboard` file if project style prefers incremental evolution, or split into child components.

Recommended child components:

- `SeoAdminSummaryCards`
- `SeoTrafficSourcesPanel`
- `SeoDeviceGeoPanel`
- `SeoLandingPagesPanel`
- `SeoInternalActionsPanel`
- `SeoWebmasterPanel`
- `SeoDataLimitationsPanel`

Optional existing sections to preserve/reuse:

- current period selector;
- source badges;
- overview cards;
- semantic click map;
- diagnostics block.

Avoid large layout churn unless needed for clarity.

## 5. UI Rules

- Use simple cards and compact tables.
- Preserve existing admin shell.
- Do not create a marketing landing page.
- Do not introduce BI filters, cubes or arbitrary query language.
- Do not introduce visual heatmap/session replay.
- Do not add complex charts in first implementation.
- Keep source labels visible: first-party/internal vs external.
- Keep limitations visible.
- Keep data dense enough for admin scanning.
- Make empty states explicit and non-alarming.
- Use the already supported period selector if possible.
- Stay responsive enough for tablet/small laptop admin use.

## 6. Empty / Thin Data Behavior

### No external rows

Show source status and a clear empty state:

- "External evidence is not available for this period."
- Do not show zero demand.
- Do not hide source readiness.

### All Metrica values zero

Show:

- zero external values;
- `external_metrica_all_values_zero` or equivalent limitation;
- reminder that primary overview remains first-party.

### Low sample size

Show:

- `low_external_sample_size`;
- reduced actionability label;
- avoid trend/quality conclusions.

### Webmaster query rows absent

Show:

- row count `0`;
- `webmaster_query_visibility_no_rows_for_period`;
- `no_zero_demand_claim`;
- no low CTR or query opportunity display.

### Source stale

Show:

- stale badge;
- last successful time/period if available;
- data may be incomplete.

### Source failed

Show:

- failed badge;
- safe error message only;
- no raw response.

### Source not configured

Show:

- not configured badge;
- section empty state;
- no zero metrics.

## 7. Security And Privacy

Required:

- no secrets;
- no OAuth tokens;
- no Authorization headers;
- no raw external API responses;
- no raw events;
- no raw sessions;
- no form values;
- no IP/user agent;
- no user/session/lead attribution from Metrica/Webmaster;
- no browser-side external API calls;
- admin route remains auth-protected.

The UI must not expose read model fields with unsafe keys if future DTO additions appear.

## 8. Tests Required Later

When implementation starts, add/update tests for:

1. Panel renders with existing read model.
2. Panel renders with empty `external_evidence`.
3. Metrica source/device/geo/landing data is visible.
4. Webmaster host/indexation data is visible.
5. Webmaster query zero-row limitation is visible.
6. Internal events/actions are visible.
7. Limitations are visible.
8. Primary metrics are not overwritten by external data.
9. No direct Yandex API calls appear in UI/browser code.
10. Auth route remains protected.
11. No secrets/raw responses appear in rendered response.
12. Build passes.

Suggested targeted tests:

- `tests/admin-visibility-ui.test.js`
- `tests/analytics-read-model.test.js` only if a tiny additive read model gap is introduced.

## 9. Server Acceptance Plan

After future implementation:

1. Build and deploy through existing workflow.
2. Authorized request to `/api/admin/visibility/read-model?period=28` returns `ok`.
3. Authorized `/admin/visibility?period=28` opens.
4. Minimal SEO panel sections are visible:
   - summary;
   - traffic composition;
   - landing pages;
   - internal actions;
   - Webmaster/search;
   - limitations.
5. Current canonical runtime Metrica evidence appears:
   - source/detail/device/country/region/landing;
   - `/` and `/contacts` landing paths if data remains current.
6. Current canonical runtime Webmaster evidence appears:
   - host/indexation;
   - URL sample;
   - query zero-row limitation.
7. Primary overview remains first-party.
8. No new recommendations are created from external evidence.
9. No secrets appear in HTML or JSON response.
10. No direct external API call is visible in browser/network path.

## 10. Rollback

Rollback is UI-only:

- revert the minimal panel UI commit;
- keep read model and data foundation unchanged;
- no DB rollback;
- no import rollback;
- no source state rollback.

## 11. Implementation Guardrails

- Do not touch import scripts.
- Do not add migrations.
- Do not run new imports.
- Do not add scheduled jobs.
- Do not connect LLM.
- Do not add lead/intake.
- Do not implement R5 recommendations.
- Do not mutate Content Core.
- Do not delete `docs/out`.
