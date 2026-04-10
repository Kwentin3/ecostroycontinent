import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES, PAGE_TYPES, AUDIT_EVENT_KEYS } from "../../lib/content-core/content-types.js";
import { evaluateLiveDeactivation, executeLiveDeactivation } from "../../lib/admin/live-deactivation.js";

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

test("evaluateLiveDeactivation allows an ordinary published page with no incoming refs", async () => {
  const aggregate = makeAggregate(ENTITY_TYPES.PAGE, "page_live_1", {
    activePublishedRevisionId: "rev_page_live_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "About",
      h1: "About"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.PAGE,
      entityId: "page_live_1"
    },
    buildDeps({
      aggregate,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [makeLatestCard(aggregate)],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [makePublishedCard(aggregate)],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      }
    })
  );

  assert.equal(result.allowed, true);
  assert.equal(result.routeEffects.routePath, "/about");
  assert.ok(result.routeEffects.routeOutcome.includes("404"));
});

test("evaluateLiveDeactivation allows an ordinary published media asset with no incoming refs", async () => {
  const aggregate = makeAggregate(ENTITY_TYPES.MEDIA_ASSET, "media_live_1", {
    activePublishedRevisionId: "rev_media_live_1",
    latestPayload: {
      title: "Pilot media"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      entityId: "media_live_1"
    },
    buildDeps({
      aggregate,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      }
    })
  );

  assert.equal(result.allowed, true);
  assert.equal(result.routeEffects.routePath, "/api/media/media_live_1, /api/media-public/media_live_1");
  assert.ok(result.routeEffects.routeOutcome.includes("404"));
});

