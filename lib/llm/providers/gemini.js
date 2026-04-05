import { createLlmError, LLM_ERROR_KINDS } from "../errors.js";

function trimTrailingSlash(value) {
  return typeof value === "string" ? value.replace(/\/+$/, "") : "";
}

function firstHeaderValue(headers, name) {
  const value = headers?.[name];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function buildGeminiRequestUrl(configSnapshot) {
  const baseUrl = trimTrailingSlash(configSnapshot.geminiBaseUrl);
  return `${baseUrl}/models/${encodeURIComponent(configSnapshot.modelId)}:generateContent?key=${encodeURIComponent(configSnapshot.geminiApiKey)}`;
}

function shouldUseMinimalThinking(configSnapshot) {
  // Gemini 3 preview models return deterministic JSON more reliably with
  // minimal thinking posture for this baseline.
  return (
    typeof configSnapshot.modelId === "string" &&
    configSnapshot.modelId.startsWith("gemini-3-") &&
    configSnapshot.modelId.includes("preview")
  );
}

function buildGenerationConfig(responseJsonSchema, configSnapshot) {
  const generationConfig = {
    responseMimeType: "application/json",
    responseJsonSchema,
    temperature: 0,
    maxOutputTokens: 256
  };

  if (shouldUseMinimalThinking(configSnapshot)) {
    generationConfig.thinkingConfig = {
      thinkingLevel: "minimal"
    };
  }

  return generationConfig;
}

export function createGeminiProviderAdapter({ configSnapshot, transport }) {
  return {
    providerId: "gemini",
    async requestStructuredArtifact({
      prompt,
      responseJsonSchema,
      requestId = "",
      traceId = ""
    }) {
      if (!responseJsonSchema) {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
          code: "LLM_RESPONSE_SCHEMA_MISSING",
          message: "A provider response schema is required for structured-output requests.",
          retryable: false,
          stage: "configuration",
          details: {
            providerId: configSnapshot.providerId,
            modelId: configSnapshot.modelId,
            traceId
          }
        });
      }

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: buildGenerationConfig(responseJsonSchema, configSnapshot)
      };

      const response = await transport.postJson({
        url: buildGeminiRequestUrl(configSnapshot),
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json"
        },
        requestId,
        traceId
      });

      if (response.status < 200 || response.status >= 300) {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.PROVIDER,
          code: `GEMINI_HTTP_${response.status}`,
          message: "The Gemini provider rejected the request.",
          retryable: response.status === 429 || response.status >= 500,
          stage: "provider",
          details: {
            providerId: "gemini",
            modelId: configSnapshot.modelId,
            httpStatus: response.status,
            providerRequestId: firstHeaderValue(response.headers, "x-request-id") || requestId || traceId
          }
        });
      }

      let payload;

      try {
        payload = JSON.parse(response.text);
      } catch {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.PROVIDER,
          code: "GEMINI_INVALID_JSON_RESPONSE",
          message: "The Gemini provider returned a non-JSON response body.",
          retryable: false,
          stage: "provider",
          details: {
            providerId: "gemini",
            modelId: configSnapshot.modelId,
            providerRequestId: firstHeaderValue(response.headers, "x-request-id") || requestId || traceId
          }
        });
      }

      if (payload?.error) {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.PROVIDER,
          code: payload.error.code ? `GEMINI_ERROR_${payload.error.code}` : "GEMINI_PROVIDER_ERROR",
          message: typeof payload.error.message === "string" && payload.error.message.trim()
            ? payload.error.message.trim()
            : "The Gemini provider returned an error.",
          retryable: Boolean(payload.error.code === 429 || payload.error.code >= 500),
          stage: "provider",
          details: {
            providerId: "gemini",
            modelId: configSnapshot.modelId,
            providerRequestId: firstHeaderValue(response.headers, "x-request-id") || requestId || traceId
          }
        });
      }

      const text = extractGeminiText(payload);

      if (!text) {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.PROVIDER,
          code: "GEMINI_MISSING_TEXT",
          message: "The Gemini provider response did not include structured text content.",
          retryable: false,
          stage: "provider",
          details: {
            providerId: "gemini",
            modelId: configSnapshot.modelId,
            providerRequestId: firstHeaderValue(response.headers, "x-request-id") || requestId || traceId
          }
        });
      }

      return {
        providerId: "gemini",
        modelId: configSnapshot.modelId,
        providerRequestId: firstHeaderValue(response.headers, "x-request-id") || requestId || traceId,
        text,
        transportUsed: transport.transportMode || "socks5"
      };
    }
  };
}
