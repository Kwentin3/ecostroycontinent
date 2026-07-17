import { ENTITY_TYPES } from "../content-core/content-types.js";

export const AUTH_ROLES = Object.freeze({
  SUPERADMIN: "superadmin",
  SEO_MANAGER: "seo_manager",
  BUSINESS_OWNER: "business_owner"
});

export const AUTH_PERMISSIONS = Object.freeze({
  SUPERADMIN: "superadmin",
  CONTENT_EDIT: "content.edit",
  CONTENT_REVIEW: "content.review",
  CONTENT_PUBLISH_MAINTENANCE: "content.publish_maintenance",
  CONTENT_PUBLISH_ENTITY: "content.publish_entity",
  CONTENT_UNPUBLISH: "content.unpublish",
  REVISION_PUBLISH: "revision.publish",
  REVISION_ROLLBACK: "revision.rollback",
  OWNER_APPROVE: "review.owner_approve",
  USER_MANAGE: "users.manage",
  MEDIA_PREVIEW: "media.preview",
  REMOVAL_SWEEP_VIEW: "removal_sweep.view",
  REMOVAL_SWEEP_EXECUTE: "removal_sweep.execute",
  MAINTENANCE_PURGE: "maintenance.purge"
});

function getRole(user) {
  return typeof user?.role === "string" ? user.role : "";
}

export function userHasRole(user, role) {
  return getRole(user) === role;
}

function isContentEntityType(entityType) {
  return Object.values(ENTITY_TYPES).includes(entityType);
}

function isUnpublishableEntityType(entityType) {
  return [
    ENTITY_TYPES.PAGE,
    ENTITY_TYPES.SERVICE,
    ENTITY_TYPES.EQUIPMENT,
    ENTITY_TYPES.CASE,
    ENTITY_TYPES.GALLERY,
    ENTITY_TYPES.MEDIA_ASSET
  ].includes(entityType);
}

function getEntityType(entityOrType) {
  return typeof entityOrType === "string"
    ? entityOrType
    : entityOrType?.entityType;
}

function canPublishEntity(user, entityType) {
  const role = getRole(user);

  if (role === AUTH_ROLES.SUPERADMIN) {
    return true;
  }

  return role === AUTH_ROLES.SEO_MANAGER && isContentEntityType(entityType);
}

function canPublishRevision(user, context = {}) {
  const role = getRole(user);
  const entityType = getEntityType(context.entityOrType ?? context.entityType);
  const revision = context.revision ?? null;

  if (!canPublishEntity(user, entityType)) {
    return false;
  }

  if (role === AUTH_ROLES.SUPERADMIN) {
    return true;
  }

  // Sticky RBAC canon: generic revision publish requires owner approval.
  // Gallery collections use a separate gallery-only direct publish path.
  return role === AUTH_ROLES.SEO_MANAGER
    && Boolean(
      revision
      && revision.state === "review"
      && revision.ownerApprovalStatus === "approved"
    );
}

function canUnpublishEntity(user, entityType) {
  const role = getRole(user);

  if (!isUnpublishableEntityType(entityType)) {
    return false;
  }

  return role === AUTH_ROLES.SUPERADMIN || role === AUTH_ROLES.SEO_MANAGER;
}

export function canUser(user, permission, context = {}) {
  const role = getRole(user);

  switch (permission) {
    case AUTH_PERMISSIONS.SUPERADMIN:
    case AUTH_PERMISSIONS.CONTENT_PUBLISH_MAINTENANCE:
    case AUTH_PERMISSIONS.REVISION_ROLLBACK:
    case AUTH_PERMISSIONS.USER_MANAGE:
    case AUTH_PERMISSIONS.MAINTENANCE_PURGE:
      return role === AUTH_ROLES.SUPERADMIN;
    case AUTH_PERMISSIONS.CONTENT_EDIT:
      return role === AUTH_ROLES.SUPERADMIN || role === AUTH_ROLES.SEO_MANAGER;
    case AUTH_PERMISSIONS.CONTENT_REVIEW:
      return role === AUTH_ROLES.SUPERADMIN
        || role === AUTH_ROLES.SEO_MANAGER
        || role === AUTH_ROLES.BUSINESS_OWNER;
    case AUTH_PERMISSIONS.REMOVAL_SWEEP_VIEW:
      return role === AUTH_ROLES.SUPERADMIN
        || role === AUTH_ROLES.SEO_MANAGER
        || role === AUTH_ROLES.BUSINESS_OWNER;
    case AUTH_PERMISSIONS.REMOVAL_SWEEP_EXECUTE:
      // This is intentionally narrower than generic maintenance purge:
      // the owner may execute only the re-analyzed, quarantine-bound sweep.
      return role === AUTH_ROLES.SUPERADMIN || role === AUTH_ROLES.BUSINESS_OWNER;
    case AUTH_PERMISSIONS.OWNER_APPROVE:
      return role === AUTH_ROLES.SUPERADMIN || role === AUTH_ROLES.BUSINESS_OWNER;
    case AUTH_PERMISSIONS.CONTENT_PUBLISH_ENTITY:
      return canPublishEntity(user, context.entityType);
    case AUTH_PERMISSIONS.CONTENT_UNPUBLISH:
      return canUnpublishEntity(user, context.entityType);
    case AUTH_PERMISSIONS.REVISION_PUBLISH:
      return canPublishRevision(user, context);
    case AUTH_PERMISSIONS.MEDIA_PREVIEW:
      return canUser(user, AUTH_PERMISSIONS.CONTENT_EDIT)
        || (canUser(user, AUTH_PERMISSIONS.CONTENT_REVIEW) && Boolean(context.reviewVisible));
    default:
      return false;
  }
}
