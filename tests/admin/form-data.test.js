import test from "node:test";
import assert from "node:assert/strict";

import { getBoolean } from "../../lib/admin/form-data.js";

function buildFormData(value) {
  const formData = new FormData();

  if (value !== undefined) {
    formData.set("flag", value);
  }

  return formData;
}

test("getBoolean accepts explicit truthy checkbox tokens", () => {
  assert.equal(getBoolean(buildFormData("on"), "flag"), true);
  assert.equal(getBoolean(buildFormData("true"), "flag"), true);
  assert.equal(getBoolean(buildFormData("yes"), "flag"), true);
  assert.equal(getBoolean(buildFormData("1"), "flag"), true);
});

test("getBoolean rejects missing and unknown tokens", () => {
  assert.equal(getBoolean(buildFormData(undefined), "flag"), false);
  assert.equal(getBoolean(buildFormData(""), "flag"), false);
  assert.equal(getBoolean(buildFormData("no"), "flag"), false);
  assert.equal(getBoolean(buildFormData("false"), "flag"), false);
});
