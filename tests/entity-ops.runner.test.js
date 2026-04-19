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
