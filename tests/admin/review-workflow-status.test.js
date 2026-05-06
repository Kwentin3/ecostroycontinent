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

test("review workflow status treats non-owner review items as agreed once they are submitted", () => {
  const status = getReviewWorkflowStatusModel({
    ownerReviewRequired: false,
    ownerApprovalStatus: "not_required"
  });
  const approvedStatus = getReviewWorkflowStatusModel({
    ownerReviewRequired: false,
    ownerApprovalStatus: "approved"
  });

  assert.equal(status.key, "approved");
  assert.equal(status.label, approvedStatus.label);
  assert.equal(status.tone, "success");
});

test("review workflow status keeps unresolved owner approval items in the decision bucket", () => {
  const status = getReviewWorkflowStatusModel({
    ownerReviewRequired: true,
    ownerApprovalStatus: "pending"
  });

  assert.equal(status.key, "needs_owner");
  assert.equal(status.label, "Требует решения");
  assert.equal(status.attention, true);
});
