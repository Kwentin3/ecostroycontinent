import {
  PUBLIC_DISPLAY_MODES,
  PUBLIC_DISPLAY_MODE_COOKIE_NAME,
  PUBLIC_DISPLAY_MODE_QUERY_PARAM,
  buildPublicDisplayModeSnapshot,
  parsePublicDisplayMode,
  resolvePublicDisplayModePriority
} from "./display-mode.js";
import {
  PLACEHOLDER_COOKIE_NAME,
  PLACEHOLDER_QUERY_PARAM,
  parsePlaceholderToggle
} from "./placeholder-mode.js";
import { getDisplayModeState } from "./display-mode-store.js";

function readSearchParam(searchParams, key) {
  if (!searchParams) {
    return null;
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key);
  }

  if (typeof searchParams === "object") {
    return searchParams[key] ?? null;
  }

  return null;
}

async function resolveCookieStore(cookieStore = null) {
  if (cookieStore) {
    return cookieStore;
  }

  const headersModule = await import("next/headers.js");
  return headersModule.cookies();
}

function parsePlaceholderAsDisplayMode(rawValue) {
  const placeholderToggle = parsePlaceholderToggle(rawValue);

  if (placeholderToggle === true) {
    return PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER;
  }

  if (placeholderToggle === false) {
    return PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY;
  }

  return null;
}

async function parseDebugOverrideMode(searchParams, cookieStore = null) {
  const queryDisplayMode = parsePublicDisplayMode(
    readSearchParam(searchParams, PUBLIC_DISPLAY_MODE_QUERY_PARAM)
  );

  if (queryDisplayMode) {
    return {
      mode: queryDisplayMode,
      source: "query_display_mode"
    };
  }

  const queryPlaceholderMode = parsePlaceholderAsDisplayMode(
    readSearchParam(searchParams, PLACEHOLDER_QUERY_PARAM)
  );

  if (queryPlaceholderMode) {
    return {
      mode: queryPlaceholderMode,
      source: "query_placeholder_toggle"
    };
  }

  const resolvedCookieStore = await resolveCookieStore(cookieStore);
  const cookieDisplayMode = parsePublicDisplayMode(
    resolvedCookieStore.get(PUBLIC_DISPLAY_MODE_COOKIE_NAME)?.value
  );

  if (cookieDisplayMode) {
    return {
      mode: cookieDisplayMode,
      source: "cookie_display_mode"
    };
  }

  const cookiePlaceholderMode = parsePlaceholderAsDisplayMode(
    resolvedCookieStore.get(PLACEHOLDER_COOKIE_NAME)?.value
  );

  if (cookiePlaceholderMode) {
    return {
      mode: cookiePlaceholderMode,
      source: "cookie_placeholder_toggle"
    };
  }

  return {
    mode: null,
    source: null
  };
}

export async function resolvePublicRuntimeDisplayMode(searchParams, {
  cookieStore = null,
  forcedMode = null,
  persistedMode = null
} = {}) {
  try {
    const [debugOverride, persistedState] = await Promise.all([
      parseDebugOverrideMode(searchParams, cookieStore),
      persistedMode
        ? Promise.resolve({ mode: persistedMode, source: "provided" })
        : getDisplayModeState()
    ]);
    const snapshot = resolvePublicDisplayModePriority({
      persistedMode: persistedState?.mode,
      forcedMode,
      debugOverrideMode: debugOverride.mode
    });

    return {
      ...snapshot,
      persistedMode: persistedState?.mode ?? null,
      persistedSource: persistedState?.source ?? "storage",
      debugOverrideMode: debugOverride.mode,
      debugOverrideSource: debugOverride.source
    };
  } catch {
    return {
      ...buildPublicDisplayModeSnapshot({
        mode: PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY,
        source: "resolver_fallback"
      }),
      persistedMode: null,
      persistedSource: "resolver_fallback",
      debugOverrideMode: null,
      debugOverrideSource: null
    };
  }
}
