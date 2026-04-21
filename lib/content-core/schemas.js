import { z } from "zod";

import {
  BLOCK_TYPES,
  ENTITY_TYPES,
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "./content-types.js";
import {
  DEFAULT_LANDING_PAGE_THEME_KEY,
  DEFAULT_LANDING_SURFACE_TONE,
  DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
  LANDING_PAGE_THEME_KEYS,
  LANDING_SURFACE_TONES,
  LANDING_TEXT_EMPHASIS_PRESETS
} from "../landing-composition/visual-semantics.js";
import {
  DEFAULT_PAGE_MEDIA_SETTINGS,
  PAGE_MEDIA_GALLERY_ASPECT_RATIOS,
  PAGE_MEDIA_GALLERY_GROUPINGS,
  PAGE_MEDIA_GALLERY_LAYOUTS,
  PAGE_MEDIA_HERO_LAYOUTS
} from "./page-media.js";

// Canonical payload ownership and cross-domain fields are frozen by
// docs/engineering/CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.md.
// Keep schema changes aligned with entity-references.js, readiness.js, and public-content.js.

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z.string().trim().optional().default("");
const stringList = z.array(nonEmptyString).default([]);
const pageThemeKeySchema = z.enum(LANDING_PAGE_THEME_KEYS).default(DEFAULT_LANDING_PAGE_THEME_KEY);
const textEmphasisPresetSchema = z.enum(LANDING_TEXT_EMPHASIS_PRESETS).default(DEFAULT_LANDING_TEXT_EMPHASIS_PRESET);
const surfaceToneSchema = z.enum(LANDING_SURFACE_TONES).default(DEFAULT_LANDING_SURFACE_TONE);
const heroMediaLayoutSchema = z.enum(PAGE_MEDIA_HERO_LAYOUTS).default(DEFAULT_PAGE_MEDIA_SETTINGS.heroLayout);
const galleryLayoutSchema = z.enum(PAGE_MEDIA_GALLERY_LAYOUTS).default(DEFAULT_PAGE_MEDIA_SETTINGS.galleryLayout);
const galleryAspectRatioSchema = z.enum(PAGE_MEDIA_GALLERY_ASPECT_RATIOS).default(DEFAULT_PAGE_MEDIA_SETTINGS.galleryAspectRatio);
const galleryGroupingSchema = z.enum(PAGE_MEDIA_GALLERY_GROUPINGS).default(DEFAULT_PAGE_MEDIA_SETTINGS.galleryGrouping);

const seoSchema = z.object({
  metaTitle: optionalNonEmptyString,
  metaDescription: optionalNonEmptyString,
  canonicalIntent: optionalNonEmptyString,
  indexationFlag: z.enum(["index", "noindex"]).default("index"),
  openGraphTitle: optionalNonEmptyString,
  openGraphDescription: optionalNonEmptyString,
  openGraphImageAssetId: optionalNonEmptyString
});

const pageMediaSettingsSchema = z.object({
  heroLayout: heroMediaLayoutSchema,
  galleryLayout: galleryLayoutSchema,
  galleryAspectRatio: galleryAspectRatioSchema,
  galleryGrouping: galleryGroupingSchema,
  showGalleryCaptions: z.boolean().default(DEFAULT_PAGE_MEDIA_SETTINGS.showGalleryCaptions)
});

const heroBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.HERO),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString,
  ctaLabel: optionalNonEmptyString,
  mediaAssetId: optionalNonEmptyString,
  mediaLayout: heroMediaLayoutSchema,
  textEmphasisPreset: textEmphasisPresetSchema,
  surfaceTone: surfaceToneSchema
});

const richTextBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.RICH_TEXT),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  body: nonEmptyString,
  textEmphasisPreset: textEmphasisPresetSchema,
  surfaceTone: surfaceToneSchema
});

const serviceListBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.SERVICE_LIST),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  serviceIds: stringList
});

const caseListBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CASE_LIST),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  caseIds: stringList
});

const galleryBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.GALLERY),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  galleryIds: stringList,
  layoutPreset: galleryLayoutSchema,
  aspectRatioPreset: galleryAspectRatioSchema,
  groupingMode: galleryGroupingSchema,
  showCaptions: z.boolean().default(DEFAULT_PAGE_MEDIA_SETTINGS.showGalleryCaptions)
});

const ctaBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CTA),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString,
  ctaLabel: optionalNonEmptyString,
  textEmphasisPreset: textEmphasisPresetSchema,
  surfaceTone: surfaceToneSchema
});

const contactBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CONTACT),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString,
  textEmphasisPreset: textEmphasisPresetSchema,
  surfaceTone: surfaceToneSchema
});

const pageBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  richTextBlockSchema,
  serviceListBlockSchema,
  caseListBlockSchema,
  galleryBlockSchema,
  ctaBlockSchema,
  contactBlockSchema
]);

const pageSectionBaseSchema = z.object({
  order: z.number().int().nonnegative()
});

const pageSectionSchema = z.discriminatedUnion("type", [
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.HERO_OFFER),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString,
    ctaLabel: optionalNonEmptyString,
    trustText: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.RICH_TEXT),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.CONTACT_DETAILS),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.SERVICE_SCOPE),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.EQUIPMENT_SPECS),
    title: optionalNonEmptyString,
    items: stringList
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.GEO_COVERAGE),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.PROOF_CASES),
    title: optionalNonEmptyString,
    caseIds: stringList,
    galleryIds: stringList
  }),
  pageSectionBaseSchema.extend({
    type: z.literal(PAGE_SECTION_TYPES.CTA),
    title: optionalNonEmptyString,
    body: optionalNonEmptyString,
    ctaLabel: optionalNonEmptyString
  })
]);

const globalSettingsSchema = z.object({
  publicBrandName: nonEmptyString,
  legalName: nonEmptyString,
  primaryPhone: optionalNonEmptyString,
  activeMessengers: stringList,
  publicEmail: optionalNonEmptyString,
  serviceArea: optionalNonEmptyString,
  primaryRegion: optionalNonEmptyString,
  defaultCtaLabel: optionalNonEmptyString,
  defaultCtaDescription: optionalNonEmptyString,
  organization: z.object({
    city: optionalNonEmptyString,
    country: optionalNonEmptyString
  }).default({ city: "", country: "" }),
  contactTruthConfirmed: z.boolean().default(false),
  seo: seoSchema.default({})
});

const mediaAssetSchema = z.object({
  assetType: z.enum(["image"]).default("image"),
  storageKey: optionalNonEmptyString,
  mimeType: optionalNonEmptyString,
  originalFilename: optionalNonEmptyString,
  title: optionalNonEmptyString,
  alt: optionalNonEmptyString,
  caption: optionalNonEmptyString,
  ownershipNote: optionalNonEmptyString,
  sourceNote: optionalNonEmptyString,
  uploadedBy: optionalNonEmptyString,
  uploadedAt: optionalNonEmptyString,
  sizeBytes: z.number().int().nonnegative().default(0),
  status: z.enum(["draft_asset", "ready"]).default("draft_asset"),
  lifecycleState: z.enum(["active", "archived"]).default("active")
});

const gallerySchema = z.object({
  title: nonEmptyString,
  primaryAssetId: optionalNonEmptyString,
  assetIds: stringList,
  caption: optionalNonEmptyString,
  relatedEntityIds: stringList,
  seo: seoSchema.default({})
});

const serviceSchema = z.object({
  slug: nonEmptyString,
  title: nonEmptyString,
  h1: nonEmptyString,
  summary: nonEmptyString,
  serviceScope: nonEmptyString,
  problemsSolved: optionalNonEmptyString,
  methods: optionalNonEmptyString,
  ctaVariant: nonEmptyString,
  equipmentIds: stringList,
  relatedCaseIds: stringList,
  galleryIds: stringList,
  primaryMediaAssetId: optionalNonEmptyString,
  seo: seoSchema.default({})
});

const equipmentSchema = z.object({
  slug: nonEmptyString,
  locale: nonEmptyString.default("ru-RU"),
  status: z.enum(["draft", "ready", "archived"]).default("draft"),
  title: nonEmptyString,
  equipmentType: nonEmptyString,
  shortSummary: nonEmptyString,
  capabilitySummary: nonEmptyString,
  keySpecs: stringList,
  usageScenarios: stringList,
  operatorMode: optionalNonEmptyString,
  primaryMediaAssetId: optionalNonEmptyString,
  galleryIds: stringList,
  relatedCaseIds: stringList,
  serviceIds: stringList,
  seo: seoSchema.default({})
});

