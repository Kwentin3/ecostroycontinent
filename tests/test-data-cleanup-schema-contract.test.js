import test from "node:test";
import assert from "node:assert/strict";

import {
  TEST_DATA_CLEANUP_SCHEMA_CONTRACT,
  validateCleanupSchemaContract
} from "../lib/internal/test-data-cleanup-schema-contract.js";

function createValidSnapshot() {
  return {
    columnsByTable: {
      content_entities: [
        "id",
        "entity_type",
        "active_published_revision_id",
        "created_at",
        "updated_at"
      ],
      content_revisions: [
        "id",
        "entity_id",
        "revision_number",
        "state",
        "payload",
        "change_intent",
        "review_comment",
        "created_at",
        "updated_at"
      ],
      publish_obligations: ["id", "entity_id", "revision_id"],
      audit_events: ["id", "entity_id", "revision_id"]
    },
    foreignKeys: TEST_DATA_CLEANUP_SCHEMA_CONTRACT.requiredForeignKeys.map((entry) => ({ ...entry })),
    migrationIds: ["001_admin_first_slice.sql"]
  };
}

test("cleanup schema contract accepts the expected baseline snapshot", () => {
  const problems = validateCleanupSchemaContract(createValidSnapshot());

  assert.deepEqual(problems, []);
});

test("cleanup schema contract reports missing columns and migrations", () => {
  const snapshot = createValidSnapshot();

  snapshot.columnsByTable.content_revisions = snapshot.columnsByTable.content_revisions.filter(
    (column) => column !== "payload"
  );
  snapshot.migrationIds = [];

  const problems = validateCleanupSchemaContract(snapshot);

  assert.ok(problems.includes("missing required migration marker: 001_admin_first_slice.sql"));
  assert.ok(problems.includes("missing required column: content_revisions.payload"));
});

test("cleanup schema contract reports foreign-key drift", () => {
  const snapshot = createValidSnapshot();

  snapshot.foreignKeys = snapshot.foreignKeys.filter(
    (foreignKey) =>
      !(
        foreignKey.table === "audit_events" &&
        foreignKey.column === "revision_id" &&
        foreignKey.foreignTable === "content_revisions"
      )
  );

  const problems = validateCleanupSchemaContract(snapshot);

  assert.ok(
    problems.includes(
      "missing required foreign key: audit_events.revision_id -> content_revisions.id ON DELETE CASCADE"
    )
  );
});
