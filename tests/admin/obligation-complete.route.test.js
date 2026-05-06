import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/obligations/[obligationId]/complete/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/obligations/obligation_1/complete", {
    method: "POST",
    body: formData
  });
}

test("obligation complete route revalidates follow-up paths", async () => {
  const revalidated = [];
  const response = await POST(
    buildRequest({
      redirectTo: "/admin/entities/service/entity_1"
    }),
    { params: { obligationId: "obligation_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_1", role: "superadmin" }, response: null }),
      userCanPublish: () => true,
      getString: (formData, key) => formData.get(key)?.toString() ?? "",
      completePublishObligation: async () => ({
        publishFollowUp: {
          revalidationPaths: ["/services", "/sitemap.xml"]
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
  assert.deepEqual(revalidated, ["/services", "/sitemap.xml"]);
});

test("obligation complete route rejects non-publish users", async () => {
  const response = await POST(
    buildRequest(),
    { params: { obligationId: "obligation_1" } },
    {
      requireRouteUser: async () => ({ user: { id: "user_2", role: "seo_manager" }, response: null }),
      userCanPublish: () => false,
      getString: () => "",
      completePublishObligation: async () => {
        throw new Error("should not run");
      },
      revalidatePath: () => {}
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});
