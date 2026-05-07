import crypto from "node:crypto";

const TELEMETRY_SESSION_COOKIE = "esc_telemetry_session";
const TELEMETRY_SESSION_TTL_SECONDS = 30 * 60;
const SAFE_SESSION_ID_PATTERN = /^ts_[a-f0-9-]{36}$/i;

function parseCookieHeader(request) {
  const header = request?.headers?.get?.("cookie") || "";

  return header.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    const key = rawKey?.trim();

    if (key) {
      cookies[key] = decodeURIComponent(rawValue.join("=") || "");
    }

    return cookies;
  }, {});
}

export function createTelemetrySessionId() {
  return `ts_${crypto.randomUUID()}`;
}

export function isSafeTelemetrySessionId(value) {
  return SAFE_SESSION_ID_PATTERN.test(String(value || ""));
}

export function getTelemetrySessionCookie(request) {
  if (request?.cookies?.get) {
    return request.cookies.get(TELEMETRY_SESSION_COOKIE)?.value || "";
  }

  return parseCookieHeader(request)[TELEMETRY_SESSION_COOKIE] || "";
}

export function resolveTelemetrySession({ request = null, payloadSessionId = "" } = {}) {
  const cookieSessionId = getTelemetrySessionCookie(request);

  if (isSafeTelemetrySessionId(cookieSessionId)) {
    return {
      sessionId: cookieSessionId,
      created: false
    };
  }

  if (isSafeTelemetrySessionId(payloadSessionId)) {
    return {
      sessionId: payloadSessionId,
      created: true
    };
  }

  return {
    sessionId: createTelemetrySessionId(),
    created: true
  };
}

export function setTelemetrySessionCookie(response, sessionId) {
  if (!response?.cookies?.set || !isSafeTelemetrySessionId(sessionId)) {
    return response;
  }

  response.cookies.set(TELEMETRY_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TELEMETRY_SESSION_TTL_SECONDS,
    path: "/"
  });

  return response;
}

export const TELEMETRY_SESSION_COOKIE_NAME = TELEMETRY_SESSION_COOKIE;
export const TELEMETRY_SESSION_MAX_AGE_SECONDS = TELEMETRY_SESSION_TTL_SECONDS;
