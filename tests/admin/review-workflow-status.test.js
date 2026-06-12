import test from "node:test";
import assert from "node:assert/strict";

import { getReviewWorkflowStatusModel } from "../../lib/admin/review-workflow-status.js";

test("review workflow status surfaces owner-approved items as agreed even without owner review flag", () => {
  const status = getReviewWorkflowStatusModel({
    ownerReviewRequired: false,
    ownerApprovalStatus: "approved"
  });

  assert.equal(status.key, "approved");
  assert.equal(status.label, "Согласовано");
  assert.equal(status.tone, "success");
});

test("review workflow status keeps non-owner review items visible without owner decision", () => {
  const status = getReviewWorkflowStatusModel({
    ownerReviewRequired: false,
    ownerApprovalStatus: "not_required"
  });

  assert.equal(status.key, "in_review");
  assert.equal(status.tone, "warning");
  assert.equal(status.attention, false);
});

test("review workflow status keeps unresolved owner approval items in the decision bucket", () => {
  const status = getReviewWorkflowStatusModel({
    ownerReviewRequired: true,
    ownerApprovalStatus: "pending"
  });

  assert.equal(status.key, "needs_owner");
  assert.equal(status.label, "Ждёт решения собственника");
  assert.equal(status.attention, true);
});