const caseSchema = z.object({
  slug: nonEmptyString,
  title: nonEmptyString,
  location: nonEmptyString,
  projectType: optionalNonEmptyString,
  task: nonEmptyString,
  workScope: nonEmptyString,
  result: nonEmptyString,
  serviceIds: stringList,
  equipmentIds: stringList,
  galleryIds: stringList,
  primaryMediaAssetId: optionalNonEmptyString,
  seo: seoSchema.default({})
});

const pageSchema = z.object({
  slug: nonEmptyString,
  pageType: z.enum([
    PAGE_TYPES.ABOUT,
    PAGE_TYPES.CONTACTS,
    PAGE_TYPES.SERVICE_LANDING,
    PAGE_TYPES.EQUIPMENT_LANDING
  ]),
  pageThemeKey: pageThemeKeySchema,
  title: nonEmptyString,
  h1: nonEmptyString,
  intro: optionalNonEmptyString,
  primaryMediaAssetId: optionalNonEmptyString,
  mediaSettings: pageMediaSettingsSchema.default(DEFAULT_PAGE_MEDIA_SETTINGS),
  sourceRefs: z.object({
    primaryServiceId: optionalNonEmptyString,
    primaryEquipmentId: optionalNonEmptyString,
    caseIds: stringList,
    galleryIds: stringList
  }).default({ primaryServiceId: "", primaryEquipmentId: "", caseIds: [], galleryIds: [] }),
  targeting: z.object({
    geoLabel: optionalNonEmptyString,
    city: optionalNonEmptyString,
    district: optionalNonEmptyString,
    serviceArea: optionalNonEmptyString
  }).default({ geoLabel: "", city: "", district: "", serviceArea: "" }),
  sections: z.array(pageSectionSchema).default([]),
  blocks: z.array(pageBlockSchema).default([]),
  seo: seoSchema.default({})
});

export function validatePayload(entityType, payload) {
  switch (entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      return globalSettingsSchema.parse(payload);
    case ENTITY_TYPES.MEDIA_ASSET:
      return mediaAssetSchema.parse(payload);
    case ENTITY_TYPES.GALLERY:
      return gallerySchema.parse(payload);
    case ENTITY_TYPES.SERVICE:
      return serviceSchema.parse(payload);
    case ENTITY_TYPES.EQUIPMENT:
      return equipmentSchema.parse(payload);
    case ENTITY_TYPES.CASE:
      return caseSchema.parse(payload);
    case ENTITY_TYPES.PAGE:
      return pageSchema.parse(payload);
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

export function getTopLevelFieldsForEntityType(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      return ["publicBrandName", "legalName", "primaryPhone", "activeMessengers", "publicEmail", "serviceArea", "primaryRegion", "defaultCtaLabel", "defaultCtaDescription", "contactTruthConfirmed"];
    case ENTITY_TYPES.MEDIA_ASSET:
      return ["title", "alt", "caption", "ownershipNote", "sourceNote", "storageKey", "mimeType", "originalFilename", "status", "lifecycleState"];
    case ENTITY_TYPES.GALLERY:
      return ["title", "primaryAssetId", "assetIds", "caption", "relatedEntityIds"];
    case ENTITY_TYPES.SERVICE:
      return ["slug", "title", "h1", "summary", "serviceScope", "problemsSolved", "methods", "ctaVariant", "equipmentIds", "relatedCaseIds", "galleryIds", "primaryMediaAssetId"];
    case ENTITY_TYPES.EQUIPMENT:
      return ["slug", "locale", "status", "title", "equipmentType", "shortSummary", "capabilitySummary", "keySpecs", "usageScenarios", "operatorMode", "primaryMediaAssetId", "galleryIds", "relatedCaseIds", "serviceIds"];
    case ENTITY_TYPES.CASE:
      return ["slug", "title", "location", "projectType", "task", "workScope", "result", "serviceIds", "equipmentIds", "galleryIds", "primaryMediaAssetId"];
    case ENTITY_TYPES.PAGE:
      return ["slug", "pageType", "pageThemeKey", "title", "h1", "intro", "primaryMediaAssetId", "mediaSettings", "sourceRefs", "targeting", "sections", "blocks"];
    default:
      return [];
  }
}
