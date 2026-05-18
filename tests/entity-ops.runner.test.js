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

test("entity ops runner creates media asset from source URL", async () => {
  const originalFetch = global.fetch;
  const fetchCalls = [];
  let uploadedFile = null;
  let uploadedTitle = "";

  try {
    global.fetch = async (url, options = {}) => {
      fetchCalls.push({
        url,
        redirect: options.redirect
      });

      return new Response(Buffer.from("remote-image"), {
        status: 200,
        headers: {
          "content-type": "image/jpeg"
        }
      });
    };

    const operations = normalizeEntityOperations([{
      kind: "media",
      mode: "create",
      sourceUrl: "https://cdn.example.test/shantui",
      filename: "shantui-se420lcw.jpg",
      fields: {
        title: "SHANTUI SE420LCW media"
      }
    }]);
    const client = {
      ...createBaseClient(),
      createMediaAsset: async (formData) => {
        uploadedFile = formData.get("file");
        uploadedTitle = formData.get("title");

        return {
          ok: true,
          item: { id: "media_remote_1" },
          message: "Media uploaded"
        };
      }
    };

    const report = await runEntityOperations(client, operations, {
      execute: true
    });

    assert.equal(report.ok, true);
    assert.equal(report.summary.created, 1);
    assert.deepEqual(fetchCalls, [{
      url: "https://cdn.example.test/shantui",
      redirect: "follow"
    }]);
    assert.equal(uploadedFile.name, "shantui-se420lcw.jpg");
    assert.equal(uploadedFile.type, "image/jpeg");
    assert.equal(await uploadedFile.text(), "remote-image");
    assert.equal(uploadedTitle, "SHANTUI SE420LCW media");
    assert.equal(report.items[0].filePath, "https://cdn.example.test/shantui");
  } finally {
    global.fetch = originalFetch;
  }
});

