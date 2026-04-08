import { z } from "zod";

import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import { normalizeEntityInput } from "../content-core/pure.js";
import { assemblePromptPacket } from "../ai-workspace/prompt.js";
import { requestStructuredArtifact } from "../llm/facade.js";
import { createId } from "../utils/id.js";

const nonEmptyString = z.string().trim().min(1);
const optionalString = z.string().trim().optional().default("");
const idArray = z.array(nonEmptyString).default([]);

const seoSchema = z.object({
  metaTitle: optionalString,
  metaDescription: optionalString,
  canonicalIntent: optionalString,
  indexationFlag: z.enum(["index", "noindex"]).default("index"),
  openGraphTitle: optionalString,
  openGraphDescription: optionalString,
  openGraphImageAssetId: optionalString
}).strict();

export const LANDING_WORKSPACE_SPEC_VERSION = "v1";
export const LANDING_WORKSPACE_ROUTE_FAMILY = "landing";
export const LANDING_WORKSPACE_WORKSPACE_KEY = "landing_workspace";
export const LANDING_WORKSPACE_ARTIFACT_CLASS = "landing_workspace_draft";
export const LANDING_WORKSPACE_COMPOSITION_FAMILY = "landing";

// Legacy Page-shaped section registry kept only for compatibility projection.
// The landing-first runtime should prefer LANDING_WORKSPACE_BLOCK_REGISTRY below.
export const LANDING_WORKSPACE_SECTION_REGISTRY = Object.freeze([
  { id: "landing_hero", label: "Главный блок", renderTarget: "Главный блок страницы", required: true, sourceFields: ["title", "h1"] },
  { id: "landing_intro", label: "Вступление", renderTarget: "Вступительный текст под главным блоком", required: false, sourceFields: ["intro"] },
  { id: "primary_media", label: "Основное медиа", renderTarget: "Главное изображение", required: false, sourceFields: ["primaryMediaAssetId"] },
  { id: "landing_body", label: "Основной текст", renderTarget: "Текстовый блок", required: false, sourceFields: ["body"] },
  { id: "related_services", label: "Связанные услуги", renderTarget: "Карточки услуг", required: false, sourceFields: ["serviceIds"] },
  { id: "related_cases", label: "Связанные кейсы", renderTarget: "Карточки кейсов", required: false, sourceFields: ["caseIds"] },
  { id: "gallery", label: "Галерея", renderTarget: "Раздел галереи", required: false, sourceFields: ["galleryIds"] },
  { id: "cta_band", label: "Блок с кнопкой", renderTarget: "Блок призыва к действию", required: false, sourceFields: ["ctaTitle", "ctaBody", "defaultBlockCtaLabel", "contactNote"] }
]);

export const landingWorkspaceCandidatePayloadSchema = z.object({
  pageType: z.enum([PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS]).default(PAGE_TYPES.ABOUT),
  slug: nonEmptyString,
  title: nonEmptyString,
  h1: nonEmptyString,
  intro: optionalString,
  body: optionalString,
  contactNote: optionalString,
  ctaTitle: optionalString,
  ctaBody: optionalString,
  defaultBlockCtaLabel: optionalString,
  serviceIds: idArray,
  caseIds: idArray,
  galleryIds: idArray,
  primaryMediaAssetId: optionalString,
  seo: seoSchema.default({})
}).strict();

export const landingWorkspaceCandidateResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pageType: { type: "string", enum: [PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS] },
    slug: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    h1: { type: "string", minLength: 1 },
    intro: { type: "string" },
    body: { type: "string" },
    contactNote: { type: "string" },
    ctaTitle: { type: "string" },
    ctaBody: { type: "string" },
    defaultBlockCtaLabel: { type: "string" },
    serviceIds: { type: "array", items: { type: "string", minLength: 1 } },
    caseIds: { type: "array", items: { type: "string", minLength: 1 } },
    galleryIds: { type: "array", items: { type: "string", minLength: 1 } },
    primaryMediaAssetId: { type: "string" },
    seo: {
      type: "object",
      additionalProperties: false,
      properties: {
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
        canonicalIntent: { type: "string" },
        indexationFlag: { type: "string", enum: ["index", "noindex"] },
        openGraphTitle: { type: "string" },
        openGraphDescription: { type: "string" },
        openGraphImageAssetId: { type: "string" }
      },
      required: [
        "metaTitle",
        "metaDescription",
        "canonicalIntent",
        "indexationFlag",
        "openGraphTitle",
        "openGraphDescription",
        "openGraphImageAssetId"
      ]
    }
  },
  required: [
    "pageType",
    "slug",
    "title",
    "h1",
    "intro",
    "body",
    "contactNote",
    "ctaTitle",
    "ctaBody",
    "defaultBlockCtaLabel",
    "serviceIds",
    "caseIds",
    "galleryIds",
    "primaryMediaAssetId",
    "seo"
  ]
};

