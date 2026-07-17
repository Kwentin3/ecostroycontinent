# BLUEPRINT R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror

Дата: 2026-05-19
Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Статус: draft Blueprint / pre-implementation gate

Companion PRD:

- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`

Former working title: **Public Metrica Counter + Telemetry reachGoal Bridge**.

Current semantic framing: **Public Telemetry Operational Measurement + Optional Metrica Goal Mirror** / **Операционная публичная телеметрия и опциональное зеркало целей в Метрику**. Старое имя файла сохранено для стабильности ссылок.

## 1. Current Architecture

Current public telemetry flow:

```text
Public UI semantic action
-> components/public/AnalyticsTracker.js
-> POST /api/telemetry/events
-> app/api/telemetry/events/route.js
-> validateTelemetryEventPayload()
-> telemetry_events / telemetry_contact_journeys
-> dispatchTelemetryEvent()
-> noopTelemetryAdapter
```

Operational source-of-truth position:

- Internal first-party telemetry is the primary operational source for public user actions.
- `/api/telemetry/events` and telemetry storage are the primary capture/storage path for SEO Dashboard operational decisions.
- Yandex Metrica is an optional external mirror/enrichment layer. It must not become the dashboard source of truth for action counts, Content Core page/entity/revision context or recommendation lifecycle.
- Metrica reachGoal success/failure must never decide whether internal telemetry evidence exists.

Important boundaries:

- Public tracker endpoint is `/api/telemetry/events`.
- Public tracker must not be rewired to `/api/analytics/events`.
- Old SEO endpoint `/api/analytics/events` exists and works, but is a separate foundation endpoint.
- `lib/telemetry/adapters.js` is currently server-side and defaults to `noopTelemetryAdapter`.
- `tests/telemetry-no-direct-adapters.test.js` already enforces no direct external analytics calls from public UI and no direct `/api/analytics/events` from public tracker.
- Analytics read model currently consumes SEO analytics aggregates, not telemetry tables directly.
- Lead/intake is not implemented; contact intent is not a lead.

Current public telemetry event names:

- `page_viewed`
- `page_engagement_recorded`
- `service_card_opened`
- `case_card_opened`
- `gallery_opened`
- `cta_clicked`
- `phone_clicked`
- `email_clicked`
- `messenger_clicked`
- `contact_journey_created` as system/domain-only, not Public UI

Current contact channels:

- `phone`
- `email`
- `telegram`
- `whatsapp`
- `messenger`
- `viber`
- `vk`
- `max`

R1 target architecture has two separate layers:

Layer A. Internal operational telemetry:

- public tracker;
- `/api/telemetry/events`;
- telemetry validation;
- telemetry storage;
- contact journey snapshots where applicable;
- future internal aggregates/read model integration;
- primary evidence for operational SEO Dashboard decisions.

Layer B. Optional Metrica mirror:

- env-gated counter;
- approved telemetry-to-goal mapping;
- `reachGoal` call through approved client adapter;
- no-op if disabled, unavailable or ineligible;
- external analytics/Yandex ecosystem layer only.

## 2. Official Yandex Metrica Constraints

Official docs relevant to this Blueprint:

- Tag library is loaded from `https://mc.yandex.ru/metrika/tag.js`; `ym` is created by the tag snippet and initialized with `ym(counterId, "init", options)`.
- JavaScript event goals are completed by calling `ym(counterId, "reachGoal", target[, params[, callback[, ctx]]])`.
- JavaScript event goal identifiers are the target strings configured in the counter.
- Metrica init options include `clickmap`, `webvisor`, `trackLinks`, `accurateTrackBounce`, `ecommerce` and others.
- `webvisor` controls Session Replay; `clickmap` controls click map collection; `ecommerce` is separate ecommerce collection.

Implication:

- `ym()` is a browser JavaScript API.
- A server-side adapter running after `/api/telemetry/events` cannot directly call `ym()`.
- For R1 JavaScript goals, the safe default is a controlled browser-side bridge, not a server-side `ym()` call.

Official references:

- https://yandex.com/support/metrica/en/code/counter-initialize
- https://yandex.com/support/metrica/ru/objects/reachgoal
- https://yandex.com/support/metrica/en/general/goal-js-event
- https://yandex.com/dev/metrika/en/management/openapi/goal/goal

## 3. Architecture Options

### Option A. Client-side bridge

Description:

```text
Public tracker captures action
-> browser sends telemetry
-> browser calls ym(counterId, "reachGoal", goal)
```

Pros:

- `ym()` is available in browser.
- JavaScript event goals naturally work this way.
- Live smoke is straightforward.

