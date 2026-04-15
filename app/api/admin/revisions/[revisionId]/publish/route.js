import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanPublishRevision } from "../../../../../../lib/auth/session";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository.js";
import { publishRevision } from "../../../../../../lib/content-ops/workflow";

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  const { revisionId } = await params;
  const revision = await findRevisionById(revisionId);

  if (!revision) {
    return redirectWithError(request, `/admin/review/${revisionId}`, new Error("Версия не найдена."));
  }

  const entity = await findEntityById(revision.entityId);

  if (!entity || !userCanPublishRevision(user, entity, revision)) {
    return redirectToAdmin("/admin/no-access");
  }

  try {
    const result = await publishRevision({
      revisionId,
      actorUserId: user.id
    });

    return redirectWithQuery(request, `/admin/entities/${result.entity.entityType}/${result.entity.id}`, {
      message: FEEDBACK_COPY.published
    });
  } catch (error) {
    return redirectWithError(request, `/admin/revisions/${revisionId}/publish`, error);
  }
}
