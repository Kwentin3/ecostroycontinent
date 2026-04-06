import { buildEntityPayload } from "../../../../../../../lib/admin/entity-form-data.js";
import { getString } from "../../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";
import { findEntityById, getEntityAggregate } from "../../../../../../../lib/content-core/repository.js";
import { saveDraft } from "../../../../../../../lib/content-core/service.js";
import { evaluateReadiness } from "../../../../../../../lib/content-ops/readiness.js";
import { submitRevisionForReview } from "../../../../../../../lib/content-ops/workflow.js";
import { applyAcceptedMemoryDelta, readMemoryCardSlice } from "../../../../../../../lib/ai-workspace/memory-card.js";
import {
  buildServiceLandingSourceContextSummary,
  buildServiceLandingDerivedArtifactSlice,
  buildServiceLandingWorkspaceMemoryDelta,
  buildServiceLandingVerificationReport,
  requestServiceLandingCandidate
} from "../../../../../../../lib/landing-factory/service.js";
import { FEEDBACK_COPY } from "../../../../../../../lib/ui-copy.js";
import { normalizeEntityInput } from "../../../../../../../lib/content-core/pure.js";

function buildProofBasis(payload) {
  return [
    ...(payload.relatedCaseIds ?? []),
    ...(payload.galleryIds ?? []),
    payload.primaryMediaAssetId || ""
  ].filter(Boolean);
}

