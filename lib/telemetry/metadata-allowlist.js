export const COMMON_METADATA_KEYS = [
  "analytics_id",
  "section_id",
  "label",
  "target_type",
  "target_id",
  "target_path",
  "target_href",
  "source_label",
  "source_entity_type",
  "source_entity_id"
];

export const METADATA_ALLOWLIST_BY_EVENT = Object.freeze({
  page_viewed: [
    ...COMMON_METADATA_KEYS,
    "page_kind",
    "route_kind",
    "public_display_mode"
  ],
  page_engagement_recorded: [
    ...COMMON_METADATA_KEYS,
    "flush_reason",
    "engagement_reason"
  ],
  service_card_opened: [
    ...COMMON_METADATA_KEYS,
    "card_action",
    "service_hint",
    "source_case_id"
  ],
  case_card_opened: [
    ...COMMON_METADATA_KEYS,
    "card_action",
    "case_hint",
    "source_service_id"
  ],
  gallery_opened: [
    ...COMMON_METADATA_KEYS,
    "gallery_id",
    "gallery_kind"
  ],
  cta_clicked: [
    ...COMMON_METADATA_KEYS,
    "cta_kind",
    "destination_kind",
    "nav_item"
  ],
  phone_clicked: [
    ...COMMON_METADATA_KEYS,
    "cta_kind",
    "destination_kind",
    "contact_target_kind"
  ],
  email_clicked: [
    ...COMMON_METADATA_KEYS,
    "cta_kind",
    "destination_kind",
    "contact_target_kind"
  ],
  messenger_clicked: [
    ...COMMON_METADATA_KEYS,
    "cta_kind",
    "destination_kind",
    "contact_target_kind"
  ],
  contact_journey_created: [
    "final_contact_event_name",
    "contact_channel",
    "journey_length"
  ]
});

export function allowedMetadataKeysForEvent(eventName) {
  return new Set(METADATA_ALLOWLIST_BY_EVENT[eventName] || []);
}