// Legacy compatibility registry. The landing-first runtime now prefers the
// canonical draft/block model declared below and only projects through this
// shape when it has to interoperate with the current Page renderer/save path.
const legacyLandingWorkspacePayloadSchema = landingWorkspaceCandidatePayloadSchema;
const legacyLandingWorkspaceResponseJsonSchema = landingWorkspaceCandidateResponseJsonSchema;

export const LANDING_WORKSPACE_BLOCK_REGISTRY = Object.freeze([
  { id: "landing_hero", label: "Hero", renderTarget: "Top landing block", required: true, sourceFields: ["title", "hero.headline"] },
  { id: "media_strip", label: "Media Strip", renderTarget: "Support media strip", required: false, sourceFields: ["mediaAssetIds"] },
  { id: "service_cards", label: "Service Cards", renderTarget: "Service proof cards", required: false, sourceFields: ["serviceCardIds"] },
  { id: "case_cards", label: "Case Cards", renderTarget: "Case proof cards", required: false, sourceFields: ["caseCardIds"] },
  { id: "content_band", label: "Content Band", renderTarget: "Supporting copy block", required: false, sourceFields: ["contentBand.body", "contentBand.subtitle"] },
  { id: "cta_band", label: "CTA Band", renderTarget: "Final call-to-action block", required: false, sourceFields: ["ctaVariant", "ctaBand.title", "ctaBand.body", "ctaBand.note"] }
]);

export const LANDING_WORKSPACE_SHELL_REGION_REGISTRY = Object.freeze([
  { id: "landing_header", label: "Landing Header", sourceField: "shellRegions.headerRef" },
  { id: "landing_footer", label: "Landing Footer", sourceField: "shellRegions.footerRef" }
]);

const LANDING_WORKSPACE_SHELL_REGION_IDS = new Set(
  LANDING_WORKSPACE_SHELL_REGION_REGISTRY.map((region) => region.id)
);

const landingWorkspaceDraftHeroSchema = z.object({
  headline: nonEmptyString,
  body: optionalString,
  mediaAssetId: optionalString
}).strict();

const landingWorkspaceDraftContentBandSchema = z.object({
  body: optionalString,
  subtitle: optionalString
}).strict();

const landingWorkspaceDraftCtaBandSchema = z.object({
  title: optionalString,
  body: optionalString,
  note: optionalString
}).strict();

const landingWorkspaceDraftShellSchema = z.object({
  headerRef: z.literal("landing_header").default("landing_header"),
  footerRef: z.literal("landing_footer").default("landing_footer")
}).strict();

export const landingWorkspaceDraftSchema = z.object({
  compositionFamily: z.literal(LANDING_WORKSPACE_COMPOSITION_FAMILY).default(LANDING_WORKSPACE_COMPOSITION_FAMILY),
  pageType: z.enum([PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS]).default(PAGE_TYPES.ABOUT),
  slug: nonEmptyString,
  title: nonEmptyString,
  hero: landingWorkspaceDraftHeroSchema,
  mediaAssetIds: idArray,
  serviceCardIds: idArray,
  caseCardIds: idArray,
  contentBand: landingWorkspaceDraftContentBandSchema.default({}),
  ctaVariant: optionalString,
  ctaBand: landingWorkspaceDraftCtaBandSchema.default({}),
  shellRegions: landingWorkspaceDraftShellSchema.default({
    headerRef: "landing_header",
    footerRef: "landing_footer"
  }),
  seo: seoSchema.default({})
}).strict();

