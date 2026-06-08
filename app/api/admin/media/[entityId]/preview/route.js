import { readMediaFile } from "../../../../../../lib/media/storage.js";
import { getEntityEditorState } from "../../../../../../lib/content-core/service.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent, userCanReadAdminMediaPreview, userCanReview } from "../../../../../../lib/auth/session.js";
import { mediaAssetIsVisibleInReviewQueue } from "../../../../../../lib/admin/review-media-access.js";

const defaultDeps = {
  readMediaFile,
  getEntityEditorState,
  requireRouteUser,
  userCanEditContent,
  userCanReadAdminMediaPreview,
  userCanReview,
  mediaAssetIsVisibleInReviewQueue
};

export async function GET(request, { params }, deps = defaultDeps) {
  const { user, response } = await deps.requireRouteUser(request);

  if (response) {
    return response;
  }

  const { entityId } = await params;
  const reviewVisible = !deps.userCanEditContent(user)
    && deps.userCanReview(user)
    && await deps.mediaAssetIsVisibleInReviewQueue(entityId);
  const canReadPreview = deps.userCanReadAdminMediaPreview(user, { reviewVisible });

  if (!canReadPreview) {
    return new Response("Не найдено", { status: 404 });
  }

  const state = await deps.getEntityEditorState(entityId);
  const revision = state.revisions[0] ?? state.activePublishedRevision ?? null;
  const storageKey = revision?.payload?.storageKey;

  if (!state.entity || state.entity.entityType !== "media_asset" || !storageKey) {
    return new Response("Не найдено", { status: 404 });
  }

  const cacheHeaders = {
    "cache-control": "private, max-age=300",
    "vary": "Cookie",
    "x-content-type-options": "nosniff"
  };
  const etag = revision?.id ? `"${revision.id}"` : "";

  if (etag && request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ...cacheHeaders,
        etag
      }
    });
  }

  try {
    const bytes = await deps.readMediaFile(storageKey);

    return new Response(bytes, {
      headers: {
        "content-type": revision?.payload?.mimeType || "application/octet-stream",
        ...cacheHeaders,
        ...(etag ? { etag } : {})
      }
    });
  } catch {
    return new Response("Не найдено", { status: 404 });
  }
}
