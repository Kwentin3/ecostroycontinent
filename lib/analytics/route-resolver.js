import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";
import {
  findPublishedBySlug,
  findPublishedPageByPageType
} from "../content-core/repository.js";

function normalizePath(value) {
  const raw = typeof value === "string" && value.trim() ? value.trim() : "/";

  try {
    const parsed = new URL(raw, "http://localhost");
    const path = parsed.pathname || "/";
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
  } catch {
    const path = raw.split("?")[0].split("#")[0] || "/";
    const withSlash = path.startsWith("/") ? path : `/${path}`;
    return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  }
}

function safeSlug(parts, index) {
  return decodeURIComponent(parts[index] || "").trim();
}

function projectionForPublishedPage(path, page, pageKind) {
  if (!page) {
    return {
      page_path: path,
      entity_type: ENTITY_TYPES.PAGE,
      entity_id: null,
      page_kind: pageKind,
      published_revision_id: null,
      resolution_status: "unmapped"
    };
  }

  return {
    page_path: path,
    entity_type: ENTITY_TYPES.PAGE,
    entity_id: page.entityId,
    page_kind: pageKind,
    published_revision_id: page.revisionId,
    resolution_status: "resolved"
  };
}

async function getPublishedServiceBySlug(slug) {
  const record = await findPublishedBySlug(ENTITY_TYPES.SERVICE, slug);
  return record
    ? { entityId: record.entityId, revisionId: record.revision?.id || null }
    : null;
}

async function getPublishedCaseBySlug(slug) {
  const record = await findPublishedBySlug(ENTITY_TYPES.CASE, slug);
  return record
    ? { entityId: record.entityId, revisionId: record.revision?.id || null }
    : null;
}

async function getPublishedAboutPage() {
  const record = await findPublishedPageByPageType(PAGE_TYPES.ABOUT);
  return record
    ? { entityId: record.entityId, revisionId: record.revision?.id || null }
    : null;
}

async function getPublishedContactsPage() {
  const record = await findPublishedPageByPageType(PAGE_TYPES.CONTACTS);
  return record
    ? { entityId: record.entityId, revisionId: record.revision?.id || null }
    : null;
}

async function getPublishedHomePage() {
  const record = await findPublishedPageByPageType(PAGE_TYPES.HOME);
  return record
    ? { entityId: record.entityId, revisionId: record.revision?.id || null }
    : null;
}

export async function resolveRouteEntity(pathname, deps = {}) {
  // Resolver binds metrics to Content Core route owners. Unmapped URLs are
  // diagnostics and must not be silently dropped. Service owns service routes,
  // Case owns case routes, and Page owns only standalone pages.
  const routeDeps = {
    getPublishedServiceBySlug,
    getPublishedCaseBySlug,
    getPublishedHomePage,
    getPublishedAboutPage,
    getPublishedContactsPage,
    ...deps
  };
  const pagePath = normalizePath(pathname);
  const parts = pagePath.split("/").filter(Boolean);

  if (pagePath === "/") {
    const page = await routeDeps.getPublishedHomePage();
    return projectionForPublishedPage("/", page, PAGE_TYPES.HOME);
  }

  if (pagePath === "/services") {
    return {
      page_path: pagePath,
      entity_type: null,
      entity_id: null,
      page_kind: "service_index",
      published_revision_id: null,
      resolution_status: "route_level"
    };
  }

  if (parts[0] === "services" && parts.length === 2) {
    const slug = safeSlug(parts, 1);
    const service = await routeDeps.getPublishedServiceBySlug(slug);

    return {
      page_path: pagePath,
      entity_type: ENTITY_TYPES.SERVICE,
      entity_id: service?.entityId ?? null,
      page_kind: "service_detail",
      published_revision_id: service?.revisionId ?? null,
      resolution_status: service ? "resolved" : "unmapped"
    };
  }

  if (pagePath === "/cases") {
    return {
      page_path: pagePath,
      entity_type: null,
      entity_id: null,
      page_kind: "case_index",
      published_revision_id: null,
      resolution_status: "route_level"
    };
  }

  if (parts[0] === "cases" && parts.length === 2) {
    const slug = safeSlug(parts, 1);
    const item = await routeDeps.getPublishedCaseBySlug(slug);

    return {
      page_path: pagePath,
      entity_type: ENTITY_TYPES.CASE,
      entity_id: item?.entityId ?? null,
      page_kind: "case_detail",
      published_revision_id: item?.revisionId ?? null,
      resolution_status: item ? "resolved" : "unmapped"
    };
  }

  if (pagePath === "/about") {
    const page = await routeDeps.getPublishedAboutPage();
    return projectionForPublishedPage(pagePath, page, PAGE_TYPES.ABOUT);
  }

  if (pagePath === "/contacts") {
    const page = await routeDeps.getPublishedContactsPage();
    return projectionForPublishedPage(pagePath, page, PAGE_TYPES.CONTACTS);
  }

  if (parts[0] === "blog" && parts.length === 2) {
    return {
      page_path: pagePath,
      entity_type: "article",
      entity_id: null,
      page_kind: "future_article_detail",
      published_revision_id: null,
      resolution_status: "future_not_supported"
    };
  }

  return {
    page_path: pagePath,
    entity_type: null,
    entity_id: null,
    page_kind: "unknown",
    published_revision_id: null,
    resolution_status: "unmapped"
  };
}
