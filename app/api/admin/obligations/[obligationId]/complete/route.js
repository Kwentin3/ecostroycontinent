import { NextResponse } from "next/server";

import { completePublishObligation } from "../../../../../../lib/content-ops/workflow";
import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { userCanPublish } from "../../../../../../lib/auth/session";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanPublish(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { obligationId } = await params;
  const formData = await request.formData();
  const redirectTo = getString(formData, "redirectTo") || "/admin";

  await completePublishObligation(obligationId);

  return NextResponse.redirect(new URL(`${redirectTo}?message=Obligation%20completed`, request.url));
}
