import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";
import {
  buildLandingWorkspaceCandidateRequest,
  buildLandingWorkspaceCandidateSpec,
  buildLandingWorkspaceDerivedArtifactSlice,
  buildLandingWorkspaceProofBasis,
  buildLandingWorkspaceVerificationReport,
  projectLandingWorkspaceCandidatePayload,
  projectLandingWorkspaceSections
} from "../lib/landing-workspace/landing.js";
import { readLandingWorkspaceSession } from "../lib/landing-workspace/session.js";

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

function makeLandingDraft(overrides = {}) {
  const hero = {
    headline: "About us",
    body: "Intro",
    mediaAssetId: "media_1",
    textEmphasisPreset: "standard",
    surfaceTone: "plain",
    ...(overrides.hero ?? {})
  };
  const contentBand = {
    body: "Body",
    subtitle: "",
    textEmphasisPreset: "standard",
    surfaceTone: "plain",
    ...(overrides.contentBand ?? {})
  };
  const ctaBand = {
    title: "Get in touch",
    body: "Contact us",
    note: "",
    textEmphasisPreset: "standard",
    surfaceTone: "plain",
    ...(overrides.ctaBand ?? {})
  };
  const shellRegions = {
    headerRef: "landing_header",
    footerRef: "landing_footer",
    ...(overrides.shellRegions ?? {})
  };
  const seo = {
    metaTitle: "About",
    metaDescription: "About us",
    canonicalIntent: "/about",
    indexationFlag: "index",
    openGraphTitle: "About",
    openGraphDescription: "About us",
    openGraphImageAssetId: "media_1",
    ...(overrides.seo ?? {})
  };

  return {
    compositionFamily: "landing",
    pageType: "about",
    pageThemeKey: "earth_sand",
    slug: "about",
    title: "About",
    hero,
    mediaAssetIds: ["media_2"],
    serviceCardIds: ["service_1"],
    caseCardIds: ["case_1"],
    contentBand,
    ctaVariant: "Contact us",
    ctaBand,
    shellRegions,
    seo,
    ...overrides,
    hero,
    contentBand,
    ctaBand,
    shellRegions,
    seo
  };
}

function makeMemorySlice(pageId = "other_page") {
  return {
    schemaVersion: "v1",
    sessionIdentity: {
      sessionId: "session_1",
      entityType: "page",
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
      baseRevisionId: "rev_base",
      routeLocked: true,
      entityLocked: true
    },
    editorialIntent: {
      changeIntent: "Refine the landing page.",
      editorialGoal: "Refine the landing page from canonical Page truth.",
      variantDirection: "hero-first"
    },
    proofSelection: {
      selectedMedia: ["media_1", "media_2"],
      selectedCaseIds: ["case_1"],
      selectedGalleryIds: []
    },
    artifactState: {
      candidatePointer: {
        candidateId: "landing_candidate_1",
        revisionId: "rev_2",
        routeFamily: "landing"
      },
      specVersion: "v1",
      previewMode: "tablet",
      verificationSummary: "Ready for review.",
      reviewStatus: "draft",
      derivedArtifactSlice: {
        candidateId: "landing_candidate_1",
        pageId,
        landingDraftId: "rev_2",
        baseRevisionId: "rev_base",
        routeFamily: "landing",
        specVersion: "v1",
        sourceContextSummary: "page=page_1",
        draft: makeLandingDraft(),
        payload: makeCanonicalPagePayload(),
        sections: projectLandingWorkspaceSections(makeLandingDraft()),
        previewMode: "tablet",
        verificationSummary: "Ready for review.",
        reviewStatus: "draft"
      }
    },
    editorialDecisions: {
      acceptedDecisions: ["Keep the published slug"],
      rejectedDirections: ["Add FAQ blocks"],
      activeBlockers: [],
      warnings: ["Proof path should stay visible."]
    },
    traceState: {
      lastLlmTraceId: "trace_1",
      requestId: "request_1",
      generationTimestamp: "2026-04-06T12:06:00.000Z"
    },
    archivePointer: {
      pointer: "request:request_1",
      previousRunId: "request_0",
      previousCandidateId: "landing_candidate_0",
      previousRevisionId: "rev_1"
    },
    recentTurn: {
      lastChange: "Refine the landing page.",
      lastRejection: "",
      lastBlocker: "",
      generationOutcome: "ok"
    }
  };
}