function buildLandingFactoryAuditDetails(candidateResult, derivedArtifactSlice) {
  return {
    landingFactory: {
      // Keep one run slice: audit details, preview, and Memory Card should derive from the same artifact object.
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

const DEFAULT_ROUTE_DEPS = Object.freeze({
  requireRouteUser,
  userCanEditContent,
  getEntityAggregate,
  findEntityById,
  saveDraft,
  evaluateReadiness,
  submitRevisionForReview,
  buildServiceLandingSourceContextSummary,
  buildServiceLandingWorkspaceMemoryDelta,
  buildServiceLandingVerificationReport,
  readMemoryCardSlice,
  applyAcceptedMemoryDelta,
  requestServiceLandingCandidate
});

export async function POST(request, overrides = {}) {
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

  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Черновик создан из редактора.";
  const sourcePayload = normalizeEntityInput(ENTITY_TYPES.SERVICE, buildEntityPayload(ENTITY_TYPES.SERVICE, formData));
  const fallbackPath = entityId ? `/admin/entities/service/${entityId}` : "/admin/entities/service/new";

  try {
    const aggregate = entityId ? await routeDeps.getEntityAggregate(entityId) : null;
    const currentEntity = aggregate?.entity ?? (entityId ? await routeDeps.findEntityById(entityId) : null);

    if (entityId && !currentEntity) {
      return redirectWithError(request, fallbackPath, new Error("Service entity not found."));
    }

    if (currentEntity && currentEntity.entityType !== ENTITY_TYPES.SERVICE) {
      return redirectWithError(request, fallbackPath, new Error("Service landing factory is service-only."));
    }

    const baseRevision = aggregate?.activePublishedRevision ?? null;
    const currentDraft = aggregate?.revisions?.find((revision) => revision.state === "draft") ?? null;
    const baseRevisionId = baseRevision?.id ?? "";
    const memorySlice = await routeDeps.readMemoryCardSlice({
      entityType: ENTITY_TYPES.SERVICE,
      entityId: currentEntity?.id || entityId || "",
      baseRevisionId,
      routeLocked: true,
      entityLocked: Boolean(currentEntity?.id || entityId),
      changeIntent,
      editorialGoal: "Generate and review a service-first landing candidate.",
      selectedCaseIds: buildProofBasis(sourcePayload).filter((value) => value.startsWith("case_")),
      selectedGalleryIds: buildProofBasis(sourcePayload).filter((value) => value.startsWith("gallery_")),
      selectedMedia: sourcePayload.primaryMediaAssetId ? [sourcePayload.primaryMediaAssetId] : [],
      previewMode: "desktop",
      actor: user
    });
    const sourceContextSummary = routeDeps.buildServiceLandingSourceContextSummary({
      entityId: currentEntity?.id || entityId || "",
      baseRevision,
      currentRevision: currentDraft,
      changeIntent,
      proofBasis: buildProofBasis(sourcePayload)
    });
    const candidateResult = await routeDeps.requestServiceLandingCandidate({
      entityId: currentEntity?.id || entityId || "",
      baseRevision,
      // Preserve the published base revision id so the candidate/spec remains auditable.
      baseRevisionId,
      currentRevision: currentDraft,
      changeIntent,
      proofBasis: buildProofBasis(sourcePayload),
      sourcePayload,
      sourceContextSummary,
      memorySlice
    });

    if (candidateResult.status !== "ok") {
      return redirectWithError(request, fallbackPath, new Error(candidateResult.error?.message || "Service landing candidate generation failed."));
    }
    const draftDerivedArtifactSlice = buildServiceLandingDerivedArtifactSlice({
      candidateSpec: candidateResult.spec,
      previewMode: "desktop"
    });

    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.SERVICE,
      entityId: currentEntity?.id || entityId || null,
      userId: user.id,
      changeIntent,
      payload: candidateResult.spec.payload,
      aiInvolvement: true,
      aiSourceBasis: "from_current_entity_only",
      auditDetails: buildLandingFactoryAuditDetails(candidateResult, draftDerivedArtifactSlice)
    });

    const readiness = await routeDeps.evaluateReadiness({
      entity: saved.entity,
      revision: saved.revision
    });
    const verificationReport = routeDeps.buildServiceLandingVerificationReport({
      candidateSpec: candidateResult.spec,
      readiness,
      revision: saved.revision,
      llmResult: candidateResult
    });

    if (verificationReport.hasBlocking || verificationReport.overallStatus === "blocked") {
      return redirectWithError(
        request,
        `/admin/entities/service/${saved.entity.id}`,
        new Error(verificationReport.blockingIssues[0]?.message || "Service landing candidate is blocked by verification.")
      );
    }

    const submitted = await routeDeps.submitRevisionForReview({
      revisionId: saved.revision.id,
      actorUserId: user.id
    });
    const derivedArtifactSlice = buildServiceLandingDerivedArtifactSlice({
      candidateSpec: draftDerivedArtifactSlice,
      previewMode: "desktop",
      verificationSummary: verificationReport.summary,
      reviewStatus: submitted.revision.state
    });

    // Only the accepted delta reaches session memory after the revision has been saved and submitted.
    await routeDeps.applyAcceptedMemoryDelta({
      entityType: ENTITY_TYPES.SERVICE,
      entityId: submitted.revision.entityId || saved.entity.id,
      baseRevisionId,
      routeLocked: true,
      entityLocked: true,
      actor: user,
      delta: routeDeps.buildServiceLandingWorkspaceMemoryDelta({
        sessionIdentity: {
          entityType: ENTITY_TYPES.SERVICE,
          entityId: submitted.revision.entityId || saved.entity.id,
          baseRevisionId,
          routeLocked: true,
          entityLocked: true,
          actor: user
        },
        editorialIntent: {
          changeIntent,
          editorialGoal: "Generate and review a service-first landing candidate.",
          variantDirection: sourcePayload.ctaVariant || ""
        },
        proofSelection: {
          selectedMedia: sourcePayload.primaryMediaAssetId ? [sourcePayload.primaryMediaAssetId] : [],
          selectedCaseIds: buildProofBasis(sourcePayload).filter((value) => value.startsWith("case_")),
          selectedGalleryIds: buildProofBasis(sourcePayload).filter((value) => value.startsWith("gallery_"))
        },
        artifactState: {
          candidatePointer: {
            candidateId: candidateResult.candidateId,
            revisionId: submitted.revision.id,
            routeFamily: candidateResult.spec?.routeFamily ?? candidateResult.routeFamily,
            specVersion: candidateResult.spec?.specVersion ?? candidateResult.specVersion
          },
          specVersion: derivedArtifactSlice.specVersion,
          previewMode: derivedArtifactSlice.previewMode,
          verificationSummary: verificationReport.summary,
          reviewStatus: submitted.revision.state,
          derivedArtifactSlice
        },
        editorialDecisions: {
          acceptedDecisions: [],
          rejectedDirections: [],
          activeBlockers: verificationReport.blockingIssues.map((issue) => issue.message),
          warnings: verificationReport.warnings.map((issue) => issue.message)
        },
        traceState: {
          lastLlmTraceId: candidateResult.traceId,
          requestId: candidateResult.requestId,
          generationTimestamp: new Date().toISOString()
        },
        archivePointer: {
          pointer: `request:${candidateResult.requestId}`,
          previousRunId: memorySlice?.traceState?.requestId || "",
          previousCandidateId: memorySlice?.artifactState?.candidatePointer?.candidateId || "",
          previousRevisionId: memorySlice?.artifactState?.candidatePointer?.revisionId || ""
        },
        recentTurn: {
          lastChange: changeIntent,
          lastRejection: "",
          lastBlocker: verificationReport.blockingIssues[0]?.message || "",
          generationOutcome: candidateResult.status
        }
      })
    });

    return redirectWithQuery(request, `/admin/review/${submitted.revision.id}`, {
      message: FEEDBACK_COPY.reviewSubmitted
    });
  } catch (error) {
    return redirectWithError(request, fallbackPath, error);
  }
}
