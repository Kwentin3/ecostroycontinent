export const PLACEHOLDER_QUERY_PARAM = "__placeholder";
export const PLACEHOLDER_COOKIE_NAME = "eco_public_placeholder_mode";
export const PLACEHOLDER_MARKER_TEXT = "TEST PLACEHOLDER - NOT LAUNCH CONTENT";

const TRUE_VALUES = new Set(["1", "true", "on", "yes", "enabled"]);
const FALSE_VALUES = new Set(["0", "false", "off", "no", "disabled"]);

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parsePlaceholderToggle(rawValue) {
  const normalized = normalizeValue(rawValue);

  if (normalized === undefined || normalized === null) {
    return null;
  }

  const lowered = String(normalized).trim().toLowerCase();

  if (TRUE_VALUES.has(lowered)) {
    return true;
  }

  if (FALSE_VALUES.has(lowered)) {
    return false;
  }

  return null;
}

export function isPublicCorePath(pathname = "/") {
  if (pathname === "/" || pathname === "/about" || pathname === "/contacts") {
    return true;
  }

  return pathname === "/services"
    || pathname.startsWith("/services/")
    || pathname === "/cases"
    || pathname.startsWith("/cases/");
}

export async function resolvePlaceholderMode(searchParams, { cookieStore = null } = {}) {
  const queryToggle = parsePlaceholderToggle(searchParams?.[PLACEHOLDER_QUERY_PARAM]);

  if (queryToggle !== null) {
    return queryToggle;
  }

  let effectiveCookieStore = cookieStore;

  if (!effectiveCookieStore) {
    const headersModule = await import("next/headers.js");
    effectiveCookieStore = await headersModule.cookies();
  }

  return parsePlaceholderToggle(effectiveCookieStore.get(PLACEHOLDER_COOKIE_NAME)?.value) === true;
}

export function buildPlaceholderRobotsMetadata(placeholderMode) {
  if (!placeholderMode) {
    return {};
  }

  return {
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    }
  };
}
