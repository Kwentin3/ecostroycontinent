import {
  ENTITY_GRAPH_SOURCE_TYPES,
  buildEntityReferenceIndexFromCards,
  collectEntityGraphOutgoingTargets,
  lookupEntityReferenceEntries
} from "../content-core/entity-graph.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { getEntityAdminHref } from "./entity-links.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export async function loadDestructiveReferenceCatalog(deps = {}, db = null, sourceEntityTypes = ENTITY_GRAPH_SOURCE_TYPES) {
  const resolvedDeps = {
    listEntityCards,
    listPublishedCards,
    ...deps
  };
  const latestByType = {};
  const publishedByType = {};

  for (const entityType of sourceEntityTypes) {
    latestByType[entityType] = await resolvedDeps.listEntityCards(entityType, { db });
    publishedByType[entityType] = await resolvedDeps.listPublishedCards(entityType, { db });
  }

  return {
    latestByType,
    publishedByType,
    referenceIndex: buildEntityReferenceIndexFromCards({
      sourceEntityTypes,
      latestByType,
      publishedByType
    })
  };
}

export function buildGraphReferenceItem(entry, { reason = "" } = {}) {
  return {
    entityType: entry.sourceEntityType,
    entityId: entry.sourceEntityId,
    label: entry.sourceLabel,
    href: getEntityAdminHref(entry.sourceEntityType, entry.sourceEntityId),
    state: entry.sourceState,
    reason,
    relationLabel: entry.relationLabel
  };
}

export function listIncomingGraphEntries(targetEntityType, targetEntityId, catalog, options = {}) {
  const entries = lookupEntityReferenceEntries(catalog?.referenceIndex ?? new Map(), targetEntityType, targetEntityId);
  const excludedSourceId = String(options.excludedSourceId ?? "").trim();

  return entries.filter((entry) => {
    if (!entry?.sourceEntityId || (excludedSourceId && entry.sourceEntityId === excludedSourceId)) {
      return false;
    }

    if (options.state === "published" && entry.sourceState !== "published") {
      return false;
    }

    if (options.state === "draft" && entry.sourceState === "published") {
      return false;
    }

    if (typeof options.filter === "function" && !options.filter(entry)) {
      return false;
    }

    return true;
  });
}

export function isPublishedGraphEntry(entry) {
  return entry?.sourceState === "published";
}

export function isTestGraphEntry(entry) {
  return isAgentTestCreationOrigin(entry?.sourceCreationOrigin);
}

export function collectOutgoingGraphTargets(entityType, aggregate = {}) {
  return collectEntityGraphOutgoingTargets(entityType, aggregate);
}
