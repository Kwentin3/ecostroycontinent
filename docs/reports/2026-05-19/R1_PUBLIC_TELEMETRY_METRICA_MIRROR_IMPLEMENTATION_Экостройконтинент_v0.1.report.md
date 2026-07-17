# R1 Public Telemetry Metrica Mirror Implementation Экостройконтинент v0.1

Дата: 2026-05-19

## Executive Verdict

R1 implemented and deployed in the intended conservative posture.

Internal first-party telemetry remains the operational source of truth. Yandex Metrica is implemented only as an optional, env-gated external mirror. Production Metrica enablement was not turned on because privacy/cookie approval for a public counter is still an explicit gate.

## Branch / Commit / Runtime

- Branch: `feat/r1-public-telemetry-metrica-mirror`
- Implementation commit: `64599542d2da214378298356f5afe1002b1ff5f5`
- Runtime target: Selectel VM canonical compose stack `repo-app-1` + `repo-sql-1`
- Canonical env: `/opt/ecostroycontinent/runtime/.env`
- Published image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:29072f56a0f9f4d4f36948aec0a866200f93e266d4dbe0ecccff3d9abad93304`
- Build workflow: `build-and-publish`, run `26088546012`, success
- Deploy workflow: `deploy-phase1`, run `26088677869`, success
- Deployed readiness commit: `64599542d2da214378298356f5afe1002b1ff5f5`

## Files Changed

- `components/public/AnalyticsTracker.js`
- `components/public/MetricaCounter.js`
- `components/public/PublicRenderers.js`
- `components/public/PublicTrackingBoundary.js`
- `components/public/telemetry-metrica-adapter.js`
- `lib/config.js`
- `lib/telemetry/metrica-config.js`
- `lib/telemetry/metrica-goals.js`
- `tests/admin-visibility-ui.test.js`
- `tests/telemetry-event-route.test.js`
- `tests/telemetry-metrica-mirror.test.js`
- `tests/telemetry-no-direct-adapters.test.js`
- R1 roadmap/PRD/Blueprint/handoff docs and reports.

## Chosen Architecture

Chosen architecture: controlled client-side/hybrid mirror adapter.

Runtime flow:

```text
User action
-> AnalyticsTracker semantic capture
-> POST /api/telemetry/events
-> internal telemetry storage is primary
-> optional Metrica mirror through centralized adapter if enabled, eligible and accepted
```

For ordinary non-navigation events, `reachGoal` waits for telemetry `202`. For beacon-sensitive click events, the adapter allows a controlled fallback only after local eligibility and dedupe pass.

`/api/analytics/events` remains separate and is not used by the public tracker.

## Metrica Init Options

Implemented conservative defaults:

```js
{
  clickmap: false,
  webvisor: false,
  ecommerce: false,
  trackLinks: false,
  accurateTrackBounce: false
}
```

Browser-safe public env only:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED`
- `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`

No OAuth token, Webmaster token, client secret or refresh token is read by public components.

## Goal Mapping Implemented

Current implemented mappings:

| Telemetry event | Condition | Metrica goal |
| --- | --- | --- |
| `phone_clicked` | `contact_channel=phone` | `click_to_call` |
| `messenger_clicked` | `contact_channel=telegram` | `click_to_telegram` |
| `messenger_clicked` | `contact_channel=whatsapp` | `click_to_whatsapp` |
| `cta_clicked` | non-contact destination | `cta_click` |
| `gallery_opened` | current public event | `gallery_open` |
| `case_card_opened` | current public event | `case_card_click` |
| `service_card_opened` | current public event | `service_link_click` |

Intentionally not mapped until real events exist or a separate decision is made:

- `form_start`
- `form_submit`
- `contact_link_click`
- `faq_expand`

Forbidden mappings are enforced in tests: `page_viewed`, `page_engagement_recorded`, `email_clicked`, `contact_journey_created`, unsupported/internal/test/admin events.

## Env-Off Behavior

When `NEXT_PUBLIC_YANDEX_METRICA_ENABLED` is false or counter id is invalid:

