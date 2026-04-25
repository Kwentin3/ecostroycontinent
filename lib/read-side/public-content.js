import {
  findPublishedBySlug,
  findPublishedPageByPageType,
  findRevisionById,
  listPublishedEntities
} from "../content-core/repository";
import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types";
import { getMediaDeliveryUrl } from "../media/storage.js";

// Public cross-domain lookups resolve active published revisions only.
// Do not pull draft or review state into these helpers without an explicit
// contract change in CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.
// Agent note: local workspace may not have the deployed DB. Local Postgres
// ECONNREFUSED is not proof of missing published content; verify deployed
// runtime per docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md.

function unwrapPublishedRow(row) {
  return {
    entityId: row.entityId,
    revisionId: row.revision.id,
    ...row.revision.payload
  };
}

function toMap(items) {
  return new Map(items.map((item) => [item.entityId, item]));
}

export async function getPublishedGlobalSettings() {
  const rows = await listPublishedEntities(ENTITY_TYPES.GLOBAL_SETTINGS);
  return rows[0]?.revision?.payload ?? null;
}

export async function getPublishedServices() {
  const rows = await listPublishedEntities(ENTITY_TYPES.SERVICE);
  return rows.map(unwrapPublishedRow);
}

export async function getPublishedEquipment() {
  const rows = await listPublishedEntities(ENTITY_TYPES.EQUIPMENT);
  return rows.map(unwrapPublishedRow);
}

export async function getPublishedCases() {
  const rows = await listPublishedEntities(ENTITY_TYPES.CASE);
  return rows.map(unwrapPublishedRow);
}

export async function getPublishedMediaAssets() {
  const rows = await listPublishedEntities(ENTITY_TYPES.MEDIA_ASSET);
  return rows.map((row) => ({
    ...unwrapPublishedRow(row),
    previewUrl: getMediaDeliveryUrl({
      entityId: row.entityId,
      storageKey: row.revision.payload.storageKey
    })
  }));
}

export async function getPublishedGalleries() {
  const rows = await listPublishedEntities(ENTITY_TYPES.GALLERY);
  return rows.map(unwrapPublishedRow);
}

export async function buildPublishedLookups() {
  const [services, equipment, cases, mediaAssets, galleries] = await Promise.all([
    getPublishedServices(),
    getPublishedEquipment(),
    getPublishedCases(),
    getPublishedMediaAssets(),
    getPublishedGalleries()
  ]);

  const mediaMap = toMap(mediaAssets);
  const galleryMap = new Map(
    galleries.map((gallery) => [
      gallery.entityId,
      {
        ...gallery,
        assets: (gallery.assetIds || []).map((assetId) => mediaMap.get(assetId)).filter(Boolean)
      }
    ])
  );

  return {
    services,
    equipment,
    cases,
    mediaAssets,
    galleries,
    serviceMap: toMap(services),
    equipmentMap: toMap(equipment),
    caseMap: toMap(cases),
    mediaMap,
    galleryMap
  };
}

export async function getPublishedServiceBySlug(slug) {
  const match = await findPublishedBySlug(ENTITY_TYPES.SERVICE, slug);

  if (!match) {
    return null;
  }

  return {
    entityId: match.entityId,
    revisionId: match.revision.id,
    ...match.revision.payload
  };
}

export async function getPublishedCaseBySlug(slug) {
  const match = await findPublishedBySlug(ENTITY_TYPES.CASE, slug);

  if (!match) {
    return null;
  }

  return {
    entityId: match.entityId,
    revisionId: match.revision.id,
    ...match.revision.payload
  };
}

export async function getPublishedPage(pageType) {
  const match = await findPublishedPageByPageType(pageType);

  if (!match) {
    return null;
  }

  return {
    entityId: match.entityId,
    revisionId: match.revision.id,
    ...match.revision.payload
  };
}

export async function getPublishedMediaAsset(entityId) {
  const rows = await listPublishedEntities(ENTITY_TYPES.MEDIA_ASSET);
  const match = rows.find((row) => row.entityId === entityId);

  return match ? { entityId: match.entityId, revisionId: match.revision.id, ...match.revision.payload } : null;
}

export async function getPublishedGallery(entityId) {
  const rows = await listPublishedEntities(ENTITY_TYPES.GALLERY);
  const match = rows.find((row) => row.entityId === entityId);

  return match ? { entityId: match.entityId, revisionId: match.revision.id, ...match.revision.payload } : null;
}

export async function getPreviewProjection(revisionId) {
  const revision = await findRevisionById(revisionId);

  if (!revision) {
    return null;
  }

  const globalSettings = revision.payload.pageType || revision.payload.slug
    ? await getPublishedGlobalSettings()
    : revision.payload;

  return {
    entityId: revision.entityId,
    revisionId: revision.id,
    payload: revision.payload,
    globalSettings
  };
}

export async function getPublishedAboutPage() {
  return getPublishedPage(PAGE_TYPES.ABOUT);
}

export async function getPublishedContactsPage() {
  return getPublishedPage(PAGE_TYPES.CONTACTS);
}
