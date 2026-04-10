import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { evaluateTestGraphTeardown, executeTestGraphTeardown } from "../../lib/admin/test-graph-teardown.js";

function makeAggregate(entityType, entityId, overrides = {}) {
  const latestRevision = overrides.latestRevision ?? {
    id: `rev_${entityId}_latest`,
    state: overrides.latestState ?? "draft",
    payload: overrides.latestPayload ?? overrides.payload ?? {}
  };
  const publishedRevision = overrides.publishedRevision ?? (overrides.activePublishedRevisionId
    ? {
        id: overrides.activePublishedRevisionId,
        state: "published",
        payload: overrides.publishedPayload ?? latestRevision.payload
      }
    : null);

  return {
    entity: {
      id: entityId,
      entityType,
      creationOrigin: Object.prototype.hasOwnProperty.call(overrides, "creationOrigin")
        ? overrides.creationOrigin
        : "agent_test",
      activePublishedRevisionId: overrides.activePublishedRevisionId ?? null
    },
    revisions: overrides.revisions ?? [latestRevision],
    activePublishedRevision: publishedRevision
  };
}

function makeLatestCard(aggregate) {
  return {
    entity: aggregate.entity,
    latestRevision: aggregate.revisions?.[0] ?? null
  };
}

function makePublishedCard(aggregate) {
  if (!aggregate.entity.activePublishedRevisionId || !aggregate.activePublishedRevision) {
    return null;
  }

  return {
    entityId: aggregate.entity.id,
    entityType: aggregate.entity.entityType,
    revision: aggregate.activePublishedRevision
  };
}

function buildDeps({ aggregates, latestCards = {}, publishedCards = {}, obligations = {} }) {
  return {
    getEntityAggregate: async (entityId) => aggregates[entityId] ?? null,
    listPublishObligations: async (entityId) => obligations[entityId] ?? [],
    listEntityCards: async (entityType) => latestCards[entityType] ?? [],
    listPublishedCards: async (entityType) => publishedCards[entityType] ?? []
  };
}

test("evaluateTestGraphTeardown allows a pure test-marked published graph", async () => {
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_test_1", {
    activePublishedRevisionId: "rev_page_pub",
    latestState: "published",
    latestPayload: {
      title: "Test page",
      pageType: "about",
      serviceCardIds: ["service_test_1"],
      caseCardIds: ["case_test_1"],
      primaryMediaAssetId: "media_test_1"
    }
  });
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_test_1", {
    activePublishedRevisionId: "rev_service_pub",
    latestState: "published",
    latestPayload: {
      title: "Test service",
      primaryMediaAssetId: "media_test_1",
      relatedCaseIds: ["case_test_1"]
    }
  });
  const caseEntity = makeAggregate(ENTITY_TYPES.CASE, "case_test_1", {
    activePublishedRevisionId: "rev_case_pub",
    latestState: "published",
    latestPayload: {
      title: "Test case",
      primaryMediaAssetId: "media_test_1",
      serviceIds: ["service_test_1"]
    }
  });
  const media = makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_test_1", {
    activePublishedRevisionId: "rev_media_pub",
    latestState: "published",
    latestPayload: {
      title: "Test media",
      storageKey: "media/test.png"
    }
  });
  const deps = buildDeps({
    aggregates: {
      page_test_1: page,
      service_test_1: service,
      case_test_1: caseEntity,
      media_test_1: media
    },
    latestCards: {
      [ENTITY_TYPES.PAGE]: [makeLatestCard(page)],
      [ENTITY_TYPES.SERVICE]: [makeLatestCard(service)],
      [ENTITY_TYPES.CASE]: [makeLatestCard(caseEntity)],
      [ENTITY_TYPES.GALLERY]: []
    },
    publishedCards: {
      [ENTITY_TYPES.PAGE]: [makePublishedCard(page)],
      [ENTITY_TYPES.SERVICE]: [makePublishedCard(service)],
      [ENTITY_TYPES.CASE]: [makePublishedCard(caseEntity)],
      [ENTITY_TYPES.GALLERY]: []
    }
  });

  const result = await evaluateTestGraphTeardown({
    entityType: ENTITY_TYPES.PAGE,
    entityId: "page_test_1"
  }, deps);

  assert.equal(result.allowed, true);
  assert.deepEqual(
    result.deletePlan.map((item) => item.entityId),
    ["page_test_1", "case_test_1", "service_test_1", "media_test_1"]
  );
});

