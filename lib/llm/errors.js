export const LLM_ERROR_KINDS = {
  FACTORY_RESOLUTION: "factory_resolution_error",
  TRANSPORT: "transport_error",
  PROVIDER: "provider_error",
  STRUCTURED_OUTPUT: "structured_output_error",
  LOCAL_VALIDATION: "local_validation_error"
};

export class LlmInfraError extends Error {
  constructor({ kind, code, message, retryable = false, stage = "", details = {}, cause = undefined }) {
    super(message);
    this.name = "LlmInfraError";
    this.kind = kind;
    this.code = code;
    this.retryable = retryable;
    this.stage = stage;
    this.details = details;
    if (cause) {
      this.cause = cause;
    }
  }
}

export function isLlmInfraError(error) {
  return error instanceof LlmInfraError;
}

export function createLlmError(input) {
  return new LlmInfraError(input);
}

export function normalizeLlmError(error, fallback) {
  if (isLlmInfraError(error)) {
    return error;
  }

  return new LlmInfraError({
    kind: fallback.kind,
    code: fallback.code,
    message: fallback.message,
    retryable: fallback.retryable ?? false,
    stage: fallback.stage ?? "",
    details: fallback.details ?? {},
    cause: error
  });
}
