import { NextResponse } from "next/server";

import { completePublishObligation } from "../../../../../../lib/content-ops/workflow";
import { getString } from "../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
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
  try {
    await completePublishObligation(obligationId);

    return redirectWithQuery(request, redirectTo, { message: "Obligation completed" });
  } catch (error) {
    return redirectWithError(request, redirectTo, error);
  }
}