test("landing workspace prompt request stays pure and page anchored", () => {
  const sourcePayload = makeLandingDraft();
  const proofBasis = buildLandingWorkspaceProofBasis(sourcePayload);
  const request = buildLandingWorkspaceCandidateRequest({
    pageId: "page_1",
    baseRevision: { id: "rev_base" },
    currentRevision: { id: "rev_2" },
    changeIntent: "Refine the hero.",
    proofBasis,
    sourcePayload
  });

  assert.equal(request.artifactClass, "landing_workspace_draft");
  assert.equal(request.schemaId, "landing_workspace_draft.v1");
  assert.equal(request.schemaVersion, "v1");
  assert.equal(request.promptPacket.requestScope.workspace, "landing_workspace");
  assert.equal(request.promptPacket.requestScope.routeFamily, "landing");
  assert.equal(request.promptPacket.canonicalContext.compositionFamily, "landing");
  assert.match(request.promptPacket.prompt, /page=page_1/);
  assert.match(request.promptPacket.prompt, /Не придумывайте нового владельца страницы/);
  assert.match(request.promptPacket.prompt, /proof=service_1, case_1, media_2, media_1/);
  assert.deepEqual(request.normalizedPayload, makeLandingDraft());
});

test("landing workspace derived slice and verification report share the same section projection", () => {
  const sourcePayload = makeLandingDraft();
  const spec = buildLandingWorkspaceCandidateSpec({
    candidateId: "landing_candidate_1",
    pageId: "page_1",
    landingDraftId: "rev_2",
    baseRevisionId: "rev_base",
    sourceContextSummary: "page=page_1",
    payload: sourcePayload
  });
  const derived = buildLandingWorkspaceDerivedArtifactSlice({
    candidateSpec: spec,
    previewMode: "tablet",
    verificationSummary: "Ready for review.",
    reviewStatus: "draft"
  });
  const report = buildLandingWorkspaceVerificationReport({
    candidateSpec: derived,
    readiness: {
      summary: "Ready.",
      hasBlocking: false,
      results: []
    },
    revision: {
      state: "draft",
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      previewStatus: "preview_renderable"
    }
  });

  assert.equal(derived.pageId, "page_1");
  assert.equal(derived.landingDraftId, "rev_2");
  assert.equal(derived.previewMode, "tablet");
  assert.deepEqual(spec.draft, sourcePayload);
  assert.deepEqual(projectLandingWorkspaceCandidatePayload(spec.payload), spec.draft);
  assert.deepEqual(derived.draft, spec.draft);
  assert.deepEqual(derived.pagePayload, spec.payload);
  assert.equal(derived.pagePayload.pageThemeKey, "earth_sand");
  assert.ok(Array.isArray(derived.payload.blocks));
  assert.equal(derived.payload.blocks[0].type, "hero");
  assert.equal(derived.payload.blocks[0].textEmphasisPreset, "standard");
  assert.equal(derived.payload.blocks[0].surfaceTone, "plain");
  assert.equal(derived.blocks[0].id, "landing_hero");
  assert.equal(derived.shellRegions[0].id, "landing_header");
  assert.deepEqual(report.blocks.map((section) => section.id), derived.blocks.map((section) => section.id));
  assert.equal(report.blocks[0].id, "landing_hero");
  assert.equal(report.shellRegions.length, 2);
  assert.equal(report.renderCompatible, true);
  assert.equal(report.overallStatus, "pass");
  assert.equal(report.pageThemeKey, "earth_sand");
  assert.equal(report.classResults.some((result) => result.classId === "visual/readability" && result.status === "pass"), true);
});

test("landing workspace verification warns when stage A visual semantics create softer readability risk", () => {
  const sourcePayload = makeLandingDraft({
    pageThemeKey: "slate_editorial",
    contentBand: {
      body: "Body",
      subtitle: "",
      textEmphasisPreset: "strong",
      surfaceTone: "emphasis"
    }
  });
  const spec = buildLandingWorkspaceCandidateSpec({
    candidateId: "landing_candidate_1",
    pageId: "page_1",
    landingDraftId: "rev_2",
    baseRevisionId: "rev_base",
    sourceContextSummary: "page=page_1",
    payload: sourcePayload
  });
  const report = buildLandingWorkspaceVerificationReport({
    candidateSpec: spec,
    readiness: {
      summary: "Ready.",
      hasBlocking: false,
      results: []
    },
    revision: {
      state: "draft",
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      previewStatus: "preview_renderable"
    }
  });

  const visualClass = report.classResults.find((result) => result.classId === "visual/readability");
  assert.equal(visualClass?.status, "warning");
  assert.equal(report.warnings.some((issue) => issue.code === "contrast_warning_content_band"), true);
});

