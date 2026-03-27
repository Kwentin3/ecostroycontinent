import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCollectionDraftInput,
  buildCollectionDraftInputWithAssetMembership
} from "../lib/admin/media-collections.js";

test("buildCollectionDraftInput preserves existing gallery-only fields while updating visible collection fields", () => {
  const payload = buildCollectionDraftInput({
    fields: {
      title: "Фасады и утепление",
      caption: "Собранная подборка",
      assetIds: ["asset-1", "asset-2", "asset-1"],
      primaryAssetId: "asset-2"
    },
    currentPayload: {
      relatedEntityIds: ["service-1"],
      seo: {
        metaTitle: "Старый SEO title",
        indexationFlag: "noindex",
        openGraphImageAssetId: "asset-3"
      }
    }
  });

  assert.equal(payload.title, "Фасады и утепление");
  assert.deepEqual(payload.assetIds, ["asset-1", "asset-2"]);
  assert.equal(payload.primaryAssetId, "asset-2");
  assert.deepEqual(payload.relatedEntityIds, ["service-1"]);
  assert.equal(payload.metaTitle, "Старый SEO title");
  assert.equal(payload.indexationFlag, "noindex");
  assert.equal(payload.openGraphImageAssetId, "asset-3");
});

test("buildCollectionDraftInput clears invalid primary asset and falls back to a safe title", () => {
  const payload = buildCollectionDraftInput({
    fields: {
      title: "",
      assetIds: ["asset-7"],
      primaryAssetId: "asset-404"
    },
    fallbackTitle: "Новая коллекция"
  });

  assert.equal(payload.title, "Новая коллекция");
  assert.deepEqual(payload.assetIds, ["asset-7"]);
  assert.equal(payload.primaryAssetId, "");
  assert.equal(payload.indexationFlag, "index");
});

test("buildCollectionDraftInputWithAssetMembership adds the asset and preserves current primary asset", () => {
  const payload = buildCollectionDraftInputWithAssetMembership({
    currentPayload: {
      title: "Фасады",
      caption: "Подборка",
      assetIds: ["asset-1"],
      primaryAssetId: "asset-1"
    },
    assetId: "asset-7",
    includeAsset: true
  });

  assert.deepEqual(payload.assetIds, ["asset-1", "asset-7"]);
  assert.equal(payload.primaryAssetId, "asset-1");
});

test("buildCollectionDraftInputWithAssetMembership removes the asset and clears invalid primary asset", () => {
  const payload = buildCollectionDraftInputWithAssetMembership({
    currentPayload: {
      title: "Фасады",
      assetIds: ["asset-1", "asset-7"],
      primaryAssetId: "asset-7"
    },
    assetId: "asset-7",
    includeAsset: false
  });

  assert.deepEqual(payload.assetIds, ["asset-1"]);
  assert.equal(payload.primaryAssetId, "");
});
