# Data Sources and Event Taxonomy

Проект: «Экостройконтинент»
Companion к: `SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
Версия: v0.1
Статус: conceptual taxonomy / future implementation input
Дата: 2026-04-30

## 1. Purpose

Этот документ фиксирует компактную таксономию данных и событий для будущего дашборда видимости, трафика и конверсии.

Цель: заранее договориться, какие события и источники нужны, чтобы SEO Manager видел рабочую цепочку:

```text
search visibility -> traffic -> landing page -> behavior -> intent event -> lead -> recommendation
```

Таксономия должна поддерживать операционный цикл:

```text
signal -> diagnosis -> hypothesis -> action -> publication -> monitoring -> next action
```

Это не миграция, не final schema и не техническая реализация.

## 2. Identity Model

Каждая метрика должна по возможности связываться с page identity:

| Field | Meaning |
| --- | --- |
| `page_path` | публичный path без query string |
| `entity_type` | `service`, `case`, `page`, later `article`; nullable for unmapped URLs |
| `entity_id` | id route-owning entity |
| `published_revision_id` | active published revision at event/import time if known |
| `page_kind` | `service_detail`, `case_detail`, `standalone_page`, `article_detail`, `index`, `unmapped` |

Current route resolver targets:

- `/services/[slug]` -> `service`;
- `/cases/[slug]` -> `case`;
- `/about` -> `page`;
- `/contacts` -> `page`;
- `/blog/[slug]` -> future `article`;
- `/` `/services` `/cases` -> index surfaces, usually no single entity owner.

## 3. Data Source Catalog

### Internal Content Core

Use:

- entity type;
- entity id;
- status via current/latest revision;
- active published revision;
- SEO fields;
- proof relations;
- contact truth;
- route ownership.

Current runtime:

- `global_settings`;
- `media_asset`;
- `gallery`;
- `service`;
- `equipment`;
- `case`;
- `page`.

Planned but absent in runtime:

- `article`;
- `faq`;
- `review/testimonial`.

### Internal Events

Use:

- visits/page views;
- contact actions;
- semantic behavior events;
- source attribution;
- page/entity conversion.

MVP status: must be added.

### Yandex Webmaster Imports

Yandex-first source for РФ search visibility and indexation.

Product needs:

- date;
- page;
- query;
- impressions;
- clicks;
- CTR;
- average position;
- device;
- country.
- indexed / non-indexed state;
- important pages;
- indexation problems;
- host/site status.

Exact fields depend on API capability check before implementation.

### Yandex Metrica Imports

Yandex-first external traffic/behavior source.

Product needs:

- visits;
- users;
- traffic sources;
- search engines;
- regions;
- devices;
- bounce rate;
- page depth;
- average visit duration;
- goals;
- goal conversion rate;
- landing pages if available;
- JavaScript goals for contact and semantic actions.

Optional later:

- Measurement Protocol for server-side enrichment;
- Logs API for advanced analysis.

MVP should prefer aggregate reports and reconciliation with first-party events.

### Google Search Console Imports

Second search contour after Yandex-first baseline:

- date;
- page;
- query;
- impressions;
- clicks;
- CTR;
- average position;
- device;
- country.

Useful for Google visibility, not first priority for РФ-oriented implementation.

### Lead / Intake

Use:

- lead records;
- submit timestamp;
- contact channel;
- attributed landing pages;
- related service/page;
- optional qualification.

Current runtime status: absent.

## 4. Common Event Envelope

All own events should follow one envelope:

| Field | Required | Notes |
| --- | --- | --- |
| `event_type` | yes | enum from this taxonomy |
| `timestamp` | yes | server time preferred |
| `anonymous_id` | yes | browser anonymous id, not user account |
| `session_id` | yes | anonymous web session |
| `page_path` | yes | path without sensitive query |
| `entity_type` | if resolved | nullable |
| `entity_id` | if resolved | nullable |
| `published_revision_id` | if resolved | snapshot |
| `element_id` | event-specific | stable semantic id |
| `event_source` | yes | `first_party_public`, `first_party_admin`, `bot`, `qa`, `imported`, `system` |
| `source` | optional | attribution |
| `medium` | optional | attribution |
| `campaign` | optional | UTM |
| `referrer` | optional | avoid storing sensitive query params |
| `device_type` | optional | desktop/tablet/mobile |
| `viewport` | optional | bucket or width/height if approved |
| `is_excluded` | yes | true for admin/bot/QA/preview events |
| `exclusion_reason` | if excluded | `admin`, `bot`, `qa`, `preview`, `healthcheck`, `unknown_internal` |
| `metadata` | optional | strict allowlist per event |

Do not store form input values in event metadata.

## 4.1 Event Markup Contract

Semantic events require stable markup on interactive public elements. The tracker should not depend only on CSS selectors, DOM order or pixel coordinates.

Recommended attributes:

| Attribute | Purpose |
| --- | --- |
| `data-analytics-id` | stable element id, e.g. `hero_primary_call` |
| `data-analytics-event` | event type from this taxonomy |
| `data-analytics-section` | semantic section, e.g. `hero`, `faq`, `proof_gallery` |
| `data-analytics-entity-type` | current page entity type when useful |
| `data-analytics-entity-id` | current page entity id when useful |
| `data-analytics-target-type` | target entity/action type |
| `data-analytics-target-id` | target entity/action id |

Examples:

Call button:

- `data-analytics-event="click_to_call"`;
- `data-analytics-section="hero"`;
- `data-analytics-id="hero_primary_call"`.

Telegram button:

- `data-analytics-event="click_to_telegram"`;
- `data-analytics-section="hero"`;
- `data-analytics-id="hero_primary_telegram"`.

Related case card:

- `data-analytics-event="case_card_click"`;
- `data-analytics-section="related_cases"`;
- `data-analytics-target-type="case"`;
- `data-analytics-target-id="<case_id>"`.

FAQ item:

- `data-analytics-event="faq_expand"`;
- `data-analytics-section="faq"`;
- `data-analytics-id="<question_id>"`.

Gallery open:

- `data-analytics-event="gallery_open"`;
- `data-analytics-section="proof_gallery"`;
- `data-analytics-target-type="gallery"`;
- `data-analytics-target-id="<gallery_id>"`.

Forbidden:

- storing text entered by the user;
- storing form values before submit;
- using user-visible copy as the only event id;
- using raw CSS selectors as the canonical analytics contract.

## 4.2 Admin / Bot / QA Exclusion

Events should be excluded from business aggregates or explicitly marked when they come from:

- admin routes;
- authenticated admin users browsing public pages;
- preview/draft routes;
- known bots and crawlers;
- internal QA traffic where identifiable;
- health checks;
- import/system jobs.

Minimum exclusion fields:

- `event_source`;
- `is_excluded`;
- `exclusion_reason`.

MVP rule: excluded events may be retained briefly for diagnostics, but they must not feed Overview, Pages, conversion metrics or recommendation rules by default.

## 4.3 Event Source and Traffic Source Classification

`event_source` classifies how the event entered the system:

- `first_party_public`;
- `first_party_admin`;
- `bot`;
- `qa`;
- `imported`;
- `system`.

Traffic attribution should stay practical:

- `organic_google`;
- `organic_yandex`;
- `direct`;
- `referral`;
- `telegram`;
- `whatsapp`;
- `maps_or_business_directory`;
- `paid`;
- `campaign_utm`;
- `unknown`;
- `unattributed`.

If the source is not known, keep it as `unknown` or `unattributed`. Do not infer source from weak evidence.

Yandex Webmaster and Google Search Console query data is aggregate by page/date/device/country when available. It must not be used to claim that a specific session or lead came from a specific query.

## 5. Event Types

### page_view

When: route loads or soft-navigation completes.

Metadata:

- `title` optional;
- `is_first_page_in_session`;
- `landing_page_path` if known.

Use:

- visits;
- landing pages;
- source attribution;
- page conversion denominator.

### cta_view

When: primary CTA enters viewport.

Metadata:

- `cta_id`;
- `cta_kind`: `call`, `messenger`, `form`, `route`, `email`;
- `section_id`.

Use:

- CTA visibility vs CTA click gap.

### cta_click

When: user clicks visible CTA not covered by more specific contact event.

Metadata:

- `cta_id`;
- `cta_kind`;
- `section_id`;
- `destination_kind`.

Use:

- general CTA engagement.

### click_to_call

When: user clicks `tel:` action.

Metadata:

- `element_id`;
- `section_id`;
- `phone_present`: boolean.

Do not store raw phone if it is already global truth. Reference action type is enough.

Use:

- primary intent event;
- visit to intent conversion.

### click_to_telegram

When: user clicks Telegram action.

Metadata:

- `element_id`;
- `section_id`.

Use:

- primary intent event.

### click_to_whatsapp

When: user clicks WhatsApp action.

Metadata:

- `element_id`;
- `section_id`.

Use:

- primary intent event.

### contact_link_click

When: user clicks route/link to `/contacts` or contact section.

Metadata:

- `source_section`;
- `destination`: `/contacts` or anchor.

Use:

- weaker contact intent;
- diagnose "many contacts transitions but few leads".

### form_start

When: first user interaction with lead form.

Metadata:

- `form_id`;
- `section_id`.

Do not store field names/values beyond allowlisted `form_id`.

Use:

- form friction diagnosis.

### form_submit

When: lead form successfully submits.

Metadata:

- `form_id`;
- `lead_id` after successful server creation;
- `related_entity_type`;
- `related_entity_id`.

Use:

- primary intent event;
- lead conversion.

### gallery_open

When: user opens gallery or expands media collection.

Metadata:

- `gallery_id` if public-safe;
- `section_id`;
- `item_count_bucket`.

Use:

- proof engagement.

### image_open

When: user opens a single media item.

Metadata:

- `asset_id` if public-safe;
- `gallery_id` optional;
- `section_id`.

Use:

- visual proof interest.

### faq_expand

When: user expands FAQ item.

Metadata:

- `faq_id` if runtime entity exists later;
- `question_id` stable semantic id;
- `section_id`.

Use:

- objection/interest signal.

### case_card_click

When: user clicks case card from service/page/article.

Metadata:

- `target_case_id`;
- `section_id`;
- `source_entity_type`;
- `source_entity_id`.

Use:

- proof path traversal.

### service_link_click

When: user clicks service link from home/case/article/page.

Metadata:

- `target_service_id`;
- `section_id`;
- `source_entity_type`;
- `source_entity_id`.

Use:

- internal linking and article-to-service transfer.

### menu_click

When: user clicks main nav or quick service access.

Metadata:

- `nav_item`;
- `destination_path`;
- `nav_kind`: `header`, `footer`, `quick_access`.

Use:

- navigation diagnosis.

### scroll_depth

When: user reaches depth milestones.

Metadata:

- `depth_percent`: 25, 50, 75, 90;
- `max_depth_percent`.

Use:

- whether users reach proof/CTA blocks.

## 6. Intent Event Classification

Primary intent:

- `click_to_call`;
- `click_to_telegram`;
- `click_to_whatsapp`;
- `form_submit`.

Secondary intent:

- `contact_link_click`;
- `form_start`;
- `cta_click` when destination is contact-related.

Engagement/proof:

- `gallery_open`;
- `image_open`;
- `faq_expand`;
- `case_card_click`;
- `service_link_click`;
- `scroll_depth`;
- `menu_click`.

## 7. Aggregation Dimensions

Minimum daily dimensions:

- `date`;
- `page_path`;
- `entity_type`;
- `entity_id`;
- `source`;
- `medium`;
- `campaign`;
- `device_type`;
- `region` if available;
- `event_type`.

Recommended aggregates:

- visits;
- users;
- page views;
- intent events;
- primary intent events;
- leads;
- CTA views/clicks;
- phone/messenger/form actions;
- proof interactions;
- service/case link transitions.

## 8. External Import Dimensions

### Yandex Webmaster

- `date`;
- `page_path`;
- `query`;
- `device`;
- `country`;
- `impressions`;
- `clicks`;
- `ctr`;
- `position`.
- `indexed_state`;
- `important_page_flag`;
- `indexation_issue_type`;
- `host_status`;
- `source_system = yandex_webmaster`.

Some dimensions are product needs and must be verified against API capabilities before implementation.

### Yandex Metrica

- `date`;
- `page_path` / landing page if available;
- `source`;
- `medium`;
- `search_engine`;
- `region`;
- `device_type`;
- `visits`;
- `users`;
- `bounce_rate`;
- `page_depth`;
- `avg_visit_duration`;
- `goal_id`;
- `goal_name`;
- `goal_conversions`;
- `goal_conversion_rate`;
- `source_system = yandex_metrica`.

Метрика goals can mirror contact and semantic actions, but first-party internal events remain the canonical source for Content Core mapping.

### Google Search Console

- `date`;
- `page_path`;
- `query`;
- `device`;
- `country`;
- `impressions`;
- `clicks`;
- `ctr`;
- `position`;
- `source_system = google_search_console`.

## 8.1 Integration Sync Status

Every external source should expose sync status to admin screens.

Recommended fields:

- `source_system`: `yandex_metrica`, `yandex_webmaster`, `google_search_console`, later `ga4`;
- `site_id` or masked external site/counter identifier;
- `status`: `ok`, `stale`, `failed`, `partial`, `not_configured`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `next_run_at` if scheduled;
- `error_category`;
- `safe_error_message`;
- `rows_imported`;
- `unmapped_url_count`.

Dashboard UI should read this status from own DB/API. It should not call external APIs in real time.

The same status should be available to LLM context builders as `data_freshness`. If a source is `stale`, `failed` or `not_configured`, LLM output must mention the limitation when relevant.

## 8.2 Unmapped URL Diagnostics

Imported external URLs that cannot be mapped to a route-owning entity should be retained as diagnostics.

Recommended fields:

- `source_system`;
- `external_url`;
- `normalized_page_path`;
- `first_seen_at`;
- `last_seen_at`;
- `metrics_snapshot`;
- `probable_reason`: `old_url`, `query_string_noise`, `missing_route`, `redirect_mismatch`, `canonical_mismatch`, `external_artifact`, `unknown`;
- `resolution_status`: `open`, `ignored`, `mapped`, `redirect_needed`.

Unmapped URLs should not be silently dropped because they can reveal sitemap, redirect, canonical and routing problems.

## 8.3 LLM Context Data Requirements

LLM context builders need prepared aggregates and evidence summaries, not raw events.

Minimum data inputs:

- page/entity identity;
- current published revision id;
- SEO fields summary;
- proof path summary;
- visibility aggregates;
- traffic aggregates;
- behavior aggregates;
- intent event aggregates;
- lead aggregates if available;
- issue evidence;
- recommendation history;
- before/after snapshots;
- source freshness;
- sample size and denominators;
- admin/bot/QA exclusion status;
- privacy filter status.

Do not provide to LLM context:

- raw event dump;
- raw sessions;
- form values;
- personal contact details entered by users;
- full IP;
- unrestricted user agent history;
- API tokens;
- secrets;
- admin identity;
- unfiltered service traffic.

## 8.4 LLM Evidence Item

Recommended evidence item shape:

| Field | Meaning |
| --- | --- |
| `evidence_id` | stable id inside packet |
| `source` | `first_party_aggregate`, `yandex_metrica`, `yandex_webmaster`, `google_search_console`, `content_core`, `sitemap_runtime`, `recommendation_history`, `published_change_history` |
| `metric` | metric name |
| `value` | current value |
| `comparison_value` | previous period value if available |
| `period` | evidence period |
| `sample_size` | denominator or count behind the statement |
| `freshness` | `ok`, `stale`, `failed`, `partial`, `not_configured`, `not_applicable` |
| `confidence` | `insufficient`, `low`, `medium`, `high` |
| `interpretation` | short deterministic label, e.g. `traffic_available`, `low_ctr_signal`, `conversion_gap_signal` |

Evidence items should be concise. The LLM should cite these evidence items in plain language, not inspect raw data.

## 8.5 LLM Confidence and Uncertainty Fields

Recommended confidence labels:

- `insufficient`;
- `low`;
- `medium`;
- `high`.

Recommended uncertainty flags:

- `small_sample`;
- `source_stale`;
- `source_missing`;
- `query_data_aggregate_only`;
- `lead_domain_missing`;
- `tracking_recently_changed`;
- `admin_bot_exclusion_incomplete`;
- `unmapped_url`;
- `no_before_after_baseline`;
- `owner_confirmation_required`.

Context builders should compute these labels before calling an LLM. The LLM may explain them, but should not invent them from raw data.

## 8.6 LLM Audit and Retention Metadata

If LLM output is saved, it should carry audit metadata. This does not require storing the full context packet.

Recommended metadata:

- `context_type`;
- `task_intent`;
- `user_role`;
- `entity_type`;
- `entity_id`;
- `period_start`;
- `period_end`;
- `schema_version`;
- `context_hash`;
- `evidence_item_ids`;
- `data_freshness_summary`;
- `output_type`;
- `ai_generated_draft`: boolean;
- `action_taken_by_user`: `viewed`, `copied`, `saved_draft`, `created_recommendation`, `dismissed`, `marked_wrong`, `marked_unsupported_fact`, `marked_not_useful`;
- `actor_role`;
- `linked_recommendation_id`;
- `created_at`;
- `retention_class`: `transient`, `draft`, `audit_debug`, `recommendation_evidence`.

Default storage policy:

- transient explanations may be unsaved;
- saved drafts store metadata + evidence references;
- full context packets are not stored permanently by default;
- debug full packets require explicit retention class and privacy-filter confirmation.

LLM-created persistent objects must require:

- human action;
- structured output validation;
- evidence references;
- `ai_generated_draft` marker.

## 9. Issue Types

Suggested deterministic issue keys:

- `low_ctr`;
- `traffic_no_intent`;
- `published_service_no_case`;
- `published_service_no_media`;
- `mobile_low_conversion`;
- `article_no_service_transfer`;
- `gallery_engagement_no_conversion`;
- `published_missing_sitemap`;
- `published_noindexed`;
- `contacts_transition_no_leads`;
- `weak_proof_path`;
- `unmapped_analytics_url`.

Each issue should include:

- severity;
- priority;
- evidence period;
- metric values;
- recommended action;
- linked entity;
- owner role;
- status if persisted;
- next check date;
- result after implementation if available.

Recommended lifecycle:

- `detected`;
- `reviewed`;
- `planned`;
- `in_progress`;
- `implemented`;
- `published`;
- `monitoring`;
- `resolved`;
- `dismissed`.

Minimal MVP lifecycle:

- `new`;
- `accepted`;
- `in_progress`;
- `done`;
- `dismissed`.

## 9.1 Recommendation Lifecycle Events

These are optional operational events. They should not be mixed with public visitor behavior events unless implementation needs a unified audit stream.

Candidate events:

- `recommendation_created`;
- `recommendation_reviewed`;
- `recommendation_accepted`;
- `recommendation_in_progress`;
- `recommendation_implemented`;
- `recommendation_published`;
- `recommendation_monitoring_started`;
- `recommendation_resolved`;
- `recommendation_dismissed`.

Minimum metadata:

- `recommendation_id`;
- `issue_type`;
- `entity_type`;
- `entity_id`;
- `actor_role`;
- `previous_status`;
- `next_status`;
- `reason` for dismissal;
- `published_revision_id` when a published content change is linked.

Recommendation lifecycle events are about work management. They must not publish content and must not mutate Content Core directly.

## 10. Privacy Guardrails

Allowed:

- anonymous session ids;
- semantic event names;
- page/entity identifiers;
- aggregated source/medium/campaign;
- device category;
- coarse viewport bucket.

Avoid or require separate decision:

- full IP;
- precise geo;
- raw user agent retention;
- visual heatmap coordinates;
- external analytics cookies.

Forbidden in analytics events:

- form field values;
- passwords;
- tokens;
- private contact details entered by user before form submit;
- admin user identity for public browsing events.

Business aggregates must exclude or clearly flag:

- admin traffic;
- preview/draft traffic;
- bot traffic;
- internal QA traffic;
- system/import traffic.

LLM context packets must apply the same exclusions before packet construction. The LLM should never receive unfiltered admin/bot/QA traffic and should not be asked to filter raw data itself.

## 11. Analytics Read Model Linkage

The taxonomy feeds the analytics read model, but the read model is a separate consumer contract.

Reference contract:

- `SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`.

Required chain:

```text
raw/internal/external source data
-> normalized events/imports
-> daily aggregates and diagnostics
-> analytics read model
-> UI dashboard / LLM context builders / reports / exports
```

UI and LLM must not assemble their own metrics directly from first-party raw events, Яндекс Метрика, Яндекс Вебмастер, Google Search Console or Content Core.

### 11.1 Fields needed by evidence items

To support shared UI/LLM evidence, aggregates and import diagnostics should preserve enough data to build evidence items:

- stable `evidence_id` generated at read model layer;
- source system: `first_party_aggregate`, `yandex_metrica`, `yandex_webmaster`, `google_search_console`, `content_core`, `sitemap_runtime`, `recommendation_history`, `published_change_history`, `tracking_change_history`;
- metric key and current value;
- comparison value where available;
- period;
- sample size / denominator;
- source freshness;
- confidence;
- deterministic interpretation label;
- linked page/entity;
- plain-language notes.

Evidence items must remain aggregate and privacy-bounded. They must not include raw sessions, form values, IP addresses, tokens, secrets or unrestricted user agent history.

### 11.2 Fields needed by analytics history

The read model needs aggregated history, not raw history.

Minimum aggregate history inputs:

- current period summary;
- previous period summary;
- optional baseline period summary;
- metric trends for visibility, traffic, conversion and behavior;
- recommendation lifecycle summary;
- source sync history;
- known limitations.

Metric trends should support:

- visibility: impressions, clicks, CTR;
- traffic: visits and mobile share;
- conversion: contact actions and visit-to-intent conversion;
- behavior: CTA views, CTA clicks, gallery opens, FAQ expands and scroll depth.

### 11.3 Fields needed by published change history

Before/after analysis needs published change context from editorial workflow or future publication audit:

- `classified_change_id`;
- `entity_type`;
- `published_at`;
- `entity_id`;
- `previous_revision_id`;
- `new_revision_id`;
- `changed_scopes`;
- `changed_fields`;
- `change_types`;
- `changed_fields_summary`;
- `related_recommendation_id`;
- `is_mixed_change`;
- `attribution_safety`;
- `attribution_limitations`;
- `before_period`;
- `after_period`;
- `monitoring_status`;
- `data_sufficiency`;
- `tracking_context`;
- `source_freshness_context`;
- `evidence_item_ids`.

Required classification chain:

```text
previous_published_revision
-> new_published_revision
-> content diff
-> classified change set
-> published_change_history
-> monitoring window
-> before/after interpretation
```

Suggested `changed_scope` values:

- `seo_metadata`;
- `h1_hero`;
- `hero_copy`;
- `cta`;
- `proof_path`;
- `media_gallery`;
- `faq`;
- `internal_links`;
- `contact_block`;
- `layout`;
- `routing_slug`;
- `schema_markup`;
- `global_settings_projection`;
- `unknown`.

Suggested `change_type` values:

- `title_changed`;
- `description_changed`;
- `h1_changed`;
- `hero_copy_changed`;
- `cta_text_changed`;
- `cta_position_changed`;
- `messenger_added`;
- `messenger_removed`;
- `phone_changed`;
- `contact_channel_changed`;
- `proof_case_added`;
- `proof_case_removed`;
- `gallery_added`;
- `gallery_changed`;
- `faq_added`;
- `faq_changed`;
- `internal_links_changed`;
- `slug_changed`;
- `canonical_changed`;
- `schema_markup_changed`;
- `layout_changed`;
- `unknown`.

Allowed `attribution_safety` values:

- `clean_single_change`;
- `mixed_change`;
- `tracking_changed_nearby`;
- `insufficient_after_period`;
- `source_stale`;
- `source_missing`;
- `lead_domain_missing`;
- `not_attributable`;
- `unknown`.

If multiple significant scopes changed in the same publication, set `is_mixed_change = true` and expose `mixed_change_warning`. Consumers must not attribute metric movement to one changed field.

Published change history is analysis context. It must not imply that the recommendation itself can publish or mutate Content Core.

### 11.4 Fields needed by tracking change history

Tracking changes must be visible to UI and LLM because they can invalidate trend interpretation.

Minimum tracking change record:

- `changed_at`;
- `change_type`;
- `affected_events`;
- `affected_pages`;
- `description`;
- `impact_on_metrics`;
- `tracking_recently_changed`.

Suggested `change_type` values:

- `data_analytics_id_changed`;
- `event_name_changed`;
- `tracker_enabled`;
- `tracker_disabled`;
- `metrica_goal_changed`;
- `bot_exclusion_changed`;
- `form_tracking_changed`.

If tracking changed recently, the read model should expose `tracking_recently_changed` as an uncertainty flag. UI and LLM should avoid interpreting deltas as product changes when they may be measurement changes.
