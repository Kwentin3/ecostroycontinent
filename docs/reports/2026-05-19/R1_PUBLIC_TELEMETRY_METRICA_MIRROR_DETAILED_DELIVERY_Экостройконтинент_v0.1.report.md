# R1 Public Telemetry Metrica Mirror Detailed Delivery Экостройконтинент v0.1

Дата: 2026-05-19

## 1. Executive Verdict

Домен R1 "Public Telemetry Operational Measurement + Optional Metrica Goal Mirror" реализован, протестирован, опубликован в GHCR и задеплоен на canonical runtime.

Ключевая архитектурная позиция сохранена:

```text
internal first-party telemetry = operational source of truth
Yandex Metrica = optional external mirror/enrichment layer
```

Production public Metrica counter не был включен без privacy/cookie approval. Это намеренный conservative default: код и mirror-path готовы, но runtime остается safe-disabled до отдельного owner/product decision.

## 2. Branch / Commits / Runtime

- Branch: `feat/r1-public-telemetry-metrica-mirror`
- Implementation commit: `64599542d2da214378298356f5afe1002b1ff5f5`
- Closure docs commit: `e35f9b2`
- Previous base: `4bdf44d Tighten service scope column spacing`
- Runtime target: Selectel VM canonical compose stack
- Compose services: `repo-app-1` + `repo-sql-1`
- Canonical env: `/opt/ecostroycontinent/runtime/.env`
- Deployed image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:29072f56a0f9f4d4f36948aec0a866200f93e266d4dbe0ecccff3d9abad93304`

## 3. Delivery Artifacts

Primary reports:

- `docs/reports/2026-05-19/R1_PUBLIC_TELEMETRY_METRICA_MIRROR_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R1_PUBLIC_TELEMETRY_METRICA_MIRROR_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R1_PUBLIC_TELEMETRY_METRICA_MIRROR_DETAILED_DELIVERY_Экостройконтинент_v0.1.report.md`

Design context:

- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R1_INTERNAL_TELEMETRY_FIRST_METRICA_MIRROR_REFINE_Экостройконтинент_v0.1.report.md`

Updated handoff/roadmap docs:

- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

## 4. Implemented Architecture

Chosen implementation: controlled client-side/hybrid mirror adapter.

Main flow:

```text
User action
-> AnalyticsTracker semantic capture
-> POST /api/telemetry/events
-> telemetry validation/storage
-> internal telemetry remains canonical operational truth
-> optional Metrica mirror if enabled, eligible and accepted
```

Important boundary decisions:

- Public tracker stays on `/api/telemetry/events`.
- Public tracker does not call `/api/analytics/events`.
- UI does not call Yandex API.
- Server-only Yandex credentials are not exposed to browser code.
- Direct `ym()` usage is restricted to approved bootstrap/adapter boundary.
- Metrica failures do not block internal telemetry or user UX.

## 5. Code Changes

Public tracking:

- `components/public/AnalyticsTracker.js`
  - still owns semantic public capture;
  - posts to `/api/telemetry/events`;
  - mirrors only through centralized adapter;
  - ordinary non-navigation mirror waits for telemetry `202`;
  - beacon-sensitive click fallback is explicit and guarded.

- `components/public/PublicTrackingBoundary.js`
  - server-side browser-safe tracking boundary;
  - resolves internal/admin context where detectable;
  - passes public-safe Metrica config to client components.

- `components/public/PublicRenderers.js`
  - public pages now mount `PublicTrackingBoundary`.

Metrica bootstrap/mirror:

- `components/public/MetricaCounter.js`
  - env-gated script bootstrap;
  - no render if disabled, invalid or tracking disallowed;
  - conservative init options only.

- `components/public/telemetry-metrica-adapter.js`
  - centralized mirror adapter;
  - mapping/eligibility/dedupe/failure no-op;
  - no dependency on server-only tokens.

Telemetry config/contracts:

- `lib/config.js`
  - adds browser-safe public env parsing.

- `lib/telemetry/metrica-config.js`
  - derives public Metrica config from app config.

- `lib/telemetry/metrica-goals.js`
  - owns goal constants, conservative init options, counter id validation and mapping policy.

Tests:

- `tests/telemetry-metrica-mirror.test.js`
- `tests/telemetry-no-direct-adapters.test.js`
- `tests/telemetry-event-route.test.js`
- `tests/admin-visibility-ui.test.js`

## 6. Metrica Init Options

