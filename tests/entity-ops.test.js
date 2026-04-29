import test from "node:test";
import assert from "node:assert/strict";

import {
  ENTITY_OPS_KINDS,
  buildDisplayModeFormData,
  buildEntityDeleteFormData,
  buildEntitySaveFormData,
  buildFieldPreviewDiff,
  buildMergedEntitySaveFields,
  buildMediaCreateFormData,
  buildMediaUpdateFormData,
  buildPageWorkspaceRequestBody,
  buildRemovalActionFormData,
  buildRemovalPurgeFormData,
  buildWorkflowOwnerActionFormData,
  buildWorkflowPublishFormData,
  buildWorkflowSubmitFormData,
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

test("entity ops derives create matcher from slug to avoid accidental duplicate creates", () => {
  const [operation] = normalizeEntityOperations([{
    entityType: "service",
    mode: "create",
    slug: "soil-removal",
    title: "Soil removal",
    h1: "Soil removal",
    summary: "Summary",
    serviceScope: "Scope",
    ctaVariant: "call"
  }]);

  assert.equal(operation.mode, "create");
  assert.equal(operation.match.slug, "soil-removal");
});

test("entity ops rejects unsupported entity save fields instead of silently dropping them", () => {
  assert.throws(
    () => normalizeEntityOperations([{
      entityType: "service",
      slug: "soil-removal",
      title: "Soil removal",
      h1: "Soil removal",
      summary: "Summary",
      serviceScope: "Scope",
      ctaVariant: "call",
      unsupportedField: "ignored before refactor"
    }]),
    /Unsupported field\(s\) for service at index 0: unsupportedField/
  );
});

test("entity ops normalizes media operation with collection membership and file path", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "media",
    mode: "update",
    entityId: "media_1",
    filePath: "./var/excavator.jpg",
    collectionIds: ["gallery_1", "gallery_2"],
    fields: {
      title: "Excavator",
      collectionsTouched: true
    }
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.MEDIA);
  assert.equal(operation.entityType, "media_asset");
  assert.equal(operation.match.entityId, "media_1");
  assert.equal(operation.filePath, "./var/excavator.jpg");
  assert.deepEqual(operation.collectionIds, ["gallery_1", "gallery_2"]);
  assert.equal(operation.collectionsTouched, true);
  assert.equal(operation.fields.title, "Excavator");
});

test("entity ops normalizes media create from sourceUrl", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "media",
    mode: "create",
    sourceUrl: "https://example.com/excavator.jpg",
    filename: "source-excavator.jpg",
    fields: {
      title: "Excavator",
      sourceNote: "Vendor page"
    }
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.MEDIA);
  assert.equal(operation.sourceUrl, "https://example.com/excavator.jpg");
  assert.equal(operation.filename, "source-excavator.jpg");
  assert.equal(operation.filePath, "");
  assert.equal(operation.fields.sourceNote, "Vendor page");
});

test("entity ops rejects media operation with both local file and sourceUrl", () => {
  assert.throws(
    () => normalizeEntityOperations([{
      kind: "media",
      mode: "create",
      filePath: "./image.jpg",
      sourceUrl: "https://example.com/image.jpg"
    }]),
    /cannot use both filePath and sourceUrl/
  );
});

test("entity ops normalizes display mode operation", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "display_mode",
    displayMode: "mixed_placeholder",
    reason: "Verify placeholder contour"
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.DISPLAY_MODE);
  assert.equal(operation.mode, "set");
  assert.equal(operation.displayMode, "mixed_placeholder");
  assert.equal(operation.reason, "Verify placeholder contour");
});

test("entity ops normalizes page workspace operations with nested composition", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "page_workspace",
    mode: "save_composition",
    match: {
      pageType: "about"
    },
    composition: {
      title: "About company",
      sourceRefs: {
        caseIds: ["case_1"]
      }
    },
    changeIntent: "Update page composition"
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.PAGE_WORKSPACE);
  assert.equal(operation.entityType, "page");
  assert.equal(operation.mode, "save_composition");
  assert.equal(operation.match.pageType, "about");
  assert.deepEqual(operation.composition.sourceRefs.caseIds, ["case_1"]);
});

