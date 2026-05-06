import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/[entityId]/normalize-test-fixture/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/page/entity_1/normalize-test-fixture", {
    method: "POST",
    body: formData
  });
}

test("legacy normalization route redirects with success message", async () => {
  const response = await POST(
    buildRequest({
      redirectTo: "/admin/entities/page/entity_1"
    }),
    { params: { entityType: "page", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      executeLegacyTestFixtureNormalization: async () => ({
        executed: true
      })
    }
  );

  assert.equal(response.status, 303);
  const successMessage = "Устаревший тестовый набор помечен как тестовый объект. Теперь можно переходить к удалению тестового графа.";
  assert.equal(
    response.headers.get("location"),
    `http://localhost:3000/admin/entities/page/entity_1?${new URLSearchParams({ message: successMessage }).toString()}`
  );
});

test("legacy normalization route redirects with readable refusal reason", async () => {
  const response = await POST(
    buildRequest({
      failureRedirectTo: "/admin/entities/service/entity_1/normalize-test-fixture"
    }),
    { params: { entityType: "service", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      executeLegacyTestFixtureNormalization: async () => ({
        executed: false,
        evaluation: {
          blockers: ["На объект ссылается опубликованная нетестовая страница."]
        }
      })
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/service/entity_1/normalize-test-fixture?error=%D0%9D%D0%B0+%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D1%81%D1%81%D1%8B%D0%BB%D0%B0%D0%B5%D1%82%D1%81%D1%8F+%D0%BE%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D0%B0%D1%8F+%D0%BD%D0%B5%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B0%D1%8F+%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0."
  );
});

test("legacy normalization route requires publish rights", async () => {
  const response = await POST(
    buildRequest(),
    { params: { entityType: "case", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "seo_manager" }, response: null }),
      userCanPublish: () => false,
      executeLegacyTestFixtureNormalization: async () => {
        throw new Error("should not execute");
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});
