import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("page workspace keeps one compact primary toolbar and moves service actions into disclosure", () => {
  const source = readUtf8("components/admin/PageWorkspaceScreen.js");
  const css = readUtf8("components/admin/PageWorkspaceScreen.module.css");

  assert.match(source, /headerPrimaryActions/);
  assert.match(source, /headerServiceDisclosure/);
  assert.match(source, /Служебные действия/);
  assert.match(source, /Метаданные, история и жизненный цикл остаются доступны/);
  assert.equal((source.match(/>История<\/Link>/g) || []).length, 1);
  assert.doesNotMatch(source, /\{false \?\s*\(\s*<div className=\{styles\.quickActions\}/);
  assert.match(css, /\.headerPrimaryActions,\s*\.headerServiceActions\s*\{/);
  assert.match(css, /\.headerServiceDisclosure\s*\{/);
});

test("media workspace keeps service cleanup and legacy tools out of the main toolbar flow", () => {
  const source = readUtf8("components/admin/MediaGalleryWorkspace.js");
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.match(source, /mediaToolbarFieldRow/);
  assert.match(source, /mediaToolbarPrimaryActions/);
  assert.match(source, /Cleanup-операции остаются под рукой, но не забирают место у основного сценария медиатеки/);
  assert.match(source, /Cleanup, legacy-проверка и история остаются доступны отдельно/);
  assert.equal((source.match(/Проверить удаление \(legacy\)/g) || []).length, 1);
  assert.equal((source.match(/Служебные действия/g) || []).length, 2);
  assert.match(css, /\.mediaToolbarFieldRow,\s*\.mediaToolbarPrimaryActions\s*\{/);
  assert.match(css, /\.mediaToolbarServiceDisclosure\s*\{/);
});
