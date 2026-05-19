# SEO Dashboard / Visibility / Analytics Foundation Roadmap

Дата: 2026-05-19
Проект: Экостройконтинент
Статус: roadmap / planning artifact
Scope: SEO Dashboard / Visibility / Analytics Foundation

## 1. Назначение документа

Этот документ фиксирует дорожную карту домена SEO Dashboard / Visibility / Analytics Foundation: текущее состояние, финишные уровни, последовательность этапов, зависимости, decision points и границы соседних доменов.

Цель: дать новому агенту и команде рабочий маршрут от текущего foundation-состояния к операционному SEO-продукту без опоры на старую память чатов.

Этот документ не является задачей на реализацию. Он не включает миграции, runtime changes, UI changes, включение Метрики, scheduled imports или LLM.

## 2. Current State Summary

Текущая factual baseline берется из свежего аудита:

- `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`

Фактически закрыто:

- migration `008_seo_visibility_analytics.sql` применена на canonical SQL target;
- analytics tables существуют: `analytics_event`, `analytics_page_daily`, `external_search_visibility_daily`, `analytics_source_sync_state`, `analytics_unmapped_url_diagnostic`, `seo_recommendation_state`, `analytics_classified_content_change`, `analytics_tracking_change_history`;
- `/api/analytics/events` работает, валидирует payload, генерирует server-side `anonymous_id/session_id`, исключает admin/bot/QA/preview traffic из business aggregates;
- analytics read model endpoint работает под auth и не отдает secrets, tokens, raw events, raw sessions, IP, raw user agent, form values;
- `/admin/visibility` существует как MVP и читает prepared read model через `buildSeoDashboardReadModel`;
- Yandex Metrica API доступен, counter `109037342` активен, 11 required goals существуют;
- Yandex Webmaster host verified, verification type `HTML_FILE`;
- `/about` и `/contacts` опубликованы через Content Core, отдают `200` и включены в sitemap;
- `/robots.txt`, `/sitemap.xml`, verification route работают.

Важный текущий архитектурный шов:

- public tracker `components/public/AnalyticsTracker.js` отправляет события в `/api/telemetry/events`;
- старый SEO endpoint `/api/analytics/events` существует и работает, но public tracker не должен напрямую ходить туда;
- tests enforce no direct `/api/analytics/events` and no direct `ym()` from public UI;
- `lib/telemetry/adapters.js` сейчас содержит `noopTelemetryAdapter`; external analytics должны подключаться там после validation/storage;
- internal telemetry is the operational source of truth for public user actions;
- Yandex Metrica is an optional external mirror/enrichment layer, not the operational source of truth;
- next optional `reachGoal` mirror должен идти через approved telemetry adapter layer.

Пока не реализовано:

- public Yandex Metrica counter injection;
- optional telemetry event -> `ym(..., "reachGoal", ...)` mirror;
- scheduled Metrica imports;
- scheduled Webmaster imports;
- imported aggregates in analytics read model;
- lead/intake domain;
- full UX/UI refine of `/admin/visibility`;
- LLM provider/UI;
- visual pixel heatmap;
- owner reduced DTO.

Supporting documents:

- PRD: `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- Taxonomy: `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- Read model contract: `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- LLM context contract: `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- Yandex bootstrap: `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- SEO handoff: `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`

## 3. Финишные уровни

### Finish 1. Backend / Foundation Ready

Статус: закрыто.

Критерии:

- migrations applied;
- analytics tables exist;
- event endpoint works;
- read model works;
- `/admin/visibility` MVP works;
- auth/privacy boundaries pass;
- read model represents missing lead domain as unavailable/not_ready, not zero;
- UI/read model do not expose secrets, raw events or external API tokens.

### Finish 2. Public Operational Measurement Live

Статус: enabled on 2026-05-19 after owner prototype-stage approval. Server acceptance passed for internal telemetry and browser/network Metrica mirror; external Metrica stats visibility remains delayed/pending as of `2026-05-19T10:19:00Z`.

Критерии:

- public telemetry events are live and reliable;
- internal telemetry remains the primary operational source for user actions;
- telemetry events continue through `/api/telemetry/events`;
- telemetry storage can be used for future operational read model integration;
- optional Yandex Metrica counter and `reachGoal` mirror are enabled only through approved privacy/cookie posture;
- Metrica mirror does not replace internal telemetry;
- live smoke proves internal telemetry storage first;
- if Metrica mirror is enabled, smoke also proves selected Metrica goal signal after acceptable delay;
- `NEXT_PUBLIC_*` values contain only browser-safe config;
- webvisor/clickmap are not enabled unless separately approved.

### Finish 3. External Imports Into Project Storage

Статус: after Finish 2.

Критерии:

- scheduled/idempotent Metrica import exists;
- scheduled/idempotent Webmaster import exists;
- `analytics_source_sync_state` records attempts, success, failures, freshness and safe errors;
- imported aggregate rows exist in project storage;
- stale/failed/not_configured states are deterministic;
- imported data does not include secrets, raw sessions or form values.

### Finish 4. Operational SEO Dashboard

Статус: after real operational data is available.

Критерии:

- `/admin/visibility` shows real operational telemetry and source data, not only defaults/fixtures;
- SEO Manager can identify top pages/actions from read model;
- evidence items are useful and explainable;
- source freshness is visible;
- attribution safety is visible;
- recommendations are meaningful with current sample sizes and source limits.

### Finish 5. UX/UI Refined Dashboard

Статус: later.

Критерии:

- refined information architecture;
- filters and period/page controls are practical;
- page detail interaction supports investigation;
- evidence drill-down is useful;
- recommendation workflow UX exists;
- owner-safe reduced view is designed if needed.

### Finish 6. LLM Copilot Safe Enablement

Статус: future.

Критерии:

- LLM context packets are built from analytics read model only;
- eval/red-team set exists;
- provider posture is decided;
- no raw events, secrets, direct SQL, unrestricted user agents or form values reach LLM;
- no autonomous publishing or Content Core mutation;
- first scenarios are explanation and next-action drafting, not content generation/autopublish.

### Finish 7. Lead / Intake Attribution

Статус: separate adjacent domain.

Критерии:

- lead/intake domain is designed;
- contact actions are not confused with leads;
- lead attribution snapshot exists;
- qualified lead workflow exists if product needs it;
- SEO dashboard consumes lead aggregates only after lead/intake has its own source of truth.

## 4. Roadmap Governance / Domain Isolation Rules

This roadmap controls domain sequence. It is not a replacement for per-slice product and technical design.

Required delivery flow for every new implementation domain:

```text
Roadmap
-> Domain slice
-> PRD
-> Blueprint
-> Implementation
-> Server acceptance
-> Conformity audit
-> Docs / sticky comments / closure
-> Next domain
```

Rules:

- Roadmap defines order, dependencies and domain boundaries.
- PRD defines the product goal, user value, acceptance and non-goals of one domain slice.
- Blueprint defines the technical implementation, runtime boundaries, data flow, tests, acceptance method and rollback posture of one domain slice.
- A new implementation domain must not start until it has at least a short PRD and a technical Blueprint.
- Implementation must not expand scope beyond its reviewed PRD/Blueprint.
- If implementation discovers an adjacent domain, capture it as handoff/future slice instead of pulling it into current scope.
- Every domain needs an acceptance report.
- After acceptance, run a conformity audit against the PRD/Blueprint before treating the domain as closed.
- After closure, update handoff/sticky comments when architecture boundaries, source-of-truth boundaries or next steps changed.

R1-specific gate:

- Do not implement `R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror` directly from this roadmap.
- R1 PRD draft created: `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`.
- R1 Blueprint draft created: `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`.
- R1 file names keep the former working title for link stability.
- Former working title: Public Metrica Counter + Telemetry reachGoal Bridge.
- Current semantic framing: Public Telemetry Operational Measurement + Optional Metrica Goal Mirror / Операционная публичная телеметрия и опциональное зеркало целей в Метрику.
- Only after PRD/Blueprint review should implementation begin.

Reason: R1 touches privacy, public telemetry boundary, Yandex Metrica, client-side script loading, reachGoal mapping and live smoke verification. It should not be implemented from memory or directly from roadmap notes.

## 5. Roadmap Phases

### Phase R0. Current State Baseline

Status: done.

Текущая боль: после серии изменений old reports and chat memory could mislead future work, especially around `/about`, `/contacts`, Yandex readiness and telemetry boundaries.

Цель фазы: зафиксировать factual baseline and update handoff docs.

Prerequisites:

- access to repo docs;
- canonical runtime evidence for server state;
- current audit report.

Scope:

- backend/foundation audit;
- `/admin/visibility` audit;
- public `/about` and `/contacts` audit;
- sitemap consistency check;
- Yandex Metrica/Webmaster check;
- not-implemented list;
- handoff update where old docs were stale.

Non-goals:

- implementation;
- migrations;
- runtime changes;
- counter enablement;
- scheduled imports.

Deliverables:

- current state audit report;
- updated handoff/current-state docs.

Acceptance criteria:

- factual state is documented;
- next slice is explicit;
- stale `/about` and `/contacts` blockers are corrected.

Risks:

- future agents may still read older 2026-05-04 reports without the 2026-05-19 audit.

Recommended tests/smoke:

- read-only launch smoke;
- Yandex check scripts;
- auth/read-model smoke.

Next handoff:

- move to R1 PRD/Blueprint gate; do not reopen R0 unless production state changes.

### Phase R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror

Status: next.

Former working title: Public Metrica Counter + Telemetry reachGoal Bridge.

Русское смысловое название: Операционная публичная телеметрия и опциональное зеркало целей в Метрику.

Текущая боль: public telemetry already captures local actions, but R1 needs to formalize reliable operational measurement and protect the boundary before adding an optional external Metrica mirror. Yandex counter/goals are ready, but the mirror is not live.

Цель фазы: strengthen/confirm internal public telemetry as the operational measurement path and optionally mirror approved events into Metrica without making Metrica the source of truth.

Prerequisites:

- Finish 1 closed;
- Metrica counter and 11 goals verified;
- R1 PRD reviewed;
- R1 Blueprint reviewed;
- privacy/cookie posture approved;
- Metrica init options approved;
- Webvisor/clickmap/session replay explicitly approved or disabled;
- policy copy/banner requirement decided;
- allowed telemetry-to-goal mapping approved.

Scope:

- internal telemetry remains canonical for operational SEO Dashboard decisions;
- Metrica `reachGoal` is an optional mirror, not primary truth;
- R1 must not wait for scheduled imports to make internal telemetry useful;
- Metrica goal smoke is useful but not the only success signal;
- operational telemetry smoke proves `/api/telemetry/events` storage first;
- env-gated Metrica script injection;
- counter id from browser-safe public config only;
- no secrets in browser;
- bridge implementation through the technical scheme approved in R1 Blueprint;
- preserve telemetry adapter/boundary discipline and avoid direct UI-owned external analytics calls;
- map validated telemetry events to Metrica goals;
- keep `/api/telemetry/events` as public ingestion boundary;
- live smoke: internal telemetry storage first; optional Metrica goal signal second if enabled.

R1 Technical Design Questions for Blueprint:

- Где физически исполняется Metrica bridge: client-side, server-side или hybrid?
- `ym()` is a browser function. If an adapter executes server-side after `/api/telemetry/events`, direct `ym()` calls are impossible there.
- If bridge is client-side, how does the design preserve the principle that public tracker remains the single telemetry boundary?
- If bridge is server-side, which officially supported Yandex Metrica mechanism is used, if any?
- How are direct `ym()` calls from arbitrary UI components prevented?
- How does the design avoid duplicate goals for one user action?
- Which telemetry event names map to which of the 11 Metrica goals?
- Which events are forbidden from reachGoal?
- How are test/internal/admin events handled?
- How does env-off mode work?
- How is it verified that the site does not break when Metrica is disabled?

Roadmap position: this document does not choose the final R1 technical scheme. The R1 Blueprint must choose and justify the safe client-side, server-side or hybrid design before implementation.

Recommended initial mapping to review before implementation:

| Telemetry signal | Candidate Metrica goal | Notes |
| --- | --- | --- |
| `phone_clicked` | `click_to_call` | Direct contact intent. |
| `messenger_clicked` with Telegram channel | `click_to_telegram` | Requires reliable channel metadata. |
| `messenger_clicked` with WhatsApp channel | `click_to_whatsapp` | Requires reliable channel metadata. |
| `cta_clicked` | `cta_click` | Only for approved CTA semantics. |
| `gallery_opened` | `gallery_open` | Direct semantic match. |
| `case_card_opened` | `case_card_click` | Direct semantic match if click/card open is intended as goal. |
| `service_card_opened` | `service_link_click` | Direct semantic match if target is service. |
| future form telemetry | `form_start`, `form_submit` | Do not fake if no public form emits these. |
| contact link metadata | `contact_link_click` | Needs explicit rule; do not double-count with phone/messenger. |

Non-goals:

- scheduled imports;
- read model import wiring;
- UX redesign;
- LLM;
- lead records;
- direct public tracker calls to `/api/analytics/events`;
- direct `ym()` calls from arbitrary UI components.

Deliverables:

- R1 PRD;
- R1 Blueprint;
- internal telemetry operational smoke/report;
- env-gated public counter integration;
- approved optional mirror implementation;
- mapping tests;
- smoke/report proving internal storage and optional goal signal;
- updated handoff with exact R1 evidence.

Acceptance criteria:

- R1 PRD and Blueprint are reviewed before implementation;
- internal telemetry remains the primary operational capture;
- a public action is stored in telemetry storage regardless of Metrica state;
- Metrica mirror failure does not block internal telemetry or UX;
- public site loads Metrica only when enabled by env;
- no OAuth token/client secret reaches browser or docs;
- public tracker still posts to `/api/telemetry/events`;
- approved bridge ignores unsupported/internal/test events;
- optional live goal signal appears for at least one approved goal when Metrica is enabled;
- tests still enforce no direct `ym()` in public UI and no direct `/api/analytics/events` from tracker.

Risks:

- double-counting contact actions;
- enabling webvisor/clickmap without privacy decision;
- leaking config that is not browser-safe;
- mapping telemetry names to old SEO goal names incorrectly;
- assuming Metrica goal visibility is immediate.

Recommended tests/smoke:

- unit tests for goal mapping and env-off/no-op behavior;
- existing telemetry no-direct-adapters test;
- browser smoke with env off and env on;
- live smoke for one contact/CTA event;
- Yandex Metrica check after propagation delay.

Next handoff:

- record exact counter init options, allowed event mapping and smoke evidence;
- then proceed to R2/R3.

### Phase R2. Metrica Import Foundation

Status: next after R1.

Текущая боль: Metrica API and goals are ready, but project storage/read model do not ingest Metrica aggregates.

Цель фазы: get aggregated Metrica traffic/goal data into project storage with safe freshness states.

Prerequisites:

- R1 internal telemetry measurement is proven;
- optional Metrica mirror smoke is completed if the mirror was enabled;
- import cadence decided;
- retention/storage policy decided;
- report dimensions/metrics verified against current Metrica API docs before implementation.

Scope:

- scheduled or operator-triggered idempotent import;
- `analytics_source_sync_state` updates;
- aggregate report import for visits, sources, devices, regions and goals where API supports it;
- safe error handling and token masking;
- stale/failed/not_configured/partial states;
- unmapped URL diagnostics when imported landing pages do not resolve.

Non-goals:

- BI/cube product;
- Logs API;
- raw session import;
- Webvisor/clickmap import;
- visual pixel heatmap;
- direct UI access to Metrica API.

Deliverables:

- import job/tooling;
- storage writes;
- source sync records;
- report with imported row counts and safe errors.

Acceptance criteria:

- import is idempotent for the same period;
- tokens are not logged, stored in report or exposed to read model/UI;
- failed imports produce safe source state;
- no raw sessions or form values are stored.

Risks:

- API field mismatch;
- rate limits;
- delayed goal data;
- URL normalization mismatch.

Recommended tests/smoke:

- dry-run mode if implemented;
- idempotency test;
- safe-error test;
- source_sync_state DB proof;
- read-only report of row counts.

Next handoff:

- document imported dimensions/metrics and known API limitations;
- proceed with R3 or R4 depending on whether Webmaster import is ready.


### Phase R2B. Metrica Traffic Source / Device / Region / Landing Import

Status: PRD/Blueprint drafts created; implementation not started.

Текущая боль: R2A proves Metrica API/storage/source state for minimal daily totals and goals, but it does not explain traffic composition. R4-lite can show source readiness, but full R4 still lacks external source/device/region/landing evidence.

Цель фазы: import bounded Yandex Metrica aggregate reports for traffic source, device, country/region and landing/start URL without turning Metrica into operational truth or a BI warehouse.

Scope:

- official Reporting API dry-run before write mode;
- separate bounded report plans for source, device, country/region and landing URL;
- visits/users/pageviews where API supports them;
- URL normalization and Content Core mapping for landing reports;
- unmapped URL diagnostics;
- `analytics_source_sync_state` update for `yandex_metrica`;
- idempotency, cardinality controls and safe errors;
- no read model/UI integration inside R2B.

Deliverables:

- R2B PRD: `docs/product-ux/PRD_R2B_Metrica_Traffic_Source_Device_Region_Landing_Import_Экостройконтинент_v0.1.md`;
- R2B Blueprint: `docs/blueprints/BLUEPRINT_R2B_Metrica_Traffic_Source_Device_Region_Landing_Import_Экостройконтинент_v0.1.md`;
- R2B design report: `docs/reports/2026-05-19/R2B_METRICA_TRAFFIC_SOURCE_DEVICE_REGION_LANDING_PRD_BLUEPRINT_DESIGN_Экостройконтинент_v0.1.report.md`.

Non-goals:

- scheduled cadence/R2C;
- full R4;
- `/admin/visibility` redesign;
- recommendations;
- LLM;
- lead/intake;
- raw sessions/logs;
- Webvisor/clickmap/session replay;
- direct UI/browser Metrica API;
- Content Core mutation from landing URLs.

### Phase R3. Webmaster Import Foundation

Status: next after R1; can run in parallel with R2 if ownership is clear.

Текущая боль: Webmaster host is verified, but indexation/search visibility data is not imported into project storage.

Цель фазы: get Yandex Webmaster visibility/indexation data into project storage without inventing unsupported API fields.

Prerequisites:

- verified host id;
- import cadence decided;
- exact Webmaster API capabilities checked before implementation.

Scope:

- scheduled or operator-triggered idempotent import;
- host id usage;
- indexation summary where API supports it;
- important pages/problems where API supports it;
- visibility/query/page data only if API supports the needed fields;
- writes to `external_search_visibility_daily` where shape matches;
- unmapped URL diagnostics;
- source freshness.

Non-goals:

- pretending query/page/device fields exist without API proof;
- user-level query attribution;
- Google Search Console parity;
- direct UI access to Webmaster API.

Deliverables:

- import job/tooling;
- storage writes;
- source sync records;
- report with API fields actually used.

Acceptance criteria:

- host lookup/verification is safe;
- unsupported fields are explicitly marked as unavailable;
- source states are deterministic;
- imported URLs are normalized before mapping.

Risks:

- Webmaster API may not expose all PRD-desired metrics;
- sitemap route state may drift if Content Core published pages change;
- imported pages may not map to route owners.

Recommended tests/smoke:

- host-id check;
- import dry-run/limited period;
- idempotency check;
- unmapped URL check;
- safe-error check.

Next handoff:

- document exact Webmaster data now available and what remains unavailable.

### Phase R3B. Webmaster Query / Page Visibility Import

Status: implemented and accepted with synchronous fallback; valid zero-row result.

Текущая боль: R3B now proves the Webmaster query/page import path and source-state update, but the accepted `query-analytics/list` period returned zero rows. Full R4 still must not claim low CTR, query/page opportunity or search visibility evidence until non-empty aggregate rows or a completed beta export exist.

Цель фазы: import aggregate Webmaster query/page visibility rows without making Webmaster a user/session/lead attribution source.

Scope:

- official endpoint capability dry-run before write mode;
- query/page/date visibility rows where API supports them;
- URL normalization and Content Core route mapping where possible;
- unmapped URL diagnostics;
- `analytics_source_sync_state` update for `yandex_webmaster`;
- idempotency and safe errors;
- no read model/UI integration inside R3B.

Endpoint strategy:

- primary candidate: advanced query analytics by URL beta, if access/quota/dates/result shape are confirmed;
- conservative fallback: `query-analytics/list` in URL mode with explicit limitation that it returns a popular complementary query, not complete URL-query universe;
- popular queries endpoint is discovery/fallback only, not page-level evidence by itself.

Deliverables:

- R3B PRD: `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`;
- R3B Blueprint: `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`;
- R3B implementation report: `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`;
- R3B conformity audit: `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.

