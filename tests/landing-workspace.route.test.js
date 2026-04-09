import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/admin/workspace/landing/[pageId]/route.js";
import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";
import { buildLandingWorkspaceCandidateSpec } from "../lib/landing-workspace/landing.js";

function makePagePayload(overrides = {}) {
  return {
    pageType: "about",
    slug: "about",
    title: "About",
    h1: "About us",
    intro: "Intro",
    body: "Body",
    contactNote: "",
    ctaTitle: "Get in touch",
    ctaBody: "Contact us",
    defaultBlockCtaLabel: "Contact us",
    serviceIds: ["service_1"],
    caseIds: ["case_1"],
    galleryIds: ["media_2"],
    primaryMediaAssetId: "media_1",
    seo: {
      metaTitle: "About",
      metaDescription: "About us",
      canonicalIntent: "/about",
      indexationFlag: "index",
      openGraphTitle: "About",
      openGraphDescription: "About us",
      openGraphImageAssetId: "media_1"
    },
    ...overrides
  };
}

function makeCanonicalPagePayload(overrides = {}) {
  const flatPayload = makePagePayload(overrides);

  return normalizeEntityInput(ENTITY_TYPES.PAGE, {
    ...flatPayload,
    ...flatPayload.seo
  });
}

function buildFormData(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  return formData;
}

function buildRequest(formFields) {
  return new Request("http://localhost/api/admin/workspace/landing/page_1", {
    method: "POST",
    body: buildFormData(formFields)
  });
}

function buildRouteDeps({ captured, currentDraft = true } = {}) {
  const entity = {
    id: "page_1",
    entityType: ENTITY_TYPES.PAGE
  };
  const baseRevision = {
    id: "rev_base",
    revisionNumber: 1,
    state: "published",
    payload: makeCanonicalPagePayload()
  };
  const draftRevision = currentDraft
    ? {
        id: "draft_1",
        revisionNumber: 2,
        state: "draft",
        changeIntent: "Existing intent",
        payload: makeCanonicalPagePayload({
          title: "About draft",
          h1: "About draft"
        })
      }
    : null;

  return {
    requireRouteUser: async () => ({
      user: {
        id: "user_1",
        role: "seo_manager"
      },
      response: null
    }),
    userCanEditContent: () => true,
    getEntityAggregate: async () => ({
      entity,
      activePublishedRevision: baseRevision,
      revisions: draftRevision ? [draftRevision, baseRevision] : [baseRevision]
    }),
    findEntityById: async () => entity,
    readLandingWorkspaceSession: async (pageId, input) => {
      captured.readLandingWorkspaceSession = { pageId, input };

      return {
        sessionIdentity: {
          sessionId: "session_1",
          entityType: ENTITY_TYPES.PAGE,
          entityId: pageId,
          actor: {
            id: "user_1",
            username: "seo_manager",
            displayName: "SEO Manager",
            role: "seo_manager"
          },
          timestamps: {
            sessionCreatedAt: "2026-04-06T12:00:00.000Z",
            memoryCardUpdatedAt: "2026-04-06T12:05:00.000Z",
            expiresAt: "2026-04-07T12:00:00.000Z"
          },
          baseRevisionId: input.baseRevisionId ?? "",
          routeLocked: input.routeLocked ?? true,
          entityLocked: input.entityLocked ?? true
        },
        editorialIntent: {
          changeIntent: input.changeIntent ?? "",
          editorialGoal: input.editorialGoal ?? "",
          variantDirection: input.variantDirection ?? ""
        },
        proofSelection: {
          selectedMedia: input.selectedMedia ?? [],
          selectedCaseIds: input.selectedCaseIds ?? [],
          selectedGalleryIds: input.selectedGalleryIds ?? []
        },
        artifactState: {
          candidatePointer: null,
          specVersion: "v1",
          previewMode: input.previewMode ?? "desktop",
          verificationSummary: "",
          reviewStatus: "draft",
          derivedArtifactSlice: null
        },
        editorialDecisions: {
          acceptedDecisions: [],
          rejectedDirections: [],
          activeBlockers: [],
          warnings: []
        },
        traceState: {
          lastLlmTraceId: "",
          requestId: "",
          generationTimestamp: ""
        },
        archivePointer: {
          pointer: "",
          previousRunId: "",
          previousCandidateId: "",
          previousRevisionId: ""
        },
        recentTurn: {
          lastChange: input.changeIntent ?? "",
          lastRejection: "",
          lastBlocker: "",
          generationOutcome: "draft"
        }
      };
    },
    requestLandingWorkspaceCandidate: async (input) => {
      captured.requestInput = input;

      const spec = buildLandingWorkspaceCandidateSpec({
        candidateId: "landing_candidate_test",
        pageId: input.pageId ?? "",
        landingDraftId: input.landingDraftId ?? "",
        baseRevisionId: input.baseRevisionId ?? "",
        sourceContextSummary: input.sourceContextSummary ?? "",
        payload: input.sourcePayload
      });

      return {
        status: "ok",
        candidateId: spec.candidateId,
        promptPacket: {
          requestScope: {
            workspace: "landing_workspace",
            action: "generate_candidate"
          },
          actionSlices: [
            {
              id: "landing_workspace_generation"
            }
          ],
          prompt: "Request scope"
        },
        spec,
        payload: spec.payload,
        sections: spec.sections,
        sourceContextSummary: spec.sourceContextSummary,
        specVersion: spec.specVersion,
        routeFamily: spec.routeFamily,
        traceId: "trace_1",
        requestId: "request_1",
        providerId: "provider_1",
        modelId: "model_1",
        configState: "ok",
        transportUsed: "structured",
        transportState: "ok",
        providerState: "ok",
        structuredOutputState: "ok",
        validationState: "ok",
        retryable: false
      };
    },
    saveDraft: async (input) => {
      captured.saveDraftInput = input;

      return {
        entity,
        revision: {
          id: "rev_123",
          revisionNumber: 3,
          state: "draft",
          previewStatus: "preview_renderable",
          ownerReviewRequired: false,
          ownerApprovalStatus: "not_required",
          payload: input.payload
        }
      };
    },
    evaluateReadiness: async () => ({
      results: [],
      hasBlocking: false
    }),
    submitRevisionForReview: async (input) => {
      captured.submitInput = input;

      return {
        revision: {
          id: input.revisionId,
          state: "review"
        }
      };
    },
    applyAcceptedMemoryDelta: async (input) => {
      captured.memoryDeltaInput = input;

      return input.delta;
    }
  };
}