test("evaluateTestGraphTeardown refuses a mixed graph with incoming non-test published truth", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_test_1", {
    activePublishedRevisionId: "rev_service_pub",
    latestState: "published",
    latestPayload: {
      title: "Test service"
    }
  });
  const nonTestPage = makeAggregate(ENTITY_TYPES.PAGE, "page_live_1", {
    creationOrigin: null,
    activePublishedRevisionId: "rev_page_live",
    latestState: "published",
    latestPayload: {
      title: "Live page",
      serviceCardIds: ["service_test_1"]
    }
  });
  const deps = buildDeps({
    aggregates: {
      service_test_1: service,
      page_live_1: nonTestPage
    },
    latestCards: {
      [ENTITY_TYPES.PAGE]: [makeLatestCard(nonTestPage)],
      [ENTITY_TYPES.SERVICE]: [makeLatestCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    },
    publishedCards: {
      [ENTITY_TYPES.PAGE]: [makePublishedCard(nonTestPage)],
      [ENTITY_TYPES.SERVICE]: [makePublishedCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    }
  });

  const result = await evaluateTestGraphTeardown({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_test_1"
  }, deps);

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На тестовый объект ссылается опубликованная нетестовая страница."));
  assert.equal(result.blockingRefs.length, 1);
  assert.equal(result.blockingRefs[0].entityType, ENTITY_TYPES.PAGE);
  assert.equal(result.blockingRefs[0].entityId, "page_live_1");
});

test("evaluateTestGraphTeardown allows teardown when only non-test media survives outside the test graph", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_test_1", {
    activePublishedRevisionId: "rev_service_pub",
    latestState: "published",
    latestPayload: {
      title: "Test service",
      primaryMediaAssetId: "media_live_1"
    }
  });
  const media = makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_live_1", {
    creationOrigin: null,
    activePublishedRevisionId: "rev_media_live",
    latestState: "published",
    latestPayload: {
      title: "Live media",
      storageKey: "media/live.png"
    }
  });
  const deps = buildDeps({
    aggregates: {
      service_test_1: service,
      media_live_1: media
    },
    latestCards: {
      [ENTITY_TYPES.PAGE]: [],
      [ENTITY_TYPES.SERVICE]: [makeLatestCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    },
    publishedCards: {
      [ENTITY_TYPES.PAGE]: [],
      [ENTITY_TYPES.SERVICE]: [makePublishedCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    }
  });

  const result = await evaluateTestGraphTeardown({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_test_1"
  }, deps);

  assert.equal(result.allowed, true);
  assert.deepEqual(result.deletePlan.map((item) => item.entityId), ["service_test_1"]);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.survivingRefs.length, 1);
  assert.equal(result.survivingRefs[0].entityType, ENTITY_TYPES.MEDIA_ASSET);
  assert.equal(result.survivingRefs[0].entityId, "media_live_1");
});

test("executeTestGraphTeardown deactivates published truth and deletes in dependency-aware order", async () => {
  const operations = [];
  const deleteCalls = [];
  const result = await executeTestGraphTeardown({
    entityType: ENTITY_TYPES.PAGE,
    entityId: "page_test_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateTestGraphTeardown: async () => ({
      allowed: true,
      members: [
        {
          entityType: ENTITY_TYPES.PAGE,
          entityId: "page_test_1",
          label: "Test page",
          published: true,
          deactivatePublished: true,
          openObligationIds: []
        },
        {
          entityType: ENTITY_TYPES.SERVICE,
          entityId: "service_test_1",
          label: "Test service",
          published: true,
          deactivatePublished: true,
          openObligationIds: ["obligation_1"]
        },
        {
          entityType: ENTITY_TYPES.MEDIA_ASSET,
          entityId: "media_test_1",
          label: "Test media",
          published: false,
          deactivatePublished: false,
          openObligationIds: []
        }
      ],
      deletePlan: [
        { entityType: ENTITY_TYPES.PAGE, entityId: "page_test_1" },
        { entityType: ENTITY_TYPES.SERVICE, entityId: "service_test_1" },
        { entityType: ENTITY_TYPES.MEDIA_ASSET, entityId: "media_test_1" }
      ]
    }),
    clearEntityActivePublishedRevision: async (entityId) => {
      operations.push(`deactivate:${entityId}`);
    },
    markPublishObligationCompleted: async (obligationId) => {
      operations.push(`obligation:${obligationId}`);
    },
    deleteEntityById: async (entityId) => {
      operations.push(`delete:${entityId}`);
    },
    deleteEntityWithSafetyInDb: async ({ entityType, entityId, testOnly }) => {
      deleteCalls.push({ entityType, entityId, testOnly });
      operations.push(`delete:${entityId}`);
      return {
        deleted: true,
        decision: { entityId, entityType, reasons: [] },
        storageKeys: entityType === ENTITY_TYPES.MEDIA_ASSET ? ["media/test.png"] : []
      };
    },
    deleteMediaFile: async (storageKey) => {
      operations.push(`storage:${storageKey}`);
    }
  });

  assert.equal(result.executed, true);
  assert.deepEqual(operations, [
    "deactivate:page_test_1",
    "obligation:obligation_1",
    "deactivate:service_test_1",
    "delete:page_test_1",
    "delete:service_test_1",
    "delete:media_test_1",
    "storage:media/test.png"
  ]);
  assert.deepEqual(deleteCalls, [
    { entityType: ENTITY_TYPES.SERVICE, entityId: "service_test_1", testOnly: true },
    { entityType: ENTITY_TYPES.MEDIA_ASSET, entityId: "media_test_1", testOnly: true }
  ]);
});
