import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/revisions/[revisionId]/submit/route.js";
import { FEEDBACK_COPY } from "../../lib/ui-copy.js";

function buildRequest(returnTo = "") {
  const formData = new FormData();

  if (returnTo) {
    formData.set("returnTo", returnTo);
  }

  return new Request("http://localhost/api/admin/revisions/rev_1/submit", {
    method: "POST",
    body: formData
  });
}

function buildDeps({ ownerReviewRequired = false, submitError = null } = {}) {
  return {
    requireRouteUser: async () => ({
      user: {
        id: "user_1",
        role: "superadmin"
      },
      response: null
    }),
    normalizeAdminReturnTo: (value) => (typeof value === "string" && value.startsWith("/admin") ? value : ""),
    FEEDBACK_COPY,
    redirectToAdmin: (pathname) => Response.redirect(`http://localhost${pathname}`, 303),
    redirectWithQuery: (_request, pathname, query = {}) => {
      const url = new URL(pathname, "http://localhost");

      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      }

      return Response.redirect(url, 303);
    },
    redirectWithError: (_request, pathname, error) => {
      const url = new URL(pathname, "http://localhost");
      url.searchParams.set("error", error.message);
      return Response.redirect(url, 303);
    },
    submitRevisionForReview: async (input) => {
      if (submitError) {
        throw submitError;
      }

      return {
        revision: {
          id: input.revisionId,
          state: "review",
          ownerReviewRequired
        }
      };
    },
    userCanEditContent: () => true
  };
}

test("submit route returns the operator to the source screen when owner action is not required", async () => {
  const response = await POST(
    buildRequest("/admin/entities/media_asset?asset=media_1"),
    { params: { revisionId: "rev_1" } },
    buildDeps({ ownerReviewRequired: false })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/media_asset");
  assert.equal(location.searchParams.get("asset"), "media_1");
  assert.equal(location.searchParams.get("message"), FEEDBACK_COPY.readyToPublish);
});

test("submit route still opens review when owner action is required", async () => {
  const response = await POST(
    buildRequest("/admin/entities/media_asset?asset=media_1"),
    { params: { revisionId: "rev_1" } },
    buildDeps({ ownerReviewRequired: true })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/rev_1");
  assert.equal(location.searchParams.get("message"), FEEDBACK_COPY.reviewSubmitted);
});

test("submit route returns errors back to the source screen when returnTo is present", async () => {
  const response = await POST(
    buildRequest("/admin/entities/media_asset?asset=media_1"),
    { params: { revisionId: "rev_1" } },
    buildDeps({
      submitError: new Error("Broken references block review submission.")
    })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/media_asset");
  assert.equal(location.searchParams.get("asset"), "media_1");
  assert.equal(location.searchParams.get("error"), "Broken references block review submission.");
});
