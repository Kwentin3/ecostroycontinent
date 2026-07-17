# ADDENDUM R4 External Evidence Read Model Integration Экостройконтинент v0.1

Date: 2026-05-20  
Domain: SEO Dashboard / Analytics Read Model  
Slice: R4. External Aggregates in Analytics Read Model / External Evidence Integration

## Scope

R4 connects accepted project-owned external import tables to the analytics read model as a compact evidence/enrichment layer.

It consumes:

- R2B Metrica source, source detail, device, country, region and landing aggregates from `external_metrica_daily_aggregate`;
- R3A Webmaster host/indexation/URL sample tables;
- R3B Webmaster query/page visibility table, including honest zero-row state.

It preserves R4-lite `external_source_readiness`.

## DTO Additions

Add `external_evidence` to the read model:

- `external_evidence.yandex_metrica`
  - status, freshness, data actionability, limitations, imported period;
  - compact traffic source/source detail/device/geography/landing rows;
  - safe totals and mapped/unmapped landing counts.
- `external_evidence.yandex_webmaster`
  - status, freshness, data actionability, limitations, imported period;
  - host/indexation summary;
  - compact URL samples;
  - compact query visibility rows or zero-row limitation.

Rows are top-N compact rows only. Raw metadata, raw API responses and secrets are not exposed.

## Guardrails

- Internal first-party telemetry remains operational truth for behavior and contact intent.
- Content Core remains truth for routes, pages and revisions.
- Metrica is external enrichment only and must not overwrite primary overview metrics.
- Webmaster is external search/indexation evidence only and must not become Content Core truth.
- R3B zero query rows are a limitation, not proof of zero demand.
- R4 must not generate recommendations from Metrica thin data, Webmaster zero rows or landing diagnostics.
- Read model path must not call live Yandex APIs.

## UI

`/admin/visibility` may render a compact external evidence section fed only by the read model. No redesign, filters, cubes or charts are part of R4.

## Tests and Acceptance

Tests must prove:

- external evidence block exists;
- Metrica source/device/geography/landing evidence appears;
- Webmaster host/indexation/URL/query evidence appears;
- primary overview remains first-party;
- external thin/zero evidence does not create recommendations;
- no live Yandex API calls or secrets are exposed;
- empty external tables remain safe;
- R4-lite readiness remains compatible.

Canonical acceptance must verify deployed read model/API/UI behavior against the accepted R2B/R3A/R3B storage state.
