import { getString } from "../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { findEntityById, getEntityAggregate } from "../../../../../../lib/content-core/repository.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";
import { evaluateReadiness } from "../../../../../../lib/content-ops/readiness.js";
import { submitRevisionForReview } from "../../../../../../lib/content-ops/workflow.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { applyAcceptedMemoryDelta } from "../../../../../../lib/ai-workspace/memory-card.js";
import {
  buildLandingWorkspaceAuditDetails,
  buildLandingWorkspaceCandidateSpec,
  buildLandingWorkspaceDerivedArtifactSlice,
  buildLandingWorkspaceProofBasis,
  buildLandingWorkspaceSourceContextSummary,
  buildLandingWorkspaceVerificationReport,
  buildLandingWorkspaceWorkspaceMemoryDelta,
  requestLandingWorkspaceCandidate,
  LANDING_WORKSPACE_ROUTE_FAMILY
} from "../../../../../../lib/landing-workspace/landing.js";
import { readLandingWorkspaceSession } from "../../../../../../lib/landing-workspace/session.js";

function getPageDraft(aggregate) {
  return aggregate?.revisions?.find((revision) => revision.state === "draft") ?? null;
}

function getSourceRevision(aggregate) {
  return getPageDraft(aggregate) ?? aggregate?.activePublishedRevision ?? null;
}

function buildFallbackPath(pageId) {
  return pageId ? `/admin/workspace/landing/${pageId}` : "/admin/workspace/landing";
}

function buildMemoryAnchorDelta({
  pageId,
  baseRevisionId,
  actor,
  changeIntent,
  editorialGoal,
  variantDirection,
  proofBasis,
  previewMode,
  candidateId,
  revisionId,
  verificationSummary,
  activeBlockers = [],
  warnings = [],
  reviewStatus,
  derivedArtifactSlice,
  routeFamily,
  requestId,
  traceId,
  lastChange,
  lastBlocker,
  generationOutcome
}) {
  return buildLandingWorkspaceWorkspaceMemoryDelta({
    sessionIdentity: {
      entityType: ENTITY_TYPES.PAGE,
      entityId: pageId,
      baseRevisionId,
      routeLocked: true,
      entityLocked: true,
      actor
    },
    editorialIntent: {
      changeIntent,
      editorialGoal,
      variantDirection
    },
    proofSelection: {
      selectedMedia: proofBasis.filter((value) => value.startsWith("media_")),
      selectedCaseIds: proofBasis.filter((value) => value.startsWith("case_")),
      selectedGalleryIds: proofBasis.filter((value) => value.startsWith("gallery_"))
    },
    artifactState: {
      candidatePointer: {
        candidateId,
        revisionId,
        routeFamily,
        specVersion: derivedArtifactSlice?.specVersion ?? ""
      },
      specVersion: derivedArtifactSlice?.specVersion ?? "",
      previewMode,
      verificationSummary,
      reviewStatus,
      derivedArtifactSlice
    },
    editorialDecisions: {
      acceptedDecisions: [],
      rejectedDirections: [],
      activeBlockers,
      warnings
    },
    traceState: {
      lastLlmTraceId: traceId,
      requestId,
      generationTimestamp: new Date().toISOString()
    },
    archivePointer: {
      pointer: requestId ? `request:${requestId}` : "",
      previousRunId: "",
      previousCandidateId: "",
      previousRevisionId: ""
    },
    recentTurn: {
      lastChange,
      lastRejection: "",
      lastBlocker,
      generationOutcome
    }
  });
}

const DEFAULT_ROUTE_DEPS = Object.freeze({
  requireRouteUser,
  userCanEditContent,
  getEntityAggregate,
  findEntityById,
  saveDraft,
  evaluateReadiness,
  submitRevisionForReview,
  applyAcceptedMemoryDelta,
  readLandingWorkspaceSession,
  buildLandingWorkspaceCandidateSpec,
  buildLandingWorkspaceDerivedArtifactSlice,
  buildLandingWorkspaceAuditDetails,
  buildLandingWorkspaceVerificationReport,
  buildLandingWorkspaceSourceContextSummary,
  buildLandingWorkspaceProofBasis,
  buildMemoryAnchorDelta: buildMemoryAnchorDelta,
  requestLandingWorkspaceCandidate
});

