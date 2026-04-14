import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../../app/api/admin/entities/[entityType]/lookup/route.js";

function buildRequest(query = "") {
  return new Request(`http://localhost/api/admin/entities/service/lookup${query}`, {
    method: "GET"
  });
}

test("entity lookup route finds entity by slug", async () => {
  const response = await GET(
    buildRequest("?slug=soil-removal"),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      listEntityCards: async () => ([
        {
          entity: { id: "service_1" },
          latestRevision: {
            payload: {
              slug: "soil-removal",
              title: "Soil removal"
            }
          }
        }
      ]),
      getEntityEditorState: async () => ({
        entity: { id: "service_1", entityType: "service" },
        revisions: [
          {
            id: "rev_1",
            revisionNumber: 3,
            state: "draft",
            payload: { slug: "soil-removal", title: "Soil removal" }
          }
        ],
        activePublishedRevision: {
          id: "rev_0",
          revisionNumber: 2,
          state: "published",
          payload: { slug: "soil-removal", title: "Published soil removal" }
        }
      })
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.matched, true);
  assert.equal(payload.entity.id, "service_1");
  assert.equal(payload.latestRevision.payload.slug, "soil-removal");
});

test("entity lookup route returns unmatched payload when entity is missing", async () => {
  const response = await GET(
    buildRequest("?slug=missing"),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      listEntityCards: async () => [],
      getEntityEditorState: async () => null
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.matched, false);
  assert.equal(payload.matcher.slug, "missing");
});

test("entity lookup route blocks ambiguous matches", async () => {
  const response = await GET(
    buildRequest("?slug=duplicate"),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      listEntityCards: async () => ([
        {
          entity: { id: "service_1" },
          latestRevision: { payload: { slug: "duplicate", title: "First" } }
        },
        {
          entity: { id: "service_2" },
          latestRevision: { payload: { slug: "duplicate", title: "Second" } }
        }
      ]),
      getEntityEditorState: async () => null
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 409);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "AMBIGUOUS_ENTITY_MATCH");
  assert.equal(payload.candidates.length, 2);
});

test("entity lookup route allows pageType matcher only for pages", async () => {
  const response = await GET(
    buildRequest("?pageType=about"),
    { params: { entityType: "service" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1" }, response: null }),
      userCanEditContent: () => true,
      listEntityCards: async () => [],
      getEntityEditorState: async () => null
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "PAGE_TYPE_MATCHER_UNSUPPORTED");
});
