import test from "node:test";
import assert from "node:assert/strict";

import { evaluateRemovalSweepComponent } from "../../lib/admin/removal-sweep-analysis.js";

function makeCard(entityType, entityId, payload, { marked = true, state = "draft" } = {}) {
  return {
    entity: {
      id: entityId,
      entityType,
      markedForRemovalAt: marked ? "2026-04-19T10:00:00.000Z" : null
    },
    latestRevision: {
      id: `${entityId}_rev_1`,
      revisionNumber: 1,
      state,
      payload
    }
  };
}

function makePublishedCard(entityType, entityId, payload) {
  return {
    entityId,
    revision: {
      id: `${entityId}_rev_pub`,
      revisionNumber: 2,
      state: "published",
      payload
    }
  };
}

function buildDeps({ pagePublishedCards = [] } = {}) {
  const cardsByType = {
    media_asset: [],
    gallery: [],
    service: [
      makeCard("service", "service_marked", {
        title: "Marked Service",
        relatedCaseIds: ["case_marked"]
      })
    ],
    case: [
      makeCard("case", "case_marked", {
        title: "Marked Case",
        serviceIds: ["service_marked"]
      })
    ],
    equipment: [],
    page: []
  };

  return {
    listEntityCards: async (entityType) => cardsByType[entityType] ?? [],
    listPublishedCards: async (entityType) => {
      if (entityType === "page") {
        return pagePublishedCards;
      }

      return [];
    },
    getEntityAggregate: async (entityId) => ({
      entity: {
        id: entityId,
        entityType: entityId.startsWith("service") ? "service" : "case",
        activePublishedRevisionId: null
      },
      revisions: [
        {
          id: `${entityId}_rev_1`,
          revisionNumber: 1,
          state: "draft",
          payload: entityId.startsWith("service")
            ? { title: "Marked Service", relatedCaseIds: ["case_marked"] }
            : { title: "Marked Case", serviceIds: ["service_marked"] }
        }
      ],
      activePublishedRevision: null
    }),
    listPublishObligations: async () => [],
    findEntityById: async () => null
  };
}

test("removal sweep analysis marks isolated fully-marked component as ready", async () => {
  const evaluation = await evaluateRemovalSweepComponent(
    { entityType: "service", entityId: "service_marked" },
    buildDeps()
  );

  assert.equal(evaluation.exists, true);
  assert.equal(evaluation.verdict, "ready");
  assert.equal(evaluation.members.length, 2);
  assert.equal(evaluation.publishedIncomingRefs.length, 0);
  assert.equal(evaluation.stateBlockers.length, 0);
});

test("removal sweep analysis blocks component when unmarked published page still references it", async () => {
  const evaluation = await evaluateRemovalSweepComponent(
    { entityType: "service", entityId: "service_marked" },
    buildDeps({
      pagePublishedCards: [
        makePublishedCard("page", "page_live", {
          title: "Live Page",
          serviceIds: ["service_marked"]
        })
      ]
    })
  );

  assert.equal(evaluation.exists, true);
  assert.equal(evaluation.verdict, "blocked");
  assert.equal(evaluation.publishedIncomingRefs.length, 1);
  assert.match(evaluation.summary, /живой непомеченный контур/i);
});
