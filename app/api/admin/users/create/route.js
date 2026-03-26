import { getString } from "../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../lib/admin/operation-feedback";
import { userCanManageUsers } from "../../../../../lib/auth/session";
import { hashPassword } from "../../../../../lib/auth/password";
import { createUserRecord } from "../../../../../lib/content-core/repository";
import { recordAuditEvent } from "../../../../../lib/content-ops/audit";
import { AUDIT_EVENT_KEYS } from "../../../../../lib/content-core/content-types";
import { FEEDBACK_COPY } from "../../../../../lib/ui-copy.js";

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanManageUsers(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const username = getString(formData, "username");
  const displayName = getString(formData, "displayName");
  const role = getString(formData, "role");
  const password = getString(formData, "password");

  try {
    const created = await createUserRecord({
      username,
      displayName,
      role,
      passwordHash: hashPassword(password)
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventKey: AUDIT_EVENT_KEYS.USER_CREATED,
      summary: `Пользователь ${created.username} создан.`,
      details: {
        createdUserId: created.id,
        role: created.role
      }
    });

    return redirectWithQuery(request, "/admin/users", { message: FEEDBACK_COPY.userCreated });
  } catch (error) {
    return redirectWithError(request, "/admin/users", error);
  }
}