test("entity ops runner publishes review revision through workflow route", async () => {
  const operations = normalizeEntityOperations([{
    kind: "workflow",
    entityType: "equipment",
    mode: "publish",
    match: {
      slug: "shantui-se420lcw"
    },
    confirmPublish: true
  }]);
  const calls = [];
  const client = {
    ...createBaseClient(),
    lookupEntity: async (entityType, match) => {
      calls.push({ type: "lookup", entityType, match });

      return {
        matched: true,
        entity: {
          id: "equipment_1"
        },
        latestRevision: {
          id: "rev_equipment_1",
          state: "review",
          ownerReviewRequired: false,
          ownerApprovalStatus: "approved",
          payload: {
            slug: "shantui-se420lcw"
          }
        }
      };
    },
    publishRevision: async (revisionId, formData) => {
      calls.push({
        type: "publish",
        revisionId,
        formDataType: formData.constructor.name
      });

      return {
        location: "https://example.test/admin/entities/equipment/equipment_1?message=published",
        message: "Published"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.published, 1);
  assert.deepEqual(calls, [
    {
      type: "lookup",
      entityType: "equipment",
      match: { slug: "shantui-se420lcw" }
    },
    {
      type: "publish",
      revisionId: "rev_equipment_1",
      formDataType: "FormData"
    }
  ]);
  assert.equal(report.items[0].revisionId, "rev_equipment_1");
  assert.equal(report.items[0].location, "https://example.test/admin/entities/equipment/equipment_1?message=published");
});

test("entity ops runner submits direct revisionId workflow without entity lookup", async () => {
  const operations = normalizeEntityOperations([{
    kind: "workflow",
    mode: "submit_to_review",
    revisionId: "rev_direct_1",
    returnTo: "/admin/review"
  }]);
  let submitCall = null;
  const client = {
    ...createBaseClient(),
    submitRevisionForReview: async (revisionId, formData) => {
      submitCall = {
        revisionId,
        returnTo: formData.get("returnTo")
      };

      return {
        location: "https://example.test/admin/review/rev_direct_1",
        message: "Ready"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.submitted, 1);
  assert.deepEqual(submitCall, {
    revisionId: "rev_direct_1",
    returnTo: "/admin/review"
  });
  assert.equal(report.items[0].entityType, "");
  assert.equal(report.items[0].revisionId, "rev_direct_1");
});

test("entity ops runner blocks workflow publish without explicit confirmation", async () => {
  const operations = normalizeEntityOperations([{
    kind: "workflow",
    entityType: "equipment",
    mode: "publish",
    match: {
      slug: "hyundai-hx520l"
    }
  }]);
  let publishCalled = false;
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "equipment_2"
      },
      latestRevision: {
        id: "rev_equipment_2",
        state: "review",
        ownerReviewRequired: false,
        ownerApprovalStatus: "not_required"
      }
    }),
    publishRevision: async () => {
      publishCalled = true;
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, false);
  assert.equal(report.summary.blocked, 1);
  assert.equal(publishCalled, false);
  assert.equal(report.items[0].reason, "publish requires confirmPublish=true.");
});

test("entity ops runner appends relation refs by slug and saves a full entity payload", async () => {
  const operations = normalizeEntityOperations([{
    kind: "relation",
    entityType: "service",
    mode: "append",
    match: {
      slug: "arenda-spectehniki"
    },
    field: "equipmentIds",
    refs: [
      { slug: "shantui-se420lcw" },
      { slug: "hyundai-hx520l" }
    ],
    changeIntent: "Attach new excavator cards to rental service"
  }]);
  const lookups = [];
  const savedFields = {};
  const client = {
    ...createBaseClient(),
    lookupEntity: async (entityType, match) => {
      lookups.push({ entityType, match });

      if (entityType === "service") {
        return {
          matched: true,
          entity: {
            id: "service_1"
          },
          latestRevision: {
            payload: {
              slug: "arenda-spectehniki",
              title: "Equipment rental",
              h1: "Equipment rental",
              summary: "We match equipment to the task.",
              serviceScope: "Excavators and dump trucks",
              ctaVariant: "call",
              equipmentIds: ["equipment_existing"],
              seo: {
                metaTitle: "Equipment rental in Sochi"
              }
            }
          }
        };
      }

      if (match.slug === "shantui-se420lcw") {
        return {
          matched: true,
          entity: {
            id: "equipment_shantui"
          }
        };
      }

      return {
        matched: true,
        entity: {
          id: "equipment_hyundai"
        }
      };
    },
    saveEntity: async (entityType, formData) => {
      savedFields.entityType = entityType;
      savedFields.entityId = formData.get("entityId");
      savedFields.changeIntent = formData.get("changeIntent");
      savedFields.title = formData.get("title");
      savedFields.h1 = formData.get("h1");
      savedFields.summary = formData.get("summary");
      savedFields.serviceScope = formData.get("serviceScope");
      savedFields.ctaVariant = formData.get("ctaVariant");
      savedFields.metaTitle = formData.get("metaTitle");
      savedFields.equipmentIds = formData.getAll("equipmentIds");

      return {
        ok: true,
        entity: { id: "service_1" },
        changedFields: ["equipmentIds"],
        message: "Saved"
      };
    }
  };

  const report = await runEntityOperations(client, operations, {
    execute: true
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.relationsChanged, 1);
  assert.deepEqual(lookups, [
    { entityType: "service", match: { slug: "arenda-spectehniki" } },
    { entityType: "equipment", match: { slug: "shantui-se420lcw" } },
    { entityType: "equipment", match: { slug: "hyundai-hx520l" } }
  ]);
  assert.deepEqual(savedFields, {
    entityType: "service",
    entityId: "service_1",
    changeIntent: "Attach new excavator cards to rental service",
    title: "Equipment rental",
    h1: "Equipment rental",
    summary: "We match equipment to the task.",
    serviceScope: "Excavators and dump trucks",
    ctaVariant: "call",
    metaTitle: "Equipment rental in Sochi",
    equipmentIds: ["equipment_existing", "equipment_shantui", "equipment_hyundai"]
  });
  assert.equal(report.items[0].relationField, "equipmentIds");
  assert.deepEqual(report.items[0].resolvedIds, ["equipment_shantui", "equipment_hyundai"]);
  assert.deepEqual(report.items[0].previewDiff.equipmentIds.after, [
    "equipment_existing",
    "equipment_shantui",
    "equipment_hyundai"
  ]);
});

test("entity ops runner resolves entity context without execute", async () => {
  const operations = normalizeEntityOperations([{
    kind: "resolve",
    entityType: "service",
    match: {
      slug: "arenda-spectehniki"
    }
  }]);
  const client = {
    ...createBaseClient(),
    lookupEntity: async () => ({
      matched: true,
      entity: {
        id: "service_1",
        entityType: "service"
      },
      latestRevision: {
        id: "rev_service_1",
        state: "draft",
        payload: {
          slug: "arenda-spectehniki",
          equipmentIds: ["equipment_existing"]
        }
      },
      activePublishedRevision: {
        id: "rev_service_live",
        state: "published",
        payload: {
          slug: "arenda-spectehniki"
        }
      }
    })
  };

  const report = await runEntityOperations(client, operations, {
    execute: false
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.resolved, 1);
  assert.equal(report.summary.dryRun, undefined);
  assert.equal(report.items[0].action, "resolve");
  assert.equal(report.items[0].entity.id, "service_1");
  assert.equal(report.items[0].latestRevision.id, "rev_service_1");
  assert.deepEqual(report.items[0].payload.equipmentIds, ["equipment_existing"]);
});
