import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("home route is the canonical content-managed Home page", () => {
  const homeSource = readSource("../app/page.js");

  assert.match(homeSource, /getPublishedHomePage/);
  assert.match(homeSource, /getPlaceholderHomePage/);
  assert.match(homeSource, /StandalonePage/);
  assert.match(homeSource, /notFound\(\);/);
  assert.match(homeSource, /hasPublishedCases/);
  assert.match(homeSource, /showCasesNav=\{hasPublishedCases\}/);
  assert.doesNotMatch(homeSource, /PRIMARY_SERVICE_SLUG/);
  assert.doesNotMatch(homeSource, /getPublishedServiceBySlug/);
  assert.doesNotMatch(homeSource, /buildEquipmentCardsSectionModel/);
  assert.doesNotMatch(homeSource, /EquipmentCardsSection/);
  assert.doesNotMatch(homeSource, /themeGraphiteIndustrial/);
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

test("public route shells keep the launch theme when a route has no pageThemeKey", () => {
  const rendererSource = readSource("../components/public/PublicRenderers.js");

  assert.match(rendererSource, /DEFAULT_PUBLIC_SITE_THEME_KEY = "graphite_industrial"/);
  assert.match(rendererSource, /themeClassName = DEFAULT_PUBLIC_SITE_THEME_CLASS_NAME/);
  assert.match(rendererSource, /resolvedThemeClassName = themeClassName \|\| DEFAULT_PUBLIC_SITE_THEME_CLASS_NAME/);
  assert.match(rendererSource, /className=\{\[styles\.publicShell, resolvedThemeClassName\]\.filter\(Boolean\)\.join\(" "\)\}/);
});
