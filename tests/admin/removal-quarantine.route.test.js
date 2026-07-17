import test from "node:test";
import assert from "node:assert/strict";

import { POST as markRemovalPost } from "../../app/api/admin/entities/[entityType]/[entityId]/mark-removal/route.js";
import { POST as unmarkRemovalPost } from "../../app/api/admin/entities/[entityType]/[entityId]/unmark-removal/route.js";
import { POST as bulkPurgeRemovalSweepPost } from "../../app/api/admin/removal-sweep/bulk-purge/route.js";
import { POST as purgeRemovalSweepPost } from "../../app/api/admin/removal-sweep/purge/route.js";
import { userCanExecuteRemovalSweep } from "../../lib/auth/roles.js";

function buildRequest(url, fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        for (const item of value) {
          formData.append(key, String(item));
        }
      } else {
        formData.set(key, String(value));
      }
    }
  }

  return new Request(url, {
    method: "POST",
    body: formData
  });
}

test("mark removal route delegates to the canonical audited command", async () => {
  let capturedInput = null;

  const response = await markRemovalPost(
    buildRequest("http://localhost/api/admin/entities/service/entity_1/mark-removal", {
      redirectTo: "/admin/entities/service/entity_1"
    }),
    { params: { entityType: "service", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      markEntityForRemovalWithAudit: async (input) => {
        capturedInput = input;
        return { status: "marked", entity: { id: input.entityId, entityType: input.entityType } };
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/service/entity_1?message=%D0%9E%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D0%BF%D0%BE%D0%BC%D0%B5%D1%87%D0%B5%D0%BD+%D0%BD%D0%B0+%D1%83%D0%B4%D0%B0%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5."
  );
  assert.deepEqual(capturedInput, {
    entityType: "service",
    entityId: "entity_1",
    actorUserId: "user_editor",
    removalNote: null
  });
});

test("mark removal route rejects unsupported entity types with readable error", async () => {
  const response = await markRemovalPost(
    buildRequest("http://localhost/api/admin/entities/global_settings/entity_1/mark-removal", {
      failureRedirectTo: "/admin/entities/global_settings/entity_1"
    }),
    { params: { entityType: "global_settings", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      markEntityForRemovalWithAudit: async () => {
        throw new Error("Этот тип сущности пока не поддерживает пометку удаления.");
      }
    }
  );

  const location = new URL(response.headers.get("location"));

  assert.equal(response.status, 303);
  assert.equal(location.searchParams.get("error"), "Этот тип сущности пока не поддерживает пометку удаления.");
});

test("unmark removal route clears mark and records audit evidence", async () => {
  let capturedClear = null;
  let capturedAudit = null;

  const response = await unmarkRemovalPost(
    buildRequest("http://localhost/api/admin/entities/case/entity_2/unmark-removal", {
      redirectTo: "/admin/entities/case/entity_2"
    }),
    { params: { entityType: "case", entityId: "entity_2" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      findEntityById: async () => ({
        id: "entity_2",
        entityType: "case",
        markedForRemovalAt: "2026-04-19T10:00:00.000Z"
      }),
      clearEntityRemovalMark: async (entityId, actorUserId) => {
        capturedClear = { entityId, actorUserId };
        return { id: entityId, entityType: "case" };
      },
      recordAuditEvent: async (input) => {
        capturedAudit = input;
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/case/entity_2?message=%D0%9F%D0%BE%D0%BC%D0%B5%D1%82%D0%BA%D0%B0+%D1%83%D0%B4%D0%B0%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F+%D1%81%D0%BD%D1%8F%D1%82%D0%B0."
  );
  assert.deepEqual(capturedClear, {
    entityId: "entity_2",
    actorUserId: "user_editor"
  });
  assert.equal(capturedAudit.eventKey, "removal_unmarked");
});

test("removal sweep purge route is superadmin-only and revalidates affected admin paths", async () => {
  const revalidated = [];

  const response = await purgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/purge", {
      entityType: "service",
      entityId: "service_1",
      redirectTo: "/admin/removal-sweep"
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_super", role: "superadmin" }, response: null }),
      userCanRunMaintenancePurge: () => true,
      executeRemovalSweep: async () => ({
        deleted: [
          { entityType: "service", entityId: "service_1", label: "Service 1" },
          { entityType: "media_asset", entityId: "media_1", label: "Media 1" }
        ]
      }),
      revalidatePath: (path) => {
        revalidated.push(path);
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/removal-sweep?message=%D0%9F%D0%BE%D0%BC%D0%B5%D1%87%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9+%D0%B3%D1%80%D0%B0%D1%84+%D0%BE%D1%87%D0%B8%D1%89%D0%B5%D0%BD."
  );
  assert.deepEqual(revalidated.sort(), [
    "/admin",
    "/admin/entities/media_asset",
    "/admin/entities/service",
    "/admin/removal-sweep"
  ]);
});

test("removal sweep purge route rejects non-superadmin users", async () => {
  const response = await purgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/purge", {
      entityType: "service",
      entityId: "service_1"
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanRunMaintenancePurge: () => false,
      executeRemovalSweep: async () => {
        throw new Error("should not execute");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});

test("bulk purge preview returns exact ready and blocked counts without mutation", async () => {
  let capturedInput = null;

  const response = await bulkPurgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/bulk-purge", {
      intent: "preview",
      componentKey: ["service:service_1", "media_asset:media_1"]
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "owner_1", role: "business_owner" }, response: null }),
      userCanExecuteRemovalSweep,
      previewRemovalSweepBatch: async (input) => {
        capturedInput = input;
        return {
          selectedRootCount: 2,
          componentCount: 2,
          readyComponentCount: 1,
          readyObjectCount: 2,
          blockedComponentCount: 1,
          blockedObjectCount: 1,
          readyComponents: [],
          blockedComponents: []
        };
      },
      executeRemovalSweepBatch: async () => {
        throw new Error("execute must not run during preview");
      },
      revalidatePath: () => {}
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.intent, "preview");
  assert.equal(payload.readyObjectCount, 2);
  assert.deepEqual(capturedInput, {
    roots: [
      { entityType: "service", entityId: "service_1" },
      { entityType: "media_asset", entityId: "media_1" }
    ]
  });
});

test("business owner bulk purge returns terminal 207 with deleted and skipped groups", async () => {
  const revalidated = [];
  let capturedInput = null;

  const response = await bulkPurgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/bulk-purge", {
      intent: "execute",
      componentKey: ["service:service_1", "service:service_2"]
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "owner_1", role: "business_owner" }, response: null }),
      userCanExecuteRemovalSweep,
      previewRemovalSweepBatch: async () => {
        throw new Error("preview route helper must not replace execute");
      },
      executeRemovalSweepBatch: async (input) => {
        capturedInput = input;
        return {
          selectedRootCount: 2,
          deletedComponentCount: 1,
          deletedObjectCount: 2,
          failedComponentCount: 1,
          deletedComponents: [
            {
              componentKey: "service:service_1|media_asset:media_1",
              root: { entityType: "service", entityId: "service_1", label: "Service 1" },
              deleted: [
                { entityType: "service", entityId: "service_1" },
                { entityType: "media_asset", entityId: "media_1" }
              ],
              deletedCount: 2
            }
          ],
          failedComponents: [
            {
              componentKey: "service:service_2",
              root: { entityType: "service", entityId: "service_2", label: "Service 2" },
              error: "Используется в опубликованном материале.",
              blockers: []
            }
          ]
        };
      },
      revalidatePath: (path) => revalidated.push(path)
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 207);
  assert.equal(payload.ok, false);
  assert.equal(payload.deletedComponentCount, 1);
  assert.equal(payload.failedComponentCount, 1);
  assert.equal(payload.deletedObjectCount, 2);
  assert.deepEqual(capturedInput, {
    roots: [
      { entityType: "service", entityId: "service_1" },
      { entityType: "service", entityId: "service_2" }
    ],
    actorUserId: "owner_1"
  });
  assert.deepEqual(revalidated.sort(), [
    "/admin",
    "/admin/entities/media_asset",
    "/admin/entities/service",
    "/admin/removal-sweep"
  ]);
});

test("bulk purge route rejects users without execute permission and invalid selection", async () => {
  const forbiddenResponse = await bulkPurgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/bulk-purge", {
      intent: "execute",
      componentKey: ["service:service_1"]
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanExecuteRemovalSweep
    }
  );
  const forbiddenPayload = await forbiddenResponse.json();

  assert.equal(forbiddenResponse.status, 403);
  assert.equal(forbiddenPayload.ok, false);
  assert.match(forbiddenPayload.error, /нет права/i);

  const invalidResponse = await bulkPurgeRemovalSweepPost(
    buildRequest("http://localhost/api/admin/removal-sweep/bulk-purge", {
      intent: "preview",
      componentKey: ["unsupported:entity_1"]
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_super", role: "superadmin" }, response: null }),
      userCanExecuteRemovalSweep
    }
  );
  const invalidPayload = await invalidResponse.json();

  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidPayload.ok, false);
  assert.match(invalidPayload.error, /неподдерживаемая карточка/i);
});
