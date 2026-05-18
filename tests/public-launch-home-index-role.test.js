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
  assert.match(homeSource, /resolveMedia=/);
  assert.match(homeSource, /galleries=/);
  assert.doesNotMatch(homeSource, /PRIMARY_SERVICE_SLUG/);
  assert.doesNotMatch(homeSource, /getPublishedServiceBySlug/);
  assert.doesNotMatch(homeSource, /buildEquipmentCardsSectionModel/);
  assert.doesNotMatch(homeSource, /EquipmentCardsSection/);
  assert.doesNotMatch(homeSource, /themeGraphiteIndustrial/);
  assert.equal(homeSource.includes("/admin/login"), false);
});

test("services index stays a neutral system collection and cases keeps next-step contract", () => {
  const servicesIndex = readSource("../app/services/page.js");
  const casesIndex = readSource("../app/cases/page.js");

  assert.match(servicesIndex, /itemHrefPrefix="\/services"/);
  assert.match(servicesIndex, /buildPublishedLookups/);
  assert.match(servicesIndex, /showCasesNav=\{hasPublishedCases\}/);
  assert.match(servicesIndex, /showIntroHero=\{false\}/);
  assert.match(servicesIndex, /resolveMedia=/);
  assert.match(servicesIndex, /resolveGallery=/);
  assert.match(servicesIndex, /resolveEquipment=/);
  assert.match(servicesIndex, /resolveCase=/);
  assert.doesNotMatch(servicesIndex, /nextStepTitle=/);
  assert.doesNotMatch(servicesIndex, /nextStepPrimaryHref=/);
  assert.doesNotMatch(servicesIndex, /emptyActionHref=/);
  assert.doesNotMatch(servicesIndex, /emptyActionLabel=/);

  assert.match(casesIndex, /itemHrefPrefix="\/cases"/);
  assert.match(casesIndex, /showCasesNav/);
  assert.match(casesIndex, /showIntroHero=\{false\}/);
  assert.match(casesIndex, /nextStepTitle=/);
  assert.match(casesIndex, /nextStepPrimaryHref="\/services"/);
});

test("public list renderer supports empty-state and next-step sections", () => {
  const rendererSource = readSource("../components/public/PublicRenderers.js");

  assert.match(rendererSource, /emptyTitle/);
  assert.match(rendererSource, /showIntroHero = true/);
  assert.match(rendererSource, /showIntroHero \? \(/);
  assert.match(rendererSource, /className=\{styles\.visuallyHidden\}/);
  assert.match(rendererSource, /buildListCardMediaAssets/);
  assert.match(rendererSource, /ListCardMediaStrip/);
  assert.match(rendererSource, /PublicEntityListCard/);
  assert.match(rendererSource, /listCardPrimaryLink/);
  assert.match(rendererSource, /analyticsSection="page-services"/);
  assert.match(rendererSource, /headingLevel=\{3\}/);
  assert.match(rendererSource, /resolveGallery: galleries/);
  assert.match(rendererSource, /resolveEquipment: equipment/);
  assert.match(rendererSource, /resolveCase: cases/);
  assert.match(rendererSource, /const proofMediaAssets = buildListCardMediaAssets/);
  assert.match(rendererSource, /<ListCardMediaStrip assets=\{proofMediaAssets\}/);
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

test("home hero does not auto-duplicate the brand eyebrow", () => {
  const rendererSource = readSource("../components/public/PublicRenderers.js");

  assert.match(rendererSource, /getStandalonePageHeroEyebrow/);
  assert.match(rendererSource, /page\.pageType === PAGE_TYPES\.HOME/);
  assert.match(rendererSource, /return heroSection\?\.title \|\| ""/);
  assert.match(rendererSource, /heroEyebrow \? <p className=\{styles\.eyebrow\}>\{heroEyebrow\}<\/p> : null/);
  assert.doesNotMatch(rendererSource, /PAGE_TYPES\.HOME[\s\S]{0,120}globalSettings\?\.publicBrandName/);
});
