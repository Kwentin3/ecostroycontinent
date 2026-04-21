import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  listLegacyEquipmentLinkedToEntity,
  resolveEquipmentIdsForEntity
} from "../../lib/content-core/equipment-relations.js";

function readUtf8(relativePath) {
  return fs.readFileSync(path.resolve(relativePath), "utf8");
}

test("equipment relation helper resolves explicit ownership and legacy fallback", () => {
  const equipmentRecords = [
    {
      entityId: "equipment_1",
      title: "Экскаватор CAT 320",
      serviceIds: ["service_1"],
      relatedCaseIds: ["case_1"]
    },
    {
      entityId: "equipment_2",
      title: "Самосвал",
      serviceIds: ["service_2"],
      relatedCaseIds: []
    }
  ];

  const legacyServiceMatches = listLegacyEquipmentLinkedToEntity(equipmentRecords, ENTITY_TYPES.SERVICE, "service_1");
  const legacyCaseMatches = listLegacyEquipmentLinkedToEntity(equipmentRecords, ENTITY_TYPES.CASE, "case_1");
  const explicitIds = resolveEquipmentIdsForEntity({
    payload: {
      equipmentIds: ["equipment_2", "equipment_1", "equipment_2"]
    },
    equipmentRecords,
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_1"
  });
  const fallbackIds = resolveEquipmentIdsForEntity({
    payload: {},
    equipmentRecords,
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service_1"
  });

  assert.deepEqual(legacyServiceMatches.map((item) => item.entityId), ["equipment_1"]);
  assert.deepEqual(legacyCaseMatches.map((item) => item.entityId), ["equipment_1"]);
  assert.deepEqual(explicitIds, ["equipment_2", "equipment_1"]);
  assert.deepEqual(fallbackIds, ["equipment_1"]);
});

test("service, case and equipment editors expose the final ownership model", () => {
  const source = readUtf8("components/admin/EntityTruthSections.js");

  assert.match(source, /name="equipmentIds"/);
  assert.match(source, /Связанная техника/);
  assert.match(source, /Техника в кейсе/);
  assert.match(source, /Используется в услугах/);
  assert.match(source, /relationOptions\.reverseEquipment/);
  assert.match(source, /relationOptions\.referencingServices/);
});

test("public service and case surfaces render related equipment sections", () => {
  const renderersSource = readUtf8("components/public/PublicRenderers.js");
  const servicePageSource = readUtf8("app/services/[slug]/page.js");
  const casePageSource = readUtf8("app/cases/[slug]/page.js");

  assert.match(renderersSource, /preview-service-related-equipment/);
  assert.match(renderersSource, /preview-case-related-equipment/);
  assert.match(servicePageSource, /resolveEquipmentRecordsForEntity/);
  assert.match(casePageSource, /resolveEquipmentRecordsForEntity/);
});
