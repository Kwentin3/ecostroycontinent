import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/admin/revisions/[revisionId]/submit/route.js";
import { buildEntityPayload } from "../../lib/admin/entity-form-data.js";
import { FEEDBACK_COPY } from "../../lib/ui-copy.js";

function buildRequest(returnTo = "", fields = {}) {
  const formData = new FormData();

  if (returnTo) {
    formData.set("returnTo", returnTo);
  }

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
      continue;
    }

    formData.set(key, value);
  }

  return new Request("http://localhost/api/admin/revisions/rev_1/submit", {
    method: "POST",
    body: formData
  });
}

function buildDeps({ ownerReviewRequired = false, submitError = null, submissionStatus = "submitted", returnedRevisionId = "rev_1" } = {}) {
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
          id: returnedRevisionId || input.revisionId,
          state: "review",
          ownerReviewRequired
        },
        submissionStatus
      };
    },
    userCanEditContent: () => true
  };
}

test("submit route opens review even when the saved draft did not require owner review yet", async () => {
  const response = await POST(
    buildRequest("/admin/entities/media_asset?asset=media_1"),
    { params: { revisionId: "rev_1" } },
    buildDeps({ ownerReviewRequired: false })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/rev_1");
  assert.equal(location.searchParams.get("message"), FEEDBACK_COPY.reviewSubmitted);
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

test("submit route opens the existing review when identical content is already submitted", async () => {
  const response = await POST(
    buildRequest("/admin/entities/service/entity_1"),
    { params: { revisionId: "rev_1" } },
    buildDeps({
      submissionStatus: "duplicate",
      returnedRevisionId: "rev_existing"
    })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/rev_existing");
  assert.equal(location.searchParams.get("message"), FEEDBACK_COPY.reviewAlreadySubmitted);
});

test("submit route reports when a newer request replaces the previous review request", async () => {
  const response = await POST(
    buildRequest("/admin/entities/service/entity_1"),
    { params: { revisionId: "rev_2" } },
    buildDeps({
      submissionStatus: "updated",
      returnedRevisionId: "rev_2"
    })
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/rev_2");
  assert.equal(location.searchParams.get("message"), FEEDBACK_COPY.reviewUpdated);
});

test("submit route saves posted editor fields before sending the draft to review", async () => {
  let savedInput = null;
  let submittedRevisionId = null;
  const response = await POST(
    buildRequest("/admin/entities/global_settings/settings_1", {
      intent: "save_and_submit",
      changeIntent: "Уточнили основной телефон.",
      publicBrandName: "Экостройконтинент",
      legalName: "ООО Экостройконтинент",
      primaryPhone: "+7 999 111 22 33",
      publicEmail: "info@example.test",
      serviceArea: "Москва и область",
      contactTruthConfirmed: "on"
    }),
    { params: { revisionId: "rev_1" } },
    {
      ...buildDeps({ returnedRevisionId: "rev_saved" }),
      buildEntityPayload,
      findRevisionById: async () => ({
        id: "rev_1",
        entityId: "settings_1",
        state: "draft",
        revisionNumber: 3,
        changeIntent: "Предыдущий черновик.",
        payload: {}
      }),
      findEntityById: async () => ({
        id: "settings_1",
        entityType: "global_settings"
      }),
      saveDraft: async (input) => {
        savedInput = input;
        return {
          entity: { id: "settings_1", entityType: "global_settings" },
          revision: { id: "rev_saved", state: "draft" }
        };
      },
      submitRevisionForReview: async (input) => {
        submittedRevisionId = input.revisionId;
        return {
          revision: {
            id: input.revisionId,
            state: "review"
          },
          submissionStatus: "submitted"
        };
      }
    }
  );
  const location = new URL(response.headers.get("location"), "http://localhost");

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/review/rev_saved");
  assert.equal(savedInput.entityType, "global_settings");
  assert.equal(savedInput.entityId, "settings_1");
  assert.equal(savedInput.changeIntent, "Уточнили основной телефон.");
  assert.equal(savedInput.payload.primaryPhone, "+7 999 111 22 33");
  assert.equal(savedInput.payload.contactTruthConfirmed, true);
  assert.equal(submittedRevisionId, "rev_saved");
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
