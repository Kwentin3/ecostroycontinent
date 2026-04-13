import { ENTITY_TYPES } from "../content-core/content-types.js";
import { getAuditTimeline } from "../content-ops/audit.js";
import { evaluateReadiness } from "../content-ops/readiness.js";
import { getEntityEditorState, listEntityCards, listPublishedCards } from "../content-core/service.js";
import { findEntityByTypeSingleton, findRevisionById, listPublishObligations } from "../content-core/repository.js";
import { readMemoryCardSlice } from "../ai-workspace/memory-card.js";
import { ADMIN_COPY, getEntityTypeLabel, getRevisionStateLabel, normalizeLegacyCopy } from "../ui-copy.js";
import { listMediaPickerOptions } from "./media-gallery.js";

function labelFromPayload(payload) {
  return payload?.title || payload?.h1 || payload?.publicBrandName || payload?.slug || ADMIN_COPY.untitledAsset;
}

function toPageBlocks(payload = {}) {
  const blocks = Array.isArray(payload?.blocks) ? payload.blocks : [];
  return blocks.filter((block) => block && typeof block === "object");
}

export function getPayloadLabel(payload) {
  return labelFromPayload(payload);
}

export function optionFromCard(card) {
  return {
    id: card.entity.id,
    label: labelFromPayload(card.latestRevision?.payload),
    subtitle: getEntityTypeLabel(card.entity.entityType),
    meta: card.latestRevision
      ? `Версия №${card.latestRevision.revisionNumber} | ${getRevisionStateLabel(card.latestRevision.state)}`
      : "Версий пока нет"
  };
}

export async function loadEditorPageData(entityType, entityId) {
  const state = entityId ? await getEntityEditorState(entityId) : { entity: null, revisions: [], activePublishedRevision: null };
  const currentRevision = state.revisions[0] ?? null;
  const globalSettingsEntity = entityType === ENTITY_TYPES.GLOBAL_SETTINGS
    ? state.entity
    : await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS);
  const globalSettingsRevision = globalSettingsEntity?.activePublishedRevisionId
    ? await findRevisionById(globalSettingsEntity.activePublishedRevisionId)
    : null;
  const readiness = state.entity && currentRevision
    ? await evaluateReadiness({ entity: state.entity, revision: currentRevision, globalSettingsRevision })
    : null;
  const auditItems = entityId ? await getAuditTimeline(entityId) : [];
  const obligations = entityId ? await listPublishObligations(entityId) : [];
  const services = await listEntityCards(ENTITY_TYPES.SERVICE);
  const equipment = await listEntityCards(ENTITY_TYPES.EQUIPMENT);
  const cases = await listEntityCards(ENTITY_TYPES.CASE);
  const galleries = await listPublishedCards(ENTITY_TYPES.GALLERY);
  const mediaOptions = await listMediaPickerOptions();
  const caseProjectTypeOptions = Array.from(
    new Set(
      cases
        .map((card) => normalizeLegacyCopy(card.latestRevision?.payload?.projectType || "").trim())
        .filter((value) => Boolean(value) && /[А-Яа-яЁё]/.test(value))
    )
  ).sort((a, b) => a.localeCompare(b, "ru"));
  const workspaceMemoryCard = entityType === ENTITY_TYPES.SERVICE
    ? await readMemoryCardSlice({
        entityType: ENTITY_TYPES.SERVICE,
        entityId: entityId || state.entity?.id || "",
        baseRevisionId: state.activePublishedRevision?.id ?? "",
        routeLocked: true,
        entityLocked: Boolean(entityId),
        changeIntent: normalizeLegacyCopy(currentRevision?.changeIntent || ""),
        editorialGoal: "Сгенерировать и проверить черновик лендинга услуги.",
        selectedCaseIds: currentRevision?.payload?.relatedCaseIds || [],
        selectedGalleryIds: currentRevision?.payload?.galleryIds || [],
        selectedMedia: currentRevision?.payload?.primaryMediaAssetId ? [currentRevision.payload.primaryMediaAssetId] : [],
        previewMode: "desktop"
      })
    : null;

  return {
    state,
    currentRevision,
    readiness,
    auditItems,
    obligations,
    relationOptions: {
      services: services.map(optionFromCard),
      equipment: equipment.map(optionFromCard),
      cases: cases.map(optionFromCard),
      galleries: galleries.map((card) => ({
        id: card.entityId,
        label: labelFromPayload(card.revision?.payload),
        subtitle: getEntityTypeLabel(ENTITY_TYPES.GALLERY),
        meta: "Опубликовано"
      }))
    },
    mediaOptions,
    caseProjectTypeOptions,
    workspaceMemoryCard
  };
}

export function deriveEditorValue(entityType, revision) {
  if (!revision) {
    if (entityType === ENTITY_TYPES.PAGE) {
      return {
        pageType: "about"
      };
    }

    return {};
  }

  if (entityType !== ENTITY_TYPES.PAGE) {
    return revision.payload;
  }

  const payload = revision.payload || {};
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
    defaultBlockCtaLabel: ctaBlock?.ctaLabel || "",
    sourceRefs: payload.sourceRefs || {
      primaryServiceId: "",
      primaryEquipmentId: "",
      caseIds: [],
      galleryIds: []
    },
    targeting: payload.targeting || {
      geoLabel: "",
      city: "",
      district: "",
      serviceArea: ""
    },
    sections: Array.isArray(payload.sections) ? payload.sections : []
  };
}

const PREVIEW_TARGETS = {
  [ENTITY_TYPES.SERVICE]: {
    title: "preview-service-hero",
    h1: "preview-service-hero",
    summary: "preview-service-hero",
    ctaVariant: "preview-service-hero",
    serviceScope: "preview-service-scope",
    problemsSolved: "preview-service-scope",
    methods: "preview-service-scope",
    relatedCaseIds: "preview-service-related-cases",
    galleryIds: "preview-service-gallery",
    primaryMediaAssetId: "preview-service-media"
  },
  [ENTITY_TYPES.CASE]: {
    title: "preview-case-hero",
    location: "preview-case-hero",
    projectType: "preview-case-hero",
    task: "preview-case-core",
    workScope: "preview-case-core",
    result: "preview-case-core",
    serviceIds: "preview-case-related-services",
    galleryIds: "preview-case-gallery",
    primaryMediaAssetId: "preview-case-media"
  },
  [ENTITY_TYPES.PAGE]: {
    title: "preview-page-hero",
    h1: "preview-page-hero",
    intro: "preview-page-hero",
    primaryMediaAssetId: "preview-page-media",
    blocks: "preview-page-blocks"
  }
};

export function getPreviewTargetForField(entityType, field) {
  return PREVIEW_TARGETS[entityType]?.[field] || null;
}
