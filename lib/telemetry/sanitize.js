const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "secret",
  "password",
  "email",
  "phone",
  "name",
  "message"
]);

export const DANGEROUS_TELEMETRY_KEY_PATTERN =
  /(password|pass|token|secret|api[_-]?key|authorization|cookie|session_cookie|email|phone|name|fio|message|comment|form[_-]?value|field[_-]?value|textarea|passport|card|ip|user[_-]?agent|raw|admin[_-]?identity|role|user[_-]?id)/i;

const TOKEN_LIKE_VALUE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|sk-[a-z0-9_-]{12,}|ya29\.[a-z0-9_-]+|xox[baprs]-[a-z0-9-]+)/i;

export function asSafeString(value, maxLength = 180) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function asBoundedInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function assertNoDangerousTelemetryKey(key, fieldKind = "field") {
  if (DANGEROUS_TELEMETRY_KEY_PATTERN.test(String(key || ""))) {
    throw new Error(`${fieldKind} "${key}" is not allowed`);
  }
}

export function assertSafeTelemetryValue(value, key = "value") {
  const safeValue = asSafeString(value, 500);

  if (TOKEN_LIKE_VALUE_PATTERN.test(safeValue)) {
    throw new Error(`field "${key}" contains unsafe token-like value`);
  }
}

function stripSensitiveSearchParams(url) {
  const kept = new URLSearchParams();

  for (const [key, value] of url.searchParams.entries()) {
    const normalizedKey = key.toLowerCase();

    if (SENSITIVE_QUERY_KEYS.has(normalizedKey)) {
      continue;
    }

    if (normalizedKey.startsWith("utm_")) {
      kept.set(normalizedKey, asSafeString(value, 120));
    }
  }

  const query = kept.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function sanitizePagePath(value) {
  const raw = asSafeString(value, 900) || "/";

  try {
    const parsed = new URL(raw, "http://localhost");
    const path = parsed.pathname || "/";
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
  } catch {
    const path = raw.split("#")[0].split("?")[0] || "/";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
  }
}

export function sanitizeReferrer(value) {
  const raw = asSafeString(value, 1200);

  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw, "http://localhost");
    const path = stripSensitiveSearchParams(parsed);

    if (parsed.hostname === "localhost" && !/^https?:\/\//i.test(raw)) {
      return path.slice(0, 500);
    }

    return `${parsed.protocol}//${parsed.hostname}${path}`.slice(0, 500);
  } catch {
    return raw.split("#")[0].split("?")[0].slice(0, 300);
  }
}

export function extractUtmFields(urlValue = "") {
  try {
    const parsed = new URL(asSafeString(urlValue, 900), "http://localhost");

    return {
      utm_source: asSafeString(parsed.searchParams.get("utm_source"), 80),
      utm_medium: asSafeString(parsed.searchParams.get("utm_medium"), 80),
      utm_campaign: asSafeString(parsed.searchParams.get("utm_campaign"), 140)
    };
  } catch {
    return {
      utm_source: "",
      utm_medium: "",
      utm_campaign: ""
    };
  }
}
