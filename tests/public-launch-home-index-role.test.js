import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("home route behaves as launch hub and is not admin-centric", () => {
  const homeSource = readSource("../app/page.js");

  assert.match(homeSource, /getPublishedCases/);
  assert.match(homeSource, /getPlaceholderCases/);
  assert.match(homeSource, /href="\/services"/);
  assert.match(homeSource, /href="\/cases"/);
  assert.match(homeSource, /href="\/contacts"/);
  assert.equal(homeSource.includes("/admin/login"), false);
});

test("services and cases indexes declare detail-entry and next-step contracts", () => {
  const servicesIndex = readSource("../app/services/page.js");
  const casesIndex = readSource("../app/cases/page.js");

  assert.match(servicesIndex, /itemHrefPrefix="\/services"/);
  assert.match(servicesIndex, /nextStepTitle=/);
  assert.match(servicesIndex, /nextStepPrimaryHref="\/contacts"/);

  assert.match(casesIndex, /itemHrefPrefix="\/cases"/);
  assert.match(casesIndex, /nextStepTitle=/);
  assert.match(casesIndex, /nextStepPrimaryHref="\/services"/);
});

test("public list renderer supports empty-state and next-step sections", () => {
  const rendererSource = readSource("../components/public/PublicRenderers.js");

  assert.match(rendererSource, /emptyTitle/);
  assert.match(rendererSource, /preview-list-next-steps/);
  assert.match(rendererSource, /nextStepPrimaryHref/);
  assert.match(rendererSource, /nextStepSecondaryHref/);
});
