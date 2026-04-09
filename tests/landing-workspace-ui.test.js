import test from "node:test";
import assert from "node:assert/strict";

import {
  assignHeroMedia,
  buildMaterialFamilySummary,
  buildStageABlockCapabilities,
  createWorkspaceDraftState,
  getMaterialUsageState,
  moveProofMaterial,
  removeMaterialFromPage,
  toggleProofMaterial,
  updateBlockCopy,
  updatePageThemeKey,
  updateStageABlockField
} from "../lib/admin/landing-workspace-ui.js";

function makeDraft(overrides = {}) {
  return createWorkspaceDraftState({
    compositionFamily: "landing",
    pageType: "about",
    pageThemeKey: "earth_sand",
    slug: "about",
    title: "About",
    hero: {
      headline: "About hero",
      body: "Hero body",
      mediaAssetId: "media_hero",
      textEmphasisPreset: "standard",
      surfaceTone: "plain"
    },
    mediaAssetIds: ["media_strip_1", "media_strip_2"],
    serviceCardIds: ["service_1", "service_2"],
    caseCardIds: ["case_1"],
    contentBand: {
      subtitle: "Why us",
      body: "Content band body",
      textEmphasisPreset: "standard",
      surfaceTone: "plain"
    },
    ctaVariant: "contact",
    ctaBand: {
      title: "Leave a request",
      body: "CTA body",
      note: "CTA note",
      textEmphasisPreset: "standard",
      surfaceTone: "plain"
    },
    ...overrides
  });
}

test("material usage state distinguishes hero media from proof-strip media", () => {
  const draft = makeDraft();

  assert.deepEqual(getMaterialUsageState(draft, "media", "media_hero"), {
    status: "primary",
    isUsed: true,
    isPrimary: true,
    inProofList: false
  });
  assert.deepEqual(getMaterialUsageState(draft, "media", "media_strip_1"), {
    status: "added",
    isUsed: true,
    isPrimary: false,
    inProofList: true
  });
  assert.deepEqual(getMaterialUsageState(draft, "service", "service_2"), {
    status: "added",
    isUsed: true,
    isPrimary: false,
    inProofList: true
  });
});

test("toggleProofMaterial and moveProofMaterial preserve bounded ordering semantics", () => {
  const draft = makeDraft();
  const added = toggleProofMaterial(draft, "case", "case_2");
  const moved = moveProofMaterial(added, "service", "service_2", "up");

  assert.deepEqual(added.caseCardIds, ["case_1", "case_2"]);
  assert.deepEqual(moved.serviceCardIds, ["service_2", "service_1"]);
});

test("assignHeroMedia removes the media from the proof strip to avoid duplicate placement", () => {
  const draft = makeDraft();
  const nextDraft = assignHeroMedia(draft, "media_strip_2");

  assert.equal(nextDraft.hero.mediaAssetId, "media_strip_2");
  assert.deepEqual(nextDraft.mediaAssetIds, ["media_strip_1"]);
});

test("removeMaterialFromPage clears hero usage and proof usage without leaking unsupported state", () => {
  const draft = makeDraft();
  const withoutHero = removeMaterialFromPage(draft, "media", "media_hero");
  const withoutService = removeMaterialFromPage(draft, "service", "service_1");

  assert.equal(withoutHero.hero.mediaAssetId, "");
  assert.deepEqual(withoutHero.mediaAssetIds, ["media_strip_1", "media_strip_2"]);
  assert.deepEqual(withoutService.serviceCardIds, ["service_2"]);
});

test("Stage A field helpers stay narrow and semantic", () => {
  const draft = makeDraft();
  const nextTheme = updatePageThemeKey(draft, "forest_contrast");
  const strongerHero = updateStageABlockField(nextTheme, "landing_hero", "textEmphasisPreset", "strong");
  const tintedContent = updateStageABlockField(strongerHero, "content_band", "surfaceTone", "tinted");
  const ignoredProofBlock = updateStageABlockField(tintedContent, "media_strip", "surfaceTone", "emphasis");

  assert.equal(ignoredProofBlock.pageThemeKey, "forest_contrast");
  assert.equal(ignoredProofBlock.hero.textEmphasisPreset, "strong");
  assert.equal(ignoredProofBlock.contentBand.surfaceTone, "tinted");
  assert.equal(ignoredProofBlock.mediaAssetIds.length, 2);
  assert.deepEqual(buildStageABlockCapabilities("cta_band"), {
    allowsStageAControls: true,
    allowsTextEmphasisPreset: true,
    allowsSurfaceTone: true
  });
  assert.deepEqual(buildStageABlockCapabilities("service_cards"), {
    allowsStageAControls: false,
    allowsTextEmphasisPreset: false,
    allowsSurfaceTone: false
  });
});

test("updateBlockCopy keeps connective copy page-scoped instead of inventing reusable truth", () => {
  const draft = makeDraft();
  const nextDraft = updateBlockCopy(draft, "cta_band", {
    title: "Discuss the project",
    body: "We will help you choose a solution.",
    note: "Response within one business day.",
    ctaVariant: "callback"
  });

  assert.equal(nextDraft.ctaBand.title, "Discuss the project");
  assert.equal(nextDraft.ctaBand.body, "We will help you choose a solution.");
  assert.equal(nextDraft.ctaBand.note, "Response within one business day.");
  assert.equal(nextDraft.ctaVariant, "callback");
});

test("buildMaterialFamilySummary exposes used-state without turning the library into a recommendation engine", () => {
  const draft = makeDraft();
  const summary = buildMaterialFamilySummary(draft, "media", [
    { id: "media_hero", title: "Hero media" },
    { id: "media_free", title: "Free media" }
  ]);

  assert.equal(summary[0].usage.status, "primary");
  assert.equal(summary[1].usage.status, "available");
});
