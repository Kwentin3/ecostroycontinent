import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import {
  listPublishedEntities,
  listRevisionsForEntity
} from "../content-core/repository.js";
import { classifyContentChange, phraseAttributionSafety } from "./content-change.js";
import {
  SOURCE_LABELS,
  SOURCE_SYSTEMS,
  TRAFFIC_SOURCE_ORDER
} from "./constants.js";
import { detectIssuesForPage, issueToPageSignals } from "./issues.js";
import {
  listAnalyticsPageDaily,
  listExternalSearchVisibility,
  listPersistedClassifiedContentChanges,
  listRecommendationStates,
  listSourceSyncStates,
  listTrackingChangeHistory,
  listUnmappedUrlDiagnostics
} from "./repository.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function shiftDate(value, days) {
  return new Date(new Date(value).getTime() + days * DAY_MS);
}

function buildPeriods({ periodDays, now }) {
  const end = new Date(now);
  const currentEnd = isoDate(end);
  const currentStart = isoDate(shiftDate(end, -(periodDays - 1)));
  const previousEnd = isoDate(shiftDate(currentStart, -1));
  const previousStart = isoDate(shiftDate(currentStart, -periodDays));

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      length_days: periodDays
    },
    previous: {
      start: previousStart,
      end: previousEnd,
      length_days: periodDays
    }
  };
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${(value * 100).toFixed(value < 0.01 && value > 0 ? 2 : 1)}%`;
}

function delta(current, previous) {
  if (!previous) {
    return current ? 1 : 0;
  }

  return (current - previous) / previous;
}

function metric(value, previousValue, explanation, nextAction = "") {
  const change = delta(number(value), number(previousValue));

  return {
    value,
    comparison_value: previousValue,
    delta_vs_previous_period: change,
    signal: change > 0.05 ? "up" : change < -0.05 ? "down" : "flat",
    explanation,
    next_action: nextAction
  };
}

function emptySourceState(sourceSystem) {
  if (sourceSystem === "lead_domain") {
    return {
      source_system: sourceSystem,
      status: "not_ready",
      last_successful_at: null,
      last_attempted_at: null,
      imported_period_start: null,
      imported_period_end: null,
      safe_error_message: "Lead domain пока не готов. Конверсия считается по контактным действиям.",
      unmapped_url_count: 0,
      rows_imported: 0
    };
  }

  if (sourceSystem === "content_core") {
    return {
      source_system: sourceSystem,
      status: "ok",
      last_successful_at: null,
      last_attempted_at: null,
      imported_period_start: null,
      imported_period_end: null,
      safe_error_message: "",
      unmapped_url_count: 0,
      rows_imported: 0
    };
  }

  if (sourceSystem === "first_party_events") {
    return {
      source_system: sourceSystem,
      status: "ok",
      last_successful_at: null,
      last_attempted_at: null,
      imported_period_start: null,
      imported_period_end: null,
      safe_error_message: "",
      unmapped_url_count: 0,
      rows_imported: 0
    };
  }

  return {
    source_system: sourceSystem,
    status: "not_configured",
    last_successful_at: null,
    last_attempted_at: null,
    imported_period_start: null,
    imported_period_end: null,
    safe_error_message: "Источник не подключён.",
    unmapped_url_count: 0,
    rows_imported: 0
  };
}

function normalizeSourceStates(rows = []) {
  const bySource = new Map(SOURCE_SYSTEMS.map((source) => [source, emptySourceState(source)]));

  for (const row of rows) {
    bySource.set(row.source_system, {
      ...emptySourceState(row.source_system),
      source_system: row.source_system,
      status: row.status,
      last_successful_at: row.last_successful_at,
      last_attempted_at: row.last_attempted_at,
      imported_period_start: row.imported_period_start,
      imported_period_end: row.imported_period_end,
      safe_error_message: row.safe_error_message || "",
      unmapped_url_count: number(row.unmapped_url_count),
      rows_imported: number(row.rows_imported)
    });
  }

  return Object.fromEntries(bySource);
}

function sumRows(rows, field, filter = () => true) {
  return rows.filter(filter).reduce((total, row) => total + number(row[field]), 0);
}

function pagePathForRecord(record) {
  const payload = record.revision?.payload || record.payload || {};

  if (record.entityType === ENTITY_TYPES.SERVICE || record.entity_type === ENTITY_TYPES.SERVICE) {
    return `/services/${payload.slug || record.slug || record.entityId}`;
  }

  if (record.entityType === ENTITY_TYPES.CASE || record.entity_type === ENTITY_TYPES.CASE) {
    return `/cases/${payload.slug || record.slug || record.entityId}`;
  }

  if ((record.entityType || record.entity_type) === ENTITY_TYPES.PAGE) {
    if (payload.pageType === PAGE_TYPES.CONTACTS) {
      return "/contacts";
    }

    if (payload.pageType === PAGE_TYPES.ABOUT) {
      return "/about";
    }

    return payload.slug ? `/${payload.slug}` : `/page/${record.entityId}`;
  }

  return record.page_path || "/";
}

function titleForRecord(record) {
  const payload = record.revision?.payload || record.payload || {};
  return payload.title || payload.h1 || payload.publicBrandName || record.page_path || record.entityId;
}

function payloadFor(record) {
  return record.revision?.payload || record.payload || {};
}

function projectionForPublished(record) {
  const entityType = record.entityType || record.entity_type;
  const payload = payloadFor(record);

  return {
    page_path: pagePathForRecord(record),
    entity_type: entityType,
    entity_id: record.entityId || record.entity_id,
    page_title: titleForRecord(record),
    payload,
    current_published_revision: {
      revision_id: record.revision?.id || record.revision_id || null,
      revision_number: record.revision?.revisionNumber || record.revision_number || null,
      published_at: record.revision?.publishedAt || record.published_at || null
    },
    publish_status: "published"
  };
}

async function loadPublishedContent({ db, deps }) {
  if (deps.content) {
    return deps.content.map(projectionForPublished);
  }

  const listPublished = deps.listPublishedEntities || listPublishedEntities;
  const groups = await Promise.all([
    listPublished(ENTITY_TYPES.SERVICE, db),
    listPublished(ENTITY_TYPES.CASE, db),
    listPublished(ENTITY_TYPES.PAGE, db)
  ]);

  return groups.flat().map(projectionForPublished);
}

function groupAggregatesByPage(rows = []) {
  const byPage = new Map();

  for (const row of rows) {
    const pagePath = row.page_path || "/";

    if (!byPage.has(pagePath)) {
      byPage.set(pagePath, []);
    }

    byPage.get(pagePath).push(row);
  }

  return byPage;
}

function groupSearchByPage(rows = []) {
  const byPage = new Map();

  for (const row of rows) {
    const pagePath = row.page_path || "/";

    if (!byPage.has(pagePath)) {
      byPage.set(pagePath, []);
    }

    byPage.get(pagePath).push(row);
  }

  return byPage;
}

function aggregatePageMetrics({ aggregateRows = [], searchRows = [] }) {
  const visits = sumRows(aggregateRows, "visits");
  const users = sumRows(aggregateRows, "users");
  const pageViews = sumRows(aggregateRows, "page_views");
  const contactActions = sumRows(aggregateRows, "contact_actions");
  const ctaViews = sumRows(aggregateRows, "cta_views");
  const ctaClicks = sumRows(aggregateRows, "cta_clicks");
  const galleryOpens = sumRows(aggregateRows, "gallery_opens");
  const faqExpands = sumRows(aggregateRows, "faq_expands");
  const formStarts = sumRows(aggregateRows, "form_starts");
  const formSubmits = sumRows(aggregateRows, "form_submits");
  const phoneClicks = sumRows(aggregateRows, "phone_clicks");
  const messengerClicks = sumRows(aggregateRows, "messenger_clicks");
  const mobileVisits = sumRows(aggregateRows, "visits", (row) => row.device_type === "mobile");
  const yandexRows = searchRows.filter((row) => row.search_engine === "yandex" || row.source_system === "yandex_webmaster");
  const impressions = sumRows(yandexRows.length ? yandexRows : searchRows, "impressions");
  const clicks = sumRows(yandexRows.length ? yandexRows : searchRows, "clicks");

  return {
    impressions,
    clicks,
    ctr: impressions ? clicks / impressions : 0,
    visits,
    users,
    page_views: pageViews,
    contact_actions: contactActions,
    conversion_rate: visits ? contactActions / visits : 0,
    mobile_share: visits ? mobileVisits / visits : 0,
    cta_views: ctaViews,
    cta_clicks: ctaClicks,
    gallery_opens: galleryOpens,
    faq_expands: faqExpands,
    form_start: formStarts,
    form_submit: formSubmits,
    click_to_call: phoneClicks,
    click_to_telegram: sumRows(aggregateRows, "messenger_clicks", (row) => row.event_type === "click_to_telegram"),
    click_to_whatsapp: sumRows(aggregateRows, "messenger_clicks", (row) => row.event_type === "click_to_whatsapp"),
    messenger_clicks: messengerClicks
  };
}

function proofPathForPage(page) {
  const payload = page.payload || {};
  const hasCase = Array.isArray(payload.relatedCaseIds)
    ? payload.relatedCaseIds.length > 0
    : Array.isArray(payload.serviceIds)
      ? payload.serviceIds.length > 0
      : Array.isArray(payload.sourceRefs?.caseIds) && payload.sourceRefs.caseIds.length > 0;
  const hasGallery = Array.isArray(payload.galleryIds)
    ? payload.galleryIds.length > 0
    : Array.isArray(payload.sourceRefs?.galleryIds) && payload.sourceRefs.galleryIds.length > 0;
  const hasFaq = Array.isArray(payload.sections)
    ? payload.sections.some((section) => section.type === "faq")
    : Array.isArray(payload.blocks) && payload.blocks.some((block) => block.type === "faq");
  const hasCta = Boolean(payload.ctaVariant || payload.defaultBlockCtaLabel)
    || (Array.isArray(payload.blocks) && payload.blocks.some((block) => block.type === "cta"))
    || (Array.isArray(payload.sections) && payload.sections.some((section) => section.type === "cta"));

  return {
    has_case: hasCase,
    has_gallery: hasGallery,
    has_faq: hasFaq,
    has_cta: hasCta,
    has_reviews: false,
    summary: [
      hasCase ? "есть кейс" : "нет кейса",
      hasGallery ? "есть галерея" : "нет галереи",
      hasFaq ? "есть FAQ" : "нет FAQ",
      hasCta ? "есть CTA" : "нет CTA",
      "нет отзывов"
    ].join(" / ")
  };
}

function seoHealthForPage(page) {
  const seo = page.payload?.seo || {};

  return {
    title: seo.metaTitle || page.page_title,
    description: seo.metaDescription || "",
    h1: page.payload?.h1 || page.page_title,
    indexation_state: seo.indexationFlag === "noindex" ? "noindex" : "indexable",
    sitemap_state: "present",
    canonical_state: seo.canonicalIntent ? "ok" : "not_declared"
  };
}

function trafficSources({ rows = [], previousRows = [] }) {
  return TRAFFIC_SOURCE_ORDER.map((source) => {
    const sourceRows = rows.filter((row) => (row.source || "unknown") === source);
    const previousSourceRows = previousRows.filter((row) => (row.source || "unknown") === source);
    const visits = sumRows(sourceRows, "visits");
    const previousVisits = sumRows(previousSourceRows, "visits");
    const contactActions = sumRows(sourceRows, "contact_actions");

    return {
      source,
      label: SOURCE_LABELS[source] || source,
      visits,
      users: sumRows(sourceRows, "users"),
      contact_actions: contactActions,
      leads: {
        status: "unavailable",
        value: null,
        explanation: "Lead domain не готов."
      },
      conversion_rate: visits ? contactActions / visits : 0,
      delta_vs_previous_period: delta(visits, previousVisits),
      confidence: visits >= 50 ? "medium" : "low",
      notes: source === "organic_yandex" ? "Яндекс расположен первым как основной внешний поисковый контур." : ""
    };
  });
}

function buildSearchVisibility(rows = []) {
  return rows.map((row) => ({
    source_system: row.source_system,
    search_engine: row.search_engine,
    query: row.query || null,
    page_path: row.page_path,
    entity_type: row.entity_type || null,
    entity_id: row.entity_id || null,
    impressions: number(row.impressions),
    clicks: number(row.clicks),
    ctr: number(row.ctr),
    position: row.position === null || row.position === undefined ? null : number(row.position),
    device: row.device || "unknown",
    country: row.country || "",
    region: row.region || "",
    delta: null,
    opportunity_type: row.opportunity_type || "",
    confidence: row.confidence || "medium",
    limitations: row.limitations || ["Query data is aggregate signal only."]
  }));
}

function makeEvidence({ source, metricName, value, comparisonValue = null, period, sampleSize = 0, interpretation = "", linkedEntity = null, confidence = "medium", notes = "" }) {
  return {
    evidence_id: `evidence_${source}_${metricName}_${linkedEntity?.entity_id || linkedEntity?.page_path || "overview"}`.replace(/[^a-z0-9_]+/gi, "_").toLowerCase(),
    source,
    metric: metricName,
    value,
    comparison_value: comparisonValue,
    period,
    sample_size: sampleSize,
    freshness: "read_model_current",
    confidence,
    interpretation,
    linked_entity: linkedEntity,
    notes
  };
}

function semanticClickMapForPage({ page, aggregateRows = [] }) {
  const definitions = [
    { element_id: "hero_primary_call", event_type: "click_to_call", label: "Телефон в первом экране", section_id: "hero" },
    { element_id: "hero_primary_telegram", event_type: "click_to_telegram", label: "Telegram в первом экране", section_id: "hero" },
    { element_id: "hero_primary_whatsapp", event_type: "click_to_whatsapp", label: "WhatsApp в первом экране", section_id: "hero" },
    { element_id: "proof_gallery_open", event_type: "gallery_open", label: "Галерею открыли", section_id: "proof" },
    { element_id: "faq_expand", event_type: "faq_expand", label: "FAQ раскрыли", section_id: "faq" },
    { element_id: "related_case_click", event_type: "case_card_click", label: "Кейс открыли", section_id: "proof" },
    { element_id: "contact_form_start", event_type: "form_start", label: "Форму начали", section_id: "contacts" },
    { element_id: "contact_form_submit", event_type: "form_submit", label: "Форму отправили", section_id: "contacts" },
    { element_id: "contacts_link_click", event_type: "contact_link_click", label: "Перешли к контактам", section_id: "contacts" }
  ];
  const ctaViews = sumRows(aggregateRows, "cta_views");

  return definitions.map((definition) => {
    const matching = aggregateRows.filter((row) => {
      return row.event_type === definition.event_type
        && (!row.element_id || row.element_id === definition.element_id || row.element_id.includes(definition.element_id));
    });
    const actions = sumRows(matching, {
      click_to_call: "phone_clicks",
      click_to_telegram: "messenger_clicks",
      click_to_whatsapp: "messenger_clicks",
      gallery_open: "gallery_opens",
      faq_expand: "faq_expands",
      case_card_click: "case_clicks",
      form_start: "form_starts",
      form_submit: "form_submits",
      contact_link_click: "contact_actions"
    }[definition.event_type] || "intent_events");

    return {
      element_id: definition.element_id,
      event_type: definition.event_type,
      section_id: definition.section_id,
      label: definition.label,
      views: definition.event_type.startsWith("click") ? ctaViews : null,
      actions,
      conversion_to_next_step: ctaViews ? actions / ctaViews : null,
      drop_off_signal: ctaViews > 30 && actions <= 1 ? "strong_drop_off" : "not_enough_data",
      related_entity_type: page.entity_type,
      related_entity_id: page.entity_id,
      confidence: actions >= 20 || ctaViews >= 50 ? "medium" : "low"
    };
  });
}

function buildOverview({ currentRows, previousRows, searchRows, previousSearchRows, sourceStates }) {
  const visits = sumRows(currentRows, "visits");
  const previousVisits = sumRows(previousRows, "visits");
  const organicVisits = sumRows(currentRows, "visits", (row) => row.source === "organic_yandex" || row.source === "organic_google");
  const previousOrganicVisits = sumRows(previousRows, "visits", (row) => row.source === "organic_yandex" || row.source === "organic_google");
  const yandexRows = searchRows.filter((row) => row.search_engine === "yandex" || row.source_system === "yandex_webmaster");
  const previousYandexRows = previousSearchRows.filter((row) => row.search_engine === "yandex" || row.source_system === "yandex_webmaster");
  const yandexImpressions = sumRows(yandexRows, "impressions");
  const previousYandexImpressions = sumRows(previousYandexRows, "impressions");
  const yandexClicks = sumRows(yandexRows, "clicks");
  const previousYandexClicks = sumRows(previousYandexRows, "clicks");
  const contactActions = sumRows(currentRows, "contact_actions");
  const previousContactActions = sumRows(previousRows, "contact_actions");
  const ctr = yandexImpressions ? yandexClicks / yandexImpressions : 0;
  const previousCtr = previousYandexImpressions ? previousYandexClicks / previousYandexImpressions : 0;

  return {
    visits: metric(visits, previousVisits, "Визиты из first-party aggregates.", "Проверить страницы с трафиком без контактных действий."),
    organic_visits: metric(organicVisits, previousOrganicVisits, "Органический трафик по классификации источника.", "Смотреть страницы с поисковыми сигналами."),
    yandex_impressions: metric(yandexImpressions, previousYandexImpressions, sourceStates.yandex_webmaster.status === "not_configured" ? "Яндекс Вебмастер не подключён." : "Показы из Яндекс Вебмастера.", "Подключить или проверить Яндекс Вебмастер."),
    yandex_clicks: metric(yandexClicks, previousYandexClicks, sourceStates.yandex_webmaster.status === "not_configured" ? "Яндекс Вебмастер не подключён." : "Клики из Яндекса.", "Смотреть низкий CTR по страницам."),
    ctr: metric(ctr, previousCtr, yandexImpressions ? "CTR считается как клики / показы." : "Недостаточно данных по показам.", "Проверить title/description/H1 для страниц с низким CTR."),
    contact_actions: metric(contactActions, previousContactActions, "Контактные действия отделены от лидов.", "Проверить страницы с визитами без действий."),
    leads: {
      value: null,
      status: "unavailable",
      signal: "not_ready",
      explanation: "Lead domain не готов: лиды не считаются нулём.",
      next_action: "Сначала спроектировать lead/intake domain."
    },
    visit_to_intent_conversion: metric(visits ? contactActions / visits : 0, previousVisits ? previousContactActions / previousVisits : 0, "Конверсия визит -> контактное действие.", "Не смешивать с lead conversion."),
    visit_to_lead_conversion: {
      value: null,
      status: "unavailable",
      explanation: "Lead domain missing/not_ready."
    }
  };
}

function mergeRecommendationState(generatedRecommendations, persistedStates = []) {
  const byId = new Map(persistedStates.map((item) => [item.recommendation_id, item]));

  return generatedRecommendations.map((item) => {
    const persisted = byId.get(item.recommendation_id);

    if (!persisted) {
      return item;
    }

    return {
      ...item,
      status: persisted.status,
      owner_role: persisted.owner_role || item.owner_role,
      next_check_date: persisted.next_check_date,
      implemented_at: persisted.implemented_at,
      published_at: persisted.published_at,
      monitoring_started_at: persisted.monitoring_started_at,
      result_summary: persisted.result_summary,
      limitations: persisted.limitations?.length ? persisted.limitations : item.limitations
    };
  });
}

async function buildClassifiedChanges({ pages, trackingChanges, sourceStates, db, deps }) {
  const persisted = deps.classifiedContentChanges ?? await listPersistedClassifiedContentChanges({ limit: 30 }, db);

  if (persisted.length > 0) {
    return persisted.map((item) => ({
      ...item,
      attribution_safety_explanation: phraseAttributionSafety(item.attribution_safety)
    }));
  }

  const listRevisions = deps.listRevisionsForEntity || listRevisionsForEntity;
  const changes = [];

  for (const page of pages.slice(0, 12)) {
    if (!page.entity_id) {
      continue;
    }

    let revisions = [];

    try {
      revisions = await listRevisions(page.entity_id, db);
    } catch {
      revisions = [];
    }

    const published = revisions
      .filter((revision) => revision.publishedAt || revision.published_at || revision.state === "published")
      .sort((left, right) => new Date(right.publishedAt || right.published_at || right.createdAt || 0) - new Date(left.publishedAt || left.published_at || left.createdAt || 0));

    if (published.length === 0 && page.current_published_revision?.revision_id) {
      changes.push(classifyContentChange({
        entityType: page.entity_type,
        entityId: page.entity_id,
        previousRevision: null,
        newRevision: {
          id: page.current_published_revision.revision_id,
          payload: page.payload,
          publishedAt: page.current_published_revision.published_at
        },
        trackingChanges,
        sourceFreshnessContext: {
          first_party_events: sourceStates.first_party_events.status
        }
      }));
      continue;
    }

    if (published[0]) {
      changes.push(classifyContentChange({
        entityType: page.entity_type,
        entityId: page.entity_id,
        previousRevision: published[1] || null,
        newRevision: published[0],
        trackingChanges,
        sourceFreshnessContext: {
          first_party_events: sourceStates.first_party_events.status
        }
      }));
    }
  }

  return changes.map((item) => ({
    ...item,
    attribution_safety_explanation: phraseAttributionSafety(item.attribution_safety)
  }));
}

function buildHistory({ currentRows, previousRows, searchRows, previousSearchRows, classifiedChanges, trackingChanges, periods }) {
  const currentVisits = sumRows(currentRows, "visits");
  const previousVisits = sumRows(previousRows, "visits");
  const currentContactActions = sumRows(currentRows, "contact_actions");
  const previousContactActions = sumRows(previousRows, "contact_actions");
  const currentImpressions = sumRows(searchRows, "impressions");
  const previousImpressions = sumRows(previousSearchRows, "impressions");
  const currentClicks = sumRows(searchRows, "clicks");
  const previousClicks = sumRows(previousSearchRows, "clicks");
  const currentCtr = currentImpressions ? currentClicks / currentImpressions : 0;
  const previousCtr = previousImpressions ? previousClicks / previousImpressions : 0;

  return {
    current_period: periods.current,
    previous_period: periods.previous,
    baseline_period: null,
    metric_trends: {
      visibility: {
        impressions: { current: currentImpressions, previous: previousImpressions, delta: delta(currentImpressions, previousImpressions) },
        clicks: { current: currentClicks, previous: previousClicks, delta: delta(currentClicks, previousClicks) },
        ctr: { current: currentCtr, previous: previousCtr, delta: delta(currentCtr, previousCtr) }
      },
      traffic: {
        visits: { current: currentVisits, previous: previousVisits, delta: delta(currentVisits, previousVisits) },
        mobile_share: { current: null, previous: null, delta: null }
      },
      conversion: {
        contact_actions: { current: currentContactActions, previous: previousContactActions, delta: delta(currentContactActions, previousContactActions) },
        visit_to_intent: { current: currentVisits ? currentContactActions / currentVisits : 0, previous: previousVisits ? previousContactActions / previousVisits : 0, delta: null }
      },
      behavior: {
        cta_views: sumRows(currentRows, "cta_views"),
        cta_clicks: sumRows(currentRows, "cta_clicks"),
        gallery_opens: sumRows(currentRows, "gallery_opens"),
        faq_expands: sumRows(currentRows, "faq_expands"),
        scroll_depth: {
          25: sumRows(currentRows, "scroll_depth_25"),
          50: sumRows(currentRows, "scroll_depth_50"),
          75: sumRows(currentRows, "scroll_depth_75"),
          100: sumRows(currentRows, "scroll_depth_100")
        }
      }
    },
    published_changes: classifiedChanges,
    recommendation_history: [],
    tracking_changes: trackingChanges,
    source_sync_history: [],
    known_limitations: [
      "История агрегированная, raw events в read model не отдаются.",
      "Before/after не доказывает причинность автоматически."
    ]
  };
}

export async function buildSeoDashboardReadModel({
  periodDays = 28,
  selectedPagePath = "",
  now = new Date(),
  db = null,
  deps = {}
} = {}) {
  const periods = buildPeriods({ periodDays, now });
  const [
    sourceStateRows,
    currentRows,
    previousRows,
    searchRows,
    previousSearchRows,
    unmappedDiagnostics,
    recommendationStates,
    trackingChanges
  ] = await Promise.all([
    deps.sourceStates ?? listSourceSyncStates(db),
    deps.currentRows ?? listAnalyticsPageDaily({ startDate: periods.current.start, endDate: periods.current.end }, db),
    deps.previousRows ?? listAnalyticsPageDaily({ startDate: periods.previous.start, endDate: periods.previous.end }, db),
    deps.searchRows ?? listExternalSearchVisibility({ startDate: periods.current.start, endDate: periods.current.end }, db),
    deps.previousSearchRows ?? listExternalSearchVisibility({ startDate: periods.previous.start, endDate: periods.previous.end }, db),
    deps.unmappedDiagnostics ?? listUnmappedUrlDiagnostics({ limit: 20 }, db),
    deps.recommendationStates ?? listRecommendationStates(db),
    deps.trackingChanges ?? listTrackingChangeHistory({ limit: 30 }, db)
  ]);
  const sourceStates = normalizeSourceStates(sourceStateRows);
  const contentPages = await loadPublishedContent({ db, deps });
  const aggregateByPage = groupAggregatesByPage(currentRows);
  const searchByPage = groupSearchByPage(searchRows);
  const evidenceItems = [];
  const generatedRecommendations = [];
  const pageList = contentPages.map((page) => {
    const metrics = aggregatePageMetrics({
      aggregateRows: aggregateByPage.get(page.page_path) || [],
      searchRows: searchByPage.get(page.page_path) || []
    });
    const proof = proofPathForPage(page);
    const seoHealth = seoHealthForPage(page);
    const issues = detectIssuesForPage({
      ...page,
      metrics,
      proof_path_summary: proof,
      seo_health: seoHealth
    }, {
      sourceFreshnessStatus: sourceStates.yandex_webmaster.status === "ok" ? "ok" : "low"
    });
    const signals = issueToPageSignals(issues);

    generatedRecommendations.push(...issues);
    evidenceItems.push(makeEvidence({
      source: "first_party_events",
      metricName: "visits",
      value: metrics.visits,
      period: periods.current,
      sampleSize: metrics.visits,
      interpretation: metrics.visits > 0 ? "У страницы есть трафик." : "Трафика за период нет или данных мало.",
      linkedEntity: { page_path: page.page_path, entity_type: page.entity_type, entity_id: page.entity_id },
      confidence: metrics.visits >= 30 ? "medium" : "low"
    }));

    return {
      page_path: page.page_path,
      entity_type: page.entity_type,
      entity_id: page.entity_id,
      page_title: page.page_title,
      commercial_priority: page.entity_type === ENTITY_TYPES.SERVICE ? "high" : "medium",
      publish_status: page.publish_status,
      indexation_state: seoHealth.indexation_state,
      sitemap_state: seoHealth.sitemap_state,
      canonical_state: seoHealth.canonical_state,
      ...metrics,
      leads: {
        status: "unavailable",
        value: null,
        explanation: "Lead domain not_ready."
      },
      proof_path_summary: proof,
      seo_health: seoHealth,
      conversion_health: metrics.visits >= 50 && metrics.contact_actions <= 1 ? "needs_attention" : "monitor",
      proof_health: proof.has_case && proof.has_gallery && proof.has_cta ? "ok" : "weak",
      ...signals
    };
  });

  for (const diagnostic of unmappedDiagnostics) {
    const page = {
      page_path: diagnostic.page_path,
      entity_type: null,
      entity_id: null,
      page_title: diagnostic.page_path,
      period: periods.current
    };
    generatedRecommendations.push({
      recommendation_id: `rec_unmapped_${diagnostic.id || diagnostic.page_path.replace(/[^a-z0-9]+/gi, "_")}`,
      issue_type: "unmapped_analytics_url",
      label: "URL аналитики не сопоставлен",
      linked_page: page,
      priority: "high",
      severity: "high",
      evidence_period: periods.current,
      evidence_items: [],
      evidence: `${diagnostic.hit_count || 1} событий по несопоставленному URL.`,
      hypothesis: "Возможны старые адреса, query string или проблема canonical/redirect.",
      recommended_action: "Разобрать URL и сопоставить с сущностью сайта или редиректом.",
      owner_role: "seo_manager",
      status: "new",
      next_check_date: null,
      confidence: "medium",
      limitations: ["Это диагностический warning, не контентная рекомендация."]
    });
  }

  const recommendations = mergeRecommendationState(generatedRecommendations, recommendationStates)
    .sort((left, right) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[left.priority] ?? 9) - (order[right.priority] ?? 9);
    });
  const topOpportunities = recommendations.slice(0, 5);
  const selectedPage = pageList.find((page) => page.page_path === selectedPagePath)
    || pageList.find((page) => recommendations[0]?.linked_page?.page_path === page.page_path)
    || pageList[0]
    || null;
  const classifiedChanges = await buildClassifiedChanges({
    pages: contentPages,
    trackingChanges,
    sourceStates,
    db,
    deps
  });
  const selectedAggregateRows = selectedPage ? aggregateByPage.get(selectedPage.page_path) || [] : [];
  const selectedSearchRows = selectedPage ? searchByPage.get(selectedPage.page_path) || [] : [];
  const selectedMetrics = selectedPage ? aggregatePageMetrics({ aggregateRows: selectedAggregateRows, searchRows: selectedSearchRows }) : null;
  const selectedPageDetail = selectedPage ? {
    page_identity: {
      page_path: selectedPage.page_path,
      entity_type: selectedPage.entity_type,
      entity_id: selectedPage.entity_id,
      page_title: selectedPage.page_title
    },
    current_published_revision: contentPages.find((page) => page.page_path === selectedPage.page_path)?.current_published_revision || null,
    seo_fields_summary: selectedPage.seo_health,
    indexation_summary: {
      indexation_state: selectedPage.indexation_state,
      sitemap_state: selectedPage.sitemap_state,
      canonical_state: selectedPage.canonical_state
    },
    visibility_summary: {
      impressions: selectedMetrics.impressions,
      clicks: selectedMetrics.clicks,
      ctr: selectedMetrics.ctr
    },
    traffic_summary: {
      visits: selectedMetrics.visits,
      users: selectedMetrics.users,
      mobile_share: selectedMetrics.mobile_share
    },
    behavior_summary: {
      cta_views: selectedMetrics.cta_views,
      cta_clicks: selectedMetrics.cta_clicks,
      gallery_opens: selectedMetrics.gallery_opens,
      faq_expands: selectedMetrics.faq_expands
    },
    intent_events_summary: {
      click_to_call: selectedMetrics.click_to_call,
      click_to_telegram: selectedMetrics.click_to_telegram,
      click_to_whatsapp: selectedMetrics.click_to_whatsapp,
      form_start: selectedMetrics.form_start,
      form_submit: selectedMetrics.form_submit,
      contact_actions: selectedMetrics.contact_actions
    },
    lead_summary: {
      status: "unavailable",
      explanation: "Lead domain not_ready: лиды не считаются нулём."
    },
    proof_path: selectedPage.proof_path_summary,
    semantic_click_map: semanticClickMapForPage({ page: selectedPage, aggregateRows: selectedAggregateRows }),
    active_issues: recommendations.filter((item) => item.linked_page?.page_path === selectedPage.page_path),
    recommendation_history: [],
    published_change_history: classifiedChanges.filter((item) => item.entity_id === selectedPage.entity_id),
    before_after_summary: {
      attribution_safety: classifiedChanges.find((item) => item.entity_id === selectedPage.entity_id)?.attribution_safety || "unknown",
      explanation: phraseAttributionSafety(classifiedChanges.find((item) => item.entity_id === selectedPage.entity_id)?.attribution_safety || "unknown")
    },
    source_freshness: sourceStates,
    uncertainty_flags: [
      sourceStates.lead_domain.status === "not_ready" ? "lead_domain_missing" : null,
      sourceStates.google_search_console.status === "not_configured" ? "google_search_console_not_configured" : null
    ].filter(Boolean),
    limitations: [
      "Дашборд не делает causal claims.",
      "Semantic click map строится по агрегированным first-party событиям."
    ]
  } : null;
  const overview = buildOverview({
    currentRows,
    previousRows,
    searchRows,
    previousSearchRows,
    sourceStates
  });
  const warnings = [
    sourceStates.google_search_console.status === "not_configured"
      ? "Google Search Console не подключён."
      : null,
    sourceStates.lead_domain.status === "not_ready"
      ? "Данные по лидам пока недоступны. Конверсия считается по контактным действиям."
      : null,
    unmappedDiagnostics.length > 0
      ? `${unmappedDiagnostics.length} URL из аналитики не сопоставлены с сущностями сайта.`
      : null,
    ...Object.values(sourceStates)
      .filter((item) => item.status === "stale" || item.status === "failed")
      .map((item) => `${item.source_system}: ${item.status}. ${item.safe_error_message || ""}`.trim())
  ].filter(Boolean);

  return {
    version: "seo_dashboard_analytics_read_model.v0.1",
    generated_at: new Date(now).toISOString(),
    period: periods.current,
    comparison_period: periods.previous,
    timezone: "Europe/Moscow",
    data_freshness: sourceStates,
    sources: sourceStates,
    privacy_filters_applied: [
      "raw events excluded from read model",
      "form values rejected",
      "admin/bot/QA/preview traffic excluded from business aggregates",
      "secrets/tokens not included"
    ],
    excluded_traffic_policy: {
      default_business_metrics_exclude: ["admin_user", "bot_or_crawler", "preview_or_draft", "qa_traffic", "internal_route"],
      raw_events_exposed: false
    },
    contract_scope: "read_model_for_ui_llm_reports_exports",
    warnings,
    limitations: [
      "Analytics read model не является source of truth.",
      "Внешние источники показываются по source health; UI не ходит в API источников напрямую.",
      "Lead domain missing/not_ready не означает 0 лидов.",
      "Query data, если появится, является агрегатным сигналом."
    ],
    overview: {
      ...overview,
      top_opportunities: topOpportunities,
      top_losses: recommendations.filter((item) => item.issue_type === "low_ctr" || item.issue_type === "traffic_no_intent").slice(0, 5),
      top_recommendations: topOpportunities,
      data_warnings: warnings
    },
    traffic_sources: trafficSources({ rows: currentRows, previousRows }),
    search_visibility: buildSearchVisibility(searchRows),
    page_list: pageList,
    selected_page_detail: selectedPageDetail,
    semantic_click_map: selectedPageDetail?.semantic_click_map || [],
    recommendations,
    evidence_items: evidenceItems,
    analytics_history: buildHistory({
      currentRows,
      previousRows,
      searchRows,
      previousSearchRows,
      classifiedChanges,
      trackingChanges,
      periods
    }),
    published_change_history: classifiedChanges,
    classified_content_changes: classifiedChanges,
    tracking_change_history: trackingChanges,
    source_diagnostics: {
      states: sourceStates,
      unmapped_urls: unmappedDiagnostics,
      warning: unmappedDiagnostics.length
        ? "Есть несопоставленные URL. Возможны старые адреса, query string или проблема canonical/redirect."
        : ""
    }
  };
}