Non-goals:

- full Webmaster endpoint sweep;
- scheduled jobs;
- full R4;
- `/admin/visibility` UX redesign;
- recommendations;
- LLM;
- lead/intake;
- query-to-user/session/lead attribution;
- Content Core mutation.

### Phase R4-lite. External Source State and Readiness Integration

Status: implemented and accepted; not full R4.

Текущая боль: R2A/R3A prove external import plumbing and source states, but the data is too thin for full R4. Metrica imported only zero external aggregates, and Webmaster query visibility returned no rows.

Цель фазы: expose truthful external source readiness in the analytics read model without treating weak/zero external data as operational truth.

Scope:

- source readiness for `yandex_metrica` and `yandex_webmaster`;
- imported periods, rows, last success/attempt and safe errors;
- compact Metrica import summary with all-zero limitation;
- compact Webmaster host/indexation/URL sample/query-empty summary;
- limitations and data actionability labels.

Non-goals:

- full external metric/evidence integration;
- recommendations from Metrica zeros;
- low CTR/query recommendations from absent Webmaster query rows;
- R2B/R3B imports;
- UI redesign;
- scheduled jobs;
- LLM;
- lead/intake.

Deliverables:

- R4-lite PRD: `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`;
- R4-lite Blueprint: `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`;
- implementation later should add compact readiness DTO/tests/report only.

