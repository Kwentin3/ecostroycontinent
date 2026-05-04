# SEO Dashboard Server Acceptance Report

Дата: 2026-05-04

## Executive Verdict

Backend/foundation серверная приёмка SEO Dashboard MVP выполнена на canonical Selectel runtime.

Ветка `feat/seo-visibility-dashboard` задеплоена через принятый GitHub Actions -> GHCR -> self-hosted runner -> Docker Compose контур. Миграция `008_seo_visibility_analytics.sql` применена на canonical SQL target `repo-sql-1`. `/admin/visibility`, read model endpoint, analytics event endpoint, запись в `analytics_event`, source health states и privacy boundaries проверены на сервере.

Оговорка: текущий published content на сервере не содержит опубликованных `/about`, `/contacts` и detail case, поэтому эти конкретные public routes вернули `404`. Доступные public routes `/`, `/services`, `/services/arenda-tehniki`, `/cases` открываются. Это зафиксировано как content-state limitation, а не как расширение scope.

## Branch And Commit

- Branch: `feat/seo-visibility-dashboard`
- Deployed commit: `4a8940e9c90103b823178948f4f9ce11ea6fbaea`
- Commit label: `fix: harden SEO dashboard audit findings`

## Deploy Method

Использован существующий project deploy workflow:

1. `build-and-publish.yml` на ветке `feat/seo-visibility-dashboard`
2. GHCR image:
   - `ghcr.io/kwentin3/ecostroycontinent-app:sha-4a8940e`
   - pinned digest: `sha256:4f8da69126924ddc6a56c35f76f3970e217f51bfec9595007d32d7938eb6ef45`
3. `deploy-phase1.yml` с `image_ref=ghcr.io/kwentin3/ecostroycontinent-app@sha256:4f8da69126924ddc6a56c35f76f3970e217f51bfec9595007d32d7938eb6ef45`

GitHub Actions:

- Build run: `25323202362`, success  
  `https://github.com/Kwentin3/ecostroycontinent/actions/runs/25323202362`
- Deploy run: `25323325968`, success  
  `https://github.com/Kwentin3/ecostroycontinent/actions/runs/25323325968`

Deploy log confirmed:

- `npm run db:migrate` executed in compose runtime.
- `Applied migration 008_seo_visibility_analytics.sql`.
- Traefik health probe recovered to `200` after a brief expected startup `502`.

## Server Target

- VM: `ecostroycontinent-phase1-vm`
- Public IP: `178.72.179.66`
- Runtime stack: Docker Compose project `repo`
- Containers:
  - `repo-app-1`: up
  - `repo-sql-1`: up, healthy
  - `ecostroycontinent-traefik`: up

Runtime image pin:

`ghcr.io/kwentin3/ecostroycontinent-app@sha256:4f8da69126924ddc6a56c35f76f3970e217f51bfec9595007d32d7938eb6ef45`

## Migration Result

`schema_migrations` contains:

- `001_admin_first_slice.sql`
- `002_workspace_memory_card.sql`
- `003_entity_creation_origin.sql`
- `004_content_entities_equipment_type.sql`
- `005_public_display_mode_control.sql`
- `006_removal_quarantine.sql`
- `007_destructive_forensic_events.sql`
- `008_seo_visibility_analytics.sql`

Tables present after migration:

- `analytics_event`
- `analytics_page_daily`
- `external_search_visibility_daily`
- `analytics_source_sync_state`
- `analytics_unmapped_url_diagnostic`
- `seo_recommendation_state`
- `analytics_classified_content_change`
- `analytics_tracking_change_history`

Repeat `npm run db:migrate` inside `repo-app-1`: exit `0`, no additional migrations applied.

## Runtime Smoke

Health:

- Internal Traefik health: `200`
- External `https://178.72.179.66/api/health`: `200`
- External root `/`: `200`

Public route smoke on server:

- `/`: `200`
- `/services`: `200`
- `/services/arenda-tehniki`: `200`
- `/cases`: `200`
- `/cases/[slug]`: skipped, no published case slug in current server DB
- `/about`: `404`, no published standalone page in current server DB
- `/contacts`: `404`, no published standalone page in current server DB

## Admin Visibility Proof

