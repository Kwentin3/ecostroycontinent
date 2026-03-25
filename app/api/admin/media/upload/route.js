import path from "node:path";

import { getString } from "../../../../../lib/admin/form-data";
import { requireRouteUser } from "../../../../../lib/admin/route-helpers";
import { redirectToAdmin, redirectWithQuery } from "../../../../../lib/admin/operation-feedback";
import { userCanEditContent } from "../../../../../lib/auth/session";
import { saveDraft } from "../../../../../lib/content-core/service";
import { storeMediaFile } from "../../../../../lib/media/storage";

export async function POST(request) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const redirectTo = getString(formData, "redirectTo") || "/admin/entities/media_asset";
  const title = getString(formData, "title");
  const alt = getString(formData, "alt");
  const ownershipNote = getString(formData, "ownershipNote");
  const sourceNote = getString(formData, "sourceNote");

  if (!(file instanceof File) || file.size === 0) {
    return redirectWithQuery(request, redirectTo, { error: "Choose a file" });
  }

  const storageKey = `${crypto.randomUUID()}${path.extname(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await storeMediaFile({
    storageKey,
    bytes
  });

  const saved = await saveDraft({
    entityType: "media_asset",
    entityId: null,
    userId: user.id,
    changeIntent: "Uploaded media asset.",
    payload: {
      title,
      alt,
      ownershipNote,
      sourceNote,
      storageKey,
      mimeType: file.type,
      originalFilename: file.name,
      uploadedBy: user.username,
      uploadedAt: new Date().toISOString(),
      sizeBytes: file.size,
      status: "ready"
    }
  });

  return redirectWithQuery(request, redirectTo, {
    message: "Media uploaded",
    entityId: saved.entity.id
  });
}