Acceptance criteria:

- read model exposes source state/readiness truthfully;
- Metrica zero rows do not feed primary traffic/contact metrics;
- absent Webmaster query rows do not generate query/CTR recommendations;
- no Yandex API calls happen in read model request path;
- secrets/raw external responses are not exposed.

### Phase R4. Read Model With Real External Aggregates

Status: after R4-lite and/or deeper R2B/R3B data, not current next slice.

Текущая боль: read model needs real external aggregates/evidence, but current R2A/R3A data is not rich enough for full traffic/search recommendations.

Цель фазы: make analytics read model consume imported Metrica/Webmaster aggregates and show truthful source health/freshness.

Prerequisites:

- R2 and/or R3 imported rows exist;
- source sync state exists;
- mapping of imported URLs to route owners is stable enough.

Scope:

- `yandex_metrica` state no longer `not_configured` when successful data exists;
- `yandex_webmaster` state no longer `not_configured` when successful data exists;
- traffic sources from imported Metrica data;
- search visibility from imported Webmaster data;
- evidence items from imported data;
- limitations and freshness in read model;
- no secrets/raw imports in DTO.

Non-goals:

- UX polish;
- LLM;
- lead conversion;
- arbitrary BI filters.

Deliverables:

- read model integration;
- contract-aligned source states;
- tests for ok/stale/failed/not_configured states;
- report with sample read model evidence.

