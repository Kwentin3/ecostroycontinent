import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";
import {
  buildServiceLandingCandidateRequest,
  buildServiceLandingCandidateSpec,
  buildServiceLandingDerivedArtifactSlice,
  buildServiceLandingSourceContextSummary,
  buildServiceLandingVerificationReport,
  getLatestServiceLandingFactoryRecord,
  projectServiceLandingSections,
  SERVICE_LANDING_ROUTE_FAMILY,
  SERVICE_LANDING_SPEC_VERSION
} from "../lib/landing-factory/service.js";

function makeServicePayload(overrides = {}) {
  return normalizeEntityInput(ENTITY_TYPES.SERVICE, {
    slug: "service-drainage",
    title: "Drainage systems",
    h1: "Drainage systems for sites",
    summary: "Reliable water drainage for private and commercial sites.",
    serviceScope: "We design and install drainage systems.",
    problemsSolved: "",
    methods: "",
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
  });
}

test("projectServiceLandingSections keeps the service registry order and statuses", () => {
  const payload = makeServicePayload();
  const sections = projectServiceLandingSections(payload);

  assert.deepEqual(
    sections.map((section) => section.id),
    ["service_hero", "primary_media", "service_scope", "related_cases", "gallery"]
  );
  assert.deepEqual(
    sections.map((section) => section.status),
    ["present", "present", "present", "present", "present"]
  );
});

test("buildServiceLandingCandidateRequest produces a structured-output prompt bound to service truth", () => {
  const payload = makeServicePayload();
  const sourceContextSummary = buildServiceLandingSourceContextSummary({
    entityId: "entity_1",
    baseRevision: { id: "rev_1" },
    currentRevision: { id: "rev_2" },
    changeIntent: "Generate candidate/spec",
    proofBasis: ["case_1", "gallery_1"]
  });

  const request = buildServiceLandingCandidateRequest({
    entityId: "entity_1",
    baseRevision: { id: "rev_1" },
    currentRevision: { id: "rev_2" },
    changeIntent: "Generate candidate/spec",
    proofBasis: ["case_1", "gallery_1"],
    sourcePayload: payload,
    sourceContextSummary
  });

  assert.equal(request.artifactClass, "service_landing_candidate_payload");
  assert.equal(request.schemaVersion, SERVICE_LANDING_SPEC_VERSION);
  assert.equal(request.sourceContextSummary, sourceContextSummary);
  assert.equal(request.normalizedPayload.slug, payload.slug);
  assert.equal(request.normalizedPayload.seo.metaTitle, payload.seo.metaTitle);
  assert.equal(request.promptPacket.requestScope.workspace, "service_landing");
  assert.equal(request.promptPacket.requestScope.action, "generate_candidate");
  assert.equal(request.promptPacket.actionSlices.length, 1);
  assert.match(request.promptPacket.prompt, /Request scope/);
  assert.match(request.promptPacket.prompt, /Memory context/);
  assert.match(request.promptPacket.prompt, /Action slice: service_landing_generation/);
  assert.equal(request.responseJsonSchema.properties.slug.type, "string");
  assert.match(request.prompt, /service-first landing candidate/i);
  assert.match(request.prompt, /"serviceScope": "We design and install drainage systems\."/);
});

test("buildServiceLandingCandidateSpec wraps the normalized payload in the service-only envelope", () => {
  const payload = makeServicePayload();
  const spec = buildServiceLandingCandidateSpec({
    candidateId: "service_candidate_123",
    baseRevisionId: "rev_1",
    variantKey: "pilot",
    sourceContextSummary: "entity=entity_1 | proof=case_1",
    payload
  });

  assert.equal(spec.candidateId, "service_candidate_123");
  assert.equal(spec.baseRevisionId, "rev_1");
  assert.equal(spec.routeFamily, SERVICE_LANDING_ROUTE_FAMILY);
  assert.equal(spec.specVersion, SERVICE_LANDING_SPEC_VERSION);
  assert.deepEqual(
    spec.sections.map((section) => section.id),
    ["service_hero", "primary_media", "service_scope", "related_cases", "gallery"]
  );
  assert.equal(spec.payload.slug, payload.slug);
});

