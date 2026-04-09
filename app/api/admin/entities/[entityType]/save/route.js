import { buildEntityPayload } from "../../../../../../lib/admin/entity-form-data.js";
import { normalizeEntityCreationOrigin } from "../../../../../../lib/admin/entity-origin.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    saveDraft,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType } = await params;
  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Черновик сохранён из редактора.";
  const creationOrigin = normalizeEntityCreationOrigin(getString(formData, "creationOrigin"));

  try {
    const result = await routeDeps.saveDraft({
      entityType,
      entityId: entityId || null,
      userId: user.id,
      changeIntent,
      payload: buildEntityPayload(entityType, formData),
      creationOrigin
    });

    return redirectWithQuery(request, `/admin/entities/${entityType}/${result.entity.id}`, {
      message: FEEDBACK_COPY.draftSaved
    });
  } catch (error) {
    const fallbackPath = entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`;
    return redirectWithError(request, fallbackPath, error);
  }
}
