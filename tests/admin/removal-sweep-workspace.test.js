import test from "node:test";
import assert from "node:assert/strict";

import {
  filterRemovalSweepWorkspaceItems,
  getPrimaryRemovalSweepBlocker,
  getRemovalSweepWorkspaceCardKey
} from "../../lib/admin/removal-sweep-workspace.js";

const items = [
  {
    root: { entityType: "service", entityId: "service_1", label: "Капитальный ремонт" },
    summary: "Удаление пока невозможно.",
    members: [
      { entityType: "service", entityId: "service_1", label: "Капитальный ремонт" }
    ],
    publishedIncomingRefs: [
      { entityType: "page", entityId: "page_1", label: "Главная", reason: "Используется в опубликованном объекте «Главная»." }
    ],
    draftIncomingRefs: [],
    stateBlockers: []
  },
  {
    root: { entityType: "media_asset", entityId: "media_1", label: "Фасад здания" },
    summary: "Все проверки пройдены.",
    members: [
      { entityType: "media_asset", entityId: "media_1", label: "Фасад здания" }
    ],
    publishedIncomingRefs: [],
    draftIncomingRefs: [],
    stateBlockers: []
  }
];

test("cleanup workspace filtering finds cards by entity and blocker explanation", () => {
  assert.deepEqual(
    filterRemovalSweepWorkspaceItems(items, "фасад").map(getRemovalSweepWorkspaceCardKey),
    ["media_asset:media_1"]
  );
  assert.deepEqual(
    filterRemovalSweepWorkspaceItems(items, "опубликованном").map(getRemovalSweepWorkspaceCardKey),
    ["service:service_1"]
  );
});

test("cleanup workspace exposes the first exact blocker and stable root selection key", () => {
  assert.equal(getRemovalSweepWorkspaceCardKey(items[0]), "service:service_1");
  assert.equal(getPrimaryRemovalSweepBlocker(items[0]).entityId, "page_1");
  assert.equal(getPrimaryRemovalSweepBlocker(items[1]), null);
});
