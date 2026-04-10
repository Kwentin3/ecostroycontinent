import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/[entityId]/live-deactivation/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/page/entity_1/live-deactivation", {
    method: "POST",
    body: formData
  });
}

test("live deactivation route redirects with success and revalidates paths", async () => {
  const revalidated = [];
  const response = await POST(
    buildRequest({
      redirectTo: "/admin/entities/page/entity_1"
    }),
    { params: { entityType: "page", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      executeLiveDeactivation: async () => ({
        executed: true,
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

test("live deactivation route falls back to media workspace redirect for media assets", async () => {
  const response = await POST(
    buildRequest(),
    { params: { entityType: "media_asset", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      executeLiveDeactivation: async () => ({
        executed: true,
        revalidationPaths: []
      }),
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/media_asset?asset=entity_1&message=%D0%9E%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D1%81%D0%BD%D1%8F%D1%82+%D1%81+%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%B8."
  );
});

test("live deactivation route redirects with readable refusal reason", async () => {
  const response = await POST(
    buildRequest({
      failureRedirectTo: "/admin/entities/service/entity_1/live-deactivation"
    }),
    { params: { entityType: "service", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      executeLiveDeactivation: async () => ({
        executed: false,
        evaluation: {
          blockers: ["На сущность ссылается опубликованная страница."]
        }
      }),
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/service/entity_1/live-deactivation?error=%D0%9D%D0%B0+%D1%81%D1%83%D1%89%D0%BD%D0%BE%D1%81%D1%82%D1%8C+%D1%81%D1%81%D1%8B%D0%BB%D0%B0%D0%B5%D1%82%D1%81%D1%8F+%D0%BE%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D0%B0%D1%8F+%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0."
  );
});

test("live deactivation route requires publish rights", async () => {
  const response = await POST(
    buildRequest(),
    { params: { entityType: "case", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "seo_manager" }, response: null }),
      userCanPublish: () => false,
      executeLiveDeactivation: async () => {
        throw new Error("should not execute");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});
