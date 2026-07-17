import { ENTITY_TYPES } from "../content-core/content-types.js";

export const REMOVAL_QUARANTINE_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

const REMOVAL_QUARANTINE_ENTITY_TYPE_SET = new Set(REMOVAL_QUARANTINE_ENTITY_TYPES);

export function isRemovalQuarantineEntityTypeSupported(entityType) {
  return REMOVAL_QUARANTINE_ENTITY_TYPE_SET.has(entityType);
}

export function isEntityMarkedForRemoval(entity) {
  return Boolean(entity?.markedForRemovalAt);
}

export function getRemovalMarkHref(entityType, entityId) {
  return `/api/admin/entities/${entityType}/${entityId}/mark-removal`;
}

export function getRemovalUnmarkHref(entityType, entityId) {
  return `/api/admin/entities/${entityType}/${entityId}/unmark-removal`;
}

export function getRemovalSweepHref() {
  return "/admin/removal-sweep";
}

export function encodeRemovalSweepRootKey(root = {}) {
  const entityType = String(root.entityType ?? "").trim();
  const entityId = String(root.entityId ?? "").trim();

  return entityType && entityId ? `${entityType}:${entityId}` : "";
}

export function parseRemovalSweepRootKey(value) {
  const normalized = String(value ?? "").trim();
  const separatorIndex = normalized.indexOf(":");

  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return null;
  }

  const entityType = normalized.slice(0, separatorIndex);
  const entityId = normalized.slice(separatorIndex + 1);

  if (!isRemovalQuarantineEntityTypeSupported(entityType) || !entityId) {
    return null;
  }

  return { entityType, entityId };
}
