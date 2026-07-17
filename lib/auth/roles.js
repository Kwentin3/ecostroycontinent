import { AUTH_PERMISSIONS, AUTH_ROLES, canUser, userHasRole } from "./policy.js";

// Compatibility facade only. The canonical runtime permission matrix lives in
// lib/auth/policy.js; new code should add decisions there first.

export function userIsSuperadmin(user) {
  return canUser(user, AUTH_PERMISSIONS.SUPERADMIN);
}

export function userIsBusinessOwner(user) {
  return userHasRole(user, AUTH_ROLES.BUSINESS_OWNER);
}

export function userCanPublish(user) {
  return canUser(user, AUTH_PERMISSIONS.CONTENT_PUBLISH_MAINTENANCE);
}

export function userCanPublishEntity(user, entityType) {
  return canUser(user, AUTH_PERMISSIONS.CONTENT_PUBLISH_ENTITY, { entityType });
}

export function userCanUnpublish(user, entityType) {
  return canUser(user, AUTH_PERMISSIONS.CONTENT_UNPUBLISH, { entityType });
}

export function userCanPublishRevision(user, entityOrType, revision = null) {
  return canUser(user, AUTH_PERMISSIONS.REVISION_PUBLISH, {
    entityOrType,
    revision
  });
}

export function userCanManageUsers(user) {
  return canUser(user, AUTH_PERMISSIONS.USER_MANAGE);
}

export function userCanEditContent(user) {
  return canUser(user, AUTH_PERMISSIONS.CONTENT_EDIT);
}

export function userCanReview(user) {
  return canUser(user, AUTH_PERMISSIONS.CONTENT_REVIEW);
}

export function userCanOwnerApprove(user) {
  return canUser(user, AUTH_PERMISSIONS.OWNER_APPROVE);
}

export function userCanRollback(user) {
  return canUser(user, AUTH_PERMISSIONS.REVISION_ROLLBACK);
}

export function userCanRunMaintenancePurge(user) {
  return canUser(user, AUTH_PERMISSIONS.MAINTENANCE_PURGE);
}

export function userCanViewRemovalSweep(user) {
  return canUser(user, AUTH_PERMISSIONS.REMOVAL_SWEEP_VIEW);
}

export function userCanExecuteRemovalSweep(user) {
  return canUser(user, AUTH_PERMISSIONS.REMOVAL_SWEEP_EXECUTE);
}

export function userCanReadAdminMediaPreview(user, context = {}) {
  return canUser(user, AUTH_PERMISSIONS.MEDIA_PREVIEW, context);
}
