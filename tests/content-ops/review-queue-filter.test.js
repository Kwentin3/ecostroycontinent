import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { filterPendingReviewQueueItems, resolveReviewSubmissionCandidate } from "../../lib/content-ops/workflow.js";

function buildQueueItem(id, ownerApprovalStatus, state = "review") {
  return {
    entityId: `entity_${id}`,
    entityType: "service",
    revision: {
      id: `rev_${id}`,
      state,
      ownerApprovalStatus
    }
  };
}

test("review queue keeps submitted revisions visible until explicit approval", () => {
  const queue = [
    buildQueueItem("pending", "pending"),
    buildQueueItem("returned", "rejected"),
    buildQueueItem("approved", "approved"),
    buildQueueItem("not_required", "not_required"),
    buildQueueItem("legacy", null)
  ];

  const filtered = filterPendingReviewQueueItems(queue);

  assert.deepEqual(
    filtered.map((item) => item.revision.id),
    ["rev_pending", "rev_returned", "rev_not_required", "rev_legacy"]
  );
});

test("review queue source includes returned draft revisions for SEO follow-up", () => {
  const repositorySource = readFileSync(new URL("../../lib/content-core/repository.js", import.meta.url), "utf8");
  const workflowSource = readFileSync(new URL("../../lib/content-ops/workflow.js", import.meta.url), "utf8");
  const filtered = filterPendingReviewQueueItems([
    buildQueueItem("returned_draft", "rejected", "draft")
  ]);

  assert.deepEqual(filtered.map((item) => item.revision.id), ["rev_returned_draft"]);
  assert.match(repositorySource, /r\.state = 'draft' AND r\.owner_approval_status = 'rejected'/);
  assert.match(workflowSource, /reviewComment: ""/);
});

test("review queue hides superseded revisions", () => {
  const queue = [
    buildQueueItem("pending", "pending"),
    {
      ...buildQueueItem("superseded", "pending"),
      revision: {
        ...buildQueueItem("superseded", "pending").revision,
        state: "superseded"
      }
    }
  ];

  const filtered = filterPendingReviewQueueItems(queue);

  assert.deepEqual(filtered.map((item) => item.revision.id), ["rev_pending"]);
});

test("review submission detects an exact duplicate active review", () => {
  const draftRevision = {
    id: "rev_draft",
    payload: {
      title: "Аренда техники",
      serviceScope: "Земляные работы"
    }
  };
  const activeReview = {
    id: "rev_review",
    payload: {
      serviceScope: "Земляные работы",
      title: "Аренда техники"
    }
  };

  const result = resolveReviewSubmissionCandidate({
    activeReviewRevisions: [activeReview],
    draftRevision
  });

  assert.equal(result.duplicateRevision.id, "rev_review");
  assert.deepEqual(result.supersededRevisions, []);
});

test("review submission marks older active reviews for supersede when content changed", () => {
  const activeReview = {
    id: "rev_review",
    payload: {
      serviceScope: "Земляные работы"
    }
  };
  const draftRevision = {
    id: "rev_draft",
    payload: {
      serviceScope: "Земляные работы, демонтаж"
    }
  };

  const result = resolveReviewSubmissionCandidate({
    activeReviewRevisions: [activeReview],
    draftRevision
  });

  assert.equal(result.duplicateRevision, null);
  assert.deepEqual(result.supersededRevisions.map((revision) => revision.id), ["rev_review"]);
});