Unauthenticated:

- `/admin/visibility`: `307`, redirect to `/admin/login`
- `/api/admin/visibility/read-model?period=28`: `303`, redirect to login

Authenticated:

- Temporary `seo_manager` operator created server-side for acceptance, then deleted.
- Login: `303`
- `/admin/visibility`: `200`
- `/api/admin/visibility/read-model?period=28`: `200`
- Cleanup proof: temporary acceptance users remaining: `0`

## Read Model Proof

Read model response:

- `ok=true`
- Sections present:
  - `sources`
  - `overview`
  - `traffic_sources`
  - `search_visibility`
  - `page_list`
  - `selected_page_detail`
  - `semantic_click_map`
  - `recommendations`
  - `evidence_items`
  - `analytics_history`
  - `published_change_history`
  - `classified_content_changes`
  - `tracking_change_history`

Source states:

- `first_party_events=ok`
- `yandex_metrica=not_configured`
- `yandex_webmaster=not_configured`
- `google_search_console=not_configured`
- `lead_domain=not_ready`
- `content_core=ok`

Lead state:

- `overview.leads.value = null`
- `overview.leads.signal = not_ready`

Observed counts:

- `page_list`: `1`
- `recommendations`: `3`
- `evidence_items`: `1`
- `classified_content_changes`: `1`
- `tracking_change_history`: `0`

## Event Endpoint Proof

Endpoint: `/api/analytics/events`

Valid browser-like public event:

- Page path: `/services/arenda-tehniki`
- Status: `202`
- Response: `stored=true`, `excluded=false`, `resolution_status=resolved`
- Payload omitted client `anonymous_id` / `session_id`; server generated safe ids.

Bot event:

- User-Agent: `Googlebot/2.1`
- Status: `202`
- Response: `stored=true`, `excluded=true`, `exclusion_reason=bot_or_crawler`

Rejected events:

- Unknown `event_type=lead_created`: `400`, `INVALID_EVENT`
- Sensitive metadata `token`: `400`, `INVALID_EVENT`
- Root `form_values`: `400`, `INVALID_EVENT`

DB insert proof for two acceptance events:

- total rows: `2`
- excluded rows: `1`
- server-generated anonymous ids: `2`
- token metadata persisted: `false`
- form values metadata persisted: `false`

Business aggregate exclusion proof:

- Daily aggregate run date: `2026-05-04`
- Aggregate row for acceptance `element_id`: `page_views=1`, `visits=1`, `users=1`
- Raw event rows for the same proof set: `2`
- Therefore excluded bot traffic did not enter business aggregate.

## Security And Privacy Checks

Confirmed:

- Read model does not expose structural keys:
  - `anonymous_id`
  - `session_id`
  - `user_agent`
  - `ip_address`
  - `form_values`
  - `raw_events`
  - `tokens`
  - `secrets`
- Token/secret patterns not found in `/admin/visibility` HTML or read model JSON.
- Event endpoint rejects sensitive metadata and root form values.
- Source errors are represented as source health / safe state, not raw credentials.
- No Яндекс/GSC credentials were added or printed.
- Temporary acceptance admin user was deleted after proof.

## Not Configured / Not Ready

Expected for this acceptance pass:

- Яндекс Метрика: `not_configured`
- Яндекс Вебмастер: `not_configured`
- Google Search Console: `not_configured`
- Lead domain: `not_ready`

No real Яндекс or Google credentials were introduced.

## Known Limitations

- No published case detail route exists in the current server DB.
- `/about` and `/contacts` are not published in the current server DB and return `404`.
- Real Yandex/GSC imports remain deferred until credentials and adapter activation are explicitly provided.
- Lead domain remains unavailable; read model correctly treats leads as `not_ready`, not as zero.
- Routine scheduling for analytics aggregation is not separately accepted here; the server-side aggregate function was run manually for proof.

## Git Status

Pre-report local status was clean for feature code and still had only the pre-existing `docs/out` deletions.

The report itself is the only new deliverable from this server acceptance pass.

## Verdict

Server backend/foundation acceptance: passed with published-content limitations noted above.

The feature is ready for a separate UX/UI refine pass on `/admin/visibility`.

