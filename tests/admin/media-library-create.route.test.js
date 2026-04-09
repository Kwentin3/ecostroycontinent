import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/media/library/create/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();
  const file = new File(["binary"], "test-image.png", { type: "image/png" });

  formData.set("file", file);

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/media/library/create", {
    method: "POST",
    body: formData
  });
}

test("media create route marks explicit agent-test uploads", async () => {
  let captured = null;
  const response = await POST(
    buildRequest({ creationOrigin: "agent_test", title: "Media test" }),
    null,
    {
      requireRouteUser: async () => ({ user: { id: "user_1", username: "roman" }, response: null }),
      userCanEditContent: () => true,
      storeMediaFile: async () => {},
      deleteMediaFile: async () => {},
      saveDraft: async (input) => {
        captured = input;
        return { entity: { id: "media_1" } };
      },
      getMediaLibraryCard: async () => ({ id: "media_1" })
    }
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(captured.creationOrigin, "agent_test");
});

test("media create route keeps normal uploads unmarked", async () => {
  let captured = null;
  await POST(
    buildRequest({ title: "Media normal" }),
    null,
    {
      requireRouteUser: async () => ({ user: { id: "user_1", username: "roman" }, response: null }),
      userCanEditContent: () => true,
      storeMediaFile: async () => {},
      deleteMediaFile: async () => {},
      saveDraft: async (input) => {
        captured = input;
        return { entity: { id: "media_2" } };
      },
      getMediaLibraryCard: async () => ({ id: "media_2" })
    }
  );

  assert.equal(captured.creationOrigin, null);
});