Cons:

- Risk of arbitrary `ym()` calls from UI components.
- Client cannot naturally read current httpOnly internal traffic marker.
- Needs strict central wrapper and tests.
- Needs an explicit design to avoid bypassing telemetry boundary.

Verdict:

- Technically viable, but too easy to devolve into direct UI analytics calls unless constrained.

### Option B. Server-side bridge

Description:

```text
Public tracker
-> POST /api/telemetry/events
-> server stores event
-> server tries to send goal to Metrica
```

Pros:

- Central server control.
- Server can reliably apply internal/test/admin eligibility after validation.
- Less browser coupling.

Cons:

- `ym()` is not available server-side.
- R1 goals are JavaScript event goals, and official docs describe sending them through JavaScript `reachGoal`.
- A separate server-side/offline mechanism, if used later, would be a different integration and needs separate API verification.
- Risk of modelling Metrica incorrectly for JS goals.

Verdict:

- Rejected for R1 as the primary design. Do not implement a fake server-side `ym()` bridge.

### Option C. Controlled client-side / hybrid telemetry adapter

Description:

Public tracker remains the single public capture surface. Internal telemetry POST/storage remains the primary event path. A centralized browser-safe adapter handles optional Metrica mirroring only after the event passes local eligibility and mapping rules.

Proposed flow:

```text
User action
-> AnalyticsTracker semantic capture
-> build sanitized telemetry payload
-> local R1 eligibility check
-> POST /api/telemetry/events
-> internal telemetry validation/storage is primary
-> if Metrica enabled and event eligible:
     centralized Metrica mirror adapter calls ym(counterId, "reachGoal", mappedGoal)
-> no-op if disabled/unavailable/ineligible
```

Eligibility must account for:

- event name and contact channel;
- env flag;
- counter id;
- `ym` availability;
- internal/admin/test status available to browser;
- no duplicate goal for one action;
- no unsupported/future event mapping.

Pros:

- Uses `ym()` where it exists: browser.
- Preserves `/api/telemetry/events` as the public telemetry ingestion boundary.
- Keeps arbitrary components from calling `ym()` directly.
- Keeps mapping centralized and testable.
- Supports env-off no-op.

Cons:

- Requires a safe browser-visible tracking eligibility signal or equivalent design.
- Client-side bridge cannot rely solely on server-side validation before firing for navigation/beacon events.
- Needs careful tests to prevent future direct calls.

Verdict:

- Recommended R1 architecture.

## 4. Architecture Decision Summary

Chosen option: **Option C. Controlled client-side / hybrid telemetry adapter**.

Why:

- Yandex JavaScript goals are designed around browser `ym(..., "reachGoal", target)`.
- Server-side `ym()` is impossible.
- Pure client-side direct calls would violate project boundary discipline.
- A centralized public telemetry adapter keeps public events in one capture flow while allowing Metrica JS goals.
- This choice does not make Metrica primary. It only reflects that JavaScript goals can be mirrored from the browser, while internal telemetry POST/storage remains the source-of-truth event path.

Rejected:

- Option A as unrestricted client-side direct `ym()` calls.
- Option B as fake server-side `ym()` bridge for JavaScript event goals.

Conditions before implementation:

- Privacy/cookie posture approved.
- Counter init options approved.
- Production Metrica flag is not enabled until privacy/cookie posture and any required policy/banner copy are approved.
- Webvisor/clickmap/session replay/ecommerce explicitly disabled or separately approved.
- Tracking eligibility design approved: server-rendered public-safe `trackingAllowed` config is the recommended mechanism.
- Goal mapping approved.
- Internal telemetry smoke must be part of acceptance independently from Metrica.
- Tests added to enforce no direct `ym()` outside approved adapter files.

## 5. Proposed Architecture

Recommended R1 implementation shape:

```text
User action
-> centralized public telemetry dispatcher
-> POST /api/telemetry/events
-> internal telemetry validation/storage (primary)
-> optional Metrica mirror via approved client adapter if enabled/eligible:
     ordinary non-navigation click:
       if POST returns 202 and event is eligible:
         public Metrica mirror adapter calls ym(counterId, "reachGoal", goalName)
     navigation/beacon event:
       controlled fallback may fire after local eligibility when waiting for 202 would drop the external mirror signal
```

Key implementation principle:

- `AnalyticsTracker` remains the only public capture mechanism for semantic events.
- UI components only provide `data-analytics-*` attributes.
- UI components do not import Metrica helpers and do not call `ym()`.
- Metrica mirror is attached to the public telemetry dispatcher/adapter layer, not scattered in UI components.
- Server-side telemetry validation/storage remains canonical for internal reporting and future operational read model integration.