Acceptance criteria:

- absent source is unavailable/not_configured, not zero;
- stale/failed source is visible;
- read model exposes aggregate facts only;
- UI still consumes DTO, not import tables or external APIs directly.

Risks:

- overinterpreting small samples;
- mixing first-party telemetry and Metrica aggregates without clear labels;
- silently hiding stale data.

Recommended tests/smoke:

- read model tests with source states;
- privacy forbidden-key scan;
- admin route auth smoke;
- selected page detail with imported evidence.

Next handoff:

- proceed to R5 after enough real source data exists.

### Phase R5. Operational Recommendations Refinement

Status: after real data.

Текущая боль: deterministic recommendations exist, but their usefulness is limited before real external aggregates and enough sample size.

Цель фазы: refine deterministic recommendations so SEO Manager can choose actions from evidence rather than generic warnings.

Prerequisites:

- R4 read model has real imported data;
- enough sample size exists for at least key pages.

Scope:

- low CTR;
- traffic without contact intent;
- mobile low conversion;
- gallery engagement without conversion;
- unmapped URLs;
- source stale/failed;
- attribution safety and before/after wording.

Non-goals:

- LLM-generated recommendations as source of truth;
- autonomous tasks;
- content mutation/publish.

Deliverables:

- refined deterministic issue rules;
- recommendation evidence model;
- tests for attribution safety;
- report with examples.

Acceptance criteria:

- recommendations cite evidence;
- confidence/sample size is explicit;
- missing lead domain is not represented as zero;
- before/after does not claim unsupported causality.

Risks:

- false certainty;
- recommendation fatigue;
- conflating contact intent with leads.

Recommended tests/smoke:

- issue detector tests;
- read model fixture tests;
- selected page recommendation smoke.

Next handoff:

- proceed to R6 when recommendation content is useful enough to shape UI.

### Phase R6. UX/UI Product Refinement of `/admin/visibility`

Status: later.

Текущая боль: current `/admin/visibility` is a technical MVP, not a refined operational product.

Цель фазы: turn the screen into a practical SEO Manager workflow after live data exists.

Prerequisites:

- R4 data is live;
- R5 recommendation rules are useful;
- primary user workflow is known from real data.

Scope:

- information architecture;
- filters;
- page detail interaction;
- evidence drill-down;
- action prioritization;
- empty/stale/failed states;
- owner summary later if needed.

Non-goals:

- direct external API calls from UI;
- UI polish before data correctness;
- LLM-first interface;
- CRM or lead workflow.

Deliverables:

- refined UI spec/design;
- implementation slice if separately approved;
- accessibility/interaction checks;
- report with screenshots or smoke evidence when implemented.

Acceptance criteria:

- SEO Manager can scan, select page, inspect evidence and choose next action;
- source freshness and limitations are visible;
- UI remains DTO-only;
- states are explicit for empty/stale/failed/unavailable sources.

Risks:

- polishing misleading defaults before data exists;
- hiding uncertainty;
- mixing owner view and SEO Manager view too early.

Recommended tests/smoke:

- component tests where present;
- Playwright/browser smoke after implementation;
- auth boundary smoke;
- UI state coverage review.

Next handoff:

- only after this phase should owner-safe DTO or LLM UI be reconsidered.

### Phase R7. LLM Copilot Safety Gate and First UI

Status: future.

Текущая боль: LLM context contract exists, but provider, evals, red-team and first safe scenario are not implemented.

Цель фазы: safely enable advisory copilot after read model and deterministic evidence are reliable.

Prerequisites:

- R4 read model with real data;
- R5 deterministic recommendations;
- LLM provider posture decided;
- eval/red-team set ready;
- privacy/security review complete.

Scope:

- context packets built from read model;
- structured outputs;
- eval/red-team;
- first safe actions:
  - explain page;
  - suggest next actions;
  - draft recommendation.

Non-goals:

- content generation as first scenario;
- autonomous agent;
- direct SQL;
- raw event analysis;
- publish/mutate Content Core;
- direct external API access from LLM.

Deliverables:

- safety gate report;
- provider/config decision;
- context packet tests;
- first UI/API slice if approved.

Acceptance criteria:

- no raw events, secrets, form values, direct SQL or unrestricted user agents reach LLM;
- outputs are advisory/draft-only;
- uncertainty and source freshness are reflected;
- no autonomous publish path exists.

Risks:

- hallucinated causality;
- leaking internal data;
- content mutation pressure;
- replacing deterministic rules with unsupported LLM analysis.

Recommended tests/smoke:

- forbidden field tests;
- prompt/context evals;
- red-team cases;
- source-missing behavior tests.

Next handoff:

- expand only after first safe scenario is proven.

### Phase R8. Lead / Intake Attribution

Status: separate adjacent domain.

Текущая боль: current contact actions and contact journeys are intent signals, not leads. SEO dashboard can show intent, but cannot truthfully report lead conversion until lead/intake exists.

Цель фазы: design and implement lead/intake as its own domain, then expose safe aggregates to SEO dashboard.

Prerequisites:

- product owner decision on what counts as lead;
- ownership of lead records and qualification workflow;
- privacy/data retention decisions;
- attribution snapshot design.

Scope:

- lead records;
- lead vs contact action distinction;
- attribution snapshot;
- qualified lead state if needed;
- read model integration after source of truth exists.

Non-goals:

- treating phone/messenger clicks as leads;
- building CRM inside SEO dashboard;
- backfilling lead truth from telemetry alone.

