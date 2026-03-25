import { getString } from "../../../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../../lib/admin/operation-feedback";
import { userCanPublish } from "../../../../../../../lib/auth/session";
import { rollbackPublishedEntity } from "../../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanPublish(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType, entityId } = await params;
  const formData = await request.formData();
  const targetRevisionId = getString(formData, "targetRevisionId");

  try {
    await rollbackPublishedEntity({
      entityId,
      targetRevisionId,
      actorUserId: user.id
    });

    return redirectWithQuery(request, `/admin/entities/${entityType}/${entityId}/history`, {
      message: "Rollback executed"
    });
  } catch (error) {
    return redirectWithError(request, `/admin/entities/${entityType}/${entityId}/history`, error);
  }
}
