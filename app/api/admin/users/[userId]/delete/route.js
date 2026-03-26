import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanManageUsers } from "../../../../../../lib/auth/session";
import { deleteUserRecord, findUserById, listUsers } from "../../../../../../lib/content-core/repository";
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

  if (user.id === userId) {
    return redirectWithError(request, `/admin/users/${userId}`, new Error("Нельзя удалить самого себя."));
  }

  const users = await listUsers();
  const activeSuperadminCount = users.filter((item) => item.role === "superadmin" && item.active).length;

  if (current.role === "superadmin" && current.active && activeSuperadminCount <= 1) {
    return redirectWithError(request, `/admin/users/${userId}`, new Error("Нельзя удалить последнего активного суперадмина."));
  }

  try {
    await deleteUserRecord(userId);

    await recordAuditEvent({
      actorUserId: user.id,
      eventKey: AUDIT_EVENT_KEYS.USER_DELETED,
      summary: `Пользователь ${current.username} удалён.`,
      details: {
        deletedUserId: current.id,
        role: current.role
      }
    });

    return redirectWithQuery(request, "/admin/users", { message: FEEDBACK_COPY.userDeleted });
  } catch (error) {
    return redirectWithError(request, `/admin/users/${userId}`, error);
  }
}
