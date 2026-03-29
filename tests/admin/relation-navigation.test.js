import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRelationSelectionModel,
  buildRelationTarget,
  normalizeAdminReturnTo
} from "../../lib/admin/relation-navigation.js";

test("relation targets append returnTo and reject unsafe destinations", () => {
  const target = buildRelationTarget({
    entityType: "service",
    entityId: "service-1",
    returnTo: "/admin/entities/page/page-1"
  });
  const fallback = buildRelationTarget({
    entityType: "gallery",
    returnTo: "https://example.com/escape"
  });

  assert.equal(target.href, "/admin/entities/service/service-1?returnTo=%2Fadmin%2Fentities%2Fpage%2Fpage-1");
  assert.equal(target.isFallback, false);
  assert.equal(fallback.href, "/admin/entities/gallery");
  assert.equal(fallback.isFallback, true);
  assert.equal(normalizeAdminReturnTo("https://example.com/escape"), "");
});

test("relation selection model keeps exact chips, fallback chips, and partial state explicit", () => {
  const model = buildRelationSelectionModel({
    entityType: "case",
    options: [
      {
        id: "case-1",
        label: "Дом в Сочи",
        subtitle: "Кейс",
        meta: "Версия #1"
      }
    ],
    selectedIds: ["case-1", "case-missing"],
    returnTo: "/admin/entities/service/service-1",
    emptyLabel: "Нет связанных сущностей"
  });

  assert.equal(model.isEmpty, false);
  assert.equal(model.isPartial, true);
  assert.equal(model.missingCount, 1);
  assert.equal(model.items[0].href, "/admin/entities/case/case-1?returnTo=%2Fadmin%2Fentities%2Fservice%2Fservice-1");
  assert.equal(model.items[0].isFallback, false);
  assert.equal(model.items[1].isFallback, true);
  assert.equal(model.items[1].actionLabel, "Открыть список");
  assert.equal(model.optionRows[0].selected, true);
});

test("empty relation selection model stays honest and exposes the add flow baseline", () => {
  const model = buildRelationSelectionModel({
    entityType: "media_asset",
    options: [],
    selectedIds: [],
    returnTo: "/admin/entities/page/page-1"
  });

  assert.equal(model.isEmpty, true);
  assert.equal(model.items.length, 0);
  assert.equal(model.emptyLabel, "Нет связанных сущностей");
});
