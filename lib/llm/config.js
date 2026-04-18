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
    pushIssue(providerIssues, "LLM_PROVIDER_MISSING", "Переменная LLM_PROVIDER не задана.");
  } else if (providerId !== LLM_PROVIDER_IDS.GEMINI) {
    pushIssue(providerIssues, "LLM_PROVIDER_UNSUPPORTED", `Провайдер '${providerId}' не поддерживается текущим базовым контуром.`);
  }

  if (!modelId) {
    pushIssue(providerIssues, "LLM_MODEL_MISSING", "Переменная LLM_MODEL не задана.");
  }

  if (!geminiApiKey) {
    pushIssue(providerIssues, "LLM_GEMINI_API_KEY_MISSING", "Переменная LLM_GEMINI_API_KEY не задана.");
  }

  if (!geminiBaseUrl) {
    pushIssue(providerIssues, "LLM_GEMINI_BASE_URL_MISSING", "Переменная LLM_GEMINI_BASE_URL не задана.");
  }

  if (!socks5Enabled) {
    pushIssue(transportIssues, "LLM_SOCKS5_DISABLED", "Для этого базового контура LLM_SOCKS5_ENABLED должен быть true.");
  }

  if (!socks5Host) {
    pushIssue(transportIssues, "LLM_SOCKS5_HOST_MISSING", "Переменная LLM_SOCKS5_HOST не задана.");
  }

  if (!socks5Port) {
    pushIssue(transportIssues, "LLM_SOCKS5_PORT_INVALID", "Переменная LLM_SOCKS5_PORT не задана или указана неверно.");
  }

  if (!socks5Username) {
    pushIssue(transportIssues, "LLM_SOCKS5_USERNAME_MISSING", "Переменная LLM_SOCKS5_USERNAME не задана.");
  }

  if (!socks5Password) {
    pushIssue(transportIssues, "LLM_SOCKS5_PASSWORD_MISSING", "Переменная LLM_SOCKS5_PASSWORD не задана.");
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
