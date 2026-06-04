import test from "node:test";
import assert from "node:assert/strict";

import { computeContentFingerprint, stringifyContentPayload } from "../../lib/content-core/fingerprint.js";

test("content fingerprint is stable for object key order", () => {
  const left = {
    title: "Аренда техники",
    seo: {
      metaDescription: "Описание",
      metaTitle: "Заголовок"
    }
  };
  const right = {
    seo: {
      metaTitle: "Заголовок",
      metaDescription: "Описание"
    },
    title: "Аренда техники"
  };

  assert.equal(stringifyContentPayload(left), stringifyContentPayload(right));
  assert.equal(computeContentFingerprint(left), computeContentFingerprint(right));
});

test("content fingerprint changes for punctuation edits in published content", () => {
  const before = {
    serviceScope: "Земляные работы демонтаж планировка"
  };
  const after = {
    serviceScope: "Земляные работы, демонтаж планировка"
  };

  assert.notEqual(computeContentFingerprint(before), computeContentFingerprint(after));
});
