import { NextResponse } from "next/server";

import { getString } from "../../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers";
import { userCanPublish } from "../../../../../../../lib/auth/session";
import { rollbackPublishedEntity } from "../../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanPublish(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { entityType, entityId } = await params;
  const formData = await request.formData();
  const targetRevisionId = getString(formData, "targetRevisionId");

  await rollbackPublishedEntity({
    entityId,
    targetRevisionId,
    actorUserId: user.id
  });

  return NextResponse.redirect(new URL(`/admin/entities/${entityType}/${entityId}?message=Rollback%20executed`, request.url));
}
