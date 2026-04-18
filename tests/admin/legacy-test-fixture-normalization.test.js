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
  }, buildDeps({
    aggregates: { page_legacy_1: page },
    latestCards: {
      [ENTITY_TYPES.PAGE]: [makeLatestCard(page)],
      [ENTITY_TYPES.SERVICE]: [],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    },
    publishedCards: {
      [ENTITY_TYPES.PAGE]: [makePublishedCard(page)],
      [ENTITY_TYPES.SERVICE]: [],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    }
  }));

  assert.equal(result.allowed, true);
  assert.equal(result.root.creationOrigin, null);
  assert.equal(result.root.resultingCreationOrigin, "agent_test");
  assert.ok(result.warnings.some((warning) => warning.includes("проверки и публикации")));
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
  }, buildDeps({
    aggregates: {
      service_legacy_1: service,
      page_live_1: page
    },
    latestCards: {
      [ENTITY_TYPES.PAGE]: [makeLatestCard(page)],
      [ENTITY_TYPES.SERVICE]: [makeLatestCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    },
    publishedCards: {
      [ENTITY_TYPES.PAGE]: [makePublishedCard(page)],
      [ENTITY_TYPES.SERVICE]: [makePublishedCard(service)],
      [ENTITY_TYPES.CASE]: [],
      [ENTITY_TYPES.GALLERY]: []
    }
  }));

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На объект ссылается опубликованная нетестовая страница."));
});

test("executeLegacyTestFixtureNormalization updates marker and records audit evidence", async () => {
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
        creationOrigin: null,
        published: true,
        hasReviewRevision: true,
        openObligationsCount: 1,
        activePublishedRevisionId: "rev_service_pub_1"
      }
    }),
    updateEntityCreationOrigin: async (entityId, creationOrigin, actorUserId) => {
      operations.push(`normalize:${entityId}:${creationOrigin}:${actorUserId}`);
      return {
        id: entityId,
        entityType: ENTITY_TYPES.SERVICE,
        creationOrigin
      };
    },
    recordAuditEvent: async (input) => {
      operations.push(`audit:${input.eventKey}:${input.entityId}`);
    }
  });

  assert.equal(result.executed, true);
  assert.equal(result.entity.creationOrigin, "agent_test");
  assert.deepEqual(operations, [
    "normalize:service_legacy_1:agent_test:user_1",
    `audit:${AUDIT_EVENT_KEYS.LEGACY_TEST_FIXTURE_NORMALIZED}:service_legacy_1`
  ]);
});
