# PRD R1. Public Telemetry Operational Measurement + Optional Metrica Goal Mirror

Дата: 2026-05-19
Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Статус: draft PRD / pre-implementation gate

Русское название: **Операционная публичная телеметрия и опциональное зеркало целей в Метрику**.

Former working title: **Public Metrica Counter + Telemetry reachGoal Bridge**.

Текущее смысловое название ставит internal telemetry first. Старое имя файла сохранено как backward-compatible artifact, потому что на него уже ссылаются roadmap, handoff и отчёты.

## 1. Purpose

R1 формализует публичное operational measurement на базе first-party telemetry и, при approved privacy/cookie posture, добавляет опциональное зеркало approved telemetry actions в заранее созданные JavaScript-цели Метрики.

Этот PRD определяет продуктовую задачу R1, scope, non-goals, privacy posture, goal mapping policy и acceptance criteria. Техническая реализация задаётся отдельным Blueprint:

- `docs/blueprints/BLUEPRINT_R1_Public_Metrica_Counter_Telemetry_ReachGoal_Bridge_Экостройконтинент_v0.1.md`

Implementation нельзя начинать до review PRD и Blueprint.

## 2. Problem Statement

Internal telemetry уже собирает public actions через `/api/telemetry/events`, но R1 должен закрепить этот путь как operational measurement layer перед следующим этапом. Яндекс Метрика и 11 целей подготовлены и могут получать mirrored goals там, где это полезно, но не должны становиться главным источником operational truth.

Текущие факты:

- Metrica counter `109037342` доступен.
- 11 required JavaScript goals существуют.
- Public telemetry уже собирает события через `/api/telemetry/events`.
- Public tracker не должен ходить напрямую в `/api/analytics/events`.
- Internal telemetry может знать `page_path`, entity/revision context and contact intent быстрее и точнее, чем внешний mirror.
- Scheduled imports Метрики являются future external aggregate enrichment, а не prerequisite для internal operational metrics.

Проблема R1: public operational telemetry needs to be explicitly hardened and proven, while optional Metrica mirror should be designed as best-effort external analytics, not as the primary route back into dashboard truth.

## 3. Product Goal

Цель R1:

- strengthen/confirm public telemetry as the operational measurement layer;
- prove internal telemetry storage first;
- аккуратно включить Яндекс Метрику на public site через env flag only if approved;
- сохранить существующую public telemetry boundary;
- mirror only approved telemetry events into corresponding Metrica goals;
- prove Metrica goal mirror second, if enabled, after acceptable delay;
- preserve privacy/cookie posture and avoid direct UI/Yandex coupling.

R1 не должен превращать Метрику в source of truth вместо first-party telemetry. Метрика является optional external behavior/goal mirror, а first-party telemetry остаётся каноническим внутренним слоем для Content Core mapping, operational SEO decisions and future read-model integration.

Operational truth position:

- Internal first-party telemetry is the primary operational capture for user actions.
- Metrica mirror is best-effort/external; it never replaces internal storage or internal action context.
- Adblock, delayed Metrica goal visibility or Metrica API limits do not invalidate internal telemetry evidence.
- Dashboard operational decisions should prefer internal telemetry when it contains richer page/entity/revision context.

## 4. Users / Stakeholders

- SEO Manager: получает надежный internal telemetry signal для operational decisions и, опционально, внешние goal signals в Метрике.
- Superadmin: контролирует включение public counter через env/runtime decision.
- Future analytics/read model consumers: смогут позже получать internal telemetry aggregates and, separately, imported external mirror aggregates.
- Business Owner: косвенный потребитель будущих отчётов и owner-friendly summaries.

## 5. Scope

Входит:

- internal operational telemetry path smoke;
- proof that public actions continue through `/api/telemetry/events`;
- env-gated public Metrica counter injection;
- browser-safe counter id;
- approved telemetry-to-goal mapping;
- optional reachGoal mirror through the architecture approved in Blueprint;
- no-op behavior when Metrica is disabled/unavailable;
- smoke verification plan and acceptance;
- privacy/cookie posture decision captured before production enablement.

## 6. Non-Goals

Не входит:

- scheduled imports Метрики;
- scheduled imports Вебмастера;
- read model integration with imported Yandex data;
- UX/UI redesign of `/admin/visibility`;
- LLM provider or LLM UI;
- lead/intake domain;
- visual heatmap;
- Webvisor/clickmap/session replay by default;
- ecommerce;
- making Metrica the source of truth for user actions;
- designing dashboard to depend on Metrica for operational contact actions;
- importing Metrica as a prerequisite for internal operational metrics;
- using Metrica to infer Content Core entity/revision context;
- direct UI -> Yandex API;
- direct public tracker -> `/api/analytics/events`;
- treating contact actions as leads.

## 7. Privacy / Cookie Position

Default R1 posture:

- do not enable Webvisor automatically;
- do not enable clickmap automatically;
- do not enable ecommerce;
- do not enable session replay without a separate decision;
- start with minimal counter plus approved `reachGoal` events;
- use only browser-safe `NEXT_PUBLIC_*` values in the browser;
- keep OAuth tokens and client secrets server-only.

Decision required before implementation:

- whether a cookie/banner/policy copy update is required before production flag enablement;
- exact Metrica init options;
- explicit Webvisor/clickmap/session replay posture;
- whether outbound link tracking is approved;
- whether accurate bounce tracking is approved.

Hard gate:

- Until privacy/cookie posture is approved, R1 implementation must not enable the production Metrica flag.
- If policy/banner copy is required, production flag enablement waits for that copy/workflow to be ready.

Semantic telemetry already exists, so Webvisor/clickmap are not required for MVP.

