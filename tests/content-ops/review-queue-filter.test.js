import test from "node:test";
import assert from "node:assert/strict";

import { filterPendingReviewQueueItems } from "../../lib/content-ops/workflow.js";

function buildQueueItem(id, ownerApprovalStatus) {
  return {
    entityId: `entity_${id}`,
    entityType: "service",
    revision: {
      id: `rev_${id}`,
      state: "review",
      ownerApprovalStatus
    }
  };
}

test("review queue keeps only revisions that still need review-lane attention", () => {
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
    ["rev_pending", "rev_returned", "rev_legacy"]
  );
});
