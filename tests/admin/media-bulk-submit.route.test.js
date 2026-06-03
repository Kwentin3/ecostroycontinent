import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/media/library/bulk-submit/route.js";
import { submitMediaAssetsForReview } from "../../lib/admin/media-bulk-review.js";

function buildRequest(entityIds = []) {
  const formData = new FormData();

  for (const entityId of entityIds) {
    formData.append("entityId", entityId);
  }

  return new Request("http://localhost/api/admin/media/library/bulk-submit", {
    method: "POST",
    body: formData
  });
}

function buildDeps({ canEdit = true, submitResult = null } = {}) {
  return {
    requireRouteUser: async () => ({
      user: {
        id: "user_1",
        role: "seo_manager"
      },
      response: null
    }),
    userCanEditContent: () => canEdit,
    submitMediaAssetsForReview: async (input) => {
      if (submitResult) {
        return submitResult(input);
      }

      return {
        requestedIds: input.assetIds,
        submittedIds: input.assetIds,
        submittedItems: input.assetIds.map((id) => ({ id, statusKey: "review" })),
        skipped: [],
        failed: [],
        submittedCount: input.assetIds.length,
        skippedCount: 0,
        failedCount: 0
      };
    }
  };
}

test("bulk media submit route returns updated items for selected media", async () => {
  const response = await POST(
    buildRequest(["media_1", "media_2"]),
    {},
    buildDeps()
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.submittedIds, ["media_1", "media_2"]);
  assert.deepEqual(payload.items.map((item) => item.statusKey), ["review", "review"]);
  assert.equal(payload.failed.length, 0);
});

test("bulk media submit route reports partial failures without hiding submitted items", async () => {
  const response = await POST(
    buildRequest(["media_1", "media_2", "media_3"]),
    {},
    buildDeps({
      submitResult: async (input) => ({
        requestedIds: input.assetIds,
        submittedIds: ["media_1"],
        submittedItems: [{ id: "media_1", statusKey: "review" }],
        skipped: [{ id: "media_2", title: "Published", reason: "На проверку можно отправить только черновик." }],
        failed: [{ id: "media_3", title: "Broken", reason: "Сломанные связи не позволяют отправить версию на проверку." }],
        submittedCount: 1,
        skippedCount: 1,
        failedCount: 1
      })
    })
  );
  const payload = await response.json();

  assert.equal(response.status, 207);
  assert.equal(payload.ok, false);
  assert.deepEqual(payload.submittedIds, ["media_1"]);
  assert.equal(payload.skipped[0].id, "media_2");
  assert.equal(payload.failed[0].id, "media_3");
  assert.match(payload.error, /С ошибкой: 1/);
});

test("bulk media submit route rejects empty selection", async () => {
  const response = await POST(
    buildRequest([]),
    {},
    buildDeps()
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Сначала выберите медиафайлы.");
});

test("bulk media submit route enforces content edit permission", async () => {
  const response = await POST(
    buildRequest(["media_1"]),
    {},
    buildDeps({ canEdit: false })
  );
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Недостаточно прав для отправки медиа на проверку.");
});

test("submitMediaAssetsForReview submits only draft media and returns refreshed cards", async () => {
  const submittedRevisionIds = [];
  const cards = new Map([
    ["media_1", { id: "media_1", title: "Draft", currentRevisionId: "rev_1", statusKey: "draft" }],
    ["media_2", { id: "media_2", title: "Published", currentRevisionId: "rev_2", statusKey: "published" }]
  ]);

  const result = await submitMediaAssetsForReview({
    assetIds: ["media_1", "media_2", "media_missing", "media_1"],
    actorUserId: "user_1",
    getMediaLibraryCardsByIdsImpl: async (ids) => ids.map((id) => cards.get(id)).filter(Boolean).map((item) => (
      submittedRevisionIds.includes(item.currentRevisionId)
        ? { ...item, statusKey: "review" }
        : item
    )),
    submitRevisionForReviewImpl: async ({ revisionId }) => {
      submittedRevisionIds.push(revisionId);
      return { revision: { id: revisionId, state: "review" } };
    }
  });

  assert.deepEqual(result.requestedIds, ["media_1", "media_2", "media_missing"]);
  assert.deepEqual(submittedRevisionIds, ["rev_1"]);
  assert.deepEqual(result.submittedIds, ["media_1"]);
  assert.equal(result.submittedItems[0].statusKey, "review");
  assert.equal(result.skipped.length, 2);
  assert.equal(result.failed.length, 0);
});
