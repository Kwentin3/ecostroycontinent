import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rendererPath = new URL("../components/public/PublicRenderers.js", import.meta.url);
const cssPath = new URL("../components/public/public-ui.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("public page renderers wire page media settings into hero and gallery presentation", () => {
  const source = readUtf8(rendererPath);

  assert.match(source, /normalizePageMediaSettings\(page\.mediaSettings\)/);
  assert.match(source, /showSplitHeroMedia/);
  assert.match(source, /galleryGrouping === "by_collection"/);
  assert.match(source, /heroLayout=\{mediaSettings\.heroLayout\}/);
});

test("public page CSS exposes bounded hero and gallery layout presets", () => {
  const css = readUtf8(cssPath);

  assert.match(css, /\.heroSplit\s*\{/);
  assert.match(css, /\.mediaHeroLayoutCinematic\s*\{/);
  assert.match(css, /\.galleryLayoutFeatured\s*\{/);
  assert.match(css, /\.galleryLayoutStrip\s*\{/);
  assert.match(css, /\.galleryAspectPortrait\s+img\s*\{/);
});