- no Metrica script is rendered;
- no `ym()` call is made;
- `AnalyticsTracker` still posts to `/api/telemetry/events`;
- internal telemetry storage remains valid;
- user UX is not blocked.

Live env-off smoke on production:

- public home HTML fetched successfully;
- no `mc.yandex.ru/metrika/tag.js`, `yandex-metrica-counter` or `ym(` marker found in public HTML;
- `/api/telemetry/events` accepted a safe test `phone_clicked` event with `202`;
- telemetry response: `{"ok":true,"stored":true,"event_name":"phone_clicked","journey_created":true}`.

## Env-On Behavior

Env-on behavior is implemented and test-covered:

- valid browser-safe counter config renders the bootstrap component;
- `ym(counterId, "init", options)` exists only in the approved bootstrap module;
- approved events mirror to `reachGoal` through the centralized adapter;
- ordinary mirror waits for telemetry `202`;
- fallback is explicit and deduped;
- Metrica failure/unavailability does not block internal telemetry.

Production env-on was not enabled during this implementation because privacy/cookie approval remains required before loading a public counter.

## Internal Telemetry Smoke Proof

Production smoke:

- endpoint: `https://ecostroycontinent.ru/api/telemetry/events`;
- event: `phone_clicked`;
- marker: `is_test=true`;
- response: `202 Accepted`;
- body: `ok=true`, `stored=true`, `event_name=phone_clicked`, `journey_created=true`;
- response set `esc_telemetry_session` as HttpOnly session cookie.

This proves the internal telemetry path independently from Metrica.

## Optional Metrica Mirror Proof

Automated proof:

- mapping tests cover all implemented goals;
- adapter tests prove `reachGoal` waits for accepted telemetry on ordinary events;
- adapter tests prove dedupe for the same `client_event_id + goal`;
- guard tests restrict direct `ym(` to the approved bootstrap/adapter boundary.

Live Metrica goal verification is delayed/pending because the production public counter flag was intentionally not enabled without privacy/cookie approval.

## Tests / Build

Commands run:

- `node --experimental-specifier-resolution=node --test tests/telemetry-metrica-mirror.test.js tests/telemetry-no-direct-adapters.test.js tests/telemetry-event-route.test.js` - pass, 17 tests.
- `npm test` - pass, 524 tests.
- `npm run build` - pass.
- GitHub `build-and-publish` workflow - pass.
- GitHub `deploy-phase1` workflow - pass.

## Security Checks

- `rg "\bym\s*\(" components/public app lib -S` found direct init call only in `components/public/MetricaCounter.js`.
- `rg "/api/analytics/events" components/public app -S` found no public tracker usage.
- Public tracking tests verify server-only Yandex secret names are not used by public code.
- Reports do not include secret values.
- No Webvisor, clickmap, ecommerce, session replay or visual heatmap was enabled.
- Read model was not changed to consume Metrica.
- No UI -> Yandex API coupling was added.
- No LLM, scheduled import, lead/intake or Content Core mutation was added.

## Known Limitations

- Production Metrica public counter remains disabled until privacy/cookie posture is approved.
- Live Metrica goal visibility was not checked because the public counter was not enabled.
- `client_event_id` currently protects the Metrica mirror dedupe path; it is not a new server storage contract.
- Future `form_start`, `form_submit`, `faq_expand` and `contact_link_click` goals need real telemetry events before mapping.

## Next Steps

1. Owner/product decision: approve or reject production privacy/cookie posture for public Metrica counter.
2. If approved, set `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true` in canonical runtime/build context and rebuild/redeploy.
3. Run staged env-on smoke: browser-level `reachGoal` proof first, Metrica goal visibility after acceptable delay.
4. Proceed to R2/R3 imports only as external aggregate enrichment, not as operational truth for user actions.

## Git Status

At implementation deploy, code was committed as `64599542d2da214378298356f5afe1002b1ff5f5` and pushed to origin. This report and closure doc updates are a follow-up documentation package.
