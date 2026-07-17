# R1 Public Metrica Enablement and Final Smoke Report

Date: 2026-05-19  
Project: Ekostroycontinent  
Domain: R1 Public Telemetry Operational Measurement + Optional Metrica Goal Mirror  
Runtime target: Selectel VM, compose `repo-app-1` + `repo-sql-1`, canonical env `/opt/ecostroycontinent/runtime/.env`  
Branch: `feat/r1-public-telemetry-metrica-mirror`  
Runtime commit: `90896a9e4015864f15fb633cfc2259af8cce99cb`

## Executive Verdict

R1 public Metrica enablement was completed on canonical runtime after owner approval for the prototype-stage no-banner posture.

Project-controlled acceptance passed:

- internal telemetry remains the operational source of truth;
- public events still go through `/api/telemetry/events`;
- public Yandex Metrica counter `109037342` is enabled through `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true`;
- the counter loads in browser runtime with conservative options;
- approved `phone_clicked` action is stored in internal telemetry and mirrored through the centralized adapter as `ym(109037342, "reachGoal", "click_to_call")`;
- browser/network smoke confirmed Yandex `tag.js`, Yandex `watch/109037342`, telemetry `202`, and no browser-exposed secrets.

External Yandex Reporting API stats visibility is still delayed/pending. At `2026-05-19T10:19:00Z`, Metrica API returned `0` for `ym:s:visits`, `ym:s:pageviews`, and `ym:s:goal556869891reaches` over `7daysAgo..today`, despite browser/network proof. This is recorded honestly as delayed external stats visibility, not as a failure of the internal telemetry path.

## Owner Decision

The owner approved the current prototype-stage posture:

- enable public Yandex Metrica counter;
- do not add cookie/banner on this step;
- do not enable Webvisor;
- do not enable clickmap;
- do not enable ecommerce;
- do not enable session replay;
- keep conservative init options;
- keep internal telemetry as operational truth;
- keep Metrica as optional external mirror/enrichment.

## Env Changes

Canonical runtime env was updated without printing secrets.

Confirmed safe/public values:

- `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=true`
- `NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID=109037342`
- `YANDEX_METRICA_COUNTER_ID=109037342`

Confirmed server-only values were present but not printed:

- `YANDEX_METRICA_OAUTH_TOKEN`
- `YANDEX_WEBMASTER_OAUTH_TOKEN`
- client secret / refresh-token style values remained server-only

Backup created before edit:

- `/opt/ecostroycontinent/runtime/.env.bak-r1-metrica-enable-20260519T095354Z`

## Build and Deploy

Local verification before deploy:

- `npm test`: pass, `524/524`
- `npm run build`: pass

Canonical workflow:

- `build-and-publish` run `26089849136`: success
- `deploy-phase1` run `26089988732`: success

Runtime artifact:

- published image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:aa39189702265c04abea50575d3881716d0f72c85c774ab67172997e253e962d`
- `repo-app-1` status: `running`
- `/api/readiness`: `ready`, DB `ok`, commit `90896a9e4015864f15fb633cfc2259af8cce99cb`, build time `2026-05-19T09:55:13Z`
- `/api/health`: `ok`

## Public HTML and Runtime Proof

Raw public route smoke:

| Path | Status | Counter id in initial payload | Secrets in HTML |
| --- | ---: | --- | --- |
| `/` | 200 | yes | none |
| `/services` | 200 | yes | none |
| `/about` | 200 | yes | none |
| `/contacts` | 200 | yes | none |

Initial raw HTML did not contain the Metrica script tag because the implementation uses Next `Script` with `afterInteractive`. Browser runtime proof confirmed the script is injected after hydration.

Browser runtime proof on `/contacts`:

- `#yandex-metrica-counter`: present
- `https://mc.yandex.ru/metrika/tag.js`: present and returned `200`
- counter id `109037342`: present
- no OAuth token, Webmaster token, client secret, or refresh token in public HTML/runtime checks

## Conservative Init Options

Browser runtime proof confirmed:

- `webvisor: false`
- `clickmap: false`
- `ecommerce: false`
- `trackLinks: false`
- `accurateTrackBounce: false`

No session replay / visual clickmap posture was enabled.

## Internal Telemetry Smoke

Browser action: approved phone link click on `/contacts`.

Internal telemetry storage on canonical DB:

```text
phone_clicked|/contacts|f|f|phone|header_contact_phone|2026-05-19 10:15:18.336954+00
phone_clicked|/contacts|f|f|phone|header_contact_phone|2026-05-19 10:14:14.985899+00
phone_clicked|/contacts|f|f|phone|header_contact_phone|2026-05-19 10:06:45.869392+00
```

Contact journey storage:

```text
journey|phone_clicked|/contacts|f|f|phone|2026-05-19 10:15:18.336954+00
journey|phone_clicked|/contacts|f|f|phone|2026-05-19 10:14:14.985899+00
journey|phone_clicked|/contacts|f|f|phone|2026-05-19 10:06:45.869392+00
```

Interpretation:

- `is_internal=false`
- `is_test=false`
- `contact_channel=phone`
- internal telemetry and contact journey creation remain intact after Metrica enablement

## Browser-Level reachGoal Proof

Controlled browser instrumentation wrapped `window.ym` after page load, preserved the original function, and triggered the public tracker path by clicking the real phone link.

