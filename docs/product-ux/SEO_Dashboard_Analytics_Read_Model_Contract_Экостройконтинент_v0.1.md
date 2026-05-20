# Analytics Read Model Contract для дашборда видимости, трафика и конверсии

Проект: «Экостройконтинент»
Версия: v0.1
Статус: product/architecture contract, documentation-only
Дата: 2026-04-30
Связанные документы:

- `SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`
- `SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`
- `SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`

## 1. Purpose

Этот документ фиксирует аналитический read model / contract для будущей фичи «Дашборд видимости, трафика и конверсии».

Главная граница:

```text
источники данных
-> адаптеры
-> нормализация
-> агрегация
-> analytics read model / contract
-> потребители: UI-дэшборд, LLM context builders, отчёты, future exports
```

UI-дэшборд, LLM-копилот и отчёты не должны каждый по-своему собирать данные из Яндекс Метрики, Яндекс Вебмастера, first-party events и Content Core.

Analytics read model нужен, чтобы:

- дать всем потребителям единые значения метрик;
- дать единый `source_health` / `data_freshness`;
- дать единые `warnings`, `limitations`, `uncertainty_flags`;
- сделать UI независимым от конкретных внешних API;
- сделать LLM context construction безопасным и task-specific;
- поддержать статичные HTML-мокапы на JSON-фикстуре;
- сохранить explainable связь между сигналом, доказательством, гипотезой и действием.

Это не реализация, не миграция, не API schema и не финальная БД-схема.

## 2. Product Position

Analytics read model — это **не source of truth**.

Он не заменяет:

- Content Core;
- `analytics_event`;
- `analytics_page_daily`;
- `external_search_visibility_daily`;
- Яндекс Метрику;
- Яндекс Вебмастер;
- Google Search Console;
- lead/intake domain;
- recommendation state.

Read model является версионированным view model / DTO слоем для потребителей.

Он должен быть:

- версионированным;
- стабильным для UI/LLM/report consumers;
- explainable;
- пригодным для таблиц, карточек и detail surfaces;
- пригодным для LLM context builders;
- privacy-bounded;
- не содержащим секреты;
- не содержащим персональные данные;
- не содержащим raw events или raw sessions;
- не завязанным на конкретный внешний API;
- не завязанным на конкретную визуализацию.

Если canonical truth меняется в Content Core или recommendation state, read model только отражает агрегированный снимок этого состояния. Он не публикует, не мутирует и не утверждает content truth.

## 3. Contract Scope

Минимальный контракт покрывает:

- общий envelope;
- source health / freshness;
- dashboard overview;
- traffic sources;
- search visibility;
- page list;
- selected page detail;
- semantic click map;
- issue/recommendation backlog;
- evidence items;
- analytics history;
- published change history;
- tracking change history;
- warnings and limitations;
- LLM derivation boundary.

Контракт не покрывает:

- raw event capture;
- external API request/response shapes;
- integration token storage;
- import job implementation;
- DB migrations;
- UI implementation;
- LLM provider/model/prompt implementation.

## 4. Common Envelope

Every analytics read model payload should start with a common envelope.

Recommended fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `version` | string | Contract version, e.g. `0.1`. |
| `generated_at` | datetime | When this read model snapshot was generated. |
| `period` | object | Current reporting period. |
| `comparison_period` | object | Previous period used for deltas. |
| `timezone` | string | Display/aggregation timezone. |
| `data_freshness` | object | Compact map of source status for consumers. |
| `sources` | array | Detailed source health records. |
| `privacy_filters_applied` | array | Deterministic filters applied before aggregation/read model generation. |
| `excluded_traffic_policy` | object | How admin/bot/QA/preview traffic is excluded or flagged. |
| `contract_scope` | array | Which sections are present in the payload. |
| `warnings` | array | User-visible data warnings. |
| `limitations` | array | Interpretation limitations. |

Example:

```json
{
  "version": "0.1",
  "generated_at": "2026-04-30T09:30:00+03:00",
  "period": {
    "label": "28 дней",
    "start": "2026-04-02",
    "end": "2026-04-29"
  },
  "comparison_period": {
    "label": "предыдущие 28 дней",
    "start": "2026-03-05",
    "end": "2026-04-01"
  },
  "timezone": "Europe/Moscow",
  "contract_scope": [
    "overview",
    "traffic_sources",
    "search_visibility",
    "pages",
    "selected_page_detail",
    "recommendations",
    "analytics_history"
  ]
}
```

