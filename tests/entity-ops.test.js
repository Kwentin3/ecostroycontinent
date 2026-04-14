import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEntityDeleteFormData,
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

test("entity ops normalizes delete mode with slug match", () => {
  const [operation] = normalizeEntityOperations([
    {
      entityType: "page",
      mode: "delete",
      match: {
        slug: "test-foundation-equipment"
      }
    }
  ]);

  assert.equal(operation.mode, "delete");
  assert.equal(operation.match.slug, "test-foundation-equipment");
  assert.deepEqual(operation.fields, {});
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

test("entity ops serializes multiline list fields as newline-delimited values", () => {
  const formData = buildEntitySaveFormData({
    changeIntent: "",
    creationOrigin: "",
    fields: {
      keySpecs: ["Spec 1", "Spec 2"],
      usageScenarios: ["Scenario 1", "Scenario 2"]
    }
  });

  assert.equal(formData.get("keySpecs"), "Spec 1\nSpec 2");
  assert.equal(formData.get("usageScenarios"), "Scenario 1\nScenario 2");
});

test("entity ops builds multipart form data for delete route", () => {
  const formData = buildEntityDeleteFormData({
    match: {
      entityId: "entity_1"
    }
  });

  assert.equal(formData.get("responseMode"), "json");
  assert.deepEqual(formData.getAll("entityId"), ["entity_1"]);
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

test("entity ops preview diff reads SEO values from nested payload shape", () => {
  const diff = buildFieldPreviewDiff(
    {
      seo: {
        metaTitle: "Existing meta"
      }
    },
    {
      metaTitle: "Existing meta"
    }
  );

  assert.deepEqual(diff, {});
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

test("entity ops planner resolves matched delete into delete action", () => {
  const plan = planEntityOperation(
    {
      mode: "delete",
      fields: {}
    },
    {
      matched: true,
      entity: { id: "entity_page_1" },
      latestRevision: {
        payload: {
          slug: "test-foundation-equipment"
        }
      }
    }
  );

  assert.equal(plan.ok, true);
  assert.equal(plan.action, "delete");
  assert.equal(plan.entityId, "entity_page_1");
});
