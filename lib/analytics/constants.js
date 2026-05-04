export const ANALYTICS_EVENT_TYPES = Object.freeze([
  "page_view",
  "cta_view",
  "cta_click",
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "contact_link_click",
  "form_start",
  "form_submit",
  "gallery_open",
  "faq_expand",
  "case_card_click",
  "service_link_click",
  "scroll_depth"
]);

export const INTENT_EVENT_TYPES = Object.freeze([
  "cta_click",
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "contact_link_click",
  "form_start",
  "form_submit",
  "gallery_open",
  "faq_expand",
  "case_card_click",
  "service_link_click"
]);

export const PRIMARY_INTENT_EVENT_TYPES = Object.freeze([
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "contact_link_click",
  "form_submit"
]);

export const CONTACT_ACTION_EVENT_TYPES = Object.freeze([
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "contact_link_click",
  "form_submit"
]);

export const DEVICE_TYPES = Object.freeze(["mobile", "tablet", "desktop", "unknown"]);

export const SOURCE_SYSTEMS = Object.freeze([
  "first_party_events",
  "yandex_metrica",
  "yandex_webmaster",
  "google_search_console",
  "lead_domain",
  "content_core"
]);

export const SOURCE_HEALTH_STATUSES = Object.freeze([
  "ok",
  "stale",
  "failed",
  "partial",
  "not_configured",
  "not_applicable",
  "not_ready"
]);

export const TRAFFIC_SOURCE_ORDER = Object.freeze([
  "organic_yandex",
  "direct",
  "referral",
  "telegram",
  "whatsapp",
  "maps_or_business_directory",
  "organic_google",
  "paid",
  "campaign_utm",
  "unknown",
  "unattributed"
]);

export const SOURCE_LABELS = Object.freeze({
  organic_yandex: "Яндекс поиск",
  organic_google: "Google поиск",
  direct: "Прямые заходы",
  referral: "Переходы с сайтов",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  maps_or_business_directory: "Карты и справочники",
  paid: "Платный трафик",
  campaign_utm: "Кампании UTM",
  unknown: "Неизвестно",
  unattributed: "Без атрибуции"
});

export const ATTRIBUTION_SAFETY_VALUES = Object.freeze([
  "clean_single_change",
  "mixed_change",
  "tracking_changed_nearby",
  "insufficient_after_period",
  "source_stale",
  "source_missing",
  "lead_domain_missing",
  "not_attributable",
  "unknown"
]);

export const CHANGE_SCOPES = Object.freeze([
  "seo_metadata",
  "h1_hero",
  "hero_copy",
  "cta",
  "proof_path",
  "media_gallery",
  "faq",
  "internal_links",
  "contact_block",
  "layout",
  "routing_slug",
  "schema_markup",
  "global_settings_projection",
  "unknown"
]);

export const CHANGE_TYPES = Object.freeze([
  "title_changed",
  "description_changed",
  "h1_changed",
  "hero_copy_changed",
  "cta_text_changed",
  "cta_position_changed",
  "messenger_added",
  "messenger_removed",
  "phone_changed",
  "contact_channel_changed",
  "proof_case_added",
  "proof_case_removed",
  "gallery_added",
  "gallery_changed",
  "faq_added",
  "faq_changed",
  "internal_links_changed",
  "slug_changed",
  "canonical_changed",
  "schema_markup_changed",
  "layout_changed",
  "unknown"
]);

export const ISSUE_TYPES = Object.freeze([
  "low_ctr",
  "traffic_no_intent",
  "published_service_no_case",
  "published_service_no_media",
  "mobile_low_conversion",
  "gallery_engagement_no_conversion",
  "published_missing_sitemap",
  "published_noindexed",
  "contacts_transition_no_leads",
  "weak_proof_path",
  "unmapped_analytics_url"
]);