Important design requirement:

- Because current internal traffic marker is httpOnly, R1 implementation must introduce a safe browser-visible tracking eligibility signal before any client-side goal call is allowed.
- Recommended mechanism: server-rendered/public-safe config passed to `AnalyticsTracker` with `metricaEnabled`, `counterId`, `trackingAllowed` and `metricaOptions`.
- `trackingAllowed=false` for admin/internal/test contexts; browser code must treat this as a hard no-op for Metrica.
- Response-based eligibility can still be used for ordinary clicks by waiting for `202`, but it is not sufficient alone for beacon/navigation scenarios.
- Do not rely on reading the existing httpOnly internal cookie from browser JavaScript.

POST/reachGoal ordering decision:

- Ordinary non-navigation click events: attempt `/api/telemetry/events` first; call reachGoal only after a successful `202` response.
- Navigation/beacon events: allow a controlled fallback that may call reachGoal after local eligibility and dedupe if waiting for `202` would make the signal unreliable.
- The fallback must be limited to approved mapped events and must not run for internal/test/admin traffic.
- Implementation must document which event types use `202`-gated mode and which use fallback mode.

Dedupe decision:

- Every candidate Metrica goal call must have a short-lived client-side dedupe key.
- Preferred key shape: `client_event_id = crypto.randomUUID()` generated when building the telemetry payload, plus a derived dedupe key `${client_event_id}:${goalName}`.
- If the server later returns `telemetry_event_id`, it can be logged/diagnosed, but R1 must not require it for navigation fallback.
- Keep an in-memory Set/Map with a short TTL, for example 5-10 seconds, to avoid duplicate listener/handler invocations for the same user action.
- Dedupe is a client bridge guard only; it is not a substitute for server telemetry validation.

## 6. Files Likely To Change

Likely implementation files, not changed by this Blueprint:

- `components/public/AnalyticsTracker.js`
- `lib/telemetry/events.js`
- `lib/telemetry/adapters.js` only if shared naming/contracts are needed; current file is server-side, so do not put browser-only `window.ym` code there unless the module is split safely.
- new public-safe module such as `lib/telemetry/metrica-goals.js` for pure mapping;
- new client/browser module such as `components/public/MetricaTracker.js` or `components/public/telemetry-metrica-adapter.js`;
- public layout/rendering boundary where `AnalyticsTracker` receives browser-safe config;
- tests such as `tests/telemetry-metrica-adapter.test.js` and updates to `tests/telemetry-no-direct-adapters.test.js`.

Approved `ym()` allowlist for implementation:

- one Metrica counter bootstrap component/module, for example `components/public/MetricaCounter.js`;
- one centralized client adapter, for example `components/public/telemetry-metrica-adapter.js`.

All other files, including public page components and renderers, must be forbidden from direct `ym()` calls by tests. If implementation chooses different filenames, the allowlist must be updated in PRD/Blueprint or implementation report before coding.

Potential docs updates after implementation:

- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- implementation report under `docs/reports/YYYY-MM-DD/`.

## 7. Env Design

Browser-safe env/config:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED`
- `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`

Server-only env/config that must never reach browser:

- `YANDEX_METRICA_OAUTH_TOKEN`
- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_WEBMASTER_OAUTH_TOKEN`
- `YANDEX_OAUTH_REFRESH_TOKEN`
- `YANDEX_OAUTH_CLIENT_ID` should remain server-side unless there is a separate OAuth UX reason; R1 does not need it in browser.

