import { randomUUID } from "node:crypto";

export const LLM_RESULT_STATES = {
  NOT_ATTEMPTED: "not_attempted",
  SUCCESS: "success",
  FAILED: "failed"
};

export function createBaseLlmResult({
  traceId = `llm_${randomUUID()}`,
  requestId = "",
  providerId = "",
  modelId = "",
  configState = "not_configured",
  transportUsed = "none"
} = {}) {
  return {
    status: "error",
    artifact: null,
    error: null,
    retryable: false,
    traceId,
    requestId,
    providerId,
    modelId,
    configState,
    transportUsed,
    transportState: LLM_RESULT_STATES.NOT_ATTEMPTED,
    providerState: LLM_RESULT_STATES.NOT_ATTEMPTED,
    structuredOutputState: LLM_RESULT_STATES.NOT_ATTEMPTED,
    validationState: LLM_RESULT_STATES.NOT_ATTEMPTED
  };
}

export function createLlmSuccessResult(base, artifact, patch = {}) {
  return {
    ...base,
    ...patch,
    status: "ok",
    artifact,
    error: null,
    retryable: false
  };
}

export function createLlmFailureResult(base, error, patch = {}) {
  return {
    ...base,
    ...patch,
    status: "error",
    artifact: null,
    error: {
      kind: error.kind,
      code: error.code,
      message: error.message,
      stage: error.stage,
      details: error.details
    },
    retryable: Boolean(error.retryable)
  };
}
