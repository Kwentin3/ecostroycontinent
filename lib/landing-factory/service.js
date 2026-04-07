import { z } from "zod";

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

export const SERVICE_LANDING_SPEC_VERSION = "v1";
export const SERVICE_LANDING_ROUTE_FAMILY = "service";
export const SERVICE_LANDING_ARTIFACT_CLASS = "service_landing_candidate_payload";

export const SERVICE_LANDING_SECTION_REGISTRY = Object.freeze([
  {
    id: "service_hero",
    label: "Главный блок",
    renderTarget: "Верхний главный блок",
    required: true,
    sourceFields: ["h1", "summary", "ctaVariant"]
  },
  {
    id: "primary_media",
    label: "Основное медиа",
    renderTarget: "Основное изображение",
    required: false,
    sourceFields: ["primaryMediaAssetId"]
  },
  {
    id: "service_scope",
    label: "Объём услуг",
    renderTarget: "Раздел объёма и способов работ",
    required: true,
    sourceFields: ["serviceScope", "problemsSolved", "methods"]
  },
  {
    id: "related_cases",
    label: "Связанные кейсы",
    renderTarget: "Карточки кейсов",
    required: false,
    sourceFields: ["relatedCaseIds"]
  },
  {
    id: "gallery",
    label: "Галерея",
    renderTarget: "Раздел галереи",
    required: false,
    sourceFields: ["galleryIds"]
  }
]);

export const serviceLandingCandidatePayloadSchema = z.object({
  slug: nonEmptyString,
  title: nonEmptyString,
  h1: nonEmptyString,
  summary: nonEmptyString,
  serviceScope: nonEmptyString,
  problemsSolved: optionalString,
  methods: optionalString,
  ctaVariant: nonEmptyString,
  relatedCaseIds: idArray,
  galleryIds: idArray,
  primaryMediaAssetId: optionalString,
  seo: seoSchema.default({})
}).strict();

