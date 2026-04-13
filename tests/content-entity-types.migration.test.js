import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("equipment entity type is enabled by the dedicated storage migration", () => {
  const migrationPath = path.resolve("db/migrations/004_content_entities_equipment_type.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  assert.match(sql, /DROP CONSTRAINT IF EXISTS content_entities_entity_type_check/);
  assert.match(sql, /ADD CONSTRAINT content_entities_entity_type_check/);
  assert.match(sql, /'equipment'/);
});
