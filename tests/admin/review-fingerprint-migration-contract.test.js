import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const migration = fs.readFileSync("db/migrations/013_review_fingerprint_and_supersede.sql", "utf8");

test("review fingerprint migration keeps the persistence contract additive", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS content_fingerprint TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS superseded_by_revision_id TEXT/);
  assert.match(migration, /'superseded'/);
  assert.match(migration, /content_revisions_active_review_fingerprint_idx/);
});