export const serviceLandingCandidateResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    slug: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    h1: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    serviceScope: { type: "string", minLength: 1 },
    problemsSolved: { type: "string" },
    methods: { type: "string" },
    ctaVariant: { type: "string", minLength: 1 },
    relatedCaseIds: {
      type: "array",
      items: { type: "string", minLength: 1 }
    },
    galleryIds: {
      type: "array",
      items: { type: "string", minLength: 1 }
    },
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
    "slug",
    "title",
    "h1",
    "summary",
    "serviceScope",
    "problemsSolved",
    "methods",
    "ctaVariant",
    "relatedCaseIds",
    "galleryIds",
    "primaryMediaAssetId",
    "seo"
  ]
};

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function toCompactList(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function compactText(value) {
  if (!hasText(value)) {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

export function projectServiceLandingSections(payload = {}) {
  return SERVICE_LANDING_SECTION_REGISTRY.map((section) => {
    let present = false;

    switch (section.id) {
      case "service_hero":
        present = hasText(payload.h1) && hasText(payload.summary) && hasText(payload.ctaVariant);
        break;
      case "primary_media":
        present = hasText(payload.primaryMediaAssetId);
        break;
      case "service_scope":
        present = hasText(payload.serviceScope);
        break;
      case "related_cases":
        present = toCompactList(payload.relatedCaseIds).length > 0;
        break;
      case "gallery":
        present = toCompactList(payload.galleryIds).length > 0;
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

export function buildServiceLandingSourceContextSummary({
  entityId = "",
  baseRevision = null,
  currentRevision = null,
  changeIntent = "",
  proofBasis = [],
  variantKey = ""
} = {}) {
  const parts = [];

  if (hasText(entityId)) {
    parts.push(`entity=${entityId}`);
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

  return parts.join(" | ").slice(0, 700) || "черновик услуги";
}

export function buildServiceLandingCandidateRequest(input = {}) {
  const normalizedPayload = serviceLandingCandidatePayloadSchema.parse(input.sourcePayload);
  const sourceContextSummary = input.sourceContextSummary || buildServiceLandingSourceContextSummary({
    entityId: input.entityId,
    baseRevision: input.baseRevision,
    currentRevision: input.currentRevision,
    changeIntent: input.changeIntent,
    proofBasis: input.proofBasis,
    variantKey: input.variantKey
  });
  const promptPacket = assemblePromptPacket({
    requestScope: {
      workspace: "service_landing",
      action: "generate_candidate",
      routeFamily: SERVICE_LANDING_ROUTE_FAMILY
    },
    memoryContext: input.memorySlice ?? {},
    canonicalContext: {
      entityId: input.entityId ?? "",
      baseRevisionId: input.baseRevision?.id ?? input.baseRevisionId ?? "",
      currentRevisionId: input.currentRevision?.id ?? "",
      changeIntent: input.changeIntent ?? "",
      proofBasis: Array.isArray(input.proofBasis) ? input.proofBasis : [],
      sourceContextSummary,
      variantKey: input.variantKey ?? "",
      routeFamily: SERVICE_LANDING_ROUTE_FAMILY
    },
    artifactContract: {
      artifactClass: SERVICE_LANDING_ARTIFACT_CLASS,
      schemaId: "service_landing_candidate_payload.v1",
      schemaVersion: SERVICE_LANDING_SPEC_VERSION
    },
    actionSlices: [
      {
        id: "service_landing_generation",
        title: "Service landing generation",
        content: [
          "You are generating a service-first landing candidate for /services/[slug].",
          "Return only JSON that matches the schema exactly.",
          "Use only the provided service truth. Do not invent unsupported facts, blocks, routes, or markup.",
          "If a field cannot be substantiated, keep the existing truth or leave the optional field empty.",
          "Preserve slug, route family, and allowed service sections. Do not introduce hero/page blocks, FAQ blocks, or article content.",
          `Source context summary: ${sourceContextSummary || "черновик услуги"}`,
          "Source service payload:",
          JSON.stringify(normalizedPayload, null, 2)
        ]
      }
    ]
  });

  return {
    artifactClass: SERVICE_LANDING_ARTIFACT_CLASS,
    schemaId: "service_landing_candidate_payload.v1",
    schemaVersion: SERVICE_LANDING_SPEC_VERSION,
    schemaValidator: serviceLandingCandidatePayloadSchema,
    responseJsonSchema: serviceLandingCandidateResponseJsonSchema,
    promptPacket,
    prompt: promptPacket.prompt,
    sourceContextSummary,
    normalizedPayload
  };
}

// Canonical run slice for the current service landing attempt.
// Keep audit details, review views, and Memory Card projections derived from this object instead of reserializing candidate state separately.
export function buildServiceLandingDerivedArtifactSlice({
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

export function buildServiceLandingCandidateSpec({
  candidateId = createId("service_candidate"),
  baseRevisionId = "",
  variantKey = "",
  sourceContextSummary = "",
  payload
} = {}) {
  const normalizedPayload = serviceLandingCandidatePayloadSchema.parse(payload);

  return {
    specVersion: SERVICE_LANDING_SPEC_VERSION,
    candidateId,
    baseRevisionId,
    routeFamily: SERVICE_LANDING_ROUTE_FAMILY,
    variantKey: hasText(variantKey) ? compactText(variantKey) : "",
    sourceContextSummary,
    payload: normalizedPayload,
    sections: projectServiceLandingSections(normalizedPayload)
  };
}

function makeReportIssue(severity, classId, code, message, field = null) {
  return {
    severity,
    classId,
    code,
    message,
    field
  };
}

function collectReadinessIssues(readiness = null) {
  const results = Array.isArray(readiness?.results) ? readiness.results : [];

  return {
    structural: results.filter((result) => /^missing_/.test(result.code) && /slug|service|cta|blocks?/i.test(result.code)),
    reference: results.filter((result) => /^(invalid_|unpublished_)/.test(result.code)),
    editorial: results.filter((result) => !/^(invalid_|unpublished_)/.test(result.code))
  };
}

export function buildServiceLandingVerificationReport({
  candidateSpec,
  readiness = null,
  revision = null,
  llmResult = null
} = {}) {
  const projectedSections = projectServiceLandingSections(candidateSpec?.payload ?? {});
  const sections = Array.isArray(candidateSpec?.sections)
    ? candidateSpec.sections
    : projectedSections;
  const contractIssues = [];

  if (candidateSpec?.routeFamily !== SERVICE_LANDING_ROUTE_FAMILY) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "route_family_mismatch",
        `Маршрут кандидата должен быть «${SERVICE_LANDING_ROUTE_FAMILY}».`,
        "routeFamily"
      )
    );
  }

  if (candidateSpec?.specVersion !== SERVICE_LANDING_SPEC_VERSION) {
    contractIssues.push(
      makeReportIssue(
        "blocking",
        "structural/schema",
        "spec_version_mismatch",
        `Версия спецификации кандидата должна быть «${SERVICE_LANDING_SPEC_VERSION}».`,
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
        "Разделы кандидата должны идти в детерминированном порядке реестра услуг.",
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
          `Обязательный раздел услуги «${section.id}» отсутствует.`,
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

  if (!hasText(candidateSpec?.payload?.problemsSolved)) {
    claimWarnings.push(
      makeReportIssue(
        "warning",
        "claim/risk",
        "weak_proof_narrative",
        "Кандидат не объясняет, какие проблемы решает."
      )
    );
  }

  if (!hasText(candidateSpec?.payload?.methods)) {
    claimWarnings.push(
      makeReportIssue(
        "warning",
        "claim/risk",
        "weak_method_narrative",
        "Кандидат не описывает, как выполняется работа."
      )
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
    specVersion: candidateSpec?.specVersion ?? SERVICE_LANDING_SPEC_VERSION,
    candidateId: candidateSpec?.candidateId ?? "",
    baseRevisionId: candidateSpec?.baseRevisionId ?? "",
    routeFamily: candidateSpec?.routeFamily ?? SERVICE_LANDING_ROUTE_FAMILY,
    checkedAt: new Date().toISOString(),
    sourceContextSummary: candidateSpec?.sourceContextSummary ?? "",
    overallStatus,
    summary: hasBlocking
      ? "Есть блокирующие проблемы в кандидате услуги."
      : hasWarnings
        ? "Есть предупреждения по кандидату услуги."
        : "Кандидат услуги прошёл проверку.",
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

export function getLatestServiceLandingFactoryRecord(auditItems = []) {
  return (Array.isArray(auditItems) ? auditItems : []).find((item) => item?.details?.landingFactory) ?? null;
}

export function buildServiceLandingWorkspaceMemoryDelta({
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

export async function requestServiceLandingCandidate(input = {}, deps = {}) {
  const candidateId = input.candidateId ?? createId("service_candidate");
  const request = buildServiceLandingCandidateRequest(input);
  const llmResult = await requestStructuredArtifact(request, deps);

  if (llmResult.status !== "ok") {
    return {
      ...llmResult,
      candidateId,
      promptPacket: request.promptPacket,
      sourceContextSummary: request.sourceContextSummary,
      sections: projectServiceLandingSections(request.normalizedPayload),
      specVersion: SERVICE_LANDING_SPEC_VERSION,
      routeFamily: SERVICE_LANDING_ROUTE_FAMILY
    };
  }

  const payload = serviceLandingCandidatePayloadSchema.parse(llmResult.artifact);
  const spec = buildServiceLandingCandidateSpec({
    candidateId,
    baseRevisionId: input.baseRevisionId ?? "",
    variantKey: input.variantKey ?? "",
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
    specVersion: SERVICE_LANDING_SPEC_VERSION,
    routeFamily: SERVICE_LANDING_ROUTE_FAMILY
  };
}
