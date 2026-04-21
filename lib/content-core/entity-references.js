import { ENTITY_TYPES } from "./content-types.js";

function pushRef(bucket, targetEntityType, targetId, field) {
  const normalizedId = typeof targetId === "string" ? targetId.trim() : "";

  if (!normalizedId) {
    return;
  }

  bucket.push({
    targetEntityType: targetEntityType ?? null,
    targetId: normalizedId,
    field
  });
}

function pushRefs(bucket, targetEntityType, targetIds = [], field) {
  for (const targetId of targetIds ?? []) {
    pushRef(bucket, targetEntityType, targetId, field);
  }
}

function collectPageReferences(payload = {}) {
  const refs = [];
  const sourceRefs = payload?.sourceRefs && typeof payload.sourceRefs === "object"
    ? payload.sourceRefs
    : {};

  pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId, "primaryMediaAssetId");
  pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.hero?.mediaAssetId, "hero.mediaAssetId");
  pushRefs(refs, ENTITY_TYPES.MEDIA_ASSET, payload.mediaAssetIds, "mediaAssetIds");
  pushRef(refs, ENTITY_TYPES.SERVICE, sourceRefs.primaryServiceId ?? payload.primaryServiceId, "sourceRefs.primaryServiceId");
  pushRef(refs, ENTITY_TYPES.EQUIPMENT, sourceRefs.primaryEquipmentId ?? payload.primaryEquipmentId, "sourceRefs.primaryEquipmentId");
  pushRefs(refs, ENTITY_TYPES.CASE, sourceRefs.caseIds ?? payload.caseIds, "sourceRefs.caseIds");
  pushRefs(refs, ENTITY_TYPES.GALLERY, sourceRefs.galleryIds ?? payload.galleryIds, "sourceRefs.galleryIds");
  pushRefs(refs, ENTITY_TYPES.SERVICE, payload.serviceIds ?? payload.serviceCardIds, "serviceIds");
  pushRefs(refs, ENTITY_TYPES.CASE, payload.caseIds ?? payload.caseCardIds, "caseIds");
  pushRefs(refs, ENTITY_TYPES.GALLERY, payload.galleryIds, "galleryIds");

  for (const block of payload.blocks ?? []) {
    pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, block?.mediaAssetId, "blocks.mediaAssetId");
    pushRefs(refs, ENTITY_TYPES.MEDIA_ASSET, block?.mediaAssetIds, "blocks.mediaAssetIds");
    pushRefs(refs, ENTITY_TYPES.SERVICE, block?.serviceIds ?? block?.serviceCardIds, "blocks.serviceIds");
    pushRefs(refs, ENTITY_TYPES.CASE, block?.caseIds ?? block?.caseCardIds, "blocks.caseIds");
    pushRefs(refs, ENTITY_TYPES.GALLERY, block?.galleryIds, "blocks.galleryIds");
  }

  return refs;
}

function dedupeRefs(refs = []) {
  const seen = new Set();
  const result = [];

  for (const ref of refs) {
    const key = `${ref.targetEntityType ?? "any"}:${ref.targetId}:${ref.field ?? ""}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(ref);
  }

  return result;
}

export function collectEntityReferenceRecords(entityType, payload = {}) {
  const refs = [];

  switch (entityType) {
    case ENTITY_TYPES.GALLERY:
      pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryAssetId, "primaryAssetId");
      pushRefs(refs, ENTITY_TYPES.MEDIA_ASSET, payload.assetIds, "assetIds");
      pushRefs(refs, null, payload.relatedEntityIds, "relatedEntityIds");
      break;
    case ENTITY_TYPES.SERVICE:
      pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId, "primaryMediaAssetId");
      pushRefs(refs, ENTITY_TYPES.EQUIPMENT, payload.equipmentIds, "equipmentIds");
      pushRefs(refs, ENTITY_TYPES.CASE, payload.relatedCaseIds, "relatedCaseIds");
      pushRefs(refs, ENTITY_TYPES.GALLERY, payload.galleryIds, "galleryIds");
      break;
    case ENTITY_TYPES.EQUIPMENT:
      pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId, "primaryMediaAssetId");
      pushRefs(refs, ENTITY_TYPES.SERVICE, payload.serviceIds, "serviceIds");
      pushRefs(refs, ENTITY_TYPES.CASE, payload.relatedCaseIds ?? payload.caseIds, "relatedCaseIds");
      pushRefs(refs, ENTITY_TYPES.GALLERY, payload.galleryIds, "galleryIds");
      break;
    case ENTITY_TYPES.CASE:
      pushRef(refs, ENTITY_TYPES.MEDIA_ASSET, payload.primaryMediaAssetId, "primaryMediaAssetId");
      pushRefs(refs, ENTITY_TYPES.SERVICE, payload.serviceIds, "serviceIds");
      pushRefs(refs, ENTITY_TYPES.EQUIPMENT, payload.equipmentIds, "equipmentIds");
      pushRefs(refs, ENTITY_TYPES.GALLERY, payload.galleryIds, "galleryIds");
      break;
    case ENTITY_TYPES.PAGE:
      pushRefs(refs, null, collectPageReferences(payload).map((item) => item.targetId), "pageRefs");
      return dedupeRefs(collectPageReferences(payload));
    default:
      break;
  }

  return dedupeRefs(refs);
}

export function referencesTarget(entityType, payload, targetEntityType, targetId) {
  return collectEntityReferenceRecords(entityType, payload).some((ref) => {
    if (ref.targetId !== targetId) {
      return false;
    }

    return !ref.targetEntityType || ref.targetEntityType === targetEntityType;
  });
}

export function buildReferenceIdentity(ref = {}) {
  return `${ref.targetEntityType ?? "any"}:${ref.targetId}`;
}
