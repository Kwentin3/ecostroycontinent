import { z } from "zod";

import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import { assemblePromptPacket } from "../ai-workspace/prompt.js";
import { requestStructuredArtifact } from "../llm/facade.js";
import { createId } from "../utils/id.js";

const nonEmptyString = z.string().trim().min(1);
const optionalString = z.string().trim().optional().default("");
const idArray = z.array(nonEmptyString).default([]);

const seoSchema = z.object({
  metaTitle: optionalString,
  metaDescription: optionalString,
  canonicalIntent: optionalString,
  indexationFlag: z.enum(["index", "noindex"]).default("index"),
  openGraphTitle: optionalString,
  openGraphDescription: optionalString,
  openGraphImageAssetId: optionalString
}).strict();

export const LANDING_WORKSPACE_SPEC_VERSION = "v1";
export const LANDING_WORKSPACE_ROUTE_FAMILY = "landing";
export const LANDING_WORKSPACE_WORKSPACE_KEY = "landing_workspace";
export const LANDING_WORKSPACE_ARTIFACT_CLASS = "landing_workspace_candidate_payload";

export const LANDING_WORKSPACE_SECTION_REGISTRY = Object.freeze([
  { id: "landing_hero", label: "Hero", renderTarget: "Primary page hero", required: true, sourceFields: ["title", "h1"] },
  { id: "landing_intro", label: "Intro", renderTarget: "Intro line beneath the hero", required: false, sourceFields: ["intro"] },
  { id: "primary_media", label: "Primary media", renderTarget: "Main preview media", required: false, sourceFields: ["primaryMediaAssetId"] },
  { id: "landing_body", label: "Body", renderTarget: "Rich text block", required: false, sourceFields: ["body"] },
  { id: "related_services", label: "Related services", renderTarget: "Service reference cards", required: false, sourceFields: ["serviceIds"] },
  { id: "related_cases", label: "Related cases", renderTarget: "Case reference cards", required: false, sourceFields: ["caseIds"] },
  { id: "gallery", label: "Gallery", renderTarget: "Gallery section", required: false, sourceFields: ["galleryIds"] },
  { id: "cta_band", label: "CTA band", renderTarget: "Call to action block", required: false, sourceFields: ["ctaTitle", "ctaBody", "defaultBlockCtaLabel", "contactNote"] }
]);

export const landingWorkspaceCandidatePayloadSchema = z.object({
  pageType: z.enum([PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS]).default(PAGE_TYPES.ABOUT),
  slug: nonEmptyString,
  title: nonEmptyString,
  h1: nonEmptyString,
  intro: optionalString,
  body: optionalString,
  contactNote: optionalString,
  ctaTitle: optionalString,
  ctaBody: optionalString,
  defaultBlockCtaLabel: optionalString,
  serviceIds: idArray,
  caseIds: idArray,
  galleryIds: idArray,
  primaryMediaAssetId: optionalString,
  seo: seoSchema.default({})
}).strict();

export const landingWorkspaceCandidateResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pageType: { type: "string", enum: [PAGE_TYPES.ABOUT, PAGE_TYPES.CONTACTS] },
    slug: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    h1: { type: "string", minLength: 1 },
    intro: { type: "string" },
    body: { type: "string" },
    contactNote: { type: "string" },
    ctaTitle: { type: "string" },
    ctaBody: { type: "string" },
    defaultBlockCtaLabel: { type: "string" },
    serviceIds: { type: "array", items: { type: "string", minLength: 1 } },
    caseIds: { type: "array", items: { type: "string", minLength: 1 } },
    galleryIds: { type: "array", items: { type: "string", minLength: 1 } },
    primaryMediaAssetId: { type: "string" },
    seo: {
      type: "object",
      additionalProperties: false,
      properties: {
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
        canonicalIntent: { type: "string" },
        indexationFlag: { type: "string", enum: ["index", "noindex"] },
        openGraphTitle: { type: "string" },
        openGraphDescription: { type: "string" },
        openGraphImageAssetId: { type: "string" }
      },
      required: [
        "metaTitle",
        "metaDescription",
        "canonicalIntent",
        "indexationFlag",
        "openGraphTitle",
        "openGraphDescription",
        "openGraphImageAssetId"
      ]
    }
  },
  required: [
    "pageType",
    "slug",
    "title",
    "h1",
    "intro",
    "body",
    "contactNote",
    "ctaTitle",
    "ctaBody",
    "defaultBlockCtaLabel",
    "serviceIds",
    "caseIds",
    "galleryIds",
    "primaryMediaAssetId",
    "seo"
  ]
};

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function compactText(value) {
  if (!hasText(value)) {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function toCompactList(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => asString(item))
    .filter(Boolean);
}

function makeReportIssue(severity, classId, code, message, field = null) {
  return { severity, classId, code, message, field };
}

function collectReadinessIssues(readiness = null) {
  const results = Array.isArray(readiness?.results) ? readiness.results : [];

  return {
    structural: results.filter((result) => /^missing_/.test(result.code) && /slug|page|block|hero|body|cta/i.test(result.code)),
    reference: results.filter((result) => /^(invalid_|unpublished_)/.test(result.code)),
    editorial: results.filter((result) => !/^(invalid_|unpublished_)/.test(result.code))
  };
}

export function projectLandingWorkspaceSections(payload = {}) {
  return LANDING_WORKSPACE_SECTION_REGISTRY.map((section) => {
    let present = false;

    switch (section.id) {
      case "landing_hero":
        present = hasText(payload.title) && hasText(payload.h1);
        break;
      case "landing_intro":
        present = hasText(payload.intro);
        break;
      case "primary_media":
        present = hasText(payload.primaryMediaAssetId);
        break;
      case "landing_body":
        present = hasText(payload.body);
        break;
      case "related_services":
        present = toCompactList(payload.serviceIds).length > 0;
        break;
      case "related_cases":
        present = toCompactList(payload.caseIds).length > 0;
        break;
      case "gallery":
        present = toCompactList(payload.galleryIds).length > 0;
        break;
      case "cta_band":
        present = hasText(payload.ctaTitle)
          || hasText(payload.ctaBody)
          || hasText(payload.defaultBlockCtaLabel)
          || hasText(payload.contactNote);
        break;
      default:
        present = false;
        break;
    }

    return {
      id: section.id,
      label: section.label,
      renderTarget: section.renderTarget,
      required: section.required,
      sourceFields: section.sourceFields,
      status: present ? "present" : section.required ? "missing" : "absent"
    };
  });
}

export function buildLandingWorkspaceProofBasis(payload = {}) {
  return [
    ...(Array.isArray(payload.serviceIds) ? payload.serviceIds : []),
    ...(Array.isArray(payload.caseIds) ? payload.caseIds : []),
    ...(Array.isArray(payload.galleryIds) ? payload.galleryIds : []),
    asString(payload.primaryMediaAssetId)
  ].filter(Boolean);
}

export function buildLandingWorkspaceSourceContextSummary({
  pageId = "",
  pageType = "",
  baseRevision = null,
  currentRevision = null,
  changeIntent = "",
  proofBasis = [],
  variantKey = ""
} = {}) {
  const parts = [];

  if (hasText(pageId)) {
    parts.push(`page=${pageId}`);
  }

  if (hasText(pageType)) {
    parts.push(`pageType=${compactText(pageType)}`);
  }

  if (baseRevision?.id) {
    parts.push(`baseRevision=${baseRevision.id}`);
  }

  if (currentRevision?.id) {
    parts.push(`draftRevision=${currentRevision.id}`);
  }

  if (hasText(variantKey)) {
    parts.push(`variant=${compactText(variantKey)}`);
  }

  if (hasText(changeIntent)) {
    parts.push(`intent=${compactText(changeIntent)}`);
  }

  const proof = toCompactList(proofBasis);

  if (proof.length > 0) {
    parts.push(`proof=${proof.join(", ")}`);
  }

  return parts.join(" | ").slice(0, 700) || "landing workspace candidate";
}

export function buildLandingWorkspaceCandidateRequest(input = {}) {
  const normalizedPayload = landingWorkspaceCandidatePayloadSchema.parse(input.sourcePayload);
  const sourceContextSummary = input.sourceContextSummary || buildLandingWorkspaceSourceContextSummary({
    pageId: input.pageId,
    pageType: normalizedPayload.pageType,
    baseRevision: input.baseRevision,
    currentRevision: input.currentRevision,
    changeIntent: input.changeIntent,
    proofBasis: input.proofBasis,
    variantKey: input.variantKey
  });

  // Prompt assembly stays pure; the LLM boundary lives in requestStructuredArtifact elsewhere.
  const promptPacket = assemblePromptPacket({
    requestScope: {
      workspace: LANDING_WORKSPACE_WORKSPACE_KEY,
      action: "generate_candidate",
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    },
    memoryContext: input.memorySlice ?? {},
    canonicalContext: {
      pageId: input.pageId ?? "",
      landingDraftId: input.landingDraftId ?? "",
      pageType: normalizedPayload.pageType,
      baseRevisionId: input.baseRevision?.id ?? input.baseRevisionId ?? "",
      currentRevisionId: input.currentRevision?.id ?? "",
      changeIntent: input.changeIntent ?? "",
      proofBasis: Array.isArray(input.proofBasis) ? input.proofBasis : [],
      sourceContextSummary,
      variantKey: input.variantKey ?? "",
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    },
    artifactContract: {
      artifactClass: LANDING_WORKSPACE_ARTIFACT_CLASS,
      schemaId: "landing_workspace_candidate_payload.v1",
      schemaVersion: LANDING_WORKSPACE_SPEC_VERSION
    },
    actionSlices: [
      {
        id: "landing_workspace_generation",
        title: "Landing workspace generation",
        content: [
          "You are generating a landing-first Page candidate anchored to the canonical Page truth.",
          "Return only JSON that matches the schema exactly.",
          "Do not invent a new Page owner, route, or truth source. The pageId anchor is already fixed.",
          "Keep the output compatible with the existing Page renderer and publish workflow.",
          "Use only the provided Page truth and evidence. If a field cannot be substantiated, preserve the current truth or leave the optional field empty.",
          `Source context summary: ${sourceContextSummary || "landing workspace candidate"}`,
          "Source page payload:",
          JSON.stringify(normalizedPayload, null, 2)
        ]
      }
    ]
  });

  return {
    artifactClass: LANDING_WORKSPACE_ARTIFACT_CLASS,
    schemaId: "landing_workspace_candidate_payload.v1",
    schemaVersion: LANDING_WORKSPACE_SPEC_VERSION,
    schemaValidator: landingWorkspaceCandidatePayloadSchema,
    responseJsonSchema: landingWorkspaceCandidateResponseJsonSchema,
    promptPacket,
    prompt: promptPacket.prompt,
    sourceContextSummary,
    normalizedPayload
  };
}

export function buildLandingWorkspaceCandidateSpec({
  candidateId = createId("landing_candidate"),
  pageId = "",
  landingDraftId = "",
  baseRevisionId = "",
  routeFamily = LANDING_WORKSPACE_ROUTE_FAMILY,
  sourceContextSummary = "",
  payload
} = {}) {
  const normalizedPayload = landingWorkspaceCandidatePayloadSchema.parse(payload);

  return {
    specVersion: LANDING_WORKSPACE_SPEC_VERSION,
    candidateId,
    pageId,
    landingDraftId,
    baseRevisionId,
    routeFamily,
    sourceContextSummary,
    payload: normalizedPayload,
    sections: projectLandingWorkspaceSections(normalizedPayload)
  };
}

export function buildLandingWorkspaceDerivedArtifactSlice({
  candidateSpec = null,
  previewMode = "desktop",
  verificationSummary = "",
  reviewStatus = ""
} = {}) {
  if (!candidateSpec || typeof candidateSpec !== "object") {
    return null;
  }

  return {
    ...candidateSpec,
    previewMode: hasText(previewMode) ? compactText(previewMode) : "desktop",
    verificationSummary: compactText(verificationSummary),
    reviewStatus: compactText(reviewStatus)
  };
}

export function buildLandingWorkspaceVerificationReport({
  candidateSpec,
  readiness = null,
  revision = null,
  llmResult = null
} = {}) {
  const projectedSections = projectLandingWorkspaceSections(candidateSpec?.payload ?? {});
  const sections = Array.isArray(candidateSpec?.sections) ? candidateSpec.sections : projectedSections;
  const contractIssues = [];

  if (candidateSpec?.routeFamily !== LANDING_WORKSPACE_ROUTE_FAMILY) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "route_family_mismatch",
        `Candidate route family must be '${LANDING_WORKSPACE_ROUTE_FAMILY}'.`,
        "routeFamily"
      )
    );
  }

  if (candidateSpec?.specVersion !== LANDING_WORKSPACE_SPEC_VERSION) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "spec_version_mismatch",
        `Candidate spec version must be '${LANDING_WORKSPACE_SPEC_VERSION}'.`,
        "specVersion"
      )
    );
  }

  if (JSON.stringify(sections.map((section) => section.id)) !== JSON.stringify(projectedSections.map((section) => section.id))) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "section_registry_order_mismatch",
        "Candidate sections must follow the deterministic landing registry order.",
        "sections"
      )
    );
  }

  const sectionIssues = [];

  for (const section of sections) {
    if (section.required && section.status === "missing") {
      sectionIssues.push(
        makeReportIssue(
          "blocking",
          "render/compatibility",
          `missing_${section.id}`,
          `Required landing section '${section.id}' is missing.`,
          section.id
        )
      );
    }
  }

  const readinessBuckets = collectReadinessIssues(readiness);
  const structuralIssues = [
    ...contractIssues,
    ...readinessBuckets.structural.map((result) => makeReportIssue("blocking", "structural/schema", result.code, result.message, result.field))
  ];
  const claimWarnings = [];
  const pageType = candidateSpec?.payload?.pageType || PAGE_TYPES.ABOUT;

  if (pageType === PAGE_TYPES.CONTACTS) {
    if (!hasText(candidateSpec?.payload?.contactNote)) {
      claimWarnings.push(
        makeReportIssue("warning", "claim/risk", "weak_contact_note", "The contacts page does not explain the contact note yet.")
      );
    }
  } else if (!hasText(candidateSpec?.payload?.body)) {
    claimWarnings.push(
      makeReportIssue("warning", "claim/risk", "weak_body_narrative", "The landing page does not explain the main body yet.")
    );
  }

  if (!hasText(candidateSpec?.payload?.ctaTitle) && !hasText(candidateSpec?.payload?.defaultBlockCtaLabel)) {
    claimWarnings.push(
      makeReportIssue("warning", "claim/risk", "weak_cta_narrative", "The landing candidate does not define a clear call to action.")
    );
  }

  const classResults = [
    {
      classId: "structural/schema",
      status: structuralIssues.length > 0 ? "blocked" : "pass",
      issues: structuralIssues
    },
    {
      classId: "reference/truth",
      status: readinessBuckets.reference.length > 0 ? "blocked" : "pass",
      issues: readinessBuckets.reference.map((result) => makeReportIssue("blocking", "reference/truth", result.code, result.message, result.field))
    },
    {
      classId: "render/compatibility",
      status: sectionIssues.length > 0 ? "blocked" : "pass",
      issues: sectionIssues
    },
    {
      classId: "editorial/publish-readiness",
      status: readinessBuckets.editorial.some((result) => result.severity === "blocking")
        ? "blocked"
        : readinessBuckets.editorial.some((result) => result.severity === "warning")
          ? "warning"
          : "pass",
      issues: readinessBuckets.editorial.map((result) => makeReportIssue(result.severity, "editorial/publish-readiness", result.code, result.message, result.field))
    },
    {
      classId: "claim/risk",
      status: claimWarnings.length > 0 ? "warning" : "pass",
      issues: claimWarnings
    }
  ];

  const blockingIssues = classResults.flatMap((result) => result.issues.filter((issue) => issue.severity === "blocking"));
  const warnings = classResults.flatMap((result) => result.issues.filter((issue) => issue.severity === "warning"));
  const hasBlocking = blockingIssues.length > 0;
  const hasWarnings = warnings.length > 0;
  const approvalEligible = !hasBlocking;
  const publishReady = !hasBlocking
    && revision?.state === "review"
    && (!revision?.ownerReviewRequired || revision?.ownerApprovalStatus === "approved")
    && revision?.previewStatus === "preview_renderable";
  const renderCompatible = contractIssues.length === 0
    && sections.every((section) => !section.required || section.status === "present");
  const overallStatus = hasBlocking
    ? "blocked"
    : hasWarnings
      ? "pass_with_warnings"
      : "pass";

  return {
    specVersion: candidateSpec?.specVersion ?? LANDING_WORKSPACE_SPEC_VERSION,
    candidateId: candidateSpec?.candidateId ?? "",
    pageId: candidateSpec?.pageId ?? "",
    landingDraftId: candidateSpec?.landingDraftId ?? "",
    baseRevisionId: candidateSpec?.baseRevisionId ?? "",
    routeFamily: candidateSpec?.routeFamily ?? LANDING_WORKSPACE_ROUTE_FAMILY,
    checkedAt: new Date().toISOString(),
    sourceContextSummary: candidateSpec?.sourceContextSummary ?? "",
    overallStatus,
    summary: hasBlocking
      ? "There are blocking landing candidate issues."
      : hasWarnings
        ? "There are non-blocking landing candidate warnings."
        : "Landing candidate passed verification.",
    classResults,
    blockingIssues,
    warnings,
    hasBlocking,
    hasWarnings,
    sections,
    renderCompatible,
    publishReady,
    approvalEligible,
    llm: llmResult
      ? {
          traceId: llmResult.traceId,
          requestId: llmResult.requestId,
          providerId: llmResult.providerId,
          modelId: llmResult.modelId,
          configState: llmResult.configState,
          transportUsed: llmResult.transportUsed,
          transportState: llmResult.transportState,
          providerState: llmResult.providerState,
          structuredOutputState: llmResult.structuredOutputState,
          validationState: llmResult.validationState,
          status: llmResult.status,
          retryable: llmResult.retryable
        }
      : null
  };
}

