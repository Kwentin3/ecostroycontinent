import test from "node:test";
import assert from "node:assert/strict";

import { AUDIT_EVENT_KEYS, ENTITY_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import { evaluateUnpublish, executeUnpublish } from "../../lib/admin/unpublish-workflow.js";

function makeAggregate(entityType, entityId, overrides = {}) {
  const latestRevision = overrides.latestRevision ?? {
    id: `rev_${entityId}_latest`,
    revisionNumber: overrides.latestRevisionNumber ?? 1,
    state: overrides.latestState ?? "published",
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

function buildDeps({ aggregate, latestCards = {}, publishedCards = {}, obligations = [] }) {
  return {
    getEntityAggregate: async () => aggregate,
    listPublishObligations: async () => obligations,
    listEntityCards: async (entityType) => latestCards[entityType] ?? [],
    listPublishedCards: async (entityType) => publishedCards[entityType] ?? []
  };
}

test("evaluateUnpublish allows published media even when published page points to it", async () => {
  const media = makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_live_1", {
    activePublishedRevisionId: "rev_media_live_1",
    latestPayload: {
      title: "Pilot media"
    }
  });
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_live_1", {
    activePublishedRevisionId: "rev_page_live_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "About",
      h1: "About",
      primaryMediaAssetId: "media_live_1"
    }
  });

  const result = await evaluateUnpublish(
    {
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      entityId: "media_live_1"
    },
    buildDeps({
      aggregate: media,
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
    })
  );

  assert.equal(result.allowed, true);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.publishedIncomingRefs.length, 1);
  assert.equal(result.publishedIncomingRefs[0].entityId, "page_live_1");
  assert.ok(result.warnings.includes("На сущность ссылается опубликованная страница."));
});

test("evaluateUnpublish treats review revisions and open obligations as warnings", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_live_1", {
    activePublishedRevisionId: "rev_service_live_1",
    revisions: [
      {
        id: "rev_service_review",
        revisionNumber: 2,
        state: "review",
        payload: {
          slug: "service-live",
          title: "Service live"
        }
      },
      {
        id: "rev_service_live_1",
        revisionNumber: 1,
        state: "published",
        payload: {
          slug: "service-live",
          title: "Service live"
        }
      }
    ],
    publishedPayload: {
      slug: "service-live",
      title: "Service live"
    }
  });

  const result = await evaluateUnpublish(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1"
    },
    buildDeps({
      aggregate: service,
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
      },
      obligations: [
        {
          id: "obligation_1",
          status: "open",
          obligationType: "redirect_required"
        }
      ]
    })
  );

  assert.equal(result.allowed, true);
  assert.equal(result.reviewResidue.length, 1);
  assert.equal(result.openObligations.length, 1);
  assert.ok(result.warnings.includes("У сущности есть ревизия на проверке."));
  assert.ok(result.warnings.includes("У сущности есть открытые обязательства по публикации."));
});

test("evaluateUnpublish blocks entities without an active published revision", async () => {
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_draft_1", {
    activePublishedRevisionId: null,
    latestState: "draft",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "About draft"
    }
  });

  const result = await evaluateUnpublish(
    {
      entityType: ENTITY_TYPES.PAGE,
      entityId: "page_draft_1"
    },
    buildDeps({
      aggregate: page
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("Сущность уже снята с публикации."));
});

test("executeUnpublish clears published pointer and records unpublish audit evidence", async () => {
  const operations = [];
  const result = await executeUnpublish({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_live_1",
    actorUserId: "user_seo"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateUnpublish: async () => ({
      allowed: true,
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1",
      blockers: [],
      warnings: [],
      publishedIncomingRefs: [],
      draftIncomingRefs: [],
      reviewResidue: [],
      openObligations: [],
      root: {
        entityId: "service_live_1",
        entityType: ENTITY_TYPES.SERVICE,
        label: "Service live",
        activePublishedRevisionId: "rev_service_live_1"
      },
      routeEffects: {
        routePath: "/services/service-live",
        routeOutcome: "Маршрут станет 404.",
        revalidationPaths: ["/services/service-live", "/services"]
      }
    }),
    clearEntityActivePublishedRevision: async (entityId, actorUserId, db, options) => {
      assert.deepEqual(options, {
        expectedActivePublishedRevisionId: "rev_service_live_1"
      });
      operations.push(`clear:${entityId}:${actorUserId}`);
      return { id: entityId };
    },
    recordDestructiveEvent: async (input) => {
      operations.push(`event:${input.auditEventKey}:${input.operationKind}:${input.outcome}`);
    }
  });

  assert.equal(result.executed, true);
  assert.deepEqual(result.revalidationPaths, ["/services/service-live", "/services"]);
  assert.deepEqual(operations, [
    "clear:service_live_1:user_seo",
    `event:${AUDIT_EVENT_KEYS.UNPUBLISHED}:unpublish:executed`
  ]);
});

test("executeUnpublish blocks when active published revision changed after evaluation", async () => {
  const operations = [];
  const result = await executeUnpublish({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_live_1",
    actorUserId: "user_seo"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateUnpublish: async () => ({
      allowed: true,
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1",
      blockers: [],
      warnings: [],
      publishedIncomingRefs: [],
      draftIncomingRefs: [],
      reviewResidue: [],
      openObligations: [],
      root: {
        entityId: "service_live_1",
        entityType: ENTITY_TYPES.SERVICE,
        label: "Service live",
        activePublishedRevisionId: "rev_service_live_1"
      },
      routeEffects: {
        routePath: "/services/service-live",
        routeOutcome: "Маршрут станет 404.",
        revalidationPaths: ["/services/service-live", "/services"]
      }
    }),
    clearEntityActivePublishedRevision: async (entityId, actorUserId, db, options) => {
      operations.push(`clear:${entityId}:${actorUserId}:${options.expectedActivePublishedRevisionId}`);
      return null;
    },
    recordDestructiveEvent: async (input) => {
      operations.push(`event:${input.auditEventKey}:${input.operationKind}:${input.outcome}`);
    }
  });

  assert.equal(result.executed, false);
  assert.equal(result.revalidationPaths.length, 0);
  assert.equal(result.evaluation.allowed, false);
  assert.match(result.evaluation.blockers.join("\n"), /Опубликованная версия изменилась/);
  assert.deepEqual(operations, [
    "clear:service_live_1:user_seo:rev_service_live_1",
    `event:${AUDIT_EVENT_KEYS.UNPUBLISH_BLOCKED}:unpublish:blocked`
  ]);
});
