import test from "node:test";
import assert from "node:assert/strict";

import {
  MEDIA_LIBRARY_FILTERS,
  buildMediaLibrarySummaryItems,
  matchesMediaLibraryFilter,
  mediaAssetRequiresRevisionWork
} from "../../lib/admin/media-library-filters.js";

function getSummaryValue(summary, label) {
  return summary.find((item) => item.label === label)?.value;
}

test("media library filters expose returned work instead of the unclear broken shortcut", () => {
  const filterKeys = MEDIA_LIBRARY_FILTERS.map((filter) => filter.key);
  const filterLabels = MEDIA_LIBRARY_FILTERS.map((filter) => filter.label);

  assert.ok(filterKeys.includes("returned"));
  assert.equal(MEDIA_LIBRARY_FILTERS.find((filter) => filter.key === "returned")?.label, "Требуются доработки");
  assert.equal(filterKeys.includes("broken"), false);
  assert.equal(filterLabels.includes("Проблемные"), false);
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

test("media library summary counts returned work with the same rule as the quick filter", () => {
  const items = [
    { statusKey: "draft", ownerApprovalStatus: "rejected", missingAlt: true, orphaned: false },
    { statusKey: "review", ownerApprovalStatus: "pending", missingAlt: false, orphaned: true },
    { statusKey: "draft", ownerApprovalStatus: "not_required", missingAlt: false, orphaned: false, brokenBinary: true }
  ];

  const summary = buildMediaLibrarySummaryItems(items);

  assert.equal(getSummaryValue(summary, "Всего"), 3);
  assert.equal(getSummaryValue(summary, "На проверке"), 1);
  assert.equal(getSummaryValue(summary, "Требуются доработки"), 1);
  assert.equal(summary.some((item) => item.label === "Проблемные"), false);
});