export function buildLandingWorkspaceWorkspaceMemoryDelta({
  sessionIdentity = {},
  editorialIntent = {},
  proofSelection = {},
  artifactState = {},
  editorialDecisions = {},
  traceState = {},
  archivePointer = {},
  recentTurn = {}
} = {}) {
  return {
    sessionIdentity,
    editorialIntent,
    proofSelection,
    artifactState,
    editorialDecisions,
    traceState,
    archivePointer,
    recentTurn
  };
}

export function buildLandingWorkspaceAuditDetails(candidateResult, derivedArtifactSlice) {
  return {
    landingWorkspace: {
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

export async function requestLandingWorkspaceCandidate(input = {}, deps = {}) {
  const candidateId = input.candidateId ?? createId("landing_candidate");
  const request = buildLandingWorkspaceCandidateRequest(input);
  const llmResult = await requestStructuredArtifact(request, deps);

  if (llmResult.status !== "ok") {
    return {
      ...llmResult,
      candidateId,
      promptPacket: request.promptPacket,
      sourceContextSummary: request.sourceContextSummary,
      sections: projectLandingWorkspaceSections(request.normalizedPayload),
      specVersion: LANDING_WORKSPACE_SPEC_VERSION,
      routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
    };
  }

  const payload = landingWorkspaceCandidatePayloadSchema.parse(llmResult.artifact);
  const spec = buildLandingWorkspaceCandidateSpec({
    candidateId,
    pageId: input.pageId ?? "",
    landingDraftId: input.landingDraftId ?? "",
    baseRevisionId: input.baseRevisionId ?? "",
    routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY,
    sourceContextSummary: request.sourceContextSummary,
    payload
  });

  return {
    ...llmResult,
    candidateId,
    promptPacket: request.promptPacket,
    sourceContextSummary: request.sourceContextSummary,
    payload,
    spec,
    sections: spec.sections,
    specVersion: LANDING_WORKSPACE_SPEC_VERSION,
    routeFamily: LANDING_WORKSPACE_ROUTE_FAMILY
  };
}
