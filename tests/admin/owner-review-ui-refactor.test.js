import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reviewPagePath = new URL("../../app/admin/(console)/review/page.js", import.meta.url);
const reviewDetailPath = new URL("../../app/admin/(console)/review/[revisionId]/page.js", import.meta.url);
const cssPath = new URL("../../components/admin/admin-ui.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("review landing is gallery-first with modal detail instead of hero and diff-first flow", () => {
  const source = readUtf8(reviewPagePath);
  const css = readUtf8(cssPath);

  assert.match(source, /buildOwnerReviewGalleryCards/);
  assert.match(source, /buildOwnerReviewModalModel/);
  assert.match(source, /OwnerReviewDialog/);
  assert.match(source, /selectedRevisionId/);
  assert.match(source, /styles\.reviewGalleryGrid/);
  assert.match(source, /styles\.reviewGalleryCard/);
  assert.match(source, /styles\.reviewGalleryStatusFilters/);
  assert.match(source, /styles\.reviewModalLayout/);
  assert.match(source, /renderPagePreview/);
  assert.match(source, /renderPageGalleryCardPreview/);
  assert.match(source, /pagePreviewStyles\.preview/);
  assert.doesNotMatch(source, /RevisionDiffPanel/);
  assert.doesNotMatch(source, /styles\.reviewGalleryHeader/);
  assert.doesNotMatch(source, /<table className=\{styles\.table\}/);

  assert.match(css, /\.reviewGalleryGrid\s*\{/);
  assert.match(css, /\.reviewGalleryAttentionMark\s*\{/);
  assert.match(css, /\.reviewModalLayout\s*\{/);
  assert.match(css, /\.reviewModalEntityCard\s*\{/);
});

test("review detail route now redirects back into gallery modal state", () => {
  const source = readUtf8(reviewDetailPath);

  assert.match(source, /redirect\(buildReviewRedirectUrl\(revisionId, query\)\)/);
  assert.match(source, /params\.set\("selected", revisionId\)/);
  assert.match(source, /params\.set\("preview", query\.preview\)/);
  assert.doesNotMatch(source, /PreviewViewport/);
  assert.doesNotMatch(source, /RevisionDiffPanel/);
});
