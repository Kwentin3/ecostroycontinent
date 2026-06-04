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
  assert.match(source, /mediaBulkActionBar/);
  assert.match(source, /Дополнительно/);
  assert.equal((source.match(/Проверить удаление \(legacy\)/g) || []).length, 1);
  assert.equal((source.match(/Служебные действия/g) || []).length, 0);
  assert.match(css, /\.mediaToolbarFieldRow,\s*\.mediaToolbarPrimaryActions\s*\{/);
  assert.match(css, /\.mediaBulkActionBar\s*\{/);
  assert.doesNotMatch(css, /\.mediaToolbarServiceDisclosure\s*\{/);
});

test("media collection overlay demotes cleanup controls behind a service disclosure", () => {
  const source = readUtf8("components/admin/MediaCollectionOverlay.js");

  assert.match(source, /Служебные действия/);
  assert.match(source, /Очистка и редкие lifecycle-операции остаются доступны/);
  assert.match(source, /Центр очистки/);
  assert.match(source, /getRemovalMarkHref\("gallery"/);
});

test("page registry create modal keeps the fallback route secondary", () => {
  const source = readUtf8("components/admin/PageRegistryClient.js");
  const css = readUtf8("components/admin/PageRegistryClient.module.css");

  assert.match(source, /createServiceDisclosure/);
  assert.match(source, /Служебно/);
  assert.match(source, /Открыть резервный маршрут/);
  assert.doesNotMatch(source, /Полный fallback-маршрут/);
  assert.match(css, /\.createServiceDisclosure\s*\{/);
  assert.match(css, /\.createServiceBody\s*\{/);
});

test("review queue starts with one compact filter toolbar before the gallery", () => {
  const source = readUtf8("app/admin/(console)/review/page.js");

  assert.match(source, /aria-label="Фильтры проверки"/);
  assert.match(source, /reviewGalleryToolbar/);
  assert.match(source, /reviewFilterSearch/);
  assert.match(source, /reviewGalleryResultCount/);
  assert.doesNotMatch(source, /В очереди остаются только материалы, по которым еще нужно решение или возврат/);
  assert.doesNotMatch(source, /Как устроена очередь/);
  assert.doesNotMatch(source, /После согласования карточка уходит из review-очереди/);
});
