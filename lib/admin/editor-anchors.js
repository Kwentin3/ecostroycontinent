import { ENTITY_TYPES } from "../content-core/content-types.js";

const DEFAULT_FALLBACK_ANCHOR = "editor-fallback";

const ENTITY_FALLBACK_ANCHORS = Object.freeze({
  [ENTITY_TYPES.GLOBAL_SETTINGS]: "global-settings-fallback",
  [ENTITY_TYPES.SERVICE]: "service-fallback",
  [ENTITY_TYPES.CASE]: "case-fallback",
  [ENTITY_TYPES.PAGE]: "page-fallback",
  [ENTITY_TYPES.MEDIA_ASSET]: "media-asset-fallback",
  [ENTITY_TYPES.GALLERY]: "gallery-fallback"
});

const ENTITY_FIELD_ANCHORS = Object.freeze({
  [ENTITY_TYPES.GLOBAL_SETTINGS]: Object.freeze({
    publicBrandName: "global-settings-brand-truth",
    legalName: "global-settings-brand-truth",
    primaryPhone: "global-settings-contact-truth",
    activeMessengers: "global-settings-contact-truth",
    publicEmail: "global-settings-contact-truth",
    serviceArea: "global-settings-service-area",
    primaryRegion: "global-settings-service-area",
    defaultCtaLabel: "global-settings-default-cta",
    defaultCtaDescription: "global-settings-default-cta",
    contactTruthConfirmed: "global-settings-contact-truth"
  }),
  [ENTITY_TYPES.SERVICE]: Object.freeze({
    slug: "service-seo-truth",
    title: "service-seo-truth",
    h1: "service-seo-truth",
    summary: "service-seo-truth",
    serviceScope: "service-core",
    problemsSolved: "service-core",
    methods: "service-core",
    ctaVariant: "service-cta",
    equipmentIds: "service-relations",
    relatedCaseIds: "service-relations",
    galleryIds: "service-relations",
    primaryMediaAssetId: "service-media"
  }),
  [ENTITY_TYPES.CASE]: Object.freeze({
    slug: "case-seo-truth",
    title: "case-seo-truth",
    location: "case-seo-truth",
    projectType: "case-seo-truth",
    task: "case-core",
    workScope: "case-core",
    result: "case-core",
    serviceIds: "case-relations",
    equipmentIds: "case-relations",
    galleryIds: "case-relations",
    primaryMediaAssetId: "case-media"
  }),
  [ENTITY_TYPES.PAGE]: Object.freeze({
    slug: "page-route-truth",
    pageType: "page-route-truth",
    title: "page-seo-truth",
    h1: "page-seo-truth",
    intro: "page-seo-truth",
    blocks: "page-content",
    primaryMediaAssetId: "page-media",
    contactNote: "page-content",
    ctaTitle: "page-content",
    ctaBody: "page-content",
    defaultBlockCtaLabel: "page-content",
    serviceIds: "page-relations",
    caseIds: "page-relations",
    galleryIds: "page-relations"
  }),
  [ENTITY_TYPES.MEDIA_ASSET]: Object.freeze({
    title: "media-asset-truth",
    alt: "media-asset-truth",
    caption: "media-asset-truth",
    ownershipNote: "media-asset-truth",
    sourceNote: "media-asset-truth",
    storageKey: "media-asset-file",
    status: "media-asset-status"
  }),
  [ENTITY_TYPES.GALLERY]: Object.freeze({
    title: "gallery-truth",
    caption: "gallery-truth",
    assetIds: "gallery-assets",
    primaryAssetId: "gallery-primary-asset"
  })
});

function normalizeFieldName(field) {
  if (typeof field !== "string") {
    return null;
  }

  const trimmed = field.trim();

  return trimmed.length ? trimmed : null;
}

export function getEditorFallbackAnchor(entityType = null) {
  return ENTITY_FALLBACK_ANCHORS[entityType] ?? DEFAULT_FALLBACK_ANCHOR;
}

export function getEditorFieldAnchor(entityType, field = null) {
  const normalizedField = normalizeFieldName(field);
  const fieldMap = ENTITY_FIELD_ANCHORS[entityType] ?? null;
  const exactAnchor = normalizedField && fieldMap ? fieldMap[normalizedField] : null;
  const fallbackAnchor = getEditorFallbackAnchor(entityType);

  if (exactAnchor) {
    return {
      entityType,
      field: normalizedField,
      anchorId: exactAnchor,
      anchorKind: "field",
      isFallback: false,
      fallbackAnchorId: fallbackAnchor
    };
  }

  return {
    entityType,
    field: normalizedField,
    anchorId: fallbackAnchor,
    anchorKind: "fallback",
    isFallback: true,
    fallbackAnchorId: fallbackAnchor
  };
}

export function listEditorFieldAnchors(entityType) {
  const fieldMap = ENTITY_FIELD_ANCHORS[entityType] ?? {};

  return Object.entries(fieldMap).map(([field, anchorId]) => ({
    entityType,
    field,
    anchorId,
    anchorKind: "field",
    isFallback: false,
    fallbackAnchorId: getEditorFallbackAnchor(entityType)
  }));
}

export const EDITOR_FIELD_ANCHORS = Object.freeze(ENTITY_FIELD_ANCHORS);
