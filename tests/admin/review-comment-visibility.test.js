import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getVisibleReviewComment } from "../../lib/admin/review-comments.js";

function readUtf8(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("review comments are visible to editors only while the revision is a draft", () => {
  assert.equal(
    getVisibleReviewComment({
      state: "draft",
      reviewComment: "  Нужно уточнить формулировку услуги.  "
    }),
    "Нужно уточнить формулировку услуги."
  );
  assert.equal(
    getVisibleReviewComment({
      state: "review",
      reviewComment: "Старое замечание"
    }),
    ""
  );
  assert.equal(getVisibleReviewComment({ state: "draft", reviewComment: "" }), "");
});

test("SEO editing surfaces render returned review comments without a new storage domain", () => {
  const genericEditorSource = readUtf8("components/admin/EntityEditorForm.js");
  const pageWorkspaceSource = readUtf8("components/admin/PageWorkspaceScreen.js");
  const mediaWorkspaceSource = readUtf8("components/admin/MediaGalleryWorkspace.js");
  const mediaReadModelSource = readUtf8("lib/admin/media-gallery.js");

  assert.match(genericEditorSource, /getVisibleReviewComment\(currentRevision\)/);
  assert.match(pageWorkspaceSource, /getVisibleReviewComment\(revision\)/);
  assert.match(mediaWorkspaceSource, /getVisibleReviewComment\(\{\s*state: item\.statusKey,\s*reviewComment: item\.reviewComment\s*\}\)/);
  assert.match(mediaReadModelSource, /reviewComment: latestRevision\?\.reviewComment \?\? ""/);
});