test("evaluateLiveDeactivation refuses when surviving published page points to service", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_live_1", {
    activePublishedRevisionId: "rev_service_live_1",
    latestPayload: {
      slug: "service-live",
      title: "Service live"
    }
  });
  const page = makeAggregate(ENTITY_TYPES.PAGE, "page_live_1", {
    activePublishedRevisionId: "rev_page_live_1",
    latestPayload: {
      pageType: PAGE_TYPES.ABOUT,
      title: "About",
      h1: "About",
      serviceCardIds: ["service_live_1"]
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1"
    },
    buildDeps({
      aggregate: service,
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
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На сущность ссылается опубликованная страница."));
  assert.equal(result.publishedIncomingRefs.length, 1);
  assert.equal(result.publishedIncomingRefs[0].entityId, "page_live_1");
});

test("evaluateLiveDeactivation refuses when surviving published page points to media", async () => {
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

  const result = await evaluateLiveDeactivation(
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

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На сущность ссылается опубликованная страница."));
  assert.equal(result.publishedIncomingRefs.length, 1);
  assert.equal(result.publishedIncomingRefs[0].entityId, "page_live_1");
});

test("evaluateLiveDeactivation refuses when non-test draft case points to service", async () => {
  const service = makeAggregate(ENTITY_TYPES.SERVICE, "service_live_1", {
    activePublishedRevisionId: "rev_service_live_1",
    latestPayload: {
      slug: "service-live",
      title: "Service live"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1"
    },
    buildDeps({
      aggregate: service,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makeLatestCard(service)],
        [ENTITY_TYPES.CASE]: [
          {
            entity: {
              id: "case_draft_1",
              creationOrigin: null
            },
            latestRevision: {
              state: "draft",
              payload: {
                title: "Case draft",
                serviceIds: ["service_live_1"]
              }
            }
          }
        ],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makePublishedCard(service)],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      }
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("На сущность ссылается рабочий нетестовый черновик кейса."));
  assert.equal(result.draftIncomingRefs.length, 1);
  assert.equal(result.draftIncomingRefs[0].entityId, "case_draft_1");
});

test("evaluateLiveDeactivation exposes review residue details", async () => {
  const aggregate = makeAggregate(ENTITY_TYPES.CASE, "case_live_1", {
    activePublishedRevisionId: "rev_case_live_1",
    revisions: [
      {
        id: "rev_case_draft",
        revisionNumber: 2,
        state: "review",
        payload: {
          slug: "case-live",
          title: "Case live"
        }
      },
      {
        id: "rev_case_live_1",
        revisionNumber: 1,
        state: "published",
        payload: {
          slug: "case-live",
          title: "Case live"
        }
      }
    ],
    publishedPayload: {
      slug: "case-live",
      title: "Case live"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.CASE,
      entityId: "case_live_1"
    },
    buildDeps({
      aggregate,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [makeLatestCard(aggregate)],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [],
        [ENTITY_TYPES.CASE]: [makePublishedCard(aggregate)],
        [ENTITY_TYPES.GALLERY]: []
      }
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("У сущности есть ревизия на проверке."));
  assert.equal(result.reviewResidue.length, 1);
  assert.equal(result.reviewResidue[0].href, "/admin/review/rev_case_draft");
});

test("evaluateLiveDeactivation exposes open publish obligations", async () => {
  const aggregate = makeAggregate(ENTITY_TYPES.SERVICE, "service_live_1", {
    activePublishedRevisionId: "rev_service_live_1",
    latestPayload: {
      slug: "service-live",
      title: "Service live"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_live_1"
    },
    buildDeps({
      aggregate,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makeLatestCard(aggregate)],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makePublishedCard(aggregate)],
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

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("У сущности есть открытые обязательства по публикации."));
  assert.equal(result.openObligations.length, 1);
  assert.equal(result.openObligations[0].id, "obligation_1");
});

test("evaluateLiveDeactivation refuses test-marked published root", async () => {
  const aggregate = makeAggregate(ENTITY_TYPES.SERVICE, "service_test_1", {
    creationOrigin: "agent_test",
    activePublishedRevisionId: "rev_service_test_1",
    latestPayload: {
      slug: "service-test",
      title: "Service test"
    }
  });

  const result = await evaluateLiveDeactivation(
    {
      entityType: ENTITY_TYPES.SERVICE,
      entityId: "service_test_1"
    },
    buildDeps({
      aggregate,
      latestCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makeLatestCard(aggregate)],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      },
      publishedCards: {
        [ENTITY_TYPES.PAGE]: [],
        [ENTITY_TYPES.SERVICE]: [makePublishedCard(aggregate)],
        [ENTITY_TYPES.CASE]: [],
        [ENTITY_TYPES.GALLERY]: []
      }
    })
  );

  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes("Тестовый опубликованный объект нужно убирать через удаление тестового графа."));
});

test("executeLiveDeactivation clears published pointer and records audit evidence", async () => {
  const operations = [];
  const result = await executeLiveDeactivation({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_live_1",
    actorUserId: "user_1"
  }, {
    withTransaction: async (run) => run({ kind: "db" }),
    evaluateLiveDeactivation: async () => ({
      allowed: true,
      root: {
        activePublishedRevisionId: "rev_service_live_1"
      },
      routeEffects: {
        routePath: "/services/service-live",
        routeOutcome: "Маршрут станет 404.",
        listImpact: "Уйдёт из списка.",
        sitemapImpact: "Ссылка уйдёт из карты сайта.",
        revalidationPaths: ["/services/service-live", "/services"]
      }
    }),
    clearEntityActivePublishedRevision: async (entityId, actorUserId) => {
      operations.push(`clear:${entityId}:${actorUserId}`);
    },
    recordAuditEvent: async (input) => {
      operations.push(`audit:${input.eventKey}:${input.entityId}`);
    }
  });

  assert.equal(result.executed, true);
  assert.deepEqual(result.revalidationPaths, ["/services/service-live", "/services"]);
  assert.deepEqual(operations, [
    "clear:service_live_1:user_1",
    `audit:${AUDIT_EVENT_KEYS.LIVE_DEACTIVATED}:service_live_1`
  ]);
});
