const METRICA_COUNTER_ID_PATTERN = /^\d+$/;

export const METRICA_GOALS = Object.freeze([
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "form_start",
  "form_submit",
  "cta_click",
  "contact_link_click",
  "gallery_open",
  "faq_expand",
  "case_card_click",
  "service_link_click"
]);

export const DEFAULT_METRICA_INIT_OPTIONS = Object.freeze({
  clickmap: false,
  webvisor: false,
  ecommerce: false,
  trackLinks: false,
  accurateTrackBounce: false
});

const CONTACT_DESTINATION_KINDS = new Set([
  "phone",
  "tel",
  "call",
  "email",
  "mailto",
  "messenger",
  "telegram",
  "whatsapp",
  "viber",
  "vk",
  "max"
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidMetricaCounterId(counterId) {
  return METRICA_COUNTER_ID_PATTERN.test(String(counterId || "").trim());
}

export function normalizeMetricaPublicConfig(config = {}) {
  const counterId = String(config.counterId || "").trim();
  const enabled = Boolean(config.enabled) && isValidMetricaCounterId(counterId);
  const trackingAllowed = config.trackingAllowed !== false;

  return {
    enabled: enabled && trackingAllowed,
    configured: enabled,
    trackingAllowed,
    counterId: isValidMetricaCounterId(counterId) ? counterId : "",
    initOptions: {
      ...DEFAULT_METRICA_INIT_OPTIONS,
      ...(config.initOptions && typeof config.initOptions === "object" ? config.initOptions : {})
    }
  };
}

export function resolveMetricaGoalForTelemetryEvent(event = {}) {
  const eventName = normalizeString(event.event_name);
  const contactChannel = normalizeString(event.contact_channel);
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : {};
  const destinationKind = normalizeString(metadata.destination_kind);

  if (event.is_internal || event.is_test) {
    return null;
  }

  if (eventName === "phone_clicked" && contactChannel === "phone") {
    return "click_to_call";
  }

  if (eventName === "messenger_clicked" && contactChannel === "telegram") {
    return "click_to_telegram";
  }

  if (eventName === "messenger_clicked" && contactChannel === "whatsapp") {
    return "click_to_whatsapp";
  }

  if (eventName === "cta_clicked" && !CONTACT_DESTINATION_KINDS.has(destinationKind)) {
    return "cta_click";
  }

  if (eventName === "gallery_opened") {
    return "gallery_open";
  }

  if (eventName === "case_card_opened") {
    return "case_card_click";
  }

  if (eventName === "service_card_opened") {
    return "service_link_click";
  }

  return null;
}