## 8. Approved Goal Set

Existing Metrica JavaScript goals:

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

A goal may receive a signal only if there is a corresponding validated telemetry event/action.

Do not fake `form_start` or `form_submit` if the public site does not emit real form telemetry yet.

## 9. Mapping Policy

Product-level mapping policy:

| Telemetry signal | Metrica goal | Policy |
| --- | --- | --- |
| `phone_clicked` | `click_to_call` | Allowed direct contact intent. |
| `messenger_clicked` + `contact_channel=telegram` | `click_to_telegram` | Allowed only when channel is reliable. |
| `messenger_clicked` + `contact_channel=whatsapp` | `click_to_whatsapp` | Allowed only when channel is reliable. |
| approved `cta_clicked` | `cta_click` | Allowed only for non-contact CTA. Contact CTA must emit final contact intent, not generic CTA. |
| `gallery_opened` | `gallery_open` | Allowed semantic behavior goal. |
| real FAQ expand telemetry | `faq_expand` | Future until public telemetry emits a real FAQ event. Do not synthesize. |
| `case_card_opened` | `case_card_click` | Allowed if current product semantics treat card open/click as this goal. |
| `service_card_opened` | `service_link_click` | Allowed if target is service navigation/open. |
| separate contact navigation action | `contact_link_click` | Allowed only if it is not a duplicate of phone/messenger/email contact intent. |
| real form start telemetry | `form_start` | Future until public form emits it. |
| real form submit telemetry | `form_submit` | Future until public form emits it. |

Double-counting policy:

- One user action should produce at most one Metrica goal unless a future PRD explicitly approves multi-goal attribution.
- Contact links must prefer final contact intent goals (`click_to_call`, `click_to_telegram`, `click_to_whatsapp`) over generic `cta_click` or `contact_link_click`.
- `email_clicked` currently has no required Metrica goal in the 11-goal set; do not map it to another contact goal unless a later goal is created or explicitly approved.

## 10. Acceptance Criteria

R1 is done when:

- Internal telemetry remains the primary operational capture.
- A public action is stored in telemetry storage through `/api/telemetry/events`.
- With Metrica disabled, internal telemetry still works and R1 core telemetry path is not broken.
- Metrica mirror failures do not block internal telemetry or user UX.
- Metrica is included only through env flag.
- With env off, the public site works without Metrica script and without reachGoal calls.
- With env on, counter is present in public HTML/runtime.
- OAuth tokens/client secret do not reach browser.
- Public tracker continues to send telemetry to `/api/telemetry/events`.
- For ordinary non-navigation clicks, approved telemetry event/action invokes corresponding reachGoal only after `/api/telemetry/events` returns successful `202`.
- For navigation/beacon scenarios, approved controlled fallback may invoke reachGoal after local eligibility if waiting for `202` would make the signal unreliable; this must be explicit in implementation and tests.
- Unsupported/internal/test/admin events do not invoke reachGoal.
- Each user action has a client-side dedupe id/window so the same handler/listener path cannot invoke the same goal twice.
- Live smoke proves:
  - event is stored in internal telemetry storage first;
  - optional browser-level `ym(..., "reachGoal", ...)` call is observed in a controlled test/mock or diagnostic when Metrica is enabled;
  - matching goal is visible in Metrica after acceptable delay when mirror is enabled.
- Metrica goal visibility is staged: lack of immediate goal appearance is not by itself a failure if browser call and telemetry storage are proven and delayed Metrica verification is scheduled.
- No direct `ym()` calls exist in arbitrary public components.
- Direct `ym()` calls are allowed only in explicitly approved adapter/bootstrap files.
- No direct public tracker -> `/api/analytics/events`.
- Webvisor/clickmap/ecommerce/session replay are not enabled unless separately approved.

## 11. Risks

- Double-counting contact actions through generic CTA and specific contact goals.
- Treating Metrica goal counts as operational source of truth instead of external mirror data.
- Privacy/cookie posture remains underdefined.
- Metrica goal visibility may lag after event firing.
- Wrong mapping between current telemetry names and existing Metrica goal names.
- Accidental bypass of telemetry boundary.
- Enabling Webvisor/clickmap/session replay without separate product/privacy approval.
- Assuming future events such as FAQ/form telemetry exist before they are actually emitted.
- Internal/admin/test traffic leaking into Metrica if client eligibility is not designed carefully.

## 12. Open Questions

- What exact counter init options are approved?
- Is a cookie/banner/policy copy update required before enabling production flag?
- Which telemetry events are live now versus future?
- Which later internal aggregate/read-model slice will consume telemetry data operationally?
- How should live smoke verify goals with Metrica propagation delay?
- Is a safe local diagnostic/audit event needed for `reachGoal` sent/skipped/failed, or are tests and live smoke enough for R1?
- What exact allowed file list will own `ym()` calls in implementation?
- What exact dedupe id format should implementation use: `client_event_id`, returned `telemetry_event_id`, or both?
- Should `email_clicked` get a future Metrica goal, or remain first-party telemetry only?
- Should `contact_link_click` exist as a separate public telemetry event before mapping it, or remain future?

## 13. References

- Roadmap: `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- Current audit: `docs/reports/2026-05-19/SEO_DASHBOARD_DOMAIN_CURRENT_STATE_AUDIT_Экостройконтинент_v0.1.report.md`
- Yandex bootstrap: `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`
- Official Yandex Metrica tag initialization: https://yandex.com/support/metrica/en/code/counter-initialize
- Official Yandex Metrica `reachGoal`: https://yandex.com/support/metrica/ru/objects/reachgoal
- Official Yandex Metrica JavaScript event goal: https://yandex.com/support/metrica/en/general/goal-js-event
