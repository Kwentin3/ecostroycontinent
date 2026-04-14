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

test("entity save route forwards explicit agent test marker for page create", async () => {
  let captured = null;
  const response = await POST(
    buildRequest({
      pageType: "about",
      title: "Test page",
      h1: "Test page",
      intro: "Intro",
      creationOrigin: "agent_test"
    }),
    { params: { entityType: "page" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async (input) => {
        captured = input;
        return { entity: { id: "entity_page_1" } };
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(captured.creationOrigin, "agent_test");
});

test("entity save route can redirect freshly created page into the unified workspace", async () => {
  const response = await POST(
    buildRequest({
      pageType: "about",
      title: "Company",
      h1: "Company",
      redirectMode: "page_workspace",
      failureRedirectTo: "/admin/entities/page?create=1"
    }),
    { params: { entityType: "page" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async () => ({ entity: { id: "page_77" } })
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/entities/page/page_77?message=%D0%A7%D0%B5%D1%80%D0%BD%D0%BE%D0%B2%D0%B8%D0%BA+%D1%81%D0%BE%D1%85%D1%80%D0%B0%D0%BD%D1%91%D0%BD.");
});

test("entity save route returns JSON payload for operator mode", async () => {
  const response = await POST(
    buildRequest({
      slug: "service-json",
      title: "JSON service",
      h1: "JSON service",
      summary: "Summary",
      serviceScope: "Scope",
      ctaVariant: "call",
      responseMode: "json"
    }),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async () => ({
        entity: { id: "entity_json_1", entityType: "service" },
        revision: { id: "rev_json_1", state: "draft" },
        changedFields: ["title", "slug"]
      })
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.entity.id, "entity_json_1");
  assert.deepEqual(payload.changedFields, ["title", "slug"]);
  assert.equal(payload.redirectTo, "/admin/entities/service/entity_json_1");
});

test("entity save route returns JSON errors for operator mode", async () => {
  const response = await POST(
    buildRequest({
      slug: "service-json",
      title: "JSON service",
      h1: "JSON service",
      summary: "Summary",
      serviceScope: "Scope",
      ctaVariant: "call",
      responseMode: "json"
    }),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async () => {
        throw new Error("slug collision blocks publish");
      }
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Публикацию блокирует конфликт короткого адреса.");
});

test("entity save route returns registry-native fallback when page creation fails", async () => {
  const response = await POST(
    buildRequest({
      pageType: "contacts",
      title: "Contact center",
      h1: "Contact center",
      redirectMode: "page_workspace",
      failureRedirectTo: "/admin/entities/page?create=1"
    }),
    { params: { entityType: "page" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      saveDraft: async () => {
        throw new Error("page type collision");
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "http://localhost:3000/admin/entities/page?create=1&error=page+type+collision&createPageType=contacts&createMode=standalone&createTitle=Contact+center"
  );
});
