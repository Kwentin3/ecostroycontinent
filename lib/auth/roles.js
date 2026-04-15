import { ENTITY_TYPES } from "../content-core/content-types.js";

export function userIsSuperadmin(user) {
  return user?.role === "superadmin";
}

export function userCanPublish(user) {
  return userIsSuperadmin(user);
}

export function userCanPublishEntity(user, entityType) {
  if (userIsSuperadmin(user)) {
    return true;
  }

  return user?.role === "seo_manager" && entityType === ENTITY_TYPES.PAGE;
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

  if (user?.role === "seo_manager" && entityType === ENTITY_TYPES.PAGE) {
    return !revision || revision.state === "review";
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
