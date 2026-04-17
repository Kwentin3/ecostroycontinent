function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function normalizePublicBaseUrl(baseUrl) {
  const normalized = asText(baseUrl) || "http://localhost:3000";

  return normalized.replace(/\/+$/, "");
}

export function toPublicUrl(baseUrl, pathname = "/") {
  const resolvedBase = normalizePublicBaseUrl(baseUrl);
  return new URL(pathname, `${resolvedBase}/`).toString();
}

export function buildPublicRobotsSpec({ baseUrl }) {
  const resolvedBase = normalizePublicBaseUrl(baseUrl);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/admin", "/api/admin/*"]
      }
    ],
    sitemap: `${resolvedBase}/sitemap.xml`
  };
}

function toSitemapDate(value, fallbackDate) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (Number.isFinite(parsed.getTime())) {
      return parsed;
    }
  }

  return fallbackDate;
}

function appendEntry(entries, dedupe, entry) {
  if (!entry || typeof entry.url !== "string" || dedupe.has(entry.url)) {
    return;
  }

  dedupe.add(entry.url);
  entries.push(entry);
}

export function buildPublishedSitemapEntries({
  baseUrl,
  services = [],
  cases = [],
  aboutPage = null,
  contactsPage = null,
  now = new Date()
} = {}) {
  const resolvedNow = toSitemapDate(now, new Date());
  const entries = [];
  const dedupe = new Set();
  const asUrl = (pathname) => toPublicUrl(baseUrl, pathname);

  appendEntry(entries, dedupe, {
    url: asUrl("/"),
    lastModified: resolvedNow,
    changeFrequency: "daily",
    priority: 1
  });
  appendEntry(entries, dedupe, {
    url: asUrl("/services"),
    lastModified: resolvedNow,
    changeFrequency: "daily",
    priority: 0.9
  });
  appendEntry(entries, dedupe, {
    url: asUrl("/cases"),
    lastModified: resolvedNow,
    changeFrequency: "daily",
    priority: 0.8
  });

  if (aboutPage?.entityId) {
    appendEntry(entries, dedupe, {
      url: asUrl("/about"),
      lastModified: resolvedNow,
      changeFrequency: "weekly",
      priority: 0.6
    });
  }

  if (contactsPage?.entityId) {
    appendEntry(entries, dedupe, {
      url: asUrl("/contacts"),
      lastModified: resolvedNow,
      changeFrequency: "weekly",
      priority: 0.7
    });
  }

  for (const service of services) {
    const slug = asText(service?.slug);

    if (!slug) {
      continue;
    }

    appendEntry(entries, dedupe, {
      url: asUrl(`/services/${slug}`),
      lastModified: resolvedNow,
      changeFrequency: "weekly",
      priority: 0.8
    });
  }

  for (const item of cases) {
    const slug = asText(item?.slug);

    if (!slug) {
      continue;
    }

    appendEntry(entries, dedupe, {
      url: asUrl(`/cases/${slug}`),
      lastModified: resolvedNow,
      changeFrequency: "weekly",
      priority: 0.7
    });
  }

  return entries;
}