export const landingWorkspaceDraftResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    compositionFamily: { type: "string", enum: [LANDING_WORKSPACE_COMPOSITION_FAMILY] },
    pageType: { type: "string", enum: [PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS] },
    slug: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    hero: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string", minLength: 1 },
        body: { type: "string" },
        mediaAssetId: { type: "string" }
      },
      required: ["headline", "body", "mediaAssetId"]
    },
    mediaAssetIds: { type: "array", items: { type: "string", minLength: 1 } },
    serviceCardIds: { type: "array", items: { type: "string", minLength: 1 } },
    caseCardIds: { type: "array", items: { type: "string", minLength: 1 } },
    contentBand: {
      type: "object",
      additionalProperties: false,
      properties: {
        body: { type: "string" },
        subtitle: { type: "string" }
      },
      required: ["body", "subtitle"]
    },
    ctaVariant: { type: "string" },
    ctaBand: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        note: { type: "string" }
      },
      required: ["title", "body", "note"]
    },
    shellRegions: {
      type: "object",
      additionalProperties: false,
      properties: {
        headerRef: { type: "string", enum: ["landing_header"] },
        footerRef: { type: "string", enum: ["landing_footer"] }
      },
      required: ["headerRef", "footerRef"]
    },
    seo: legacyLandingWorkspaceResponseJsonSchema.properties.seo
  },
  required: [
    "compositionFamily",
    "pageType",
    "slug",
    "title",
    "hero",
    "mediaAssetIds",
    "serviceCardIds",
    "caseCardIds",
    "contentBand",
    "ctaVariant",
    "ctaBand",
    "shellRegions",
    "seo"
  ]
};

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function compactText(value) {
  if (!hasText(value)) {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function toCompactList(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => asString(item))
    .filter(Boolean);
}

function extractSeoInput(payload = {}) {
  const seo = payload?.seo && typeof payload.seo === "object"
    ? payload.seo
    : {};

  return {
    metaTitle: payload.metaTitle ?? seo.metaTitle,
    metaDescription: payload.metaDescription ?? seo.metaDescription,
    canonicalIntent: payload.canonicalIntent ?? seo.canonicalIntent,
    indexationFlag: payload.indexationFlag ?? seo.indexationFlag ?? "index",
    openGraphTitle: payload.openGraphTitle ?? seo.openGraphTitle,
    openGraphDescription: payload.openGraphDescription ?? seo.openGraphDescription,
    openGraphImageAssetId: payload.openGraphImageAssetId ?? seo.openGraphImageAssetId
  };
}

function buildDefaultShellRegions(input = {}) {
  return {
    headerRef: asString(input.headerRef) || "landing_header",
    footerRef: asString(input.footerRef) || "landing_footer"
  };
}

function buildDraftFromLegacyPayload(payload = {}) {
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  const heroBlock = blocks.find((block) => block.type === "hero") ?? null;
  const richTextBlock = blocks.find((block) => block.type === "rich_text") ?? null;
  const serviceListBlock = blocks.find((block) => block.type === "service_list") ?? null;
  const caseListBlock = blocks.find((block) => block.type === "case_list") ?? null;
  const galleryBlock = blocks.find((block) => block.type === "gallery") ?? null;
  const contactBlock = blocks.find((block) => block.type === "contact") ?? null;
  const ctaBlock = blocks.find((block) => block.type === "cta") ?? null;

  return {
    compositionFamily: LANDING_WORKSPACE_COMPOSITION_FAMILY,
    pageType: asString(payload.pageType) || PAGE_TYPES.ABOUT,
    slug: asString(payload.slug),
    title: asString(payload.title),
    hero: {
      headline: asString(payload.h1) || asString(heroBlock?.title),
      body: asString(payload.intro) || asString(heroBlock?.body),
      mediaAssetId: asString(payload.primaryMediaAssetId) || asString(heroBlock?.mediaAssetId)
    },
    mediaAssetIds: toCompactList(payload.galleryIds ?? galleryBlock?.galleryIds),
    serviceCardIds: toCompactList(payload.serviceIds ?? serviceListBlock?.serviceIds),
    caseCardIds: toCompactList(payload.caseIds ?? caseListBlock?.caseIds),
    contentBand: {
      body: asString(payload.body) || asString(richTextBlock?.body),
      subtitle: ""
    },
    ctaVariant: asString(payload.defaultBlockCtaLabel) || asString(ctaBlock?.ctaLabel) || asString(heroBlock?.ctaLabel),
    ctaBand: {
      title: asString(payload.ctaTitle) || asString(ctaBlock?.title),
      body: asString(payload.ctaBody) || asString(ctaBlock?.body),
      note: asString(payload.contactNote) || asString(contactBlock?.body)
    },
    shellRegions: buildDefaultShellRegions(payload.shellRegions),
    seo: extractSeoInput(payload)
  };
}

export function buildLandingWorkspacePagePayload(candidatePayload = {}) {
  const draft = projectLandingWorkspaceCandidatePayload(candidatePayload);

  return {
    pageType: draft.pageType,
    slug: draft.slug,
    title: draft.title,
    h1: draft.hero.headline,
    intro: draft.hero.body,
    body: draft.contentBand.body,
    contactNote: draft.ctaBand.note,
    ctaTitle: draft.ctaBand.title,
    ctaBody: draft.ctaBand.body,
    defaultBlockCtaLabel: draft.ctaVariant,
    serviceIds: draft.serviceCardIds,
    caseIds: draft.caseCardIds,
    galleryIds: draft.mediaAssetIds,
    primaryMediaAssetId: draft.hero.mediaAssetId,
    seo: draft.seo ?? {}
  };
}

export function projectLandingWorkspaceShellRegions(payload = {}) {
  const draft = projectLandingWorkspaceCandidatePayload(payload);

  return LANDING_WORKSPACE_SHELL_REGION_REGISTRY.map((region) => ({
    id: region.id,
    label: region.label,
    fixed: true,
    ref: region.id === "landing_header" ? draft.shellRegions.headerRef : draft.shellRegions.footerRef,
    status: "fixed"
  }));
}

export function projectLandingWorkspaceCandidatePayload(payload = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Landing workspace payload must be an object.");
  }

  const looksCanonical = payload.compositionFamily === LANDING_WORKSPACE_COMPOSITION_FAMILY
    || Object.prototype.hasOwnProperty.call(payload, "hero")
    || Object.prototype.hasOwnProperty.call(payload, "contentBand")
    || Object.prototype.hasOwnProperty.call(payload, "ctaBand")
    || Object.prototype.hasOwnProperty.call(payload, "shellRegions")
    || Object.prototype.hasOwnProperty.call(payload, "serviceCardIds")
    || Object.prototype.hasOwnProperty.call(payload, "caseCardIds")
    || Object.prototype.hasOwnProperty.call(payload, "mediaAssetIds");

  if (looksCanonical) {
    return landingWorkspaceDraftSchema.parse({
      compositionFamily: payload.compositionFamily ?? LANDING_WORKSPACE_COMPOSITION_FAMILY,
      pageType: payload.pageType,
      slug: payload.slug,
      title: payload.title,
      hero: payload.hero ?? {},
      mediaAssetIds: payload.mediaAssetIds ?? [],
      serviceCardIds: payload.serviceCardIds ?? [],
      caseCardIds: payload.caseCardIds ?? [],
      contentBand: payload.contentBand ?? {},
      ctaVariant: payload.ctaVariant,
      ctaBand: payload.ctaBand ?? {},
      shellRegions: buildDefaultShellRegions(payload.shellRegions),
      seo: extractSeoInput(payload)
    });
  }

  return landingWorkspaceDraftSchema.parse(
    buildDraftFromLegacyPayload(payload)
  );
}

