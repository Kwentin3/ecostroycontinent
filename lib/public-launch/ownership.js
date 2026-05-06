import { PAGE_TYPES } from "../content-core/content-types.js";

const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSY_VALUES = new Set(["0", "false", "no", "off"]);
const OWNERSHIP_ERROR_NAME = "LaunchOwnershipGuardError";

export const LAUNCH_STANDALONE_PAGE_TYPES = Object.freeze([
  PAGE_TYPES.ABOUT,
  PAGE_TYPES.CONTACTS
]);

export const LEGACY_NON_LAUNCH_PAGE_TYPES = Object.freeze([
  PAGE_TYPES.SERVICE_LANDING,
  PAGE_TYPES.EQUIPMENT_LANDING
]);

function normalizeFlagValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isStrictPageOwnershipLaunchMode() {
  const rawValue = normalizeFlagValue(process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP);

  if (TRUTHY_VALUES.has(rawValue)) {
    return true;
  }

  if (FALSY_VALUES.has(rawValue)) {
    return false;
  }

  return process.env.NODE_ENV !== "test";
}

export function isLaunchStandalonePageType(pageType = "") {
  return LAUNCH_STANDALONE_PAGE_TYPES.includes(pageType);
}

export function isLegacyNonLaunchPageType(pageType = "") {
  return LEGACY_NON_LAUNCH_PAGE_TYPES.includes(pageType);
}

export function assertPageTypeAllowedForLaunchOwnership({
  nextPageType = "",
  previousPageType = "",
  strictMode = isStrictPageOwnershipLaunchMode()
} = {}) {
  if (!strictMode || !isLegacyNonLaunchPageType(nextPageType)) {
    return;
  }

  if (isLegacyNonLaunchPageType(previousPageType) && previousPageType === nextPageType) {
    return;
  }

  if (isLegacyNonLaunchPageType(previousPageType) && previousPageType !== nextPageType) {
    const error = new Error(
      `Launch ownership guard blocks pageType migration from "${previousPageType}" to "${nextPageType}".`
    );
    error.name = OWNERSHIP_ERROR_NAME;
    throw error;
  }

  const error = new Error(
    `Launch ownership guard blocks legacy pageType "${nextPageType}". Allowed standalone page types: ${LAUNCH_STANDALONE_PAGE_TYPES.join(", ")}.`
  );
  error.name = OWNERSHIP_ERROR_NAME;
  throw error;
}
