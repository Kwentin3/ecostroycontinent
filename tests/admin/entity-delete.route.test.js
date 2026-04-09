import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/delete/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, String(item));
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/media_asset/delete", {
    method: "POST",
    body: formData
  });
}

test("delete route returns partial bulk-delete result with readable refusal reasons", async () => {
  const response = await POST(
    buildRequest({
      entityId: ["media_1", "media_2"],
      testOnly: "true",
      responseMode: "json"
    }),
    { params: { entityType: "media_asset" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      deleteEntityWithSafety: async ({ entityId }) => (
        entityId === "media_1"
          ? {
              deleted: true,
              entityId,
              decision: { entityId }
            }
          : {
              deleted: false,
              entityId,
              decision: { entityId },
              reasons: ["Объект используется в опубликованной странице."]
            }
      )
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 207);
  assert.equal(payload.deletedCount, 1);
  assert.equal(payload.refusedCount, 1);
  assert.deepEqual(payload.deletedIds, ["media_1"]);
  assert.equal(payload.refused[0].reason, "Объект используется в опубликованной странице.");
});

test("delete route redirects with refusal message for single delete", async () => {
  const response = await POST(
    buildRequest({
      entityId: "service_1",
      redirectTo: "/admin/entities/service",
      failureRedirectTo: "/admin/entities/service/service_1"
    }),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      deleteEntityWithSafety: async ({ entityId }) => ({
        deleted: false,
        entityId,
        decision: { entityId },
        reasons: ["Сущность опубликована и участвует в живом контуре."]
      })
    }
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/service/service_1");
  assert.equal(location.searchParams.get("error"), "Сущность опубликована и участвует в живом контуре.");
});
