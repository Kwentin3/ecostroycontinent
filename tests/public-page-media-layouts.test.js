import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  LANDING_RENDER_SLOT_KEYS,
  getLandingRenderSlotAttributes
} from "../lib/landing-composition/visual-semantics.js";

const rendererPath = new URL("../components/public/PublicRenderers.js", import.meta.url);
const cssPath = new URL("../components/public/public-ui.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("public page renderers wire page media settings into hero and gallery presentation", () => {
  const source = readUtf8(rendererPath);

  assert.match(source, /normalizePageMediaSettings\(page\.mediaSettings,\s*page\.pageType\)/);
  assert.match(source, /showSplitHeroMedia/);
  assert.match(source, /galleryGrouping === "by_collection"/);
  assert.match(source, /heroLayout=\{mediaSettings\.heroLayout\}/);
  assert.match(source, /pageType=\{page\.pageType\}/);
});

test("public media captions use the visual contract slot across renderers", () => {
  const source = readUtf8(rendererPath);
  const css = readUtf8(cssPath);

  assert.deepEqual(
    getLandingRenderSlotAttributes(LANDING_RENDER_SLOT_KEYS.MEDIA_CAPTION),
    { "data-public-render-slot": "media-caption" }
  );
  assert.match(source, /LANDING_RENDER_SLOT_KEYS\.MEDIA_CAPTION/);
  assert.match(source, /MEDIA_CAPTION_SLOT_ATTRS/);
  assert.match(source, /visualSlot=\{LANDING_RENDER_SLOT_KEYS\.MEDIA_CAPTION\}/);
  assert.match(css, /\[data-public-render-slot="media-caption"\]\s*\{/);
  assert.match(css, /padding:\s*var\(--media-caption-padding\);/);
  assert.match(css, /overflow-wrap:\s*anywhere;/);
});

test("public page CSS exposes bounded hero and gallery layout presets", () => {
  const css = readUtf8(cssPath);

  assert.match(css, /\.heroSplit\s*\{/);
  assert.match(css, /\.mediaHeroLayoutCinematic\s*\{/);
  assert.match(css, /\.galleryLayoutFeatured\s*\{/);
  assert.match(css, /\.galleryLayoutStrip\s*\{/);
  assert.match(css, /\.galleryAspectPortrait\s+img\s*\{/);
  assert.match(css, /:global\(\[data-preview-device="mobile"\]\)\s+\.heroSplit/);
  assert.match(css, /:global\(\[data-preview-device="mobile"\]\)\s+\.heroSplitMedia\s+img/);
  assert.match(css, /:global\(\[data-preview-device="mobile"\]\)\s+\.publicShellHeader/);
  assert.match(css, /\.heroSplitMedia\s+img\s*\{\s*width:\s*100%;\s*max-width:\s*100%;/);
});
