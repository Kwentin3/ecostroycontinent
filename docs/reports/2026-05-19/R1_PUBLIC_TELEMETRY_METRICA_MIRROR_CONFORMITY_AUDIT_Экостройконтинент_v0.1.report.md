# R1 Public Telemetry Metrica Mirror Conformity Audit Экостройконтинент v0.1

Дата: 2026-05-19

## Executive Verdict

R1 conforms to the refined strategy: internal telemetry is operational truth, and Yandex Metrica is an optional external mirror. The implementation can be closed in safe-disabled posture. Production Metrica enablement and live goal propagation remain a gated follow-up after privacy/cookie approval.

## Audited Against

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- Implementation commit `64599542d2da214378298356f5afe1002b1ff5f5`

## Scope Compliance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Internal telemetry remains primary | Pass | Public tracker still posts to `/api/telemetry/events`; production smoke returned `202` and `stored:true`. |
| Metrica counter env-gated | Pass | `NEXT_PUBLIC_YANDEX_METRICA_ENABLED` and `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID`; HTML smoke shows script absent when disabled. |
| Browser-safe config only | Pass | Public config uses only `NEXT_PUBLIC_*`; guard tests block server-only Yandex secrets. |
| Centralized mirror adapter | Pass | `components/public/telemetry-metrica-adapter.js`; no arbitrary component `ym()` calls. |
| Goal mapping limited to current events | Pass | Mapping tests cover supported and forbidden events. |
| Ordinary reachGoal after telemetry success | Pass | Adapter tests require accepted telemetry for ordinary events. |
| Navigation/beacon fallback controlled | Pass | Fallback requires explicit `fallbackAllowed`, eligibility and dedupe. |
| Dedupe | Pass | Short-window dedupe by `client_event_id + goalName`, covered by tests. |
| Internal/admin/test suppression | Pass | Mapping rejects `is_internal` and `is_test`; tracking boundary no-ops admin/internal where detectable. |
| Env-off no-op | Pass | No script/goal call when disabled; internal telemetry still works. |
| Server deploy | Pass | `deploy-phase1` run `26088677869` success; readiness commit matches implementation SHA. |

## Non-Goals Check

| Non-goal | Status |
| --- | --- |
| Scheduled Metrica imports | Not implemented |
| Scheduled Webmaster imports | Not implemented |
| Imported aggregates in read model | Not implemented |
| `/admin/visibility` UX redesign | Not implemented |
| LLM provider/UI | Not implemented |
| Lead/intake domain | Not implemented |
| Visual heatmap | Not implemented |
| Webvisor/clickmap/session replay | Disabled |
| Ecommerce | Disabled |
| UI direct to Yandex API | Not introduced |
| Public tracker direct to `/api/analytics/events` | Not introduced |
| Treating contact actions as leads | Not introduced |
| Making Metrica operational source of truth | Not introduced |
| Content Core mutation | Not introduced |

## Telemetry Boundary

Boundary preserved.

The public capture path remains:

```text
AnalyticsTracker
-> /api/telemetry/events
-> telemetry validation/storage
-> future internal operational aggregates/read model
```

The Metrica path is explicitly secondary:

```text
eligible accepted telemetry action
-> centralized Metrica adapter
-> optional ym reachGoal mirror
```

No code path rewires public UI to `/api/analytics/events`.

## Privacy Posture

Conservative defaults were implemented:

- `webvisor=false`
- `clickmap=false`
- `ecommerce=false`
- `trackLinks=false`
- `accurateTrackBounce=false`
- no session replay
- no visual clickmap
- production public counter disabled until approval

This matches the owner instruction to choose safe-disabled/no-op behavior if privacy/cookie posture is not approved.

## Acceptance Criteria

| Criterion | Result |
| --- | --- |
| Internal telemetry remains primary | Pass |
| Public events still go through `/api/telemetry/events` | Pass |
| Internal telemetry works with Metrica disabled | Pass |
| Metrica counter env-gated | Pass |
| Env-off has no script/reachGoal | Pass |
| Env-on loads safely | Pass in tests; production enablement gated |
| No server-only secret reaches browser | Pass |
| Centralized adapter maps approved events | Pass |
| Unsupported/internal/test/admin events do not call reachGoal | Pass |
| Ordinary non-navigation reachGoal waits for 202 | Pass |
| Navigation fallback scoped/tested | Pass |
| Dedupe prevents duplicate reachGoal for one action | Pass |
| No direct `ym()` outside approved files | Pass |
| No direct public tracker -> `/api/analytics/events` | Pass |
| Webvisor/clickmap/ecommerce/session replay disabled | Pass |
| Internal telemetry live smoke passes | Pass |
| Metrica mirror smoke | Browser-level/unit proof pass; live Yandex goal verification delayed until env-on approval |
| Tests pass | Pass: `npm test`, 524 tests |
| Build passes | Pass: `npm run build` |
| Server deploy/smoke passes | Pass |
| Reports created | Pass |
| Handoff/start-here/roadmap updated | Pass in closure doc package |

## Deviations

The only deliberate deviation from full env-on live verification is not enabling the production Metrica public counter. Reason: privacy/cookie approval remains a required product/legal gate. The implementation follows the safer owner instruction: keep production enablement behind env flag, document the blocker, and do not invent legal copy or enable session tracking features.

## Residual Risks

- If production Metrica is enabled later without rebuilding/redeploying when required by Next public env behavior, the script may remain absent. The enablement task must include rebuild/redeploy.
- Goal visibility in Metrica may lag. Staged smoke should not fail immediately if browser-level `reachGoal` is proven.
- Future event names must not be mapped to existing goals until real telemetry events exist and tests are updated.

## Closure Decision

R1 can be closed as an implemented, deployed, safe-disabled domain slice. The follow-up is not another implementation of the core bridge; it is an approval/enablement smoke slice:

1. approve privacy/cookie posture;
2. enable public Metrica flag;
3. rebuild/redeploy;
4. verify one approved live goal after acceptable delay.

R2/R3 may proceed independently as external aggregate enrichment only if the team accepts that Metrica live goal verification is still pending.

## Git Status

Implementation commit `64599542d2da214378298356f5afe1002b1ff5f5` was clean and deployed. This conformity audit is part of the final documentation closure package.
