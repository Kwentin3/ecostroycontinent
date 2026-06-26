import test from "node:test";
import assert from "node:assert/strict";

import {
  MEDIA_COLLECTION_CANDIDATE_FILTERS,
  MEDIA_LIBRARY_FILTERS,
  assetHasPublishedRevision,
  buildMediaLibrarySummaryItems,
  matchesMediaCollectionCandidateFilter,
  matchesMediaLibraryFilter,
  mediaAssetNeedsOwnerDecision,
  mediaAssetReadyToPublish,
  mediaAssetRequiresRevisionWork
} from "../../lib/admin/media-library-filters.js";

function getSummaryValue(summary, label) {
  return summary.find((item) => item.label === label)?.value;
}

test("media library filters expose returned work instead of the unclear broken shortcut", () => {
  const filterKeys = MEDIA_LIBRARY_FILTERS.map((filter) => filter.key);
  const filterLabels = MEDIA_LIBRARY_FILTERS.map((filter) => filter.label);

  assert.ok(filterKeys.includes("returned"));
  assert.ok(filterKeys.includes("ready-to-publish"));
  assert.equal(MEDIA_LIBRARY_FILTERS.find((filter) => filter.key === "review")?.label, "Ждут решения");
  assert.equal(MEDIA_LIBRARY_FILTERS.find((filter) => filter.key === "ready-to-publish")?.label, "К публикации");
  assert.equal(MEDIA_LIBRARY_FILTERS.find((filter) => filter.key === "returned")?.label, "Доработки SEO");
  assert.equal(filterKeys.includes("broken"), false);
  assert.equal(filterLabels.includes("Проблемные"), false);
});

test("media library review filter selects only assets waiting for owner decision", () => {
  const pendingReview = {
    statusKey: "review",
    ownerApprovalStatus: "pending"
  };
  const approvedReview = {
    statusKey: "review",
    ownerApprovalStatus: "approved"
  };

  assert.equal(mediaAssetNeedsOwnerDecision(pendingReview), true);
  assert.equal(mediaAssetReadyToPublish(approvedReview), true);
  assert.equal(matchesMediaLibraryFilter(pendingReview, "review"), true);
  assert.equal(matchesMediaLibraryFilter(approvedReview, "review"), false);
  assert.equal(matchesMediaLibraryFilter(approvedReview, "ready-to-publish"), true);
  assert.equal(matchesMediaLibraryFilter({ statusKey: "review", ownerApprovalStatus: "not_required" }, "review"), false);
});

test("returned media filter selects only rejected draft work for SEO follow-up", () => {
  const returnedDraft = {
    statusKey: "draft",
    ownerApprovalStatus: "rejected",
    reviewComment: "Уточнить alt и подпись.",
    brokenBinary: false
  };

  assert.equal(mediaAssetRequiresRevisionWork(returnedDraft), true);
  assert.equal(matchesMediaLibraryFilter(returnedDraft, "returned"), true);
  assert.equal(matchesMediaLibraryFilter({ ...returnedDraft, statusKey: "review" }, "returned"), false);
  assert.equal(matchesMediaLibraryFilter({ ...returnedDraft, ownerApprovalStatus: "pending" }, "returned"), false);
  assert.equal(matchesMediaLibraryFilter({ statusKey: "draft", ownerApprovalStatus: "not_required", brokenBinary: true }, "returned"), false);
});

test("collection candidate filter separates approved review assets from live published assets", () => {
  const approvedReview = {
    statusKey: "review",
    ownerApprovalStatus: "approved"
  };
  const livePublished = {
    statusKey: "draft",
    ownerApprovalStatus: "not_required",
    publishedRevisionNumber: 7
  };
  const pendingReview = {
    statusKey: "review",
    ownerApprovalStatus: "pending"
  };
  const filterKeys = MEDIA_COLLECTION_CANDIDATE_FILTERS.map((filter) => filter.key);

  assert.deepEqual(filterKeys, ["all", "ready-to-publish", "published"]);
  assert.equal(matchesMediaCollectionCandidateFilter(approvedReview, "ready-to-publish"), true);
  assert.equal(matchesMediaCollectionCandidateFilter(livePublished, "ready-to-publish"), false);
  assert.equal(matchesMediaCollectionCandidateFilter(livePublished, "published"), true);
  assert.equal(assetHasPublishedRevision(livePublished), true);
  assert.equal(matchesMediaCollectionCandidateFilter(pendingReview, "ready-to-publish"), false);
  assert.equal(matchesMediaCollectionCandidateFilter(pendingReview, "all"), true);
});

test("media library summary counts returned work with the same rule as the quick filter", () => {
  const items = [
    { statusKey: "draft", ownerApprovalStatus: "rejected", missingAlt: true, orphaned: false },
    { statusKey: "review", ownerApprovalStatus: "pending", missingAlt: false, orphaned: true },
    { statusKey: "review", ownerApprovalStatus: "approved", missingAlt: false, orphaned: false },
    { statusKey: "draft", ownerApprovalStatus: "not_required", missingAlt: false, orphaned: false, brokenBinary: true }
  ];

  const summary = buildMediaLibrarySummaryItems(items);

  assert.equal(getSummaryValue(summary, "Всего"), 4);
  assert.equal(getSummaryValue(summary, "Ждут решения"), 1);
  assert.equal(getSummaryValue(summary, "К публикации"), 1);
  assert.equal(getSummaryValue(summary, "Доработки SEO"), 1);
  assert.equal(summary.some((item) => item.label === "Проблемные"), false);
});
