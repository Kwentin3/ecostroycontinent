import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("media workspace exposes operator filters without test-only or mine shortcuts", () => {
  const source = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));

  assert.doesNotMatch(source, /key: "test-only"/);
  assert.doesNotMatch(source, /key: "mine"/);
  assert.doesNotMatch(source, /Только тестовые/);
  assert.doesNotMatch(source, />Мои</);
  assert.match(source, /key: "missing-alt"/);
  assert.match(source, /key: "review"/);
});

test("media workspace uses a separate selection control and bulk review action", () => {
  const source = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const css = readUtf8(new URL("../../components/admin/admin-ui.module.css", import.meta.url));

  assert.match(source, /selectedAssetIds/);
  assert.match(source, /mediaBulkActionBar/);
  assert.match(source, /\/api\/admin\/media\/library\/bulk-submit/);
  assert.match(source, /<article\s+key=\{item\.id\}/);
  assert.match(source, /className=\{styles\.mediaSelectMarker\}/);
  assert.match(source, /className=\{styles\.mediaLibraryCardOpen\}/);
  assert.doesNotMatch(source, /selectedDeleteIds|mediaDeleteMarker|handleBulkDeleteTestData/);
  assert.match(css, /\.mediaBulkActionBar\s*\{/);
  assert.match(css, /\.mediaLibraryCardOpen:focus-visible\s*\{/);
  assert.match(css, /\.mediaInspectorDisclosure,\s*\.mediaInspectorNestedDisclosure\s*\{/);
});
