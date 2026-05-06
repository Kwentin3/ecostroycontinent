# SEO Dashboard Content Change Attribution Safety Refine Report

Проект: Экостройконтинент
Дата: 2026-04-30
Статус: documentation-only final targeted refine

## 1. Изменённые документы

Изменены:

- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`;
- `docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json`.

Создан report:

- `docs/reports/2026-04-30/SEO_DASHBOARD_CONTENT_CHANGE_ATTRIBUTION_SAFETY_REFINE_Экостройконтинент_v0.1.report.md`.

## 2. Добавленные разделы

В Analytics Read Model Contract добавлен раздел:

- `Content Change Classification and Metric Attribution Safety`.

В LLM Context Contract добавлен подраздел:

- `Attribution Safety Wording`.

В taxonomy расширен блок:

- `Fields needed by published change history`.

В PRD добавлены краткие ссылки на content change classification и attribution safety в read model / phasing / acceptance context.

## 3. Связь content history и metric history

Теперь зафиксирована цепочка:

```text
previous_published_revision
-> new_published_revision
-> content diff
-> classified change set
-> published_change_history
-> monitoring window
-> before/after interpretation
```

Это делает историю контента осью для metric history, но не разрешает автоматическую причинность.

## 4. Добавленные поля

Добавлены/зафиксированы поля:

- `classified_change_id`;
- `entity_type`;
- `entity_id`;
- `previous_revision_id`;
- `new_revision_id`;
- `published_at`;
- `changed_scopes`;
- `changed_fields`;
- `change_types`;
- `change_summary`;
- `related_recommendation_id`;
- `is_mixed_change`;
- `attribution_safety`;
- `attribution_limitations`;
- `monitoring_status`;
- `before_period`;
- `after_period`;
- `data_sufficiency`;
- `tracking_context`;
- `source_freshness_context`;
- `evidence_item_ids`.

Добавлены `change_scope` values:

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

Уточнены `change_type` values:

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

Добавлены `attribution_safety` values:

- `clean_single_change`;
- `mixed_change`;
- `tracking_changed_nearby`;
- `insufficient_after_period`;
- `source_stale`;
- `source_missing`;
- `lead_domain_missing`;
- `not_attributable`;
- `unknown`.

## 5. Fixture examples

В JSON fixture добавлены:

- `classified_content_changes`;
- расширенный `published_change_history`;
- `attribution_safety` в selected page `before_after_summary`;
- LLM derivation note `must_respect_attribution_safety`.

Примеры:

- `cchg_003`: clean single change, `title_changed` on `/services/monolitnye-raboty`, `attribution_safety = clean_single_change`;
- `cchg_001`: mixed change, CTA + gallery + FAQ on `/services/stroitelstvo-domov-pod-klyuch`, `is_mixed_change = true`, `attribution_safety = mixed_change`;
- `cchg_004`: contact block change near tracking change on `/contacts`, `attribution_safety = tracking_changed_nearby`;
- `cchg_002`: FAQ added yesterday on reconstruction service, `monitoring_status = collecting`, `data_sufficiency = insufficient`, `attribution_safety = insufficient_after_period`.

JSON fixture validated successfully via `ConvertFrom-Json`.

## 6. Self-audit: critical gaps

Checked before implementation planning:

- integration secrets / connection management;
- owner reduced DTO;
- read model snapshot vs on-demand;
- Yandex API capability check;
- lead/intake dependency;
- thresholds / confidence gates;
- docs/out deletions / git hygiene.

No additional doc gap looked critical enough to justify a broader documentation sweep in this task.

## 7. Gaps left for implementation plan

Left for implementation planning:

- exact secret storage and connection settings flow: already bounded by "no tokens in read model/UI" and belongs to infra/integration planning;
- owner reduced DTO: already open, not blocking analytics safety;
- read model snapshot vs on-demand/cache strategy: open architecture decision for implementation plan;
- Yandex API capability check: must happen before integration design, but the product contract already says API fields are product needs, not final API shape;
- lead/intake dependency: explicitly not ready; read model now prevents lead conversion claims;
- thresholds / confidence gates: need implementation-time baseline/sample-size decisions;
- docs/out deletions: existing working-tree state, not touched in this task.

## 8. Runtime confirmation

Runtime-code was not changed.

Not changed:

- `app/*`;
- `components/*`;
- `lib/*`;
- `db/*`;
- `scripts/*`;
- package files;
- env files;
- migrations;
- API routes;
- provider config.

## 9. Scoped git status

Scoped docs status at verification time:

```text
?? docs/mockups/fixtures/seo-dashboard-analytics-contract.sample.json
?? docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md
?? docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md
?? docs/reports/2026-04-30/SEO_DASHBOARD_CONTENT_CHANGE_ATTRIBUTION_SAFETY_REFINE_Экостройконтинент_v0.1.report.md
```

Runtime scoped status for forbidden paths was empty.

Full `git status --short` still shows pre-existing deletions under `docs/out/*`. They were not touched or restored.