test("landing workspace generate route saves the page draft and anchors the session to the pageId", async () => {
  const captured = {};
  const request = buildRequest({
    actionKind: "generate_candidate",
    changeIntent: "Refine the hero.",
    editorialGoal: "Refine the landing page from canonical Page truth.",
    variantDirection: "hero-first",
    previewMode: "tablet"
  });
  const deps = buildRouteDeps({ captured });

  const response = await POST(request, { params: { pageId: "page_1" } }, deps);
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/workspace/landing/page_1");
  assert.equal(location.searchParams.get("message"), "Черновик сохранён.");
  assert.equal(captured.readLandingWorkspaceSession.pageId, "page_1");
  assert.deepEqual(captured.readLandingWorkspaceSession.input.selectedMedia, ["media_1", "media_2"]);
  assert.deepEqual(captured.readLandingWorkspaceSession.input.selectedCaseIds, ["case_1"]);
  assert.deepEqual(captured.readLandingWorkspaceSession.input.selectedGalleryIds, []);
  assert.equal(captured.requestInput.pageId, "page_1");
  assert.equal(captured.requestInput.landingDraftId, "draft_1");
  assert.equal(captured.requestInput.baseRevisionId, "rev_base");
  assert.equal(captured.requestInput.sourcePayload.compositionFamily, "landing");
  assert.equal(captured.requestInput.sourcePayload.pageThemeKey, "earth_sand");
  assert.equal(captured.requestInput.sourcePayload.title, "About draft");
  assert.equal(captured.requestInput.sourcePayload.hero.headline, "About draft");
  assert.equal(captured.requestInput.sourcePayload.hero.textEmphasisPreset, "standard");
  assert.deepEqual(captured.requestInput.proofBasis, ["service_1", "case_1", "media_2", "media_1"]);
  assert.equal(captured.saveDraftInput.entityType, ENTITY_TYPES.PAGE);
  assert.equal(captured.saveDraftInput.entityId, "page_1");
  assert.equal(captured.saveDraftInput.aiSourceBasis, "from_current_entity_only");
  assert.equal(captured.saveDraftInput.payload.pageThemeKey, "earth_sand");
  assert.equal(captured.saveDraftInput.payload.primaryMediaAssetId, "media_1");
  assert.equal(captured.saveDraftInput.payload.heroTextEmphasisPreset, "standard");
  assert.equal(captured.saveDraftInput.payload.heroSurfaceTone, "plain");
  assert.equal(captured.saveDraftInput.auditDetails.landingWorkspace.derivedArtifactSlice.pageId, "page_1");
  assert.equal(captured.saveDraftInput.auditDetails.landingWorkspace.derivedArtifactSlice.routeFamily, "landing");
  assert.equal(captured.saveDraftInput.auditDetails.landingWorkspace.derivedArtifactSlice.draft.compositionFamily, "landing");
  assert.equal(captured.saveDraftInput.auditDetails.landingWorkspace.derivedArtifactSlice.draft.pageThemeKey, "earth_sand");
  assert.equal(captured.memoryDeltaInput.delta.sessionIdentity.entityId, "page_1");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.candidatePointer.revisionId, "rev_123");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.derivedArtifactSlice.landingDraftId, "rev_123");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.derivedArtifactSlice.pagePayload.primaryMediaAssetId, "media_1");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.reviewStatus, "draft");
  assert.equal(captured.submitInput, undefined);
});