Deliverables:

- lead/intake domain spec;
- implementation plan;
- source-of-truth tables/API if approved later;
- SEO read model integration as a consumer only.

Acceptance criteria:

- contact intent and leads are separate concepts;
- lead aggregates are unavailable until source of truth exists;
- attribution snapshot is bounded and privacy-safe.

Risks:

- CRM scope creep;
- overclaiming conversion;
- storing sensitive form/contact data in analytics tables.

Recommended tests/smoke:

- domain contract tests;
- privacy tests;
- read model unavailable-vs-zero tests.

Next handoff:

- manage under lead/intake roadmap, not as a blocker for R1-R6 unless business explicitly requires lead conversion now.

## 6. Dependency Graph

Primary sequence:

```text
R0 -> R1 -> R2/R3 -> R4 -> R5 -> R6 -> R7
```

Adjacent sequence:

```text
R8 lead/intake runs separately and should not block R1-R6 unless lead conversion is required for the current product decision.
```

Why this order:

- R1 should precede scheduled imports because local operational telemetry must be proven first. Metrica/Webmaster imports are later external aggregate enrichment, not the path that makes dashboard actions operational.
- R2 and R3 can be parallel after R1 if write ownership is split and source contracts are checked.
- R4 depends on imported data; otherwise read model can only show safe `not_configured` or defaults.
- R5 depends on real data; deterministic recommendations should not be tuned only against empty/default states.
- R6 should wait for real data and useful recommendations; otherwise UI polish may optimize the wrong workflow.
- R7 should wait for read model, deterministic evidence and evals; LLM must not become a raw-data explorer.
- R8 is adjacent because contact intent is not a lead and lead records need their own source of truth.

## 7. Decision Points Before Implementation

Required before R1:

- R1 PRD reviewed;
- R1 Blueprint reviewed;
- privacy/cookie posture approved for public Yandex Metrica counter;
- policy copy/banner requirement decided;
- exact Metrica counter init options approved;
- `webvisor`, clickmap, ecommerce and session replay explicitly approved or disabled;
- exact telemetry events allowed to reachGoal;
- mapping between current telemetry names and existing 11 Metrica goal names;
- double-counting policy for contact actions and generic CTA/contact-link clicks;
- technical bridge design chosen: client-side, server-side or hybrid;
- whether goal smoke waits for Metrica propagation or uses staged verification.

Default R1 posture:

- do not enable Webvisor automatically;
- do not enable clickmap automatically;
- do not enable ecommerce unless there is a real ecommerce use case;
- start with minimal counter plus approved reachGoal events;
- semantic telemetry already exists, so Webvisor/clickmap are not required for MVP;
- any session replay or visual clickmap feature requires a separate product/privacy decision.

Required before R2/R3:

- import cadence;
- source freshness thresholds;
- storage/retention for imported aggregates;
- dry-run/operator-trigger mode vs scheduled-only;
- stale/failed alert posture;
- exact API fields confirmed against current Yandex APIs.

Required before R6/R7/R8:

- whether Business Owner needs reduced DTO;
- LLM provider posture and data processing posture;
- LLM eval/red-team acceptance threshold;
- lead/intake ownership and definition of lead;
- whether CRM integration is in scope or explicitly out of scope.

## 8. Domain Boundaries

Inside SEO Dashboard / Visibility / Analytics Foundation:

- first-party analytics endpoint and aggregates;
- public telemetry operational measurement through `/api/telemetry/events`;
- optional public telemetry-to-Metrica goal mirror, as an adapter boundary;
- external source imports into project storage;
- analytics read model;
- `/admin/visibility` operational dashboard;
- semantic click map based on semantic events;
- deterministic recommendations;
- source health/freshness;
- attribution-safety messaging.

Adjacent but not owned by this domain:

- lead/intake records and qualification;
- CRM workflow;
- Content Core publication and canonical content mutation;
- LLM provider/platform operations;
- owner-facing reporting if it requires a reduced DTO;
- visual session replay/pixel heatmap privacy product.

Consumer boundaries:

- UI consumes analytics read model; UI does not call Yandex APIs directly.
- LLM context builders consume analytics read model; LLM does not receive raw events/direct SQL.
- SEO dashboard may consume lead aggregates only after lead/intake owns lead truth.
- Public tracker emits to `/api/telemetry/events`; it does not post to `/api/analytics/events`.
- Internal first-party telemetry is the operational truth for public actions and Content Core page/entity/revision context.
- Metrica goal counts are external mirror/enrichment data, not a replacement for first-party telemetry.

## 9. Do-Not-Do List

- Do not make UI a direct client of Yandex APIs.
- Do not send secrets, OAuth tokens or client secret to browser.
- Do not put secrets/tokens in reports, read model or UI.
- Do not give LLM raw events, raw sessions, direct SQL, form values, IPs or unrestricted user agent history.
- Do not mix contact actions and leads.
- Do not count missing lead domain as `0`.
- Do not make Metrica the operational source of truth for user actions.
- Do not require importing Metrica back before internal telemetry can be used operationally.
- Do not treat Metrica goal counts as more authoritative than first-party telemetry for Content Core mapping.
- Do not design dashboard actions around Metrica-only data if internal telemetry has richer page/entity/revision context.
- Do not run scheduled imports before internal telemetry smoke and optional public counter/goal smoke unless there is a specific approved reason.
- Do not do UX polish instead of connecting live data.
- Do not implement visual pixel heatmap in MVP.
- Do not enable Webvisor/clickmap automatically in R1.
- Do not start a new implementation domain without its PRD and Blueprint.
- Do not make content generation the first LLM scenario.
- Do not publish or mutate Content Core from SEO dashboard.
- Do not rewire public tracker to `/api/analytics/events`.
- Do not call `ym()` directly from arbitrary public components.

## 10. Current Next Slice Recommendation

