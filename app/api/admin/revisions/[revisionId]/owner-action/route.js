import { NextResponse } from "next/server";

import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { userCanOwnerApprove } from "../../../../../../lib/auth/session";
import { processOwnerAction } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanOwnerApprove(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { revisionId } = await params;
  const formData = await request.formData();
  const action = getString(formData, "action");
  const comment = getString(formData, "comment");

  await processOwnerAction({
    revisionId,
    actorUserId: user.id,
    action,
    comment
  });

  return NextResponse.redirect(new URL(`/admin/review/${revisionId}?message=Owner%20action%20saved`, request.url));
}
