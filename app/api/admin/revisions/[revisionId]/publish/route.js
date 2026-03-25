import { NextResponse } from "next/server";

import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { userCanPublish } from "../../../../../../lib/auth/session";
import { publishRevision } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanPublish(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { revisionId } = await params;
  const result = await publishRevision({
    revisionId,
    actorUserId: user.id
  });

  return NextResponse.redirect(
    new URL(`/admin/entities/${result.entity.entityType}/${result.entity.id}?message=Published`, request.url)
  );
}