test("entity ops normalizes workflow operation with explicit publish confirmation", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "workflow",
    entityType: "equipment",
    mode: "publish",
    match: {
      slug: "hyundai-hx520l"
    },
    confirmPublish: true
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.WORKFLOW);
  assert.equal(operation.entityType, "equipment");
  assert.equal(operation.mode, "publish");
  assert.equal(operation.match.slug, "hyundai-hx520l");
  assert.equal(operation.confirmPublish, true);
});

test("entity ops normalizes workflow operation by direct revisionId without entityType", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "workflow",
    mode: "submit_to_review",
    revisionId: "rev_direct_1"
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.WORKFLOW);
  assert.equal(operation.entityType, "");
  assert.equal(operation.revisionId, "rev_direct_1");
  assert.deepEqual(operation.match, {});
  assert.equal(operation.label, "rev_direct_1");
});

test("entity ops normalizes relation operation with refs resolved later", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "relation",
    entityType: "service",
    mode: "append",
    match: {
      slug: "arenda-tehniki"
    },
    field: "equipmentIds",
    refs: [
      { slug: "shantui-se420lcw" },
      { entityType: "equipment", match: { slug: "hyundai-hx520l" } }
    ]
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.RELATION);
  assert.equal(operation.entityType, "service");
  assert.equal(operation.field, "equipmentIds");
  assert.equal(operation.refs[0].entityType, "equipment");
  assert.equal(operation.refs[0].match.slug, "shantui-se420lcw");
  assert.equal(operation.refs[1].match.slug, "hyundai-hx520l");
});

test("entity ops rejects empty string relation refs before lookup", () => {
  assert.throws(
    () => normalizeEntityOperations([{
      kind: "relation",
      entityType: "service",
      mode: "append",
      match: {
        slug: "arenda-tehniki"
      },
      field: "equipmentIds",
      refs: [""]
    }]),
    /needs a non-empty entityId/
  );
});

test("entity ops normalizes read-only resolve operation", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "resolve",
    entityType: "service",
    match: {
      slug: "arenda-tehniki"
    }
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.RESOLVE);
  assert.equal(operation.mode, "entity");
  assert.equal(operation.includePayload, true);
  assert.equal(operation.match.slug, "arenda-tehniki");
});