Current R1 status:

```text
R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror
```

R1 implementation is available in commit `64599542d2da214378298356f5afe1002b1ff5f5`. Public Metrica enablement was completed on canonical runtime at commit `90896a9e4015864f15fb633cfc2259af8cce99cb` after owner approval for the prototype-stage no-banner posture.

R1 acceptance state:

1. Internal telemetry remains operational truth and stores public actions through `/api/telemetry/events`.
2. `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true` is set in canonical runtime/build context.
3. Public browser runtime loads Yandex Metrica counter `109037342` with conservative options.
4. Approved `phone_clicked` action triggered `ym(109037342, "reachGoal", "click_to_call")` through the centralized adapter.
5. Browser/network smoke confirmed Yandex `tag.js`, `watch/109037342`, telemetry `202`, and no browser-exposed secrets.
6. Yandex Reporting API still returned `0` for visits/pageviews/`click_to_call` as of `2026-05-19T10:19:00Z`; treat this as delayed external stats visibility, not as a failure of internal telemetry.

Current R2A status:

```text
R2A. Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals
```

R2A implementation is available in commit `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8` and was accepted on canonical runtime on 2026-05-19. It adds server-only dry-run/write commands, table `external_metrica_daily_aggregate`, idempotent same-period upsert, and `analytics_source_sync_state` for `source_system = yandex_metrica`. The accepted import period `2026-05-16..2026-05-18` produced `42` aggregate rows and source state `ok`; all imported values were external Metrica zeros and must not be interpreted as internal telemetry zeros.

Current R3A status:

```text
R3A. Webmaster Host / Indexation / Query Visibility Dry Run
```

R3A implementation is available in commit `8a8e2e5ea6668375637fc4fdd16ea3b2e77a22c8` and was accepted on canonical runtime on 2026-05-19. It adds server-only dry-run/write commands, dedicated `external_webmaster_*` tables, idempotent same-period/snapshot upsert, URL normalization, and `analytics_source_sync_state` for `source_system = yandex_webmaster`. The accepted import period `2026-05-05..2026-05-17` produced one host snapshot, one site/indexation summary, one in-search URL sample mapped to `/`, and zero query visibility rows.

Current R4-lite status:

```text
R4-lite. External Source State and Readiness Integration
```

R4-lite implementation is available in commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25` and was accepted on canonical runtime on 2026-05-19. It adds `external_source_readiness` to the analytics read model and compact `/admin/visibility` source readiness diagnostics. Metrica status is `ok/fresh`, period `2026-05-16..2026-05-18`, rows `42`, `all_values_zero=true`, `data_actionability=readiness_only`. Webmaster status is `ok/fresh`, period `2026-05-05..2026-05-17`, rows `3`, host verified, one URL sample resolved to `/`, and `query_visibility_rows=0`. These are readiness/limited diagnostics only, not full R4 evidence.

Current R3B implementation status:

```text
R3B. Webmaster Query / Page Visibility Import
```

R3B implementation is available in commit `d7d35d7f4df60f57443372e664d37a79b0ceb92f` and was accepted on canonical runtime on 2026-05-19. It adds server-only dry-run/write commands `yandex:webmaster-query-import:dry-run` and `yandex:webmaster-query-import:r3b`, checks advanced export beta capability, uses synchronous `query-analytics/list` fallback, writes aggregate query/page rows into `external_webmaster_query_visibility_daily` when rows exist, updates `analytics_source_sync_state`, normalizes URLs, and keeps query data aggregate-only. Accepted period `2026-05-04..2026-05-17` returned a valid zero-row result; source state is `ok`, rows imported `0`, unmapped URL count `0`. Beta capability endpoints were available, but async export was deferred because it is offline and can take from minutes to hours.

Correct next decision:

1. Review R2A and R3A implementation/conformity reports:
   `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`,
   `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`,
   `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`,
   and `docs/reports/2026-05-19/R3A_WEBMASTER_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
2. Review R4 readiness/design docs:
   `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`,
   `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`,
   and `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`.
3. Review R4-lite implementation/conformity reports:
   `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
4. Review R3B implementation/conformity reports:
   `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
   and `docs/reports/2026-05-19/R3B_WEBMASTER_QUERY_PAGE_VISIBILITY_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`.
5. R2B PRD/Blueprint drafts are created. Recommended next implementation slice: review R2B docs, then implement R2B if approved; alternatively run a bounded delayed Webmaster beta pass before full R4. Do not start R5-style recommendation rules from R3B zero-row data.
6. Optionally rerun delayed Metrica stats visibility check after Yandex processing catches up.
7. Do not make Metrica or Webmaster imported counts the operational source of truth for public user actions.

R2/R3 are not one-shot monoliths. They are domain phases with internal sub-slices:

```text
R2A -> R2B/R2C/R2D
R3A -> R3B/R3C/R3D
```

Recommended implementation order:

```text
R2A(done) -> R3A(done) -> R4-lite(done) -> R3B(done; zero-row sync fallback) -> R2B docs(done; implementation not started) -> implement R2B if approved or run delayed Webmaster beta before full R4
```

Why:

- internal telemetry already collects behavior/contact intent and must be protected as the operational measurement layer;
- Metrica API is ready;
- 11 Metrica goals exist for optional external mirroring;
- Webmaster is verified;
- public Metrica script is enabled by env in production after owner prototype-stage approval;
- optional reachGoal mirror is implemented as a centralized, best-effort adapter;
- scheduled imports should enrich the system after local telemetry is proven, not become the primary path for operational user-action truth.

Definition of finish for the nearest implementation cycle after PRD/Blueprint:

