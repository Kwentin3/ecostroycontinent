import test from "node:test";
import assert from "node:assert/strict";

import {
  assertNoNewRefsToMarkedEntities,
  listMarkedReferenceConflicts
} from "../lib/content-core/removal-references.js";

test("marked reference helper reports newly introduced links to marked entities", async () => {
  const conflicts = await listMarkedReferenceConflicts(
    "service",
    {
      relatedCaseIds: ["case_marked"]
    },
    {
      findEntityById: async (entityId) => (
        entityId === "case_marked"
          ? {
              id: "case_marked",
              entityType: "case",
              markedForRemovalAt: "2026-04-19T10:00:00.000Z"
            }
          : null
      )
    }
  );

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].targetId, "case_marked");
  assert.equal(conflicts[0].field, "relatedCaseIds");
});

test("marked reference guard ignores already existing references and blocks only new ones", async () => {
  await assert.doesNotReject(() => assertNoNewRefsToMarkedEntities(
    {
      entityType: "service",
      previousPayload: {
        relatedCaseIds: ["case_marked"]
      },
      nextPayload: {
        relatedCaseIds: ["case_marked"]
      }
    },
    {
      findEntityById: async (entityId) => ({
        id: entityId,
        entityType: "case",
        markedForRemovalAt: "2026-04-19T10:00:00.000Z"
      })
    }
  ));

  await assert.rejects(
    () => assertNoNewRefsToMarkedEntities(
      {
        entityType: "service",
        previousPayload: {
          relatedCaseIds: []
        },
        nextPayload: {
          relatedCaseIds: ["case_marked"]
        }
      },
      {
        findEntityById: async (entityId) => ({
          id: entityId,
          entityType: "case",
          markedForRemovalAt: "2026-04-19T10:00:00.000Z"
        })
      }
    ),
    /Нельзя создать новую ссылку на объект, помеченный на удаление/
  );
});

test("marked reference helper detects equipment links from service and case payloads", async () => {
  const serviceConflicts = await listMarkedReferenceConflicts(
    "service",
    {
      equipmentIds: ["equipment_marked"]
    },
    {
      findEntityById: async (entityId) => (
        entityId === "equipment_marked"
          ? {
              id: "equipment_marked",
              entityType: "equipment",
              markedForRemovalAt: "2026-04-21T10:00:00.000Z"
            }
          : null
      )
    }
  );
  const caseConflicts = await listMarkedReferenceConflicts(
    "case",
    {
      equipmentIds: ["equipment_marked"]
    },
    {
      findEntityById: async (entityId) => ({
        id: entityId,
        entityType: "equipment",
        markedForRemovalAt: "2026-04-21T10:00:00.000Z"
      })
    }
  );

  assert.equal(serviceConflicts[0].field, "equipmentIds");
  assert.equal(caseConflicts[0].field, "equipmentIds");
});
