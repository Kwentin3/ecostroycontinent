import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentPath = new URL("../../components/admin/PageRegistryClient.js", import.meta.url);
const cssPath = new URL("../../components/admin/PageRegistryClient.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("page registry keeps compact stats and page-owned preview scaffolding", () => {
  const source = readUtf8(componentPath);
  const css = readUtf8(cssPath);

  assert.match(source, /summary = null/);
  assert.match(source, /registryStats = useMemo/);
  assert.match(source, /styles\.statsRow/);
  assert.match(source, /renderPageCardPreview/);
  assert.match(source, /styles\.pagePreviewFrame/);
  assert.match(css, /\.statsRow\s*\{/);
  assert.match(css, /\.pagePreviewFrame\s*\{/);
  assert.match(css, /\.previewThemeSand\s*\{/);
});

test("page registry preview copy no longer depends on raw media thumbnails alone", () => {
  const source = readUtf8(componentPath);

  assert.match(source, /previewTitle/);
  assert.match(source, /previewIntro/);
  assert.doesNotMatch(source, /<img[^>]+record\.previewMediaUrl/);
});

test("page registry card overlay does not block opening the page card", () => {
  const css = readUtf8(cssPath);

  assert.match(css, /\.cardLink\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/);
  assert.match(css, /\.preview,\s*\.cardHead,\s*\.badge\s*\{[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /\.menuWrap\s*\{[\s\S]*z-index:\s*1;[\s\S]*pointer-events:\s*auto;/);
});
