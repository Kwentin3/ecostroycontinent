import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/media/library/bulk-removal/route.js";
import {
  markEntityForRemovalWithAudit,
  markMediaAssetsForRemoval
} from "../../lib/admin/removal-marking.js";

function buildRequest(entityIds = []) {
  const formData = new FormData();

  for (const entityId of entityIds) {
    formData.append("entityId", entityId);
  }

  return new Request("http://localhost/api/admin/media/library/bulk-removal", {
    method: "POST",
    body: formData
  });
}

function buildRouteDeps({ canEdit = true, result = null } = {}) {
  return {
    requireRouteUser: async () => ({
      user: { id: "user_1", role: "seo_manager" },
      response: null
    }),
    userCanEditContent: () => canEdit,
    markMediaAssetsForRemoval: async (input) => result ?? {
      requestedIds: input.assetIds,
      markedIds: input.assetIds,
      alreadyMarkedIds: [],
      marks: input.assetIds.map((id) => ({ id, markedForRemovalAt: "2026-07-17T10:00:00.000Z" })),
      failed: [],
      markedCount: input.assetIds.length,
      alreadyMarkedCount: 0,
      failedCount: 0
    }
  };
}

test("canonical removal mark commits state and audit through the same transaction", async () => {
  const tx = { id: "tx_1" };
  const calls = [];

  const result = await markEntityForRemovalWithAudit({
    entityType: "media_asset",
    entityId: "media_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run(tx),
    findEntityById: async (entityId, db) => {
      calls.push(["find", entityId, db]);
      return { id: entityId, entityType: "media_asset", markedForRemovalAt: null };
    },
    markEntityForRemoval: async (entityId, actorUserId, note, db) => {
      calls.push(["mark", entityId, actorUserId, note, db]);
      return {
        id: entityId,
        entityType: "media_asset",
        markedForRemovalAt: "2026-07-17T10:00:00.000Z"
      };
    },
    recordAuditEvent: async (input, options) => {
      calls.push(["audit", input, options.db]);
    }
  });

  assert.equal(result.status, "marked");
  assert.equal(result.entity.markedForRemovalAt, "2026-07-17T10:00:00.000Z");
  assert.equal(calls[0][2], tx);
  assert.equal(calls[1][4], tx);
  assert.equal(calls[2][2], tx);
  assert.equal(calls[2][1].eventKey, "removal_marked");
  assert.equal(calls[2][1].actorUserId, "user_1");
});

test("canonical removal mark treats an existing quarantine mark as an idempotent terminal outcome", async () => {
  let mutationCalled = false;

  const result = await markEntityForRemovalWithAudit({
    entityType: "media_asset",
    entityId: "media_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ id: "tx_1" }),
    findEntityById: async () => ({
      id: "media_1",
      entityType: "media_asset",
      markedForRemovalAt: "2026-07-16T10:00:00.000Z"
    }),
    markEntityForRemoval: async () => {
      mutationCalled = true;
    },
    recordAuditEvent: async () => {
      mutationCalled = true;
    }
  });

  assert.equal(result.status, "already_marked");
  assert.equal(mutationCalled, false);
});

test("canonical removal mark handles a concurrent quarantine mark without duplicate audit", async () => {
  let lookupCount = 0;
  let auditCalled = false;

  const result = await markEntityForRemovalWithAudit({
    entityType: "media_asset",
    entityId: "media_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ id: "tx_1" }),
    findEntityById: async () => {
      lookupCount += 1;
      return {
        id: "media_1",
        entityType: "media_asset",
        markedForRemovalAt: lookupCount > 1 ? "2026-07-17T10:00:00.000Z" : null
      };
    },
    markEntityForRemoval: async () => null,
    recordAuditEvent: async () => {
      auditCalled = true;
    }
  });

  assert.equal(result.status, "already_marked");
  assert.equal(lookupCount, 2);
  assert.equal(auditCalled, false);
});

test("bulk removal marking deduplicates ids and reports partial terminal outcomes", async () => {
  const entities = new Map([
    ["media_1", { id: "media_1", entityType: "media_asset", markedForRemovalAt: null }],
    ["media_2", { id: "media_2", entityType: "media_asset", markedForRemovalAt: "2026-07-16T10:00:00.000Z" }],
    ["media_3", { id: "media_3", entityType: "media_asset", markedForRemovalAt: null }]
  ]);
  const auditedIds = [];

  const result = await markMediaAssetsForRemoval({
    assetIds: ["media_1", "media_2", "media_3", "media_1"],
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ id: "tx" }),
    findEntityById: async (entityId) => entities.get(entityId) ?? null,
    markEntityForRemoval: async (entityId) => {
      if (entityId === "media_3") {
        throw new Error("Конкурентное изменение карточки.");
      }

      return {
        ...entities.get(entityId),
        markedForRemovalAt: "2026-07-17T10:00:00.000Z"
      };
    },
    recordAuditEvent: async (input) => {
      auditedIds.push(input.entityId);
    }
  });

  assert.deepEqual(result.requestedIds, ["media_1", "media_2", "media_3"]);
  assert.deepEqual(result.markedIds, ["media_1"]);
  assert.deepEqual(result.alreadyMarkedIds, ["media_2"]);
  assert.deepEqual(result.failed, [{ id: "media_3", reason: "Конкурентное изменение карточки." }]);
  assert.deepEqual(auditedIds, ["media_1"]);
});

test("bulk removal route returns updated mark projections for selected media", async () => {
  const response = await POST(buildRequest(["media_1", "media_2"]), {}, buildRouteDeps());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.markedIds, ["media_1", "media_2"]);
  assert.equal(payload.marks[0].markedForRemovalAt, "2026-07-17T10:00:00.000Z");
  assert.equal(payload.failed.length, 0);
});

test("bulk removal route preserves successful marks when another item fails", async () => {
  const response = await POST(buildRequest(["media_1", "media_2"]), {}, buildRouteDeps({
    result: {
      requestedIds: ["media_1", "media_2"],
      markedIds: ["media_1"],
      alreadyMarkedIds: [],
      marks: [{ id: "media_1", markedForRemovalAt: "2026-07-17T10:00:00.000Z" }],
      failed: [{ id: "media_2", reason: "Карточка не найдена." }],
      markedCount: 1,
      alreadyMarkedCount: 0,
      failedCount: 1
    }
  }));
  const payload = await response.json();

  assert.equal(response.status, 207);
  assert.equal(payload.ok, false);
  assert.deepEqual(payload.markedIds, ["media_1"]);
  assert.equal(payload.failed[0].id, "media_2");
  assert.match(payload.error, /Не обработано: 1/);
});

test("bulk removal route rejects empty selection", async () => {
  const response = await POST(buildRequest([]), {}, buildRouteDeps());
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Сначала выберите медиафайлы.");
});

test("bulk removal route enforces content edit permission", async () => {
  const response = await POST(buildRequest(["media_1"]), {}, buildRouteDeps({ canEdit: false }));
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Недостаточно прав для пометки медиа на удаление.");
});