Implemented defaults:

```js
{
  clickmap: false,
  webvisor: false,
  ecommerce: false,
  trackLinks: false,
  accurateTrackBounce: false
}
```

Rationale:

- privacy/cookie posture is not approved for production enablement;
- semantic first-party telemetry already exists;
- Webvisor/clickmap/session replay are not required for R1 MVP;
- ecommerce has no current product use case.

## 7. Goal Mapping

Implemented mappings are limited to current real public telemetry events.

| Telemetry event | Condition | Metrica goal |
| --- | --- | --- |
| `phone_clicked` | `contact_channel=phone` | `click_to_call` |
| `messenger_clicked` | `contact_channel=telegram` | `click_to_telegram` |
| `messenger_clicked` | `contact_channel=whatsapp` | `click_to_whatsapp` |
| `cta_clicked` | non-contact destination | `cta_click` |
| `gallery_opened` | current event exists | `gallery_open` |
| `case_card_opened` | current event exists | `case_card_click` |
| `service_card_opened` | current event exists | `service_link_click` |

Not mapped yet:

- `form_start`
- `form_submit`
- `contact_link_click`
- `faq_expand`

Forbidden:

- `page_viewed` to any goal;
- `page_engagement_recorded` to any goal;
- `email_clicked` to phone/messenger goals;
- `contact_journey_created` to public goals;
- internal/test/admin/QA events;
- unsupported future events before they exist.

Double-counting rule:

- one user action should produce at most one Metrica goal;
- contact intent wins over generic CTA/contact navigation;
- dedupe key is based on `client_event_id + goalName`.

## 8. Env-Off Behavior

With Metrica disabled:

- public HTML has no Metrica bootstrap;
- no `ym()` call is made;
- internal telemetry still works;
- endpoint returns normal telemetry storage response;
- user-visible UX is unchanged.

This is the current production posture.

## 9. Env-On Behavior

Implemented and test-covered:

- valid public config loads the counter;
- bootstrap calls `ym(counterId, "init", conservativeOptions)`;
- approved event can mirror to `reachGoal`;
- ordinary event waits for `/api/telemetry/events` `202`;
- explicit beacon fallback is allowed only through adapter conditions;
- mirror failure is best-effort and does not block internal telemetry.

Not performed in production:

- public Metrica flag was not enabled;
- live Yandex goal visibility was not checked.

Reason: privacy/cookie approval is still required before loading a public analytics counter.

## 10. Local Verification

Commands run:

```powershell
node --experimental-specifier-resolution=node --test tests/telemetry-metrica-mirror.test.js tests/telemetry-no-direct-adapters.test.js tests/telemetry-event-route.test.js
npm test
npm run build
```

Results:

- targeted tests: pass, 17 tests;
- full test suite: pass, 524 tests;
- production build: pass.

Important guard coverage:

- Metrica config is env-gated and conservative;
- mapping covers only approved current telemetry events;
- unsupported/internal/test events do not mirror;
- ordinary mirror waits for telemetry `202`;
- fallback path is explicit and deduped;
- direct `ym(` is restricted to approved files;
- public tracker does not use `/api/analytics/events`;
- public tracking code does not expose server-only Yandex secret names.

## 11. Build / Publish / Deploy

GitHub Actions:

- `build-and-publish`, run `26088546012`: success.
- Published image digest: `sha256:29072f56a0f9f4d4f36948aec0a866200f93e266d4dbe0ecccff3d9abad93304`.
- `deploy-phase1`, run `26088677869`: success.

Deploy workflow evidence:

- host env file verified;
- runner-managed image pin refreshed;
- app image pulled;
- `npm run db:migrate` executed by existing deploy workflow;
- compose stack refreshed;
- Traefik health/readiness probe passed;
- readiness runtime commit is `64599542d2da214378298356f5afe1002b1ff5f5`.

No new runtime, no second SQL truth, no manual env/secrets file committed.

## 12. Live Smoke

Production readiness:

```json
{
  "status": "ready",
  "database": { "status": "ok" },
  "runtime": {
    "commit": "64599542d2da214378298356f5afe1002b1ff5f5",
    "version": "0.1.0"
  }
}
```

Public HTML env-off smoke:

- fetched `https://ecostroycontinent.ru/`;
- page loaded successfully;
- no `mc.yandex.ru/metrika/tag.js`;
- no `yandex-metrica-counter`;
- no public inline `ym(` marker.

