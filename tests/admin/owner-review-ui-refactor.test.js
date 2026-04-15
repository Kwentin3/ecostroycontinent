import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reviewPagePath = new URL("../../app/admin/(console)/review/page.js", import.meta.url);
const reviewDetailPath = new URL("../../app/admin/(console)/review/[revisionId]/page.js", import.meta.url);
const cssPath = new URL("../../components/admin/admin-ui.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("review landing is gallery-first instead of queue-table-first", () => {
  const source = readUtf8(reviewPagePath);
  const css = readUtf8(cssPath);

  assert.match(source, /buildOwnerReviewGalleryCards/);
  assert.match(source, /filterOwnerReviewGalleryCards/);
  assert.match(source, /styles\.reviewGalleryGrid/);
  assert.match(source, /styles\.reviewGalleryCard/);
  assert.match(source, /styles\.reviewGalleryStatusFilters/);
  assert.doesNotMatch(source, /<table className=\{styles\.table\}/);
  assert.match(css, /\.reviewGalleryGrid\s*\{/);
  assert.match(css, /\.reviewGalleryCard\s*\{/);
  assert.match(css, /\.reviewGalleryAttentionMark\s*\{/);
});

test("review detail keeps preview central and moves technical panels behind disclosure", () => {
  const source = readUtf8(reviewDetailPath);

  assert.match(source, /<PreviewViewport/);
  assert.match(source, /SurfacePacket\s*\n\s*eyebrow="Содержимое материала"/);
  assert.match(source, /title="Что изменилось"/);
  assert.match(source, /eyebrow="Решение собственника"/);
  assert.match(source, /<details className=\{styles\.compactDisclosure\}>/);
  assert.doesNotMatch(source, /styles\.split/);
  assert.doesNotMatch(source, /styles\.stickyPanel/);
});