## 5. Source Health / Freshness Contract

Source health must be shared by UI and LLM. If a source is `stale`, `failed`, `partial` or `not_configured`, both surfaces must see the same status and limitations.

Required sources for this domain:

- `first_party_events`;
- `yandex_metrica`;
- `yandex_webmaster`;
- `google_search_console`;
- `lead_domain`;
- `content_core`.

Allowed `status` values:

- `ok`;
- `stale`;
- `failed`;
- `partial`;
- `not_configured`;
- `not_applicable`.

Recommended record:

| Field | Meaning |
| --- | --- |
| `source_id` | Stable source key. |
| `display_name` | User-facing name. |
| `source_kind` | `internal`, `external_import`, `domain`, `content`. |
| `status` | Freshness/availability status. |
| `last_successful_at` | Last successful import/aggregation time, nullable. |
| `last_attempted_at` | Last attempted import/aggregation time, nullable. |
| `imported_period_start` | Imported period start, nullable. |
| `imported_period_end` | Imported period end, nullable. |
| `safe_error_message` | User-safe explanation, no tokens/secrets. |
| `unmapped_url_count` | Count of imported URLs not mapped to site entities. |
| `rows_imported` | Rows imported/aggregated for the period if known. |
| `notes` | Short interpretation note. |

UI usage:

- show source badges and warnings;
- avoid treating missing sources as zero metrics;
- make stale/not_configured states visible.

LLM usage:

- propagate `source_missing`, `source_stale`, `lead_domain_missing`, `unmapped_url` flags;
- mention material limitations;
- avoid unsupported conclusions from absent sources.

### 5.1. R4 External Evidence DTO

R4 adds an additive `external_evidence` block next to `external_source_readiness`.

`external_evidence` is a compact enrichment/evidence layer built only from project-owned storage. It must not replace `overview`, must not call live Yandex APIs from the read model path, and must not generate recommendations.

Recommended shape:

```json
{
  "external_evidence": {
    "yandex_metrica": {
      "status": "ok",
      "freshness": { "status": "fresh" },
      "data_actionability": "limited_external_evidence",
      "limitations": [
        "external_metrica_not_operational_truth",
        "metrica_external_enrichment_only",
        "do_not_feed_metrica_into_primary_overview"
      ],
      "imported_period_start": "2026-05-17",
      "imported_period_end": "2026-05-19",
      "traffic_sources": { "rows": [], "totals": {}, "limitations": [] },
      "source_details": { "rows": [], "totals": {}, "limitations": [] },
      "devices": { "rows": [], "totals": {}, "limitations": [] },
      "geography": {
        "countries": [],
        "regions": [],
        "country_totals": {},
        "region_totals": {},
        "limitations": []
      },
      "landings": {
        "rows": [],
        "totals": {},
        "mapped_count": 0,
        "unmapped_count": 0,
        "limitations": ["unmapped_urls_are_diagnostics_only"]
      }
    },
    "yandex_webmaster": {
      "status": "ok",
      "freshness": { "status": "fresh" },
      "data_actionability": "readiness_and_limited_indexation_evidence",
      "limitations": [
        "webmaster_not_content_core_truth",
        "webmaster_external_search_evidence_only"
      ],
      "host_indexation": {},
      "url_samples": { "sample_count": 0, "resolved_count": 0, "unmapped_count": 0, "rows": [], "limitations": [] },
      "query_visibility": { "row_count": 0, "rows": [], "totals": {}, "limitations": [] }
    }
  }
}
```

Rules:

- keep rows top-N and compact;
- expose safe summaries, not raw external responses or metadata;
- keep Metrica visits/users/pageviews external-only;
- treat Webmaster zero query rows as a limitation, not as zero demand;
- keep landing URL mapping read-only and diagnostic-only when unmapped.

## 6. Dashboard Overview Contract

The overview is not just a metric strip. Each metric should be a signal with explanation and next action where relevant.

Recommended fields:

| Field | Meaning |
| --- | --- |
| `metrics` | List of overview metric cards. |
| `top_opportunities` | 3-5 prioritized opportunities. |
| `top_losses` | Declines or leak points worth inspection. |
| `top_recommendations` | Recommendations to act on now. |
| `data_warnings` | Warnings affecting overview interpretation. |

Metric item fields:

| Field | Meaning |
| --- | --- |
| `metric_id` | Stable key: `visits`, `organic_visits`, `yandex_impressions`, etc. |
| `label` | User-facing label. |
| `value` | Current period value. |
| `unit` | `count`, `percent`, `ratio`, `status`. |
| `comparison_value` | Previous period value if available. |
| `delta_vs_previous_period` | Absolute and relative delta. |
| `signal` | Deterministic interpretation label. |
| `explanation` | Short user-facing explanation. |
| `next_action` | Suggested next inspection/action. |
| `confidence` | `insufficient`, `low`, `medium`, `high`. |
| `evidence_item_ids` | References to evidence items. |

Required overview metrics:

- `visits`;
- `organic_visits`;
- `yandex_impressions`;
- `yandex_clicks`;
- `ctr`;
- `contact_actions`;
- `leads` if available;
- `visit_to_intent_conversion`;
- `visit_to_lead_conversion` if available.

If lead domain is not ready, `leads` and `visit_to_lead_conversion` should be represented as unavailable/not_applicable, not zero.

## 7. Traffic Sources Contract

Traffic sources must use practical project labels and keep Яндекс first in UI ordering.

Allowed source keys:

- `organic_yandex`;
- `organic_google`;
- `direct`;
- `referral`;
- `telegram`;
- `whatsapp`;
- `maps_or_business_directory`;
- `paid`;
- `campaign_utm`;
- `unknown`;
- `unattributed`.

Recommended fields per source:

| Field | Meaning |
| --- | --- |
| `source` | Source key. |
| `display_name` | User-facing source label. |
| `sort_order` | Recommended display order. |
| `visits` | Visits in current period. |
| `users` | Users if available. |
| `contact_actions` | Contact/intent actions. |
| `leads` | Leads if lead domain available, else nullable. |
| `conversion_rate` | Visit -> contact action conversion. |
| `lead_conversion_rate` | Visit -> lead conversion if available. |
| `delta_vs_previous_period` | Change vs previous period. |
| `confidence` | Confidence label. |
| `notes` | Limitations or interpretation notes. |
| `evidence_item_ids` | Evidence references. |

If attribution is weak, use `unknown` or `unattributed`. Do not infer a source from weak evidence.

## 8. Search Visibility Contract

Search visibility is Yandex-first. Google Search Console is second contour when configured.

Recommended fields per record:

| Field | Meaning |
| --- | --- |
| `source_system` | `yandex_webmaster` or `google_search_console`. |
| `search_engine` | `yandex`, `google`, etc. |
| `query` | Optional aggregate query; nullable for page-level rows. |
| `page_path` | Normalized page path. |
| `entity_type` | `service`, `case`, `page`, later `article`, nullable if unmapped. |
| `entity_id` | Route-owning entity id, nullable if unmapped. |
| `impressions` | Aggregate impressions. |
| `clicks` | Aggregate clicks. |
| `ctr` | Click-through rate. |
| `position` | Average position if available. |
| `device` | `desktop`, `mobile`, `tablet`, `all`, nullable. |
| `country` | Country if available. |
| `region` | Region if available. |
| `delta` | Change vs previous period. |
| `opportunity_type` | `low_ctr`, `visibility_growth`, `visibility_drop`, `query_page_mismatch`, etc. |
| `confidence` | Confidence label. |
| `limitations` | Interpretation limits. |
| `evidence_item_ids` | Evidence references. |

Important limitation:

Search query data from Яндекс Вебмастер or Google Search Console is an aggregate page/date/device/country signal. It must not be linked to a specific user, session, contact action or lead.

## 9. Page List Contract

Page list is the main SEO Manager work surface.

Recommended fields per page:

| Field | Meaning |
| --- | --- |
| `page_path` | Normalized route path. |
| `entity_type` | `service`, `case`, `page`, later `article`. |
| `entity_id` | Route owner id. |
| `page_title` | User-facing page title. |
| `commercial_priority` | Business priority label. |
| `publish_status` | `published`, `draft`, etc. |
| `indexation_state` | `indexed`, `not_indexed`, `unknown`, etc. |
| `sitemap_state` | `present`, `missing`, `unknown`. |
| `canonical_state` | `ok`, `mismatch`, `missing`, `unknown`. |
| `impressions` | Search impressions. |
| `clicks` | Search clicks. |
| `ctr` | Search CTR. |
| `visits` | Visits. |
| `contact_actions` | First-party contact/intent actions. |
| `leads` | Leads if available. |
| `conversion_rate` | Visit -> contact action. |
| `lead_conversion_rate` | Visit -> lead if available. |
| `mobile_share` | Mobile traffic share. |
| `proof_path_summary` | Case/gallery/FAQ/CTA/reviews summary. |
| `seo_health` | `ok`, `watch`, `issue`, `unknown`. |
| `conversion_health` | Same health scale. |
| `proof_health` | Same health scale. |
| `primary_issue` | Main issue key and label. |
| `recommended_next_action` | Human next action. |
| `recommendation_status` | `new`, `accepted`, `in_progress`, `done`, `dismissed`, nullable. |
| `priority` | Operational priority. |
| `confidence` | Confidence label. |
| `warnings` | Page-level warnings. |
| `evidence_item_ids` | Evidence references. |

Page rows should be sorted by action priority by default, not only by traffic volume.

## 10. Page Detail Contract

Page detail is the selected page diagnostic surface. It should be enough for UI rendering and for task-specific LLM context construction.

Recommended top-level fields:

- `page_identity`;
- `current_published_revision`;
- `seo_fields_summary`;
- `indexation_summary`;
- `visibility_summary`;
- `traffic_summary`;
- `behavior_summary`;
- `intent_events_summary`;
- `lead_summary` if available;
- `proof_path`;
- `semantic_click_map`;
- `active_issues`;
- `recommendation_history`;
- `published_change_history`;
- `before_after_summary`;
- `source_freshness`;
- `uncertainty_flags`;
- `limitations`;
- `evidence_item_ids`.

### Page identity

| Field | Meaning |
| --- | --- |
| `page_path` | Normalized route path. |
| `entity_type` | Route owner type. |
| `entity_id` | Route owner id. |
| `page_kind` | `service_detail`, `case_detail`, `standalone_page`, etc. |
| `page_title` | Display title. |

### Current published revision

| Field | Meaning |
| --- | --- |
| `published_revision_id` | Active published revision id. |
| `published_at` | Publish timestamp if known. |
| `publish_status` | Current status. |

### Summaries

Summaries should use aggregate values and evidence references, not raw data.

Examples:

- visibility summary: impressions, clicks, CTR, average position, Yandex-first status;
- traffic summary: visits, users, organic share, mobile share, top source;
- behavior summary: CTA views/clicks, gallery opens, FAQ expands, scroll depth;
- intent events summary: click-to-call, Telegram, WhatsApp, form start, form submit;
- proof path: has case, has gallery, has FAQ, has CTA, has reviews;
- before/after summary: only if enough data exists after a published change.

## 11. Semantic Click Map Contract

Semantic click map is not a pixel heatmap. It describes behavior by stable semantic elements.

Recommended fields per element:

| Field | Meaning |
| --- | --- |
| `element_id` | Stable analytics id, e.g. `hero_primary_call`. |
| `event_type` | Event type from taxonomy. |
| `section_id` | Semantic section, e.g. `hero`, `proof_gallery`. |
| `label` | User-facing label. |
| `views` | Views/visibility count if available. |
| `clicks` | Click/action count. |
| `actions` | More general action count if event is not a click. |
| `conversion_to_next_step` | Ratio from view/previous step to next action. |
| `drop_off_signal` | Deterministic signal label. |
| `related_entity_type` | Target/source entity type if relevant. |
| `related_entity_id` | Target/source entity id if relevant. |
| `confidence` | Confidence label. |
| `evidence_item_ids` | Evidence references. |

Example element ids:

- `hero_primary_call`;
- `hero_primary_telegram`;
- `proof_gallery_open`;
- `faq_expand`;
- `related_case_click`;
- `contact_form_start`;
- `contact_form_submit`;
- `contacts_link_click`.

## 12. Issue / Recommendation Contract

Issues and recommendations are advisory work-management signals. They do not mutate Content Core and do not publish.

Recommended fields:

| Field | Meaning |
| --- | --- |
| `recommendation_id` | Stable id if persisted or fixture id if mock. |
| `issue_type` | Deterministic issue key. |
| `linked_page` | Page identity summary. |
| `linked_entity` | Entity identity summary. |
| `priority` | Operational priority. |
| `severity` | Severity of detected issue. |
| `evidence_period` | Period behind the recommendation. |
| `evidence_items` | Evidence item ids or embedded compact evidence references. |
| `hypothesis` | What may be happening, not proven cause. |
| `recommended_action` | Draft/advisory next action. |
| `owner_role` | SEO Manager, editor, business owner, admin. |
| `status` | `new`, `accepted`, `in_progress`, `done`, `dismissed`. |
| `next_check_date` | Suggested monitoring date. |
| `implemented_at` | When implementation was marked done, nullable. |
| `published_at` | Related published change time, nullable. |
| `monitoring_started_at` | Monitoring start time, nullable. |
| `result_summary` | Before/after summary if available. |
| `confidence` | Confidence label. |
| `limitations` | Data limitations. |

Recommendation lifecycle events are not public visitor behavior events. They belong to work management/audit.

## 13. Evidence Item Contract

Evidence items are the shared explainability unit for UI and LLM.

Recommended fields:

| Field | Meaning |
| --- | --- |
| `evidence_id` | Stable id inside read model snapshot. |
| `source` | `first_party_aggregate`, `yandex_metrica`, `yandex_webmaster`, `google_search_console`, `content_core`, `sitemap_runtime`, `recommendation_history`, `published_change_history`, `tracking_change_history`. |
| `metric` | Metric key. |
| `value` | Current value. |
| `comparison_value` | Previous/baseline value if available. |
| `period` | Period object. |
| `sample_size` | Denominator/count behind the statement. |
| `freshness` | Source freshness status. |
| `confidence` | Confidence label. |
| `interpretation` | Deterministic interpretation label. |
| `linked_entity` | Entity reference if relevant. |
| `notes` | Short plain-language explanation. |

Evidence items should be concise. They are not raw events and should not include form values, IPs, secrets, raw sessions or user identifiers.

## 14. Analytics History / Analysis Context

`analytics_history` provides aggregated dynamics for UI and LLM. It is the minimum analysis context for before/after, trend explanation and uncertainty.

Recommended fields:

| Field | Meaning |
| --- | --- |
| `current_period` | Current period summary. |
| `previous_period` | Previous period summary. |
| `baseline_period` | Optional baseline period when available. |
| `metric_trends` | Aggregated current/previous/delta trends. |
| `published_changes` | Published changes relevant to metrics. |
| `recommendation_history` | Recommendation lifecycle summary. |
| `tracking_changes` | Tracking changes that may affect metrics. |
| `source_sync_history` | Import/sync history summary. |
| `known_limitations` | Historical interpretation limits. |

`metric_trends` should include at least:

- `visibility`: impressions, clicks, CTR;
- `traffic`: visits, mobile share;
- `conversion`: contact actions, visit_to_intent;
- `behavior`: CTA views, CTA clicks, gallery opens, FAQ expands, scroll depth.

All dynamics are aggregate. Do not include raw events, raw sessions or user paths.

## 15. Content Change Classification and Metric Attribution Safety

Published change history must not be a free-form note only. It should be produced from classified content changes between published revisions, then linked to a monitoring window and metric summary.

Required chain:

```text
previous_published_revision
-> new_published_revision
-> content diff
-> classified change set
-> published_change_history
-> monitoring window
-> before/after interpretation
```

The goal is to prevent UI and LLM from making unsafe claims such as:

- "CTR вырос из-за title";
- "CTA улучшил конверсию";
- "FAQ привёл к росту заявок".

Safe wording should use:

- "после изменения";
- "после набора изменений";
- "на фоне публикации изменений";
- "есть сигнал к проверке";
- "нужен период мониторинга".

### 15.1 Classified Content Change Fields

Recommended fields:

| Field | Meaning |
| --- | --- |
| `classified_change_id` | Stable id for the classified change record. |
| `entity_type` | Affected entity type. |
| `entity_id` | Affected entity id. |
| `previous_revision_id` | Previous published revision id. |
| `new_revision_id` | New published revision id. |
| `published_at` | New revision publish time. |
| `changed_scopes` | High-level scopes affected by the diff. |
| `changed_fields` | Field-level changed paths or names. |
| `change_types` | Classified change type keys. |
| `change_summary` | Human-readable summary. |
| `related_recommendation_id` | Linked recommendation if any. |
| `is_mixed_change` | True when multiple significant scopes changed in one publish. |
| `attribution_safety` | Attribution safety status. |
| `attribution_limitations` | Machine-readable or plain-language limits. |
| `monitoring_status` | `not_started`, `collecting`, `ready`, `insufficient_data`. |
| `before_period` | Before window. |
| `after_period` | After window. |
| `data_sufficiency` | `insufficient`, `low`, `medium`, `high`. |
| `tracking_context` | Nearby tracking changes affecting interpretation. |
| `source_freshness_context` | Source statuses relevant to before/after metrics. |
| `evidence_item_ids` | Evidence references. |

