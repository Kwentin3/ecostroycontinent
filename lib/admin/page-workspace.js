import { DEFAULT_LANDING_PAGE_THEME_KEY } from "../landing-composition/visual-semantics.js";
import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import { normalizeEntityInput } from "../content-core/pure.js";

const DEFAULT_SEO = Object.freeze({
  metaTitle: "",
  metaDescription: "",
  canonicalIntent: "",
  indexationFlag: "index",
  openGraphTitle: "",
  openGraphDescription: "",
  openGraphImageAssetId: ""
});

export const PAGE_WORKSPACE_COMPOSITION_FIELDS = Object.freeze([
  "title",
  "h1",
  "intro",
  "body",
  "contactNote",
  "ctaTitle",
  "ctaBody",
  "defaultBlockCtaLabel",
  "primaryMediaAssetId",
  "serviceIds",
  "caseIds",
  "galleryIds"
]);

export const PAGE_WORKSPACE_METADATA_FIELDS = Object.freeze([
  "slug",
  "pageType",
  "pageThemeKey",
  "seo"
]);

function normalizeSeoState(seo = {}) {
  return {
    ...DEFAULT_SEO,
    ...(seo && typeof seo === "object" ? seo : {})
  };
}

function toList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toPageBlocks(payload = {}) {
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  return blocks.filter((block) => block && typeof block === "object");
}

function readPageEditorValue(revision = null) {
  const payload = revision?.payload && typeof revision.payload === "object" ? revision.payload : {};
  const blocks = toPageBlocks(payload);
  const richTextBlock = blocks.find((block) => block.type === "rich_text");
  const serviceListBlock = blocks.find((block) => block.type === "service_list");
  const caseListBlock = blocks.find((block) => block.type === "case_list");
  const galleryBlock = blocks.find((block) => block.type === "gallery");
  const contactBlock = blocks.find((block) => block.type === "contact");
  const ctaBlock = blocks.find((block) => block.type === "cta");

  return {
    ...payload,
    body: richTextBlock?.body || "",
    serviceIds: serviceListBlock?.serviceIds || [],
    caseIds: caseListBlock?.caseIds || [],
    galleryIds: galleryBlock?.galleryIds || [],
    contactNote: contactBlock?.body || "",
    ctaTitle: ctaBlock?.title || "",
    ctaBody: ctaBlock?.body || "",
    defaultBlockCtaLabel: ctaBlock?.ctaLabel || ""
  };
}

function hasRequiredPageBasics(value = {}) {
  return Boolean(String(value?.title || "").trim()) && Boolean(String(value?.h1 || "").trim());
}

export function buildPageWorkspaceBaseValue(revision = null) {
  const value = readPageEditorValue(revision);
  const pageType = value?.pageType || PAGE_TYPES.ABOUT;

  return {
    pageType,
    slug: value?.slug || (pageType === PAGE_TYPES.CONTACTS ? "contacts" : "about"),
    pageThemeKey: value?.pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY,
    title: value?.title || "",
    h1: value?.h1 || "",
    intro: value?.intro || "",
    body: value?.body || "",
    contactNote: value?.contactNote || "",
    ctaTitle: value?.ctaTitle || "",
    ctaBody: value?.ctaBody || "",
    defaultBlockCtaLabel: value?.defaultBlockCtaLabel || "",
    primaryMediaAssetId: value?.primaryMediaAssetId || "",
    serviceIds: toList(value?.serviceIds),
    caseIds: toList(value?.caseIds),
    galleryIds: toList(value?.galleryIds),
    heroTextEmphasisPreset: value?.heroTextEmphasisPreset || "standard",
    heroSurfaceTone: value?.heroSurfaceTone || "plain",
    contentBandTextEmphasisPreset: value?.contentBandTextEmphasisPreset || "standard",
    contentBandSurfaceTone: value?.contentBandSurfaceTone || "plain",
    ctaTextEmphasisPreset: value?.ctaTextEmphasisPreset || "standard",
    ctaSurfaceTone: value?.ctaSurfaceTone || "plain",
    seo: normalizeSeoState(value?.seo)
  };
}

export function buildPageWorkspaceCompositionState(value = {}) {
  return {
    title: value.title || "",
    h1: value.h1 || "",
    intro: value.intro || "",
    body: value.body || "",
    contactNote: value.contactNote || "",
    ctaTitle: value.ctaTitle || "",
    ctaBody: value.ctaBody || "",
    defaultBlockCtaLabel: value.defaultBlockCtaLabel || "",
    primaryMediaAssetId: value.primaryMediaAssetId || "",
    serviceIds: toList(value.serviceIds),
    caseIds: toList(value.caseIds),
    galleryIds: toList(value.galleryIds)
  };
}

export function buildPageWorkspaceMetadataState(value = {}) {
  const pageType = value.pageType || PAGE_TYPES.ABOUT;

  return {
    slug: value.slug || (pageType === PAGE_TYPES.CONTACTS ? "contacts" : "about"),
    pageType,
    pageThemeKey: value.pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY,
    seo: normalizeSeoState(value.seo)
  };
}