test("landing workspace session anchoring persists a pageId mismatch once and then stays stable", async () => {
  const baseSlice = makeMemorySlice("other_page");
  let anchoredCalls = 0;
  let capturedDelta = null;

  const result = await readLandingWorkspaceSession("page_1", {
    sessionId: "session_1",
    baseRevisionId: "rev_base",
    changeIntent: "Refine the landing page.",
    editorialGoal: "Refine the landing page from canonical Page truth.",
    variantDirection: "hero-first",
    selectedMedia: ["media_1"],
    selectedCaseIds: ["case_1"],
    selectedGalleryIds: [],
    previewMode: "tablet",
    actor: {
      id: "user_1",
      username: "seo_manager",
      displayName: "SEO Manager",
      role: "seo_manager"
    }
  }, {
    sessionId: "session_1",
    readMemoryCardSlice: async () => baseSlice,
    readWorkspaceSessionRecord: async () => ({
      workspace_memory_card: {
        sessionIdentity: {
          entityId: "other_page"
        }
      }
    }),
    findConflictingLandingWorkspaceSession: async () => null,
    applyAcceptedMemoryDelta: async (input) => {
      anchoredCalls += 1;
      capturedDelta = input.delta;

      return {
        ...baseSlice,
        sessionIdentity: {
          ...baseSlice.sessionIdentity,
          entityId: "page_1"
        }
      };
    }
  });

  assert.equal(anchoredCalls, 1);
  assert.equal(capturedDelta.sessionIdentity.entityId, "page_1");
  assert.equal(result.sessionIdentity.entityId, "page_1");

  anchoredCalls = 0;
  capturedDelta = null;

  const stableResult = await readLandingWorkspaceSession("page_1", {
    sessionId: "session_1",
    baseRevisionId: "rev_base",
    actor: {
      id: "user_1",
      username: "seo_manager",
      displayName: "SEO Manager",
      role: "seo_manager"
    }
  }, {
    sessionId: "session_1",
    readMemoryCardSlice: async () => baseSlice,
    readWorkspaceSessionRecord: async () => ({
      workspace_memory_card: {
        sessionIdentity: {
          entityId: "page_1"
        }
      }
    }),
    findConflictingLandingWorkspaceSession: async () => null,
    applyAcceptedMemoryDelta: async () => {
      anchoredCalls += 1;
      return baseSlice;
    }
  });

  assert.equal(anchoredCalls, 0);
  assert.equal(capturedDelta, null);
  assert.equal(stableResult.sessionIdentity.entityId, "page_1");
});

test("landing workspace session guard blocks parallel active sessions for the same pageId", async () => {
  const baseSlice = makeMemorySlice("other_page");
  let anchoredCalls = 0;

  const result = await readLandingWorkspaceSession("page_1", {
    sessionId: "session_1",
    baseRevisionId: "rev_base",
    changeIntent: "Refine the landing page.",
    actor: {
      id: "user_1",
      username: "seo_manager",
      displayName: "SEO Manager",
      role: "seo_manager"
    }
  }, {
    sessionId: "session_1",
    readMemoryCardSlice: async () => baseSlice,
    readWorkspaceSessionRecord: async () => ({
      workspace_memory_card: {
        sessionIdentity: {
          entityId: "other_page"
        }
      }
    }),
    findConflictingLandingWorkspaceSession: async () => ({
      status: "blocked_by_active_page_session",
      pageId: "page_1",
      activeSessionId: "session_other",
      actorUserId: "user_2",
      actorDisplayName: "Another editor",
      updatedAt: "2026-04-06T12:10:00.000Z"
    }),
    applyAcceptedMemoryDelta: async () => {
      anchoredCalls += 1;
      return baseSlice;
    }
  });

  assert.equal(anchoredCalls, 0);
  assert.equal(result.sessionIdentity.entityId, "other_page");
  assert.equal(result.sessionGuard.status, "blocked_by_active_page_session");
  assert.equal(result.sessionGuard.activeSessionId, "session_other");
});
