import { z } from "zod";

import { getTopLevelFieldsForEntityType, validatePayload } from "./schemas.js";
import { CHANGE_CLASSES, ENTITY_TYPES, PAGE_TYPES } from "./content-types.js";
import {
  DEFAULT_LANDING_PAGE_THEME_KEY,
  DEFAULT_LANDING_SURFACE_TONE,
  DEFAULT_LANDING_TEXT_EMPHASIS_PRESET
} from "../landing-composition/visual-semantics.js";
import { normalizeLegacyPageCopy } from "./page-copy.js";

const PAGE_BLOCK_DEFAULTS = Object.freeze({
  relatedServicesTitle: "\u0421\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0435 \u0443\u0441\u043b\u0443\u0433\u0438",
  relatedCasesTitle: "\u0421\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0435 \u043a\u0435\u0439\u0441\u044b",
  galleryTitle: "\u0413\u0430\u043b\u0435\u0440\u0435\u044f",
  contactsTitle: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b",
  ctaTitle: "\u0421\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441 \u043d\u0430\u043c\u0438",
  ctaLabel: "\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043d\u0430\u043c\u0438"
});

const entityTypeSchema = z.enum([
  ENTITY_TYPES.GLOBAL_SETTINGS,
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

export function assertEntityType(value) {
  return entityTypeSchema.parse(value);
}

export function toBoolean(value) {
  return value === "true" || value === "on" || value === true;
}

function normalizeSeo(input) {
  const seo = input.seo && typeof input.seo === "object" ? input.seo : {};

  return {
    metaTitle: input.metaTitle ?? seo.metaTitle,
    metaDescription: input.metaDescription ?? seo.metaDescription,
    canonicalIntent: input.canonicalIntent ?? seo.canonicalIntent,
    indexationFlag: input.indexationFlag ?? "index",
    openGraphTitle: input.openGraphTitle ?? seo.openGraphTitle,
    openGraphDescription: input.openGraphDescription ?? seo.openGraphDescription,
    openGraphImageAssetId: input.openGraphImageAssetId ?? seo.openGraphImageAssetId
  };
}

function buildPagePayload(input) {
  const pageType = input.pageType;
  const slug = pageType === PAGE_TYPES.ABOUT ? "about" : "contacts";
  const blocks = [];
  const pageThemeKey = input.pageThemeKey ?? DEFAULT_LANDING_PAGE_THEME_KEY;

  if (input.intro || input.title) {
    blocks.push({
      type: "hero",
      order: 0,
      title: input.title,
      body: input.intro ?? "",
      ctaLabel: input.defaultBlockCtaLabel ?? "",
      mediaAssetId: input.primaryMediaAssetId ?? "",
      textEmphasisPreset: input.heroTextEmphasisPreset ?? DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: input.heroSurfaceTone ?? DEFAULT_LANDING_SURFACE_TONE
    });
  }

  if (input.body) {
    blocks.push({
      type: "rich_text",
      order: 1,
      title: "",
      body: input.body,
      textEmphasisPreset: input.contentBandTextEmphasisPreset ?? DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: input.contentBandSurfaceTone ?? DEFAULT_LANDING_SURFACE_TONE
    });
  }

  if ((input.serviceIds ?? []).length > 0) {
    blocks.push({
      type: "service_list",
      order: 2,
      title: PAGE_BLOCK_DEFAULTS.relatedServicesTitle,
      serviceIds: input.serviceIds
    });
  }

  if ((input.caseIds ?? []).length > 0) {
    blocks.push({
      type: "case_list",
      order: 3,
      title: PAGE_BLOCK_DEFAULTS.relatedCasesTitle,
      caseIds: input.caseIds
    });
  }

  if ((input.galleryIds ?? []).length > 0) {
    blocks.push({
      type: "gallery",
      order: 4,
      title: PAGE_BLOCK_DEFAULTS.galleryTitle,
      galleryIds: input.galleryIds
    });
  }

  if (pageType === PAGE_TYPES.CONTACTS) {
    blocks.push({
      type: "contact",
      order: 5,
      title: PAGE_BLOCK_DEFAULTS.contactsTitle,
      body: input.contactNote ?? "",
      textEmphasisPreset: input.ctaTextEmphasisPreset ?? DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: input.ctaSurfaceTone ?? DEFAULT_LANDING_SURFACE_TONE
    });
  } else {
    blocks.push({
      type: "cta",
      order: 5,
      title: normalizeLegacyPageCopy(input.ctaTitle) || PAGE_BLOCK_DEFAULTS.ctaTitle,
      body: input.ctaBody || "",
      ctaLabel: normalizeLegacyPageCopy(input.defaultBlockCtaLabel) || PAGE_BLOCK_DEFAULTS.ctaLabel,
      textEmphasisPreset: input.ctaTextEmphasisPreset ?? DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: input.ctaSurfaceTone ?? DEFAULT_LANDING_SURFACE_TONE
    });
  }

  return {
    slug,
    pageType,
    pageThemeKey,
    title: input.title,
    h1: input.h1,
    intro: input.intro,
    blocks,
    primaryMediaAssetId: input.primaryMediaAssetId,
    seo: normalizeSeo(input)
  };
}

export function normalizeEntityInput(entityType, input) {
  switch (entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      return validatePayload(entityType, {
        publicBrandName: input.publicBrandName,
        legalName: input.legalName,
        primaryPhone: input.primaryPhone,
        activeMessengers: input.activeMessengers ?? [],
        publicEmail: input.publicEmail,
        serviceArea: input.serviceArea,
        primaryRegion: input.primaryRegion,
        defaultCtaLabel: input.defaultCtaLabel,
        defaultCtaDescription: input.defaultCtaDescription,
        organization: {
          city: input.organizationCity,
          country: input.organizationCountry
        },
        contactTruthConfirmed: toBoolean(input.contactTruthConfirmed),
        seo: normalizeSeo(input)
      });
    case ENTITY_TYPES.MEDIA_ASSET:
      return validatePayload(entityType, {
        assetType: "image",
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
        title: input.title,
        alt: input.alt,
        caption: input.caption,
        ownershipNote: input.ownershipNote,
        sourceNote: input.sourceNote,
        uploadedBy: input.uploadedBy,
        uploadedAt: input.uploadedAt,
        sizeBytes: Number(input.sizeBytes ?? 0),
        status: input.status ?? "draft_asset",
        lifecycleState: input.lifecycleState ?? "active"
      });
    case ENTITY_TYPES.GALLERY:
      return validatePayload(entityType, {
        title: input.title,
        primaryAssetId: input.primaryAssetId,
        assetIds: input.assetIds ?? [],
        caption: input.caption,
        relatedEntityIds: input.relatedEntityIds ?? [],
        seo: normalizeSeo(input)
      });
    case ENTITY_TYPES.SERVICE:
      return validatePayload(entityType, {
        slug: input.slug,
        title: input.title,
        h1: input.h1,
        summary: input.summary,
        serviceScope: input.serviceScope,
        problemsSolved: input.problemsSolved,
        methods: input.methods,
        ctaVariant: input.ctaVariant,
        relatedCaseIds: input.relatedCaseIds ?? [],
        galleryIds: input.galleryIds ?? [],
        primaryMediaAssetId: input.primaryMediaAssetId,
        seo: normalizeSeo(input)
      });
    case ENTITY_TYPES.CASE:
      return validatePayload(entityType, {
        slug: input.slug,
        title: input.title,
        location: input.location,
        projectType: input.projectType,
        task: input.task,
        workScope: input.workScope,
        result: input.result,
        serviceIds: input.serviceIds ?? [],
        galleryIds: input.galleryIds ?? [],
        primaryMediaAssetId: input.primaryMediaAssetId,
        seo: normalizeSeo(input)
      });
    case ENTITY_TYPES.PAGE:
      return validatePayload(entityType, buildPagePayload(input));
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

export function buildChangeSummary(entityType, previousPayload, nextPayload) {
  return getTopLevelFieldsForEntityType(entityType).filter((field) => {
    return JSON.stringify(previousPayload?.[field] ?? null) !== JSON.stringify(nextPayload?.[field] ?? null);
  });
}

export function determineChangeClass(entityType, previousPublishedPayload, nextPayload) {
  if (entityType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    return CHANGE_CLASSES.GLOBAL;
  }

  if (!previousPublishedPayload) {
    if (
      entityType === ENTITY_TYPES.SERVICE ||
      entityType === ENTITY_TYPES.CASE ||
      (entityType === ENTITY_TYPES.PAGE && nextPayload.pageType === PAGE_TYPES.ABOUT)
    ) {
      return CHANGE_CLASSES.NEW_LAUNCH_CRITICAL;
    }

    return CHANGE_CLASSES.MINOR_EDITORIAL;
  }

  if (previousPublishedPayload.slug && nextPayload.slug && previousPublishedPayload.slug !== nextPayload.slug) {
    return CHANGE_CLASSES.ROUTE;
  }

  return CHANGE_CLASSES.MINOR_EDITORIAL;
}

export function requiresOwnerReview(entityType, previousPublishedPayload, nextPayload) {
  if (entityType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    return true;
  }

  if (entityType === ENTITY_TYPES.PAGE && nextPayload.pageType === PAGE_TYPES.ABOUT) {
    return true;
  }

  if (!previousPublishedPayload && (entityType === ENTITY_TYPES.SERVICE || entityType === ENTITY_TYPES.CASE)) {
    return true;
  }

  if (previousPublishedPayload?.slug && nextPayload.slug && previousPublishedPayload.slug !== nextPayload.slug) {
    return true;
  }

  return false;
}