Rules:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false` means no script, no `ym()` call, no user-visible error.
- Missing/invalid `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID` means no-op, not runtime crash.
- The counter id is not secret.
- OAuth tokens are not needed for public counter or `reachGoal`.

## 8. Counter Init Options

Conservative default proposal for R1, pending explicit product/privacy approval:

```js
ym(counterId, "init", {
  clickmap: false,
  webvisor: false,
  ecommerce: false,
  trackLinks: false,
  accurateTrackBounce: true
});
```

Notes:

- `webvisor: false` by default because it enables Session Replay.
- `clickmap: false` by default because semantic telemetry already exists and visual click maps require separate privacy/product decision.
- `ecommerce: false` because project has no ecommerce use case in R1.
- `trackLinks: false` until outbound link tracking is explicitly approved; contact actions are already captured semantically.
- `accurateTrackBounce` must be an explicit product/privacy decision before implementation. `true` is a candidate default, not an approved setting in this draft.
- If the final generated Metrica snippet or project privacy decision requires a different option shape, implementation must follow the reviewed R1 Blueprint/PRD update, not this draft blindly.

## 9. Goal Mapping Contract

Mapping input:

```text
telemetry event_name
+ contact_channel
+ metadata.destination_kind / metadata.target_type / metadata.analytics_id when needed
-> Metrica goal name
```

Approved initial mapping:

| Event | Condition | Goal | Status |
| --- | --- | --- | --- |
| `phone_clicked` | `contact_channel=phone` | `click_to_call` | implement |
| `messenger_clicked` | `contact_channel=telegram` | `click_to_telegram` | implement |
| `messenger_clicked` | `contact_channel=whatsapp` | `click_to_whatsapp` | implement |
| `cta_clicked` | non-contact CTA only | `cta_click` | implement if destination is not contact |
| `gallery_opened` | any valid gallery event | `gallery_open` | implement |
| `case_card_opened` | case card click/open | `case_card_click` | implement |
| `service_card_opened` | service card click/open | `service_link_click` | implement |
| `faq_expand` equivalent | only when a real telemetry event exists | `faq_expand` | future |
| form start equivalent | only when a real telemetry event exists | `form_start` | future |
| form submit equivalent | only when a real telemetry event exists | `form_submit` | future |
| separate contact navigation | only if not duplicate phone/messenger/email | `contact_link_click` | future/decision |

Explicitly forbidden mapping:

- `page_viewed` -> any goal in R1;
- `page_engagement_recorded` -> any goal in R1;
- `email_clicked` -> phone/telegram/whatsapp goal;
- `contact_journey_created` -> any public goal;
- unsupported/future form/FAQ goals before real public events exist;
- internal/test/admin/QA events;
- synthetic smoke events unless smoke mode is explicitly approved.

Double-counting rule:

- One telemetry action may produce at most one Metrica goal in R1.
- Contact intent wins over generic CTA/contact navigation.

## 10. Validation / Eligibility Rules

ReachGoal may fire only if all conditions are true:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED` is enabled.
- Counter id is a valid integer-like string.
- Metrica script is initialized or `ym` queue stub exists.
- The event was produced by the centralized public telemetry dispatcher.
- Event name is in the current public telemetry allowlist.
- Event is not admin route.
- Event is not test/smoke unless explicit smoke mode is approved.
- Event is not internal/admin user traffic according to the approved tracking eligibility design.
- Mapping returns a goal.
- Goal is in the approved goal set.
- The same action has not already triggered a goal.
- For ordinary non-navigation clicks, `/api/telemetry/events` returned `202`.
- For fallback navigation/beacon events, the event type is explicitly allowed for fallback and has a dedupe key.

Server-side validation remains canonical for telemetry storage. Client-side eligibility is a guard for the external goal bridge, not a replacement for `/api/telemetry/events` validation.

## 11. Failure Behavior

If Metrica is disabled:

- no script is injected;
- no reachGoal call happens;
- telemetry storage continues.
- R1 core operational telemetry remains valid.

If `ym` is unavailable or blocked:

- telemetry storage continues;
- user sees no error;
- no infinite retry;
- the missed Metrica mirror is not used to reconstruct operational truth;
- optional safe diagnostic is allowed only if it does not expose secrets or user-entered values.

If telemetry POST fails:

- current tracker behavior may continue to ignore the failure for UX safety;
- ordinary non-navigation events must not call reachGoal;
- navigation/beacon events may use controlled fallback only if the event type is explicitly allowed, local eligibility passes and dedupe has not already fired;
- fallback behavior must be covered by tests.

In all cases, Metrica success/failure must not block internal telemetry, user navigation or page interaction.

## 12. Testing Plan

Required tests:

- internal telemetry POST/storage path remains independent from Metrica env;
- env off -> no Metrica script and no reachGoal;
- env on -> counter script/config present;
- mapping `phone_clicked` -> `click_to_call`;
- mapping `messenger_clicked` + `telegram` -> `click_to_telegram`;
- mapping `messenger_clicked` + `whatsapp` -> `click_to_whatsapp`;
- mapping `cta_clicked` contact destination -> no `cta_click`;
- unsupported event -> no reachGoal;
- internal/test/admin event -> no reachGoal;
- ordinary non-navigation event calls reachGoal only after mocked `202`;
- failed telemetry POST suppresses reachGoal for ordinary events;
- approved navigation/beacon fallback can call reachGoal without waiting for `202` only when explicitly allowed;
- duplicate handler invocation with same `client_event_id`/dedupe key produces one reachGoal;
- no direct `ym()` outside approved adapter/bootstrap files;
- no direct `/api/analytics/events` from public tracker;
- secrets are not present in public bundle/config docs;
- `email_clicked` is not mapped to existing phone/messenger goals.

