import https from "node:https";

import { SocksProxyAgent } from "socks-proxy-agent";

import { createLlmError, LLM_ERROR_KINDS, normalizeLlmError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 30_000;

function buildSocksProxyUrl(configSnapshot) {
  const auth = `${encodeURIComponent(configSnapshot.socks5Username)}:${encodeURIComponent(configSnapshot.socks5Password)}`;
  return `socks5://${auth}@${configSnapshot.socks5Host}:${configSnapshot.socks5Port}`;
}

function createRequestImpl({ url, body, headers, timeoutMs, agent, requestId }) {
  return new Promise((resolve, reject) => {
    const requestHeaders = {
      accept: "application/json",
      connection: "close",
      ...headers
    };

    if (body) {
      requestHeaders["content-length"] = Buffer.byteLength(body);
    }

    const req = https.request(url, {
      method: "POST",
      agent,
      headers: requestHeaders
    }, (res) => {
      const chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        resolve({
          requestId,
          status: res.statusCode ?? 0,
          headers: res.headers,
          text: Buffer.concat(chunks).toString("utf8")
        });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`LLM-запрос по транспорту превысил тайм-аут ${timeoutMs}ms.`));
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function classifyTransportError(error, configSnapshot) {
    const normalized = error instanceof Error ? error : new Error(String(error ?? "Исходящий LLM-транспорт завершился с ошибкой."));
  const code = typeof normalized.code === "string" ? normalized.code : "";
  const message = normalized.message.toLowerCase();

  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || message.includes("timed out")) {
    return createLlmError({
      kind: LLM_ERROR_KINDS.TRANSPORT,
      code: "LLM_TRANSPORT_TIMEOUT",
      message: "Исходящий LLM-транспортный путь превысил тайм-аут.",
      retryable: true,
      stage: "transport",
      details: {
        transportMode: "socks5",
        providerId: configSnapshot.providerId,
        modelId: configSnapshot.modelId
      }
    });
  }

  if (code === "ECONNREFUSED" || message.includes("connection refused")) {
    return createLlmError({
      kind: LLM_ERROR_KINDS.TRANSPORT,
      code: "LLM_TRANSPORT_PROXY_UNREACHABLE",
      message: "SOCKS5-прокси недоступен.",
      retryable: true,
      stage: "transport",
      details: {
        transportMode: "socks5",
        providerId: configSnapshot.providerId,
        modelId: configSnapshot.modelId
      }
    });
  }

  if (message.includes("authentication") || message.includes("auth") || message.includes("proxy rejected")) {
    return createLlmError({
      kind: LLM_ERROR_KINDS.TRANSPORT,
      code: "LLM_TRANSPORT_PROXY_AUTH_FAILED",
      message: "SOCKS5-прокси отклонил аутентификацию или конфигурацию.",
      retryable: false,
      stage: "transport",
      details: {
        transportMode: "socks5",
        providerId: configSnapshot.providerId,
        modelId: configSnapshot.modelId
      }
    });
  }

  if (message.includes("socket hang up") || message.includes("econnreset")) {
    return createLlmError({
      kind: LLM_ERROR_KINDS.TRANSPORT,
      code: "LLM_TRANSPORT_INTERRUPTED",
      message: "Исходящий LLM-транспорт был прерван.",
      retryable: true,
      stage: "transport",
      details: {
        transportMode: "socks5",
        providerId: configSnapshot.providerId,
        modelId: configSnapshot.modelId
      }
    });
  }

  return normalizeLlmError(normalized, {
    kind: LLM_ERROR_KINDS.TRANSPORT,
    code: "LLM_TRANSPORT_FAILED",
    message: "Исходящий LLM-транспортный путь завершился с ошибкой.",
    retryable: true,
    stage: "transport",
    details: {
      transportMode: "socks5",
      providerId: configSnapshot.providerId,
      modelId: configSnapshot.modelId,
      errorName: normalized.name || "Error"
    }
  });
}

export function createLlmTransport(configSnapshot, deps = {}) {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requestImpl = deps.requestImpl ?? createRequestImpl;
  const proxyUrl = buildSocksProxyUrl(configSnapshot);
  const agent = new SocksProxyAgent(proxyUrl);

  return {
    transportMode: "socks5",
    async postJson({ url, body, headers = {}, requestId = "", timeout = timeoutMs }) {
      if (!configSnapshot.transportConfigured) {
        throw createLlmError({
          kind: LLM_ERROR_KINDS.FACTORY_RESOLUTION,
          code: "LLM_SOCKS5_NOT_CONFIGURED",
          message: "Конфигурация аутентифицированного SOCKS5 неполна.",
          retryable: false,
          stage: "configuration",
          details: {
            configState: configSnapshot.state,
            issues: configSnapshot.issues.map((issue) => issue.code)
          }
        });
      }

      try {
        return await requestImpl({
          url,
          body,
          headers,
          timeoutMs: timeout,
          agent,
          requestId
        });
      } catch (error) {
        throw classifyTransportError(error, configSnapshot);
      }
    }
  };
}
