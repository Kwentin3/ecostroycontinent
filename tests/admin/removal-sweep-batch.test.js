import test from "node:test";
import assert from "node:assert/strict";

import {
  executeRemovalSweepBatch,
  previewRemovalSweepBatch
} from "../../lib/admin/removal-sweep-batch.js";

function makeCard(entityId, title) {
  return {
    entity: {
      id: entityId,
      entityType: "service",
      markedForRemovalAt: "2026-07-17T10:00:00.000Z"
    },
    latestRevision: {
      id: `${entityId}_rev_1`,
      revisionNumber: 1,
      state: "draft",
      payload: { title }
    }
  };
}

function makePublishedPage(entityId, title, serviceIds) {
  return {
    entityId,
    revision: {
      id: `${entityId}_rev_pub`,
      revisionNumber: 1,
      state: "published",
      payload: { title, serviceIds }
    }
  };
}

function buildDeps() {
  const cards = [
    makeCard("service_ready_1", "Готовая услуга 1"),
    makeCard("service_ready_2", "Готовая услуга 2"),
    makeCard("service_blocked", "Заблокированная услуга")
  ];
  const cardById = new Map(cards.map((card) => [card.entity.id, card]));

  return {
    listEntityCards: async (entityType) => entityType === "service" ? cards : [],
    listPublishedCards: async (entityType) => entityType === "page"
      ? [makePublishedPage("page_live", "Главная страница", ["service_blocked"])]
      : [],
    getEntityAggregate: async (entityId) => {
      const card = cardById.get(entityId);

      return card ? {
        entity: {
          ...card.entity,
          activePublishedRevisionId: null
        },
        revisions: [card.latestRevision],
        activePublishedRevision: null
      } : null;
    },
    listPublishObligations: async () => [],
    findEntityById: async () => null
  };
}

test("batch preview deduplicates roots and separates ready groups from exact blockers", async () => {
  const result = await previewRemovalSweepBatch({
    roots: [
      { entityType: "service", entityId: "service_ready_1" },
      { entityType: "service", entityId: "service_ready_1" },
      { entityType: "service", entityId: "service_blocked" }
    ]
  }, buildDeps());

  assert.equal(result.selectedRootCount, 2);
  assert.equal(result.readyComponentCount, 1);
  assert.equal(result.readyObjectCount, 1);
  assert.equal(result.blockedComponentCount, 1);
  assert.equal(result.blockedComponents[0].root.entityId, "service_blocked");
  assert.equal(result.blockedComponents[0].publishedIncomingRefs[0].entityId, "page_live");
});

test("batch execution deletes independently ready groups and reports blocked group as terminal partial result", async () => {
  const txHandles = [];
  const deleteCalls = [];
  const deps = {
    ...buildDeps(),
    withTransaction: async (handler) => {
      const tx = { id: `tx_${txHandles.length + 1}` };
      txHandles.push(tx);
      return handler(tx);
    },
    recordAuditEvent: async () => {},
    recordDestructiveEvent: async () => {},
    deleteEntityWithSafetyInDb: async (input, options) => {
      assert.equal(options.db, txHandles.at(-1));
      deleteCalls.push(input);
      return { deleted: true, reasons: [], storageKeys: [] };
    },
    deleteMediaFile: async () => {}
  };

  const result = await executeRemovalSweepBatch({
    roots: [
      { entityType: "service", entityId: "service_ready_1" },
      { entityType: "service", entityId: "service_ready_2" },
      { entityType: "service", entityId: "service_blocked" }
    ],
    actorUserId: "user_super"
  }, deps);

  assert.equal(result.deletedComponentCount, 2);
  assert.equal(result.deletedObjectCount, 2);
  assert.equal(result.failedComponentCount, 1);
  assert.deepEqual(
    result.deletedComponents.map((component) => component.root.entityId).sort(),
    ["service_ready_1", "service_ready_2"]
  );
  assert.equal(result.failedComponents[0].root.entityId, "service_blocked");
  assert.deepEqual(
    deleteCalls.map((call) => call.entityId).sort(),
    ["service_ready_1", "service_ready_2"]
  );
  assert.equal(txHandles.length, 2);
});

test("batch execution preserves committed success when a later independent component fails", async () => {
  const deletedIds = [];
  const deps = {
    ...buildDeps(),
    withTransaction: async (handler) => handler({ id: "tx" }),
    recordAuditEvent: async () => {},
    recordDestructiveEvent: async () => {},
    deleteEntityWithSafetyInDb: async (input) => {
      if (input.entityId === "service_ready_2") {
        throw new Error("Группа больше не готова к безопасному удалению.");
      }

      deletedIds.push(input.entityId);
      return { deleted: true, reasons: [], storageKeys: [] };
    },
    deleteMediaFile: async () => {}
  };

  const result = await executeRemovalSweepBatch({
    roots: [
      { entityType: "service", entityId: "service_ready_1" },
      { entityType: "service", entityId: "service_ready_2" }
    ],
    actorUserId: "user_super"
  }, deps);

  assert.deepEqual(deletedIds, ["service_ready_1"]);
  assert.equal(result.deletedComponentCount, 1);
  assert.equal(result.deletedObjectCount, 1);
  assert.equal(result.failedComponentCount, 1);
  assert.equal(result.failedComponents[0].root.entityId, "service_ready_2");
  assert.match(result.failedComponents[0].error, /больше не готова/i);
});
