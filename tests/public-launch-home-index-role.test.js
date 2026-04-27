import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("home route behaves as service rental landing and is not admin-centric", () => {
  const homeSource = readSource("../app/page.js");

  assert.match(homeSource, /PRIMARY_SERVICE_SLUG = "arenda-tehniki"/);
  assert.match(homeSource, /getPublishedServiceBySlug/);
  assert.match(homeSource, /buildEquipmentCardsSectionModel/);
  assert.match(homeSource, /EquipmentCardsSection/);
  assert.match(homeSource, /rotateItemsByDay/);
  assert.match(homeSource, /hasMoreServices/);
  assert.match(homeSource, /preview-home-services/);
  assert.match(homeSource, /hasPublishedCases/);
  assert.match(homeSource, /showCasesNav=\{hasPublishedCases\}/);
  assert.match(homeSource, /preview-home-cases/);
  assert.match(homeSource, /preview-home-empty/);
  assert.match(homeSource, /href=\{`\/services\/\$\{/);
  assert.match(homeSource, /href="#preview-home-equipment"/);
  assert.equal(homeSource.includes("/admin/login"), false);
});

test("services and cases indexes declare detail-entry and next-step contracts", () => {
  const servicesIndex = readSource("../app/services/page.js");
  const casesIndex = readSource("../app/cases/page.js");

  assert.match(servicesIndex, /itemHrefPrefix="\/services"/);
  assert.match(servicesIndex, /getPublishedCases/);
  assert.match(servicesIndex, /showCasesNav=\{hasPublishedCases\}/);
  assert.match(servicesIndex, /nextStepTitle=/);
  assert.match(servicesIndex, /nextStepPrimaryHref="\/contacts"/);
  assert.match(servicesIndex, /nextStepSecondaryHref=\{hasPublishedCases \? "\/cases" : ""\}/);

  assert.match(casesIndex, /itemHrefPrefix="\/cases"/);
  assert.match(casesIndex, /showCasesNav/);
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
