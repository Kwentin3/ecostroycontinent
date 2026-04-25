import { getAppConfig } from "../config.js";
import { buildPlaceholderRobotsMetadata } from "./placeholder-mode.js";
import { toPublicUrl } from "./seo-runtime.js";

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveCanonical(baseUrl, pathname, canonicalIntent) {
  const normalizedIntent = asText(canonicalIntent);

  if (!normalizedIntent) {
    return toPublicUrl(baseUrl, pathname);
  }

  if (normalizedIntent.startsWith("/")) {
    return toPublicUrl(baseUrl, normalizedIntent);
  }

  if (isHttpUrl(normalizedIntent)) {
    return normalizedIntent;
  }

  return toPublicUrl(baseUrl, pathname);
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

function resolveLiveIndexation(indexWhenLive, seo) {
  if (seo?.indexationFlag === "noindex") {
    return false;
  }

  return indexWhenLive;
}

function buildOpenGraphMetadata({ canonical, title, description, siteName }) {
  return {
    type: "website",
    url: canonical,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(siteName ? { siteName } : {})
  };
}

function buildTwitterMetadata({ title, description }) {
  return {
    card: "summary_large_image",
    ...(title ? { title } : {}),
    ...(description ? { description } : {})
  };
}

export function buildPublicRouteMetadata({
  pathname = "/",
  placeholderMode = false,
  title = "",
  description = "",
  indexWhenLive = true,
  seo = null,
  siteName = ""
} = {}) {
  const baseUrl = getAppConfig().appBaseUrl;
  const normalizedSeo = seo && typeof seo === "object" ? seo : {};
  const normalizedTitle = asText(normalizedSeo.metaTitle) || asText(title);
  const normalizedDescription = asText(normalizedSeo.metaDescription) || asText(description);
  const normalizedSiteName = asText(siteName);
  const canonical = resolveCanonical(baseUrl, pathname, normalizedSeo.canonicalIntent);
  const shouldIndexLive = resolveLiveIndexation(indexWhenLive, normalizedSeo);
  const placeholderMetadata = buildPlaceholderRobotsMetadata(placeholderMode);

  return {
    ...(normalizedTitle ? { title: normalizedTitle } : {}),
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    alternates: {
      canonical
    },
    ...(normalizedTitle || normalizedDescription || normalizedSiteName
      ? {
          openGraph: buildOpenGraphMetadata({
            canonical,
            title: normalizedTitle,
            description: normalizedDescription,
            siteName: normalizedSiteName
          }),
          twitter: buildTwitterMetadata({
            title: normalizedTitle,
            description: normalizedDescription
          })
        }
      : {}),
    ...(placeholderMode ? placeholderMetadata : { robots: buildLiveRobots(shouldIndexLive) })
  };
}
