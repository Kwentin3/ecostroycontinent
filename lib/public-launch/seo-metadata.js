import { getAppConfig } from "../config.js";
import { buildPlaceholderRobotsMetadata } from "./placeholder-mode.js";
import { toPublicUrl } from "./seo-runtime.js";

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function buildLiveRobots(indexWhenLive) {
  if (indexWhenLive) {
    return {
      index: true,
      follow: true
    };
  }

  return {
    index: false,
    follow: false,
    nocache: true
  };
}

export function buildPublicRouteMetadata({
  pathname = "/",
  placeholderMode = false,
  title = "",
  description = "",
  indexWhenLive = true
} = {}) {
  const baseUrl = getAppConfig().appBaseUrl;
  const canonical = toPublicUrl(baseUrl, pathname);
  const normalizedTitle = asText(title);
  const normalizedDescription = asText(description);
  const placeholderMetadata = buildPlaceholderRobotsMetadata(placeholderMode);

  return {
    ...(normalizedTitle ? { title: normalizedTitle } : {}),
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    alternates: {
      canonical
    },
    ...(placeholderMode ? placeholderMetadata : { robots: buildLiveRobots(indexWhenLive) })
  };
}
