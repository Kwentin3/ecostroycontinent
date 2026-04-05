import { getBoolean, getString, getStringArray } from "./form-data.js";

export function buildEntityPayload(entityType, formData) {
  const common = {
    title: getString(formData, "title"),
    h1: getString(formData, "h1"),
    slug: getString(formData, "slug"),
    intro: getString(formData, "intro"),
    body: getString(formData, "body"),
    summary: getString(formData, "summary"),
    serviceScope: getString(formData, "serviceScope"),
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
    caption: getString(formData, "caption"),
    publicBrandName: getString(formData, "publicBrandName"),
    legalName: getString(formData, "legalName"),
    primaryPhone: getString(formData, "primaryPhone"),
    publicEmail: getString(formData, "publicEmail"),
    serviceArea: getString(formData, "serviceArea"),
    primaryRegion: getString(formData, "primaryRegion"),
    defaultCtaLabel: getString(formData, "defaultCtaLabel"),
    defaultCtaDescription: getString(formData, "defaultCtaDescription"),
    organizationCity: getString(formData, "organizationCity"),
    organizationCountry: getString(formData, "organizationCountry"),
    contactTruthConfirmed: getBoolean(formData, "contactTruthConfirmed"),
    relatedCaseIds: getStringArray(formData, "relatedCaseIds"),
    galleryIds: getStringArray(formData, "galleryIds"),
    serviceIds: getStringArray(formData, "serviceIds"),
    caseIds: getStringArray(formData, "caseIds"),
    assetIds: getStringArray(formData, "assetIds"),
    relatedEntityIds: getStringArray(formData, "relatedEntityIds"),
    activeMessengers: getStringArray(formData, "activeMessengers"),
    pageType: getString(formData, "pageType"),
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
