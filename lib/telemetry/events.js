export const TELEMETRY_EVENT_VERSION = "1.0";

export const TELEMETRY_EVENT_NAMES = [
  "page_viewed",
  "page_engagement_recorded",
  "service_card_opened",
  "case_card_opened",
  "gallery_opened",
  "cta_clicked",
  "phone_clicked",
  "email_clicked",
  "messenger_clicked",
  "contact_journey_created"
];

export const PUBLIC_TELEMETRY_EVENT_NAMES = TELEMETRY_EVENT_NAMES.filter(
  (eventName) => eventName !== "contact_journey_created"
);

export const CONTACT_INTENT_EVENT_NAMES = [
  "phone_clicked",
  "email_clicked",
  "messenger_clicked"
];

export const SIGNIFICANT_JOURNEY_EVENT_NAMES = [
  "page_viewed",
  "service_card_opened",
  "case_card_opened",
  "gallery_opened",
  "cta_clicked",
  ...CONTACT_INTENT_EVENT_NAMES
];

export const EVENT_CATEGORY_BY_NAME = Object.freeze({
  page_viewed: "interest",
  page_engagement_recorded: "engagement",
  service_card_opened: "interest",
  case_card_opened: "interest",
  gallery_opened: "interest",
  cta_clicked: "engagement",
  phone_clicked: "contact_intent",
  email_clicked: "contact_intent",
  messenger_clicked: "contact_intent",
  contact_journey_created: "system"
});

export const CONTACT_CHANNELS = [
  "phone",
  "email",
  "telegram",
  "whatsapp",
  "messenger",
  "viber",
  "vk",
  "max"
];

export const DEFAULT_CONTACT_CHANNEL_BY_EVENT = Object.freeze({
  phone_clicked: "phone",
  email_clicked: "email"
});

export const EVENT_NAME_SET = new Set(TELEMETRY_EVENT_NAMES);
export const PUBLIC_EVENT_NAME_SET = new Set(PUBLIC_TELEMETRY_EVENT_NAMES);
export const CONTACT_INTENT_EVENT_NAME_SET = new Set(CONTACT_INTENT_EVENT_NAMES);
export const SIGNIFICANT_JOURNEY_EVENT_NAME_SET = new Set(SIGNIFICANT_JOURNEY_EVENT_NAMES);
export const CONTACT_CHANNEL_SET = new Set(CONTACT_CHANNELS);

export function isContactIntentEvent(eventName) {
  return CONTACT_INTENT_EVENT_NAME_SET.has(eventName);
}

export function isSignificantJourneyEvent(eventName) {
  return SIGNIFICANT_JOURNEY_EVENT_NAME_SET.has(eventName);
}

export function getEventCategory(eventName) {
  return EVENT_CATEGORY_BY_NAME[eventName] || "unknown";
}
