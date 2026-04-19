import test from "node:test";
import assert from "node:assert/strict";

import { POST as markRemovalPost } from "../../app/api/admin/entities/[entityType]/[entityId]/mark-removal/route.js";
import { POST as unmarkRemovalPost } from "../../app/api/admin/entities/[entityType]/[entityId]/unmark-removal/route.js";
import { POST as purgeRemovalSweepPost } from "../../app/api/admin/removal-sweep/purge/route.js";

function buildRequest(url, fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request(url, {
    method: "POST",
    body: formData
  });
}

test("mark removal route marks supported entity and records audit evidence", async () => {
  let capturedMark = null;
  let capturedAudit = null;

  const response = await markRemovalPost(
    buildRequest("http://localhost/api/admin/entities/service/entity_1/mark-removal", {
      redirectTo: "/admin/entities/service/entity_1"
    }),
    { params: { entityType: "service", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_editor", role: "seo_manager" }, response: null }),
      userCanEditContent: () => true,
      findEntityById: async () => ({
        id: "entity_1",
        entityType: "service",
        markedForRemovalAt: null
      }),
      markEntityForRemoval: async (entityId, actorUserId, note) => {
        capturedMark = { entityId, actorUserId, note };
        return { id: entityId, entityType: "service" };
      },
      recordAuditEvent: async (input) => {
        capturedAudit = input;
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/service/entity_1?message=%D0%9E%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D0%BF%D0%BE%D0%BC%D0%B5%D1%87%D0%B5%D0%BD+%D0%BD%D0%B0+%D1%83%D0%B4%D0%B0%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5."
  );
  assert.deepEqual(capturedMark, {
    entityId: "entity_1",
    actorUserId: "user_editor",
    note: null
  });
  assert.equal(capturedAudit.eventKey, "removal_marked");
  assert.equal(capturedAudit.entityId, "entity_1");
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
      findEntityById: async () => ({
        id: "entity_1",
        entityType: "global_settings",
        markedForRemovalAt: null
      }),
      markEntityForRemoval: async () => {
        throw new Error("should not execute");
      },
      recordAuditEvent: async () => {}
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
      userIsSuperadmin: () => true,
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
      userIsSuperadmin: () => false,
      executeRemovalSweep: async () => {
        throw new Error("should not execute");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});
