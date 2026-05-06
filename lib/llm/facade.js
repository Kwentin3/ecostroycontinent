import { randomUUID } from "node:crypto";

import { getAppConfig } from "../config.js";

import { buildLlmConfigSnapshot, createLlmConfigFailure, LLM_CONFIG_STATES, LLM_PROVIDER_IDS } from "./config.js";
import { createLlmError, LLM_ERROR_KINDS, normalizeLlmError } from "./errors.js";
import { createBaseLlmResult, createLlmFailureResult, createLlmSuccessResult, LLM_RESULT_STATES } from "./result.js";
import { createGeminiProviderAdapter } from "./providers/gemini.js";
import { createLlmTransport } from "./transport.js";
import { normalizeStructuredJsonText, validateStructuredArtifact } from "./structured-output.js";

function makeRequestEnvelope(request, traceId, configSnapshot) {
  return createBaseLlmResult({
    traceId,
    providerId: configSnapshot.providerId,
    modelId: configSnapshot.modelId,
    configState: configSnapshot.state,
    transportUsed: configSnapshot.transportConfigured ? "socks5" : "none"
  });
}

function patchForError(error) {
  switch (error.kind) {
    case LLM_ERROR_KINDS.FACTORY_RESOLUTION:
      return {
        transportState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        providerState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        structuredOutputState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
      };
    case LLM_ERROR_KINDS.TRANSPORT:
      return {
        transportState: LLM_RESULT_STATES.FAILED,
        providerState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        structuredOutputState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
      };
    case LLM_ERROR_KINDS.PROVIDER:
      return {
        transportState: LLM_RESULT_STATES.SUCCESS,
        providerState: LLM_RESULT_STATES.FAILED,
        structuredOutputState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
      };
    case LLM_ERROR_KINDS.STRUCTURED_OUTPUT:
      return {
        transportState: LLM_RESULT_STATES.SUCCESS,
        providerState: LLM_RESULT_STATES.SUCCESS,
        structuredOutputState: LLM_RESULT_STATES.FAILED,
        validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
      };
    case LLM_ERROR_KINDS.LOCAL_VALIDATION:
      return {
        transportState: LLM_RESULT_STATES.SUCCESS,
        providerState: LLM_RESULT_STATES.SUCCESS,
        structuredOutputState: LLM_RESULT_STATES.SUCCESS,
        validationState: LLM_RESULT_STATES.FAILED
      };
    default:
      return {
        transportState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        providerState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        structuredOutputState: LLM_RESULT_STATES.NOT_ATTEMPTED,
        validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
      };
  }
}

function validateRequestShape(request) {
  const issues = [];

  if (!request || typeof request !== "object") {
    issues.push("request_missing");
    return issues;
  }

  if (typeof request.prompt !== "string" || !request.prompt.trim()) {
    issues.push("prompt_missing");
  }

  if (typeof request.schemaValidator?.safeParse !== "function") {
    issues.push("schema_validator_missing");
  }

  if (!request.responseJsonSchema) {
    issues.push("response_json_schema_missing");
  }

  return issues;
}

export async function requestStructuredArtifact(request, deps = {}) {
  const configSource = deps.config ?? getAppConfig();
  const configSnapshot = deps.llmConfig ?? buildLlmConfigSnapshot(configSource);
  const traceId = typeof deps.traceIdFactory === "function" ? deps.traceIdFactory() : `llm_${randomUUID()}`;
  const base = makeRequestEnvelope(request, traceId, configSnapshot);
  const requestIssues = validateRequestShape(request);

  if (requestIssues.length > 0) {
    const error = createLlmError({
      kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
      code: "LLM_REQUEST_INVALID",
      message: "Запрос structured-output неполон.",
      retryable: false,
      stage: "configuration",
      details: {
        issues: requestIssues
      }
    });

    return createLlmFailureResult(base, error, patchForError(error));
  }

  if (configSnapshot.state !== LLM_CONFIG_STATES.CONFIGURED) {
    const error = createLlmConfigFailure(configSnapshot, "Конфигурация LLM неполна или не поддерживается.");
    return createLlmFailureResult(base, error, patchForError(error));
  }

  if (configSnapshot.providerId !== LLM_PROVIDER_IDS.GEMINI) {
    const error = createLlmError({
      kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
      code: "LLM_PROVIDER_UNSUPPORTED",
      message: `Провайдер '${configSnapshot.providerId}' не поддерживается текущим базовым контуром.`,
      retryable: false,
      stage: "configuration",
      details: {
        providerId: configSnapshot.providerId,
        modelId: configSnapshot.modelId
      }
    });

    return createLlmFailureResult(base, error, patchForError(error));
  }

  const transport = deps.transport ?? createLlmTransport(configSnapshot, deps.transportDeps ?? {});
  const providerAdapter = deps.providerAdapter ?? createGeminiProviderAdapter({
    configSnapshot,
    transport
  });

  try {
    const providerResult = await providerAdapter.requestStructuredArtifact({
      prompt: request.prompt,
      responseJsonSchema: request.responseJsonSchema,
      requestId: base.requestId || traceId,
      traceId
    });

    const normalized = normalizeStructuredJsonText(providerResult.text, {
      artifactClass: request.artifactClass,
      schemaId: request.schemaId,
      schemaVersion: request.schemaVersion,
      traceId,
      providerId: providerResult.providerId,
      modelId: providerResult.modelId
    });

    const validated = validateStructuredArtifact(request.schemaValidator, normalized, {
      artifactClass: request.artifactClass,
      schemaId: request.schemaId,
      schemaVersion: request.schemaVersion,
      traceId,
      providerId: providerResult.providerId,
      modelId: providerResult.modelId
    });

    return createLlmSuccessResult(base, validated, {
      requestId: providerResult.providerRequestId || traceId,
      providerId: providerResult.providerId,
      modelId: providerResult.modelId,
      transportUsed: providerResult.transportUsed || base.transportUsed,
      transportState: LLM_RESULT_STATES.SUCCESS,
      providerState: LLM_RESULT_STATES.SUCCESS,
      structuredOutputState: LLM_RESULT_STATES.SUCCESS,
      validationState: LLM_RESULT_STATES.SUCCESS
    });
  } catch (error) {
    const normalizedError = normalizeLlmError(error, {
      kind: LLM_ERROR_KINDS.PROVIDER,
      code: "LLM_REQUEST_FAILED",
      message: "Запрос structured-output завершился с ошибкой.",
      retryable: false,
      stage: "provider"
    });

    return createLlmFailureResult(base, normalizedError, patchForError(normalizedError));
  }
}
