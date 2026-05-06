import { getBoolean, getString, getStringArray } from "./form-data.js";

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildEntityPayload(entityType, formData) {
  const common = {
    title: getString(formData, "title"),
    h1: getString(formData, "h1"),
    slug: getString(formData, "slug"),
    locale: getString(formData, "locale"),
    intro: getString(formData, "intro"),
    body: getString(formData, "body"),
    summary: getString(formData, "summary"),
    serviceScope: getString(formData, "serviceScope"),
    equipmentType: getString(formData, "equipmentType"),
    shortSummary: getString(formData, "shortSummary"),
    capabilitySummary: getString(formData, "capabilitySummary"),
    operatorMode: getString(formData, "operatorMode"),
    problemsSolved: getString(formData, "problemsSolved"),
    methods: getString(formData, "methods"),
    ctaVariant: getString(formData, "ctaVariant"),
    location: getString(formData, "location"),
    projectType: getString(formData, "projectType"),
    task: getString(formData, "task"),
    workScope: getString(formData, "workScope"),
    result: getString(formData, "result"),
    primaryMediaAssetId: getString(formData, "primaryMediaAssetId"),
    primaryAssetId: getString(formData, "primaryAssetId"),
    storageKey: getString(formData, "storageKey"),
    mimeType: getString(formData, "mimeType"),
    originalFilename: getString(formData, "originalFilename"),
    alt: getString(formData, "alt"),
    caption: getString(formData, "caption"),
    ownershipNote: getString(formData, "ownershipNote"),
    sourceNote: getString(formData, "sourceNote"),
    uploadedBy: getString(formData, "uploadedBy"),
    uploadedAt: getString(formData, "uploadedAt"),
    sizeBytes: getString(formData, "sizeBytes"),
    status: getString(formData, "status"),
    lifecycleState: getString(formData, "lifecycleState"),
    publicBrandName: getString(formData, "publicBrandName"),
    legalName: getString(formData, "legalName"),
    primaryPhone: getString(formData, "primaryPhone"),
    publicEmail: getString(formData, "publicEmail"),
    serviceArea: getString(formData, "serviceArea"),
    serviceAreaNote: getString(formData, "serviceAreaNote"),
    primaryRegion: getString(formData, "primaryRegion"),
    defaultCtaLabel: getString(formData, "defaultCtaLabel"),
    defaultCtaDescription: getString(formData, "defaultCtaDescription"),
    organizationCity: getString(formData, "organizationCity"),
    organizationCountry: getString(formData, "organizationCountry"),
    contactTruthConfirmed: getBoolean(formData, "contactTruthConfirmed"),
    relatedCaseIds: getStringArray(formData, "relatedCaseIds"),
    galleryIds: getStringArray(formData, "galleryIds"),
    serviceIds: getStringArray(formData, "serviceIds"),
    equipmentIds: getStringArray(formData, "equipmentIds"),
    caseIds: getStringArray(formData, "caseIds"),
    keySpecs: splitLines(getString(formData, "keySpecs")),
    usageScenarios: splitLines(getString(formData, "usageScenarios")),
    assetIds: getStringArray(formData, "assetIds"),
    relatedEntityIds: getStringArray(formData, "relatedEntityIds"),
    activeMessengers: getStringArray(formData, "activeMessengers"),
    pageType: getString(formData, "pageType"),
    createMode: getString(formData, "createMode"),
    primaryServiceId: getString(formData, "primaryServiceId"),
    primaryEquipmentId: getString(formData, "primaryEquipmentId"),
    cloneFromPageId: getString(formData, "cloneFromPageId"),
    geoLabel: getString(formData, "geoLabel"),
    city: getString(formData, "city"),
    district: getString(formData, "district"),
    contactNote: getString(formData, "contactNote"),
    ctaTitle: getString(formData, "ctaTitle"),
    ctaBody: getString(formData, "ctaBody"),
    defaultBlockCtaLabel: getString(formData, "defaultBlockCtaLabel"),
    metaTitle: getString(formData, "metaTitle"),
    metaDescription: getString(formData, "metaDescription"),
    canonicalIntent: getString(formData, "canonicalIntent"),
    indexationFlag: getString(formData, "indexationFlag") || "index",
    openGraphTitle: getString(formData, "openGraphTitle"),
    openGraphDescription: getString(formData, "openGraphDescription"),
    openGraphImageAssetId: getString(formData, "openGraphImageAssetId")
  };

  if (entityType === "gallery") {
    return {
      title: common.title,
      primaryAssetId: common.primaryAssetId,
      assetIds: common.assetIds,
      caption: common.caption,
      relatedEntityIds: common.relatedEntityIds,
      metaTitle: common.metaTitle,
      metaDescription: common.metaDescription,
      canonicalIntent: common.canonicalIntent,
      indexationFlag: common.indexationFlag,
      openGraphTitle: common.openGraphTitle,
      openGraphDescription: common.openGraphDescription,
      openGraphImageAssetId: common.openGraphImageAssetId
    };
  }

  return common;
}