export function buildLandingWorkspacePreviewPayload(candidatePayload = {}) {
  const projectedPayload = buildLandingWorkspacePagePayload(candidatePayload);
  const seo = projectedPayload.seo ?? {};

  return normalizeEntityInput(ENTITY_TYPES.PAGE, {
    ...projectedPayload,
    ...seo
  });
}

function makeReportIssue(severity, classId, code, message, field = null) {
  return { severity, classId, code, message, field };
}

function collectReadinessIssues(readiness = null) {
  const results = Array.isArray(readiness?.results) ? readiness.results : [];

  return {
    structural: results.filter((result) => /^missing_/.test(result.code) && /slug|page|block|hero|body|cta/i.test(result.code)),
    reference: results.filter((result) => /^(invalid_|unpublished_)/.test(result.code)),
    editorial: results.filter((result) => !/^(invalid_|unpublished_)/.test(result.code))
  };
}

export function projectLandingWorkspaceSections(payload = {}) {
  const draft = projectLandingWorkspaceCandidatePayload(payload);

  return LANDING_WORKSPACE_BLOCK_REGISTRY.map((section) => {
    let present = false;

    switch (section.id) {
      case "landing_hero":
        present = hasText(draft.title) && hasText(draft.hero?.headline);
        break;
      case "media_strip":
        present = toCompactList(draft.mediaAssetIds).length > 0;
        break;
      case "service_cards":
        present = toCompactList(draft.serviceCardIds).length > 0;
        break;
      case "case_cards":
        present = toCompactList(draft.caseCardIds).length > 0;
        break;
      case "content_band":
        present = hasText(draft.contentBand?.body) || hasText(draft.contentBand?.subtitle);
        break;
      case "cta_band":
        present = hasText(draft.ctaVariant)
          || hasText(draft.ctaBand?.title)
          || hasText(draft.ctaBand?.body)
          || hasText(draft.ctaBand?.note);
        break;
      default:
        present = false;
        break;
    }

    return {
      id: section.id,
      label: section.label,
      renderTarget: section.renderTarget,
      required: section.required,
      sourceFields: section.sourceFields,
      status: present ? "present" : section.required ? "missing" : "absent"
    };
  });
}

