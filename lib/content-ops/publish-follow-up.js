import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types.js";

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function pushPath(target, dedupe, path) {
  const normalized = asText(path);

  if (!normalized || dedupe.has(normalized)) {
    return;
  }

  dedupe.add(normalized);
  target.push(normalized);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  return payload;
}

function resolveSlug(payload) {
  return asText(payload?.slug);
}

export function hasSlugMutation(entityType, previousPayload, nextPayload) {
  if (entityType !== ENTITY_TYPES.SERVICE && entityType !== ENTITY_TYPES.CASE) {
    return false;
  }

  const previousSlug = resolveSlug(normalizePayload(previousPayload));
  const nextSlug = resolveSlug(normalizePayload(nextPayload));

  return Boolean(previousSlug && nextSlug && previousSlug !== nextSlug);
}

export function buildPublishRevalidationPaths({
  entityType,
  previousPayload = null,
  nextPayload = null
} = {}) {
  const previous = normalizePayload(previousPayload);
  const next = normalizePayload(nextPayload);
  const previousSlug = resolveSlug(previous);
  const nextSlug = resolveSlug(next);
  const paths = [];
  const dedupe = new Set();

  pushPath(paths, dedupe, "/");

  if (entityType === ENTITY_TYPES.SERVICE) {
    pushPath(paths, dedupe, "/services");
    pushPath(paths, dedupe, "/cases");

    if (nextSlug) {
      pushPath(paths, dedupe, `/services/${nextSlug}`);
    }

    if (previousSlug && previousSlug !== nextSlug) {
      pushPath(paths, dedupe, `/services/${previousSlug}`);
    }
  } else if (entityType === ENTITY_TYPES.CASE) {
    pushPath(paths, dedupe, "/cases");
    pushPath(paths, dedupe, "/services");

    if (nextSlug) {
      pushPath(paths, dedupe, `/cases/${nextSlug}`);
    }

    if (previousSlug && previousSlug !== nextSlug) {
      pushPath(paths, dedupe, `/cases/${previousSlug}`);
    }
  } else if (entityType === ENTITY_TYPES.PAGE) {
    const pageType = asText(next.pageType);

    if (pageType === PAGE_TYPES.ABOUT) {
      pushPath(paths, dedupe, "/about");
    }

    if (pageType === PAGE_TYPES.CONTACTS) {
      pushPath(paths, dedupe, "/contacts");
    }
  } else if (entityType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    pushPath(paths, dedupe, "/services");
    pushPath(paths, dedupe, "/cases");
    pushPath(paths, dedupe, "/about");
    pushPath(paths, dedupe, "/contacts");
  }

  pushPath(paths, dedupe, "/sitemap.xml");

  return paths;
}

export function buildPublishFollowUp({
  entityType,
  previousPayload = null,
  nextPayload = null,
  obligationTypes = []
} = {}) {
  const previous = normalizePayload(previousPayload);
  const next = normalizePayload(nextPayload);
  const previousSlug = resolveSlug(previous);
  const nextSlug = resolveSlug(next);

  return {
    revalidationPaths: buildPublishRevalidationPaths({
      entityType,
      previousPayload: previous,
      nextPayload: next
    }),
    slugMutation: {
      changed: hasSlugMutation(entityType, previous, next),
      previousSlug: previousSlug || null,
      nextSlug: nextSlug || null
    },
    obligationTypes: Array.isArray(obligationTypes) ? obligationTypes.filter((item) => asText(item)) : []
  };
}
