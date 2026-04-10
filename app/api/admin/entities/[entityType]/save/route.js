import { buildEntityPayload } from "../../../../../../lib/admin/entity-form-data.js";
import { normalizeEntityCreationOrigin } from "../../../../../../lib/admin/entity-origin.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery, toOperatorMessage } from "../../../../../../lib/admin/operation-feedback.js";
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
  const redirectMode = getString(formData, "redirectMode");
  const successRedirectTo = getString(formData, "redirectTo");
  const failureRedirectTo = getString(formData, "failureRedirectTo");

  try {
    const result = await routeDeps.saveDraft({
      entityType,
      entityId: entityId || null,
      userId: user.id,
      changeIntent,
      payload: buildEntityPayload(entityType, formData),
      creationOrigin
    });

    const successPath = redirectMode === "page_workspace" && entityType === "page"
      ? `/admin/entities/page/${result.entity.id}`
      : (successRedirectTo || `/admin/entities/${entityType}/${result.entity.id}`);

    return redirectWithQuery(request, successPath, {
      message: FEEDBACK_COPY.draftSaved
    });
  } catch (error) {
    if (redirectMode === "page_workspace" && entityType === "page" && !entityId && failureRedirectTo) {
      return redirectWithQuery(request, failureRedirectTo, {
        error: toOperatorMessage(error),
        createPageType: getString(formData, "pageType") || "about",
        createTitle: getString(formData, "title")
      });
    }

    const fallbackPath = failureRedirectTo || (entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`);
    return redirectWithError(request, fallbackPath, error);
  }
}
