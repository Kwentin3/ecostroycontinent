import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("media workspace keeps the submit and publish path discoverable after the editor redirect", () => {
  const workspaceSource = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const listPageSource = readUtf8(new URL("../../app/admin/(console)/entities/[entityType]/page.js", import.meta.url));
  const mediaLibrarySource = readUtf8(new URL("../../lib/admin/media-gallery.js", import.meta.url));

  assert.match(listPageSource, /currentUserRole=\{user\.role\}/);
  assert.match(mediaLibrarySource, /currentRevisionId: latestRevision\?\.id \?\? null/);
  assert.match(mediaLibrarySource, /ownerApprovalStatus: latestRevision\?\.ownerApprovalStatus \?\? "not_required"/);
  assert.match(mediaLibrarySource, /getReviewWorkflowStatusModel/);
  assert.match(mediaLibrarySource, /statusTone:/);
  assert.match(workspaceSource, /Публикация/);
  assert.match(workspaceSource, /Отправить на проверку/);
  assert.match(workspaceSource, /Открыть публикацию/);
  assert.match(workspaceSource, /Открыть проверку/);
  assert.match(workspaceSource, /Ждёт согласования/);
  assert.doesNotMatch(workspaceSource, /getOwnerApprovalStatusLabel/);
  assert.match(workspaceSource, /Версия остается в общей проверке\./);
  assert.match(workspaceSource, /currentUserRole === "superadmin"/);
  assert.match(workspaceSource, /\/api\/admin\/revisions\/\$\{item\.currentRevisionId\}\/submit/);
  assert.match(workspaceSource, /\/admin\/review\/\$\{item\.currentRevisionId\}/);
});