test("landing workspace review handoff submits the existing draft and returns to review", async () => {
  const captured = {};
  const request = buildRequest({
    actionKind: "send_to_review",
    changeIntent: "Refine the hero.",
    editorialGoal: "Refine the landing page from canonical Page truth.",
    variantDirection: "hero-first",
    previewMode: "tablet"
  });
  const deps = buildRouteDeps({ captured });

  deps.requestLandingWorkspaceCandidate = async () => {
    throw new Error("requestLandingWorkspaceCandidate should not be called for send_to_review.");
  };

  const response = await POST(request, { params: { pageId: "page_1" } }, deps);
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/draft_1");
  assert.equal(location.searchParams.get("message"), "Отправлено на проверку.");
  assert.equal(captured.submitInput.revisionId, "draft_1");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.reviewStatus, "review");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.candidatePointer.revisionId, "draft_1");
  assert.equal(captured.memoryDeltaInput.delta.artifactState.derivedArtifactSlice.reviewStatus, "review");
  assert.equal(captured.requestInput, undefined);
});

test("landing workspace generate route stops when another active session already owns the pageId", async () => {
  const captured = {};
  const request = buildRequest({
    actionKind: "generate_candidate",
    changeIntent: "Refine the hero.",
    editorialGoal: "Refine the landing page from canonical Page truth.",
    variantDirection: "hero-first",
    previewMode: "tablet"
  });
  const deps = buildRouteDeps({ captured });

  deps.readLandingWorkspaceSession = async (pageId, input) => {
    captured.readLandingWorkspaceSession = { pageId, input };

    return {
      sessionGuard: {
        status: "blocked_by_active_page_session",
        pageId,
        activeSessionId: "session_other"
      }
    };
  };

  const response = await POST(request, { params: { pageId: "page_1" } }, deps);
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/workspace/landing/page_1");
  assert.equal(location.searchParams.get("error"), "Another active landing workspace session is already anchored to this page.");
  assert.equal(captured.requestInput, undefined);
  assert.equal(captured.saveDraftInput, undefined);
  assert.equal(captured.submitInput, undefined);
  assert.equal(captured.memoryDeltaInput, undefined);
});