export function mergePageWorkspaceState({ baseValue = {}, composition = {}, metadata = {} } = {}) {
  const normalizedBase = {
    ...baseValue,
    seo: normalizeSeoState(baseValue.seo)
  };
  const nextComposition = buildPageWorkspaceCompositionState({
    ...buildPageWorkspaceCompositionState(normalizedBase),
    ...composition
  });
  const nextMetadata = buildPageWorkspaceMetadataState({
    ...buildPageWorkspaceMetadataState(normalizedBase),
    ...metadata,
    seo: {
      ...normalizeSeoState(normalizedBase.seo),
      ...normalizeSeoState(metadata.seo)
    }
  });

  return {
    ...normalizedBase,
    ...nextComposition,
    ...nextMetadata,
    seo: normalizeSeoState(nextMetadata.seo)
  };
}

export function buildPageWorkspacePreviewPayload({ baseValue = {}, composition = {}, metadata = {} } = {}) {
  const merged = mergePageWorkspaceState({ baseValue, composition, metadata });

  if (!hasRequiredPageBasics(merged)) {
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
    cases: (id) => resolveRecord(records.caseMap ?? records.cases, id),
    galleries: (id) => resolveRecord(records.galleryMap ?? records.galleries, id),
    media: (id) => resolveRecord(records.mediaMap ?? records.media, id)
  };
}

export function buildPageWorkspaceEmptyState(value = {}) {
  const titleReady = Boolean(String(value?.title || "").trim());
  const h1Ready = Boolean(String(value?.h1 || "").trim());
  const introReady = Boolean(String(value?.intro || "").trim());
  const sourceCount = [
    ...(Array.isArray(value?.serviceIds) ? value.serviceIds : []),
    ...(Array.isArray(value?.caseIds) ? value.caseIds : []),
    ...(Array.isArray(value?.galleryIds) ? value.galleryIds : [])
  ].filter(Boolean).length;
  const mediaReady = Boolean(String(value?.primaryMediaAssetId || "").trim());

  return {
    isEmptyWorkspace: !hasRequiredPageBasics(value),
    titleReady,
    h1Ready,
    introReady,
    sourceCount,
    mediaReady
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
  switch (aiAction) {
    case "suggest_connective_copy":
      return {
        aiAction,
        target: "connective_copy",
        label: "Предложить текст для связки",
        hint: "AI подготовит переходный текст между доказательствами и финальным блоком.",
        progressLabel: "AI готовит связочный текст."
      };
    case "strengthen_cta":
      return {
        aiAction,
        target: "cta",
        label: pageType === PAGE_TYPES.CONTACTS ? "Уточнить контактный блок" : "Усилить финальный CTA",
        hint: pageType === PAGE_TYPES.CONTACTS
          ? "AI работает только с контактной подводкой."
          : "AI работает только с финальным CTA-блоком.",
        progressLabel: pageType === PAGE_TYPES.CONTACTS
          ? "AI уточняет контактную подводку."
          : "AI усиливает финальный CTA."
      };
    case "compact_wording":
      return {
        aiAction,
        target: "page_copy",
        label: "Сжать видимую копию страницы",
        hint: "AI пройдётся по видимому тексту страницы и предложит более компактную формулировку.",
        progressLabel: "AI делает копию страницы компактнее."
      };
    case "rewrite_selected":
    default:
      return {
        aiAction: "rewrite_selected",
        target: selectedTarget,
        label: "Переписать выбранную зону",
        hint: "AI работает только с выбранной зоной и вернёт bounded patch для неё.",
        progressLabel: "AI переписывает выбранную зону."
      };
  }
}

export function getPageCardPreviewUrl(primaryMediaAssetId = "") {
  return primaryMediaAssetId ? `/api/admin/media/${primaryMediaAssetId}/preview` : "";
}

export function buildAiActionIntent({ actionType = "", target = "", pageLabel = "" } = {}) {
  if (actionType === "rewrite_selected") {
    return `Перепиши выбранный блок ${target} для страницы ${pageLabel}, сохранив деловой и SEO-понятный тон.`;
  }

  if (actionType === "suggest_connective_copy") {
    return `Предложи связочный текст для блока ${target} на странице ${pageLabel}.`;
  }

  if (actionType === "strengthen_cta") {
    return `Усиль CTA и финальный переход на странице ${pageLabel} без агрессивного маркетингового тона.`;
  }

  if (actionType === "compact_wording") {
    return `Сделай видимый текст страницы ${pageLabel} компактнее и SEO-понятнее, без потери смысла.`;
  }

  return `Уточни видимый текст страницы ${pageLabel}.`;
}

export function extractPageWorkspaceAiPatch({ target = "", pageType = PAGE_TYPES.ABOUT, candidatePayload = {} } = {}) {
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

  if (target === "connective_copy") {
    return {
      body: draft.body
    };
  }

  if (target === "cta") {
    if (pageType === PAGE_TYPES.CONTACTS) {
      return {
        contactNote: draft.contactNote
      };
    }

    return {
      ctaTitle: draft.ctaTitle,
      ctaBody: draft.ctaBody,
      defaultBlockCtaLabel: draft.defaultBlockCtaLabel
    };
  }

  if (target === "page_copy") {
    return {
      title: draft.title,
      h1: draft.h1,
      intro: draft.intro,
      body: draft.body,
      ...(pageType === PAGE_TYPES.CONTACTS
        ? { contactNote: draft.contactNote }
        : {
            ctaTitle: draft.ctaTitle,
            ctaBody: draft.ctaBody,
            defaultBlockCtaLabel: draft.defaultBlockCtaLabel
          })
    };
  }

  return {
    body: draft.body
  };
}
