import {
  ATTRIBUTION_SAFETY_VALUES,
  CHANGE_SCOPES,
  CHANGE_TYPES
} from "./constants.js";

const TRACKING_CHANGE_WINDOW_DAYS = 7;
const MIN_AFTER_PERIOD_DAYS = 7;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function addChange(bucket, { scope, type, field }) {
  bucket.scopes.add(CHANGE_SCOPES.includes(scope) ? scope : "unknown");
  bucket.types.add(CHANGE_TYPES.includes(type) ? type : "unknown");

  if (field) {
    bucket.fields.add(field);
  }
}

function compareSeo(previous, next, bucket) {
  const previousSeo = asObject(previous.seo);
  const nextSeo = asObject(next.seo);

  if (!sameJson(previousSeo.metaTitle, nextSeo.metaTitle)) {
    addChange(bucket, { scope: "seo_metadata", type: "title_changed", field: "seo.metaTitle" });
  }

  if (!sameJson(previousSeo.metaDescription, nextSeo.metaDescription)) {
    addChange(bucket, { scope: "seo_metadata", type: "description_changed", field: "seo.metaDescription" });
  }

  if (!sameJson(previousSeo.canonicalIntent, nextSeo.canonicalIntent)) {
    addChange(bucket, { scope: "routing_slug", type: "canonical_changed", field: "seo.canonicalIntent" });
  }

  if (!sameJson(previousSeo.schemaMarkup, nextSeo.schemaMarkup)) {
    addChange(bucket, { scope: "schema_markup", type: "schema_markup_changed", field: "seo.schemaMarkup" });
  }
}

function compareSections(previous, next, bucket) {
  const previousSections = asArray(previous.sections);
  const nextSections = asArray(next.sections);

  if (!sameJson(previousSections, nextSections)) {
    const previousFaq = previousSections.filter((section) => section.type === "faq").length;
    const nextFaq = nextSections.filter((section) => section.type === "faq").length;
    const previousCta = previousSections.filter((section) => section.type === "cta" || section.type === "cta_block");
    const nextCta = nextSections.filter((section) => section.type === "cta" || section.type === "cta_block");

    if (nextFaq > previousFaq) {
      addChange(bucket, { scope: "faq", type: "faq_added", field: "sections.faq" });
    } else if (nextFaq !== previousFaq) {
      addChange(bucket, { scope: "faq", type: "faq_changed", field: "sections.faq" });
    }

    if (!sameJson(previousCta, nextCta)) {
      addChange(bucket, { scope: "cta", type: "cta_text_changed", field: "sections.cta" });
    }

    if (previousSections.length !== nextSections.length) {
      addChange(bucket, { scope: "layout", type: "layout_changed", field: "sections" });
    }
  }
}

