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
import {
  buildServiceLandingSourceContextSummary,
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

function buildLandingFactoryAuditDetails(candidateResult) {
  return {
    landingFactory: {
      candidateId: candidateResult.candidateId,
      specVersion: candidateResult.spec?.specVersion ?? candidateResult.specVersion,
      routeFamily: candidateResult.spec?.routeFamily ?? candidateResult.routeFamily,
      sourceContextSummary: candidateResult.sourceContextSummary,
      candidateSpec: candidateResult.spec ?? null,
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

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Черновик создан из редактора.";
  const sourcePayload = normalizeEntityInput(ENTITY_TYPES.SERVICE, buildEntityPayload(ENTITY_TYPES.SERVICE, formData));
  const fallbackPath = entityId ? `/admin/entities/service/${entityId}` : "/admin/entities/service/new";

  try {
    const aggregate = entityId ? await getEntityAggregate(entityId) : null;
    const currentEntity = aggregate?.entity ?? (entityId ? await findEntityById(entityId) : null);

    if (entityId && !currentEntity) {
      return redirectWithError(request, fallbackPath, new Error("Service entity not found."));
    }

    if (currentEntity && currentEntity.entityType !== ENTITY_TYPES.SERVICE) {
      return redirectWithError(request, fallbackPath, new Error("Service landing factory is service-only."));
    }

    const baseRevision = aggregate?.activePublishedRevision ?? null;
    const currentDraft = aggregate?.revisions?.find((revision) => revision.state === "draft") ?? null;
    const sourceContextSummary = buildServiceLandingSourceContextSummary({
      entityId: currentEntity?.id || entityId || "",
      baseRevision,
      currentRevision: currentDraft,
      changeIntent,
      proofBasis: buildProofBasis(sourcePayload)
    });
    const candidateResult = await requestServiceLandingCandidate({
      entityId: currentEntity?.id || entityId || "",
      baseRevision,
      currentRevision: currentDraft,
      changeIntent,
      proofBasis: buildProofBasis(sourcePayload),
      sourcePayload,
      sourceContextSummary
    });

    if (candidateResult.status !== "ok") {
      return redirectWithError(request, fallbackPath, new Error(candidateResult.error?.message || "Service landing candidate generation failed."));
    }

    const saved = await saveDraft({
      entityType: ENTITY_TYPES.SERVICE,
      entityId: currentEntity?.id || entityId || null,
      userId: user.id,
      changeIntent,
      payload: candidateResult.spec.payload,
      aiInvolvement: true,
      aiSourceBasis: "from_current_entity_only",
      auditDetails: buildLandingFactoryAuditDetails(candidateResult)
    });

    const readiness = await evaluateReadiness({
      entity: saved.entity,
      revision: saved.revision
    });
    const verificationReport = buildServiceLandingVerificationReport({
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

    const submitted = await submitRevisionForReview({
      revisionId: saved.revision.id,
      actorUserId: user.id
    });

    return redirectWithQuery(request, `/admin/review/${submitted.revision.id}`, {
      message: FEEDBACK_COPY.reviewSubmitted
    });
  } catch (error) {
    return redirectWithError(request, fallbackPath, error);
  }
}
