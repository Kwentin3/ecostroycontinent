import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPagePreviewContext,
  serializePagePreviewLookupRecords
} from "../../lib/admin/page-preview.js";

test("page preview contract overlays latest media over published preview records", () => {
  const previewLookupRecords = serializePagePreviewLookupRecords({
    publishedLookupRecords: {
      media: {
        media_hero: {
          entityId: "media_hero",
          title: "Published hero",
          previewUrl: "/published/hero.jpg"
        }
      }
    },
    media: [
      {
        id: "media_hero",
        title: "Draft hero",
        previewUrl: "/draft/hero.jpg"
      }
    ]
  });
  const previewContext = buildPagePreviewContext({
    globalSettings: {
      publicBrandName: "Test"
    },
    previewLookupRecords
  });

  assert.equal(previewContext.lookupResolvers.media("media_hero")?.previewUrl, "/draft/hero.jpg");
});

test("page preview contract rebuilds gallery assets from the merged media context", () => {
  const previewLookupRecords = serializePagePreviewLookupRecords({
    galleries: [
      {
        entityId: "gallery_alpha",
        title: "Alpha gallery",
        assetIds: ["media_hero"]
      }
    ],
    media: [
      {
        id: "media_hero",
        title: "Hero media",
        previewUrl: "/draft/hero.jpg"
      }
    ]
  });
  const previewContext = buildPagePreviewContext({
    globalSettings: {
      publicBrandName: "Test"
    },
    previewLookupRecords
  });
  const gallery = previewContext.lookupResolvers.galleries("gallery_alpha");

  assert.equal(gallery?.assets?.length, 1);
  assert.equal(gallery?.assets?.[0]?.previewUrl, "/draft/hero.jpg");
});
