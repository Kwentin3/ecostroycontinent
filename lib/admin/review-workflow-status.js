export const REVIEW_WORKFLOW_PRIORITIES = Object.freeze({
  needs_owner: 0,
  returned: 1,
  approved: 2,
  in_review: 3
});

const REVIEW_WORKFLOW_LABELS = Object.freeze({
  needs_owner: "Требует решения",
  returned: "Возвращено",
  approved: "Согласовано",
  in_review: "На проверке"
});

const REVIEW_WORKFLOW_TONES = Object.freeze({
  needs_owner: "warning",
  returned: "danger",
  approved: "success",
  in_review: "warning"
});

export function getReviewWorkflowStatusKey(revision = {}) {
  if (revision.ownerReviewRequired && revision.ownerApprovalStatus === "pending") {
    return "needs_owner";
  }

  if (revision.ownerApprovalStatus === "rejected") {
    return "returned";
  }

  if (revision.ownerApprovalStatus === "approved") {
    return "approved";
  }

  return "in_review";
}

export function getReviewWorkflowStatusModel(revision = {}) {
  const key = getReviewWorkflowStatusKey(revision);

  return {
    key,
    label: REVIEW_WORKFLOW_LABELS[key],
    tone: REVIEW_WORKFLOW_TONES[key],
    attention: key === "needs_owner"
  };
}
