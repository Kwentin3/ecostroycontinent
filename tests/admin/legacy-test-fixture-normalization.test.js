import test from "node:test";
import assert from "node:assert/strict";

import { AUDIT_EVENT_KEYS, ENTITY_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import {
  evaluateLegacyTestFixtureNormalization,
  executeLegacyTestFixtureNormalization
} from "../../lib/admin/legacy-test-fixture-normalization.js";

function makeAggregate(entityType, entityId, overrides = {}) {
  const latestRevision = overrides.latestRevision ?? {
    id: `rev_${entityId}_latest`,
    revisionNumber: overrides.latestRevisionNumber ?? 1,
    state: overrides.latestState ?? "draft",
    payload: overrides.latestPayload ?? overrides.payload ?? {}
  };
  const publishedRevision = overrides.publishedRevision ?? (overrides.activePublishedRevisionId
    ? {
        id: overrides.activePublishedRevisionId,
        revisionNumber: overrides.publishedRevisionNumber ?? 1,
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
        : null,
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
    listEntityCards: async (entityType) => latestCards[entityType] ?? [],
    listPublishedCards: async (entityType) => publishedCards[entityType] ?? [],
    listPublishObligations: async (entityId) => obligations[entityId] ?? []
  };
}

function makeGraphDeps(aggregates) {
  const latestCards = {
    [ENTITY_TYPES.PAGE]: [],
    [ENTITY_TYPES.SERVICE]: [],
    [ENTITY_TYPES.EQUIPMENT]: [],
    [ENTITY_TYPES.CASE]: [],
    [ENTITY_TYPES.GALLERY]: []
  };
  const publishedCards = {
    [ENTITY_TYPES.PAGE]: [],
    [ENTITY_TYPES.SERVICE]: [],
    [ENTITY_TYPES.EQUIPMENT]: [],
    [ENTITY_TYPES.CASE]: [],
    [ENTITY_TYPES.GALLERY]: []
  };

  for (const aggregate of Object.values(aggregates)) {
    const latestCard = makeLatestCard(aggregate);
    const publishedCard = makePublishedCard(aggregate);

    if (latestCards[aggregate.entity.entityType]) {
      latestCards[aggregate.entity.entityType].push(latestCard);
    }

    if (publishedCard && publishedCards[aggregate.entity.entityType]) {
      publishedCards[aggregate.entity.entityType].push(publishedCard);
    }
  }

  return buildDeps({ aggregates, latestCards, publishedCards });
}

test("evaluateLegacyTestFixtureNormalization allows isolated legacy page and warns about review residue", async () => {
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_legacy_1", {
    latestState: "review",
    activePublishedRevisionId: "rev_page_pub_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "Legacy page",
      h1: "Legacy page"
    },
    revisions: [
      {
        id: "rev_page_review_1",
        revisionNumber: 2,
        state: "review",
        payload: {
          pageType: PAGE_TYPES.ABOUT,
          title: "Legacy page",
          h1: "Legacy page"
        }
      },
      {
        id: "rev_page_pub_1",
        revisionNumber: 1,
        state: "published",
        payload: {
          pageType: PAGE_TYPES.ABOUT,
          title: "Legacy page",
          h1: "Legacy page"
        }
      }
    ],
    publishedPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "Legacy page",
      h1: "Legacy page"
    }
  });

  const result = await evaluateLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.PAGE,
    entityId: "page_legacy_1"
  }, makeGraphDeps({ page_legacy_1: page }));

  assert.equal(result.allowed, true);
  assert.equal(result.root.creationOrigin, null);
  assert.equal(result.root.resultingCreationOrigin, "agent_test");
  assert.ok(result.warnings.some((warning) => warning.includes("дисциплину проверки и публикации")));
});

test("evaluateLegacyTestFixtureNormalization refuses when non-test published page points to service", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_legacy_1", {
    activePublishedRevisionId: "rev_service_pub_1",
    latestPayload: {
      slug: "legacy-service",
      title: "Legacy service"
    }
  });
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_live_1", {
    activePublishedRevisionId: "rev_page_live_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "Live page",
      h1: "Live page",
      serviceCardIds: ["service_legacy_1"]
    }
  });

  const result = await evaluateLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_legacy_1"
  }, makeGraphDeps({
    service_legacy_1: service,
    page_live_1: page
  }));

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На объект ссылается опубликованная нетестовая страница."));
});