function comparePayload(previous, next) {
  const bucket = {
    scopes: new Set(),
    types: new Set(),
    fields: new Set()
  };

  compareSeo(previous, next, bucket);
  compareSections(previous, next, bucket);

  if (!sameJson(previous.slug, next.slug)) {
    addChange(bucket, { scope: "routing_slug", type: "slug_changed", field: "slug" });
  }

  if (!sameJson(previous.h1, next.h1)) {
    addChange(bucket, { scope: "h1_hero", type: "h1_changed", field: "h1" });
  }

  if (!sameJson(previous.summary, next.summary) || !sameJson(previous.intro, next.intro)) {
    addChange(bucket, { scope: "hero_copy", type: "hero_copy_changed", field: previous.summary !== next.summary ? "summary" : "intro" });
  }

  if (!sameJson(previous.ctaVariant, next.ctaVariant) || !sameJson(previous.defaultBlockCtaLabel, next.defaultBlockCtaLabel)) {
    addChange(bucket, { scope: "cta", type: "cta_text_changed", field: previous.ctaVariant !== next.ctaVariant ? "ctaVariant" : "defaultBlockCtaLabel" });
  }

  if (!sameJson(previous.relatedCaseIds, next.relatedCaseIds) || !sameJson(previous.serviceIds, next.serviceIds)) {
    const previousCount = asArray(previous.relatedCaseIds).length + asArray(previous.serviceIds).length;
    const nextCount = asArray(next.relatedCaseIds).length + asArray(next.serviceIds).length;
    addChange(bucket, {
      scope: "proof_path",
      type: nextCount >= previousCount ? "proof_case_added" : "proof_case_removed",
      field: asArray(next.relatedCaseIds).length !== asArray(previous.relatedCaseIds).length ? "relatedCaseIds" : "serviceIds"
    });
  }

  const previousGalleryCount = asArray(previous.galleryIds).length + asArray(previous.sourceRefs?.galleryIds).length;
  const nextGalleryCount = asArray(next.galleryIds).length + asArray(next.sourceRefs?.galleryIds).length;

  if (previousGalleryCount !== nextGalleryCount) {
    addChange(bucket, {
      scope: "media_gallery",
      type: nextGalleryCount > previousGalleryCount ? "gallery_added" : "gallery_changed",
      field: "galleryIds"
    });
  } else if (!sameJson(previous.galleryIds, next.galleryIds) || !sameJson(previous.sourceRefs?.galleryIds, next.sourceRefs?.galleryIds)) {
    addChange(bucket, { scope: "media_gallery", type: "gallery_changed", field: "galleryIds" });
  }

  if (!sameJson(previous.primaryPhone, next.primaryPhone)) {
    addChange(bucket, { scope: "contact_block", type: "phone_changed", field: "primaryPhone" });
  }

  if (!sameJson(previous.activeMessengers, next.activeMessengers)) {
    const previousCount = asArray(previous.activeMessengers).length;
    const nextCount = asArray(next.activeMessengers).length;
    addChange(bucket, {
      scope: "contact_block",
      type: nextCount >= previousCount ? "messenger_added" : "messenger_removed",
      field: "activeMessengers"
    });
  }

  if (!sameJson(previous.publicEmail, next.publicEmail)) {
    addChange(bucket, { scope: "contact_block", type: "contact_channel_changed", field: "publicEmail" });
  }

  if (!sameJson(previous.blocks, next.blocks)) {
    addChange(bucket, { scope: "layout", type: "layout_changed", field: "blocks" });
  }

  if (bucket.types.size === 0) {
    addChange(bucket, { scope: "unknown", type: "unknown", field: "" });
  }

  return {
    changed_scopes: [...bucket.scopes],
    change_types: [...bucket.types],
    changed_fields: [...bucket.fields]
  };
}

function daysBetween(left, right) {
  const leftTime = left instanceof Date ? left.getTime() : new Date(left).getTime();
  const rightTime = right instanceof Date ? right.getTime() : new Date(right).getTime();

  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(rightTime - leftTime) / (24 * 60 * 60 * 1000);
}

function hasTrackingChangeNearby({ publishedAt, trackingChanges = [] }) {
  return trackingChanges.some((item) => {
    const changedAt = item.changed_at || item.changedAt;
    return changedAt && daysBetween(publishedAt, changedAt) <= TRACKING_CHANGE_WINDOW_DAYS;
  });
}

export function resolveAttributionSafety({
  isMixedChange,
  publishedAt,
  now = new Date(),
  trackingChanges = [],
  sourceFreshnessContext = {},
  leadDomainAvailable = false,
  hasKnownChange = true
}) {
  if (!hasKnownChange) {
    return {
      attribution_safety: "not_attributable",
      attribution_limitations: ["Тип изменения не определён, эффект нельзя связывать с конкретным изменением."]
    };
  }

  if (hasTrackingChangeNearby({ publishedAt, trackingChanges })) {
    return {
      attribution_safety: "tracking_changed_nearby",
      attribution_limitations: ["Рядом с публикацией менялся трекинг, динамику событий нужно интерпретировать осторожно."]
    };
  }

  if (daysBetween(publishedAt, now) < MIN_AFTER_PERIOD_DAYS) {
    return {
      attribution_safety: "insufficient_after_period",
      attribution_limitations: ["После публикации прошло меньше 7 дней, данных для after-периода недостаточно."]
    };
  }

  if (Object.values(sourceFreshnessContext || {}).some((item) => item === "stale")) {
    return {
      attribution_safety: "source_stale",
      attribution_limitations: ["Один из источников устарел, вывод ограничен свежестью данных."]
    };
  }

  if (Object.values(sourceFreshnessContext || {}).some((item) => item === "missing" || item === "not_configured")) {
    return {
      attribution_safety: "source_missing",
      attribution_limitations: ["Один из источников отсутствует, нельзя делать полный before/after вывод."]
    };
  }

  if (!leadDomainAvailable) {
    return {
      attribution_safety: isMixedChange ? "mixed_change" : "clean_single_change",
      attribution_limitations: ["Lead domain не готов: можно анализировать только контактные действия, не лиды."]
    };
  }

  if (isMixedChange) {
    return {
      attribution_safety: "mixed_change",
      attribution_limitations: ["В одной публикации изменилось несколько значимых областей, single-cause attribution запрещён."]
    };
  }

  return {
    attribution_safety: "clean_single_change",
    attribution_limitations: ["Можно осторожно сравнивать before/after, но причинность автоматически не доказана."]
  };
}

