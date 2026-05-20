# Minimal SEO Admin Panel Implementation Report

Проект: Экостройконтинент
Дата: 2026-05-20
Домен: Minimal SEO Admin Panel / Минимальная операционная SEO-панель в админке
Ветка: `feat/minimal-seo-admin-panel`
Implementation commit: `1a37fce8e1eba4c72ebd3983590251d967b544ee`

## Executive Verdict

Minimal SEO Admin Panel implemented and accepted on canonical runtime.

`/admin/visibility` now renders a fact-first operational SEO panel from the analytics read model. The panel shows first-party traffic/actions as primary metrics, external Metrica/Webmaster evidence as enrichment, landing diagnostics, internal actions, Webmaster/search state and visible limitations.

R5 recommendation logic, LLM, lead/intake, scheduled imports, BI/query builder, direct Yandex API calls and Content Core mutations were not added.

## Files Changed

Runtime/UI:

- `components/admin/SeoVisibilityDashboard.js`
- `components/admin/SeoVisibilityDashboard.module.css`

Tests:

- `tests/admin-visibility-ui.test.js`

Docs:

- `docs/reports/2026-05-20/MINIMAL_SEO_ADMIN_PANEL_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-20/MINIMAL_SEO_ADMIN_PANEL_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`

## Sections Implemented

Implemented in `/admin/visibility`:

1. Top summary:
   - selected period;
   - first-party visits;
   - first-party contact/action count;
   - Metrica/Webmaster readiness;
   - freshness/actionability;
   - limitations count.

2. Base metrics:
   - organic visits;
   - Yandex impressions/clicks/CTR;
   - visit-to-intent conversion;
   - lead domain shown as unavailable, not zero.

3. Traffic composition:
   - internal traffic mix;
   - Metrica traffic sources;
   - Metrica source details;
   - devices;
   - countries;
   - regions when available.

4. Landing pages:
   - landing path/URL rows;
   - Content Core route/entity mapping;
   - visits/users/pageviews as external evidence;
   - mapped/unmapped counts;
   - unmapped diagnostics as diagnostics only.

5. Internal actions:
   - contact actions;
   - CTA views/clicks;
   - gallery opens;
   - FAQ expands;
   - selected page action facts;
   - semantic click map empty/success state.

6. Search / Webmaster:
   - host verified;
   - host data status;
   - searchable/excluded pages;
   - site problem counts;
   - URL samples;
   - query visibility row count;
   - zero-row limitation as "not zero demand".

7. Data limitations:
   - read model warnings;
   - source-specific limitations;
   - external evidence limitations;
   - explicit internal/external/Content Core truth boundaries.

8. Existing diagnostic signals:
   - existing `readModel.recommendations` can still be displayed separately;
   - no new R5 rules were added or expanded.

## Data Contract Used

The panel uses the existing analytics read model only:

- `overview`;
- `traffic_sources`;
- `page_list`;
- `selected_page_detail`;
- `semantic_click_map`;
- `external_source_readiness`;
- `external_evidence`;
- `source_diagnostics`;
- `warnings`;
- `limitations`;
- existing `recommendations` as separated diagnostic output only.

No DTO additions were required.

## UI Behavior

The UI is a dense admin surface with cards and compact tables. It keeps the existing admin shell and period links for 7/28/90 days.

Primary labels:

- first-party/internal metrics are marked as `first-party` or operational truth;
- Metrica/Webmaster values are marked as external evidence/enrichment;
- disabled integration settings remain visibly out of scope;
- limitations remain visible, not tooltip-only.

Empty states are explicit for:

- no internal traffic sources;
- no Metrica dimension rows;
- no landing rows;
- no page rows;
- no semantic click map rows;
- no URL samples;
- zero Webmaster query rows;
- no existing diagnostic signals.

## Tests And Build

Targeted tests:

```text
node --experimental-specifier-resolution=node --test tests/admin-visibility-ui.test.js tests/analytics-read-model.test.js tests/telemetry-no-direct-adapters.test.js
```

Result: passed, 16/16.

Full tests:

```text
npm test
```

Result: passed, 570/570.

Build:

```text
npm run build
```

Result: passed. `/admin/visibility` and `/api/admin/visibility/read-model` compiled as dynamic routes.

Whitespace:

```text
git diff --check
```

Result: passed.

## Deploy And Server Acceptance

Build/publish workflow:

- workflow: `build-and-publish`
- run: `26152498457`
- status: success
- image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:9ec33691ee27e8f47664c02d3479571776556bb2ac75b375d43a67692a236962`

Deploy workflow:

- workflow: `deploy-phase1`
- run: `26152616528`
- status: success
- canonical runtime: Selectel VM, compose project `repo`, app container `repo-app-1`
- migration step: ran through existing `npm run db:migrate`
- runtime commit: `1a37fce8e1eba4c72ebd3983590251d967b544ee`
- readiness: database `ok`

Server acceptance probe:

```json
{
  "ok": true,
  "readModelStatus": 200,
  "adminStatus": 200,
  "telemetryStatus": 202,
  "metricaStatus": "ok",
  "webmasterStatus": "ok",
  "metricaRows": 30,
  "metricaTrafficRows": 1,
  "metricaDeviceRows": 2,
  "metricaLandingRows": 2,
  "webmasterQueryRows": 0,
  "htmlMarkers": 8
}
```

Launch smoke:

```text
APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch
```

Result:

- passed: 28;
- failed: 0;
- skipped: 1 optional media check;
- runtime commit: `1a37fce8e1eba4c72ebd3983590251d967b544ee`.

## Security Checks

Confirmed:

- admin auth boundary remains active;
- `/api/admin/visibility/read-model?period=28` requires authorized cookie;
- `/admin/visibility?period=28` opens after admin login;
- UI source contains no `fetch`, `api-metrika`, `api.webmaster`, `webmaster.yandex`, `mc.yandex` or `Authorization`;
- live read model response and HTML were scanned for token/secret-like patterns;
- public telemetry endpoint still accepts a safe `is_test` event and returns `202`;
- no raw sessions, IPs, user agents, form values, raw Yandex responses or secrets are rendered.

## Known Limitations

- Webmaster query visibility currently has `0` rows on canonical runtime. The panel shows this as a limitation and does not claim zero demand.
- Metrica R2B accepted data is small: 30 imported rows, with compact source/device/landing evidence. The panel labels it as external enrichment, not total site truth.
- Existing read model recommendations still exist as legacy/system diagnostic output. The panel separates them and does not add R5 logic.
- No screenshot-level visual acceptance was produced; acceptance used build, source invariants, authenticated HTML markers and live endpoint checks.

## What Was Not Implemented

- R5 recommendations;
- new recommendation rules;
- LLM/copilot;
- lead/intake or lead attribution;
- CRM;
- new imports;
- scheduled jobs;
- BI/query builder;
- arbitrary cubes/filters;
- visual heatmap/session replay/Webvisor;
- Content Core mutations;
- direct UI -> Yandex API calls;
- read model DTO changes.

## Next Steps

Recommended next domains:

1. UX refinement only if the operator needs a clearer visual pass after using the minimal panel.
2. R2C/R3C scheduling/import cadence if fresh external data becomes operationally important.
3. R5 only after more data accumulates and sample-size/actionability guards are explicitly designed.
4. LLM later, behind a separate safety gate.

## Git Status

At report creation time, code implementation is committed and deployed at `1a37fce8e1eba4c72ebd3983590251d967b544ee`. Documentation closure files are being added in a follow-up docs commit on the same branch.