`published_change_history` should reference or embed these classified change records. The read model may expose both:

- `classified_content_changes`: canonical classified change records for the snapshot;
- `published_change_history`: monitoring-oriented list used by UI/LLM.

### 15.2 Change Scope

Allowed `change_scope` values:

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

### 15.3 Change Type

Allowed `change_type` values:

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

Older broad labels such as `cta_changed` may be retained for backward-compatible display, but implementation should prefer the more specific values above.

### 15.4 Mixed Change Logic

If one published revision changes multiple significant scopes, set:

```json
{
  "is_mixed_change": true,
  "attribution_safety": "mixed_change"
}
```

Examples of mixed changes:

- title + CTA + FAQ;
- hero copy + gallery + internal links;
- slug + canonical + sitemap;
- contact block + messenger;
- CTA + gallery + FAQ.

UI and LLM must surface `mixed_change_warning`. Single-cause attribution is forbidden.

Allowed wording:

- "после набора изменений наблюдается...";
- "на фоне публикации изменений...";
- "есть сигнал к проверке...".

Forbidden wording:

- "CTR вырос из-за title";
- "CTA улучшил конверсию";
- "FAQ привёл к росту заявок".

### 15.5 Attribution Safety

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

Rules:

- `clean_single_change`: before/after can be interpreted cautiously, but still cannot automatically claim causality.
- `mixed_change`: only "after change set" wording; no single-cause attribution.
- `tracking_changed_nearby`: metrics affected by tracking changes must be interpreted cautiously.
- `insufficient_after_period`: no outcome conclusion; only monitoring.
- `source_stale`: conclusions are limited for stale source metrics.
- `source_missing`: do not analyze missing-source metrics.
- `lead_domain_missing`: do not analyze lead conversion; use contact actions only and say so.
- `not_attributable`: show observation, not effect.
- `unknown`: show as unknown until classification or data quality improves.

### 15.6 Recommendation -> Classified Change -> Monitoring

A recommendation can be linked to a published change, but recommendation status does not prove metric effect.

Correct lifecycle:

```text
recommendation accepted
-> content/editorial change drafted
-> review
-> published revision
-> classified change
-> monitoring window starts
-> after-period reaches sufficient sample
-> result_summary is generated
-> recommendation can be resolved or reopened
```

`recommendation.status = done` or a linked `published_at` means implementation/publication happened. It does not mean the recommendation worked.

### 15.7 Before/After Interpretation Rules

Before/after summaries must:

- compare like-for-like periods where possible;
- show period lengths;
- show sample sizes;
- show source freshness;
- show tracking context;
- show `is_mixed_change`;
- show `attribution_safety`;
- show `data_sufficiency`;
- keep leads separate from contact actions.

Rules:

- if after period is too short, use `monitoring_status = collecting` or `insufficient_data`;
- if tracking changed nearby, add uncertainty flag and limit event-metric interpretation;
- if source is stale, failed or missing, limit the conclusion for that source;
- if change is mixed, do not attribute movement to one changed field;
- if lead domain is missing, do not discuss lead conversion;
- if only contact actions are available, say so;
- never claim causality automatically.

## 16. Tracking Change History Contract

Tracking change history prevents false conclusions when measurement changed.

Recommended fields:

| Field | Meaning |
| --- | --- |
| `changed_at` | When tracking changed. |
| `change_type` | Tracking change key. |
| `affected_events` | Event types affected. |
| `affected_pages` | Page paths or entity refs affected. |
| `description` | Human-readable explanation. |
| `impact_on_metrics` | Expected impact on time series. |
| `tracking_recently_changed` | Boolean uncertainty flag. |

Example `change_type` values:

- `data_analytics_id_changed`;
- `event_name_changed`;
- `tracker_enabled`;
- `tracker_disabled`;
- `metrica_goal_changed`;
- `bot_exclusion_changed`;
- `form_tracking_changed`.

If tracking recently changed, UI and LLM must see `tracking_recently_changed` in `uncertainty_flags` and avoid overinterpreting deltas.

## 17. Warnings, Limitations and Uncertainty

