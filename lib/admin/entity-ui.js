import { ENTITY_TYPES } from "../content-core/content-types";
import { getAuditTimeline } from "../content-ops/audit";
import { evaluateReadiness } from "../content-ops/readiness";
import { getEntityEditorState, listEntityCards, listPublishedCards } from "../content-core/service";
import { findEntityByTypeSingleton, findRevisionById, listPublishObligations } from "../content-core/repository";

function labelFromPayload(payload) {
  return payload?.title || payload?.h1 || payload?.publicBrandName || payload?.slug || "Untitled";
}

export function optionFromCard(card) {
  return {
    id: card.entity.id,
    label: labelFromPayload(card.latestRevision?.payload),
    subtitle: card.entity.entityType,
    meta: card.latestRevision ? `revision ${card.latestRevision.revisionNumber} | ${card.latestRevision.state}` : "no revisions"
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
  const cases = await listEntityCards(ENTITY_TYPES.CASE);
  const galleries = await listPublishedCards(ENTITY_TYPES.GALLERY);
  const mediaAssets = await listPublishedCards(ENTITY_TYPES.MEDIA_ASSET);

  return {
    state,
    currentRevision,
    readiness,
    auditItems,
    obligations,
    relationOptions: {
      services: services.map(optionFromCard),
      cases: cases.map(optionFromCard),
      galleries: galleries.map((card) => ({
        id: card.entityId,
        label: labelFromPayload(card.revision?.payload),
        subtitle: "gallery",
        meta: "published"
      }))
    },
    mediaOptions: mediaAssets.map((card) => ({
      id: card.entityId,
      title: card.revision?.payload?.title || card.revision?.payload?.originalFilename || "Media asset",
      alt: card.revision?.payload?.alt || "",
      originalFilename: card.revision?.payload?.originalFilename || "",
      whereUsedLabel: "published usage visible after relation save",
      previewUrl: `/api/media/${card.entityId}`
    }))
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

  const blocks = revision.payload.blocks || [];
  const richTextBlock = blocks.find((block) => block.type === "rich_text");
  const serviceListBlock = blocks.find((block) => block.type === "service_list");
  const caseListBlock = blocks.find((block) => block.type === "case_list");
  const galleryBlock = blocks.find((block) => block.type === "gallery");
  const contactBlock = blocks.find((block) => block.type === "contact");
  const ctaBlock = blocks.find((block) => block.type === "cta");

  return {
    ...revision.payload,
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