test("buildServiceLandingDerivedArtifactSlice extends the run artifact without inventing a parallel shape", () => {
  const payload = makeServicePayload();
  const spec = buildServiceLandingCandidateSpec({
    candidateId: "service_candidate_123",
    baseRevisionId: "rev_1",
    variantKey: "pilot",
    sourceContextSummary: "entity=entity_1 | proof=case_1",
    payload
  });
  const derived = buildServiceLandingDerivedArtifactSlice({
    candidateSpec: spec,
    previewMode: "desktop",
    verificationSummary: "Service candidate passed verification.",
    reviewStatus: "review"
  });

  assert.equal(derived.candidateId, spec.candidateId);
  assert.equal(derived.baseRevisionId, spec.baseRevisionId);
  assert.equal(derived.routeFamily, spec.routeFamily);
  assert.equal(derived.specVersion, spec.specVersion);
  assert.equal(derived.previewMode, "desktop");
  assert.equal(derived.verificationSummary, "Service candidate passed verification.");
  assert.equal(derived.reviewStatus, "review");
  assert.deepEqual(derived.sections, spec.sections);
});

test("buildServiceLandingVerificationReport distinguishes pass, warning, and blocked states", () => {
  const payload = makeServicePayload({ problemsSolved: "", methods: "" });
  const spec = buildServiceLandingCandidateSpec({
    candidateId: "service_candidate_456",
    baseRevisionId: "rev_1",
    sourceContextSummary: "entity=entity_1 | proof=case_1",
    payload
  });

  const warningReport = buildServiceLandingVerificationReport({
    candidateSpec: spec,
    readiness: {
      results: [
        { severity: "warning", code: "soft_copy_note", message: "Needs one more note.", field: "summary" }
      ],
      hasBlocking: false
    },
    revision: {
      state: "review",
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      previewStatus: "preview_renderable"
    }
  });

  assert.equal(warningReport.overallStatus, "pass_with_warnings");
  assert.equal(warningReport.hasBlocking, false);
  assert.equal(warningReport.hasWarnings, true);
  assert.equal(warningReport.approvalEligible, true);
  assert.equal(warningReport.publishReady, true);

  const blockedSpec = {
    ...spec,
    sections: spec.sections.map((section) =>
      section.id === "service_scope"
        ? { ...section, status: "missing" }
        : section
    )
  };

  const blockedReport = buildServiceLandingVerificationReport({
    candidateSpec: blockedSpec,
    readiness: {
      results: [],
      hasBlocking: false
    },
    revision: {
      state: "draft",
      ownerReviewRequired: true,
      ownerApprovalStatus: "pending",
      previewStatus: "preview_renderable"
    }
  });

  assert.equal(blockedReport.hasBlocking, true);
  assert.equal(blockedReport.renderCompatible, false);
  assert.equal(blockedReport.approvalEligible, false);

  const routeMismatchReport = buildServiceLandingVerificationReport({
    candidateSpec: {
      ...spec,
      routeFamily: "page"
    },
    readiness: {
      results: [],
      hasBlocking: false
    },
    revision: {
      state: "review",
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      previewStatus: "preview_renderable"
    }
  });

  assert.equal(routeMismatchReport.hasBlocking, true);
  assert.equal(
    routeMismatchReport.classResults[0].issues.some((issue) => issue.code === "route_family_mismatch"),
    true
  );

  const orderMismatchReport = buildServiceLandingVerificationReport({
    candidateSpec: {
      ...spec,
      sections: [...spec.sections].reverse()
    },
    readiness: {
      results: [],
      hasBlocking: false
    },
    revision: {
      state: "review",
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      previewStatus: "preview_renderable"
    }
  });

  assert.equal(orderMismatchReport.hasBlocking, true);
  assert.equal(
    orderMismatchReport.classResults[0].issues.some((issue) => issue.code === "section_registry_order_mismatch"),
    true
  );
});

test("getLatestServiceLandingFactoryRecord returns the most recent landing-factory audit entry", () => {
  const latest = getLatestServiceLandingFactoryRecord([
    { id: "audit_1", details: {} },
    { id: "audit_2", details: { landingFactory: { candidateId: "service_candidate_999" } } }
  ]);

  assert.equal(latest.id, "audit_2");
});
