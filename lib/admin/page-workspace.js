import { DEFAULT_LANDING_PAGE_THEME_KEY } from "../landing-composition/visual-semantics.js";
import {
  ENTITY_TYPES,
  PAGE_CREATE_MODES,
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "../content-core/content-types.js";
import { normalizeEntityInput } from "../content-core/pure.js";
import { normalizePageMediaSettings } from "../content-core/page-media.js";

const DEFAULT_SEO = Object.freeze({
  metaTitle: "",
  metaDescription: "",
  canonicalIntent: "",
  indexationFlag: "index",
  openGraphTitle: "",
  openGraphDescription: "",
  openGraphImageAssetId: ""
});

const DEFAULT_SOURCE_REFS = Object.freeze({
  primaryServiceId: "",
  primaryEquipmentId: "",
  caseIds: [],
  galleryIds: []
});

const DEFAULT_TARGETING = Object.freeze({
  geoLabel: "",
  city: "",
  district: "",
  serviceArea: ""
});

export const PAGE_WORKSPACE_COMPOSITION_FIELDS = Object.freeze([
  "title",
  "h1",
  "intro",
  "primaryMediaAssetId",
  "mediaSettings",
  "sourceRefs",
  "targeting",
  "sections"
]);

export const PAGE_WORKSPACE_METADATA_FIELDS = Object.freeze([
  "slug",
  "pageType",
  "pageThemeKey",
  "seo"
]);

export const PAGE_TYPE_LABELS = Object.freeze({
  [PAGE_TYPES.ABOUT]: "О нас",
  [PAGE_TYPES.CONTACTS]: "Контакты",
  [PAGE_TYPES.SERVICE_LANDING]: "Страница услуги",
  [PAGE_TYPES.EQUIPMENT_LANDING]: "Страница техники"
});

export const PAGE_CREATE_MODE_LABELS = Object.freeze({
  [PAGE_CREATE_MODES.STANDALONE]: "Отдельная страница",
  [PAGE_CREATE_MODES.FROM_SERVICE]: "Из услуги",
  [PAGE_CREATE_MODES.FROM_EQUIPMENT]: "Из техники",
  [PAGE_CREATE_MODES.CLONE_ADAPT]: "Копия с адаптацией"
});

export const PAGE_SECTION_LABELS = Object.freeze({
  [PAGE_SECTION_TYPES.HERO_OFFER]: "Первый экран",
  [PAGE_SECTION_TYPES.RICH_TEXT]: "Основной текст",
  [PAGE_SECTION_TYPES.CONTACT_DETAILS]: "Контакты",
  [PAGE_SECTION_TYPES.SERVICE_SCOPE]: "Состав услуги",
  [PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY]: "О технике",
  [PAGE_SECTION_TYPES.EQUIPMENT_SPECS]: "Характеристики",
  [PAGE_SECTION_TYPES.GEO_COVERAGE]: "География",
  [PAGE_SECTION_TYPES.PROOF_CASES]: "Кейсы и доказательства",
  [PAGE_SECTION_TYPES.CTA]: "Призыв к действию"
});

function normalizeSeoState(seo = {}) {
  return {
    ...DEFAULT_SEO,
    ...(seo && typeof seo === "object" ? seo : {})
  };
}

function toList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toSourceRefs(value = {}) {
  return {
    ...DEFAULT_SOURCE_REFS,
    ...(value && typeof value === "object" ? value : {}),
    caseIds: toList(value?.caseIds),
    galleryIds: toList(value?.galleryIds)
  };
}

function toTargeting(value = {}) {
  return {
    ...DEFAULT_TARGETING,
    ...(value && typeof value === "object" ? value : {})
  };
}

function normalizeSection(section = {}, index = 0) {
  const order = Number.isInteger(section?.order) ? section.order : index;

  switch (section.type) {
    case PAGE_SECTION_TYPES.HERO_OFFER:
      return {
        type: section.type,
        order,
        title: section.title || "",
        body: section.body || "",
        ctaLabel: section.ctaLabel || "",
        trustText: section.trustText || ""
      };
    case PAGE_SECTION_TYPES.RICH_TEXT:
    case PAGE_SECTION_TYPES.CONTACT_DETAILS:
    case PAGE_SECTION_TYPES.SERVICE_SCOPE:
    case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
    case PAGE_SECTION_TYPES.GEO_COVERAGE:
      return {
        type: section.type,
        order,
        title: section.title || "",
        body: section.body || ""
      };
    case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
      return {
        type: section.type,
        order,
        title: section.title || "",
        items: toList(section.items)
      };
    case PAGE_SECTION_TYPES.PROOF_CASES:
      return {
        type: section.type,
        order,
        title: section.title || "",
        caseIds: toList(section.caseIds),
        galleryIds: toList(section.galleryIds)
      };
    case PAGE_SECTION_TYPES.CTA:
      return {
        type: section.type,
        order,
        title: section.title || "",
        body: section.body || "",
        ctaLabel: section.ctaLabel || ""
      };
    default:
      return null;
  }
}

function deriveLegacySectionsFromBlocks(payload = {}, pageType = PAGE_TYPES.ABOUT) {
  const blocks = Array.isArray(payload?.blocks) ? payload.blocks.filter((block) => block && typeof block === "object") : [];
  const heroBlock = blocks.find((block) => block.type === "hero");
  const richTextBlock = blocks.find((block) => block.type === "rich_text");
  const contactBlock = blocks.find((block) => block.type === "contact");
  const serviceListBlock = blocks.find((block) => block.type === "service_list");
  const caseListBlock = blocks.find((block) => block.type === "case_list");
  const galleryBlock = blocks.find((block) => block.type === "gallery");
  const ctaBlock = blocks.find((block) => block.type === "cta");
  const defaults = buildDefaultSectionsForPageType(pageType);

  return defaults.map((section, index) => {
    switch (section.type) {
      case PAGE_SECTION_TYPES.HERO_OFFER:
        return normalizeSection({
          ...section,
          order: index,
          title: heroBlock?.title || payload?.title || section.title,
          body: heroBlock?.body || payload?.intro || section.body,
          ctaLabel: heroBlock?.ctaLabel || section.ctaLabel,
          trustText: heroBlock?.trustText || section.trustText
        }, index);
      case PAGE_SECTION_TYPES.RICH_TEXT:
        return normalizeSection({
          ...section,
          order: index,
          body: richTextBlock?.body || payload?.body || section.body
        }, index);
      case PAGE_SECTION_TYPES.CONTACT_DETAILS:
        return normalizeSection({
          ...section,
          order: index,
          body: contactBlock?.body || payload?.contactNote || section.body
        }, index);
      case PAGE_SECTION_TYPES.SERVICE_SCOPE:
        return normalizeSection({
          ...section,
          order: index,
          body: richTextBlock?.body || payload?.body || section.body
        }, index);
      case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
        return normalizeSection({
          ...section,
          order: index,
          body: richTextBlock?.body || payload?.body || section.body
        }, index);
      case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
        return normalizeSection({
          ...section,
          order: index,
          items: Array.isArray(payload?.equipmentSpecs) ? payload.equipmentSpecs.filter(Boolean) : section.items
        }, index);
      case PAGE_SECTION_TYPES.PROOF_CASES:
        return normalizeSection({
          ...section,
          order: index,
          caseIds: Array.isArray(caseListBlock?.caseIds) ? caseListBlock.caseIds.filter(Boolean) : section.caseIds,
          galleryIds: Array.isArray(galleryBlock?.galleryIds) ? galleryBlock.galleryIds.filter(Boolean) : section.galleryIds
        }, index);
      case PAGE_SECTION_TYPES.CTA:
        return normalizeSection({
          ...section,
          order: index,
          title: ctaBlock?.title || payload?.ctaTitle || section.title,
          body: ctaBlock?.body || payload?.ctaBody || section.body,
          ctaLabel: ctaBlock?.ctaLabel || payload?.defaultBlockCtaLabel || section.ctaLabel
        }, index);
      case PAGE_SECTION_TYPES.GEO_COVERAGE:
      default:
        return normalizeSection({
          ...section,
          order: index
        }, index);
    }
  }).filter(Boolean);
}

export function getRequiredSectionTypes(pageType = PAGE_TYPES.ABOUT) {
  switch (pageType) {
    case PAGE_TYPES.CONTACTS:
      return [
        PAGE_SECTION_TYPES.HERO_OFFER,
        PAGE_SECTION_TYPES.RICH_TEXT,
        PAGE_SECTION_TYPES.CONTACT_DETAILS,
        PAGE_SECTION_TYPES.GEO_COVERAGE
      ];
    case PAGE_TYPES.SERVICE_LANDING:
      return [
        PAGE_SECTION_TYPES.HERO_OFFER,
        PAGE_SECTION_TYPES.SERVICE_SCOPE,
        PAGE_SECTION_TYPES.GEO_COVERAGE,
        PAGE_SECTION_TYPES.PROOF_CASES,
        PAGE_SECTION_TYPES.CTA
      ];
    case PAGE_TYPES.EQUIPMENT_LANDING:
      return [
        PAGE_SECTION_TYPES.HERO_OFFER,
        PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY,
        PAGE_SECTION_TYPES.EQUIPMENT_SPECS,
        PAGE_SECTION_TYPES.GEO_COVERAGE,
        PAGE_SECTION_TYPES.PROOF_CASES,
        PAGE_SECTION_TYPES.CTA
      ];
    case PAGE_TYPES.ABOUT:
    default:
      return [
        PAGE_SECTION_TYPES.HERO_OFFER,
        PAGE_SECTION_TYPES.RICH_TEXT,
        PAGE_SECTION_TYPES.PROOF_CASES,
        PAGE_SECTION_TYPES.CTA
      ];
  }
}

export function buildDefaultSectionsForPageType(pageType = PAGE_TYPES.ABOUT) {
  return getRequiredSectionTypes(pageType).map((type, index) => {
    switch (type) {
      case PAGE_SECTION_TYPES.PROOF_CASES:
        return { type, order: index, title: PAGE_SECTION_LABELS[type], caseIds: [], galleryIds: [] };
      case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
        return { type, order: index, title: PAGE_SECTION_LABELS[type], items: [] };
      case PAGE_SECTION_TYPES.CTA:
        return { type, order: index, title: "Оставьте заявку", body: "", ctaLabel: "Оставить заявку" };
      case PAGE_SECTION_TYPES.HERO_OFFER:
        return { type, order: index, title: "", body: "", ctaLabel: "", trustText: "" };
      default:
        return { type, order: index, title: PAGE_SECTION_LABELS[type], body: "" };
    }
  });
}

function readSectionPayloads(payload = {}, pageType = PAGE_TYPES.ABOUT) {
  const sections = Array.isArray(payload.sections) && payload.sections.length > 0
    ? payload.sections.map((section, index) => normalizeSection(section, index)).filter(Boolean)
    : deriveLegacySectionsFromBlocks(payload, pageType);

  return sections.sort((left, right) => left.order - right.order);
}

function normalizeSectionsForType(pageType = PAGE_TYPES.ABOUT, sections = []) {
  const normalized = Array.isArray(sections)
    ? sections.map((section, index) => normalizeSection(section, index)).filter(Boolean)
    : [];
  const byType = new Map();

  for (const section of normalized) {
    if (!byType.has(section.type)) {
      byType.set(section.type, section);
    }
  }

  for (const fallbackSection of buildDefaultSectionsForPageType(pageType)) {
    if (!byType.has(fallbackSection.type)) {
      byType.set(fallbackSection.type, fallbackSection);
    }
  }

  return Array.from(byType.values()).map((section, index) => ({
    ...section,
    order: index
  }));
}

function getSection(sections = [], type) {
  return sections.find((section) => section.type === type) || null;
}

export function buildPageWorkspaceBaseValue(revision = null) {
  const payload = revision?.payload && typeof revision.payload === "object" ? revision.payload : {};
  const pageType = payload?.pageType || PAGE_TYPES.ABOUT;
  const legacyBlocks = Array.isArray(payload?.blocks) ? payload.blocks.filter((block) => block && typeof block === "object") : [];
  const serviceListBlock = legacyBlocks.find((block) => block.type === "service_list");
  const caseListBlock = legacyBlocks.find((block) => block.type === "case_list");
  const galleryBlock = legacyBlocks.find((block) => block.type === "gallery");
  const sourceRefs = toSourceRefs({
    ...payload?.sourceRefs,
    primaryServiceId: payload?.sourceRefs?.primaryServiceId || serviceListBlock?.serviceIds?.[0] || "",
    caseIds: payload?.sourceRefs?.caseIds || caseListBlock?.caseIds || [],
    galleryIds: payload?.sourceRefs?.galleryIds || galleryBlock?.galleryIds || []
  });
  const targeting = toTargeting(payload?.targeting);
  const sections = readSectionPayloads(payload, pageType);
  const proofSection = getSection(sections, PAGE_SECTION_TYPES.PROOF_CASES);
  const ctaSection = getSection(sections, PAGE_SECTION_TYPES.CTA);
  const contactSection = getSection(sections, PAGE_SECTION_TYPES.CONTACT_DETAILS);
  const richTextSection = getSection(sections, PAGE_SECTION_TYPES.RICH_TEXT);
  const serviceScopeSection = getSection(sections, PAGE_SECTION_TYPES.SERVICE_SCOPE);
  const equipmentSummarySection = getSection(sections, PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY);
  const equipmentSpecsSection = getSection(sections, PAGE_SECTION_TYPES.EQUIPMENT_SPECS);

  return {
    pageType,
    slug: payload?.slug || (pageType === PAGE_TYPES.CONTACTS ? "contacts" : pageType === PAGE_TYPES.ABOUT ? "about" : ""),
    pageThemeKey: payload?.pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY,
    title: payload?.title || "",
    h1: payload?.h1 || "",
    intro: payload?.intro || "",
    primaryMediaAssetId: payload?.primaryMediaAssetId || "",
    mediaSettings: normalizePageMediaSettings(payload?.mediaSettings),
    sourceRefs,
    targeting,
    sections,
    body: richTextSection?.body || serviceScopeSection?.body || equipmentSummarySection?.body || "",
    contactNote: contactSection?.body || "",
    ctaTitle: ctaSection?.title || "",
    ctaBody: ctaSection?.body || "",
    defaultBlockCtaLabel: ctaSection?.ctaLabel || "",
    serviceIds: sourceRefs.primaryServiceId ? [sourceRefs.primaryServiceId] : [],
    caseIds: toList(proofSection?.caseIds || sourceRefs.caseIds),
    galleryIds: toList(proofSection?.galleryIds || sourceRefs.galleryIds),
    equipmentSpecs: toList(equipmentSpecsSection?.items),
    seo: normalizeSeoState(payload?.seo)
  };
}

export function buildPageWorkspaceCompositionState(value = {}) {
  return {
    title: value.title || "",
    h1: value.h1 || "",
    intro: value.intro || "",
    primaryMediaAssetId: value.primaryMediaAssetId || "",
    mediaSettings: normalizePageMediaSettings(value.mediaSettings),
    sourceRefs: toSourceRefs(value.sourceRefs),
    targeting: toTargeting(value.targeting),
    sections: readSectionPayloads(value, value.pageType || PAGE_TYPES.ABOUT),
    body: value.body || "",
    contactNote: value.contactNote || "",
    ctaTitle: value.ctaTitle || "",
    ctaBody: value.ctaBody || "",
    defaultBlockCtaLabel: value.defaultBlockCtaLabel || "",
    equipmentSpecs: toList(value.equipmentSpecs)
  };
}

export function buildPageWorkspaceMetadataState(value = {}) {
  const pageType = value.pageType || PAGE_TYPES.ABOUT;

  return {
    slug: value.slug || (pageType === PAGE_TYPES.CONTACTS ? "contacts" : pageType === PAGE_TYPES.ABOUT ? "about" : ""),
    pageType,
    pageThemeKey: value.pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY,
    seo: normalizeSeoState(value.seo)
  };
}

export function mergePageWorkspaceState({ baseValue = {}, composition = {}, metadata = {} } = {}) {
  const nextMetadata = buildPageWorkspaceMetadataState({
    ...buildPageWorkspaceMetadataState(baseValue),
    ...metadata,
    seo: {
      ...normalizeSeoState(baseValue.seo),
      ...normalizeSeoState(metadata.seo)
    }
  });
  const nextComposition = buildPageWorkspaceCompositionState({
    ...baseValue,
    ...composition,
    pageType: nextMetadata.pageType
  });
  const nextSections = normalizeSectionsForType(nextMetadata.pageType, nextComposition.sections).map((section) => {
    switch (section.type) {
      case PAGE_SECTION_TYPES.RICH_TEXT:
        return {
          ...section,
          body: nextComposition.body || section.body || ""
        };
      case PAGE_SECTION_TYPES.CONTACT_DETAILS:
        return {
          ...section,
          body: nextComposition.contactNote || section.body || ""
        };
      case PAGE_SECTION_TYPES.SERVICE_SCOPE:
        return {
          ...section,
          body: nextComposition.body || section.body || ""
        };
      case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
        return {
          ...section,
          body: nextComposition.body || section.body || ""
        };
      case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
        return {
          ...section,
          items: nextComposition.equipmentSpecs?.length ? nextComposition.equipmentSpecs : section.items || []
        };
      case PAGE_SECTION_TYPES.CTA:
        return {
          ...section,
          title: nextComposition.ctaTitle || section.title || "Оставьте заявку",
          body: nextComposition.ctaBody || section.body || "",
          ctaLabel: nextComposition.defaultBlockCtaLabel || section.ctaLabel || "Оставить заявку"
        };
      case PAGE_SECTION_TYPES.PROOF_CASES:
        return {
          ...section,
          caseIds: nextComposition.sourceRefs.caseIds,
          galleryIds: nextComposition.sourceRefs.galleryIds
        };
      default:
        return section;
    }
  });

  return {
    ...baseValue,
    ...nextComposition,
    sections: nextSections,
    ...nextMetadata,
    seo: normalizeSeoState(nextMetadata.seo)
  };
}

export function buildPageWorkspacePreviewPayload({ baseValue = {}, composition = {}, metadata = {} } = {}) {
  const merged = mergePageWorkspaceState({ baseValue, composition, metadata });

  if (!String(merged?.title || "").trim() || !String(merged?.h1 || "").trim()) {
    return null;
  }

  try {
    return normalizeEntityInput(ENTITY_TYPES.PAGE, {
      ...merged,
      ...merged.seo
    });
  } catch {
    return null;
  }
}

export function buildPageWorkspaceFullInput({ baseValue = {}, composition = {}, metadata = {} } = {}) {
  return mergePageWorkspaceState({ baseValue, composition, metadata });
}

export function buildPageWorkspaceLookupResolvers(records = {}) {
  const resolveRecord = (mapLike, id) => {
    if (!id || !mapLike) {
      return null;
    }

    if (typeof mapLike.get === "function") {
      return mapLike.get(id) ?? null;
    }

    return mapLike[id] ?? null;
  };

  return {
    services: (id) => resolveRecord(records.serviceMap ?? records.services, id),
    equipment: (id) => resolveRecord(records.equipmentMap ?? records.equipment, id),
    cases: (id) => resolveRecord(records.caseMap ?? records.cases, id),
    galleries: (id) => resolveRecord(records.galleryMap ?? records.galleries, id),
    media: (id) => resolveRecord(records.mediaMap ?? records.media, id)
  };
}

export function buildPageWorkspaceEmptyState(value = {}) {
  const sourceRefs = toSourceRefs(value.sourceRefs);

  return {
    isEmptyWorkspace: !String(value?.title || "").trim() || !String(value?.h1 || "").trim(),
    titleReady: Boolean(String(value?.title || "").trim()),
    h1Ready: Boolean(String(value?.h1 || "").trim()),
    introReady: Boolean(String(value?.intro || "").trim()),
    sourceCount: [
      sourceRefs.primaryServiceId,
      sourceRefs.primaryEquipmentId,
      ...sourceRefs.caseIds,
      ...sourceRefs.galleryIds
    ].filter(Boolean).length,
    mediaReady: Boolean(String(value?.primaryMediaAssetId || "").trim())
  };
}

export function buildPageWorkspaceLifecycleState({ aggregate = null, permissions = {} } = {}) {
  const revisions = Array.isArray(aggregate?.revisions) ? aggregate.revisions : [];
  const hasLivePublishedRevision = Boolean(aggregate?.entity?.activePublishedRevisionId);
  const hasPublishedHistory = revisions.some((revision) => revision?.state === "published");
  const hasReviewRevision = revisions.some((revision) => revision?.state === "review");

  return {
    hasLivePublishedRevision,
    hasPublishedHistory,
    hasReviewRevision,
    canArchive: Boolean(permissions.canArchive) && hasLivePublishedRevision,
    canDelete: Boolean(permissions.canDelete) && !hasLivePublishedRevision && !hasPublishedHistory && !hasReviewRevision
  };
}

export function buildPageWorkspaceAiActionModel({ aiAction = "rewrite_selected", selectedTarget = "hero", pageType = PAGE_TYPES.ABOUT } = {}) {
  const ctaLabel = pageType === PAGE_TYPES.CONTACTS ? "Контакты" : "Призыв к действию";

  switch (aiAction) {
    case "strengthen_cta":
      return {
        aiAction,
        target: "cta",
        label: `Усилить блок «${ctaLabel}»`,
        hint: "AI предлагает только текстовую правку выбранного блока.",
        progressLabel: "AI готовит новую формулировку призыва."
      };
    case "compact_wording":
      return {
        aiAction,
        target: "page_copy",
        label: "Сделать текст компактнее",
        hint: "AI не меняет маршруты, источники и метаданные.",
        progressLabel: "AI сокращает текст страницы."
      };
    case "suggest_connective_copy":
      return {
        aiAction,
        target: "connective_copy",
        label: "Предложить связующий текст",
        hint: "AI работает только с серединой страницы.",
        progressLabel: "AI подбирает связующий текст."
      };
    case "rewrite_selected":
    default:
      return {
        aiAction: "rewrite_selected",
        target: selectedTarget,
        label: "Переписать выбранную зону",
        hint: "AI вернет только ограниченный патч для явного применения.",
        progressLabel: "AI переписывает выбранную зону."
      };
  }
}

export function getPageCardPreviewUrl(primaryMediaAssetId = "") {
  return primaryMediaAssetId ? `/api/admin/media/${primaryMediaAssetId}/preview` : "";
}

export function buildAiActionIntent({ actionType = "", target = "", pageLabel = "" } = {}) {
  if (actionType === "strengthen_cta") {
    return `Усиль блок CTA на странице ${pageLabel}.`;
  }

  if (actionType === "suggest_connective_copy") {
    return `Предложи связующий текст для страницы ${pageLabel}.`;
  }

  if (actionType === "compact_wording") {
    return `Сделай текст страницы ${pageLabel} компактнее и яснее.`;
  }

  return `Перепиши зону ${target} на странице ${pageLabel}.`;
}

export function extractPageWorkspaceAiPatch({ target = "", candidatePayload = {} } = {}) {
  const draft = buildPageWorkspaceBaseValue({
    payload: candidatePayload
  });

  if (target === "hero") {
    return {
      title: draft.title,
      h1: draft.h1,
      intro: draft.intro
    };
  }

  if (target === "cta") {
    const ctaSection = draft.sections.find((section) => section.type === PAGE_SECTION_TYPES.CTA);
    const contactSection = draft.sections.find((section) => section.type === PAGE_SECTION_TYPES.CONTACT_DETAILS);

    if (contactSection && !ctaSection) {
      return {
        contactNote: contactSection.body || ""
      };
    }

    return {
      ctaTitle: ctaSection?.title || "",
      ctaBody: ctaSection?.body || "",
      defaultBlockCtaLabel: ctaSection?.ctaLabel || ""
    };
  }

  if (target === "connective_copy") {
    return {
      body: draft.body || ""
    };
  }

  return {
    title: draft.title,
    h1: draft.h1,
    intro: draft.intro,
    body: draft.body || "",
    contactNote: draft.contactNote || "",
    ctaTitle: draft.ctaTitle || "",
    ctaBody: draft.ctaBody || "",
    defaultBlockCtaLabel: draft.defaultBlockCtaLabel || ""
  };
}
