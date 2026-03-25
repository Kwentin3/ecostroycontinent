import { NextResponse } from "next/server";

import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { userCanManageUsers } from "../../../../../../lib/auth/session";
import { updateUserActiveState } from "../../../../../../lib/content-core/repository";
import { recordAuditEvent } from "../../../../../../lib/content-ops/audit";
import { AUDIT_EVENT_KEYS } from "../../../../../../lib/content-core/content-types";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanManageUsers(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { userId } = await params;
  const formData = await request.formData();
  const nextActive = getString(formData, "active") === "true";
  const updated = await updateUserActiveState(userId, nextActive);

  await recordAuditEvent({
    actorUserId: user.id,
    eventKey: AUDIT_EVENT_KEYS.USER_STATUS_CHANGED,
    summary: `User ${updated.username} active state changed.`,
    details: {
      targetUserId: updated.id,
      active: updated.active
    }
  });

  return NextResponse.redirect(new URL("/admin/users?message=User%20updated", request.url));
}
