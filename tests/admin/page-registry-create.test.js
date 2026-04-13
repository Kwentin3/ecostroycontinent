import test from "node:test";
import assert from "node:assert/strict";

import { buildRegistryCreateState } from "../../lib/admin/page-registry-create.js";

test("registry create state reopens the create modal and preserves echoed fields", () => {
  const state = buildRegistryCreateState({
    create: "1",
    createPageType: "contacts",
    createTitle: "Contact center",
    error: "page type collision"
  });

  assert.deepEqual(state, {
    open: true,
    mode: "standalone",
    pageType: "contacts",
    primaryServiceId: "",
    primaryEquipmentId: "",
    cloneFromPageId: "",
    title: "Contact center",
    error: "page type collision"
  });
});

test("registry create state stays closed and falls back to safe defaults when echo params are absent", () => {
  const state = buildRegistryCreateState({
    error: "outside error"
  });

  assert.deepEqual(state, {
    open: false,
    mode: "standalone",
    pageType: "about",
    primaryServiceId: "",
    primaryEquipmentId: "",
    cloneFromPageId: "",
    title: "",
    error: ""
  });
});
