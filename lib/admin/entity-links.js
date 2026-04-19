import { ENTITY_TYPES } from "../content-core/content-types.js";

export function getEntityAdminHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return `/admin/entities/media_asset?asset=${entityId}`;
  }

  if (entityType === ENTITY_TYPES.GALLERY) {
    return `/admin/entities/media_asset?compose=collections&collection=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}
