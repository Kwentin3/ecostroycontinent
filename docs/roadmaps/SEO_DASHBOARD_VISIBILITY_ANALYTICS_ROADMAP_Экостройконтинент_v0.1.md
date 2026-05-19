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

Статус: implemented safe-disabled on 2026-05-19; production Metrica enablement remains privacy/cookie-gated.

Критерии:

- public telemetry events are live and reliable;
- internal telemetry remains the primary operational source for user actions;
- telemetry events continue through `/api/telemetry/events`;
- telemetry storage can be used for future operational read model integration;
- optional Yandex Metrica counter and `reachGoal` mirror can be enabled only through approved privacy/cookie posture;
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

### Phase R4. Read Model With Real External Aggregates

Status: after R2/R3 have data.

Текущая боль: read model currently shows Yandex sources as `not_configured` from the dashboard point of view because source sync/import rows are absent.

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

Recommended next domain slice:

```text
R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror
```

R1 implementation is now available in commit `64599542d2da214378298356f5afe1002b1ff5f5` and deployed to canonical runtime in safe-disabled posture.

Correct next action:

1. Review implementation and conformity audit reports.
2. Decide privacy/cookie posture for production Metrica counter enablement.
3. If approved, enable `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true` in canonical runtime/build context, rebuild/redeploy, and run delayed Metrica goal verification.
4. If the mirror remains disabled, continue with internal telemetry as operational truth and proceed to R2/R3 only when external aggregate imports are separately approved.

Why:

- internal telemetry already collects behavior/contact intent and must be protected as the operational measurement layer;
- Metrica API is ready;
- 11 Metrica goals exist for optional external mirroring;
- Webmaster is verified;
- public Metrica script is implemented but remains disabled by env in production;
- optional reachGoal mirror is implemented as a centralized, best-effort adapter;
- scheduled imports should enrich the system after local telemetry is proven, not become the primary path for operational user-action truth.

Definition of finish for the nearest implementation cycle after PRD/Blueprint:

- public action is stored in internal telemetry through `/api/telemetry/events`;
- internal telemetry remains usable when Metrica is disabled or blocked;
- public counter enabled behind env flag;
- approved optional mirror sends or causes approved reachGoal signals when enabled;
- one or more live goals are observed in Metrica only after the mirror is explicitly approved and enabled;
- no secrets leak;
- no direct UI/Yandex API coupling is introduced;
- handoff/report records exact mapping and smoke evidence.

Future scope:

- R2/R3 imports;
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
| R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror | Implemented safe-disabled / production mirror gated | Internal telemetry is operational truth; optional Metrica mirror is implemented but production enablement waits for privacy/cookie approval. | R1 PRD/Blueprint, conservative privacy posture, env flags, centralized adapter, tests, deploy. | Internal telemetry smoke passed with Metrica disabled; optional Metrica browser-level mirror covered by tests; live goal verification pending explicit env-on approval. | Implementation report and conformity audit. |
| R2. Metrica Import Foundation | Later, after R1 | Imports are external aggregate enrichment after local telemetry is proven. | R1 telemetry smoke, optional mirror smoke if enabled, cadence, retention, API field check. | Idempotent aggregate imports and source_sync_state. | Metrica import report. |
| R3. Webmaster Import Foundation | Later, after R1; parallel with R2 possible | Webmaster verified, but data not imported. | Host id, cadence, API capability check. | Idempotent visibility/indexation imports and safe states. | Webmaster import report. |
| R4. Read Model With Real External Aggregates | After R2/R3 | Read model needs imported rows. | Imported data and source sync state. | Yandex sources show truthful ok/stale/failed states and aggregate evidence. | Read model integration report. |
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
