import test from "node:test";
import assert from "node:assert/strict";

import {
  COLLECTION_FILTER_ALL,
  COLLECTION_FILTER_ORPHAN,
  matchesCollectionFilter
} from "../lib/admin/media-gallery-filters.js";

test("matchesCollectionFilter keeps all items when filter is empty", () => {
  const item = {
    collectionEntries: [{ id: "collection-a", title: "Фасады" }]
  };

  assert.equal(matchesCollectionFilter(item, COLLECTION_FILTER_ALL), true);
});

test("matchesCollectionFilter finds orphan cards via explicit orphan sentinel", () => {
  assert.equal(matchesCollectionFilter({ collectionEntries: [] }, COLLECTION_FILTER_ORPHAN), true);
  assert.equal(
    matchesCollectionFilter(
      { collectionEntries: [{ id: "collection-a", title: "Фасады" }] },
      COLLECTION_FILTER_ORPHAN
    ),
    false
  );
});

test("matchesCollectionFilter narrows items to a chosen collection id", () => {
  const item = {
    collectionEntries: [
      { id: "collection-a", title: "Фасады" },
      { id: "collection-b", title: "Крыши" }
    ]
  };

  assert.equal(matchesCollectionFilter(item, "collection-a"), true);
  assert.equal(matchesCollectionFilter(item, "collection-c"), false);
});