Warnings are user-visible operational messages. Limitations are interpretation constraints. Uncertainty flags are machine-readable labels for UI/LLM.

Common warning types:

- `unmapped_url`;
- `source_stale`;
- `source_failed`;
- `source_not_configured`;
- `lead_domain_not_ready`;
- `small_sample`;
- `mixed_change_warning`;
- `attribution_limited`;
- `tracking_recently_changed`;
- `query_data_aggregate_only`;

Common uncertainty flags:

- `small_sample`;
- `source_stale`;
- `source_missing`;
- `query_data_aggregate_only`;
- `lead_domain_missing`;
- `mixed_change`;
- `insufficient_after_period`;
- `not_attributable`;
- `tracking_recently_changed`;
- `admin_bot_exclusion_incomplete`;
- `unmapped_url`;
- `no_before_after_baseline`;
- `owner_confirmation_required`.

Consumers should not have to recompute these flags from raw metrics. The read model should provide them.

## 18. LLM Analysis Derivation

LLM context packets must not be built directly from raw sources.

Correct chain:

```text
analytics read model
-> LLM context builder
-> LLM context packet
-> LLM explanation / hypotheses / draft recommendation
```

LLM context builders may take from read model:

- selected page detail;
- evidence items;
- trend summary;
- published changes;
- recommendation history;
- source freshness;
- limitations;
- uncertainty flags.

LLM must not receive:

- raw events;
- raw sessions;
- form values;
- IP;
- tokens;
- secrets;
- direct SQL;
- full Яндекс Метрика export;
- full Яндекс Вебмастер export;
- unrestricted user agent history;
- unfiltered admin/bot/QA traffic;
- personal data entered by users.

LLM context should remain task-specific. For `explain_page`, provide selected page detail, selected evidence items, trends and limits. Do not provide the full dashboard table if the task does not need it.

## 19. UI Contract vs LLM Contract

UI contract is broader. It can include:

- overview cards;
- 50+ page rows;
- traffic source tables;
- search visibility rows;
- filters and sorting values;
- selected page detail;
- source health panels;
- recommendation backlog.

LLM context is narrower and task-specific. It should include only:

- the selected entity/page or relevant recommendation;
- compact evidence items;
- relevant trend history;
- relevant published/tracking changes;
- source freshness;
- limitations and uncertainty flags;
- allowed/forbidden outputs.

Example:

- UI can display 50 pages in `page_list`.
- LLM for “Объяснить страницу” receives one selected page, 5-10 evidence items, related history, freshness and limitations.

This prevents all-data chat, raw exploration and accidental leakage of unrelated business context.

## 20. JSON Fixture Contract

Static mockups should be built from a JSON fixture that follows this read model.

Fixture path:

- `docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json`

The fixture is not source of truth and not production data. It is a realistic example payload for:

- validating UI structure before implementation;
- aligning HTML mockups to the contract;
- giving LLM context designers realistic evidence/history shapes;
- preventing imaginary data shapes in prototypes.

## 21. Future Implementation Notes

Future implementation should:

- generate read model from project-owned normalized aggregates, not from live external API calls during UI render;
- version the read model and tolerate additive fields;
- keep source freshness and warnings in the read model;
- generate evidence items at aggregation/read-model layer;
- keep raw events behind retention and privacy boundaries;
- build LLM context packets from read model slices;
- treat lead metrics as unavailable until lead/intake domain exists;
- preserve Yandex-first display/priority for РФ search visibility.

Future implementation should not:

- let UI call Яндекс or Google APIs directly;
- let LLM call raw data sources;
- store tokens/secrets in read model;
- encode visualization-specific layout rules into the contract;
- treat missing lead data as zero leads;
- claim causality from before/after deltas without sufficient evidence.

## 22. Open Questions

1. What exact backend type/schema will represent the read model in implementation?
2. Should read model snapshots be persisted for audit or generated on demand?
3. What cache duration is acceptable for UI dashboard responses?
4. Which source freshness thresholds define `stale` for each source?
5. What minimum sample size gates should define `low`, `medium` and `high` confidence?
6. Should future exports use the same read model or a narrower export-specific DTO?
7. Where should recommendation state live: dedicated table, generated issues with persisted review state, or external tracker later?
8. Which lead/intake fields are safe to aggregate once lead domain exists?
9. Should Business Owner receive a reduced read model view, or only a separate owner summary DTO?
10. What retention applies to historical read model snapshots if saved?
