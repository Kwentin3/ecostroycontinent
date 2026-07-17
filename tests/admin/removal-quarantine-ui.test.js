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
  assert.match(source, /getRemovalSweepHref\(\)/);
  assert.match(source, /getEntityDeletePreviewHref/);
});

test("media workspace and collection overlay expose removal quarantine controls", () => {
  const workspaceSource = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const collectionSource = readUtf8(new URL("../../components/admin/MediaCollectionOverlay.js", import.meta.url));

  assert.match(workspaceSource, /getRemovalMarkHref\("media_asset", item\.id\)/);
  assert.match(workspaceSource, /getRemovalUnmarkHref\("media_asset", item\.id\)/);
  assert.match(workspaceSource, /getRemovalSweepHref\(\)/);
  assert.match(collectionSource, /getRemovalMarkHref\("gallery", selectedCollection\.id\)/);
  assert.match(collectionSource, /getRemovalUnmarkHref\("gallery", selectedCollection\.id\)/);
  assert.match(collectionSource, /const selected = fields\.assetIds\.includes\(item\.id\)/);
  assert.match(collectionSource, /if \(selected\) \{\s*return true;\s*\}/);
  assert.match(collectionSource, /return !item\.markedForRemovalAt && matchesMediaCollectionCandidateFilter\(item, assetCandidateFilter\)/);
});

test("cleanup center is wired into admin navigation and purge flow", () => {
  const navSource = readUtf8(new URL("../../lib/admin/nav.js", import.meta.url));
  const pageSource = readUtf8(new URL("../../app/admin/(console)/removal-sweep/page.js", import.meta.url));
  const workspaceSource = readUtf8(new URL("../../components/admin/RemovalSweepWorkspace.js", import.meta.url));
  const dialogSource = readUtf8(new URL("../../components/admin/RemovalSweepBatchDialog.js", import.meta.url));
  const loadingSource = readUtf8(new URL("../../app/admin/(console)/removal-sweep/loading.js", import.meta.url));
  const errorSource = readUtf8(new URL("../../app/admin/(console)/removal-sweep/error.js", import.meta.url));
  const routeSource = readUtf8(new URL("../../app/api/admin/removal-sweep/purge/route.js", import.meta.url));
  const bulkRouteSource = readUtf8(new URL("../../app/api/admin/removal-sweep/bulk-purge/route.js", import.meta.url));

  assert.match(navSource, /\/admin\/removal-sweep/);
  assert.match(navSource, /visible: userCanViewRemovalSweep/);
  assert.match(pageSource, /listRemovalSweepComponents/);
  assert.match(pageSource, /listRecentDestructiveEvents/);
  assert.match(pageSource, /operationKind: "removal_sweep"/);
  assert.match(pageSource, /RemovalSweepWorkspace/);
  assert.match(pageSource, /requireRemovalSweepUser/);
  assert.match(pageSource, /canExecuteRemovalSweep=\{userCanExecuteRemovalSweep\(user\)\}/);
  assert.match(pageSource, /canOpenEntityDetails=\{userCanEditContent\(user\)\}/);
  assert.doesNotMatch(pageSource, /\/api\/admin\/removal-sweep\/purge/);
  assert.match(workspaceSource, /Можно удалить/);
  assert.match(workspaceSource, /Пока нельзя/);
  assert.match(workspaceSource, /Удалить выбранные/);
  assert.match(workspaceSource, /className=\{`\$\{styles\.removalSweepDeleteIconButton\}/);
  assert.match(workspaceSource, /aria-label=\{removing \? `Проверяем/);
  assert.match(workspaceSource, /onRemove=\{\(key\) => openBatchDialog\(\[key\]\)\}/);
  assert.match(workspaceSource, /makeBatchFormData\("execute", batchKeys\)/);
  assert.match(workspaceSource, /showThumbnail=\{canOpenEntityDetails\}/);
  assert.match(workspaceSource, /canOpenEntityDetails && item\.href/);
  assert.match(workspaceSource, /aria-expanded/);
  assert.match(workspaceSource, /role="status"/);
  assert.match(workspaceSource, /role="alert"/);
  assert.match(workspaceSource, /\/api\/admin\/removal-sweep\/bulk-purge/);
  assert.match(dialogSource, /Удалить выбранные объекты навсегда/);
  assert.match(dialogSource, /readyObjectCount/);
  assert.match(dialogSource, /event\.key === "Tab"/);
  assert.match(loadingSource, /Загружаем очередь очистки/);
  assert.match(errorSource, /Повторить загрузку/);
  assert.match(routeSource, /executeRemovalSweep/);
  assert.match(routeSource, /userCanRunMaintenancePurge/);
  assert.match(bulkRouteSource, /userCanExecuteRemovalSweep/);
  assert.match(bulkRouteSource, /previewRemovalSweepBatch/);
  assert.match(bulkRouteSource, /executeRemovalSweepBatch/);
  assert.match(bulkRouteSource, /status = result\.deletedComponentCount > 0/);
});