export function buildLandingWorkspaceProofBasis(payload = {}) {
  const candidatePayload = projectLandingWorkspaceCandidatePayload(payload);

  return [
    ...(Array.isArray(candidatePayload.serviceCardIds) ? candidatePayload.serviceCardIds : []),
    ...(Array.isArray(candidatePayload.caseCardIds) ? candidatePayload.caseCardIds : []),
    ...(Array.isArray(candidatePayload.mediaAssetIds) ? candidatePayload.mediaAssetIds : []),
    asString(candidatePayload.hero?.mediaAssetId)
  ].filter(Boolean);
}

export function buildLandingWorkspaceSourceContextSummary({
  pageId = "",
  pageType = "",
  baseRevision = null,
  currentRevision = null,
  changeIntent = "",
  proofBasis = [],
  variantKey = ""
} = {}) {
  const parts = [];

  if (hasText(pageId)) {
    parts.push(`page=${pageId}`);
  }

  if (hasText(pageType)) {
    parts.push(`pageType=${compactText(pageType)}`);
  }

  if (baseRevision?.id) {
    parts.push(`baseRevision=${baseRevision.id}`);
  }

  if (currentRevision?.id) {
    parts.push(`draftRevision=${currentRevision.id}`);
  }

  if (hasText(variantKey)) {
    parts.push(`variant=${compactText(variantKey)}`);
  }

  if (hasText(changeIntent)) {
    parts.push(`intent=${compactText(changeIntent)}`);
  }

  const proof = toCompactList(proofBasis);

  if (proof.length > 0) {
    parts.push(`proof=${proof.join(", ")}`);
  }

  return parts.join(" | ").slice(0, 700) || "черновик лендинга";
}

export function buildLandingWorkspaceCandidateRequest(input = {}) {
  const normalizedPayload = projectLandingWorkspaceCandidatePayload(input.sourcePayload);
  const proofBasis = Array.isArray(input.proofBasis) ? input.proofBasis : buildLandingWorkspaceProofBasis(normalizedPayload);
  const sourceContextSummary = input.sourceContextSummary || buildLandingWorkspaceSourceContextSummary({
    pageId: input.pageId,
    pageType: normalizedPayload.pageType,
    baseRevision: input.baseRevision,
    currentRevision: input.currentRevision,
    changeIntent: input.changeIntent,
    proofBasis,
    variantKey: input.variantKey
  });

  // Prompt assembly stays pure; the LLM boundary lives in requestStructuredArtifact elsewhere.
  const promptPacket = assemblePromptPacket({
    requestScope: {
      workspace: LANDING_WORKSPACE_WORKSPACE_KEY,
      action: "generate_candidate",
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    },
    memoryContext: input.memorySlice ?? {},
    canonicalContext: {
      pageId: input.pageId ?? "",
      landingDraftId: input.landingDraftId ?? "",
      compositionFamily: LANDING_WORKSPACE_COMPOSITION_FAMILY,
      pageType: normalizedPayload.pageType,
      baseRevisionId: input.baseRevision?.id ?? input.baseRevisionId ?? "",
      currentRevisionId: input.currentRevision?.id ?? "",
      changeIntent: input.changeIntent ?? "",
      proofBasis,
      sourceContextSummary,
      variantKey: input.variantKey ?? "",
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    },
    artifactContract: {
      artifactClass: LANDING_WORKSPACE_ARTIFACT_CLASS,
      schemaId: "landing_workspace_draft.v1",
      schemaVersion: LANDING_WORKSPACE_SPEC_VERSION
    },
    actionSlices: [
      {
        id: "landing_workspace_generation",
        title: "Генерация черновика лендинга",
        content: [
          "Сформируйте кандидат лендинга, привязанный к странице-источнику.",
          "Верните только JSON, который в точности соответствует схеме.",
          "Не придумывайте нового владельца страницы, маршрут или источник истины. Привязка pageId уже зафиксирована.",
          "Сохраните совместимость с текущим рендером страницы и потоком публикации.",
          "Используйте только переданную страницу-источник и доказательства. Если поле нельзя подтвердить, сохраните текущую истину или оставьте необязательное поле пустым.",
          `Контекст источника: ${sourceContextSummary || "черновик лендинга"}`,
          "Исходная страница:",
          JSON.stringify(normalizedPayload, null, 2)
        ]
      }
    ]
  });

  return {
    artifactClass: LANDING_WORKSPACE_ARTIFACT_CLASS,
    schemaId: "landing_workspace_draft.v1",
    schemaVersion: LANDING_WORKSPACE_SPEC_VERSION,
    schemaValidator: landingWorkspaceDraftSchema,
    responseJsonSchema: landingWorkspaceDraftResponseJsonSchema,
    promptPacket,
    prompt: promptPacket.prompt,
    sourceContextSummary,
    normalizedPayload
  };
}

