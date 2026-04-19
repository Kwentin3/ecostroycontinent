import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("entity editor exposes new quarantine controls and keeps legacy delete path explicit", () => {
  const source = readUtf8(new URL("../../components/admin/EntityEditorForm.js", import.meta.url));

  assert.match(source, /getRemovalMarkHref/);
  assert.match(source, /getRemovalUnmarkHref/);
  assert.match(source, /Центр очистки/);
  assert.match(source, /Безопасно убрать \(legacy\)/);
});

test("media workspace and collection overlay expose removal quarantine controls", () => {
  const workspaceSource = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const collectionSource = readUtf8(new URL("../../components/admin/MediaCollectionOverlay.js", import.meta.url));

  assert.match(workspaceSource, /getRemovalMarkHref\("media_asset", item\.id\)/);
  assert.match(workspaceSource, /getRemovalUnmarkHref\("media_asset", item\.id\)/);
  assert.match(workspaceSource, /Центр очистки/);
  assert.match(collectionSource, /getRemovalMarkHref\("gallery", selectedCollection\.id\)/);
  assert.match(collectionSource, /getRemovalUnmarkHref\("gallery", selectedCollection\.id\)/);
  assert.match(collectionSource, /!item\.markedForRemovalAt \|\| fields\.assetIds\.includes\(item\.id\)/);
});

test("cleanup center is wired into admin navigation and purge flow", () => {
  const shellSource = readUtf8(new URL("../../components/admin/AdminShell.js", import.meta.url));
  const pageSource = readUtf8(new URL("../../app/admin/(console)/removal-sweep/page.js", import.meta.url));
  const routeSource = readUtf8(new URL("../../app/api/admin/removal-sweep/purge/route.js", import.meta.url));

  assert.match(shellSource, /\/admin\/removal-sweep/);
  assert.match(pageSource, /listRemovalSweepComponents/);
  assert.match(pageSource, /\/api\/admin\/removal-sweep\/purge/);
  assert.match(routeSource, /executeRemovalSweep/);
  assert.match(routeSource, /userIsSuperadmin/);
});
