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
  assert.match(overlaySource, /collectionRailGroup/);
  assert.match(overlaySource, /collectionOverlayMain/);
  assert.match(overlaySource, /collectionMembershipHint/);
  assert.match(overlaySource, /showSelectedOnly/);
  assert.match(overlaySource, /selectedCollection\?\.publishedRevisionNumber/);
  assert.match(overlaySource, /Сохранить и опубликовать/);
  assert.match(overlaySource, /Сохранить черновик/);
  assert.match(overlaySource, /Галочка означает членство в коллекции/);
  assert.match(overlaySource, /В составе есть неопубликованные медиафайлы/);
  assert.match(overlaySource, /Сбросить фильтр кандидатов/);
  assert.match(overlaySource, /Описание и SEO/);
  assert.doesNotMatch(overlaySource, /RelationChipRow/);
  assert.doesNotMatch(overlaySource, /title="Выбранные файлы"/);
  assert.match(workspaceSource, /formData\.set\("publicationIntent", publish \? "publish" : "draft"\)/);
});
