import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../../app/api/admin/media/[entityId]/preview/route.js";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  collectReviewMediaReferences,
  mediaAssetIsVisibleInReviewQueue
} from "../../lib/admin/review-media-access.js";
import { userCanReadAdminMediaPreview } from "../../lib/auth/roles.js";

function reviewItem(entityType, entityId, payload) {
  return {
    entityId,
    entityType,
    revision: {
      payload
    }
  };
}

function galleryState(payload) {
  return {
    entity: {
      entityType: ENTITY_TYPES.GALLERY
    },
    revisions: [
      {
        payload
      }
    ],
    activePublishedRevision: null
  };
}

function mediaEditorState(payload = {}) {
  return {
    entity: {
      entityType: ENTITY_TYPES.MEDIA_ASSET
    },
    revisions: [
      {
        id: "rev_media_preview",
        payload: {
          storageKey: "media/review-photo.jpg",
          mimeType: "image/jpeg",
          ...payload
        }
      }
    ],
    activePublishedRevision: null
  };
}

test("review media access collector finds direct, nested, and gallery references", () => {
  const refs = collectReviewMediaReferences({
    primaryMediaAssetId: "media_primary",
    blocks: [
      { type: "gallery", galleryIds: ["gallery_1"] },
      { mediaAssetIds: ["media_nested"] }
    ]
  });

  assert.deepEqual([...refs.mediaIds].sort(), ["media_nested", "media_primary"]);
  assert.deepEqual([...refs.galleryIds], ["gallery_1"]);
});

test("business owner media preview access stays scoped to review queue references", async () => {
  const queue = [
    reviewItem(ENTITY_TYPES.MEDIA_ASSET, "media_direct", { storageKey: "media/direct.jpg" }),
    reviewItem(ENTITY_TYPES.SERVICE, "service_1", { primaryMediaAssetId: "media_primary" }),
    reviewItem(ENTITY_TYPES.PAGE, "page_1", { blocks: [{ galleryIds: ["gallery_1"] }] })
  ];
  const deps = {
    getReviewQueue: async () => queue,
    getEntityEditorState: async (entityId) => {
      if (entityId === "gallery_1") {
        return galleryState({ assetIds: ["media_gallery"] });
      }

      return { entity: null, revisions: [], activePublishedRevision: null };
    }
  };

  assert.equal(await mediaAssetIsVisibleInReviewQueue("media_direct", deps), true);
  assert.equal(await mediaAssetIsVisibleInReviewQueue("media_primary", deps), true);
  assert.equal(await mediaAssetIsVisibleInReviewQueue("media_gallery", deps), true);
  assert.equal(await mediaAssetIsVisibleInReviewQueue("media_unrelated", deps), false);
});

test("admin media preview route lets review users read only review-scoped media", async () => {
  const response = await GET(
    new Request("http://localhost/api/admin/media/media_review/preview"),
    { params: Promise.resolve({ entityId: "media_review" }) },
    {
      requireRouteUser: async () => ({ user: { id: "owner_1", role: "business_owner" }, response: null }),
      userCanEditContent: () => false,
      userCanReadAdminMediaPreview,
      userCanReview: () => true,
      mediaAssetIsVisibleInReviewQueue: async (entityId) => entityId === "media_review",
      getEntityEditorState: async () => mediaEditorState(),
      readMediaFile: async () => Buffer.from("image-bytes")
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("cache-control"), "private, max-age=300");
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.equal(response.headers.get("etag"), "\"rev_media_preview\"");
  assert.equal(await response.text(), "image-bytes");
});

test("admin media preview route returns a terminal private-cache 304 before reading storage", async () => {
  let storageRead = false;
  const response = await GET(
    new Request("http://localhost/api/admin/media/media_editor/preview", {
      headers: {
        "if-none-match": "\"rev_media_preview\""
      }
    }),
    { params: Promise.resolve({ entityId: "media_editor" }) },
    {
      requireRouteUser: async () => ({ user: { id: "seo_1", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      userCanReadAdminMediaPreview,
      userCanReview: () => false,
      mediaAssetIsVisibleInReviewQueue: async () => {
        throw new Error("editor preview should not depend on review queue lookup");
      },
      getEntityEditorState: async () => mediaEditorState(),
      readMediaFile: async () => {
        storageRead = true;
        return Buffer.from("editor-image");
      }
    }
  );

  assert.equal(response.status, 304);
  assert.equal(response.headers.get("cache-control"), "private, max-age=300");
  assert.equal(response.headers.get("etag"), "\"rev_media_preview\"");
  assert.equal(storageRead, false);
});

test("admin media preview route hides unrelated media from review-only users", async () => {
  let editorStateLoaded = false;
  const response = await GET(
    new Request("http://localhost/api/admin/media/media_private/preview"),
    { params: Promise.resolve({ entityId: "media_private" }) },
    {
      requireRouteUser: async () => ({ user: { id: "owner_1", role: "business_owner" }, response: null }),
      userCanEditContent: () => false,
      userCanReadAdminMediaPreview,
      userCanReview: () => true,
      mediaAssetIsVisibleInReviewQueue: async () => false,
      getEntityEditorState: async () => {
        editorStateLoaded = true;
        return mediaEditorState();
      },
      readMediaFile: async () => Buffer.from("image-bytes")
    }
  );

  assert.equal(response.status, 404);
  assert.equal(editorStateLoaded, false);
});

test("admin media preview route keeps editor access independent from review queue scope", async () => {
  const response = await GET(
    new Request("http://localhost/api/admin/media/media_editor/preview"),
    { params: Promise.resolve({ entityId: "media_editor" }) },
    {
      requireRouteUser: async () => ({ user: { id: "seo_1", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      userCanReadAdminMediaPreview,
      userCanReview: () => false,
      mediaAssetIsVisibleInReviewQueue: async () => {
        throw new Error("editor preview should not depend on review queue lookup");
      },
      getEntityEditorState: async () => mediaEditorState(),
      readMediaFile: async () => Buffer.from("editor-image")
    }
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "editor-image");
});
