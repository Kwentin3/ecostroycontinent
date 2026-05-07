# Contact Intent & Journey Telemetry Closure Handoff

Проект: «Экостройконтинент»
Версия: v0.1
Дата: 2026-05-07
Статус: **CONTACT_INTENT_JOURNEY_TELEMETRY_DOMAIN_CLOSED_WITH_WARNINGS**

Этот handoff - короткая карта закрытого домена. Он не заменяет PRD, Tracking Plan, Domain Boundary или Blueprint.

## 1. Implementation Anchor

- Implementation commit: `8508901e80bf8f312a451b87beb7642185f01e76`
- Implementation report: `docs/reports/2026-05-07/CONTACT_INTENT_JOURNEY_TELEMETRY_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- Blueprint: `docs/engineering/Contact_Intent_and_Journey_Telemetry_Blueprint_Экостройконтинент_v0.1.md`
- Domain boundary: `docs/engineering/Contact_Intent_and_Journey_Telemetry_Domain_Boundary_Экостройконтинент_v0.1.md`

## 2. Code Map

- Domain modules: `lib/telemetry/*`
- Public ingestion endpoint: `app/api/telemetry/events/route.js`
- Admin debug read endpoint: `app/api/admin/telemetry/debug/route.js`
- Public tracker: `components/public/AnalyticsTracker.js`
- Existing public render instrumentation: `components/public/PublicRenderers.js`
- Homepage tracker mount: `app/page.js`
- Internal marker hook: `lib/auth/session.js`
- Migration: `db/migrations/009_contact_intent_telemetry.sql`

## 3. API And Storage

Runtime endpoints:

- `POST /api/telemetry/events` - public telemetry ingestion, safe generic responses.
- `GET /api/admin/telemetry/debug` - admin-only bounded debug summary.

Tables:

- `telemetry_events` - normalized first-party telemetry events.
- `telemetry_contact_journeys` - short contact journey snapshots.

Cookies / markers:

- `esc_telemetry_session` - anonymous, opaque `session_id` cookie.
- `esc_internal_traffic` - non-sensitive internal traffic marker after admin auth.
- `is_test` - event/test marker resolved from safe smoke/debug input, not a user identity.

Phase 1 identity default is `session_id` only. Persistent `anonymous_visitor_id` is not enabled.

## 4. Canonical Events

Public UI may emit:

- `page_viewed`
- `page_engagement_recorded`
- `service_card_opened`
- `case_card_opened`
- `gallery_opened`
- `cta_clicked`
- `phone_clicked`
- `email_clicked`
- `messenger_clicked`

System/domain-only:

- `contact_journey_created`

`contact_journey_created` must never be accepted from Public UI. It is created only inside the telemetry domain.

## 5. Semantics To Preserve

Contact intent:

- `phone_clicked`
- `email_clicked`
- `messenger_clicked`

Interest / engagement:

- page view;
- service/case card open;
- gallery open;
- non-contact CTA;
- bounded page engagement.

Not a lead:

- a phone click;
- an email click;
- a messenger click;
- a contact journey;
- page/card/gallery engagement.

Lead and qualified lead remain future/separate Lead domain semantics. Contact intent events must not create lead records.

## 6. Contact Journey Rule

`contact_journey` is created at contact intent event time, not at formal session end.

When `phone_clicked`, `email_clicked` or `messenger_clicked` is stored, the domain:

- finds previous significant events for the same `session_id`;
- collapses repeated rapid same-context clicks within 3 seconds;
- limits the journey to 12 significant events;
- includes the final contact intent event;
- stores a bounded snapshot in `telemetry_contact_journeys`.

Journey is an evidence trail, not session replay.

## 7. Future Consumers

Allowed future consumers:

- small admin read model;
- SEO/product reports based on aggregates;
- LLM context packets based on aggregates and bounded journeys;
- optional external analytics adapters after owner/legal decision;
- future Lead domain integration after a real lead exists.

Consumers may read:

- aggregate counts;
- contact channel distribution;
- page/service/case contact intent aggregates;
- pages with engagement but no contact;
- bounded contact journeys;
- internal/test exclusion flags.

Consumers must not read:

- raw event dumps by default;
- PII;
- form input;
- raw IP/user-agent;
- admin identity;
- secrets/tokens;
- unfiltered internal/test traffic;
- full session replay-like paths.

LLM must receive only prepared, privacy-filtered context and must not change content or qualify leads autonomously.

## 8. Boundary Tests

Telemetry boundaries are covered by:

- `tests/telemetry-validation.test.js`
- `tests/telemetry-event-route.test.js`
- `tests/telemetry-journey.test.js`
- `tests/telemetry-debug-read.test.js`
- `tests/telemetry-no-direct-adapters.test.js`

These tests protect:

- canonical event allowlist;
- public rejection of `contact_journey_created`;
- metadata/root-field allowlists;
- contact journey creation on contact intent;
- CTA single-counting;
- internal/test default exclusion;
- no direct `ym` / `gtag` / PostHog / Plausible / Matomo calls from UI.

## 9. Open Owner / Legal Decisions

- Cookie/privacy notice for first-party telemetry.
- Exact retention for raw telemetry.
- Exact retention for contact journeys.
- Exact retention for aggregates.
- Optional Yandex Metrica adapter.
- Optional Google Analytics / PostHog / Plausible / Matomo adapters.
- Persistent `anonymous_visitor_id` decision.
- Internal marker reset UX.
- Authenticated production admin debug-read smoke.
- Future small admin read model after real traffic exists.

## 10. Allowed Future Seams

- External analytics adapters after domain validation.
- Admin read-contract / aggregate report.
- LLM context packet built from aggregates and bounded journeys.
- Lead domain integration only after lead records exist in a separate domain.
- ATS/call-tracking integration only after separate owner/legal decision.

## 11. Forbidden Future Moves

- Treating contact intent as lead.
- Creating lead records from telemetry events.
- Direct calls to Yandex Metrica, `gtag`, PostHog, Plausible or Matomo from UI.
- Renaming canonical events without updating Tracking Plan, validation and tests.
- Accepting `contact_journey_created` from Public UI.
- Storing PII, form input, raw IP/user-agent, secrets or tokens.
- Exposing raw event dumps to LLM/admin/SEO by default.
- Mixing internal/test traffic into default product reports.
- Turning journey into session replay or heatmap.
- Moving telemetry semantics into Content Core.
- Changing `/about` or `/contacts` as part of this domain.
