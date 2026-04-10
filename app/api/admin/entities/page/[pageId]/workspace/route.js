import { NextResponse } from "next/server.js";

import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../../lib/auth/session.js";
import { findEntityById, getEntityAggregate } from "../../../../../../../lib/content-core/repository.js";
import { ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";
import { saveDraft } from "../../../../../../../lib/content-core/service.js";
import { submitRevisionForReview } from "../../../../../../../lib/content-ops/workflow.js";
import {
  buildLandingWorkspaceProofBasis,
  buildLandingWorkspaceSourceContextSummary,
  projectLandingWorkspaceCandidatePayload,
  requestLandingWorkspaceCandidate
} from "../../../../../../../lib/landing-workspace/landing.js";
import { normalizeEntityInput } from "../../../../../../../lib/content-core/pure.js";
import {
  buildAiActionIntent,
  buildPageWorkspaceBaseValue,
  buildPageWorkspaceCompositionState,
  buildPageWorkspaceFullInput,
  buildPageWorkspaceMetadataState,
  extractPageWorkspaceAiPatch
} from "../../../../../../../lib/admin/page-workspace.js";

function getCurrentDraft(aggregate) {
  return aggregate?.revisions?.find((revision) => revision.state === "draft") ?? null;
}

function getWorkingRevision(aggregate) {
  return getCurrentDraft(aggregate) ?? aggregate?.activePublishedRevision ?? null;
}

function serializeRevision(revision = null) {
  if (!revision) {
    return null;
  }

  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    state: revision.state,
    previewStatus: revision.previewStatus ?? null
  };
}

function jsonError(message, status = 400) {
  return NextResponse.json({
    ok: false,
    error: message
  }, { status });
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

const DEFAULT_ROUTE_DEPS = Object.freeze({
  requireRouteUser,
  userCanEditContent,
  getEntityAggregate,
  findEntityById,
  saveDraft,
  submitRevisionForReview,
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
    return jsonError("Недостаточно прав для редактирования страницы.", 403);
  }

  const { pageId } = await params;
  const body = await parseBody(request);
  const action = body?.action || "save_composition";
  const aggregate = await routeDeps.getEntityAggregate(pageId);
  const entity = aggregate?.entity ?? await routeDeps.findEntityById(pageId);

  if (!entity || entity.entityType !== ENTITY_TYPES.PAGE) {
    return jsonError("Страница не найдена.", 404);
  }

  const workingRevision = getWorkingRevision(aggregate);
  const baseValue = buildPageWorkspaceBaseValue(workingRevision);
  const changeIntent = body?.changeIntent || "Черновик страницы обновлён из единого рабочего экрана.";

  if (action === "save_composition") {
    const nextInput = buildPageWorkspaceFullInput({
      baseValue,
      composition: body?.composition ?? {},
      metadata: buildPageWorkspaceMetadataState(baseValue)
    });
    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.PAGE,
      entityId: entity.id,
      userId: user.id,
      changeIntent,
      payload: nextInput
    });
    const nextValue = buildPageWorkspaceBaseValue(saved.revision);

    return NextResponse.json({
      ok: true,
      message: "Черновик страницы сохранён.",
      composition: buildPageWorkspaceCompositionState(nextValue),
      metadata: buildPageWorkspaceMetadataState(nextValue),
      revision: serializeRevision(saved.revision),
      reviewHref: `/admin/review/${saved.revision.id}`
    });
  }

  if (action === "save_metadata") {
    const nextInput = buildPageWorkspaceFullInput({
      baseValue,
      composition: buildPageWorkspaceCompositionState(baseValue),
      metadata: body?.metadata ?? {}
    });
    const saved = await routeDeps.saveDraft({
      entityType: ENTITY_TYPES.PAGE,
      entityId: entity.id,
      userId: user.id,
      changeIntent: body?.changeIntent || "Метаданные страницы обновлены из metadata layer.",
      payload: nextInput
    });
    const nextValue = buildPageWorkspaceBaseValue(saved.revision);

    return NextResponse.json({
      ok: true,
      message: "Метаданные страницы сохранены.",
      metadata: buildPageWorkspaceMetadataState(nextValue),
      revision: serializeRevision(saved.revision)
    });
  }

  if (action === "send_to_review") {
    const currentDraft = getCurrentDraft(aggregate);

    if (!currentDraft) {
      return jsonError("Сначала сохраните черновик страницы.", 409);
    }

    const submitted = await routeDeps.submitRevisionForReview({
      revisionId: currentDraft.id,
      actorUserId: user.id
    });

    return NextResponse.json({
      ok: true,
      message: "Черновик отправлен на проверку.",
      reviewHref: `/admin/review/${submitted.revision.id}`,
      revision: serializeRevision(submitted.revision)
    });
  }

  if (action === "suggest_patch") {
    const metadata = {
      ...buildPageWorkspaceMetadataState(baseValue),
      ...(body?.metadata ?? {})
    };
    const nextInput = buildPageWorkspaceFullInput({
      baseValue,
      composition: body?.composition ?? {},
      metadata
    });
    const canonicalPayload = normalizeEntityInput(ENTITY_TYPES.PAGE, {
      ...nextInput,
      ...nextInput.seo
    });
    const sourcePayload = projectLandingWorkspaceCandidatePayload(canonicalPayload);
    const proofBasis = buildLandingWorkspaceProofBasis(sourcePayload);
    const aiAction = body?.aiAction || "rewrite_selected";
    const target = body?.target || "page_copy";
    const aiIntent = body?.changeIntent || buildAiActionIntent({
      actionType: aiAction,
      target,
      pageLabel: nextInput.title || nextInput.h1 || entity.id
    });
    const candidateResult = await routeDeps.requestLandingWorkspaceCandidate({
      pageId: entity.id,
      landingDraftId: getCurrentDraft(aggregate)?.id ?? "",
      baseRevision: aggregate?.activePublishedRevision ?? null,
      baseRevisionId: aggregate?.activePublishedRevision?.id ?? "",
      currentRevision: workingRevision,
      changeIntent: aiIntent,
      variantKey: aiAction,
      sourceContextSummary: buildLandingWorkspaceSourceContextSummary({
        pageId: entity.id,
        pageType: sourcePayload.pageType,
        baseRevision: aggregate?.activePublishedRevision ?? null,
        currentRevision: workingRevision,
        changeIntent: aiIntent,
        proofBasis,
        variantKey: aiAction
      }),
      sourcePayload,
      proofBasis
    }, routeDeps);

    if (candidateResult.status !== "ok") {
      return jsonError("AI не смог подготовить предложение для страницы.", 502);
    }

    return NextResponse.json({
      ok: true,
      suggestion: {
        target,
        aiAction,
        label: aiIntent,
        patch: extractPageWorkspaceAiPatch({
          target,
          pageType: nextInput.pageType,
          candidatePayload: candidateResult.payload
        })
      }
    });
  }

  return jsonError("Неизвестное действие рабочего экрана страницы.", 400);
}
