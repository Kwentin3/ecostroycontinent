import test from "node:test";
import assert from "node:assert/strict";

import { recordDestructiveEvent } from "../../lib/content-ops/destructive-forensics.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "../../lib/content-core/content-types.js";

test("recordDestructiveEvent can detach audit trail from deleted entity while preserving forensic payload", async () => {
  const auditCalls = [];
  const forensicCalls = [];

  const correlationId = await recordDestructiveEvent({
    auditEventKey: AUDIT_EVENT_KEYS.SAFE_DELETE_EXECUTED,
    auditEntityId: null,
    correlationId: "corr_forensic_1",
    operationKind: "safe_delete",
    outcome: "executed",
    actorUserId: "user_1",
    root: {
      entityId: "entity_deleted_1",
      entityType: ENTITY_TYPES.SERVICE,
      label: "Deleted service"
    },
    target: {
      entityId: "entity_deleted_1",
      entityType: ENTITY_TYPES.SERVICE,
      label: "Deleted service"
    },
    affectedEntities: [
      {
        entityId: "entity_deleted_1",
        entityType: ENTITY_TYPES.SERVICE
      }
    ],
    summary: "Deleted through destructive contour."
  }, {
    recordAuditEvent: async (input) => {
      auditCalls.push(input);
    },
    insertDestructiveForensicEvent: async (input) => {
      forensicCalls.push(input);
    }
  });

  assert.equal(correlationId, "corr_forensic_1");
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].entityId, null);
  assert.equal(auditCalls[0].eventKey, AUDIT_EVENT_KEYS.SAFE_DELETE_EXECUTED);
  assert.equal(forensicCalls.length, 1);
  assert.equal(forensicCalls[0].targetEntityId, "entity_deleted_1");
  assert.deepEqual(forensicCalls[0].affectedEntityIds, ["entity_deleted_1"]);
});