Telemetry POST smoke:

- endpoint: `https://ecostroycontinent.ru/api/telemetry/events`;
- event: `phone_clicked`;
- marker: `is_test=true`;
- response status: `202 Accepted`;
- response body: `{"ok":true,"stored":true,"event_name":"phone_clicked","journey_created":true}`;
- session cookie: `esc_telemetry_session`, HttpOnly.

This confirms internal telemetry works independently from Metrica.

## 13. Security / Privacy Checks

Confirmed:

- no Yandex OAuth token in browser-facing config;
- no Webmaster token in browser-facing config;
- no client secret in browser-facing config;
- no direct UI -> Yandex API;
- no public tracker -> `/api/analytics/events`;
- no arbitrary public component `ym()` calls;
- no form values added;
- no raw personal data added;
- no Webvisor/clickmap/ecommerce/session replay enabled;
- no scheduled import added;
- no LLM or lead/intake code touched.

Security search note:

- integration docs contain env key examples with empty values, not secret values;
- reports do not contain secret values.

## 14. Acceptance Matrix

| Acceptance item | Status | Evidence |
| --- | --- | --- |
| Internal telemetry remains primary | Pass | Public tracker still posts to `/api/telemetry/events`. |
| Public events go through telemetry endpoint | Pass | Code and guard tests. |
| Internal telemetry works with Metrica disabled | Pass | Production POST smoke `202 stored:true`. |
| Metrica counter env-gated | Pass | Config/bootstrap implementation. |
| Env-off no script/no reachGoal | Pass | HTML smoke and tests. |
| Env-on loads safely | Pass in tests | Production flag not enabled pending approval. |
| No server-only secret reaches browser | Pass | Public config/tests. |
| Centralized mapping adapter | Pass | `telemetry-metrica-adapter.js`. |
| Unsupported/internal/test/admin suppressed | Pass | Mapping tests. |
| Ordinary reachGoal waits for `202` | Pass | Adapter tests. |
| Beacon fallback scoped/tested | Pass | Explicit fallback tests. |
| Dedupe | Pass | `client_event_id + goalName` TTL guard. |
| No direct `ym()` outside approved boundary | Pass | Guard test and `rg`. |
| No direct public tracker -> analytics endpoint | Pass | Guard test and `rg`. |
| Webvisor/clickmap/ecommerce/session replay disabled | Pass | Init options. |
| Tests pass | Pass | 524 tests. |
| Build passes | Pass | `npm run build`. |
| Server deploy/smoke passes | Pass | GH deploy + live smoke. |
| Reports created | Pass | Implementation, conformity, detailed delivery. |

## 15. Deviations / Gated Follow-Up

The only intentionally incomplete production action is enabling public Metrica.

Reason:

- R1 docs explicitly require privacy/cookie posture approval before production flag enablement;
- no approved policy/banner decision was available during implementation;
- owner instruction says to use conservative safe-disabled/no-op behavior for privacy/legal blockers.

Follow-up gate:

1. Approve privacy/cookie posture.
2. Decide if any banner/policy copy is required.
3. Set `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true` only after approval.
4. Rebuild/redeploy if public env is build-time baked.
5. Run staged smoke:
   - browser-level `ym(..., "reachGoal", goal)` proof;
   - delayed Yandex Metrica goal visibility check.

## 16. Closure Position

R1 implementation can be considered closed as a deployed safe-disabled domain slice.

The system now has:

- reliable internal public telemetry path;
- env-gated public Metrica counter bootstrap;
- centralized optional Metrica mirror;
- mapping/dedupe/suppression tests;
- production deploy;
- live internal telemetry smoke.

R1 should not be reopened to add imports, read-model aggregate wiring, UX refine, lead/intake or LLM. Those are separate roadmap phases.

## 17. Recommended Next Step

Nearest safe next step:

- product/owner privacy decision for public Metrica enablement.

If approved:

- enable public Metrica flag;
- rebuild/redeploy;
- verify one approved goal after acceptable delay.

If not approved:

- keep Metrica mirror disabled;
- continue to use internal telemetry as operational source of truth;
- plan R2/R3 only as external aggregate enrichment, not as the primary operational path.

## 18. Git Status

At the time this detailed report was created:

- branch: `feat/r1-public-telemetry-metrica-mirror`;
- latest pushed closure commit before this report: `e35f9b2`;
- implementation commit deployed: `6459954`;
- working tree before adding this report was clean.