export function buildLandingWorkspaceCandidateSpec({
  candidateId = createId("landing_candidate"),
  pageId = "",
  landingDraftId = "",
  baseRevisionId = "",
  routeFamily = LANDING_WORKSPACE_ROUTE_FAMILY,
  sourceContextSummary = "",
  payload
} = {}) {
  const normalizedPayload = projectLandingWorkspaceCandidatePayload(payload);
  const blocks = projectLandingWorkspaceSections(normalizedPayload);

  return {
    specVersion: LANDING_WORKSPACE_SPEC_VERSION,
    compositionFamily: LANDING_WORKSPACE_COMPOSITION_FAMILY,
    candidateId,
    pageId,
    landingDraftId,
    baseRevisionId,
    routeFamily,
    sourceContextSummary,
    draft: normalizedPayload,
    // Compatibility projection for the current Page save/render path only.
    payload: buildLandingWorkspacePagePayload(normalizedPayload),
    blocks,
    // Keep legacy "sections" as an explicit alias while the UI/review path catches up.
    sections: blocks,
    shellRegions: projectLandingWorkspaceShellRegions(normalizedPayload)
  };
}

export function buildLandingWorkspaceDerivedArtifactSlice({
  candidateSpec = null,
  previewMode = "desktop",
  verificationSummary = "",
  reviewStatus = ""
} = {}) {
  if (!candidateSpec || typeof candidateSpec !== "object") {
    return null;
  }

  const candidatePayload = projectLandingWorkspaceCandidatePayload(
    candidateSpec.draft
      ?? candidateSpec.candidatePayload
      ?? candidateSpec.payload
      ?? {}
  );
  const blocks = Array.isArray(candidateSpec.blocks)
    ? candidateSpec.blocks
    : projectLandingWorkspaceSections(candidatePayload);
  const shellRegions = Array.isArray(candidateSpec.shellRegions)
    ? candidateSpec.shellRegions
    : projectLandingWorkspaceShellRegions(candidatePayload);

  return {
    ...candidateSpec,
    compositionFamily: LANDING_WORKSPACE_COMPOSITION_FAMILY,
    candidatePayload,
    draft: candidatePayload,
    pagePayload: buildLandingWorkspacePagePayload(candidatePayload),
    blocks,
    sections: blocks,
    shellRegions,
    payload: buildLandingWorkspacePreviewPayload(candidatePayload),
    previewMode: hasText(previewMode) ? compactText(previewMode) : "desktop",
    verificationSummary: compactText(verificationSummary),
    reviewStatus: compactText(reviewStatus)
  };
}