export function buildMonitoringWindow(publishedAt, periodDays = 14) {
  const published = new Date(publishedAt);
  const beforeEnd = new Date(published.getTime() - 24 * 60 * 60 * 1000);
  const beforeStart = new Date(beforeEnd.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
  const afterStart = published;
  const afterEnd = new Date(published.getTime() + (periodDays - 1) * 24 * 60 * 60 * 1000);

  return {
    before_period: {
      start: beforeStart.toISOString().slice(0, 10),
      end: beforeEnd.toISOString().slice(0, 10),
      length_days: periodDays
    },
    after_period: {
      start: afterStart.toISOString().slice(0, 10),
      end: afterEnd.toISOString().slice(0, 10),
      length_days: periodDays
    }
  };
}

export function classifyContentChange({
  entityType,
  entityId,
  previousRevision = null,
  newRevision,
  trackingChanges = [],
  sourceFreshnessContext = {},
  leadDomainAvailable = false,
  now = new Date()
}) {
  const previousPayload = asObject(previousRevision?.payload);
  const nextPayload = asObject(newRevision?.payload);
  const publishedAt = newRevision?.published_at || newRevision?.publishedAt || newRevision?.created_at || new Date().toISOString();
  const comparison = previousRevision
    ? comparePayload(previousPayload, nextPayload)
    : {
        changed_scopes: ["unknown"],
        change_types: ["unknown"],
        changed_fields: []
      };
  const hasKnownChange = !comparison.change_types.includes("unknown") || comparison.change_types.length > 1;
  const isMixedChange = comparison.changed_scopes.filter((scope) => scope !== "unknown").length > 1;
  const safety = resolveAttributionSafety({
    isMixedChange,
    publishedAt,
    now,
    trackingChanges,
    sourceFreshnessContext,
    leadDomainAvailable,
    hasKnownChange
  });
  const windows = buildMonitoringWindow(publishedAt);
  const dataSufficiency = safety.attribution_safety === "insufficient_after_period" ? "insufficient" : "unknown";
  const monitoringStatus = safety.attribution_safety === "insufficient_after_period" ? "collecting" : "ready_for_review";

  return {
    classified_change_id: `classified_${newRevision?.id || entityId || "unknown"}`,
    entity_type: entityType,
    entity_id: entityId,
    previous_revision_id: previousRevision?.id || null,
    new_revision_id: newRevision?.id || null,
    published_at: new Date(publishedAt).toISOString(),
    changed_scopes: comparison.changed_scopes,
    changed_fields: comparison.changed_fields,
    change_types: comparison.change_types,
    change_summary: comparison.change_types.includes("unknown")
      ? "Тип изменения не определён безопасно."
      : `Изменены области: ${comparison.changed_scopes.join(", ")}.`,
    related_recommendation_id: null,
    is_mixed_change: isMixedChange,
    mixed_change_warning: isMixedChange
      ? "В публикации изменилось несколько областей. Нельзя выделять влияние одного элемента."
      : "",
    attribution_safety: ATTRIBUTION_SAFETY_VALUES.includes(safety.attribution_safety)
      ? safety.attribution_safety
      : "unknown",
    attribution_limitations: safety.attribution_limitations,
    monitoring_status: monitoringStatus,
    ...windows,
    data_sufficiency: dataSufficiency,
    tracking_context: {
      tracking_recently_changed: safety.attribution_safety === "tracking_changed_nearby",
      nearby_changes: trackingChanges.slice(0, 5)
    },
    source_freshness_context: sourceFreshnessContext,
    evidence_item_ids: []
  };
}

export function phraseAttributionSafety(value) {
  switch (value) {
    case "clean_single_change":
      return "После одиночного изменения можно смотреть before/after как сигнал, но без автоматического вывода о причинности.";
    case "mixed_change":
      return "После набора изменений нельзя выделять влияние одного элемента.";
    case "tracking_changed_nearby":
      return "Рядом менялся трекинг, динамику событий нужно интерпретировать осторожно.";
    case "insufficient_after_period":
      return "Данных после публикации пока недостаточно, нужен период мониторинга.";
    case "source_stale":
      return "Источник устарел, вывод ограничен свежестью данных.";
    case "source_missing":
      return "Источник отсутствует, before/after неполный.";
    case "lead_domain_missing":
      return "Lead domain не готов, лиды не анализируются.";
    case "not_attributable":
      return "Можно показывать наблюдение, но не эффект изменения.";
    default:
      return "Недостаточно данных для уверенной интерпретации.";
  }
}
