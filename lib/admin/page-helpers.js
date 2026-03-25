import { redirect } from "next/navigation";

import {
  getCurrentUser,
  userCanEditContent,
  userCanManageUsers,
  userCanOwnerApprove,
  userCanPublish,
  userCanReview
} from "../auth/session";

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireEditorUser() {
  const user = await requireAdminUser();

  if (!userCanEditContent(user)) {
    redirect("/admin/no-access");
  }

  return user;
}

export async function requireReviewUser() {
  const user = await requireAdminUser();

  if (!userCanReview(user)) {
    redirect("/admin/no-access");
  }

  return user;
}

export async function requirePublishUser() {
  const user = await requireAdminUser();

  if (!userCanPublish(user)) {
    redirect("/admin/no-access");
  }

  return user;
}

export async function requireOwnerApprover() {
  const user = await requireAdminUser();

  if (!userCanOwnerApprove(user)) {
    redirect("/admin/no-access");
  }

  return user;
}

export async function requireUserManager() {
  const user = await requireAdminUser();

  if (!userCanManageUsers(user)) {
    redirect("/admin/no-access");
  }

  return user;
}
