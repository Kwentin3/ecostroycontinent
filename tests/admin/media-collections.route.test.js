import test from "node:test";
import assert from "node:assert/strict";

import { POST as createCollection } from "../../app/api/admin/media/collections/create/route.js";
import { POST as updateCollection } from "../../app/api/admin/media/collections/[entityId]/route.js";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
    } else if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/media/collections/create", {
    method: "POST",
    body: formData
  });
}

test("collection create route saves draft without publishing by default", async () => {
  let publishCalled = false;
  let capturedSave = null;

  const response = await createCollection(
    buildRequest({
      title: "Фасады",
      primaryAssetId: "media_1",
      assetIds: ["media_1"]
    }),
    null,
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      userCanPublishEntity: () => true,
      saveDraft: async (input) => {
        capturedSave = input;
        return {
          entity: { id: "gallery_1" },
          revision: { id: "rev_gallery_draft" }
        };
      },
      publishGalleryCollectionRevision: async () => {
        publishCalled = true;
      },
      getCollectionLibraryCard: async () => ({ id: "gallery_1", statusKey: "draft" }),
      getMediaLibraryCardsByIds: async () => [{ id: "media_1" }],
      revalidatePath: () => {
        throw new Error("revalidatePath should not run for draft save.");
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.published, false);
  assert.equal(publishCalled, false);
  assert.equal(capturedSave.entityType, ENTITY_TYPES.GALLERY);
  assert.equal(capturedSave.payload.primaryAssetId, "media_1");
});

test("collection create route publishes explicitly requested ready collection", async () => {
  const revalidated = [];
  let publishInput = null;

  const response = await createCollection(
    buildRequest({
      title: "Фасады",
      primaryAssetId: "media_1",
      assetIds: ["media_1"],
      publicationIntent: "publish"
    }),
    null,
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      userCanPublishEntity: (user, entityType) => user.role === "seo_manager" && entityType === ENTITY_TYPES.GALLERY,
      saveDraft: async () => ({
        entity: { id: "gallery_1" },
        revision: { id: "rev_gallery_draft" }
      }),
      publishGalleryCollectionRevision: async (input) => {
        publishInput = input;
        return {
          entity: { id: "gallery_1", entityType: ENTITY_TYPES.GALLERY },
          revision: { id: "rev_gallery_draft", state: "published" },
          publishFollowUp: { revalidationPaths: ["/", "/sitemap.xml"] }
        };
      },
      getCollectionLibraryCard: async () => ({ id: "gallery_1", statusKey: "published" }),
      getMediaLibraryCardsByIds: async () => [{ id: "media_1" }],
      revalidatePath: (path) => {
        revalidated.push(path);
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.published, true);
  assert.deepEqual(publishInput, {
    revisionId: "rev_gallery_draft",
    actorUserId: "user_seo"
  });
  assert.deepEqual(revalidated, ["/", "/sitemap.xml"]);
});

test("collection update route blocks explicit publish when role cannot publish gallery", async () => {
  let saved = false;

  const response = await updateCollection(
    buildRequest({
      title: "Фасады",
      primaryAssetId: "media_1",
      assetIds: ["media_1"],
      publicationIntent: "publish"
    }),
    { params: { entityId: "gallery_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "business_owner" }, response: null }),
      userCanEditContent: () => true,
      userCanPublishEntity: () => false,
      getEntityEditorState: async () => ({
        entity: { id: "gallery_1", entityType: ENTITY_TYPES.GALLERY },
        revisions: [{ id: "rev_gallery_draft", payload: { title: "Old", assetIds: [] } }]
      }),
      saveDraft: async () => {
        saved = true;
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.ok, false);
  assert.equal(saved, false);
});

test("collection update route returns a terminal 400 when direct publish readiness blocks", async () => {
  const blocked = new Error("Публикация коллекции заблокирована проверкой готовности.");
  blocked.code = "COLLECTION_PUBLISH_BLOCKED";

  const response = await updateCollection(
    buildRequest({
      title: "Фасады",
      primaryAssetId: "media_1",
      assetIds: ["media_1"],
      publicationIntent: "publish"
    }),
    { params: { entityId: "gallery_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      userCanPublishEntity: () => true,
      getEntityEditorState: async () => ({
        entity: { id: "gallery_1", entityType: ENTITY_TYPES.GALLERY },
        revisions: [{ id: "rev_previous", payload: { title: "Old", assetIds: [] } }]
      }),
      saveDraft: async () => ({
        entity: { id: "gallery_1" },
        revision: { id: "rev_gallery_draft" }
      }),
      publishGalleryCollectionRevision: async () => {
        throw blocked;
      },
      getCollectionLibraryCard: async () => {
        throw new Error("collection card should not be loaded after publish failure.");
      },
      getMediaLibraryCardsByIds: async () => [],
      revalidatePath: () => {
        throw new Error("revalidatePath should not run after publish failure.");
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.match(payload.error, /Публикация коллекции заблокирована/);
});
