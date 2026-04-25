const PUBLIC_NAV_ITEMS = Object.freeze([
  { key: "home", href: "/", label: "Главная" },
  { key: "services", href: "/services", label: "Услуги" },
  { key: "cases", href: "/cases", label: "Кейсы" },
  { key: "about", href: "/about", label: "О компании" },
  { key: "contacts", href: "/contacts", label: "Контакты" }
]);

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/";
  }

  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      return new URL(pathname).pathname || "/";
    } catch {
      return "/";
    }
  }

  const [withoutHash] = pathname.split("#");
  const [withoutQuery] = withoutHash.split("?");

  if (!withoutQuery || withoutQuery.length === 0) {
    return "/";
  }

  return withoutQuery;
}

export function resolvePublicNavSection(pathname) {
  const normalized = normalizePathname(pathname);

  if (normalized === "/") {
    return "home";
  }

  if (normalized === "/services" || normalized.startsWith("/services/")) {
    return "services";
  }

  if (normalized === "/cases" || normalized.startsWith("/cases/")) {
    return "cases";
  }

  if (normalized === "/about") {
    return "about";
  }

  if (normalized === "/contacts") {
    return "contacts";
  }

  return null;
}

export function getPublicNavItems() {
  return PUBLIC_NAV_ITEMS;
}

export function buildServiceQuickLinks(services, { limit = 8 } = {}) {
  if (!Array.isArray(services) || services.length === 0) {
    return [];
  }

  const seen = new Set();
  const links = [];

  for (const service of services) {
    if (!service?.slug || !service?.title) {
      continue;
    }

    const href = `/services/${service.slug}`;

    if (seen.has(href)) {
      continue;
    }

    seen.add(href);
    links.push({
      key: service.entityId || href,
      href,
      label: service.title
    });

    if (links.length >= limit) {
      break;
    }
  }

  return links;
}

export function buildPublicBreadcrumbs({ pathname, pageTitle = "" }) {
  const normalized = normalizePathname(pathname);
  const section = resolvePublicNavSection(normalized);
  const home = { key: "home", label: "Главная", href: "/" };

  if (section === "home") {
    return [];
  }

  if (section === "services") {
    if (normalized === "/services") {
      return [home, { key: "services", label: "Услуги" }];
    }

    return [home, { key: "services", label: "Услуги", href: "/services" }, { key: "service-detail", label: pageTitle || "Услуга" }];
  }

  if (section === "cases") {
    if (normalized === "/cases") {
      return [home, { key: "cases", label: "Кейсы" }];
    }

    return [home, { key: "cases", label: "Кейсы", href: "/cases" }, { key: "case-detail", label: pageTitle || "Кейс" }];
  }

  if (section === "about") {
    return [home, { key: "about", label: "О компании" }];
  }

  if (section === "contacts") {
    return [home, { key: "contacts", label: "Контакты" }];
  }

  return [home];
}
