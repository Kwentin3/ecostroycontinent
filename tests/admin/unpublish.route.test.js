import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/[entityId]/unpublish/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/page/entity_1/unpublish", {
    method: "POST",
    body: formData
  });
}

test("unpublish route lets seo unpublish and revalidates returned paths", async () => {
  const revalidated = [];
  const response = await POST(
    buildRequest({
      redirectTo: "/admin/entities/page/entity_1"
    }),
    { params: { entityType: "page", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanUnpublish: (user, entityType) => user.role === "seo_manager" && entityType === "page",
      executeUnpublish: async () => ({
        executed: true,
        evaluation: {
          allowed: true
        },
        revalidationPaths: ["/about"]
      }),
      revalidatePath: (path) => {
        revalidated.push(path);
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/entities/page/entity_1?message=%D0%9E%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D1%81%D0%BD%D1%8F%D1%82+%D1%81+%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%B8.");
  assert.deepEqual(revalidated, ["/about"]);
});

test("unpublish route returns terminal json success for media assets", async () => {
  const response = await POST(
    buildRequest({
      responseMode: "json"
    }),
    { params: { entityType: "media_asset", entityId: "media_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanUnpublish: () => true,
      executeUnpublish: async () => ({
        executed: true,
        evaluation: {
          allowed: true,
          entityType: "media_asset",
          entityId: "media_1"
        },
        revalidationPaths: []
      }),
      revalidatePath: () => {
        throw new Error("media unpublish should not revalidate empty paths");
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    ok: true,
    message: "Объект снят с публикации.",
    evaluation: {
      allowed: true,
      entityType: "media_asset",
      entityId: "media_1"
    },
    revalidationPaths: []
  });
});

test("unpublish route blocks users without unpublish rights", async () => {
  const response = await POST(
    buildRequest(),
    { params: { entityType: "case", entityId: "case_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "owner_1", role: "business_owner" }, response: null }),
      userCanUnpublish: () => false,
      executeUnpublish: async () => {
        throw new Error("should not execute");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});

test("unpublish route returns terminal json conflict when contract blocks", async () => {
  const response = await POST(
    buildRequest({
      responseMode: "json"
    }),
    { params: { entityType: "service", entityId: "service_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userCanUnpublish: () => true,
      executeUnpublish: async () => ({
        executed: false,
        evaluation: {
          allowed: false,
          blockers: ["Сущность уже снята с публикации."]
        },
        revalidationPaths: []
      }),
      revalidatePath: () => {
        throw new Error("blocked unpublish should not revalidate");
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 409);
  assert.deepEqual(payload, {
    ok: false,
    error: "Сущность уже снята с публикации.",
    evaluation: {
      allowed: false,
      blockers: ["Сущность уже снята с публикации."]
    }
  });
});
