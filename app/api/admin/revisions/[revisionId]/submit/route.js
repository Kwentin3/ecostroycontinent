import { NextResponse } from "next/server";

import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanEditContent } from "../../../../../../lib/auth/session";
import { submitRevisionForReview } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { revisionId } = await params;
  try {
    await submitRevisionForReview({
      revisionId,
      actorUserId: user.id,
      canRenderPreview: true
    });

    return redirectWithQuery(request, `/admin/review/${revisionId}`, { message: "Submitted for review" });
  } catch (error) {
    return redirectWithError(request, `/admin/review/${revisionId}`, error);
  }
}
