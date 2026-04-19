import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  assessEntityDelete,
  buildDeleteBatchSummary,
  deleteEntityWithSafetyInDb
} from "../../lib/admin/entity-delete.js";

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
        revisionNumber: 1,
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
  assert.equal(result.publishedIncomingRefs.length, 0);
  assert.equal(result.draftIncomingRefs.length, 0);
});

test("safe delete refuses published service truth", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_1"
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.SERVICE, "service_1", {
        activePublishedRevisionId: "rev_published",
        payload: { title: "Service 1" }
      })
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes("У объекта есть действующая опубликованная версия."));
  assert.ok(result.stateBlockers.some((item) => item.kind === "published_truth"));
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
                title: "Page 1",
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
  assert.equal(result.publishedIncomingRefs.length, 1);
  assert.equal(result.publishedIncomingRefs[0].entityType, ENTITY_TYPES.PAGE);
  assert.equal(result.publishedIncomingRefs[0].entityId, "page_1");
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
                title: "Service draft",
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
  assert.equal(result.draftIncomingRefs.length, 1);
  assert.equal(result.draftIncomingRefs[0].entityType, ENTITY_TYPES.SERVICE);
  assert.equal(result.draftIncomingRefs[0].entityId, "service_1");
});

test("safe delete can ignore planned internal incoming refs for orchestrated teardown", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      entityId: "media_1",
      ignoreIncomingEntityIds: ["case_1"]
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_1"),
      latestCards: {
        [ENTITY_TYPES.CASE]: [
          {
            entity: {
              id: "case_1",
              creationOrigin: null
            },
            latestRevision: {
              state: "draft",
              payload: {
                title: "Case draft",
                primaryMediaAssetId: "media_1"
              }
            }
          }
        ]
      }
    })
  );

  assert.equal(result.allowed, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.draftIncomingRefs.length, 0);
});

test("safe delete exposes state blockers for review residue and open obligations", async () => {
  const result = await assessEntityDelete(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_1"
    },
    buildDeps({
      aggregate: makeAggregate(ENTITY_TYPES.SERVICE, "service_1", {
        revisions: [
          {
            id: "rev_review",
            revisionNumber: 2,
            state: "review",
            payload: {
              title: "Service 1"
            }
          }
        ]
      }),
      obligations: [
        {
          id: "obligation_1",
          status: "open",
          obligationType: "redirect_required"
        }
      ]
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.stateBlockers.some((item) => item.kind === "review_revision" && item.href === "/admin/review/rev_review"));
  assert.ok(result.stateBlockers.some((item) => item.kind === "open_obligation"));
});

test("delete batch summary keeps deleted and refused counts", () => {
  const summary = buildDeleteBatchSummary([
    { deleted: true, reasons: [] },
    { deleted: false, reasons: ["Объект используется в опубликованной странице."] },
    { deleted: false, reasons: ["У объекта есть ревизия на проверке."] }
  ]);

  assert.equal(summary.deletedCount, 1);
  assert.equal(summary.refusedCount, 2);
  assert.equal(summary.reasons.length, 2);
});

test("direct safe delete DB helper preserves refusal reasons for orchestration callers", async () => {
  const result = await deleteEntityWithSafetyInDb(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_1",
      actorUserId: "user_1"
    },
    {
      assessEntityDelete: async () => ({
        allowed: false,
        entityType: ENTITY_TYPES.SERVICE,
        entityId: "service_1",
        reasons: ["Объект используется в опубликованной странице."],
        stateBlockers: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        root: {
          entityId: "service_1",
          entityType: ENTITY_TYPES.SERVICE,
          label: "Service 1"
        }
      }),
      recordDestructiveEvent: async () => {},
      deleteEntityById: async () => {
        throw new Error("should not execute");
      }
    }
  );

  assert.equal(result.deleted, false);
  assert.deepEqual(result.reasons, ["Объект используется в опубликованной странице."]);
});
