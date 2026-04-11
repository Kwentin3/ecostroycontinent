import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEntityAggregates,
  collectMediaStorageKeys,
  createCleanupMatchers,
  findEntityCleanupSignals,
  findExternalReferences,
  matchesCleanupCandidate
} from "../lib/internal/test-data-cleanup.js";

function createAggregate({
  entityId,
  entityType = "service",
  payload,
  changeIntent = "Minor editorial update",
  reviewComment = ""
}) {
  return {
    entity: {
      id: entityId,
      entityType
    },
    revisions: [
      {
        id: `rev_${entityId}`,
        revisionNumber: 1,
        state: "draft",
        payload,
        changeIntent,
        reviewComment
      }
    ]
  };
}

test("cleanup matcher recognizes proof/demo style payloads and intents", () => {
  const matchers = createCleanupMatchers();
  const aggregate = createAggregate({
    entityId: "entity_proof_service",
    payload: {
      title: "Proof Service mn5z9jae",
      slug: "proof-service-mn5z9jae",
      summary: "SEO surface proof summary"
    },
    changeIntent: "Create proof service"
  });

  assert.equal(matchesCleanupCandidate(aggregate, matchers), true);

  const signals = findEntityCleanupSignals(aggregate, matchers);

  assert.ok(signals.some((signal) => signal.value.includes("Proof Service")));
  assert.ok(signals.some((signal) => signal.value.includes("Create proof service")));
});

test("cleanup matcher does not classify normal content as proof data", () => {
  const matchers = createCleanupMatchers();
  const aggregate = createAggregate({
    entityId: "entity_service_real",
    payload: {
      title: "Facade works",
      slug: "fasadnye-raboty",
      summary: "Production service summary"
    },
    changeIntent: "Update production service copy"
  });

  assert.equal(matchesCleanupCandidate(aggregate, matchers), false);
  assert.deepEqual(findEntityCleanupSignals(aggregate, matchers), []);
});

test("cleanup tool reports non-candidate entities that still reference candidate ids", () => {
  const candidate = createAggregate({
    entityId: "entity_media_proof",
    entityType: "media_asset",
    payload: {
      title: "Proof Asset",
      storageKey: "proof.png"
    }
  });
  const nonCandidate = createAggregate({
    entityId: "entity_service_real",
    entityType: "service",
    payload: {
      title: "Facade works",
      primaryMediaAssetId: "entity_media_proof"
    }
  });

  const references = findExternalReferences([nonCandidate], [candidate.entity.id]);

  assert.deepEqual(references, [
    {
      sourceEntityId: "entity_service_real",
      sourceEntityType: "service",
      referencedEntityId: "entity_media_proof"
    }
  ]);
});

test("cleanup tool collects storage keys only for media assets", () => {
  const mediaAggregate = {
    entity: {
      id: "entity_media_proof",
      entityType: "media_asset"
    },
    revisions: [
      {
        id: "rev_2",
        revisionNumber: 2,
        state: "draft",
        payload: { storageKey: "proof-v2.png" }
      },
      {
        id: "rev_1",
        revisionNumber: 1,
        state: "published",
        payload: { storageKey: "proof-v1.png" }
      }
    ]
  };
  const serviceAggregate = createAggregate({
    entityId: "entity_service_real",
    entityType: "service",
    payload: {
      title: "Facade works",
      storageKey: "should-not-be-treated-as-media.bin"
    }
  });

  assert.deepEqual(collectMediaStorageKeys(mediaAggregate), ["proof-v2.png", "proof-v1.png"]);
  assert.deepEqual(collectMediaStorageKeys(serviceAggregate), []);
});

test("explicit entity id targeting can stay narrow without matching default proof patterns", () => {
  const matchers = createCleanupMatchers();
  const explicitIds = new Set(["entity_manual_target"]);
  const explicitAggregate = createAggregate({
    entityId: "entity_manual_target",
    entityType: "media_asset",
    payload: {
      title: "Manual smoke asset",
      storageKey: "manual-smoke.png"
    },
    changeIntent: "Manual smoke cleanup"
  });
  const proofAggregate = createAggregate({
    entityId: "entity_proof_asset",
    entityType: "media_asset",
    payload: {
      title: "Proof Asset",
      storageKey: "proof.png"
    },
    changeIntent: "Create proof asset"
  });

  assert.equal(matchesCleanupCandidate(explicitAggregate, matchers, explicitIds), true);
  assert.equal(matchesCleanupCandidate(proofAggregate, matchers, explicitIds), true);
  assert.equal(matchesCleanupCandidate(explicitAggregate, createCleanupMatchers([]), explicitIds), true);
  assert.deepEqual(findEntityCleanupSignals(explicitAggregate, matchers), []);
});

test("aggregate builder preserves exact-id cleanup targets even when they have no revisions", () => {
  const aggregates = buildEntityAggregates([
    {
      entity_id: "entity_page_no_revision",
      entity_type: "page",
      active_published_revision_id: null,
      entity_created_at: "2026-04-11T00:00:00.000Z",
      entity_updated_at: "2026-04-11T00:00:00.000Z",
      revision_id: null,
      revision_number: null,
      state: null,
      payload: null,
      change_intent: null,
      review_comment: null,
      revision_created_at: null,
      revision_updated_at: null
    }
  ]);

  assert.equal(aggregates.length, 1);
  assert.equal(aggregates[0].entity.id, "entity_page_no_revision");
  assert.deepEqual(aggregates[0].revisions, []);
});
