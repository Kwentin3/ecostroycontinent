import { createLlmError, LLM_ERROR_KINDS } from "./errors.js";

export const LLM_CONFIG_STATES = {
  NOT_CONFIGURED: "not_configured",
  PARTIALLY_CONFIGURED: "partially_configured",
  CONFIGURED: "configured"
};

export const LLM_PROVIDER_IDS = {
  GEMINI: "gemini"
};

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBooleanString(value) {
  const normalized = trimString(value).toLowerCase();

  if (!normalized) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(normalized);
}

function parsePortString(value) {
  const normalized = trimString(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function pushIssue(issues, code, message) {
  issues.push({ code, message });
}

export function buildLlmConfigSnapshot(source = {}) {
  const providerId = trimString(source.llmProvider ?? source.LLM_PROVIDER).toLowerCase();
  const modelId = trimString(source.llmModel ?? source.LLM_MODEL);
  const geminiApiKey = trimString(source.llmGeminiApiKey ?? source.LLM_GEMINI_API_KEY);
  const geminiBaseUrl = trimString(source.llmGeminiBaseUrl ?? source.LLM_GEMINI_BASE_URL);
  const socks5Enabled = parseBooleanString(source.llmSocks5Enabled ?? source.LLM_SOCKS5_ENABLED);
  const socks5Host = trimString(source.llmSocks5Host ?? source.LLM_SOCKS5_HOST);
  const socks5Port = parsePortString(source.llmSocks5Port ?? source.LLM_SOCKS5_PORT);
  const socks5Username = trimString(source.llmSocks5Username ?? source.LLM_SOCKS5_USERNAME);
  const socks5Password = trimString(source.llmSocks5Password ?? source.LLM_SOCKS5_PASSWORD);
  const providerIssues = [];
  const transportIssues = [];

  if (!providerId) {
    pushIssue(providerIssues, "LLM_PROVIDER_MISSING", "LLM_PROVIDER is missing.");
  } else if (providerId !== LLM_PROVIDER_IDS.GEMINI) {
    pushIssue(providerIssues, "LLM_PROVIDER_UNSUPPORTED", `Provider '${providerId}' is not supported by the current baseline.`);
  }

  if (!modelId) {
    pushIssue(providerIssues, "LLM_MODEL_MISSING", "LLM_MODEL is missing.");
  }

  if (!geminiApiKey) {
    pushIssue(providerIssues, "LLM_GEMINI_API_KEY_MISSING", "LLM_GEMINI_API_KEY is missing.");
  }

  if (!geminiBaseUrl) {
    pushIssue(providerIssues, "LLM_GEMINI_BASE_URL_MISSING", "LLM_GEMINI_BASE_URL is missing.");
  }

  if (!socks5Enabled) {
    pushIssue(transportIssues, "LLM_SOCKS5_DISABLED", "LLM_SOCKS5_ENABLED must be true for this baseline.");
  }

  if (!socks5Host) {
    pushIssue(transportIssues, "LLM_SOCKS5_HOST_MISSING", "LLM_SOCKS5_HOST is missing.");
  }

  if (!socks5Port) {
    pushIssue(transportIssues, "LLM_SOCKS5_PORT_INVALID", "LLM_SOCKS5_PORT is missing or invalid.");
  }

  if (!socks5Username) {
    pushIssue(transportIssues, "LLM_SOCKS5_USERNAME_MISSING", "LLM_SOCKS5_USERNAME is missing.");
  }

  if (!socks5Password) {
    pushIssue(transportIssues, "LLM_SOCKS5_PASSWORD_MISSING", "LLM_SOCKS5_PASSWORD is missing.");
  }

  const issues = [...providerIssues, ...transportIssues];
  const anyValuePresent =
    Boolean(providerId) ||
    Boolean(modelId) ||
    Boolean(geminiApiKey) ||
    Boolean(geminiBaseUrl) ||
    socks5Enabled ||
    Boolean(socks5Host) ||
    Boolean(socks5Port) ||
    Boolean(socks5Username) ||
    Boolean(socks5Password);

  const state =
    issues.length === 0
      ? LLM_CONFIG_STATES.CONFIGURED
      : anyValuePresent
        ? LLM_CONFIG_STATES.PARTIALLY_CONFIGURED
        : LLM_CONFIG_STATES.NOT_CONFIGURED;

  return {
    providerId,
    modelId,
    geminiApiKey,
    geminiBaseUrl,
    socks5Enabled,
    socks5Host,
    socks5Port,
    socks5Username,
    socks5Password,
    providerConfigured: providerIssues.length === 0,
    transportConfigured: transportIssues.length === 0,
    state,
    issues
  };
}

export function createLlmConfigFailure(configSnapshot, message, code = "LLM_CONFIGURATION_INVALID") {
  return createLlmError({
    kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
    code,
    message,
    retryable: false,
    stage: "configuration",
    details: {
      configState: configSnapshot.state,
      issues: configSnapshot.issues.map((issue) => issue.code)
    }
  });
}
