import { buildEntityPayload } from "../../../../../../lib/admin/entity-form-data.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanEditContent } from "../../../../../../lib/auth/session";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { saveDraft } from "../../../../../../lib/content-core/service";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType } = await params;
  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Черновик сохранён из редактора.";

  try {
    const result = await saveDraft({
      entityType,
      entityId: entityId || null,
      userId: user.id,
      changeIntent,
      payload: buildEntityPayload(entityType, formData)
    });

    return redirectWithQuery(request, `/admin/entities/${entityType}/${result.entity.id}`, {
      message: FEEDBACK_COPY.draftSaved
    });
  } catch (error) {
    const fallbackPath = entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`;
    return redirectWithError(request, fallbackPath, error);
  }
}
