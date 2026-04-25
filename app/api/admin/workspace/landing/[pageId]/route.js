import { redirectWithError } from "../../../../../../lib/admin/operation-feedback.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";

const DEFAULT_ROUTE_DEPS = Object.freeze({
  redirectWithError,
  requireRouteUser,
  userCanEditContent
});

export async function POST(request, { params }, overrides = {}) {
  const routeDeps = {
    ...DEFAULT_ROUTE_DEPS,
    ...overrides
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return routeDeps.redirectWithError(request, "/admin/entities/page", new Error("Недостаточно прав для редактирования страниц."));
  }

  const { pageId } = await params;
  const fallbackPath = pageId ? `/admin/entities/page/${pageId}` : "/admin/entities/page";

  return routeDeps.redirectWithError(
    request,
    fallbackPath,
    new Error("ИИ-верстка больше не поддерживает отдельный путь записи. Откройте страницу в домене «Страницы» и продолжайте работу там.")
  );
}