export async function POST(request, { params }, overrides = {}) {
  const routeDeps = {
    ...DEFAULT_ROUTE_DEPS,
    ...overrides
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { pageId } = await params;
  const fallbackPath = buildFallbackPath(pageId);
  const formData = await request.formData();
  const actionKind = getString(formData, "actionKind") || "generate_candidate";
  const changeIntent = getString(formData, "changeIntent") || "Refine the landing page from canonical Page truth.";
  const editorialGoal = getString(formData, "editorialGoal") || "Refine the landing page from canonical Page truth.";
  const variantDirection = getString(formData, "variantDirection");
  const previewMode = getString(formData, "previewMode") || "desktop";

  try {
    const aggregate = await routeDeps.getEntityAggregate(pageId);
    const entity = aggregate?.entity ?? (pageId ? await routeDeps.findEntityById(pageId) : null);

    if (!entity || entity.entityType !== ENTITY_TYPES.PAGE) {
      return redirectWithError(request, "/admin/workspace/landing", new Error("Landing workspace is page-only."));
    }

    const baseRevision = aggregate?.activePublishedRevision ?? null;
    const currentRevision = getPageDraft(aggregate);
    const sourceRevision = getSourceRevision(aggregate);
    const workingRevision = currentRevision ?? sourceRevision ?? baseRevision;

    if (!workingRevision) {
      return redirectWithError(request, fallbackPath, new Error("Page truth is missing."));
    }

    const proofBasis = routeDeps.buildLandingWorkspaceProofBasis(workingRevision.payload);
    const memorySlice = await routeDeps.readLandingWorkspaceSession(pageId, {
      baseRevisionId: baseRevision?.id ?? "",
      changeIntent,
      editorialGoal,
      variantDirection,
      proofBasis,
      selectedMedia: workingRevision.payload.primaryMediaAssetId ? [workingRevision.payload.primaryMediaAssetId] : [],
      selectedCaseIds: workingRevision.payload.caseIds ?? [],
      selectedGalleryIds: workingRevision.payload.galleryIds ?? [],
      previewMode,
      actor: user
    }, {
      actor: user
    });

    if (actionKind === "send_to_review") {
      if (!currentRevision) {
        return redirectWithError(request, fallbackPath, new Error("A draft revision is required before review handoff."));
      }

      const submitted = await routeDeps.submitRevisionForReview({
        revisionId: currentRevision.id,
        actorUserId: user.id,
        canRenderPreview: true
      });
      const reviewSourceContext = routeDeps.buildLandingWorkspaceSourceContextSummary({
        pageId,
        pageType: currentRevision.payload.pageType,
        baseRevision,
        currentRevision,
        changeIntent,
        proofBasis,
        variantKey: variantDirection
      });
      const reviewSpec = routeDeps.buildLandingWorkspaceCandidateSpec({
        candidateId: memorySlice?.artifactState?.candidatePointer?.candidateId || `landing_baseline_${currentRevision.id}`,
        pageId,
        landingDraftId: currentRevision.id,
        baseRevisionId: baseRevision?.id ?? "",
        routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY,
        sourceContextSummary: reviewSourceContext,
        payload: currentRevision.payload
      });
      const reviewDerivedArtifactSlice = routeDeps.buildLandingWorkspaceDerivedArtifactSlice({
        candidateSpec: reviewSpec,
        previewMode: memorySlice?.artifactState?.previewMode || previewMode,
        verificationSummary: memorySlice?.artifactState?.verificationSummary || "Review requested.",
        reviewStatus: submitted.revision.state
      });

      await routeDeps.applyAcceptedMemoryDelta({
        entityType: ENTITY_TYPES.PAGE,
        entityId: entity.id,
        baseRevisionId: baseRevision?.id ?? "",
        routeLocked: true,
        entityLocked: true,
        actor: user,
        delta: routeDeps.buildMemoryAnchorDelta({
          pageId: entity.id,
          baseRevisionId: baseRevision?.id ?? "",
          actor: user,
          changeIntent,
          editorialGoal,
          variantDirection,
          proofBasis,
          previewMode: reviewDerivedArtifactSlice.previewMode,
          candidateId: reviewSpec.candidateId,
          revisionId: submitted.revision.id,
          verificationSummary: reviewDerivedArtifactSlice.verificationSummary,
          activeBlockers: memorySlice?.editorialDecisions?.activeBlockers ?? [],
          warnings: memorySlice?.editorialDecisions?.warnings ?? [],
          reviewStatus: submitted.revision.state,
          derivedArtifactSlice: reviewDerivedArtifactSlice,
          routeFamily: reviewSpec.routeFamily,
          requestId: memorySlice?.traceState?.requestId || "",
          traceId: memorySlice?.traceState?.lastLlmTraceId || "",
          lastChange: changeIntent,
          lastBlocker: "",
          generationOutcome: "review"
        })
      }, {
        actor: user
      });

      return redirectWithQuery(request, `/admin/review/${submitted.revision.id}`, {
        message: FEEDBACK_COPY.reviewSubmitted
      });
    }

    const sourceContextSummary = routeDeps.buildLandingWorkspaceSourceContextSummary({
      pageId,
      pageType: workingRevision.payload.pageType,
      baseRevision,
      currentRevision: workingRevision,
      changeIntent,
      proofBasis,
      variantKey: variantDirection
    });
    const candidateResult = await routeDeps.requestLandingWorkspaceCandidate({
      pageId,
      landingDraftId: currentRevision?.id ?? "",
      baseRevision,
      baseRevisionId: baseRevision?.id ?? "",
      currentRevision: workingRevision,
      changeIntent,
      variantKey: variantDirection,
      sourceContextSummary,
      sourcePayload: workingRevision.payload,
      proofBasis,
      memorySlice
    }, routeDeps);

    if (candidateResult.status !== "ok") {
      return redirectWithError(request, fallbackPath, new Error(candidateResult.error?.message || "Landing candidate generation failed."));
    }

    const draftDerivedArtifactSlice = routeDeps.buildLandingWorkspaceDerivedArtifactSlice({
      candidateSpec: candidateResult.spec,
      previewMode
    });
    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.PAGE,
      entityId: entity.id,
      userId: user.id,
      changeIntent,
      payload: candidateResult.spec.payload,
      aiInvolvement: true,
      aiSourceBasis: "from_current_page_only",
      auditDetails: routeDeps.buildLandingWorkspaceAuditDetails(candidateResult, draftDerivedArtifactSlice)
    });
    const readiness = await routeDeps.evaluateReadiness({
      entity: saved.entity,
      revision: saved.revision
    });
    const verificationReport = routeDeps.buildLandingWorkspaceVerificationReport({
      candidateSpec: candidateResult.spec,
      readiness,
      revision: saved.revision,
      llmResult: candidateResult
    });
    const persistedDerivedArtifactSlice = routeDeps.buildLandingWorkspaceDerivedArtifactSlice({
      candidateSpec: {
        ...candidateResult.spec,
        landingDraftId: saved.revision.id
      },
      previewMode,
      verificationSummary: verificationReport.summary,
      reviewStatus: saved.revision.state
    });
    const blockerMessage = verificationReport.blockingIssues[0]?.message || "Landing candidate is blocked by verification.";

    // Accepted deltas are the only workspace writes back into the session memory card.
    await routeDeps.applyAcceptedMemoryDelta({
      entityType: ENTITY_TYPES.PAGE,
      entityId: entity.id,
      baseRevisionId: baseRevision?.id ?? "",
      routeLocked: true,
      entityLocked: true,
      actor: user,
      delta: routeDeps.buildMemoryAnchorDelta({
        pageId: entity.id,
        baseRevisionId: baseRevision?.id ?? "",
        actor: user,
        changeIntent,
        editorialGoal,
        variantDirection,
        proofBasis,
        previewMode: persistedDerivedArtifactSlice.previewMode,
        candidateId: candidateResult.candidateId,
        revisionId: saved.revision.id,
        verificationSummary: verificationReport.summary,
        activeBlockers: verificationReport.blockingIssues.map((issue) => issue.message),
        warnings: verificationReport.warnings.map((issue) => issue.message),
        reviewStatus: saved.revision.state,
        derivedArtifactSlice: persistedDerivedArtifactSlice,
        routeFamily: candidateResult.spec?.routeFamily ?? candidateResult.routeFamily,
        requestId: candidateResult.requestId,
        traceId: candidateResult.traceId,
        lastChange: changeIntent,
        lastBlocker: verificationReport.blockingIssues[0]?.message || "",
        generationOutcome: candidateResult.status
      })
    }, {
      actor: user
    });

    if (verificationReport.hasBlocking || verificationReport.overallStatus === "blocked") {
      return redirectWithError(request, fallbackPath, new Error(blockerMessage));
    }

    return redirectWithQuery(request, fallbackPath, {
      message: FEEDBACK_COPY.draftSaved
    });
  } catch (error) {
    return redirectWithError(request, fallbackPath, error);
  }
}
