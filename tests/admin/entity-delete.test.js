import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { assessEntityDelete, buildDeleteBatchSummary } from "../../lib/admin/entity-delete.js";

function makeAggregate(entityType, entityId, overrides = {}) {
  return {
    entity: {
      id: entityId,
      entityType,
      creationOrigin: overrides.creationOrigin ?? null,
      activePublishedRevisionId: overrides.activePublishedRevisionId ?? null
    },
    revisions: overrides.revisions ?? [
      {
        id: `rev_${entityId}`,
        state: "draft",
        payload: overrides.payload ?? {}
      }
    ],
    activePublishedRevision: overrides.activePublishedRevisionId ? { id: overrides.activePublishedRevisionId } : null
  };
}

function buildDeps({ aggregate, latestCards = {}, publishedCards = {}, obligations = [] }) {
  return {
    getEntityAggregate: async () => aggregate,
    listPublishObligations: async () => obligations,
    listEntityCards: async (entityType) => latestCards[entityType] ?? [],
    listPublishedCards: async (entityType) => publishedCards[entityType] ?? []
  };
}

test("safe delete allows an unpublished unreferenced agent-test media asset", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      entityId: "media_1",
      testOnly: true
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_1", {
        creationOrigin: "agent_test",
        payload: { storageKey: "asset.png" }
      })
    })
  );

  assert.equal(result.allowed, true);
  assert.deepEqual(result.reasons, []);
});

test("safe delete refuses published service truth", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_1"
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.SERVICE, "service_1", {
        activePublishedRevisionId: "rev_published"
      })
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes("Сущность опубликована и участвует в живом контуре."));
});

test("safe delete refuses entity referenced by published page", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.CASE,
      entityId: "case_1"
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.CASE, "case_1"),
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [
          {
            entityId: "page_1",
            entityType: ENTITY_TYPES.PAGE,
            revision: {
              payload: {
                caseCardIds: ["case_1"]
              }
            }
          }
        ]
      }
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes("Объект используется в опубликованной странице."));
});

test("safe delete refuses entity referenced by non-test draft", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      entityId: "media_1"
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_1"),
      latestCards: {
        [ENTITY_TYPES.SERVICE]: [
          {
            entity: {
              id: "service_1",
              creationOrigin: null
            },
            latestRevision: {
              state: "draft",
              payload: {
                primaryMediaAssetId: "media_1"
              }
            }
          }
        ]
      }
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes("Объект используется в рабочем черновике услуги."));
});

test("delete batch summary keeps deleted and refused counts", () => {
  const summary = buildDeleteBatchSummary([
    { deleted: true, reasons: [] },
    { deleted: false, reasons: ["Объект используется в опубликованной странице."] },
    { deleted: false, reasons: ["Объект участвует в review/publish-потоке."] }
  ]);

  assert.equal(summary.deletedCount, 1);
  assert.equal(summary.refusedCount, 2);
  assert.equal(summary.reasons.length, 2);
});
