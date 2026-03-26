import test from "node:test";
import assert from "node:assert/strict";

import { redirectToAdmin, redirectWithQuery } from "../lib/admin/operation-feedback.js";

test("admin redirects from POST handlers use 303 See Other", () => {
  const response = redirectToAdmin("/admin/no-access");

  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get("location")).pathname, "/admin/no-access");
});

test("redirectWithQuery preserves query parameters and uses 303 See Other", () => {
  const response = redirectWithQuery(null, "/admin/entities/media_asset", {
    message: "Медиафайл загружен.",
    entityId: "entity_123"
  });

  const location = new URL(response.headers.get("location"));

  assert.equal(response.status, 303);
  assert.equal(location.pathname, "/admin/entities/media_asset");
  assert.equal(location.searchParams.get("message"), "Медиафайл загружен.");
  assert.equal(location.searchParams.get("entityId"), "entity_123");
});
