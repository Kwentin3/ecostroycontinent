import { z } from "zod";

import { createLlmError, LLM_ERROR_KINDS } from "./errors.js";

export function normalizeStructuredJsonText(text, context = {}) {
  const trimmed = typeof text === "string" ? text.trim() : "";

  if (!trimmed) {
    throw createLlmError({
      kind: LLM_ERROR_KINDS.STRUCTURED_OUTPUT,
      code: "STRUCTURED_OUTPUT_EMPTY",
      message: "Provider returned an empty structured-output payload.",
      retryable: false,
      stage: "structured_output",
      details: context
    });
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    throw createLlmError({
      kind: LLM_ERROR_KINDS.STRUCTURED_OUTPUT,
      code: "STRUCTURED_OUTPUT_INVALID_JSON",
      message: "Provider response could not be parsed as JSON.",
      retryable: false,
      stage: "structured_output",
      details: context
    });
  }
}

export function validateStructuredArtifact(schema, artifact, context = {}) {
  if (!schema || typeof schema.safeParse !== "function") {
    throw createLlmError({
      kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
      code: "LLM_VALIDATOR_MISSING",
      message: "A local validation schema is required for structured-output requests.",
      retryable: false,
      stage: "configuration",
      details: context
    });
  }

  const validation = schema.safeParse(artifact);

  if (!validation.success) {
    throw createLlmError({
      kind: LLM_ERROR_KINDS.LOCAL_VALIDATION,
      code: "STRUCTURED_OUTPUT_LOCAL_VALIDATION_FAILED",
      message: "The normalized artifact failed local validation.",
      retryable: false,
      stage: "validation",
      details: {
        ...context,
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    });
  }

  return validation.data;
}

export const llmDiagnosticProbeSchema = z.object({
  probe: z.literal("llm_diagnostic_probe"),
  ok: z.literal(true),
  echo: z.string().trim().min(1)
});

export const llmDiagnosticProbeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    probe: { type: "string", const: "llm_diagnostic_probe" },
    ok: { type: "boolean", const: true },
    echo: { type: "string", minLength: 1 }
  },
  required: ["probe", "ok", "echo"]
};

export function buildLlmDiagnosticProbeRequest() {
  return {
    artifactClass: "llm_diagnostic_probe",
    schemaId: "llm_diagnostic_probe.v1",
    schemaVersion: "v1",
    schemaValidator: llmDiagnosticProbeSchema,
    responseJsonSchema: llmDiagnosticProbeJsonSchema,
    prompt: [
      "Return a JSON object that matches the schema exactly.",
      "Use probe value llm_diagnostic_probe, ok true, and echo pong.",
      "Do not wrap the JSON in markdown fences."
    ].join(" ")
  };
}
