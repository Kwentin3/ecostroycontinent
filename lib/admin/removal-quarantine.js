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