test("evaluateLegacyTestFixtureNormalization refuses when non-test published equipment points to service", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_legacy_2", {
    activePublishedRevisionId: "rev_service_pub_2",
    latestPayload: {
      slug: "legacy-service-2",
      title: "Legacy service 2"
    }
  });
  const equipment = makeAggregate(ENTITY_TYPES.EQUIPMENT, "equipment_live_1", {
    activePublishedRevisionId: "rev_equipment_live_1",
    latestPayload: {
      title: "Live equipment",
      slug: "live-equipment",
      serviceIds: ["service_legacy_2"]
    }
  });

  const result = await evaluateLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_legacy_2"
  }, makeGraphDeps({
    service_legacy_2: service,
    equipment_live_1: equipment
  }));

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На объект ссылается опубликованная нетестовая техника."));
});

test("evaluateLegacyTestFixtureNormalization ignores already-test published incoming refs", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_legacy_3", {
    latestPayload: {
      slug: "legacy-service-3",
      title: "Legacy service 3"
    }
  });
  const testPage = makeAggregate(ENTITY_TYPES.PAGE, "page_test_1", {
    creationOrigin: "agent_test",
    activePublishedRevisionId: "rev_page_test_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "Test page",
      serviceCardIds: ["service_legacy_3"]
    }
  });

  const result = await evaluateLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_legacy_3"
  }, makeGraphDeps({
    service_legacy_3: service,
    page_test_1: testPage
  }));

  assert.equal(result.allowed, true);
  assert.deepEqual(result.publishedIncomingRefs, []);
});

test("executeLegacyTestFixtureNormalization records blocked forensic evidence", async () => {
  const events = [];

  const result = await executeLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_legacy_blocked",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateLegacyTestFixtureNormalization: async () => ({
      allowed: false,
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_legacy_blocked",
      blockers: ["На объект ссылается опубликованная нетестовая страница."],
      warnings: [],
      publishedIncomingRefs: [],
      draftIncomingRefs: [],
      relatedTargets: [],
      root: {
        entityId: "service_legacy_blocked",
        entityType: ENTITY_TYPES.SERVICE,
        label: "Blocked service",
        creationOrigin: null,
        resultingCreationOrigin: "agent_test"
      }
    }),
    recordDestructiveEvent: async (input) => {
      events.push(input);
      return input.correlationId || "corr_1";
    }
  });

  assert.equal(result.executed, false);
  assert.equal(events.length, 1);
  assert.equal(events[0].operationKind, "legacy_test_fixture_normalization");
  assert.equal(events[0].outcome, "blocked");
  assert.equal(events[0].summary, "Нормализация устаревшего тестового набора отклонена правилами безопасности.");
});

test("executeLegacyTestFixtureNormalization updates marker and records forensic evidence", async () => {
  const operations = [];

  const result = await executeLegacyTestFixtureNormalization({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_legacy_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateLegacyTestFixtureNormalization: async () => ({
      allowed: true,
      root: {
        entityId: "service_legacy_1",
        entityType: ENTITY_TYPES.SERVICE,
        label: "Legacy service",
        creationOrigin: null,
        published: true,
        hasReviewRevision: true,
        openObligationsCount: 1,
        activePublishedRevisionId: "rev_service_pub_1"
      },
      warnings: [],
      relatedTargets: []
    }),
    updateEntityCreationOrigin: async (entityId, creationOrigin, actorUserId) => {
      operations.push(`normalize:${entityId}:${creationOrigin}:${actorUserId}`);
      return {
        id: entityId,
        entityType: ENTITY_TYPES.SERVICE,
        creationOrigin
      };
    },
    recordDestructiveEvent: async (input) => {
      operations.push(`event:${input.auditEventKey}:${input.target.entityId}:${input.outcome}`);
      return input.correlationId || "corr_1";
    }
  });

  assert.equal(result.executed, true);
  assert.equal(result.entity.creationOrigin, "agent_test");
  assert.equal(typeof result.correlationId, "string");
  assert.deepEqual(operations, [
    "normalize:service_legacy_1:agent_test:user_1",
    `event:${AUDIT_EVENT_KEYS.LEGACY_TEST_FIXTURE_NORMALIZED}:service_legacy_1:executed`
  ]);
});
