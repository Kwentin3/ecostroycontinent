import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSlug, transliterateToLatin } from "../lib/utils/slug.js";

test("normalizeSlug transliterates Russian titles into latin route slugs", () => {
  assert.equal(normalizeSlug("Аренда спецтехники"), "arenda-spetstekhniki");
  assert.equal(normalizeSlug("Строительство домов под ключ"), "stroitelstvo-domov-pod-klyuch");
});

test("normalizeSlug keeps manual latin edits while removing unsafe characters", () => {
  assert.equal(normalizeSlug(" custom_URL 2026! "), "custom-url-2026");
  assert.equal(normalizeSlug("/services/Аренда спецтехники/"), "services-arenda-spetstekhniki");
});

test("transliterateToLatin exposes the shared UI/server transliteration base", () => {
  assert.equal(transliterateToLatin("Щебень и Юг"), "shcheben i yug");
});
