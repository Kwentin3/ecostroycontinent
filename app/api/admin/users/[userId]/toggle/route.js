import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanManageUsers } from "../../../../../../lib/auth/session";
import { updateUserActiveState } from "../../../../../../lib/content-core/repository";
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
  const formData = await request.formData();
  const nextActive = getString(formData, "active") === "true";

  if (user.id === userId && nextActive === false) {
    return redirectWithError(request, "/admin/users", new Error("Нельзя отключить самого себя."));
  }

  try {
    const updated = await updateUserActiveState(userId, nextActive);

    await recordAuditEvent({
      actorUserId: user.id,
      eventKey: AUDIT_EVENT_KEYS.USER_STATUS_CHANGED,
      summary: `Статус пользователя ${updated.username} изменён.`,
      details: {
        targetUserId: updated.id,
        active: updated.active
      }
    });

    return redirectWithQuery(request, "/admin/users", { message: FEEDBACK_COPY.userUpdated });
  } catch (error) {
    return redirectWithError(request, "/admin/users", error);
  }
}
