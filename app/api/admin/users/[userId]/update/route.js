import { getBoolean, getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanManageUsers } from "../../../../../../lib/auth/session";
import { hashPassword } from "../../../../../../lib/auth/password";
import { findUserById, updateUserRecord } from "../../../../../../lib/content-core/repository";
import { recordAuditEvent } from "../../../../../../lib/content-ops/audit";
import { AUDIT_EVENT_KEYS } from "../../../../../../lib/content-core/content-types";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanManageUsers(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { userId } = await params;
  const current = await findUserById(userId);

  if (!current) {
    return redirectWithError(request, "/admin/users", new Error("Пользователь не найден."));
  }

  const formData = await request.formData();
  const username = getString(formData, "username");
  const displayName = getString(formData, "displayName");
  const role = getString(formData, "role");
  const active = getBoolean(formData, "active");
  const password = getString(formData, "password");

  if (user.id === userId && active === false) {
    return redirectWithError(request, `/admin/users/${userId}`, new Error("Нельзя отключить самого себя."));
  }

  try {
    const updated = await updateUserRecord(userId, {
      username,
      displayName,
      role,
      active,
      passwordHash: password ? hashPassword(password) : null
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventKey: AUDIT_EVENT_KEYS.USER_UPDATED,
      summary: `Пользователь ${updated.username} обновлён.`,
      details: {
        updatedUserId: updated.id,
        role: updated.role,
        active: updated.active
      }
    });

    return redirectWithQuery(request, `/admin/users/${userId}`, { message: FEEDBACK_COPY.userUpdated });
  } catch (error) {
    return redirectWithError(request, `/admin/users/${userId}`, error);
  }
}
