import test from "node:test";
import assert from "node:assert/strict";

import { buildListCardMediaAssets } from "../lib/public-launch/list-card-media.js";

test("list card media keeps primary and gallery images compact and ordered", () => {
  const assets = buildListCardMediaAssets({
    item: {
      title: "Service title",
      primaryMediaAssetId: "media_primary",
      galleryIds: ["gallery_1", "gallery_2"]
    },
    resolveMedia: (id) => ({
      entityId: id,
      previewUrl: `/api/media-public/${id}`,
      alt: "Primary alt"
    }),
    resolveGallery: (id) => ({
      entityId: id,
      assets: id === "gallery_1"
        ? [
            { entityId: "gallery_asset_1", previewUrl: "/api/media-public/gallery_asset_1", title: "Gallery title" },
            { entityId: "media_primary", previewUrl: "/api/media-public/media_primary", alt: "Duplicate primary" }
          ]
        : [
            { entityId: "gallery_asset_2", previewUrl: "/api/media-public/gallery_asset_2" }
          ]
    }),
    limit: 3
  });

  assert.deepEqual(
    assets.map((asset) => asset.entityId),
    ["media_primary", "gallery_asset_1", "gallery_asset_2"]
  );
  assert.equal(assets[0].alt, "Primary alt");
  assert.equal(assets[1].alt, "Gallery title");
  assert.equal(assets[2].alt, "Service title");
});

test("list card media ignores unresolved or unpublished references from the resolver boundary", () => {
  const assets = buildListCardMediaAssets({
    item: {
      title: "Service title",
      primaryMediaAssetId: "draft_media",
      galleryIds: ["published_gallery", "draft_gallery"]
    },
    resolveMedia: () => null,
    resolveGallery: (id) => id === "published_gallery"
      ? {
          entityId: id,
          assets: [
            { entityId: "asset_without_preview" },
            { entityId: "published_asset", previewUrl: "/api/media-public/published_asset" }
          ]
        }
      : null
  });

  assert.deepEqual(assets, [
    {
      entityId: "published_asset",
      previewUrl: "/api/media-public/published_asset",
      alt: "Service title"
    }
  ]);
});

test("list card media can use published linked equipment primary images as compact visual proof", () => {
  const assets = buildListCardMediaAssets({
    item: {
      title: "Service title",
      equipmentIds: ["equipment_1", "equipment_2", "draft_equipment"]
    },
    resolveEquipment: (id) => ({
      entityId: id,
      primaryMediaAssetId: id === "draft_equipment" ? "draft_media" : `${id}_media`
    }),
    resolveMedia: (id) => id === "draft_media"
      ? null
      : {
          entityId: id,
          previewUrl: `/api/media-public/${id}`,
          title: `Media ${id}`
        }
  });

  assert.deepEqual(
    assets.map((asset) => asset.entityId),
    ["equipment_1_media", "equipment_2_media"]
  );
});

test("list card media collects service, equipment and case gallery media without a default cap", () => {
  const assets = buildListCardMediaAssets({
    item: {
      title: "Service title",
      primaryMediaAssetId: "service_primary",
      galleryIds: ["service_gallery"],
      equipmentIds: ["equipment_1"],
      relatedCaseIds: ["case_1"]
    },
    resolveMedia: (id) => ({
      entityId: id,
      previewUrl: `/api/media-public/${id}`,
      title: id
    }),
    resolveGallery: (id) => ({
      entityId: id,
      assets: [
        { entityId: `${id}_asset_1`, previewUrl: `/api/media-public/${id}_asset_1` },
        { entityId: `${id}_asset_2`, previewUrl: `/api/media-public/${id}_asset_2` }
      ]
    }),
    resolveEquipment: () => ({
      title: "Equipment title",
      primaryMediaAssetId: "equipment_primary",
      galleryIds: ["equipment_gallery"]
    }),
    resolveCase: () => ({
      title: "Case title",
      primaryMediaAssetId: "case_primary",
      galleryIds: ["case_gallery"]
    })
  });

  assert.deepEqual(
    assets.map((asset) => asset.entityId),
    [
      "service_primary",
      "service_gallery_asset_1",
      "service_gallery_asset_2",
      "equipment_primary",
      "equipment_gallery_asset_1",
      "equipment_gallery_asset_2",
      "case_primary",
      "case_gallery_asset_1",
      "case_gallery_asset_2"
    ]
  );
});

test("list card media respects the compact card limit", () => {
  const assets = buildListCardMediaAssets({
    item: {
      title: "Service title",
      galleryIds: ["gallery_1"]
    },
    resolveGallery: () => ({
      assets: [
        { entityId: "asset_1", previewUrl: "/asset-1.jpg" },
        { entityId: "asset_2", previewUrl: "/asset-2.jpg" },
        { entityId: "asset_3", previewUrl: "/asset-3.jpg" },
        { entityId: "asset_4", previewUrl: "/asset-4.jpg" }
      ]
    }),
    limit: 2
  });

  assert.deepEqual(
    assets.map((asset) => asset.entityId),
    ["asset_1", "asset_2"]
  );
});