Recommended test file coverage:

- pure mapping unit tests;
- adapter no-op tests;
- public tracker direct-call guard tests;
- optional HTML/render smoke for env on/off.

Approved-file guard:

- Extend `tests/telemetry-no-direct-adapters.test.js` or add a sibling test so direct `ym(` is allowed only in the approved bootstrap/adapter files.
- The allowlist must be narrow and explicit.

## 13. Live Smoke Plan

Smoke sequence for implementation, not this design task:

1. Deploy with `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false`.
2. Verify public pages work and Metrica script is absent.
3. Open a public page as non-admin/non-internal user.
4. Trigger one approved event, preferably `phone_clicked` or a safe CTA.
5. Stage 0 internal smoke: verify telemetry storage contains the event and it is not internal/test. This is the primary R1 proof.
6. Enable Metrica flag on canonical runtime env only after privacy approval.
7. Rebuild/redeploy/recreate if required by Next public env behavior.
8. Trigger one approved event again.
9. Stage 1 mirror smoke: prove browser-level `ym(..., "reachGoal", ...)` call via controlled mock/diagnostic/browser instrumentation.
10. Stage 2 external smoke: verify corresponding Metrica goal after acceptable delay.
11. Do not treat missing immediate Metrica UI visibility as failure if Stage 0 and Stage 1 are proven and delayed Metrica verification is scheduled.
12. Run `npm run yandex:check-metrica` on canonical runtime to confirm counter/goals remain configured.
13. Record smoke evidence without tokens/secrets.

## 14. Rollback Plan

Rollback:

- set `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false`;
- rebuild/redeploy/recreate if public env is build-time baked;
- telemetry storage continues through `/api/telemetry/events`;
- no DB rollback required;
- no migration rollback required;
- no secret rotation required unless a secret was accidentally exposed.

If bad mapping causes double-counting:

- disable flag;
- patch mapping;
- record tracking change in handoff/report so later trend interpretation accounts for measurement change.

## 15. Security / Privacy

Rules:

- no OAuth token in browser;
- no client secret in browser;
- no Yandex Webmaster token in browser;
- no form values;
- no raw personal data;
- no Webvisor/clickmap/session replay by default;
- no ecommerce by default;
- no direct UI -> Yandex API;
- no direct UI component `ym()` calls;
- no treating Metrica as operational source of truth;
- no secrets in reports.

R1 must not change:

- lead/intake state;
- analytics read model source states;
- scheduled imports;
- LLM context.

## 16. Technical Acceptance Criteria

Implementation is acceptable only if:

- PRD and Blueprint are reviewed.
- Internal telemetry remains the primary operational event path.
- Public action storage in telemetry tables is proven independently from Metrica.
- Metrica mirror failures do not block telemetry storage or UX.
- Metrica script is env-gated.
- Env-off mode is verified nonbreaking.
- Counter id is browser-safe and tokens are absent from browser.
- Public tracker still posts to `/api/telemetry/events`.
- Approved bridge is centralized.
- Direct `ym()` is allowed only in approved adapter/bootstrap files.
- Direct `/api/analytics/events` remains absent from public tracker.
- Mapping tests pass.
- Internal/test/admin traffic does not trigger reachGoal according to approved tracking eligibility design.
- Ordinary non-navigation reachGoal calls wait for successful telemetry `202`.
- Navigation/beacon fallback is explicitly scoped and tested.
- Client-side dedupe prevents duplicate reachGoal calls for the same action.
- Webvisor/clickmap/ecommerce are disabled unless separately approved.
- Live smoke is staged: internal telemetry storage proof first, browser-level reachGoal mirror proof second if enabled, delayed Metrica goal verification third.
- Implementation report and conformity audit are created before closure.

## 17. Open Questions / Decisions

Must be decided before implementation:

- Exact counter init options.
- Cookie/banner/policy copy requirement.
- Final product/privacy decision for `trackLinks` and `accurateTrackBounce`.
- Whether a safe local diagnostic should record reachGoal sent/skipped/failed.
- Which later internal aggregate/read-model slice will consume operational telemetry data.
- Whether `contact_link_click` needs a new first-party telemetry event before Metrica mapping.
- Whether future FAQ/form public telemetry should be added in a later slice or bundled into R1 only if already available.

## 18. Non-Implementation Note

This Blueprint is documentation/architecture only.

It does not:

- implement Metrica script;
- call `ym()`;
- change runtime env;
- change telemetry code;
- change UI;
- run scheduled imports;
- change read model;
- add migrations.
