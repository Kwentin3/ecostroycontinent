import { z } from "zod";

import { getTopLevelFieldsForEntityType, validatePayload } from "./schemas.js";
import {
  BLOCK_TYPES,
  CHANGE_CLASSES,
  ENTITY_TYPES,
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "./content-types.js";
import {
  DEFAULT_LANDING_PAGE_THEME_KEY,
  DEFAULT_LANDING_SURFACE_TONE,
  DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
  LANDING_SURFACE_TONES,
  LANDING_TEXT_EMPHASIS_PRESETS
} from "../landing-composition/visual-semantics.js";
import { normalizePageMediaSettings } from "./page-media.js";

const entityTypeSchema = z.enum([
  ENTITY_TYPES.GLOBAL_SETTINGS,
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

const PAGE_BLOCK_DEFAULTS = Object.freeze({
  relatedServicesTitle: "Связанные услуги",
  relatedCasesTitle: "Кейсы и подтверждения",
  galleryTitle: "Галерея",
  contactsTitle: "Контакты",
  ctaTitle: "Оставьте заявку",
  ctaLabel: "Оставить заявку"
});

const DEFAULT_CTA_COPY = Object.freeze({
  title: "Свяжитесь с нами",
  label: "Связаться с нами"
});

const LANDING_CTA_COPY = Object.freeze({
  title: "Оставьте заявку",
  label: "Оставить заявку"
});

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asList(value) {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];
}

function ensureSectionOrder(sections = []) {
  return sections
    .map((section, index) => ({
      ...section,
      order: Number.isInteger(section?.order) ? section.order : index
    }))
    .sort((left, right) => left.order - right.order);
}

function slugify(value) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function assertEntityType(value) {
  return entityTypeSchema.parse(value);
}

export function toBoolean(value) {
  return value === "true" || value === "on" || value === true;
}

function normalizeSeo(input) {
  const seo = input.seo && typeof input.seo === "object" ? input.seo : {};

  return {
    metaTitle: input.metaTitle ?? seo.metaTitle ?? "",
    metaDescription: input.metaDescription ?? seo.metaDescription ?? "",
    canonicalIntent: input.canonicalIntent ?? seo.canonicalIntent ?? "",
    indexationFlag: input.indexationFlag ?? seo.indexationFlag ?? "index",
    openGraphTitle: input.openGraphTitle ?? seo.openGraphTitle ?? "",
    openGraphDescription: input.openGraphDescription ?? seo.openGraphDescription ?? "",
    openGraphImageAssetId: input.openGraphImageAssetId ?? seo.openGraphImageAssetId ?? ""
  };
}

function normalizeSourceRefs(input = {}) {
  const sourceRefs = input.sourceRefs && typeof input.sourceRefs === "object" ? input.sourceRefs : {};
  const legacyServiceIds = asList(input.serviceIds);

  return {
    primaryServiceId: asString(input.primaryServiceId ?? sourceRefs.primaryServiceId ?? legacyServiceIds[0]),
    primaryEquipmentId: asString(input.primaryEquipmentId ?? sourceRefs.primaryEquipmentId),
    caseIds: asList(input.caseIds ?? sourceRefs.caseIds),
    galleryIds: asList(input.galleryIds ?? sourceRefs.galleryIds)
  };
}

function normalizeTargeting(input = {}) {
  const targeting = input.targeting && typeof input.targeting === "object" ? input.targeting : {};

  return {
    geoLabel: asString(input.geoLabel ?? targeting.geoLabel),
    city: asString(input.city ?? targeting.city),
    district: asString(input.district ?? targeting.district),
    serviceArea: asString(input.serviceArea ?? targeting.serviceArea)
  };
}

function buildSectionSkeletons(pageType) {
  switch (pageType) {
    case PAGE_TYPES.CONTACTS:
      return [
        { type: PAGE_SECTION_TYPES.HERO_OFFER, order: 0, title: "", body: "", ctaLabel: "", trustText: "" },
        { type: PAGE_SECTION_TYPES.RICH_TEXT, order: 1, title: "", body: "" },
        { type: PAGE_SECTION_TYPES.CONTACT_DETAILS, order: 2, title: PAGE_BLOCK_DEFAULTS.contactsTitle, body: "" },
        { type: PAGE_SECTION_TYPES.GEO_COVERAGE, order: 3, title: "Где работаем", body: "" }
      ];
    case PAGE_TYPES.SERVICE_LANDING:
      return [
        { type: PAGE_SECTION_TYPES.HERO_OFFER, order: 0, title: "", body: "", ctaLabel: "", trustText: "" },
        { type: PAGE_SECTION_TYPES.SERVICE_SCOPE, order: 1, title: "Что входит в услугу", body: "" },
        { type: PAGE_SECTION_TYPES.GEO_COVERAGE, order: 2, title: "Где работаем", body: "" },
        { type: PAGE_SECTION_TYPES.PROOF_CASES, order: 3, title: PAGE_BLOCK_DEFAULTS.relatedCasesTitle, caseIds: [], galleryIds: [] },
        { type: PAGE_SECTION_TYPES.CTA, order: 4, title: LANDING_CTA_COPY.title, body: "", ctaLabel: LANDING_CTA_COPY.label }
      ];
    case PAGE_TYPES.EQUIPMENT_LANDING:
      return [
        { type: PAGE_SECTION_TYPES.HERO_OFFER, order: 0, title: "", body: "", ctaLabel: "", trustText: "" },
        { type: PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY, order: 1, title: "О технике", body: "" },
        { type: PAGE_SECTION_TYPES.EQUIPMENT_SPECS, order: 2, title: "Характеристики", items: [] },
        { type: PAGE_SECTION_TYPES.GEO_COVERAGE, order: 3, title: "Где работаем", body: "" },
        { type: PAGE_SECTION_TYPES.PROOF_CASES, order: 4, title: PAGE_BLOCK_DEFAULTS.relatedCasesTitle, caseIds: [], galleryIds: [] },
        { type: PAGE_SECTION_TYPES.CTA, order: 5, title: LANDING_CTA_COPY.title, body: "", ctaLabel: LANDING_CTA_COPY.label }
      ];
    case PAGE_TYPES.ABOUT:
    default:
      return [
        { type: PAGE_SECTION_TYPES.HERO_OFFER, order: 0, title: "", body: "", ctaLabel: "", trustText: "" },
        { type: PAGE_SECTION_TYPES.RICH_TEXT, order: 1, title: "", body: "" },
        { type: PAGE_SECTION_TYPES.PROOF_CASES, order: 2, title: PAGE_BLOCK_DEFAULTS.relatedCasesTitle, caseIds: [], galleryIds: [] },
        { type: PAGE_SECTION_TYPES.CTA, order: 3, title: DEFAULT_CTA_COPY.title, body: "", ctaLabel: DEFAULT_CTA_COPY.label }
      ];
  }
}

function normalizeIncomingSection(section = {}) {
  switch (section.type) {
    case PAGE_SECTION_TYPES.HERO_OFFER:
      return {
        type: section.type,
        order: Number(section.order ?? 0),
        title: asString(section.title),
        body: asString(section.body),
        ctaLabel: asString(section.ctaLabel),
        trustText: asString(section.trustText)
      };
    case PAGE_SECTION_TYPES.RICH_TEXT:
    case PAGE_SECTION_TYPES.CONTACT_DETAILS:
    case PAGE_SECTION_TYPES.SERVICE_SCOPE:
    case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
    case PAGE_SECTION_TYPES.GEO_COVERAGE:
      return {
        type: section.type,
        order: Number(section.order ?? 0),
        title: asString(section.title),
        body: asString(section.body)
      };
    case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
      return {
        type: section.type,
        order: Number(section.order ?? 0),
        title: asString(section.title),
        items: asList(section.items)
      };
    case PAGE_SECTION_TYPES.PROOF_CASES:
      return {
        type: section.type,
        order: Number(section.order ?? 0),
        title: asString(section.title),
        caseIds: asList(section.caseIds),
        galleryIds: asList(section.galleryIds)
      };
    case PAGE_SECTION_TYPES.CTA:
      return {
        type: section.type,
        order: Number(section.order ?? 0),
        title: asString(section.title),
        body: asString(section.body),
        ctaLabel: asString(section.ctaLabel)
      };
    default:
      return null;
  }
}

function mergePageSections(pageType, input, sourceRefs, targeting) {
  const incomingSections = Array.isArray(input.sections)
    ? ensureSectionOrder(input.sections.map(normalizeIncomingSection).filter(Boolean))
    : [];

  if (incomingSections.length > 0) {
    return incomingSections;
  }

  const sections = buildSectionSkeletons(pageType);

  return sections.map((section) => {
    switch (section.type) {
      case PAGE_SECTION_TYPES.HERO_OFFER:
        return {
          ...section,
          body: asString(input.intro),
          ctaLabel: asString(input.defaultBlockCtaLabel),
          trustText: asString(input.heroTrustText)
        };
      case PAGE_SECTION_TYPES.RICH_TEXT:
        return {
          ...section,
          body: asString(input.body)
        };
      case PAGE_SECTION_TYPES.CONTACT_DETAILS:
        return {
          ...section,
          body: asString(input.contactNote)
        };
      case PAGE_SECTION_TYPES.SERVICE_SCOPE:
        return {
          ...section,
          body: asString(input.serviceScope || input.body)
        };
      case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
        return {
          ...section,
          body: asString(input.equipmentSummary || input.body)
        };
      case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
        return {
          ...section,
          items: asList(input.equipmentSpecs ?? input.keySpecs)
        };
      case PAGE_SECTION_TYPES.GEO_COVERAGE:
        return {
          ...section,
          body: asString(input.geoCoverageBody) || [targeting.geoLabel, targeting.serviceArea].filter(Boolean).join(" · ")
        };
      case PAGE_SECTION_TYPES.PROOF_CASES:
        return {
          ...section,
          caseIds: sourceRefs.caseIds,
          galleryIds: sourceRefs.galleryIds
        };
      case PAGE_SECTION_TYPES.CTA:
        return {
          ...section,
          title: asString(input.ctaTitle) || section.title,
          body: asString(input.ctaBody),
          ctaLabel: asString(input.defaultBlockCtaLabel) || section.ctaLabel
        };
      default:
        return section;
    }
  });
}

function sectionByType(sections, type) {
  return sections.find((section) => section.type === type) ?? null;
}

function pickBoundedValue(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function getDefaultCtaCopy(pageType) {
  if (pageType === PAGE_TYPES.SERVICE_LANDING || pageType === PAGE_TYPES.EQUIPMENT_LANDING) {
    return LANDING_CTA_COPY;
  }

  return DEFAULT_CTA_COPY;
}

function buildPageBlocksFromSections({ input = {}, pageType, title, intro, primaryMediaAssetId, sections = [], sourceRefs = {}, mediaSettings = {} }) {
  const blocks = [];
  const hero = sectionByType(sections, PAGE_SECTION_TYPES.HERO_OFFER);
  const richText = sectionByType(sections, PAGE_SECTION_TYPES.RICH_TEXT);
  const contactDetails = sectionByType(sections, PAGE_SECTION_TYPES.CONTACT_DETAILS);
  const serviceScope = sectionByType(sections, PAGE_SECTION_TYPES.SERVICE_SCOPE);
  const equipmentSummary = sectionByType(sections, PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY);
  const equipmentSpecs = sectionByType(sections, PAGE_SECTION_TYPES.EQUIPMENT_SPECS);
  const geoCoverage = sectionByType(sections, PAGE_SECTION_TYPES.GEO_COVERAGE);
  const proofCases = sectionByType(sections, PAGE_SECTION_TYPES.PROOF_CASES);
  const cta = sectionByType(sections, PAGE_SECTION_TYPES.CTA);
  const defaultCtaCopy = getDefaultCtaCopy(pageType);
  const normalizedMediaSettings = normalizePageMediaSettings(mediaSettings, pageType);
  const heroTextEmphasisPreset = pickBoundedValue(input.heroTextEmphasisPreset, LANDING_TEXT_EMPHASIS_PRESETS, DEFAULT_LANDING_TEXT_EMPHASIS_PRESET);
  const heroSurfaceTone = pickBoundedValue(input.heroSurfaceTone, LANDING_SURFACE_TONES, DEFAULT_LANDING_SURFACE_TONE);
  const contentBandTextEmphasisPreset = pickBoundedValue(input.contentBandTextEmphasisPreset, LANDING_TEXT_EMPHASIS_PRESETS, DEFAULT_LANDING_TEXT_EMPHASIS_PRESET);
  const contentBandSurfaceTone = pickBoundedValue(input.contentBandSurfaceTone, LANDING_SURFACE_TONES, DEFAULT_LANDING_SURFACE_TONE);
  const ctaTextEmphasisPreset = pickBoundedValue(input.ctaTextEmphasisPreset, LANDING_TEXT_EMPHASIS_PRESETS, DEFAULT_LANDING_TEXT_EMPHASIS_PRESET);
  const ctaSurfaceTone = pickBoundedValue(input.ctaSurfaceTone, LANDING_SURFACE_TONES, DEFAULT_LANDING_SURFACE_TONE);

  blocks.push({
    type: BLOCK_TYPES.HERO,
    order: 0,
    title: title || "Страница",
    body: hero?.body || intro || "",
    ctaLabel: hero?.ctaLabel || cta?.ctaLabel || "",
    mediaAssetId: primaryMediaAssetId || "",
    mediaLayout: normalizedMediaSettings.heroLayout,
    textEmphasisPreset: heroTextEmphasisPreset,
    surfaceTone: heroSurfaceTone
  });

  if (pageType === PAGE_TYPES.ABOUT || pageType === PAGE_TYPES.CONTACTS) {
    if (asString(richText?.body)) {
      blocks.push({
        type: BLOCK_TYPES.RICH_TEXT,
        order: blocks.length,
        title: richText?.title || "",
        body: richText.body,
        textEmphasisPreset: contentBandTextEmphasisPreset,
        surfaceTone: contentBandSurfaceTone
      });
    }
  } else {
    const landingBody = [
      asString(serviceScope?.body),
      asString(equipmentSummary?.body),
      (equipmentSpecs?.items ?? []).join("\n"),
      asString(geoCoverage?.body)
    ].filter(Boolean).join("\n\n");

    if (landingBody) {
      blocks.push({
        type: BLOCK_TYPES.RICH_TEXT,
        order: blocks.length,
        title: "",
        body: landingBody,
        textEmphasisPreset: contentBandTextEmphasisPreset,
        surfaceTone: contentBandSurfaceTone
      });
    }
  }

  if ((sourceRefs.primaryServiceId ? [sourceRefs.primaryServiceId] : []).length > 0) {
    blocks.push({
      type: BLOCK_TYPES.SERVICE_LIST,
      order: blocks.length,
      title: PAGE_BLOCK_DEFAULTS.relatedServicesTitle,
      serviceIds: [sourceRefs.primaryServiceId]
    });
  }

  if ((proofCases?.caseIds ?? []).length > 0) {
    blocks.push({
      type: BLOCK_TYPES.CASE_LIST,
      order: blocks.length,
      title: proofCases?.title || PAGE_BLOCK_DEFAULTS.relatedCasesTitle,
      caseIds: proofCases.caseIds
    });
  }

  if ((proofCases?.galleryIds ?? []).length > 0) {
    blocks.push({
      type: BLOCK_TYPES.GALLERY,
      order: blocks.length,
      title: PAGE_BLOCK_DEFAULTS.galleryTitle,
      galleryIds: proofCases.galleryIds,
      layoutPreset: normalizedMediaSettings.galleryLayout,
      aspectRatioPreset: normalizedMediaSettings.galleryAspectRatio,
      groupingMode: normalizedMediaSettings.galleryGrouping,
      showCaptions: normalizedMediaSettings.showGalleryCaptions
    });
  }

  if (pageType === PAGE_TYPES.CONTACTS) {
    blocks.push({
      type: BLOCK_TYPES.CONTACT,
      order: blocks.length,
      title: contactDetails?.title || PAGE_BLOCK_DEFAULTS.contactsTitle,
      body: contactDetails?.body || "",
      textEmphasisPreset: DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: DEFAULT_LANDING_SURFACE_TONE
    });
  } else {
    blocks.push({
      type: BLOCK_TYPES.CTA,
      order: blocks.length,
      title: cta?.title || defaultCtaCopy.title,
      body: cta?.body || "",
      ctaLabel: cta?.ctaLabel || defaultCtaCopy.label,
      textEmphasisPreset: ctaTextEmphasisPreset,
      surfaceTone: ctaSurfaceTone
    });
  }

  return blocks;
}

function buildPagePayload(input) {
  const pageType = input.pageType || PAGE_TYPES.ABOUT;
  const sourceRefs = normalizeSourceRefs(input);
  const targeting = normalizeTargeting(input);
  const title = asString(input.title);
  const h1 = asString(input.h1 || input.title);
  const intro = asString(input.intro);
  const primaryMediaAssetId = asString(input.primaryMediaAssetId);
  const mediaSettings = normalizePageMediaSettings(input.mediaSettings ?? input, pageType);
  const sections = mergePageSections(pageType, input, sourceRefs, targeting);
  const derivedSlug =
    pageType === PAGE_TYPES.ABOUT
      ? "about"
      : pageType === PAGE_TYPES.CONTACTS
        ? "contacts"
        : slugify(input.slug || input.seedSlug || title || h1) || "page";

  return {
    slug: derivedSlug,
    pageType,
    pageThemeKey: input.pageThemeKey ?? DEFAULT_LANDING_PAGE_THEME_KEY,
    title,
    h1,
    intro,
    primaryMediaAssetId,
    mediaSettings,
    sourceRefs,
    targeting,
    sections,
    blocks: buildPageBlocksFromSections({
      input,
      pageType,
      title,
      intro,
      primaryMediaAssetId,
      sections,
      sourceRefs,
      targeting,
      mediaSettings
    }),
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
        serviceArea: input.serviceArea,
        serviceAreaNote: input.serviceAreaNote,
        problemsSolved: input.problemsSolved,
        methods: input.methods,
        ctaVariant: input.ctaVariant,
        equipmentIds: input.equipmentIds ?? [],
        relatedCaseIds: input.relatedCaseIds ?? [],
        galleryIds: input.galleryIds ?? [],
        primaryMediaAssetId: input.primaryMediaAssetId,
        seo: normalizeSeo(input)
      });
    case ENTITY_TYPES.EQUIPMENT:
      return validatePayload(entityType, {
        slug: input.slug,
        locale: input.locale || "ru-RU",
        status: input.status || "draft",
        title: input.title,
        equipmentType: input.equipmentType,
        shortSummary: input.shortSummary,
        capabilitySummary: input.capabilitySummary,
        keySpecs: input.keySpecs ?? [],
        usageScenarios: input.usageScenarios ?? [],
        operatorMode: input.operatorMode,
        primaryMediaAssetId: input.primaryMediaAssetId,
        galleryIds: input.galleryIds ?? [],
        relatedCaseIds: input.relatedCaseIds ?? [],
        serviceIds: input.serviceIds ?? [],
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
        equipmentIds: input.equipmentIds ?? [],
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
      entityType === ENTITY_TYPES.SERVICE
      || entityType === ENTITY_TYPES.CASE
      || entityType === ENTITY_TYPES.EQUIPMENT
      || (
        entityType === ENTITY_TYPES.PAGE
        && [
          PAGE_TYPES.ABOUT,
          PAGE_TYPES.SERVICE_LANDING,
          PAGE_TYPES.EQUIPMENT_LANDING
        ].includes(nextPayload.pageType)
      )
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

  if (
    entityType === ENTITY_TYPES.PAGE
    && [
      PAGE_TYPES.ABOUT,
      PAGE_TYPES.SERVICE_LANDING,
      PAGE_TYPES.EQUIPMENT_LANDING
    ].includes(nextPayload.pageType)
  ) {
    return true;
  }

  if (!previousPublishedPayload && [ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE, ENTITY_TYPES.EQUIPMENT].includes(entityType)) {
    return true;
  }

  if (previousPublishedPayload?.slug && nextPayload.slug && previousPublishedPayload.slug !== nextPayload.slug) {
    return true;
  }

  return false;
}
