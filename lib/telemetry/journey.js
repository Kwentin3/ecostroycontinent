import {
  CONTACT_INTENT_EVENT_NAME_SET,
  SIGNIFICANT_JOURNEY_EVENT_NAME_SET,
  isContactIntentEvent
} from "./events.js";
import {
  getSessionEngagementSummary,
  listPreviousSignificantEventsForSession,
  recordTelemetryContactJourney
} from "./repository.js";

export const CONTACT_JOURNEY_MAX_LENGTH = 12;
export const REPEATED_CLICK_COLLAPSE_WINDOW_MS = 3000;

const JOURNEY_METADATA_KEYS = [
  "analytics_id",
  "section_id",
  "target_type",
  "target_id",
  "target_path",
  "label",
  "cta_kind",
  "destination_kind",
  "gallery_id",
  "card_action"
];

function timestampMs(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function eventSignature(event) {
  const metadata = event.metadata || {};

  return [
    event.event_name,
    event.page_path,
    event.entity_type || "",
    event.entity_id || "",
    event.entity_slug || "",
    event.placement || "",
    event.contact_channel || "",
    metadata.target_type || "",
    metadata.target_id || "",
    metadata.target_path || "",
    metadata.destination_kind || ""
  ].join("|");
}

function normalizeJourneyMetadata(metadata = {}) {
  return JOURNEY_METADATA_KEYS.reduce((acc, key) => {
    const value = metadata?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      acc[key] = String(value).slice(0, 180);
    }

    return acc;
  }, {});
}

function toJourneyEvent(event) {
  return {
    event_name: event.event_name,
    event_category: event.event_category,
    occurred_at: new Date(event.occurred_at).toISOString(),
    page_path: event.page_path,
    entity_type: event.entity_type || null,
    entity_id: event.entity_id || null,
    entity_slug: event.entity_slug || null,
    placement: event.placement || null,
    contact_channel: event.contact_channel || null,
    active_time_ms: event.active_time_ms ?? null,
    max_scroll_depth: event.max_scroll_depth ?? null,
    metadata: normalizeJourneyMetadata(event.metadata || {})
  };
}

export function collapseRepeatedSignificantEvents(events, {
  collapseWindowMs = REPEATED_CLICK_COLLAPSE_WINDOW_MS
} = {}) {
  const collapsed = [];

  for (const event of events) {
    if (!SIGNIFICANT_JOURNEY_EVENT_NAME_SET.has(event.event_name)) {
      continue;
    }

    const previous = collapsed.at(-1);

    if (
      previous
      && eventSignature(previous) === eventSignature(event)
      && Math.abs(timestampMs(event.occurred_at) - timestampMs(previous.occurred_at)) <= collapseWindowMs
    ) {
      collapsed[collapsed.length - 1] = event;
      continue;
    }

    collapsed.push(event);
  }

  return collapsed;
}

export function buildContactJourneySnapshot({
  finalEvent,
  previousEvents = [],
  engagementSummary = {},
  maxLength = CONTACT_JOURNEY_MAX_LENGTH
}) {
  if (!CONTACT_INTENT_EVENT_SET_HAS(finalEvent?.event_name)) {
    return null;
  }

  const significantEvents = collapseRepeatedSignificantEvents([
    ...previousEvents,
    finalEvent
  ]);
  const selectedEvents = significantEvents.slice(-maxLength);
  const journeyEvents = selectedEvents.map(toJourneyEvent);
  const landingEvent = selectedEvents.find((event) => event.event_name === "page_viewed")
    || selectedEvents[0]
    || finalEvent;

  return {
    session_id: finalEvent.session_id,
    final_contact_event_id: finalEvent.id,
    final_contact_event_name: finalEvent.event_name,
    contact_channel: finalEvent.contact_channel,
    landing_page_path: landingEvent.page_path,
    final_page_path: finalEvent.page_path,
    final_entity_type: finalEvent.entity_type || null,
    final_entity_id: finalEvent.entity_id || null,
    previous_significant_events: journeyEvents,
    total_active_time_ms: engagementSummary.total_active_time_ms || 0,
    max_scroll_depth: engagementSummary.max_scroll_depth || finalEvent.max_scroll_depth || 0,
    is_internal: Boolean(finalEvent.is_internal),
    is_test: Boolean(finalEvent.is_test)
  };
}

function CONTACT_INTENT_EVENT_SET_HAS(eventName) {
  return CONTACT_INTENT_EVENT_NAME_SET.has(eventName);
}

export async function createContactJourneyIfNeeded(finalEvent, { db, repository = {} } = {}) {
  if (!isContactIntentEvent(finalEvent?.event_name)) {
    return null;
  }

  const listPrevious = repository.listPreviousSignificantEventsForSession
    || listPreviousSignificantEventsForSession;
  const getEngagement = repository.getSessionEngagementSummary
    || getSessionEngagementSummary;
  const recordJourney = repository.recordTelemetryContactJourney
    || recordTelemetryContactJourney;

  const previousEvents = await listPrevious({
    db,
    sessionId: finalEvent.session_id,
    excludeEventId: finalEvent.id
  });
  const engagementSummary = await getEngagement({
    db,
    sessionId: finalEvent.session_id,
    finalEventId: finalEvent.id
  });
  const journey = buildContactJourneySnapshot({
    finalEvent,
    previousEvents,
    engagementSummary
  });

  if (!journey) {
    return null;
  }

  return recordJourney(journey, { db });
}
