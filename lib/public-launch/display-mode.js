export const PUBLIC_DISPLAY_MODES = Object.freeze({
  PUBLISHED_ONLY: "published_only",
  MIXED_PLACEHOLDER: "mixed_placeholder",
  UNDER_CONSTRUCTION: "under_construction"
});

export const PUBLIC_DISPLAY_MODE_VALUES = Object.freeze([
  PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY,
  PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER,
  PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
]);

export const DEFAULT_PUBLIC_DISPLAY_MODE = PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY;
export const PUBLIC_DISPLAY_MODE_QUERY_PARAM = "__display_mode";
export const PUBLIC_DISPLAY_MODE_COOKIE_NAME = "eco_public_display_mode";

const DISPLAY_MODE_META = Object.freeze({
  [PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY]: {
    label: "Published only",
    description: "Serve only real published truth, no placeholder fallback."
  },
  [PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER]: {
    label: "Mixed placeholder",
    description: "Serve published truth when present, route-level placeholder fallback when missing."
  },
  [PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION]: {
    label: "Under construction",
    description: "Global holding mode for public launch-core routes."
  }
});

export function parsePublicDisplayMode(rawValue) {
  if (Array.isArray(rawValue)) {
    return parsePublicDisplayMode(rawValue[0]);
  }

  if (typeof rawValue !== "string") {
    return null;
  }

  const normalized = rawValue.trim().toLowerCase();

  return PUBLIC_DISPLAY_MODE_VALUES.includes(normalized) ? normalized : null;
}

export function normalizePublicDisplayMode(rawValue) {
  return parsePublicDisplayMode(rawValue) || DEFAULT_PUBLIC_DISPLAY_MODE;
}

export function isUnderConstructionMode(mode) {
  return mode === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION;
}

export function isMixedPlaceholderMode(mode) {
  return mode === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER;
}

export function isPublishedOnlyMode(mode) {
  return mode === PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY;
}

export function buildPublicDisplayModeSnapshot({
  mode,
  source = "default"
} = {}) {
  const resolvedMode = normalizePublicDisplayMode(mode);
  const underConstruction = isUnderConstructionMode(resolvedMode);
  const placeholderFallbackEnabled = isMixedPlaceholderMode(resolvedMode);
  const indexingSuppressed = underConstruction || placeholderFallbackEnabled;

  return {
    mode: resolvedMode,
    source,
    underConstruction,
    placeholderFallbackEnabled,
    indexingSuppressed
  };
}

export function getPublicDisplayModeMeta(mode) {
  const resolvedMode = normalizePublicDisplayMode(mode);
  return {
    mode: resolvedMode,
    ...DISPLAY_MODE_META[resolvedMode]
  };
}

export function resolvePublicDisplayModePriority({
  persistedMode,
  forcedMode = null,
  debugOverrideMode = null
} = {}) {
  const normalizedForced = parsePublicDisplayMode(forcedMode);
  const normalizedDebug = parsePublicDisplayMode(debugOverrideMode);
  const normalizedPersisted = normalizePublicDisplayMode(persistedMode);

  if (
    normalizedForced === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
    || normalizedDebug === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
    || normalizedPersisted === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
  ) {
    return buildPublicDisplayModeSnapshot({
      mode: PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION,
      source: normalizedForced === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
        ? "forced"
        : normalizedDebug === PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
          ? "debug_override"
          : "persisted"
    });
  }

  if (
    normalizedForced === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
    || normalizedDebug === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
    || normalizedPersisted === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
  ) {
    return buildPublicDisplayModeSnapshot({
      mode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER,
      source: normalizedForced === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
        ? "forced"
        : normalizedDebug === PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
          ? "debug_override"
          : "persisted"
    });
  }

  return buildPublicDisplayModeSnapshot({
    mode: PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY,
    source: normalizedForced === PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY
      ? "forced"
      : normalizedDebug === PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY
        ? "debug_override"
        : "persisted"
  });
}
