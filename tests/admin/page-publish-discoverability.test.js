import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspacePath = new URL("../../components/admin/PageWorkspaceScreen.js", import.meta.url);
const reviewPagePath = new URL("../../app/admin/(console)/review/page.js", import.meta.url);
const genericEditorPath = new URL("../../components/admin/EntityEditorForm.js", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("page publish CTAs stay discoverable in workspace, review, and fallback editor paths", () => {
  const workspaceSource = readUtf8(workspacePath);
  const reviewSource = readUtf8(reviewPagePath);
  const genericEditorSource = readUtf8(genericEditorPath);

  assert.match(workspaceSource, /publishAction\.label/);
  assert.match(workspaceSource, /Ждет согласования|Ждёт согласования/);
  assert.match(workspaceSource, /ownerApprovalStatus === "pending"/);
  assert.match(reviewSource, /Открыть карточку/);
  assert.match(reviewSource, /Публикация и снятие с публикации выполняются из карточки сущности/);
  assert.match(genericEditorSource, /userCanPublishRevision/);
  assert.match(genericEditorSource, /Открыть проверку/);
  assert.match(genericEditorSource, /publishAction\.label/);
});
