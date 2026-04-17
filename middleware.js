import { NextResponse } from "next/server";

import { getAppConfig } from "./lib/config.js";
import {
  PUBLIC_DISPLAY_MODE_COOKIE_NAME,
  PUBLIC_DISPLAY_MODE_QUERY_PARAM,
  PUBLIC_DISPLAY_MODES,
  parsePublicDisplayMode
} from "./lib/public-launch/display-mode.js";
import {
  PLACEHOLDER_COOKIE_NAME,
  PLACEHOLDER_QUERY_PARAM,
  isPublicCorePath,
  parsePlaceholderToggle
} from "./lib/public-launch/placeholder-mode.js";

const PERSISTED_MODE_CACHE_TTL_MS = 5000;
let cachedPersistedMode = null;
let cachedPersistedModeExpiresAt = 0;

function mapPlaceholderToggleToMode(toggle) {
  if (toggle === true) {
    return PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER;
  }

  if (toggle === false) {
    return PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY;
  }

  return null;
}

function shouldSuppressIndexation(mode) {
  return mode === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER || mode === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION;
}

function setDebugCookie(response, name, value, request) {
  response.cookies.set(name, value, {
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 4
  });
}

async function resolvePersistedModeFromRuntimeProbe(request) {
  const now = Date.now();

  if (cachedPersistedMode && cachedPersistedModeExpiresAt > now) {
    return cachedPersistedMode;
  }

  try {
    const probeUrl = new URL("/api/public/display-mode", request.nextUrl.origin);
    const response = await fetch(probeUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const resolvedMode = parsePublicDisplayMode(payload?.mode);

    if (!resolvedMode) {
      return null;
    }

    cachedPersistedMode = resolvedMode;
    cachedPersistedModeExpiresAt = now + PERSISTED_MODE_CACHE_TTL_MS;

    return resolvedMode;
  } catch {
    return null;
  }
}

function resolveDebugModeAndApplyCookies(request, response) {
  const queryDisplayMode = parsePublicDisplayMode(
    request.nextUrl.searchParams.get(PUBLIC_DISPLAY_MODE_QUERY_PARAM)
  );
  const queryPlaceholderToggle = parsePlaceholderToggle(
    request.nextUrl.searchParams.get(PLACEHOLDER_QUERY_PARAM)
  );

  const cookieDisplayMode = parsePublicDisplayMode(
    request.cookies.get(PUBLIC_DISPLAY_MODE_COOKIE_NAME)?.value
  );
  const cookiePlaceholderToggle = parsePlaceholderToggle(
    request.cookies.get(PLACEHOLDER_COOKIE_NAME)?.value
  );

  const queryModeFromPlaceholder = mapPlaceholderToggleToMode(queryPlaceholderToggle);
  const cookieModeFromPlaceholder = mapPlaceholderToggleToMode(cookiePlaceholderToggle);

  const debugMode = queryDisplayMode || queryModeFromPlaceholder || cookieDisplayMode || cookieModeFromPlaceholder;

  if (queryDisplayMode) {
    setDebugCookie(response, PUBLIC_DISPLAY_MODE_COOKIE_NAME, queryDisplayMode, request);

    if (queryDisplayMode === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER) {
      setDebugCookie(response, PLACEHOLDER_COOKIE_NAME, "1", request);
    } else {
      response.cookies.delete(PLACEHOLDER_COOKIE_NAME);
    }
  }

  if (queryPlaceholderToggle !== null) {
    if (queryPlaceholderToggle) {
      setDebugCookie(response, PLACEHOLDER_COOKIE_NAME, "1", request);
      setDebugCookie(response, PUBLIC_DISPLAY_MODE_COOKIE_NAME, PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER, request);
    } else {
      response.cookies.delete(PLACEHOLDER_COOKIE_NAME);
      setDebugCookie(response, PUBLIC_DISPLAY_MODE_COOKIE_NAME, PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY, request);
    }
  }

  return debugMode;
}

export async function middleware(request) {
  if (!isPublicCorePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const debugOverridesEnabled = getAppConfig().publicDisplayModeDebugOverrideEnabled;

  const debugMode = debugOverridesEnabled
    ? resolveDebugModeAndApplyCookies(request, response)
    : null;
  const persistedMode = await resolvePersistedModeFromRuntimeProbe(request);
  const effectiveMode = debugMode || persistedMode;

  if (shouldSuppressIndexation(effectiveMode)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/", "/services/:path*", "/cases/:path*", "/about", "/contacts"]
};
