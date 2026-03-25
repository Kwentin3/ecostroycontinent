import { NextResponse } from "next/server";

import { getString } from "../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers";
import { userCanManageUsers } from "../../../../../lib/auth/session";
import { hashPassword } from "../../../../../lib/auth/password";
import { createUserRecord } from "../../../../../lib/content-core/repository";
import { recordAuditEvent } from "../../../../../lib/content-ops/audit";
import { AUDIT_EVENT_KEYS } from "../../../../../lib/content-core/content-types";

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanManageUsers(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const formData = await request.formData();
  const username = getString(formData, "username");
  const displayName = getString(formData, "displayName");
  const role = getString(formData, "role");
  const password = getString(formData, "password");

  const created = await createUserRecord({
    username,
    displayName,
    role,
    passwordHash: hashPassword(password)
  });

  await recordAuditEvent({
    actorUserId: user.id,
    eventKey: AUDIT_EVENT_KEYS.USER_CREATED,
    summary: `User ${created.username} was created.`,
    details: {
      createdUserId: created.id,
      role: created.role
    }
  });

  return NextResponse.redirect(new URL("/admin/users?message=User%20created", request.url));
}
