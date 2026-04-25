import { getAppConfig } from "../config.js";
import { toPublicUrl } from "./seo-runtime.js";

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizePathname(pathname) {
  const normalized = asText(pathname);

  if (!normalized) {
    return "/";
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      return new URL(normalized).pathname || "/";
    } catch {
      return "/";
    }
  }

  const [withoutHash] = normalized.split("#");
  const [withoutQuery] = withoutHash.split("?");

  return withoutQuery || "/";
}

function toSafeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function serializeStructuredData(payload) {
  return toSafeJson(payload);
}

export function buildBreadcrumbStructuredData({
  breadcrumbs = [],
  currentPath = "/"
} = {}) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    return null;
  }

  const baseUrl = getAppConfig().appBaseUrl;
  const fallbackPath = normalizePathname(currentPath);
  const listItems = [];

  for (let index = 0; index < breadcrumbs.length; index += 1) {
    const item = breadcrumbs[index];
    const label = asText(item?.label);

    if (!label) {
      continue;
    }

    const isLast = index === breadcrumbs.length - 1;
    const normalizedHref = item?.href ? normalizePathname(item.href) : "";
    const url = normalizedHref
      ? toPublicUrl(baseUrl, normalizedHref)
      : (isLast ? toPublicUrl(baseUrl, fallbackPath) : "");

    if (!url) {
      continue;
    }

    listItems.push({
      "@type": "ListItem",
      position: listItems.length + 1,
      name: label,
      item: url
    });
  }

  if (listItems.length < 2) {
    return null;
  }

  return {
    kind: "breadcrumb",
    payload: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: listItems
    }
  };
}

export function buildLocalBusinessStructuredData({
  globalSettings = null,
  contactProjection = null
} = {}) {
  const truthConfirmed = contactProjection?.truthConfirmed === true;

  if (!truthConfirmed) {
    return null;
  }

  const businessName = asText(globalSettings?.publicBrandName) || asText(globalSettings?.legalName);
  const phone = asText(contactProjection?.phone);
  const email = asText(contactProjection?.email);
  const serviceArea = asText(contactProjection?.serviceArea) || asText(contactProjection?.primaryRegion);

  if (!businessName || !serviceArea || (!phone && !email)) {
    return null;
  }

  const baseUrl = getAppConfig().appBaseUrl;
  const payload = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": toPublicUrl(baseUrl, "/#organization"),
    name: businessName,
    url: toPublicUrl(baseUrl, "/"),
    areaServed: serviceArea
  };

  if (phone) {
    payload.telephone = phone;
  }

  if (email) {
    payload.email = email;
  }

  return {
    kind: "local-business",
    payload
  };
}

export function buildServiceStructuredData({
  service = null,
  currentPath = "",
  effectiveServiceArea = ""
} = {}) {
  const serviceName = asText(service?.h1) || asText(service?.title);
  const areaServed = asText(effectiveServiceArea);

  if (!serviceName || !areaServed) {
    return null;
  }

  const baseUrl = getAppConfig().appBaseUrl;
  const pathname = normalizePathname(currentPath || (service?.slug ? `/services/${service.slug}` : "/services"));
  const payload = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${toPublicUrl(baseUrl, pathname)}#service`,
    name: serviceName,
    url: toPublicUrl(baseUrl, pathname),
    areaServed,
    provider: {
      "@id": toPublicUrl(baseUrl, "/#organization")
    }
  };

  const description = asText(service?.summary) || asText(service?.seo?.metaDescription);

  if (description) {
    payload.description = description;
  }

  return {
    kind: "service",
    payload
  };
}
