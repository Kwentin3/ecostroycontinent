import {
  CONTACT_ACTION_EVENT_TYPES,
  INTENT_EVENT_TYPES,
  PRIMARY_INTENT_EVENT_TYPES
} from "./constants.js";

const INTENT_SET = new Set(INTENT_EVENT_TYPES);
const PRIMARY_INTENT_SET = new Set(PRIMARY_INTENT_EVENT_TYPES);
const CONTACT_ACTION_SET = new Set(CONTACT_ACTION_EVENT_TYPES);

function keyForEvent(event) {
  return [
    event.date,
    event.page_path || "/",
    event.entity_type || "",
    event.entity_id || "",
    event.source || "unknown",
    event.medium || "unknown",
    event.campaign || "",
    event.device_type || "unknown",
    event.event_type,
    event.element_id || ""
  ].join("|");
}

function datePart(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toScrollDepthBucket(metadata = {}) {
  const explicit = Number(metadata.scroll_depth || 0);
  const bucket = String(metadata.scroll_depth_bucket || "");

  if (bucket.includes("100") || explicit >= 100) {
    return "100";
  }

  if (bucket.includes("75") || explicit >= 75) {
    return "75";
  }

  if (bucket.includes("50") || explicit >= 50) {
    return "50";
  }

  if (bucket.includes("25") || explicit >= 25) {
    return "25";
  }

  return "";
}

function emptyAggregate(event) {
  return {
    date: event.date,
    page_path: event.page_path || "/",
    entity_type: event.entity_type || null,
    entity_id: event.entity_id || null,
    source: event.source || "unknown",
    medium: event.medium || "unknown",
    campaign: event.campaign || "",
    device_type: event.device_type || "unknown",
    event_type: event.event_type,
    element_id: event.element_id || "",
    visits: 0,
    users: new Set(),
    page_views: 0,
    intent_events: 0,
    primary_intent_events: 0,
    contact_actions: 0,
    cta_views: 0,
    cta_clicks: 0,
    phone_clicks: 0,
    messenger_clicks: 0,
    form_starts: 0,
    form_submits: 0,
    gallery_opens: 0,
    faq_expands: 0,
    case_clicks: 0,
    service_link_clicks: 0,
    scroll_depth_25: 0,
    scroll_depth_50: 0,
    scroll_depth_75: 0,
    scroll_depth_100: 0,
    session_ids: new Set()
  };
}

function addEventToAggregate(aggregate, event) {
  aggregate.users.add(event.anonymous_id);

  if (event.event_type === "page_view") {
    aggregate.page_views += 1;
    aggregate.session_ids.add(event.session_id);
  }

  if (INTENT_SET.has(event.event_type)) {
    aggregate.intent_events += 1;
  }

  if (PRIMARY_INTENT_SET.has(event.event_type)) {
    aggregate.primary_intent_events += 1;
  }

  if (CONTACT_ACTION_SET.has(event.event_type)) {
    aggregate.contact_actions += 1;
  }

  switch (event.event_type) {
    case "cta_view":
      aggregate.cta_views += 1;
      break;
    case "cta_click":
      aggregate.cta_clicks += 1;
      break;
    case "click_to_call":
      aggregate.phone_clicks += 1;
      break;
    case "click_to_telegram":
    case "click_to_whatsapp":
      aggregate.messenger_clicks += 1;
      break;
    case "form_start":
      aggregate.form_starts += 1;
      break;
    case "form_submit":
      aggregate.form_submits += 1;
      break;
    case "gallery_open":
      aggregate.gallery_opens += 1;
      break;
    case "faq_expand":
      aggregate.faq_expands += 1;
      break;
    case "case_card_click":
      aggregate.case_clicks += 1;
      break;
    case "service_link_click":
      aggregate.service_link_clicks += 1;
      break;
    case "scroll_depth": {
      const bucket = toScrollDepthBucket(event.metadata || {});
      if (bucket) {
        aggregate[`scroll_depth_${bucket}`] += 1;
      }
      break;
    }
    default:
      break;
  }
}

export function summarizeAnalyticsEvents(events = []) {
  const grouped = new Map();

  for (const event of events) {
    if (event.is_excluded) {
      continue;
    }

    const normalized = {
      ...event,
      date: event.date || datePart(event.occurred_at || event.timestamp || new Date()),
      metadata: event.metadata || {}
    };
    const key = keyForEvent(normalized);

    if (!grouped.has(key)) {
      grouped.set(key, emptyAggregate(normalized));
    }

    addEventToAggregate(grouped.get(key), normalized);
  }

  return [...grouped.values()].map((item) => ({
    ...item,
    users: item.users.size,
    visits: item.session_ids.size,
    session_ids: undefined
  }));
}

export async function aggregateDailyAnalyticsEvents({ date, db }) {
  if (!db?.query) {
    throw new Error("db query handle is required for analytics aggregation.");
  }

  await db.query("DELETE FROM analytics_page_daily WHERE date = $1", [date]);
  await db.query(
    `
      INSERT INTO analytics_page_daily (
        date,
        page_path,
        entity_type,
        entity_id,
        source,
        medium,
        campaign,
        device_type,
        event_type,
        element_id,
        visits,
        users,
        page_views,
        intent_events,
        primary_intent_events,
        contact_actions,
        cta_views,
        cta_clicks,
        phone_clicks,
        messenger_clicks,
        form_starts,
        form_submits,
        gallery_opens,
        faq_expands,
        case_clicks,
        service_link_clicks,
        scroll_depth_25,
        scroll_depth_50,
        scroll_depth_75,
        scroll_depth_100,
        updated_at
      )
      SELECT
        $1::date AS date,
        page_path,
        entity_type,
        entity_id,
        source,
        medium,
        campaign,
        device_type,
        event_type,
        COALESCE(element_id, '') AS element_id,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view')::integer AS visits,
        COUNT(DISTINCT anonymous_id)::integer AS users,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::integer AS page_views,
        COUNT(*) FILTER (WHERE event_type IN (
          'cta_click',
          'click_to_call',
          'click_to_telegram',
          'click_to_whatsapp',
          'contact_link_click',
          'form_start',
          'form_submit',
          'gallery_open',
          'faq_expand',
          'case_card_click',
          'service_link_click'
        ))::integer AS intent_events,
        COUNT(*) FILTER (WHERE event_type IN (
          'click_to_call',
          'click_to_telegram',
          'click_to_whatsapp',
          'contact_link_click',
          'form_submit'
        ))::integer AS primary_intent_events,
        COUNT(*) FILTER (WHERE event_type IN (
          'click_to_call',
          'click_to_telegram',
          'click_to_whatsapp',
          'contact_link_click',
          'form_submit'
        ))::integer AS contact_actions,
        COUNT(*) FILTER (WHERE event_type = 'cta_view')::integer AS cta_views,
        COUNT(*) FILTER (WHERE event_type = 'cta_click')::integer AS cta_clicks,
        COUNT(*) FILTER (WHERE event_type = 'click_to_call')::integer AS phone_clicks,
        COUNT(*) FILTER (WHERE event_type IN ('click_to_telegram', 'click_to_whatsapp'))::integer AS messenger_clicks,
        COUNT(*) FILTER (WHERE event_type = 'form_start')::integer AS form_starts,
        COUNT(*) FILTER (WHERE event_type = 'form_submit')::integer AS form_submits,
        COUNT(*) FILTER (WHERE event_type = 'gallery_open')::integer AS gallery_opens,
        COUNT(*) FILTER (WHERE event_type = 'faq_expand')::integer AS faq_expands,
        COUNT(*) FILTER (WHERE event_type = 'case_card_click')::integer AS case_clicks,
        COUNT(*) FILTER (WHERE event_type = 'service_link_click')::integer AS service_link_clicks,
        COUNT(*) FILTER (WHERE event_type = 'scroll_depth' AND NULLIF(regexp_replace(COALESCE(metadata->>'scroll_depth', ''), '[^0-9]', '', 'g'), '')::integer >= 25)::integer AS scroll_depth_25,
        COUNT(*) FILTER (WHERE event_type = 'scroll_depth' AND NULLIF(regexp_replace(COALESCE(metadata->>'scroll_depth', ''), '[^0-9]', '', 'g'), '')::integer >= 50)::integer AS scroll_depth_50,
        COUNT(*) FILTER (WHERE event_type = 'scroll_depth' AND NULLIF(regexp_replace(COALESCE(metadata->>'scroll_depth', ''), '[^0-9]', '', 'g'), '')::integer >= 75)::integer AS scroll_depth_75,
        COUNT(*) FILTER (WHERE event_type = 'scroll_depth' AND NULLIF(regexp_replace(COALESCE(metadata->>'scroll_depth', ''), '[^0-9]', '', 'g'), '')::integer >= 100)::integer AS scroll_depth_100,
        NOW() AS updated_at
      FROM analytics_event
      WHERE is_excluded = FALSE
        AND occurred_at >= $1::date
        AND occurred_at < ($1::date + INTERVAL '1 day')
      GROUP BY page_path, entity_type, entity_id, source, medium, campaign, device_type, event_type, COALESCE(element_id, '')
    `,
    [date]
  );
}
