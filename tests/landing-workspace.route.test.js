import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/admin/workspace/landing/[pageId]/route.js";

function buildRequest() {
  return new Request("http://localhost/api/admin/workspace/landing/page_1", {
    method: "POST"
  });
}

test("legacy landing workspace route redirects callers into the Pages domain instead of saving", async () => {
  const captured = {};
  const response = await POST(
    buildRequest(),
    { params: { pageId: "page_1" } },
    {
      requireRouteUser: async () => ({
        user: {
          id: "user_1",
          role: "seo_manager"
        },
        response: null
      }),
      userCanEditContent: () => true,
      redirectWithError: (_request, path, error) => {
        captured.path = path;
        captured.error = error.message;

        return Response.redirect(`http://localhost${path}?error=${encodeURIComponent(error.message)}`, 303);
      }
    }
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/page/page_1");
  assert.equal(
    location.searchParams.get("error"),
    "AI-верстка больше не поддерживает отдельный write-path. Откройте страницу в домене «Страницы» и продолжайте работу там."
  );
  assert.equal(captured.path, "/admin/entities/page/page_1");
  assert.match(captured.error, /не поддерживает отдельный write-path/i);
});
