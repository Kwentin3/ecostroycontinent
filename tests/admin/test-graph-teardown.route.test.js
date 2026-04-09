import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/[entityId]/test-graph-teardown/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/page/entity_1/test-graph-teardown", {
    method: "POST",
    body: formData
  });
}

test("test graph teardown route redirects with success after execution", async () => {
  const response = await POST(
    buildRequest({
      redirectTo: "/admin/entities/page"
    }),
    { params: { entityType: "page", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      executeTestGraphTeardown: async () => ({
        executed: true,
        deletedCount: 3
      })
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/entities/page?message=%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B9+%D0%B3%D1%80%D0%B0%D1%84+%D1%83%D0%B4%D0%B0%D0%BB%D1%91%D0%BD%3A+3.");
});

test("test graph teardown route redirects with readable refusal when graph is mixed", async () => {
  const response = await POST(
    buildRequest({
      failureRedirectTo: "/admin/entities/page/entity_1/test-graph-teardown"
    }),
    { params: { entityType: "page", entityId: "entity_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      executeTestGraphTeardown: async () => ({
        executed: false,
        evaluation: {
          blockers: ["На тестовый объект ссылается опубликованная нетестовая страница."]
        }
      })
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/page/entity_1/test-graph-teardown?error=%D0%9D%D0%B0+%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B9+%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82+%D1%81%D1%81%D1%8B%D0%BB%D0%B0%D0%B5%D1%82%D1%81%D1%8F+%D0%BE%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D0%B0%D1%8F+%D0%BD%D0%B5%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B0%D1%8F+%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0."
  );
});