Beacon-sensitive click path:

```json
{
  "ymCalls": [
    [109037342, "reachGoal", "click_to_call"]
  ],
  "beaconCalls": [
    ["/api/telemetry/events", 515]
  ]
}
```

Fetch path with `navigator.sendBeacon` disabled:

- `/api/telemetry/events` returned `202`
- exactly one `[109037342, "reachGoal", "click_to_call"]` was captured

This confirms:

- ordinary non-beacon mirror waits for telemetry `202`;
- beacon-sensitive path uses the approved fallback;
- mirror call goes through the centralized adapter path;
- one user action produced one goal call in the smoke.

## Yandex Network Proof

Browser CDP network capture on `/contacts?_ym_debug=2` confirmed:

- `GET https://mc.yandex.ru/metrika/tag.js` -> `200`
- `GET https://mc.yandex.ru/watch/109037342/...` -> `200`
- `POST https://ecostroycontinent.ru/api/telemetry/events` -> `202`
- captured mirror call: `[109037342, "reachGoal", "click_to_call"]`

URLs with browser-info and page-url parameters were redacted in local smoke output before report use.

## Metrica API Status

`npm run yandex:check-metrica` on `repo-app-1`:

- status: `ok`
- counter id: `109037342`
- counter name: `Ekostroycontinent` / site `ecostroycontinent.ru`
- existing goals count: `11`
- required goals present:
  - `click_to_call`
  - `click_to_telegram`
  - `click_to_whatsapp`
  - `form_start`
  - `form_submit`
  - `cta_click`
  - `contact_link_click`
  - `gallery_open`
  - `faq_expand`
  - `case_card_click`
  - `service_link_click`

Yandex Reporting API delayed visibility check:

```json
{
  "status": "ok",
  "counter_id": "109037342",
  "checked_at": "2026-05-19T10:19:00.041Z",
  "click_to_call_goal_id": 556869891,
  "results": [
    { "metrics": "ym:s:visits", "totals": [0], "sampled": false, "sample_share": 1 },
    { "metrics": "ym:s:pageviews", "totals": [0], "sampled": false, "sample_share": 1 },
    { "metrics": "ym:s:goal556869891reaches", "totals": [0], "sampled": false, "sample_share": 1 }
  ],
  "contains_sensitive_values": false
}
```

Conclusion: browser/runtime integration is proven; external aggregate stats are not yet visible through the Reporting API. Recommended follow-up is a delayed recheck without changing runtime.

## Guard Checks

Code/routing guards:

- direct `ym(` call search under `components`, `app`, `lib`: only approved bootstrap file `components/public/MetricaCounter.js`
- public components do not call `/api/analytics/events`
- `AnalyticsTracker` continues to post to `/api/telemetry/events`
- UI does not call Yandex API
- read model was not changed
- scheduled imports were not added
- LLM was not touched
- lead/intake was not touched

Security checks:

- no OAuth token in public HTML/runtime checks;
- no Webmaster token in public HTML/runtime checks;
- no client secret in public HTML/runtime checks;
- no refresh token in public HTML/runtime checks;
- no form values added to tracking;
- no raw personal data added;
- no secrets included in this report.

## Launch Smoke

`APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_ABOUT=published EXPECT_CONTACTS=published npm run smoke:launch`

Result:

- passed: `28`
- failed: `0`
- skipped media optional check: `1`
- `/about`: `200`
- `/contacts`: `200`
- `/robots.txt`: `200`
- `/sitemap.xml`: `200`, 8 URLs, listed URLs resolve
- admin routes protected with redirects

## What Was Not Changed

No R1 enablement work changed:

- scheduled Metrica imports;
- scheduled Webmaster imports;
- analytics read model import wiring;
- `/admin/visibility` UX/UI;
- LLM provider/UI;
- lead/intake domain;
- visual heatmap;
- Content Core data;
- DB migrations;
- `.env` committed to git.

## Known Limitations

1. Yandex Reporting API stats visibility is delayed/pending for the smoke goal, even though browser/network evidence shows the counter and mirror path operating.
2. Headless browser smoke can prove runtime/network behavior but may not be treated by Yandex Reporting stats the same way as ordinary human traffic.
3. Cookie/banner policy copy remains an owner/legal product decision for later hardening; current prototype-stage decision explicitly allowed no banner for this step.

## Rollback

Rollback remains simple:

1. Set `NEXT_PUBLIC_YANDEX_METRICA_ENABLED=false` in `/opt/ecostroycontinent/runtime/.env`.
2. Rebuild/redeploy or refresh compose if build-time public env requires it.
3. Internal telemetry continues through `/api/telemetry/events`.
4. No DB rollback is required.
5. No secret rotation is required unless a separate secret exposure is found.

## R1 Closure Decision

R1 is closed for the project-controlled server acceptance boundary:

- internal telemetry source-of-truth path: pass;
- env-gated public counter enablement: pass;
- conservative Metrica posture: pass;
- browser-level reachGoal mirror: pass;
- Yandex network request proof: pass;
- no secret/browser leakage: pass;
- external Metrica Reporting API stats visibility: delayed/pending.

Next safe slice: R2/R3 external aggregate import foundations, if approved, while preserving internal telemetry as operational truth.

## Git Status at Report Time

Expected deliverable changes:

- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- this report

No runtime code changes were made in this enablement documentation closeout.
