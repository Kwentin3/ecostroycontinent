import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/entities/[entityType]/save/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/entities/service/save", {
    method: "POST",
    body: formData
  });
}

test("entity save route forwards explicit agent test marker on create", async () => {
  let captured = null;
  const response = await POST(
    buildRequest({
      slug: "test-service",
      title: "Test service",
      h1: "Test service",
      summary: "Summary",
      serviceScope: "Scope",
      ctaVariant: "call",
      creationOrigin: "agent_test"
    }),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async (input) => {
        captured = input;
        return { entity: { id: "entity_1" } };
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(captured.creationOrigin, "agent_test");
});

test("entity save route keeps normal editor create unmarked", async () => {
  let captured = null;
  const response = await POST(
    buildRequest({
      slug: "normal-service",
      title: "Normal service",
      h1: "Normal service",
      summary: "Summary",
      serviceScope: "Scope",
      ctaVariant: "call"
    }),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async (input) => {
        captured = input;
        return { entity: { id: "entity_2" } };
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(captured.creationOrigin, null);
});
