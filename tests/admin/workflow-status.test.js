import test from "node:test";
import assert from "node:assert/strict";

import {
  getLivePublicationStatusModel,
  getPublishActionCopy,
  getWorkingRevisionStatusModel
} from "../../lib/admin/workflow-status.js";

test("approved review with a live version becomes ready to publish while staying published", () => {
  const currentRevision = {
    id: "rev_2",
    state: "review",
    ownerReviewRequired: true,
    ownerApprovalStatus: "approved"
  };
  const activePublishedRevision = {
    id: "rev_1",
    revisionNumber: 1
  };

  const workingStatus = getWorkingRevisionStatusModel({ currentRevision, activePublishedRevision });
  const liveStatus = getLivePublicationStatusModel({ currentRevision, activePublishedRevision });

  assert.equal(workingStatus.key, "ready_to_publish");
  assert.equal(liveStatus.key, "published_with_pending_changes");
});

test("rejected draft becomes changes requested", () => {
  const workingStatus = getWorkingRevisionStatusModel({
    currentRevision: {
      id: "rev_3",
      state: "draft",
      ownerApprovalStatus: "rejected"
    }
  });

  assert.equal(workingStatus.key, "changes_requested");
});

test("publish action switches copy when live version already exists", () => {
  const publishAction = getPublishActionCopy({
    activePublishedRevision: {
      id: "rev_live",
      revisionNumber: 4
    }
  });

  assert.equal(publishAction.label, "Опубликовать изменения");
  assert.match(publishAction.confirmMessage, /заменить текущую live-версию/);
});
