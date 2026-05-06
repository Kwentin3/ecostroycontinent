import { revalidatePath } from "next/cache.js";

import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback.js";
import { userCanPublishRevision } from "../../../../../../lib/auth/session.js";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository.js";
import { publishRevision } from "../../../../../../lib/content-ops/workflow.js";

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanPublishRevision,
    findRevisionById,
    findEntityById,
    publishRevision,
    revalidatePath,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  const { revisionId } = await params;
  const revision = await routeDeps.findRevisionById(revisionId);

  if (!revision) {
    return redirectWithError(request, `/admin/review/${revisionId}`, new Error("Версия не найдена."));
  }

  const entity = await routeDeps.findEntityById(revision.entityId);

  if (!entity || !routeDeps.userCanPublishRevision(user, entity, revision)) {
    return redirectToAdmin("/admin/no-access");
  }

  try {
    const result = await routeDeps.publishRevision({
      revisionId,
      actorUserId: user.id
    });
    const revalidationPaths = result.publishFollowUp?.revalidationPaths ?? [];

    for (const path of revalidationPaths) {
      if (path) {
        routeDeps.revalidatePath(path);
      }
    }

    return redirectWithQuery(request, `/admin/entities/${result.entity.entityType}/${result.entity.id}`, {
      message: FEEDBACK_COPY.published
    });
  } catch (error) {
    return redirectWithError(request, `/admin/revisions/${revisionId}/publish`, error);
  }
}
