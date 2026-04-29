import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeEntityOperations } from "../lib/entity-ops/input.js";
import { runEntityOperations } from "../lib/entity-ops/runner.js";

function createBaseClient() {
  return {
    probeHealth: async () => ({ status: "ok" }),
    login: async () => ({ ok: true })
  };
}

test("entity ops runner uses dedicated media update route for media kind", async () => {
  const operations = normalizeEntityOperations([{
    kind: "media",
    mode: "update",
    entityId: "media_1",
    fields: {
      title: "Fixed media title"
    }
  }]);
  const calls = [];
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "media_1"
      },
      latestRevision: {
        payload: {
          title: "Old media title"
        }
      }
    }),
    updateMediaAsset: async (entityId, formData) => {
      calls.push({
        entityId,
        title: formData.get("title")
      });

      return {
        item: { id: entityId },
        message: "Media updated"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.updated, 1);
  assert.deepEqual(calls, [{
    entityId: "media_1",
    title: "Fixed media title"
  }]);
  assert.equal(report.items[0].action, "update");
  assert.deepEqual(report.items[0].changedFields, ["title"]);
});

test("entity ops runner switches display mode through dedicated route", async () => {
  let setModeCalled = 0;

  const operations = normalizeEntityOperations([{
    kind: "display_mode",
    displayMode: "mixed_placeholder",
    reason: "Verify placeholder contour"
  }]);
  const client = {
    ...createBaseClient(),
    getDisplayMode: async () => (
      setModeCalled === 0
        ? { mode: "published_only" }
        : { mode: "mixed_placeholder" }
    ),
    setDisplayMode: async (formData) => {
      setModeCalled += 1;
      assert.equal(formData.get("mode"), "mixed_placeholder");
      assert.equal(formData.get("reason"), "Verify placeholder contour");

      return {
        message: "Display mode updated"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.displayModeChanged, 1);
  assert.equal(report.items[0].action, "set_display_mode");
  assert.equal(report.items[0].currentMode, "mixed_placeholder");
});

test("entity ops runner saves page workspace composition through dedicated JSON route", async () => {
  const operations = normalizeEntityOperations([{
    kind: "page_workspace",
    mode: "save_composition",
    entityId: "page_1",
    composition: {
      title: "Updated page title",
      sourceRefs: {
        caseIds: ["case_1"]
      }
    },
    changeIntent: "Patch page workspace composition"
  }]);
  const calls = [];
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "page_1"
      },
      latestRevision: {
        payload: {
          title: "Old page title",
          sourceRefs: {
            caseIds: []
          }
        }
      }
    }),
    runPageWorkspaceAction: async (pageId, body) => {
      calls.push({ pageId, body });

      return {
        message: "Page workspace saved",
        revision: {
          id: "rev_page_2"
        },
        reviewHref: "/admin/review/rev_page_2"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.workspaceSaved, 1);
  assert.equal(report.items[0].action, "save_composition");
  assert.deepEqual(report.items[0].changedFields, ["title", "sourceRefs"]);
  assert.deepEqual(calls, [{
    pageId: "page_1",
    body: {
      action: "save_composition",
      changeIntent: "Patch page workspace composition",
      composition: {
        title: "Updated page title",
        sourceRefs: {
          caseIds: ["case_1"]
        }
      }
    }
  }]);
});

test("entity ops runner submits page workspace draft for review", async () => {
  const operations = normalizeEntityOperations([{
    kind: "page_workspace",
    mode: "send_to_review",
    entityId: "page_1"
  }]);
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "page_1"
      },
      latestRevision: {
        payload: {
          title: "Page"
        }
      }
    }),
    runPageWorkspaceAction: async (pageId, body) => {
      assert.equal(pageId, "page_1");
      assert.deepEqual(body, {
        action: "send_to_review"
      });

      return {
        message: "Draft sent to review",
        revision: {
          id: "rev_page_1",
          state: "review"
        },
        reviewHref: "/admin/review/rev_page_1"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.submitted, 1);
  assert.equal(report.items[0].reviewHref, "/admin/review/rev_page_1");
});

test("entity ops runner executes removal purge through the bounded cleanup route", async () => {
  const operations = normalizeEntityOperations([{
    kind: "removal",
    entityType: "case",
    mode: "purge",
    match: {
      entityId: "case_1"
    }
  }]);
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "case_1",
        markedForRemovalAt: "2026-04-19T15:00:00.000Z"
      }
    }),
    purgeRemovalSweep: async (formData) => {
      assert.equal(formData.get("entityType"), "case");
      assert.equal(formData.get("entityId"), "case_1");

      return {
        message: "Marked graph purged",
        deleted: [
          { entityId: "case_1" },
          { entityId: "media_1" }
        ]
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.purged, 1);
  assert.equal(report.items[0].deletedCount, 2);
  assert.deepEqual(report.items[0].deletedIds, ["case_1", "media_1"]);
});

test("entity ops runner creates media asset from local file path", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "entity-ops-media-"));
  const filePath = path.join(tempDir, "excavator.png");

  await fs.writeFile(filePath, "binary");

  try {
    const operations = normalizeEntityOperations([{
      kind: "media",
      mode: "create",
      filePath,
      fields: {
        title: "Excavator media"
      }
    }]);
    let uploadedFileName = "";
    const client = {
      ...createBaseClient(),
      createMediaAsset: async (formData) => {
        uploadedFileName = formData.get("file").name;

        return {
          item: { id: "media_new_1" },
          message: "Media uploaded"
        };
      }
    };

    const report = await runEntityOperations(client, operations, {
      execute: true
    });

    assert.equal(report.ok, true);
    assert.equal(report.summary.created, 1);
    assert.equal(uploadedFileName, "excavator.png");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
