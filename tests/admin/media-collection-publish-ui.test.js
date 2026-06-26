import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("collection overlay exposes draft save and explicit direct publish workflow", () => {
  const overlaySource = readUtf8(new URL("../../components/admin/MediaCollectionOverlay.js", import.meta.url));
  const workspaceSource = readUtf8(new URL("../../components/admin/MediaGalleryWorkspace.js", import.meta.url));

  assert.match(overlaySource, /buildCollectionPublishReadiness/);
  assert.match(overlaySource, /assetHasPublishedRevision/);
  assert.match(overlaySource, /MEDIA_COLLECTION_CANDIDATE_FILTERS/);
  assert.match(overlaySource, /matchesMediaCollectionCandidateFilter/);
  assert.match(overlaySource, /collectionActionRail/);
  assert.match(overlaySource, /collectionOverlayMain/);
  assert.match(overlaySource, /selectedCollection\?\.publishedRevisionNumber/);
  assert.match(overlaySource, /Сохранить и опубликовать/);
  assert.match(overlaySource, /Сохранить черновик/);
  assert.match(overlaySource, /Публикация пока недоступна/);
  assert.match(overlaySource, /В составе есть неопубликованные медиафайлы/);
  assert.match(overlaySource, /Сбросить фильтр кандидатов/);
  assert.match(overlaySource, /После публикации её можно выбирать/);
  assert.match(workspaceSource, /formData\.set\("publicationIntent", publish \? "publish" : "draft"\)/);
});
