import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("media workspace exposes operator filters without test-only or mine shortcuts", () => {
  const source = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const filtersSource = readUtf8(new URL("../../lib/admin/media-library-filters.js", import.meta.url));

  assert.doesNotMatch(source, /key: "test-only"/);
  assert.doesNotMatch(source, /key: "mine"/);
  assert.doesNotMatch(source, /Только тестовые/);
  assert.doesNotMatch(source, />Мои</);
  assert.match(source, /MEDIA_LIBRARY_FILTERS/);
  assert.match(source, /matchesMediaLibraryFilter\(item, filterKey\)/);
  assert.match(source, /buildMediaLibrarySummaryItems\(items\)/);
  assert.match(filtersSource, /key: "missing-alt"/);
  assert.match(filtersSource, /key: "review"/);
  assert.match(filtersSource, /key: "returned"/);
  assert.doesNotMatch(filtersSource, /key: "broken"/);
});

test("media workspace uses one explicit selection control for review and quarantine actions", () => {
  const source = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));
  const dialogSource = readUtf8(new URL("../../components/admin/MediaBulkRemovalDialog.js", import.meta.url));
  const css = readUtf8(new URL("../../components/admin/admin-ui.module.css", import.meta.url));
  const pageSource = readUtf8(new URL("../../app/admin/(console)/entities/[entityType]/page.js", import.meta.url));

  assert.match(source, /selectedAssetIds/);
  assert.match(source, /mediaBulkActionBar/);
  assert.match(source, /\/api\/admin\/media\/library\/bulk-submit/);
  assert.match(source, /\/api\/admin\/media\/library\/bulk-removal/);
  assert.match(source, /selectedHiddenCount/);
  assert.match(source, /mediaBulkIconButton/);
  assert.match(source, /selectedAssetCount > 1/);
  assert.match(source, /Пометить выбранные медиа на удаление/);
  assert.match(dialogSource, /aria-modal="true"/);
  assert.match(dialogSource, /Окончательное удаление сейчас не выполняется/);
  assert.match(source, /item\.thumbnailUrl \|\| item\.previewUrl/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /decoding="async"/);
  assert.match(pageSource, /listMediaLibraryCards\(\{ includeBinaryProbe: false \}\)/);
  assert.match(source, /<article\s+key=\{item\.id\}/);
  assert.match(source, /className=\{styles\.mediaSelectMarker\}/);
  assert.match(source, /className=\{styles\.mediaLibraryCardOpen\}/);
  assert.doesNotMatch(source, /selectedDeleteIds|mediaDeleteMarker|handleBulkDeleteTestData/);
  assert.match(css, /\.mediaBulkActionBar\s*\{/);
  assert.match(css, /\.mediaBulkIconButton:focus-visible\s*\{/);
  assert.match(css, /\.mediaLibraryCardOpen:focus-visible\s*\{/);
  assert.match(css, /\.mediaInspectorDisclosure,\s*\.mediaInspectorNestedDisclosure\s*\{/);
});