export function buildLandingWorkspaceVerificationReport({
  candidateSpec,
  readiness = null,
  revision = null,
  llmResult = null
} = {}) {
  const candidatePayload = projectLandingWorkspaceCandidatePayload(
    candidateSpec?.draft
      ?? candidateSpec?.candidatePayload
      ?? candidateSpec?.pagePayload
      ?? candidateSpec?.payload
      ?? {}
  );
  const projectedSections = projectLandingWorkspaceSections(candidatePayload);
  const sections = Array.isArray(candidateSpec?.blocks)
    ? candidateSpec.blocks
    : Array.isArray(candidateSpec?.sections)
      ? candidateSpec.sections
      : projectedSections;
  const projectedShellRegions = projectLandingWorkspaceShellRegions(candidatePayload);
  const shellRegions = Array.isArray(candidateSpec?.shellRegions)
    ? candidateSpec.shellRegions
    : projectedShellRegions;
  const contractIssues = [];

  if (candidateSpec?.routeFamily !== LANDING_WORKSPACE_ROUTE_FAMILY) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "route_family_mismatch",
        `Маршрут кандидата должен быть «${LANDING_WORKSPACE_ROUTE_FAMILY}».`,
        "routeFamily"
      )
    );
  }

  if (candidateSpec?.specVersion !== LANDING_WORKSPACE_SPEC_VERSION) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "spec_version_mismatch",
        `Версия спецификации кандидата должна быть «${LANDING_WORKSPACE_SPEC_VERSION}».`,
        "specVersion"
      )
    );
  }

  if (candidateSpec?.compositionFamily && candidateSpec.compositionFamily !== LANDING_WORKSPACE_COMPOSITION_FAMILY) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "composition_family_mismatch",
        `Landing draft compositionFamily must stay "${LANDING_WORKSPACE_COMPOSITION_FAMILY}".`,
        "compositionFamily"
      )
    );
  }

  if (JSON.stringify(sections.map((section) => section.id)) !== JSON.stringify(projectedSections.map((section) => section.id))) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "block_registry_order_mismatch",
        "Разделы кандидата должны идти в детерминированном порядке реестра лендинга.",
        "blocks"
      )
    );
  }

  if (new Set(sections.map((section) => section.id)).size !== sections.length) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "duplicate_block_id",
        "Landing blocks must remain unique inside the closed registry.",
        "blocks"
      )
    );
  }

  if (sections.some((section) => LANDING_WORKSPACE_SHELL_REGION_IDS.has(section.id))) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "shell_region_listed_as_block",
        "Shell regions must stay separate from ordinary landing blocks.",
        "shellRegions"
      )
    );
  }

  if (JSON.stringify(shellRegions.map((region) => region.id)) !== JSON.stringify(projectedShellRegions.map((region) => region.id))) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "shell_region_mismatch",
        "Landing shell regions must stay fixed as landing_header and landing_footer.",
        "shellRegions"
      )
    );
  }

  const sectionIssues = [];

  for (const section of sections) {
    if (section.required && section.status === "missing") {
      sectionIssues.push(
        makeReportIssue(
          "blocking",
          "render/compatibility",
          `missing_${section.id}`,
          `Обязательный раздел лендинга «${section.id}» отсутствует.`,
          section.id
        )
      );
    }
  }

  const readinessBuckets = collectReadinessIssues(readiness);
  const structuralIssues = [
    ...contractIssues,
    ...readinessBuckets.structural.map((result) => makeReportIssue("blocking", "structural/schema", result.code, result.message, result.field))
  ];
  const claimWarnings = [];
  if (candidatePayload.pageType === PAGE_TYPES.CONTACTS) {
    if (!hasText(candidatePayload.ctaBand?.note)) {
      claimWarnings.push(
        makeReportIssue("warning", "claim/risk", "weak_contact_note", "На странице контактов ещё не объяснено примечание по контактам.")
      );
    }
  } else if (!hasText(candidatePayload.contentBand?.body)) {
    claimWarnings.push(
      makeReportIssue("warning", "claim/risk", "weak_body_narrative", "На лендинге ещё не объяснён основной текст.")
    );
  }

  if (!hasText(candidatePayload.ctaVariant) && !hasText(candidatePayload.ctaBand?.title)) {
    claimWarnings.push(
      makeReportIssue("warning", "claim/risk", "weak_cta_narrative", "У кандидата лендинга ещё не задан явный призыв к действию.")
    );
  }

  const classResults = [
    {
      classId: "structural/schema",
      status: structuralIssues.length > 0 ? "blocked" : "pass",
      issues: structuralIssues
    },
    {
      classId: "reference/truth",
      status: readinessBuckets.reference.length > 0 ? "blocked" : "pass",
      issues: readinessBuckets.reference.map((result) => makeReportIssue("blocking", "reference/truth", result.code, result.message, result.field))
    },
    {
      classId: "render/compatibility",
      status: sectionIssues.length > 0 ? "blocked" : "pass",
      issues: sectionIssues
    },
    {
      classId: "editorial/publish-readiness",
      status: readinessBuckets.editorial.some((result) => result.severity === "blocking")
        ? "blocked"
        : readinessBuckets.editorial.some((result) => result.severity === "warning")
          ? "warning"
          : "pass",
      issues: readinessBuckets.editorial.map((result) => makeReportIssue(result.severity, "editorial/publish-readiness", result.code, result.message, result.field))
    },
    {
      classId: "claim/risk",
      status: claimWarnings.length > 0 ? "warning" : "pass",
      issues: claimWarnings
    }
  ];

  const blockingIssues = classResults.flatMap((result) => result.issues.filter((issue) => issue.severity === "blocking"));
  const warnings = classResults.flatMap((result) => result.issues.filter((issue) => issue.severity === "warning"));
  const hasBlocking = blockingIssues.length > 0;
  const hasWarnings = warnings.length > 0;
  const approvalEligible = !hasBlocking;
  const publishReady = !hasBlocking
    && revision?.state === "review"
    && (!revision?.ownerReviewRequired || revision?.ownerApprovalStatus === "approved")
    && revision?.previewStatus === "preview_renderable";
  const renderCompatible = contractIssues.length === 0
    && sections.every((section) => !section.required || section.status === "present");
  const overallStatus = hasBlocking
    ? "blocked"
    : hasWarnings
      ? "pass_with_warnings"
      : "pass";

  return {
    specVersion: candidateSpec?.specVersion ?? LANDING_WORKSPACE_SPEC_VERSION,
    compositionFamily: LANDING_WORKSPACE_COMPOSITION_FAMILY,
    candidateId: candidateSpec?.candidateId ?? "",
    pageId: candidateSpec?.pageId ?? "",
    landingDraftId: candidateSpec?.landingDraftId ?? "",
    baseRevisionId: candidateSpec?.baseRevisionId ?? "",
    routeFamily: candidateSpec?.routeFamily ?? LANDING_WORKSPACE_ROUTE_FAMILY,
    checkedAt: new Date().toISOString(),
    sourceContextSummary: candidateSpec?.sourceContextSummary ?? "",
    overallStatus,
    summary: hasBlocking
      ? "Есть блокирующие проблемы в кандидате лендинга."
      : hasWarnings
        ? "Есть предупреждения по кандидату лендинга."
        : "Кандидат лендинга прошёл проверку.",
    classResults,
    blockingIssues,
    warnings,
    hasBlocking,
    hasWarnings,
    blocks: sections,
    sections,
    shellRegions,
    renderCompatible,
    publishReady,
    approvalEligible,
    llm: llmResult
      ? {
          traceId: llmResult.traceId,
          requestId: llmResult.requestId,
          providerId: llmResult.providerId,
          modelId: llmResult.modelId,
          configState: llmResult.configState,
          transportUsed: llmResult.transportUsed,
          transportState: llmResult.transportState,
          providerState: llmResult.providerState,
          structuredOutputState: llmResult.structuredOutputState,
          validationState: llmResult.validationState,
          status: llmResult.status,
          retryable: llmResult.retryable
        }
      : null
  };
}

