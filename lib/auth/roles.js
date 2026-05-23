import { ENTITY_TYPES } from "../content-core/content-types.js";

export function userIsSuperadmin(user) {
  return user?.role === "superadmin";
}

export function userCanPublish(user) {
  // Sticky RBAC canon: this is the superadmin maintenance envelope, not the
  // revision publish gate used by editors after review approval.
  return userIsSuperadmin(user);
}

export function userCanPublishEntity(user, entityType) {
  if (userIsSuperadmin(user)) {
    return true;
  }

  return user?.role === "seo_manager" && Object.values(ENTITY_TYPES).includes(entityType);
}

export function userCanPublishRevision(user, entityOrType, revision = null) {
  const entityType = typeof entityOrType === "string"
    ? entityOrType
    : entityOrType?.entityType;

  if (!userCanPublishEntity(user, entityType)) {
    return false;
  }

  if (userIsSuperadmin(user)) {
    return true;
  }

  // Sticky RBAC canon: the generic revision publish gate requires review approval.
  // Gallery collections use a separate gallery-only direct publish path after readiness.
  if (user?.role === "seo_manager") {
    return Boolean(
      revision
      && revision.state === "review"
      && revision.ownerApprovalStatus === "approved"
    );
  }

  return false;
}

export function userCanManageUsers(user) {
  return userIsSuperadmin(user);
}

export function userCanEditContent(user) {
  return userIsSuperadmin(user) || user?.role === "seo_manager";
}

export function userCanReview(user) {
  return userIsSuperadmin(user) || user?.role === "seo_manager" || user?.role === "business_owner";
}

export function userCanOwnerApprove(user) {
  return user?.role === "business_owner" || userIsSuperadmin(user);
}
