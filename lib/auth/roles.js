export function userIsSuperadmin(user) {
  return user?.role === "superadmin";
}

export function userCanPublish(user) {
  return userIsSuperadmin(user);
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
