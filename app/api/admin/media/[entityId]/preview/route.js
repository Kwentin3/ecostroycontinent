import { readMediaFile } from "../../../../../../lib/media/storage";
import { getEntityEditorState } from "../../../../../../lib/content-core/service";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { userCanEditContent } from "../../../../../../lib/auth/session";

export async function GET(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return new Response("Not found", { status: 404 });
  }

  const { entityId } = await params;
  const state = await getEntityEditorState(entityId);
  const revision = state.revisions[0] ?? state.activePublishedRevision ?? null;
  const storageKey = revision?.payload?.storageKey;

  if (!state.entity || state.entity.entityType !== "media_asset" || !storageKey) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await readMediaFile(storageKey);

    return new Response(bytes, {
      headers: {
        "content-type": revision?.payload?.mimeType || "application/octet-stream",
        "cache-control": "no-store"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