test("entity ops normalizes removal maintenance operation", () => {
  const [operation] = normalizeEntityOperations([{
    kind: "removal",
    entityType: "case",
    mode: "mark",
    match: {
      slug: "test-case"
    },
    removalNote: "cleanup wave"
  }]);

  assert.equal(operation.kind, ENTITY_OPS_KINDS.REMOVAL);
  assert.equal(operation.entityType, "case");
  assert.equal(operation.mode, "mark");
  assert.equal(operation.match.slug, "test-case");
  assert.equal(operation.removalNote, "cleanup wave");
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

test("entity ops builds multipart form data for media create route", () => {
  const formData = buildMediaCreateFormData({
    changeIntent: "Upload media",
    creationOrigin: "agent_test",
    fields: {
      title: "Media title",
      alt: "Media alt"
    }
  }, {
    file: new File(["binary"], "image.png", { type: "image/png" })
  });

  assert.equal(formData.get("changeIntent"), "Upload media");
  assert.equal(formData.get("creationOrigin"), "agent_test");
  assert.equal(formData.get("title"), "Media title");
  assert.equal(formData.get("alt"), "Media alt");
  assert.equal(formData.get("file").name, "image.png");
});

test("entity ops builds multipart form data for media update route", () => {
  const formData = buildMediaUpdateFormData({
    changeIntent: "Patch media",
    fields: {
      title: "Media title",
      alt: "Media alt"
    },
    collectionsTouched: true,
    collectionIds: ["gallery_1", "gallery_2"]
  }, {
    binaryFile: new File(["binary"], "replacement.webp", { type: "image/webp" })
  });

  assert.equal(formData.get("changeIntent"), "Patch media");
  assert.equal(formData.get("title"), "Media title");
  assert.equal(formData.get("alt"), "Media alt");
  assert.equal(formData.get("collectionsTouched"), "true");
  assert.deepEqual(formData.getAll("collectionIds"), ["gallery_1", "gallery_2"]);
  assert.equal(formData.get("binary").name, "replacement.webp");
});

test("entity ops builds multipart form data for delete route", () => {
  const formData = buildEntityDeleteFormData({
    testOnly: true,
    match: {
      entityId: "entity_1"
    }
  });

  assert.equal(formData.get("responseMode"), "json");
  assert.equal(formData.get("testOnly"), "true");
  assert.deepEqual(formData.getAll("entityId"), ["entity_1"]);
});

test("entity ops builds JSON body for page workspace route", () => {
  const body = buildPageWorkspaceRequestBody({
    mode: "save_metadata",
    changeIntent: "Patch metadata",
    metadata: {
      slug: "about",
      seo: {
        metaTitle: "About"
      }
    }
  });

  assert.deepEqual(body, {
    action: "save_metadata",
    changeIntent: "Patch metadata",
    metadata: {
      slug: "about",
      seo: {
        metaTitle: "About"
      }
    }
  });
});

test("entity ops builds form data for workflow routes", () => {
  const submitFormData = buildWorkflowSubmitFormData({
    returnTo: "/admin/entities/service/entity_1"
  });
  const ownerFormData = buildWorkflowOwnerActionFormData({
    comment: "Owner approved",
    returnTo: "/admin/review/rev_1"
  });
  const publishFormData = buildWorkflowPublishFormData();

  assert.equal(submitFormData.get("returnTo"), "/admin/entities/service/entity_1");
  assert.equal(ownerFormData.get("action"), "approve");
  assert.equal(ownerFormData.get("comment"), "Owner approved");
  assert.equal(ownerFormData.get("errorReturnTo"), "/admin/review/rev_1");
  assert.equal([...publishFormData.keys()].length, 0);
});

test("entity ops builds form data for display mode route", () => {
  const formData = buildDisplayModeFormData({
    displayMode: "published_only",
    reason: "Return to launch mode",
    confirmPublishedOnly: true
  });

  assert.equal(formData.get("mode"), "published_only");
  assert.equal(formData.get("reason"), "Return to launch mode");
  assert.equal(formData.get("confirmPublishedOnly"), "true");
});

test("entity ops builds form data for removal routes", () => {
  const markFormData = buildRemovalActionFormData({
    mode: "mark",
    removalNote: "cleanup"
  });
  const purgeFormData = buildRemovalPurgeFormData({
    entityType: "case",
    match: {
      entityId: "case_1"
    }
  });

  assert.equal(markFormData.get("removalNote"), "cleanup");
  assert.equal(purgeFormData.get("responseMode"), "json");
  assert.equal(purgeFormData.get("entityType"), "case");
  assert.equal(purgeFormData.get("entityId"), "case_1");
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

test("entity ops builds full entity save fields when changing a relation", () => {
  const fields = buildMergedEntitySaveFields("service", {
    slug: "arenda-tehniki",
    title: "Аренда спецтехники",
    h1: "Аренда спецтехники",
    summary: "Summary",
    serviceScope: "Scope",
    ctaVariant: "call",
    equipmentIds: ["equipment_old"],
    seo: {
      metaTitle: "Meta"
    }
  }, {
    equipmentIds: ["equipment_old", "equipment_new"]
  });

  assert.equal(fields.title, "Аренда спецтехники");
  assert.equal(fields.metaTitle, "Meta");
  assert.deepEqual(fields.equipmentIds, ["equipment_old", "equipment_new"]);
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