- selected R2 or R3 importer runs server-side only;
- imported data is aggregate external enrichment in project storage;
- `analytics_source_sync_state` records truthful `ok`/`stale`/`failed`/`partial`/`not_configured` state;
- import reruns are idempotent for the same bounded period or endpoint;
- R2A imports only minimal daily traffic/goals before broad dimensions;
- R3A imports only accepted host/indexation/query dry-run rows before broad endpoint sweep;
- URL mapping failures become diagnostics, not silent drops;
- no secrets leak;
- no direct UI/Yandex API coupling is introduced;
- internal telemetry remains the operational truth;
- R4-lite source-state/readiness integration is closed; full R4 waits for richer external evidence;
- acceptance report records imported dimensions/endpoints, rows, limitations and smoke evidence.

Future scope:

- R2B/R2C deeper Metrica imports;
- R3 imports;
- R4 real external aggregates in read model;
- R5 recommendation refinement;
- R6 UX/UI refinement;
- R7 LLM copilot;
- R8 lead/intake attribution;
- Google Search Console/GA4 only after Yandex-first loop is useful.

## 11. Roadmap Status Table

| Phase | Status | Why now / why later | Dependencies | Acceptance | Output artifact |
| --- | --- | --- | --- | --- | --- |
| R0. Current State Baseline | Done | Needed to stop stale-memory work. | Current audit evidence. | Factual state and handoff updated. | Current state audit report. |
| R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror | Enabled / server acceptance closed with delayed external stats visibility | Internal telemetry is operational truth; optional Metrica mirror is enabled after owner prototype-stage approval, with no Webvisor/clickmap/ecommerce/session replay. | R1 PRD/Blueprint, owner privacy posture decision, env flags, centralized adapter, tests, deploy. | Internal telemetry smoke passed; public counter and browser/network reachGoal mirror passed; Yandex Reporting API stats visibility for visits/goals remained `0` as of `2026-05-19T10:19:00Z` and needs delayed recheck. | Implementation, conformity, detailed delivery, and final enablement reports. |
| R2. Metrica Import Foundation | R2A accepted; R2B PRD/Blueprint created; R2B implementation not started | R2A proved API access, storage, source_sync_state and idempotency without broad BI dimensions. R2B is now specified to add source/device/country-or-region/landing reports with cardinality controls. Scheduling remains later R2C. | R1 telemetry smoke, R2 PRD/Blueprint/addendum, migration `010`, canonical runtime acceptance, R2B PRD/Blueprint. | R2A minimal daily traffic/goals accepted; R2B implementation must prove bounded report plans, storage, source_sync_state, landing URL diagnostics and idempotency without read model/UI/scheduler. | R2A reports; R2B PRD/Blueprint/design report; later R2B implementation/conformity reports. |
| R3. Webmaster Import Foundation | R3A accepted; R3B implemented/accepted with zero-row sync fallback | R3A proved host/indexation/sample imports. R3B proved query/page import plumbing and source state, but accepted `query-analytics/list` returned zero rows; beta export capability is available but async/deferred. | Host id, R3/R3B PRD/Blueprint/addendum, migration `011`, canonical runtime acceptance. | R3A host/indexation/URL sample import and R3B query/page importer/source_sync_state accepted; no read model/UI/scheduler added. | R3A and R3B implementation/conformity reports. |
| R4-lite. External Source State and Readiness Integration | Implemented and accepted | R2A/R3A data was enough for source-state/readiness but too thin for full R4 evidence. | R4 readiness audit, R2A/R3A accepted source states/rows. | Read model exposes source readiness/limitations; Metrica zeros and absent Webmaster query rows do not drive primary metrics or recommendations. | R4-lite implementation and conformity reports. |
| R4. Read Model With Real External Aggregates | Later | Full R4 needs richer external aggregates/evidence than current R2A/R3A. | R4-lite and/or R2B/R3B deeper data. | Yandex sources show truthful aggregate evidence without overclaiming weak data. | Full read model integration report. |
| R5. Operational Recommendations Refinement | After R4 | Rules need real data and sample size. | External aggregates in read model. | Evidence-backed deterministic recommendations with attribution safety. | Recommendation refinement report/spec. |
| R6. UX/UI Product Refinement | Later | UI should follow real workflow, not empty states. | R4/R5. | SEO Manager can inspect pages, evidence, freshness and actions. | UX/UI spec and later implementation report. |
| R7. LLM Copilot Safety Gate and First UI | Future | Needs read model, evals and safety posture. | R4/R5, provider decision, evals. | Safe context packets and advisory-only first scenario. | LLM safety gate report. |
| R8. Lead / Intake Attribution | Adjacent | Important, but not SEO foundation blocker. | Lead/intake ownership and definition. | Leads have separate source of truth; SEO consumes aggregates only. | Lead/intake spec/roadmap. |

## 12. Artifact Pointers

Product and contracts:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3_Webmaster_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R3B_Webmaster_Query_Page_Visibility_Import_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`

Current-state docs:

- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/handbook/PROJECT_CURRENT_STATE_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`

Yandex docs/reports:

- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-04/YANDEX_ENV_CONTRACT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_API_BOOTSTRAP_CHECK_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_OAUTH_SERVER_BOOTSTRAP_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_WEBMASTER_SITE_VERIFICATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-04/YANDEX_METRICA_GOALS_BOOTSTRAP_Экостройконтинент_v0.1.report.md`

Key code boundaries to inspect before implementation:

- `components/public/AnalyticsTracker.js`
- `app/api/telemetry/events/route.js`
- `lib/telemetry/adapters.js`
- `lib/telemetry/events.js`
- `app/api/analytics/events/route.js`
- `app/api/admin/visibility/read-model/route.js`
- `app/admin/(console)/visibility/page.js`
- `components/admin/SeoVisibilityDashboard.js`
- `lib/analytics/read-model.js`
- `scripts/yandex/*`
- `db/migrations/008_seo_visibility_analytics.sql`
- `db/migrations/009_contact_intent_telemetry.sql`
- `app/about/page.js`
- `app/contacts/page.js`
- `app/sitemap.js`
- `app/robots.js`
- `lib/read-side/public-content.js`
