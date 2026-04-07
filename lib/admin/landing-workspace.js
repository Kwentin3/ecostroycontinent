import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import { getEntityAggregate, findEntityByTypeSingleton, findRevisionById, listPublishObligations } from "../content-core/repository.js";
import { listEntityCards } from "../content-core/service.js";
import { getAuditTimeline } from "../content-ops/audit.js";
import { evaluateReadiness } from "../content-ops/readiness.js";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../read-side/public-content.js";
import { listMediaPickerOptions } from "./media-gallery.js";
import { getPayloadLabel } from "./entity-ui.js";
import { normalizeLegacyCopy } from "../ui-copy.js";
import {
  buildLandingWorkspaceCandidateSpec,
  buildLandingWorkspaceDerivedArtifactSlice,
  buildLandingWorkspaceProofBasis,
  buildLandingWorkspaceSourceContextSummary,
  buildLandingWorkspaceVerificationReport,
  LANDING_WORKSPACE_ROUTE_FAMILY
} from "../landing-workspace/landing.js";
import { readLandingWorkspaceSession } from "../landing-workspace/session.js";

export function buildLandingWorkspaceHref(pageId) {
  return pageId ? `/admin/workspace/landing/${pageId}` : "/admin/workspace/landing";
}

function getSourceRevision(aggregate) {
  return aggregate?.revisions?.[0] ?? aggregate?.activePublishedRevision ?? null;
}

export async function loadLandingWorkspaceChooserData({ sessionRow = null, db = null } = {}) {
  const pageCards = await listEntityCards(ENTITY_TYPES.PAGE, { db });
  const currentSessionPageId = sessionRow?.workspace_memory_card?.sessionIdentity?.entityId ?? "";
  const currentSessionState = sessionRow?.workspace_memory_card ?? null;

  return {
    pageCards,
    currentSessionPageId,
    currentSessionState
  };
}

export async function loadLandingWorkspacePageData(pageId, input = {}, deps = {}) {
  const aggregate = await getEntityAggregate(pageId, deps.db ?? null);
  const entity = aggregate?.entity ?? null;
  const sourceRevision = getSourceRevision(aggregate);
  const currentRevision = aggregate?.revisions?.find((revision) => revision.state === "draft") ?? null;
  const activePublishedRevision = aggregate?.activePublishedRevision ?? null;
  const globalSettingsEntity = await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS, deps.db ?? null);
  const globalSettingsRevision = globalSettingsEntity?.activePublishedRevisionId
    ? await findRevisionById(globalSettingsEntity.activePublishedRevisionId, deps.db ?? null)
    : null;
  const readiness = entity && sourceRevision
    ? await evaluateReadiness({ entity, revision: sourceRevision, globalSettingsRevision })
    : null;
  const auditItems = entity ? await getAuditTimeline(entity.id, { db: deps.db ?? null }) : [];
  const obligations = entity ? await listPublishObligations(entity.id, deps.db ?? null) : [];
  const services = await listEntityCards(ENTITY_TYPES.SERVICE, { db: deps.db ?? null });
  const cases = await listEntityCards(ENTITY_TYPES.CASE, { db: deps.db ?? null });
  const galleries = await listEntityCards(ENTITY_TYPES.GALLERY, { db: deps.db ?? null });
  const mediaOptions = await listMediaPickerOptions();
  const publishedLookups = await buildPublishedLookups();
  const globalSettings = await getPublishedGlobalSettings();
  const proofBasis = sourceRevision?.payload ? buildLandingWorkspaceProofBasis(sourceRevision.payload) : [];
  const sessionAnchor = await readLandingWorkspaceSession(pageId, {
    baseRevisionId: activePublishedRevision?.id ?? "",
    changeIntent: normalizeLegacyCopy(currentRevision?.changeIntent || sourceRevision?.changeIntent || ""),
    editorialGoal: "Refine the landing page from canonical Page truth.",
    proofBasis,
    selectedMedia: sourceRevision?.payload?.primaryMediaAssetId ? [sourceRevision.payload.primaryMediaAssetId] : [],
    selectedCaseIds: sourceRevision?.payload?.caseIds ?? [],
    selectedGalleryIds: sourceRevision?.payload?.galleryIds ?? [],
    previewMode: input.previewMode ?? "desktop"
  }, deps);
  const sourceContextSummary = buildLandingWorkspaceSourceContextSummary({
    pageId,
    pageType: sourceRevision?.payload?.pageType,
    baseRevision: activePublishedRevision,
    currentRevision: sourceRevision,
    changeIntent: normalizeLegacyCopy(currentRevision?.changeIntent || sourceRevision?.changeIntent || ""),
    proofBasis,
    variantKey: input.variantKey ?? ""
  });
  const baselineSpec = sourceRevision ? buildLandingWorkspaceCandidateSpec({
    candidateId: `landing_baseline_${sourceRevision.id}`,
    pageId,
    landingDraftId: currentRevision?.id ?? sourceRevision.id,
    baseRevisionId: activePublishedRevision?.id ?? "",
    routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY,
    sourceContextSummary,
    payload: sourceRevision.payload
  }) : null;
  // Preview, verification, and review must all read the same derived artifact slice.
  const derivedArtifactSlice = sessionAnchor?.artifactState?.derivedArtifactSlice ?? buildLandingWorkspaceDerivedArtifactSlice({
    candidateSpec: baselineSpec,
    previewMode: sessionAnchor?.artifactState?.previewMode || input.previewMode || "desktop",
    verificationSummary: sessionAnchor?.artifactState?.verificationSummary || "",
    reviewStatus: sessionAnchor?.artifactState?.reviewStatus || sourceRevision?.state || "draft"
  });
  const verificationReport = buildLandingWorkspaceVerificationReport({
    candidateSpec: derivedArtifactSlice,
    readiness,
    revision: sourceRevision,
    llmResult: derivedArtifactSlice?.llm ?? null
  });

  return {
    entity,
    sourceRevision,
    currentRevision,
    activePublishedRevision,
    readiness,
    auditItems,
    obligations,
    relationOptions: {
      services: services.map((card) => ({
        id: card.entity.id,
        label: getPayloadLabel(card.latestRevision?.payload),
        subtitle: ENTITY_TYPES.SERVICE,
        meta: card.latestRevision ? `Версия №${card.latestRevision.revisionNumber}` : "Версий пока нет"
      })),
      cases: cases.map((card) => ({
        id: card.entity.id,
        label: getPayloadLabel(card.latestRevision?.payload),
        subtitle: ENTITY_TYPES.CASE,
        meta: card.latestRevision ? `Версия №${card.latestRevision.revisionNumber}` : "Версий пока нет"
      })),
      galleries: galleries.map((card) => ({
        id: card.entity.id,
        label: getPayloadLabel(card.latestRevision?.payload),
        subtitle: ENTITY_TYPES.GALLERY,
        meta: card.latestRevision ? `Версия №${card.latestRevision.revisionNumber}` : "Версий пока нет"
      }))
    },
    mediaOptions,
    publishedLookups,
    globalSettings,
    workspaceMemoryCard: sessionAnchor,
    derivedArtifactSlice,
    verificationReport,
    proofBasis
  };
}
