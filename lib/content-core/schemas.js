import { z } from "zod";

import { BLOCK_TYPES, ENTITY_TYPES, PAGE_TYPES } from "./content-types.js";

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z.string().trim().optional().default("");
const idArray = z.array(nonEmptyString).default([]);

const seoSchema = z.object({
  metaTitle: optionalNonEmptyString,
  metaDescription: optionalNonEmptyString,
  canonicalIntent: optionalNonEmptyString,
  indexationFlag: z.enum(["index", "noindex"]).default("index"),
  openGraphTitle: optionalNonEmptyString,
  openGraphDescription: optionalNonEmptyString,
  openGraphImageAssetId: z.string().trim().optional().default("")
});

const heroBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.HERO),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString,
  ctaLabel: optionalNonEmptyString,
  mediaAssetId: z.string().trim().optional().default("")
});

const richTextBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.RICH_TEXT),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  body: nonEmptyString
});

const serviceListBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.SERVICE_LIST),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  serviceIds: idArray
});

const caseListBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CASE_LIST),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  caseIds: idArray
});

const galleryBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.GALLERY),
  order: z.number().int().nonnegative(),
  title: optionalNonEmptyString,
  galleryIds: idArray
});

const ctaBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CTA),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString,
  ctaLabel: optionalNonEmptyString
});

const contactBlockSchema = z.object({
  type: z.literal(BLOCK_TYPES.CONTACT),
  order: z.number().int().nonnegative(),
  title: nonEmptyString,
  body: optionalNonEmptyString
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

const globalSettingsSchema = z.object({
  publicBrandName: nonEmptyString,
  legalName: nonEmptyString,
  primaryPhone: optionalNonEmptyString,
  activeMessengers: z.array(nonEmptyString).default([]),
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
  assetIds: idArray,
  caption: optionalNonEmptyString,
  relatedEntityIds: idArray,
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
  relatedCaseIds: idArray,
  galleryIds: idArray,
  primaryMediaAssetId: optionalNonEmptyString,
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
  serviceIds: idArray,
  galleryIds: idArray,
  primaryMediaAssetId: optionalNonEmptyString,
  seo: seoSchema.default({})
});

const pageSchema = z.object({
  slug: nonEmptyString,
  pageType: z.enum([PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS]),
  title: nonEmptyString,
  h1: nonEmptyString,
  intro: optionalNonEmptyString,
  blocks: z.array(pageBlockSchema).default([]),
  primaryMediaAssetId: optionalNonEmptyString,
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
      return ["slug", "title", "h1", "summary", "serviceScope", "problemsSolved", "methods", "ctaVariant", "relatedCaseIds", "galleryIds", "primaryMediaAssetId"];
    case ENTITY_TYPES.CASE:
      return ["slug", "title", "location", "projectType", "task", "workScope", "result", "serviceIds", "galleryIds", "primaryMediaAssetId"];
    case ENTITY_TYPES.PAGE:
      return ["slug", "pageType", "title", "h1", "intro", "blocks", "primaryMediaAssetId"];
    default:
      return [];
  }
}
