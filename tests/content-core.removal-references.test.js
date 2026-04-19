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
