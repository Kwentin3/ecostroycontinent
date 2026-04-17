import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/revisions/[revisionId]/publish/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/revisions/rev_1/publish", {
    method: "POST",
    body: formData
  });
}

test("publish route revalidates follow-up paths after successful publish", async () => {
  const revalidated = [];

  const response = await POST(
    buildRequest(),
    { params: { revisionId: "rev_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      findRevisionById: async () => ({ id: "rev_1", entityId: "entity_1", state: "review" }),
      findEntityById: async () => ({ id: "entity_1", entityType: "service" }),
      userCanPublishRevision: () => true,
      publishRevision: async () => ({
        entity: { id: "entity_1", entityType: "service" },
        publishFollowUp: {
          revalidationPaths: ["/services", "/services/new", "/sitemap.xml"]
        }
      }),
      revalidatePath: (path) => {
        revalidated.push(path);
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location")?.startsWith("http://localhost:3000/admin/entities/service/entity_1?message="),
    true
  );
  assert.deepEqual(revalidated, ["/services", "/services/new", "/sitemap.xml"]);
});

test("publish route redirects to no-access when role cannot publish", async () => {
  const response = await POST(
    buildRequest(),
    { params: { revisionId: "rev_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_2", role: "seo_manager" }, response: null }),
      findRevisionById: async () => ({ id: "rev_1", entityId: "entity_1", state: "review" }),
      findEntityById: async () => ({ id: "entity_1", entityType: "service" }),
      userCanPublishRevision: () => false,
      publishRevision: async () => {
        throw new Error("publish should not run");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});