export function buildLandingWorkspaceWorkspaceMemoryDelta({
  sessionIdentity = {},
  editorialIntent = {},
  proofSelection = {},
  artifactState = {},
  editorialDecisions = {},
  traceState = {},
  archivePointer = {},
  recentTurn = {}
} = {}) {
  return {
    sessionIdentity,
    editorialIntent,
    proofSelection,
    artifactState,
    editorialDecisions,
    traceState,
    archivePointer,
    recentTurn
  };
}

export function buildLandingWorkspaceAuditDetails(candidateResult, derivedArtifactSlice) {
  return {
    landingWorkspace: {
      derivedArtifactSlice,
      llm: candidateResult.status === "ok" || candidateResult.status === "error"
        ? {
            traceId: candidateResult.traceId,
            requestId: candidateResult.requestId,
            providerId: candidateResult.providerId,
            modelId: candidateResult.modelId,
            configState: candidateResult.configState,
            transportUsed: candidateResult.transportUsed,
            transportState: candidateResult.transportState,
            providerState: candidateResult.providerState,
            structuredOutputState: candidateResult.structuredOutputState,
            validationState: candidateResult.validationState,
            status: candidateResult.status,
            retryable: candidateResult.retryable
          }
        : null
    }
  };
}

export async function requestLandingWorkspaceCandidate(input = {}, deps = {}) {
  const candidateId = input.candidateId ?? createId("landing_candidate");
  const request = buildLandingWorkspaceCandidateRequest(input);
  const llmResult = await requestStructuredArtifact(request, deps);

  if (llmResult.status !== "ok") {
    return {
      ...llmResult,
      candidateId,
      promptPacket: request.promptPacket,
      sourceContextSummary: request.sourceContextSummary,
      blocks: projectLandingWorkspaceSections(request.normalizedPayload),
      sections: projectLandingWorkspaceSections(request.normalizedPayload),
      shellRegions: projectLandingWorkspaceShellRegions(request.normalizedPayload),
      specVersion: LANDING_WORKSPACE_SPEC_VERSION,
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    };
  }

  const payload = landingWorkspaceDraftSchema.parse(llmResult.artifact);
  const spec = buildLandingWorkspaceCandidateSpec({
    candidateId,
    pageId: input.pageId ?? "",
    landingDraftId: input.landingDraftId ?? "",
    baseRevisionId: input.baseRevisionId ?? "",
    routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY,
    sourceContextSummary: request.sourceContextSummary,
    payload
  });

  return {
    ...llmResult,
    candidateId,
    promptPacket: request.promptPacket,
    sourceContextSummary: request.sourceContextSummary,
    payload,
    spec,
    blocks: spec.blocks,
    sections: spec.sections,
    shellRegions: spec.shellRegions,
    specVersion: LANDING_WORKSPACE_SPEC_VERSION,
    routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
  };
}
