import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/admin/entities/service/landing-factory/generate/route.js";
import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import {
  buildServiceLandingCandidateSpec,
  SERVICE_LANDING_ROUTE_FAMILY
} from "../lib/landing-factory/service.js";

function makeServiceFormFields(overrides = {}) {
  return {
    entityId: "service_1",
    changeIntent: "Preserve the published base revision id.",
    slug: "service-drainage",
    title: "Drainage systems",
    h1: "Drainage systems for sites",
    intro: "",
    body: "",
    summary: "Reliable water drainage for private and commercial sites.",
    serviceScope: "We design and install drainage systems.",
    problemsSolved: "Flooding, runoff, and standing water.",
    methods: "Survey, plan, install, verify.",
    ctaVariant: "request_estimate",
    relatedCaseIds: ["case_1"],
    galleryIds: ["gallery_1"],
    primaryMediaAssetId: "media_1",
    metaTitle: "Drainage systems",
    metaDescription: "Drainage systems for sites.",
    canonicalIntent: "/services/service-drainage",
    indexationFlag: "index",
    openGraphTitle: "Drainage systems",
    openGraphDescription: "Drainage systems for sites.",
    openGraphImageAssetId: "media_1",
    ...overrides
  };
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

function buildGenerateRequest(formFields) {
  return new Request("http://localhost/api/admin/entities/service/landing-factory/generate", {
    method: "POST",
    body: buildFormData(formFields)
  });
}

function buildRouteDeps({
  entityType,
  captured
} = {}) {
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
      entity: {
        id: entityType === ENTITY_TYPES.SERVICE ? "service_1" : "page_1",
        entityType
      },
      activePublishedRevision: {
        id: "rev_base",
        state: "published"
      },
      revisions: [
        {
          id: "draft_1",
          state: "draft"
        }
      ]
    }),
    findEntityById: async () => null,
    requestServiceLandingCandidate: async (input) => {
      captured.requestInput = input;

      const spec = buildServiceLandingCandidateSpec({
        candidateId: "service_candidate_test",
        baseRevisionId: input.baseRevisionId ?? "",
        sourceContextSummary: input.sourceContextSummary ?? "",
        payload: input.sourcePayload
      });

      return {
        status: "ok",
        candidateId: spec.candidateId,
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
        entity: {
          id: input.entityId ?? "service_1",
          entityType
        },
        revision: {
          id: "revision_123",
          state: "draft",
          previewStatus: "preview_renderable",
          ownerReviewRequired: false,
          ownerApprovalStatus: "not_required"
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
          id: input.revisionId
        }
      };
    }
  };
}

test("service landing generate route carries the published base revision id into candidate/spec generation", async () => {
  const captured = {};
  const request = buildGenerateRequest(makeServiceFormFields());
  const deps = buildRouteDeps({
    entityType: ENTITY_TYPES.SERVICE,
    captured
  });

  const response = await POST(request, deps);
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/revision_123");
  assert.equal(captured.requestInput.baseRevision.id, "rev_base");
  assert.equal(captured.requestInput.baseRevisionId, "rev_base");
  assert.match(captured.requestInput.sourceContextSummary, /baseRevision=rev_base/);
  assert.equal(captured.requestInput.currentRevision.id, "draft_1");
  assert.equal(captured.requestInput.sourcePayload.slug, "service-drainage");
  assert.equal(captured.requestInput.sourcePayload.serviceScope, "We design and install drainage systems.");
  assert.equal(captured.requestInput.sourcePayload.seo.metaTitle, "Drainage systems");
  assert.equal(captured.saveDraftInput.entityType, ENTITY_TYPES.SERVICE);
  assert.equal(captured.saveDraftInput.auditDetails.landingFactory.candidateSpec.baseRevisionId, "rev_base");
  assert.equal(captured.saveDraftInput.auditDetails.landingFactory.candidateSpec.routeFamily, SERVICE_LANDING_ROUTE_FAMILY);
  assert.equal(captured.submitInput.revisionId, "revision_123");
});

test("service landing generate route blocks non-service entities before generation", async () => {
  const captured = {
    candidateCalled: false
  };
  const request = buildGenerateRequest({
    ...makeServiceFormFields({
      entityId: "page_1",
      changeIntent: "Should be rejected."
    })
  });
  const deps = buildRouteDeps({
    entityType: ENTITY_TYPES.PAGE,
    captured: {
      ...captured,
      requestInput: null,
      saveDraftInput: null,
      submitInput: null
    }
  });

  deps.requestServiceLandingCandidate = async () => {
    captured.candidateCalled = true;
    throw new Error("requestServiceLandingCandidate should not be called for non-service entities.");
  };
  deps.saveDraft = async () => {
    throw new Error("saveDraft should not be called for non-service entities.");
  };
  deps.evaluateReadiness = async () => {
    throw new Error("evaluateReadiness should not be called for non-service entities.");
  };
  deps.submitRevisionForReview = async () => {
    throw new Error("submitRevisionForReview should not be called for non-service entities.");
  };

  const response = await POST(request, deps);
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/service/page_1");
  assert.equal(captured.candidateCalled, false);
});
