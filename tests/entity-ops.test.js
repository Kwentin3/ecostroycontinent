import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEntitySaveFormData,
  buildFieldPreviewDiff,
  normalizeEntityOperations,
  parseEntityOpsDocument
} from "../lib/entity-ops/input.js";
import { getEntityOpsConfig } from "../lib/entity-ops/config.js";
import { planEntityOperation } from "../lib/entity-ops/runner.js";

test("entity ops parses JSONL batches", () => {
  const document = parseEntityOpsDocument(
    '{"entityType":"service","slug":"soil-removal","title":"Soil removal"}\n{"entityType":"case","slug":"yard","title":"Yard"}',
    "batch.jsonl"
  );

  assert.equal(Array.isArray(document), true);
  assert.equal(document.length, 2);
});

test("entity ops normalizes flexible entries into explicit operations", () => {
  const operations = normalizeEntityOperations([
    {
      entityType: "service",
      slug: "soil-removal",
      title: "Soil removal"
    },
    {
      entityType: "page",
      mode: "update",
      match: { pageType: "about" },
      fields: {
        pageType: "about",
        title: "About company"
      }
    }
  ]);

  assert.equal(operations[0].mode, "upsert");
  assert.equal(operations[0].match.slug, "soil-removal");
  assert.equal(operations[1].match.pageType, "about");
});

test("entity ops builds multipart form data for save route", () => {
  const formData = buildEntitySaveFormData({
    changeIntent: "Operator sync",
    creationOrigin: "",
    fields: {
      title: "Soil removal",
      galleryIds: ["gallery_1", "gallery_2"],
      contactTruthConfirmed: true
    }
  }, {
    entityId: "entity_1"
  });

  assert.equal(formData.get("entityId"), "entity_1");
  assert.equal(formData.get("changeIntent"), "Operator sync");
  assert.deepEqual(formData.getAll("galleryIds"), ["gallery_1", "gallery_2"]);
  assert.equal(formData.get("contactTruthConfirmed"), "true");
});

test("entity ops preview diff tracks only changed supplied fields", () => {
  const diff = buildFieldPreviewDiff(
    {
      title: "Old title",
      galleryIds: ["gallery_1"]
    },
    {
      title: "New title",
      galleryIds: ["gallery_1"]
    }
  );

  assert.deepEqual(Object.keys(diff), ["title"]);
  assert.equal(diff.title.before, "Old title");
  assert.equal(diff.title.after, "New title");
});

test("entity ops config falls back to seed superadmin credentials", () => {
  const config = getEntityOpsConfig({
    APP_BASE_URL: "http://localhost:3000",
    ENTITY_OPS_USERNAME: "",
    ENTITY_OPS_PASSWORD: "",
    SEED_SUPERADMIN_USERNAME: "superadmin",
    SEED_SUPERADMIN_PASSWORD: "secret",
    ENTITY_OPS_TIMEOUT_MS: "25000"
  });

  assert.equal(config.username, "superadmin");
  assert.equal(config.password, "secret");
  assert.equal(config.timeoutMs, 25000);
});

test("entity ops planner skips unchanged upserts", () => {
  const plan = planEntityOperation(
    {
      mode: "upsert",
      fields: {
        slug: "soil-removal",
        title: "Soil removal"
      }
    },
    {
      matched: true,
      entity: { id: "entity_1" },
      latestRevision: {
        payload: {
          slug: "soil-removal",
          title: "Soil removal"
        }
      }
    }
  );

  assert.equal(plan.ok, true);
  assert.equal(plan.action, "skip");
  assert.equal(plan.entityId, "entity_1");
});
